import { useState, useEffect, useMemo } from "react";
import {
  Users, MapPin, Camera, ShoppingCart, Mic, RefreshCw,
  CheckCircle2, Clock, AlertCircle, TrendingUp, ChevronDown,
  ChevronUp, ExternalLink, LogIn, LogOut, Calendar
} from "lucide-react";

/* ─── CONSTANTES ─── */
const CLAVE = "nanolife2026"; // Clave de acceso admin

const PRODUCTOS = {
  p1: "Limpiapisos Summer",
  p2: "Limpiapisos Lavanda",
  p3: "Detergente 10x Regular",
  p4: "Detergente 10x Hipoalergénico",
  p5: "Detergente 25x Regular",
};

const fmtCLP = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(Math.round(n||0));
const fmtFecha = f => f ? new Date(f+"T12:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"}) : "—";

/* ─── CSS ─── */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#F0F4F3;font-family:system-ui,sans-serif;color:#0B2A2D;min-height:100vh}
.app{max-width:1200px;margin:0 auto;padding:16px}
.topbar{background:#0E6F76;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.topbar h1{color:#fff;font-size:18px;font-weight:700}
.topbar .sub{color:rgba(255,255,255,.7);font-size:12px;margin-top:2px}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px}
.badge-ok{background:#DCFCE7;color:#15803D}
.badge-warn{background:#FEF3E2;color:#B45309}
.badge-off{background:#F1F5F9;color:#64748B}
.badge-blue{background:#EFF6FF;color:#1D4ED8}
.card{background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden}
.card-header{padding:14px 16px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;cursor:pointer}
.card-header h3{font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px}
.card-body{padding:14px 16px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:16px 0}
.stat{background:#fff;border-radius:14px;border:1px solid #E2E8F0;padding:14px}
.stat .lbl{font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.stat .val{font-size:26px;font-weight:700;color:#0E6F76}
.stat .sub{font-size:12px;color:#94A3B8;margin-top:2px}
.promotor-row{border-bottom:1px solid #F1F5F9;padding:12px 16px}
.promotor-row:last-child{border-bottom:none}
.av{width:38px;height:38px;border-radius:50%;background:#E4F4F1;color:#0E6F76;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
.table{width:100%;border-collapse:collapse;font-size:13px}
.table th{background:#F8FAFC;padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #E2E8F0}
.table td{padding:10px 12px;border-bottom:1px solid #F1F5F9;vertical-align:middle}
.table tr:last-child td{border-bottom:none}
.table tr:hover td{background:#F8FAFC}
.foto-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;padding:12px}
.foto{aspect-ratio:1;border-radius:10px;overflow:hidden;background:#F1F5F9;position:relative}
.foto img{width:100%;height:100%;object-fit:cover}
.foto .tag{position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,.7);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px}
.gps-link{display:inline-flex;align-items:center;gap:4px;color:#0E6F76;font-size:12px;text-decoration:none}
.gps-link:hover{text-decoration:underline}
.login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0A4C52,#0E6F76)}
.login-card{background:#fff;border-radius:20px;padding:36px 32px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.inp{width:100%;border:1.5px solid #E2E8F0;border-radius:12px;padding:12px 14px;font-size:15px;outline:none;font-family:system-ui}
.inp:focus{border-color:#0E6F76}
.btn{width:100%;background:#0E6F76;color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.btn:hover{background:#0A4C52}
.btn-out{background:transparent;border:1.5px solid #E2E8F0;color:#64748B;border-radius:10px;padding:7px 14px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px}
.btn-out:hover{background:#F8FAFC}
.section-title{font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;margin:20px 0 10px}
.empty{text-align:center;padding:32px;color:#94A3B8;font-size:14px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.fecha-sel{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.fecha-btn{padding:6px 14px;border-radius:99px;border:1px solid #E2E8F0;background:#fff;font-size:13px;cursor:pointer;font-family:system-ui}
.fecha-btn.on{background:#0E6F76;color:#fff;border-color:#0E6F76;font-weight:600}
.updated{font-size:11px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:4px}
`;

/* ─── APP ─── */
export default function App() {
  const [auth, setAuth] = useState(()=>sessionStorage.getItem("nl_admin")==="1");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  if (!auth) return (
    <div className="login">
      <style>{CSS}</style>
      <div className="login-card">
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:32,marginBottom:8}}>🛡️</div>
          <div style={{fontWeight:700,fontSize:20,color:"#0B2A2D"}}>Nanolife Admin</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>Panel de supervisión · Campaña Lider 2026</div>
        </div>
        <input className="inp" type="password" placeholder="Clave de acceso" value={clave}
          onChange={e=>{setClave(e.target.value);setError("");}}
          onKeyDown={e=>{if(e.key==="Enter"){if(clave===CLAVE){sessionStorage.setItem("nl_admin","1");setAuth(true);}else setError("Clave incorrecta");}}}
          style={{marginBottom:error?8:16}}/>
        {error && <div style={{color:"#DC2626",fontSize:13,marginBottom:12}}>{error}</div>}
        <button className="btn" onClick={()=>{
          if(clave===CLAVE){sessionStorage.setItem("nl_admin","1");setAuth(true);}
          else setError("Clave incorrecta");
        }}>Ingresar</button>
      </div>
    </div>
  );

  return (
    <div>
      <style>{CSS}</style>
      <Dashboard onLogout={()=>{sessionStorage.removeItem("nl_admin");setAuth(false);}}/>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [fechaSel, setFechaSel] = useState("hoy");

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/.netlify/functions/sheet-data?t=" + Date.now());
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Error ${r.status}: ${txt}`);
      }
      const d = await r.json();
      setData(d);
      setUpdatedAt(new Date(d.updatedAt));
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ fetchData(); }, []);

  // Fechas únicas disponibles en los datos
  const fechasDisponibles = useMemo(()=>{
    if (!data) return [];
    const todas = new Set([
      ...data.marcaciones.map(r=>r["Fecha"]),
      ...data.ventas.map(r=>r["Fecha"]),
    ]);
    return [...todas].filter(Boolean).sort().reverse();
  }, [data]);

  const hoyISO = new Date().toISOString().slice(0,10);

  // Determinar fechas a mostrar
  const fechasFiltradas = useMemo(()=>{
    if (!fechasDisponibles.length) return [];
    if (fechaSel==="hoy") return fechasDisponibles.filter(f=>f===hoyISO);
    if (fechaSel==="semana") {
      const hace7 = new Date(); hace7.setDate(hace7.getDate()-7);
      return fechasDisponibles.filter(f=>f>=hace7.toISOString().slice(0,10));
    }
    return fechasDisponibles; // todo
  }, [fechaSel, fechasDisponibles, hoyISO]);

  // Datos filtrados por fechas seleccionadas
  const marc = useMemo(()=>data?.marcaciones.filter(r=>fechasFiltradas.includes(r["Fecha"]))||[], [data, fechasFiltradas]);
  const vent = useMemo(()=>data?.ventas.filter(r=>fechasFiltradas.includes(r["Fecha"]))||[], [data, fechasFiltradas]);
  const cierres = useMemo(()=>data?.cierres.filter(r=>fechasFiltradas.includes(r["Fecha"]))||[], [data, fechasFiltradas]);

  // KPIs globales
  const promotoresActivos = useMemo(()=>[...new Set(marc.map(r=>r["Promotor"]))], [marc]);
  const totalUnidades = useMemo(()=>vent.reduce((s,r)=>s+parseInt(r["Unidades"]||0),0), [vent]);
  const totalComision = useMemo(()=>vent.reduce((s,r)=>s+parseInt(r["Comisión total"]||0),0), [vent]);
  const jornadasCompletas = useMemo(()=>{
    const dias = {};
    marc.forEach(r=>{
      const k = `${r["Promotor"]}__${r["Fecha"]}`;
      if (!dias[k]) dias[k]={am_e:0,am_s:0,pm_e:0,pm_s:0};
      if(r["Turno"]==="AM"&&r["Tipo"]==="Entrada") dias[k].am_e=1;
      if(r["Turno"]==="AM"&&r["Tipo"]==="Salida")  dias[k].am_s=1;
      if(r["Turno"]==="PM"&&r["Tipo"]==="Entrada") dias[k].pm_e=1;
      if(r["Turno"]==="PM"&&r["Tipo"]==="Salida")  dias[k].pm_s=1;
    });
    return Object.values(dias).filter(d=>d.am_e&&d.am_s&&d.pm_e&&d.pm_s).length;
  }, [marc]);

  // Agrupar por promotor
  const porPromotor = useMemo(()=>{
    const m = {};
    marc.forEach(r=>{
      const p = r["Promotor"];
      if (!m[p]) m[p]={nombre:p,sala:r["Sala"],ciudad:r["Ciudad"],marcaciones:[],ventas:[],cierres:[]};
      m[p].marcaciones.push(r);
    });
    vent.forEach(r=>{ if(m[r["Promotor"]]) m[r["Promotor"]].ventas.push(r); });
    cierres.forEach(r=>{ if(m[r["Promotor"]]) m[r["Promotor"]].cierres.push(r); });
    return Object.values(m).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  }, [marc, vent, cierres]);

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div>
          <h1>🛡️ Nanolife Admin</h1>
          <div className="sub">Panel de supervisión · Campaña Lider 2026</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {updatedAt && (
            <div className="updated">
              <RefreshCw size={11}/>
              Actualizado {updatedAt.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}
            </div>
          )}
          <button className="btn-out" style={{color:"rgba(255,255,255,.8)",borderColor:"rgba(255,255,255,.3)"}}
            onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} className={loading?"spin":""}/>
            {loading?"...":"Actualizar"}
          </button>
          <button className="btn-out" style={{color:"rgba(255,255,255,.8)",borderColor:"rgba(255,255,255,.3)"}}
            onClick={onLogout}>
            <LogOut size={14}/> Salir
          </button>
        </div>
      </div>

      <div className="app">

        {loading && !data && (
          <div className="empty" style={{marginTop:60}}>
            <RefreshCw size={32} className="spin" style={{color:"#0E6F76",marginBottom:12}}/>
            <div>Cargando datos desde Google Sheets…</div>
          </div>
        )}

        {error && (
          <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:12,padding:"14px 16px",marginTop:20,color:"#DC2626",display:"flex",gap:8}}>
            <AlertCircle size={18}/> Error al cargar datos: {error}
          </div>
        )}

        {data && (
          <>
            {/* FILTRO DE FECHA */}
            <div style={{marginTop:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,color:"#64748B",fontSize:13}}>
                <Calendar size={15}/> Período:
              </div>
              <div className="fecha-sel" style={{marginBottom:0}}>
                {[["hoy","Hoy"],["semana","Últimos 7 días"],["todo","Todo"]].map(([v,l])=>(
                  <button key={v} className={`fecha-btn ${fechaSel===v?"on":""}`} onClick={()=>setFechaSel(v)}>{l}</button>
                ))}
              </div>
              <div style={{fontSize:12,color:"#94A3B8"}}>
                {fechasFiltradas.length} día(s) · {marc.length} marcaciones
              </div>
            </div>

            {/* KPIs */}
            <div className="stat-grid">
              <div className="stat">
                <div className="lbl"><Users size={12} style={{display:"inline",marginRight:4}}/>Promotores activos</div>
                <div className="val">{promotoresActivos.length}</div>
                <div className="sub">en el período</div>
              </div>
              <div className="stat">
                <div className="lbl"><CheckCircle2 size={12} style={{display:"inline",marginRight:4}}/>Jornadas completas</div>
                <div className="val">{jornadasCompletas}</div>
                <div className="sub">AM + PM marcados</div>
              </div>
              <div className="stat">
                <div className="lbl"><ShoppingCart size={12} style={{display:"inline",marginRight:4}}/>Unidades vendidas</div>
                <div className="val">{totalUnidades}</div>
                <div className="sub">en el período</div>
              </div>
              <div className="stat">
                <div className="lbl"><TrendingUp size={12} style={{display:"inline",marginRight:4}}/>Comisión total</div>
                <div className="val" style={{fontSize:18}}>{fmtCLP(totalComision)}</div>
                <div className="sub">por ventas</div>
              </div>
            </div>

            {/* TABLA RESUMEN POR PROMOTOR */}
            <div className="section-title">Resumen por promotor</div>
            {porPromotor.length === 0 ? (
              <div className="empty">Sin datos para el período seleccionado</div>
            ) : (
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Promotor</th>
                      <th>Sala</th>
                      <th>AM</th>
                      <th>PM</th>
                      <th>Unidades</th>
                      <th>Comisión</th>
                      <th>Audio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porPromotor.map(p=>{
                      const amE = p.marcaciones.some(m=>m["Turno"]==="AM"&&m["Tipo"]==="Entrada");
                      const amS = p.marcaciones.some(m=>m["Turno"]==="AM"&&m["Tipo"]==="Salida");
                      const pmE = p.marcaciones.some(m=>m["Turno"]==="PM"&&m["Tipo"]==="Entrada");
                      const pmS = p.marcaciones.some(m=>m["Turno"]==="PM"&&m["Tipo"]==="Salida");
                      const unds = p.ventas.reduce((s,v)=>s+parseInt(v["Unidades"]||0),0);
                      const com = p.ventas.reduce((s,v)=>s+parseInt(v["Comisión total"]||0),0);
                      const tieneAudio = p.cierres.some(c=>c["Audio URL"]);
                      return (
                        <tr key={p.nombre}>
                          <td>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div className="av">{p.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                              <div>
                                <div style={{fontWeight:600,fontSize:13}}>{p.nombre}</div>
                                <div style={{fontSize:11,color:"#94A3B8"}}>{p.ciudad}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{fontSize:12,color:"#64748B"}}>{p.sala?.replace("Hiper Lider - ","")}</td>
                          <td>
                            <div style={{display:"flex",gap:4}}>
                              <span className={`badge ${amE?"badge-ok":"badge-off"}`}>{amE?"E✓":"E—"}</span>
                              <span className={`badge ${amS?"badge-ok":"badge-off"}`}>{amS?"S✓":"S—"}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{display:"flex",gap:4}}>
                              <span className={`badge ${pmE?"badge-ok":"badge-off"}`}>{pmE?"E✓":"E—"}</span>
                              <span className={`badge ${pmS?"badge-ok":"badge-off"}`}>{pmS?"S✓":"S—"}</span>
                            </div>
                          </td>
                          <td style={{fontWeight:700,color:"#0E6F76"}}>{unds || "—"}</td>
                          <td style={{fontWeight:600}}>{com>0?fmtCLP(com):"—"}</td>
                          <td>{tieneAudio ? <span className="badge badge-ok"><Mic size={10}/> Sí</span> : <span className="badge badge-off">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* DETALLE POR PROMOTOR */}
            <div className="section-title">Detalle por promotor</div>
            {porPromotor.map(p=>(
              <PromoterCard key={p.nombre} promotor={p}/>
            ))}

            {/* TODAS LAS MARCACIONES */}
            <div className="section-title">Registro completo de marcaciones</div>
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Promotor</th>
                    <th>Sala</th>
                    <th>Turno</th>
                    <th>Tipo</th>
                    <th>Hora</th>
                    <th>Ubicación</th>
                    <th>Precisión</th>
                  </tr>
                </thead>
                <tbody>
                  {marc.length===0 ? (
                    <tr><td colSpan={8} style={{textAlign:"center",color:"#94A3B8",padding:20}}>Sin marcaciones en el período</td></tr>
                  ) : marc.map((m,i)=>(
                    <tr key={i}>
                      <td style={{fontSize:12}}>{fmtFecha(m["Fecha"])}</td>
                      <td style={{fontWeight:600,fontSize:13}}>{m["Promotor"]}</td>
                      <td style={{fontSize:12,color:"#64748B"}}>{m["Sala"]?.replace("Hiper Lider - ","")}</td>
                      <td><span className={`badge ${m["Turno"]==="AM"?"badge-blue":"badge-warn"}`}>{m["Turno"]}</span></td>
                      <td><span className={`badge ${m["Tipo"]==="Entrada"?"badge-ok":"badge-off"}`}>{m["Tipo"]}</span></td>
                      <td style={{fontFamily:"monospace",fontSize:13}}>{m["Hora"]}</td>
                      <td>
                        {m["Latitud"] && m["Longitud"] ? (
                          <a className="gps-link" href={`https://maps.google.com/?q=${m["Latitud"]},${m["Longitud"]}`} target="_blank" rel="noreferrer">
                            <MapPin size={12}/> {parseFloat(m["Latitud"]).toFixed(4)}, {parseFloat(m["Longitud"]).toFixed(4)}
                            <ExternalLink size={10}/>
                          </a>
                        ) : <span style={{color:"#94A3B8",fontSize:12}}>Sin GPS</span>}
                      </td>
                      <td style={{fontSize:12,color:"#94A3B8"}}>{m["Precisión (m)"]?`±${m["Precisión (m)"]}m`:"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>
    </>
  );
}

/* ─── TARJETA DETALLE PROMOTOR ─── */
function PromoterCard({ promotor: p }) {
  const [open, setOpen] = useState(false);

  const unds = p.ventas.reduce((s,v)=>s+parseInt(v["Unidades"]||0),0);
  const com = p.ventas.reduce((s,v)=>s+parseInt(v["Comisión total"]||0),0);
  const tieneAudio = p.cierres.find(c=>c["Audio URL"]);

  // Agrupar ventas por producto
  const ventasPorProd = {};
  p.ventas.forEach(v=>{
    const prod = v["Producto"];
    if(!ventasPorProd[prod]) ventasPorProd[prod]={unidades:0,comision:0};
    ventasPorProd[prod].unidades += parseInt(v["Unidades"]||0);
    ventasPorProd[prod].comision += parseInt(v["Comisión total"]||0);
  });

  // Marcaciones ordenadas
  const marcOrden = [...p.marcaciones].sort((a,b)=>{
    const t = (a["Turno"]||"").localeCompare(b["Turno"]||"");
    if(t!==0) return t;
    return (a["Tipo"]||"").localeCompare(b["Tipo"]||"");
  });

  return (
    <div className="card" style={{marginBottom:12}}>
      <div className="card-header" onClick={()=>setOpen(!open)}>
        <h3>
          <div className="av">{p.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
          <div>
            <div>{p.nombre}</div>
            <div style={{fontWeight:400,fontSize:12,color:"#64748B"}}>{p.sala?.replace("Hiper Lider - ","")} · {p.ciudad}</div>
          </div>
        </h3>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {unds>0 && <span className="badge badge-ok"><ShoppingCart size={11}/> {unds}u · {fmtCLP(com)}</span>}
          {tieneAudio && <span className="badge badge-ok"><Mic size={11}/> Audio</span>}
          {open ? <ChevronUp size={18} color="#94A3B8"/> : <ChevronDown size={18} color="#94A3B8"/>}
        </div>
      </div>

      {open && (
        <div className="card-body">

          {/* Marcaciones */}
          <div style={{fontSize:12,fontWeight:700,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Marcaciones</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
            {marcOrden.map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#F8FAFC",borderRadius:10}}>
                {m["Tipo"]==="Entrada" ? <LogIn size={15} color="#0E6F76"/> : <LogOut size={15} color="#DC2626"/>}
                <span className={`badge ${m["Turno"]==="AM"?"badge-blue":"badge-warn"}`} style={{fontSize:11}}>{m["Turno"]}</span>
                <span style={{fontWeight:600,fontSize:13}}>{m["Tipo"]}</span>
                <span style={{fontFamily:"monospace",fontSize:13,color:"#64748B"}}>{m["Hora"]} hrs</span>
                {m["Latitud"] ? (
                  <a className="gps-link" href={`https://maps.google.com/?q=${m["Latitud"]},${m["Longitud"]}`} target="_blank" rel="noreferrer">
                    <MapPin size={11}/> Ver en mapa <ExternalLink size={10}/>
                  </a>
                ) : <span style={{fontSize:11,color:"#94A3B8"}}>Sin GPS</span>}
              </div>
            ))}
          </div>

          {/* Ventas */}
          {Object.keys(ventasPorProd).length>0 && (
            <>
              <div style={{fontSize:12,fontWeight:700,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Ventas</div>
              <table className="table" style={{marginBottom:16}}>
                <thead><tr><th>Producto</th><th>Unidades</th><th>Comisión</th></tr></thead>
                <tbody>
                  {Object.entries(ventasPorProd).map(([prod,v])=>(
                    <tr key={prod}>
                      <td style={{fontSize:13}}>{prod}</td>
                      <td style={{fontWeight:700,color:"#0E6F76"}}>{v.unidades}</td>
                      <td style={{fontWeight:600}}>{fmtCLP(v.comision)}</td>
                    </tr>
                  ))}
                  <tr style={{background:"#F0FDF4"}}>
                    <td style={{fontWeight:700}}>Total</td>
                    <td style={{fontWeight:700,color:"#0E6F76"}}>{unds}</td>
                    <td style={{fontWeight:700,color:"#15803D"}}>{fmtCLP(com)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Audio cierre */}
          {tieneAudio && (
            <>
              <div style={{fontSize:12,fontWeight:700,color:"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Audio de cierre</div>
              <div style={{background:"#F0FDF4",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <Mic size={16} color="#15803D"/>
                <span style={{fontSize:13,fontWeight:600,color:"#15803D"}}>Mensaje de cierre grabado</span>
                <a href={tieneAudio["Audio URL"]} target="_blank" rel="noreferrer"
                  style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,color:"#0E6F76",fontSize:12,textDecoration:"none"}}>
                  Escuchar <ExternalLink size={12}/>
                </a>
              </div>
            </>
          )}

          {unds===0 && !tieneAudio && p.marcaciones.length===0 && (
            <div className="empty">Sin actividad registrada</div>
          )}
        </div>
      )}
    </div>
  );
}
