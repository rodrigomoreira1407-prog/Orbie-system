const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

async function sendVerificationEmail(email, name, token) {
  const url = process.env.FRONTEND_URL + '/verify-email?token=' + token;
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'Orbie <noreply@orbie.com.br>',
    to: email,
    subject: 'Confirme seu cadastro no Orbie',
    html: getVerifyTemplate(name, url),
  });
}

async function sendPasswordResetEmail(email, name, token) {
  const url = process.env.FRONTEND_URL + '/reset-password?token=' + token;
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'Orbie <noreply@orbie.com.br>',
    to: email,
    subject: 'Redefinir senha — Orbie',
    html: getResetTemplate(name, url),
  });
}

async function sendWelcomeEmail(email, name, plan) {
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'Orbie <noreply@orbie.com.br>',
    to: email,
    subject: 'Bem-vindo ao Orbie! Seu plano foi ativado.',
    html: getWelcomeTemplate(name, plan),
  });
}

function getVerifyTemplate(name, url) {
  return '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">' +
    '<div style="background:linear-gradient(135deg,#5b5ef4,#7c3aed);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">' +
    '<span style="font-size:32px">🌀</span><br/>' +
    '<span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-.02em">Orbie</span>' +
    '</div>' +
    '<h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:8px">Ola, ' + name + '!</h2>' +
    '<p style="color:#475569;font-size:15px;line-height:1.7;margin-bottom:24px">Obrigado por criar sua conta no Orbie. Clique no botao abaixo para confirmar seu email e comecar a usar o sistema.</p>' +
    '<a href="' + url + '" style="display:inline-block;background:linear-gradient(135deg,#5b5ef4,#7c3aed);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px">Confirmar email</a>' +
    '<p style="color:#94a3b8;font-size:12px;margin-top:24px">Este link expira em 24 horas. Se nao foi voce, ignore este email.</p>' +
    '</div>';
}

function getResetTemplate(name, url) {
  return '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">' +
    '<div style="background:linear-gradient(135deg,#5b5ef4,#7c3aed);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">' +
    '<span style="font-size:32px">🔒</span><br/>' +
    '<span style="color:#fff;font-size:22px;font-weight:800">Orbie</span>' +
    '</div>' +
    '<h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:8px">Redefinir senha</h2>' +
    '<p style="color:#475569;font-size:15px;line-height:1.7;margin-bottom:24px">Ola ' + name + ', recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo:</p>' +
    '<a href="' + url + '" style="display:inline-block;background:linear-gradient(135deg,#5b5ef4,#7c3aed);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px">Redefinir senha</a>' +
    '<p style="color:#94a3b8;font-size:12px;margin-top:24px">Este link expira em 1 hora. Se nao foi voce, ignore este email.</p>' +
    '</div>';
}

function getWelcomeTemplate(name, plan) {
  const planName = plan === 'PRO' ? 'PRO + IA' : 'Basic';
  return '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">' +
    '<div style="background:linear-gradient(135deg,#5b5ef4,#7c3aed);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">' +
    '<span style="font-size:32px">🎉</span><br/>' +
    '<span style="color:#fff;font-size:22px;font-weight:800">Orbie</span>' +
    '</div>' +
    '<h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:8px">Bem-vindo, ' + name + '!</h2>' +
    '<p style="color:#475569;font-size:15px;line-height:1.7;margin-bottom:24px">Seu plano <strong>' + planName + '</strong> foi ativado com sucesso. Agora voce tem acesso completo ao sistema Orbie.</p>' +
    '<p style="color:#475569;font-size:14px;line-height:1.7">Acesse: <a href="' + process.env.FRONTEND_URL + '" style="color:#5b5ef4">' + process.env.FRONTEND_URL + '</a></p>' +
    '</div>';
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };