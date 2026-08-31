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

/* ─────────── Integración con la BBDD del admin retail (Canal Moderno) ───────────
 * El endpoint devuelve la venta de retail YA normalizada y con las reglas de negocio
 * duras resueltas (bloques de semana, doble fuente Walmart, SKU como string).
 * Aquí solo tomamos Easy/Tottus (Walmart sigue por su feed B2B diario) y aplicamos la
 * regla de atribución: la venta se acredita a un promotor SOLO si el dato es de UN día;
 * si viene agregada en un bloque de varios días, NO se atribuye (se lista como error).
 */
const RETAIL_ENDPOINT_URL = process.env.RETAIL_ENDPOINT_URL ||
  "https://script.google.com/macros/s/AKfycbxXCJUMkVDAqfV0k9CZnadMJRu54yEmEKgHPuVWjXa3fBkSWzOHfOeFVUKeXZSJtoo/exec?action=data";

// Cadenas que tomamos del endpoint. Walmart/Lider NO: ya viene por VentasB2B (diario).
const CADENAS_RETAIL = { EASY: "Easy", TOTTUS: "Tottus" };

// periodo (bloque de la semana) -> offsets de día desde fecha_inicio (lunes = 0).
// Un bloque es "de un día" (atribuible) solo si mapea a exactamente un offset.
const BLOQUE_DIAS = {
  "L":[0], "M":[1], "X":[2], "J":[3], "V":[4], "S":[5], "D":[6],
  "L-J":[0,1,2,3], "V-D":[4,5,6], "L-D":[0,1,2,3,4,5,6],
  "L-V":[0,1,2,3,4], "L-S":[0,1,2,3,4,5],
};

function sumarDias(iso, n) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Transforma las filas del endpoint (ventas_tottus) en:
 *  - diarias: filas atribuibles { Fecha, Sala, Producto, Unidades, _cadena, _sku } (bloque de 1 día)
 *  - noAtribuibles: venta que NO se puede clavar a un día (bloque multi-día o periodo desconocido)
 * Solo considera las cadenas en `cadenas` (default Easy/Tottus) y unidades > 0.
 * Función pura (sin red) — testeable en aislamiento.
 */
export function normalizarVentasRetail(ventas, cadenas = CADENAS_RETAIL) {
  const diarias = [];
  const noAtribuibles = [];
  for (const r of ventas || []) {
    const cadKey = String(r.cadena || "").trim().toUpperCase();
    const cadena = cadenas[cadKey];
    if (!cadena) continue; // cadena fuera de alcance (ej. LIDER)
    const unidades = Number(r.unidades) || 0;
    if (unidades <= 0) continue;
    const periodo = String(r.periodo || "").trim().toUpperCase();
    const dias = BLOQUE_DIAS[periodo];
    if (dias && dias.length === 1 && r.fecha_inicio) {
      diarias.push({
        Fecha: sumarDias(r.fecha_inicio, dias[0]),
        Sala: r.local || "",
        Producto: r.nombre || String(r.sku || ""),
        Unidades: unidades,
        _cadena: cadena,
        _sku: String(r.sku || ""),
      });
    } else {
      noAtribuibles.push({
        cadena, local: r.local || "", sku: String(r.sku || ""), nombre: r.nombre || "",
        anio: r.anio, semana: r.semana, periodo: r.periodo, unidades,
        motivo: dias ? `venta agregada en bloque de ${dias.length} días (${r.periodo}), no diaria`
                     : `periodo no reconocido: "${r.periodo}"`,
      });
    }
  }
  return { diarias, noAtribuibles };
}

async function fetchVentasRetail(url) {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`retail endpoint ${r.status}`);
  const j = await r.json();
  // Si el endpoint devuelve un error (ej. {ok:false,error:"sesion_invalida"}) o no trae el
  // arreglo esperado, lanzamos: así el .catch de arriba deja retailRows=null y se cae al
  // fallback de hojas manuales, en vez de tragarse un [] que bloquea el fallback.
  if (!j || j.ok === false || !Array.isArray(j.ventas_tottus)) {
    throw new Error(`retail endpoint sin datos${j && j.error ? ": " + j.error : ""}`);
  }
  return j.ventas_tottus;
}

/* ─────────── Venta DIARIA de Walmart desde la BBDD Canal Moderno ───────────
 * La venta de Walmart que Elite mostraba salía de la pestaña VentasB2B, que quedó
 * desactualizada. La fuente viva ahora es la pestaña "BBDD DIARIA WALMART" del Sheet del
 * admin retail (una fila por día × local × producto). La leemos con la service account
 * (el Sheet está compartido con ella) y la mapeamos al MISMO shape que VentasB2B, para que
 * el cruce por Store Nbr + cronograma y el cálculo de comisiones sigan funcionando igual.
 */
const RETAIL_SHEET_ID = process.env.GOOGLE_RETAIL_SHEET_ID || "1srESb2rRPL2TN0tcS2MusmXEGmTOENbsURWPHHqEH-8";

export function mapDiariaWalmart(rows) {
  return (rows || []).map(r => {
    // "Código Local" viene como "W78" → el Store Nbr es la parte numérica (78), que calza
    // con salas.codigo. asignarPromotorPorCronograma hace parseInt, así que hay que darle
    // el número limpio, no "W78".
    const storeNbr = String(r["Código Local"] || r["Codigo Local"] || "").replace(/\D/g, "");
    return {
      "Fecha": r["Fecha"] || "",
      "Store Nbr": storeNbr,
      "Store Name": r["Nombre Local"] || "",
      "City": r["Región"] || r["Region"] || "",
      // El "Nombre Producto Cadena" en MAYÚSCULAS calza con COMISION_WALMART_DEFAULT
      // (ej. "deterg podsx10 un" → "DETERG PODSX10 UN").
      "Item Desc 1": (r["Nombre Producto Cadena"] || r["Nombre Producto Proveedor"] || "")
        .toUpperCase().replace(/\s+/g, " ").trim(),
      // Como STRING, igual que VentasB2B: el frontend hace ("POS Sales"||"0").replace(...).
      "POS Qty": String(r["Venta unidades"] ?? r["Venta Unidades"] ?? "").trim() || "0",
      "POS Sales": String(r["Venta pesos"] ?? "").trim() || "0",
    };
  }).filter(r => r["Store Nbr"] && r["Fecha"]);
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

    const [marcRows, ventasRows, cierresRows, fotosRows, audiosRows, b2bRows, salaRows, promRows, comisionesRows, easyRows, tottusRows, retailRows, diariaWalmartRows] = await Promise.all([
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
      // VentasEasy/VentasTottus manuales: quedan como FALLBACK por si el endpoint del
      // admin retail no responde. La fuente preferida es el endpoint (ver abajo).
      readSheet(token, sheetId, "VentasEasy!A:Z").catch(logFallo("VentasEasy")),
      readSheet(token, sheetId, "VentasTottus!A:Z").catch(logFallo("VentasTottus")),
      // Endpoint del admin retail (Canal Moderno): venta ya normalizada de Easy/Tottus/Lider.
      fetchVentasRetail(RETAIL_ENDPOINT_URL).catch(err => { console.error("sheet-data: fallo endpoint retail:", err.message); return null; }),
      // Venta DIARIA de Walmart, directo del Sheet del admin retail (compartido con la SA).
      readSheet(token, RETAIL_SHEET_ID, "'BBDD DIARIA WALMART'!A:T").catch(logFallo("BBDD DIARIA WALMART")),
    ]);

    // Easy/Tottus: preferimos el endpoint. Solo se atribuye venta de UN día; los bloques
    // multi-día no se atribuyen (regla del negocio) y se reportan aparte para mostrarlos
    // como error visible en el panel. Si el endpoint falló (retailRows===null), caemos a
    // las hojas manuales para no quedar ciegos.
    let ventasEasy, ventasTottus, ventasRetailNoAtribuibles = [], retailFuente;
    if (retailRows) {
      const { diarias, noAtribuibles } = normalizarVentasRetail(retailRows);
      ventasEasy    = diarias.filter(r => r._cadena === "Easy");
      ventasTottus  = diarias.filter(r => r._cadena === "Tottus");
      ventasRetailNoAtribuibles = noAtribuibles;
      retailFuente = "endpoint";
    } else {
      ventasEasy   = toObjects(easyRows);
      ventasTottus = toObjects(tottusRows);
      retailFuente = "hojas-manuales (fallback: endpoint no respondió)";
    }

    // Walmart: fuente preferida = venta diaria de la BBDD Canal Moderno (viva). Si esa
    // pestaña no trae nada (no compartida / vacía / error), caemos a la pestaña VentasB2B.
    const diariaWalmart = mapDiariaWalmart(toObjects(diariaWalmartRows));
    const ventasB2B = diariaWalmart.length ? diariaWalmart : toObjects(b2bRows);
    const walmartFuente = diariaWalmart.length ? "BBDD DIARIA WALMART" : "VentasB2B (fallback)";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        marcaciones: toObjects(marcRows),
        ventas: toObjects(ventasRows),
        cierres: toObjects(cierresRows),
        fotos: toObjects(fotosRows),
        audios: toObjects(audiosRows),
        ventasB2B,
        salas: toObjects(salaRows),
        promotores: toObjects(promRows),
        comisiones: toObjects(comisionesRows),
        ventasEasy,
        ventasTottus,
        ventasRetailNoAtribuibles,
        retailFuente,
        walmartFuente,
        updatedAt: new Date().toISOString(),
      }),
    };
  } catch(err) {
    console.error("sheet-data error:", err.message);
    return { statusCode:500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
