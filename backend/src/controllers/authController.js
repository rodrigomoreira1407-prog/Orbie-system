const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const prisma = require('../lib/prisma');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no minimo 6 caracteres' });
    }
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: 'Este email ja esta cadastrado' });
    }
    const hashed = await bcrypt.hash(password, 12);
    const verifyToken = uuid();
    const trialDays = parseInt(process.env.TRIAL_PERIOD_DAYS || '14', 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        emailVerifyToken: null,
        emailVerified: true,
        plan: 'BASIC',
        planExpiresAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
      },
    });
    // O envio de email foi desativado temporariamente para facilitar o onboarding
    /*
    try {
      await sendVerificationEmail(user.email, user.name, verifyToken);
    } catch (emailErr) {
      console.error('Erro ao enviar email:', emailErr.message);
    }
    */
    res.status(201).json({
      message: `Conta criada com sucesso! Você já pode fazer login. Seu período de teste gratuito de ${trialDays} dias está ativo.`,
      userId: user.id,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) {
      return res.status(400).json({ error: 'Token invalido ou expirado' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });
    const jwtToken = generateToken(user.id);
    res.json({ message: 'Email confirmado com sucesso!', token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Email nao confirmado. Verifique sua caixa de entrada.',
        emailNotVerified: true,
      });
    }
    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        plan: user.plan, planExpiresAt: user.planExpiresAt,
        crp: user.crp, phone: user.phone, specialty: user.specialty,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

async function me(req, res) {
  const user = req.user;
  res.json({
    id: user.id, name: user.name, email: user.email,
    plan: user.plan, planExpiresAt: user.planExpiresAt,
    crp: user.crp, phone: user.phone, specialty: user.specialty, bio: user.bio,
  });
}

async function updateProfile(req, res) {
  try {
    const { name, crp, phone, specialty, bio } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, crp, phone, specialty, bio },
    });
    res.json({ message: 'Perfil atualizado!', user: { name: user.name, crp: user.crp, phone: user.phone, specialty: user.specialty, bio: user.bio } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha sao obrigatorias' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Senha atual incorreta' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Nova senha muito curta' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.json({ message: 'Se o email existir, voce receberá instrucoes.' });
    const token = uuid();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });
    await sendPasswordResetEmail(user.email, user.name, token);
    res.json({ message: 'Email de recuperacao enviado!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar email de recuperacao' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });
    if (!user) return res.status(400).json({ error: 'Token invalido ou expirado' });
    if (password.length < 6) return res.status(400).json({ error: 'Senha muito curta' });
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetPasswordToken: null, resetPasswordExpires: null },
    });
    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
}

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.emailVerified) {
      return res.json({ message: 'Se necessario, o email foi reenviado.' });
    }
    const token = uuid();
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: token } });
    await sendVerificationEmail(user.email, user.name, token);
    res.json({ message: 'Email de verificacao reenviado!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reenviar email' });
  }
}

module.exports = { register, verifyEmail, login, me, updateProfile, changePassword, forgotPassword, resetPassword, resendVerification };