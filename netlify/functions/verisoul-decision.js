// Netlify Function: server-side Verisoul Authenticate call
// Set VERISOUL_API_KEY in Netlify environment variables.

const DEFAULT_BASE = 'https://api.prod.verisoul.ai';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body, null, 2)
  };
}

function extract(verisoul) {
  const session = verisoul?.session || {};
  const riskSignals = session?.risk_signals || {};
  const riskScores = session?.risk_signal_scores || {};
  const network = session?.network || {};
  const location = session?.location || {};
  const browser = session?.browser || {};
  const device = session?.device || {};
  const bot = session?.bot || {};
  const account = verisoul?.account || {};

  return {
    decision: verisoul?.decision ?? null,
    account_score: verisoul?.account_score ?? null,
    bot_score: verisoul?.bot ?? null,
    multiple_accounts: verisoul?.multiple_accounts ?? null,
    accounts_linked: verisoul?.accounts_linked ?? null,
    datacenter: riskSignals.datacenter ?? null,
    vpn: riskSignals.vpn ?? null,
    proxy: riskSignals.proxy ?? null,
    tor: riskSignals.tor ?? null,
    spoofed_ip: riskSignals.spoofed_ip ?? null,
    impossible_travel: riskSignals.impossible_travel ?? null,
    device_network_mismatch: riskSignals.device_network_mismatch ?? null,
    location_spoofing: riskSignals.location_spoofing ?? null,
    recent_fraud_ip: riskSignals.recent_fraud_ip ?? null,
    score_datacenter: riskScores.datacenter ?? null,
    score_vpn: riskScores.vpn ?? null,
    score_proxy: riskScores.proxy ?? null,
    score_device_risk: riskScores.device_risk ?? null,
    ip_address: network.ip_address ?? null,
    connection_type: network.connection_type ?? null,
    service_provider: network.service_provider ?? null,
    true_country: session.true_country_code ?? null,
    country: location.country_code ?? null,
    state: location.state ?? null,
    city: location.city ?? null,
    browser_type: browser.type ?? null,
    browser_version: browser.version ?? null,
    os: device.os ?? null,
    device_category: device.category ?? null,
    mouse_events: bot.mouse_num_events ?? null,
    keyboard_events: bot.keyboard_num_events ?? null,
    click_events: bot.click_num_events ?? null,
    num_sessions: account.num_sessions ?? null,
    first_seen: account.first_seen ?? null,
    last_seen: account.last_seen ?? null
  };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed. Use POST.' });

  const apiKey = process.env.VERISOUL_API_KEY;
  const apiBase = (process.env.VERISOUL_API_BASE || DEFAULT_BASE).replace(/\/$/, '');

  if (!apiKey) {
    return json(500, {
      ok: false,
      error: 'Missing VERISOUL_API_KEY environment variable in Netlify.'
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, { ok: false, error: 'Invalid JSON body.' });
  }

  const session_id = body.session_id || body.sessionid;
  const account = body.account || {};

  if (!session_id) return json(400, { ok: false, error: 'Missing session_id.' });
  if (!account.id) return json(400, { ok: false, error: 'Missing account.id.' });

  const verisoulPayload = { session_id, account };

  try {
    const upstream = await fetch(`${apiBase}/session/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(verisoulPayload)
    });

    const text = await upstream.text();
    let verisoul;
    try { verisoul = JSON.parse(text); } catch { verisoul = { raw: text }; }

    return json(upstream.ok ? 200 : upstream.status, {
      ok: upstream.ok,
      status: upstream.status,
      endpoint: `${apiBase}/session/authenticate`,
      verisoul,
      extracted: extract(verisoul)
    });
  } catch (err) {
    return json(502, {
      ok: false,
      error: 'Failed to call Verisoul Authenticate endpoint.',
      detail: String(err && err.message ? err.message : err)
    });
  }
};
