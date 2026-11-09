import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET') return res.status(200).json({clientId:process.env.GOOGLE_CLIENT_ID || '', configured:!!(process.env.GOOGLE_CLIENT_ID && process.env.APPS_SCRIPT_URL && process.env.BACKEND_SECRET)});
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (!process.env.SITE_ORIGIN || req.headers.origin !== process.env.SITE_ORIGIN) return res.status(403).json({error:'Origin not allowed'});
  if (!process.env.APPS_SCRIPT_URL || !process.env.BACKEND_SECRET) return res.status(503).json({error:'Community service is awaiting administrator setup.'});
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || JSON.stringify(body).length > 24000) return res.status(400).json({error:'Invalid or oversized request'});
    let actor = null;
    if (body.action !== 'public') {
      const token = String(req.headers.authorization || '').replace(/^Bearer /, '');
      if (!token) return res.status(401).json({error:'Please sign in.'});
      try {
        const ticket = await client.verifyIdToken({idToken:token,audience:process.env.GOOGLE_CLIENT_ID});
        const p = ticket.getPayload();
        if (!p.email_verified) throw new Error('Unverified email');
        actor = {id:p.sub,email:p.email,name:p.name || ''};
      } catch { return res.status(401).json({error:'Sign-in expired or invalid. Please sign in again.'}); }
    }
    const response = await fetch(process.env.APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:process.env.BACKEND_SECRET,action:body.action,data:body.data || {},actor}),signal:AbortSignal.timeout(25000)});
    if (!response.ok) throw new Error('upstream');
    const result = await response.json();
    return res.status(result.error ? 400 : 200).json(result);
  } catch { return res.status(502).json({error:'The service could not complete this request. Check your dashboard before retrying a submission.'}); }
}
