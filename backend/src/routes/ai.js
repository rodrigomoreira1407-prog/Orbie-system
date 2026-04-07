const express = require('express');
const router = express.Router();
const { auth, requirePlan } = require('../middleware/auth');

router.post('/generate-record', auth, requirePlan(['PRO']), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.length < 15) {
      return res.status(400).json({ error: 'Descreva o conteudo da sessao' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API de IA nao configurada' });
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Voce e um assistente especializado em psicologia clinica. Transforme anotacoes informais de sessoes em prontuarios clinicos estruturados e profissionais em portugues do Brasil. Estruture com: 1. RELATO DA SESSAO  2. INTERVENCOES REALIZADAS  3. EVOLUCAO OBSERVADA  4. ENCAMINHAMENTOS E TAREFAS. Maximo 300 palavras.',
        messages: [{ role: 'user', content: 'Gere um prontuario clinico com base nestas notas: "' + content + '"' }],
      }),
    });
    const data = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      res.json({ text: data.content[0].text });
    } else {
      res.status(500).json({ error: 'Erro na geracao do prontuario' });
    }
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'Erro ao chamar IA' });
  }
});

module.exports = router;