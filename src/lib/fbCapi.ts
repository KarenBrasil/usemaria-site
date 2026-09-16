import crypto from 'crypto';

// API de Conversões da Meta (server-side).
// Envia o mesmo evento que o pixel do navegador dispara, usando o mesmo event_id
// para o Meta deduplicar. Sem o token configurado, faz no-op (o pixel do navegador
// continua funcionando normalmente).

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '907187875503640';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE; // opcional, só para testes

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashEmail(email?: string | null) {
  if (!email) return undefined;
  return sha256(email.trim().toLowerCase());
}

function hashPhone(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  const withCc = digits.startsWith('55') ? digits : `55${digits}`;
  return sha256(withCc);
}

type CapiEvent = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  email?: string | null;
  phone?: string | null;
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  customData?: Record<string, unknown>;
};

export async function sendCapiEvent(evt: CapiEvent) {
  if (!ACCESS_TOKEN) return; // sem token, ignora silenciosamente

  const userData: Record<string, unknown> = {};
  const em = hashEmail(evt.email);
  if (em) userData.em = [em];
  const ph = hashPhone(evt.phone);
  if (ph) userData.ph = [ph];
  if (evt.clientIp) userData.client_ip_address = evt.clientIp;
  if (evt.clientUserAgent) userData.client_user_agent = evt.clientUserAgent;
  if (evt.fbp) userData.fbp = evt.fbp;
  if (evt.fbc) userData.fbc = evt.fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: evt.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: evt.eventId,
        action_source: 'website',
        event_source_url: evt.eventSourceUrl,
        user_data: userData,
        custom_data: evt.customData,
      },
    ],
  };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error('Meta CAPI error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Meta CAPI fetch failed:', err);
  }
}
