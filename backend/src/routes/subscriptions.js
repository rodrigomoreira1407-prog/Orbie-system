const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { sendWelcomeEmail } = require('../services/emailService');

const prisma = new PrismaClient();
let stripe;
try { stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); } catch(e) {}

// Criar checkout
router.post('/checkout', auth, async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe nao configurado' });
    const { plan } = req.body;
    const priceId = plan === 'PRO' ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_BASIC;
    if (!priceId) return res.status(400).json({ error: 'Plano invalido' });
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: req.user.email, name: req.user.name, metadata: { userId: req.user.id } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.FRONTEND_URL + '/payment-success?session={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.FRONTEND_URL + '/plans',
      metadata: { userId: req.user.id, plan },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Erro ao criar checkout' });
  }
});

// Webhook Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) return res.sendStatus(200);
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send('Webhook error: ' + err.message);
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const user = await prisma.user.update({
        where: { id: userId },
        data: { plan, planExpiresAt: expires, stripeSubId: session.subscription },
      });
      try { await sendWelcomeEmail(user.email, user.name, plan); } catch(e) {}
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await prisma.user.updateMany({
        where: { stripeSubId: sub.id },
        data: { plan: 'NONE', planExpiresAt: null, stripeSubId: null },
      });
    }
    if (event.type === 'invoice.payment_succeeded') {
      const inv = event.data.object;
      await prisma.user.updateMany({
        where: { stripeSubId: inv.subscription },
        data: { planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

// Status da assinatura
router.get('/status', auth, async (req, res) => {
  res.json({
    plan: req.user.plan,
    planExpiresAt: req.user.planExpiresAt,
    active: req.user.plan !== 'NONE' && (!req.user.planExpiresAt || new Date(req.user.planExpiresAt) > new Date()),
  });
});

// Portal do cliente
router.post('/portal', auth, async (req, res) => {
  try {
    if (!stripe || !req.user.stripeCustomerId) {
      return res.status(400).json({ error: 'Sem assinatura ativa' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: process.env.FRONTEND_URL + '/settings',
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao abrir portal' });
  }
});

module.exports = router;