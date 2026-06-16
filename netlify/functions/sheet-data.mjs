/**
 * sheet-data — lee Marcaciones, Ventas y Cierres desde Google Sheets.
 * GET /.netlify/functions/sheet-data
 * Cache: 1 hora (3600s)
 *
 * Env vars (mismas que la app de promotores):
 *   GOOGLE_SERVICE_ACCOUNT_KEY
 *   GOOGLE_SHEET_ID
 */

async function getToken(key) {
  const k = JSON.parse(key);
  if (k.private_key?.includes('\\n')) k.private_key = k.private_key.replace(/\\n/g, '\n');
  const b64 = s => btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const header = b64(JSON.stringify({ alg:"RS256", typ:"JWT" }));
  const now = Math.floor(Date.now()/1000);
  const claim = b64(JSON.stringify({
    iss: k.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now+3600, iat: now
  }));
  const msg = `${header}.${claim}`;
  const pem = k.private_key.replace(/-----[^-]+-----/g,'').replace(/\n/g,'');
  const bin = Uint8Array.from(atob(pem), c=>c.charCodeAt(0));
  const ck = await crypto.subtle.importKey("pkcs8", bin.buffer,
    { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", ck, new TextEncoder().encode(msg));
  const jwt = `${msg}.${b64(String.fromCharCode(...new Uint8Array(sig)))}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:`grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("Auth failed: "+JSON.stringify(d));
  return d.access_token;
}

async function readSheet(token, sheetId, range) {
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) throw new Error(`Sheet ${range}: ${r.status}`);
  return (await r.json()).values || [];
}

function toObjects(rows) {
  if (rows.length < 2) return [];
  const h = rows[0].map(x => x.trim());
  return rows.slice(1)
    .filter(r => r.some(c => c?.trim()))
    .map(r => {
      const o = {};
      h.forEach((k, i) => { o[k] = (r[i] || "").trim(); });
      return o;
    });
}

export const handler = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600", // 1 hora
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const token = await getToken(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const [marcRows, ventasRows, cierresRows] = await Promise.all([
      readSheet(token, sheetId, "Marcaciones!A:L"),
      readSheet(token, sheetId, "Ventas!A:J"),
      readSheet(token, sheetId, "Cierres!A:H"),
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        marcaciones: toObjects(marcRows),
        ventas: toObjects(ventasRows),
        cierres: toObjects(cierresRows),
        updatedAt: new Date().toISOString(),
      }),
    };
  } catch(err) {
    console.error("sheet-data error:", err.message);
    return { statusCode:500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
