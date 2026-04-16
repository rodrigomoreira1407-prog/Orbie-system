// Vercel serverless proxy: forwards /api/* requests to the Railway backend.
// Set RAILWAY_BACKEND_URL in Vercel environment variables
// (e.g. https://orbie-backend.up.railway.app)
export default async function handler(req, res) {
  const backendUrl = process.env.RAILWAY_BACKEND_URL;
  if (!backendUrl) {
    return res.status(503).json({
      error: 'Backend não configurado. Defina a variável RAILWAY_BACKEND_URL no Vercel com a URL do seu serviço Railway.',
    });
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path || ''];
  const targetUrl = `${backendUrl.replace(/\/$/, '')}/api/${pathParts.join('/')}`;

  // Forward all headers except hop-by-hop ones and content-length (body gets re-serialized)
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (
      lower !== 'host' &&
      lower !== 'connection' &&
      lower !== 'transfer-encoding' &&
      lower !== 'content-length'
    ) {
      headers[key] = value;
    }
  }

  const fetchOptions = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
    const bodyStr = JSON.stringify(req.body);
    fetchOptions.body = bodyStr;
    headers['content-type'] = 'application/json';
    headers['content-length'] = Buffer.byteLength(bodyStr).toString();
  }

  const upstream = await fetch(targetUrl, fetchOptions);

  const contentType = upstream.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await upstream.json().catch((err) => {
      console.error('Proxy: failed to parse upstream JSON response', err);
      return { error: 'Resposta inválida do servidor backend' };
    });
    return res.status(upstream.status).json(data);
  }

  // Non-JSON upstream response (e.g. plain text or HTML error pages)
  const text = await upstream.text().catch(() => '');
  console.error(`Proxy: upstream returned non-JSON (${upstream.status}):`, text.slice(0, 200));
  res.status(upstream.status).json({ error: text || 'Erro no servidor backend' });
}
