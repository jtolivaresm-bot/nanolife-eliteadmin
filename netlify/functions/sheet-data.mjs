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
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Origin": "*",
  };

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEET_ID) {
    console.error("sheet-data: faltan variables de entorno GOOGLE_SERVICE_ACCOUNT_KEY o GOOGLE_SHEET_ID");
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Configuración del servidor incompleta" }) };
  }

  try {
    const token = await getToken(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const logFallo = range => err => { console.error(`sheet-data: fallo leyendo ${range}:`, err.message); return []; };

    // Salas vive en el sheet de Configuración (mismo que usa la app de promotores), no
    // en el de Ventas/Marcaciones. Trae "codigo" (= Store Nbr del B2B) por sala, para
    // poder cruzar ventas B2B con marcaciones sin depender de un mapeo hardcodeado.
    const configSheetId = process.env.GOOGLE_CONFIG_SHEET_ID;

    const [marcRows, ventasRows, cierresRows, fotosRows, audiosRows, b2bRows, salaRows, promRows, comisionesRows, easyRows, tottusRows] = await Promise.all([
      readSheet(token, sheetId, "Marcaciones!A:L"),
      readSheet(token, sheetId, "Ventas!A:J"),
      readSheet(token, sheetId, "Cierres!A:H"),
      readSheet(token, sheetId, "Fotos!A:E").catch(logFallo("Fotos")),
      readSheet(token, sheetId, "Audios!A:E").catch(logFallo("Audios")),
      readSheet(token, sheetId, "VentasB2B!A:O").catch(logFallo("VentasB2B")),
      configSheetId ? readSheet(token, configSheetId, "Salas!A:Z").catch(logFallo("Salas")) : Promise.resolve([]),
      // Promotores trae las columnas salaId_DDmes (cronograma) y pagoFijo (monto de jornada
      // por promotor, si difiere del default).
      configSheetId ? readSheet(token, configSheetId, "Promotores!A:Z").catch(logFallo("Promotores")) : Promise.resolve([]),
      // Comisiones: tabla Cadena/Producto/Comision -- una fila por producto y cadena, ya
      // que Walmart/Easy/Tottus pueden pagar distinto por el mismo producto.
      configSheetId ? readSheet(token, configSheetId, "Comisiones!A:Z").catch(logFallo("Comisiones")) : Promise.resolve([]),
      // VentasEasy/VentasTottus: carga manual (no hay feed automático como el B2B de
      // Lider). Mismo patrón de columnas que VentasB2B pero simplificado: Fecha/Sala/
      // Producto/Unidades -- se cruza contra marcaciones por nombre de sala, no por
      // Store Nbr (esas cadenas no tienen ese código).
      readSheet(token, sheetId, "VentasEasy!A:Z").catch(logFallo("VentasEasy")),
      readSheet(token, sheetId, "VentasTottus!A:Z").catch(logFallo("VentasTottus")),
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        marcaciones: toObjects(marcRows),
        ventas: toObjects(ventasRows),
        cierres: toObjects(cierresRows),
        fotos: toObjects(fotosRows),
        audios: toObjects(audiosRows),
        ventasB2B: toObjects(b2bRows),
        salas: toObjects(salaRows),
        promotores: toObjects(promRows),
        comisiones: toObjects(comisionesRows),
        ventasEasy: toObjects(easyRows),
        ventasTottus: toObjects(tottusRows),
        updatedAt: new Date().toISOString(),
      }),
    };
  } catch(err) {
    console.error("sheet-data error:", err.message);
    return { statusCode:500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
