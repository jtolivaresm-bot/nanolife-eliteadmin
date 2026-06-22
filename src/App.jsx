import { useState, useEffect, useMemo } from "react";
import {
  Users, MapPin, ShoppingCart, Mic, RefreshCw,
  CheckCircle2, AlertCircle, TrendingUp, ChevronDown,
  ChevronUp, ExternalLink, LogIn, LogOut, Calendar, Package, Store
} from "lucide-react";

const CLAVE = "nanolife2026";
const PAGO_JORNADA = 22000;
const COLORES_PROD = ["#0E6F76","#16A34A","#F5A623","#DC2626","#7C3AED"];
const COLORES_PROM = ["#0E6F76","#16A34A","#F5A623","#DC2626","#7C3AED","#0891B2","#D97706","#059669"];

const fmtCLP = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(Math.round(n||0));
const fmtFecha = f => f ? new Date(f+"T12:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"}) : "—";

function getDriveId(url) {
  if (!url) return null;
  // https://drive.google.com/file/d/FILE_ID/view
  const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  // https://drive.google.com/uc?id=FILE_ID
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

function normCoord(c) {
  if (!c) return null;
  const s = String(c).trim();
  const num = parseFloat(s);
  if (Math.abs(num) >= 1 && Math.abs(num) <= 180) return num;
  const partes = s.split(".");
  if (partes.length > 2) {
    const signo = s.startsWith("-") ? "-" : "";
    const limpio = partes.join("").replace("-","");
    const fixed = signo + limpio.slice(0,2) + "." + limpio.slice(2);
    const n = parseFloat(fixed);
    if (Math.abs(n) >= 1 && Math.abs(n) <= 180) return n;
  }
  return null;
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#F0F4F3;font-family:system-ui,sans-serif;color:#0B2A2D;min-height:100vh}
.app{max-width:1200px;margin:0 auto;padding:16px 16px 40px}
.topbar{background:#0E6F76;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.topbar h1{color:#fff;font-size:18px;font-weight:700}
.topbar .sub{color:rgba(255,255,255,.7);font-size:12px;margin-top:2px}
.card{background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;margin-bottom:12px}
.card-header{padding:14px 16px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none}
.card-header h3{font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;color:#0B2A2D}
.card-body{padding:16px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:16px 0}
.stat{background:#fff;border-radius:14px;border:1px solid #E2E8F0;padding:14px}
.stat .lbl{font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;display:flex;align-items:center;gap:4px}
.stat .val{font-size:24px;font-weight:700;color:#0E6F76;line-height:1.1}
.stat .sub{font-size:12px;color:#94A3B8;margin-top:4px}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:99px}
.badge-ok{background:#DCFCE7;color:#15803D}
.badge-warn{background:#FEF3E2;color:#B45309}
.badge-off{background:#F1F5F9;color:#64748B}
.badge-blue{background:#EFF6FF;color:#1D4ED8}
.table{width:100%;border-collapse:collapse;font-size:13px}
.table th{background:#F8FAFC;padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #E2E8F0;white-space:nowrap}
.table td{padding:10px 12px;border-bottom:1px solid #F1F5F9;vertical-align:middle}
.table tr:last-child td{border-bottom:none}
.table tr:hover td{background:#F8FAFC}
.av{width:36px;height:36px;border-radius:50%;background:#E4F4F1;color:#0E6F76;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
.login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0A4C52,#0E6F76)}
.login-card{background:#fff;border-radius:20px;padding:36px 32px;width:100%;max-width:360px}
.inp{width:100%;border:1.5px solid #E2E8F0;border-radius:12px;padding:12px 14px;font-size:15px;outline:none;font-family:system-ui;margin-bottom:16px}
.inp:focus{border-color:#0E6F76}
.btn-pri{width:100%;background:#0E6F76;color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-sm{background:transparent;border:1px solid rgba(255,255,255,.3);color:rgba(255,255,255,.9);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:5px}
.btn-sm:hover{background:rgba(255,255,255,.1)}
.sec-title{font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;margin:20px 0 10px}
.empty{text-align:center;padding:32px;color:#94A3B8;font-size:14px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.fecha-btn{padding:6px 14px;border-radius:99px;border:1px solid #E2E8F0;background:#fff;font-size:13px;cursor:pointer;font-family:system-ui;color:#0B2A2D}
.fecha-btn.on{background:#0E6F76;color:#fff;border-color:#0E6F76;font-weight:600}
.gps-link{display:inline-flex;align-items:center;gap:4px;color:#0E6F76;font-size:12px;text-decoration:none}
.gps-link:hover{text-decoration:underline}
.prom-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.pcard{border:1px solid #E2E8F0;border-radius:14px;padding:12px;background:#fff}
.prog-bar{display:flex;gap:2px;height:6px;border-radius:3px;overflow:hidden;margin:8px 0 4px}
.prog-seg{height:100%;border-radius:1px}
.charts-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media(max-width:640px){.charts-row{grid-template-columns:1fr}}
`;

export default function App() {
  const [auth, setAuth] = useState(()=>sessionStorage.getItem("nl_admin")==="1");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const login = () => {
    if(clave===CLAVE){sessionStorage.setItem("nl_admin","1");setAuth(true);}
    else setError("Clave incorrecta");
  };
  if (!auth) return (
    <div className="login">
      <style>{CSS}</style>
      <div className="login-card">
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:36,marginBottom:8}}>🛡️</div>
          <div style={{fontWeight:700,fontSize:20}}>Nanolife Elite Admin</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>Panel de supervisión · Campaña Lider 2026</div>
        </div>
        <input className="inp" type="password" placeholder="Clave de acceso" value={clave}
          onChange={e=>{setClave(e.target.value);setError("");}}
          onKeyDown={e=>e.key==="Enter"&&login()}/>
        {error && <div style={{color:"#DC2626",fontSize:13,marginBottom:12,textAlign:"center"}}>{error}</div>}
        <button className="btn-pri" onClick={login}>Ingresar</button>
      </div>
    </div>
  );
  return <div><style>{CSS}</style><Dashboard onLogout={()=>{sessionStorage.removeItem("nl_admin");setAuth(false);}}/></div>;
}

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [fechaSel, setFechaSel] = useState("hoy");
  const [chartsReady, setChartsReady] = useState(false);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/.netlify/functions/sheet-data?t="+Date.now());
      if(!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setData(d); setUpdatedAt(new Date(d.updatedAt));
    } catch(e){ setError(e.message); } finally{ setLoading(false); }
  }

  useEffect(()=>{
    fetchData();
    if(window.Chart){ setChartsReady(true); return; }
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload=()=>setChartsReady(true);
    document.head.appendChild(s);
  },[]);

  const hoyISO = new Date().toISOString().slice(0,10);

  const fechasDisponibles = useMemo(()=>{
    if(!data) return [];
    const s=new Set([...data.marcaciones.map(r=>r["Fecha"]),...data.ventas.map(r=>r["Fecha"])]);
    return [...s].filter(Boolean).sort().reverse();
  },[data]);

  const fechasFilt = useMemo(()=>{
    if(!fechasDisponibles.length) return [];
    if(fechaSel==="hoy") return fechasDisponibles.filter(f=>f===hoyISO);
    if(fechaSel==="semana"){const h=new Date();h.setDate(h.getDate()-7);return fechasDisponibles.filter(f=>f>=h.toISOString().slice(0,10));}
    return fechasDisponibles;
  },[fechaSel,fechasDisponibles,hoyISO]);

  const marc = useMemo(()=>data?.marcaciones.filter(r=>fechasFilt.includes(r["Fecha"]))||[],[data,fechasFilt]);
  const vent = useMemo(()=>data?.ventas.filter(r=>fechasFilt.includes(r["Fecha"]))||[],[data,fechasFilt]);
  const cierresFilt = useMemo(()=>data?.cierres.filter(r=>fechasFilt.includes(r["Fecha"]))||[],[data,fechasFilt]);
  const b2b = useMemo(()=>data?.ventasB2B||[],[data]);

  const promotores = useMemo(()=>[...new Set(marc.map(r=>r["Promotor"]))],[marc]);
  const totalUnidades = useMemo(()=>vent.reduce((s,r)=>s+parseInt(r["Unidades"]||0),0),[vent]);
  const totalComision = useMemo(()=>vent.reduce((s,r)=>s+parseInt(r["Comisión total"]||0),0),[vent]);

  const porPromotor = useMemo(()=>{
    const m={};
    marc.forEach(r=>{
      const p=r["Promotor"]; if(!p) return;
      if(!m[p]) m[p]={nombre:p,sala:r["Sala"]?.replace("Hiper Lider - ",""),ciudad:r["Ciudad"],marc:[],vent:[],cierres:[]};
      m[p].marc.push(r);
    });
    vent.forEach(r=>{ if(m[r["Promotor"]]) m[r["Promotor"]].vent.push(r); });
    cierresFilt.forEach(r=>{ if(m[r["Promotor"]]) m[r["Promotor"]].cierres.push(r); });
    return Object.values(m).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  },[marc,vent,cierresFilt]);

  const jornadasCompletas = useMemo(()=>{
    const dias={};
    marc.forEach(r=>{
      const k=`${r["Promotor"]}__${r["Fecha"]}`;
      if(!dias[k]) dias[k]={ae:0,as:0,pe:0,ps:0};
      if(r["Turno"]==="AM"&&r["Tipo"]==="Entrada") dias[k].ae=1;
      if(r["Turno"]==="AM"&&r["Tipo"]==="Salida")  dias[k].as=1;
      if(r["Turno"]==="PM"&&r["Tipo"]==="Entrada") dias[k].pe=1;
      if(r["Turno"]==="PM"&&r["Tipo"]==="Salida")  dias[k].ps=1;
    });
    return Object.values(dias).filter(d=>d.ae&&d.as&&d.pe&&d.ps).length;
  },[marc]);

  const ventasPorProd = useMemo(()=>{
    const m={};
    vent.forEach(r=>{const p=r["Producto"];if(!p)return;if(!m[p])m[p]=0;m[p]+=parseInt(r["Unidades"]||0);});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[vent]);

  const ventasPorProm = useMemo(()=>{
    const m={};
    vent.forEach(r=>{const p=r["Promotor"];if(!p)return;if(!m[p])m[p]=0;m[p]+=parseInt(r["Unidades"]||0);});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[vent]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar h1" style={{color:"#fff",fontWeight:700,fontSize:18}}>🛡️ Nanolife Elite Admin</div>
          <div className="sub">Campaña Lider 2026{updatedAt&&` · Act. ${updatedAt.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}`}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-sm" onClick={fetchData} disabled={loading}><RefreshCw size={14} className={loading?"spin":""}/>{loading?"...":"Actualizar"}</button>
          <button className="btn-sm" onClick={onLogout}><LogOut size={14}/> Salir</button>
        </div>
      </div>

      <div className="app">
        {loading&&!data&&<div className="empty" style={{marginTop:60}}><RefreshCw size={32} className="spin" style={{color:"#0E6F76",marginBottom:12}}/><div>Cargando...</div></div>}
        {error&&<div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:12,padding:14,marginTop:20,color:"#DC2626",display:"flex",gap:8}}><AlertCircle size={18}/>{error}</div>}

        {data && <>
          {/* FILTRO FECHA */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:16,flexWrap:"wrap"}}>
            <Calendar size={15} color="#64748B"/>
            {[["hoy","Hoy"],["semana","Últimos 7 días"],["todo","Todo"]].map(([v,l])=>(
              <button key={v} className={`fecha-btn ${fechaSel===v?"on":""}`} onClick={()=>setFechaSel(v)}>{l}</button>
            ))}
            <span style={{fontSize:12,color:"#94A3B8"}}>{marc.length} marcaciones</span>
          </div>

          {/* KPIs */}
          <div className="stat-grid">
            <div className="stat">
              <div className="lbl"><Users size={12}/> Promotores</div>
              <div className="val">{promotores.length}</div>
              <div className="sub">activos en el período</div>
            </div>
            <div className="stat">
              <div className="lbl"><CheckCircle2 size={12}/> Jornadas completas</div>
              <div className="val">{jornadasCompletas}</div>
              <div className="sub">{fmtCLP(jornadasCompletas*PAGO_JORNADA)} pago fijo</div>
            </div>
            <div className="stat">
              <div className="lbl"><Package size={12}/> Unidades vendidas</div>
              <div className="val">{totalUnidades}</div>
              <div className="sub">{fmtCLP(totalComision)} en comisiones</div>
            </div>
            <div className="stat">
              <div className="lbl"><TrendingUp size={12}/> Total estimado</div>
              <div className="val" style={{fontSize:16}}>{fmtCLP(totalComision+jornadasCompletas*PAGO_JORNADA)}</div>
              <div className="sub">jornadas + comisiones</div>
            </div>
          </div>

          {/* STATUS PROMOTORES */}
          <div className="sec-title">Estado de promotores</div>
          {porPromotor.length===0
            ? <div className="empty">Sin datos para el período</div>
            : <div className="prom-grid">
                {porPromotor.map((p,i)=>{
                  const amE=p.marc.some(m=>m["Turno"]==="AM"&&m["Tipo"]==="Entrada");
                  const amS=p.marc.some(m=>m["Turno"]==="AM"&&m["Tipo"]==="Salida");
                  const pmE=p.marc.some(m=>m["Turno"]==="PM"&&m["Tipo"]==="Entrada");
                  const pmS=p.marc.some(m=>m["Turno"]==="PM"&&m["Tipo"]==="Salida");
                  const unds=p.vent.reduce((s,v)=>s+parseInt(v["Unidades"]||0),0);
                  const com=p.vent.reduce((s,v)=>s+parseInt(v["Comisión total"]||0),0);
                  const completa=amE&&amS&&pmE&&pmS;
                  const enCurso=(amE||pmE)&&!completa;
                  const color=COLORES_PROM[i%COLORES_PROM.length];
                  const pasos=[amE,amS,pmE,pmS];
                  const labels=["E.AM","S.AM","E.PM","S.PM"];
                  return (
                    <div key={p.nombre} className="pcard" style={{borderLeft:`3px solid ${completa?"#16A34A":enCurso?"#F5A623":"#CBD5E1"}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <div className="av" style={{background:color+"22",color}}>{p.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</div>
                          <div style={{fontSize:11,color:"#64748B"}}>{p.sala||p.ciudad}</div>
                        </div>
                        <span className={`badge ${completa?"badge-ok":enCurso?"badge-warn":"badge-off"}`} style={{fontSize:10,flexShrink:0}}>
                          {completa?"✓ Completa":enCurso?"En curso":"Pendiente"}
                        </span>
                      </div>
                      {/* Barra de progreso visual */}
                      <div className="prog-bar">
                        {pasos.map((ok,j)=>(
                          <div key={j} className="prog-seg" style={{flex:1,background:ok?(j%2===0?"#16A34A":"#0E6F76"):"#E2E8F0"}}/>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:4,marginBottom:8}}>
                        {pasos.map((ok,j)=>(
                          <div key={j} style={{flex:1,fontSize:9,textAlign:"center",color:ok?"#15803D":"#94A3B8",fontWeight:ok?700:400}}>{labels[j]}</div>
                        ))}
                      </div>
                      {unds>0 && (
                        <div style={{background:"#F0FDF4",borderRadius:8,padding:"5px 8px",display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontSize:11,color:"#15803D"}}>{unds} unidades</span>
                          <span style={{fontSize:11,fontWeight:700,color:"#15803D"}}>{fmtCLP(com)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          }

          {/* GRÁFICOS */}
          {chartsReady && vent.length>0 && (
            <div className="charts-row">
              <div className="card">
                <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",fontWeight:700,fontSize:13}}>Unidades por producto</div>
                <div style={{padding:16}}>
                  <div style={{position:"relative",height:220}}>
                    <canvas id="chartProd" role="img" aria-label="Ventas por producto"/>
                  </div>
                </div>
              </div>
              <div className="card">
                <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",fontWeight:700,fontSize:13}}>Ranking por promotor</div>
                <div style={{padding:16}}>
                  <div style={{position:"relative",height:Math.max(220,ventasPorProm.length*44+40)}}>
                    <canvas id="chartProm" role="img" aria-label="Ranking ventas promotores"/>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ChartsRenderer ventasPorProd={ventasPorProd} ventasPorProm={ventasPorProm} ready={chartsReady&&vent.length>0}/>

          {/* TABLA MARCACIONES */}
          <div className="sec-title">Registro de marcaciones</div>
          <div className="card">
            <div style={{overflowX:"auto"}}>
              <table className="table">
                <thead>
                  <tr><th>Fecha</th><th>Promotor</th><th>Sala</th><th>Turno</th><th>Tipo</th><th>Hora</th><th>GPS</th></tr>
                </thead>
                <tbody>
                  {marc.length===0
                    ? <tr><td colSpan={7} style={{textAlign:"center",color:"#94A3B8",padding:20}}>Sin marcaciones</td></tr>
                    : marc.map((m,i)=>{
                        const lat=normCoord(m["Latitud"]);
                        const lng=normCoord(m["Longitud"]);
                        return (
                          <tr key={i}>
                            <td style={{fontSize:12,whiteSpace:"nowrap"}}>{fmtFecha(m["Fecha"])}</td>
                            <td><div style={{fontWeight:600,fontSize:13}}>{m["Promotor"]}</div><div style={{fontSize:11,color:"#94A3B8"}}>{m["Ciudad"]}</div></td>
                            <td style={{fontSize:12,color:"#64748B",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m["Sala"]?.replace("Hiper Lider - ","")}</td>
                            <td><span className={`badge ${m["Turno"]==="AM"?"badge-blue":"badge-warn"}`}>{m["Turno"]}</span></td>
                            <td><span className={`badge ${m["Tipo"]==="Entrada"?"badge-ok":"badge-off"}`}>{m["Tipo"]}</span></td>
                            <td style={{fontFamily:"monospace",fontSize:12,whiteSpace:"nowrap"}}>{m["Hora"]}</td>
                            <td>
                              {lat&&lng
                                ? <a className="gps-link" href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noreferrer">
                                    <MapPin size={11}/>{lat.toFixed(4)},{lng.toFixed(4)}<ExternalLink size={10}/>
                                  </a>
                                : <span style={{color:"#94A3B8",fontSize:11}}>Sin GPS</span>
                              }
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* VENTAS B2B LIDER */}
          {b2b.length > 0 && <VentasB2BSection data={b2b}/>}

          {/* FOTOS DE GÓNDOLA */}
          {data.fotos?.length > 0 && <>
            <div className="sec-title">Fotos de góndola</div>
            <div className="card">
              <div style={{padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
                {data.fotos.filter(f=>fechasFilt.includes(f["Fecha"]||"")).map((f,i)=>{
                  const fileId = getDriveId(f["View URL"]||f["URL"]);
                  const imgSrc = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w400` : f["URL"];
                  const viewUrl = f["View URL"]||f["URL"];
                  return (
                    <div key={i} style={{borderRadius:12,overflow:"hidden",border:"1px solid #E2E8F0",background:"#fff"}}>
                      <div style={{position:"relative",aspectRatio:"1",background:"#F1F5F9",overflow:"hidden"}}>
                        <img src={imgSrc} alt={f["Archivo"]}
                          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                          onError={e=>{e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23F1F5F9'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='30' fill='%2394A3B8'%3E📷%3C/text%3E%3C/svg%3E";}}/>
                        <a href={viewUrl} target="_blank" rel="noreferrer"
                          style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.5)",borderRadius:6,padding:"3px 7px",color:"#fff",fontSize:10,textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>
                          <ExternalLink size={9}/> Ver
                        </a>
                      </div>
                      <div style={{padding:"6px 8px",background:"#F8FAFC"}}>
                        <div style={{fontSize:10,fontWeight:600,color:"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {f["Archivo"]?.replace(/_/g," ").replace(".jpg","") || "—"}
                        </div>
                        <div style={{fontSize:10,color:"#94A3B8",marginTop:1}}>{f["Fecha"]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {data.fotos.filter(f=>fechasFilt.includes(f["Fecha"]||"")).length===0 &&
                <div className="empty">Sin fotos para el período seleccionado</div>}
            </div>
          </>}

          {/* AUDIOS DE CIERRE */}
          {data.audios?.length > 0 && <>
            <div className="sec-title">Audios de cierre</div>
            <div className="card">
              <div style={{padding:"8px 0"}}>
                {data.audios.filter(f=>fechasFilt.includes(f["Fecha"]||"")).map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid #F1F5F9"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"#F0FDF4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Mic size={16} color="#15803D"/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {a["Archivo"]?.replace(/_/g," ").replace(".webm","") || "—"}
                      </div>
                      <div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{a["Fecha"]} · {a["Subido"]}</div>
                    </div>
                    <AudioPlayer url={a["View URL"]||a["URL"]}/>
                  </div>
                ))}
                {data.audios.filter(f=>fechasFilt.includes(f["Fecha"]||"")).length===0 &&
                  <div className="empty">Sin audios para el período seleccionado</div>}
              </div>
            </div>
          </>}

          {/* DETALLE VENTAS */}
          {porPromotor.filter(p=>p.vent.length>0).length>0 && <>
            <div className="sec-title">Detalle de ventas por promotor</div>
            {porPromotor.filter(p=>p.vent.length>0).map(p=><PromoterCard key={p.nombre} promotor={p}/>)}
          </>}
        </>}
      </div>
    </>
  );
}

function ChartsRenderer({ ventasPorProd, ventasPorProm, ready }) {
  useEffect(()=>{
    if(!ready||!window.Chart) return;
    const instances=[];

    const cp=document.getElementById("chartProd");
    if(cp&&ventasPorProd.length>0){
      if(cp._ch) cp._ch.destroy();
      cp._ch=new window.Chart(cp,{
        type:"doughnut",
        data:{
          labels:ventasPorProd.map(([n])=>n.replace("Detergente 10x ","Det.10x ").replace("Detergente 25x ","Det.25x ").replace("Limpiapisos ","LP.")),
          datasets:[{data:ventasPorProd.map(([,v])=>v),backgroundColor:COLORES_PROD,borderWidth:2,borderColor:"#fff"}]
        },
        options:{responsive:true,maintainAspectRatio:false,cutout:"60%",plugins:{legend:{position:"right",labels:{font:{size:11},boxWidth:12,padding:8}}}}
      });
      instances.push(cp._ch);
    }

    const cpr=document.getElementById("chartProm");
    if(cpr&&ventasPorProm.length>0){
      if(cpr._ch) cpr._ch.destroy();
      cpr._ch=new window.Chart(cpr,{
        type:"bar",
        data:{
          labels:ventasPorProm.map(([n])=>n.split(" ").slice(0,2).join(" ")),
          datasets:[{label:"Unidades",data:ventasPorProm.map(([,v])=>v),backgroundColor:COLORES_PROM.slice(0,ventasPorProm.length),borderRadius:6,borderSkipped:false}]
        },
        options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"#F1F5F9"},ticks:{font:{size:11}}},y:{grid:{display:false},ticks:{font:{size:11}}}}}
      });
      instances.push(cpr._ch);
    }

    return()=>instances.forEach(c=>{ try{c.destroy();}catch(e){} });
  },[ventasPorProd,ventasPorProm,ready]);

  return null;
}

function VentasB2BSection({ data }) {
  const [fechaSel, setFechaSel] = useState("todas");
  const [tiendaSel, setTiendaSel] = useState("todas");

  const PROD_MAP = {
    "LIMPIA PISO LAVANDA":  "Limpiapisos Lavanda",
    "LIMPIA PISO SUMMER":   "Limpiapisos Summer",
    "DETERG  PODSX10 UN":   "Detergente 10x Regular",
    "CAPSULAS PODS HIPO":   "Detergente 10x Hipoalergénico",
    "DETERG PODS X25 UN":   "Detergente 25x Regular",
  };

  const fechas = useMemo(()=>[...new Set(data.map(r=>r["Fecha"]).filter(Boolean))].sort().reverse(), [data]);
  
  const tiendas = useMemo(()=>{
    const base = fechaSel==="todas" ? data : data.filter(r=>r["Fecha"]===fechaSel);
    return [...new Set(base.filter(r=>parseFloat(r["POS Qty"]||0)>0).map(r=>r["Store Name"]).filter(Boolean))].sort();
  },[data, fechaSel]);

  const rows = useMemo(()=>{
    let r = fechaSel==="todas" ? data : data.filter(x=>x["Fecha"]===fechaSel);
    if (tiendaSel!=="todas") r = r.filter(x=>x["Store Name"]===tiendaSel);
    return r;
  },[data, fechaSel, tiendaSel]);

  const handleFecha = (f) => { setFechaSel(f); setTiendaSel("todas"); };

  // Totales por producto
  const porProducto = useMemo(()=>{
    const m = {};
    rows.forEach(r=>{
      const prod = PROD_MAP[r["Item Desc 1"]] || r["Item Desc 1"] || "Otro";
      if(!m[prod]) m[prod]={qty:0,sales:0};
      m[prod].qty   += parseFloat(r["POS Qty"]||0);
      m[prod].sales += parseFloat((r["POS Sales"]||"0").replace(/[$,]/g,""));
    });
    return Object.entries(m).sort((a,b)=>b[1].qty-a[1].qty);
  },[rows]);

  // Top tiendas por unidades
  const topTiendas = useMemo(()=>{
    const m = {};
    rows.forEach(r=>{
      const tienda = r["Store Name"] || "—";
      if(!m[tienda]) m[tienda]={qty:0,sales:0,city:r["City"]||""};
      m[tienda].qty   += parseFloat(r["POS Qty"]||0);
      m[tienda].sales += parseFloat((r["POS Sales"]||"0").replace(/[$,]/g,""));
    });
    return Object.entries(m).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10);
  },[rows]);

  const totalQty   = rows.reduce((s,r)=>s+parseFloat(r["POS Qty"]||0),0);
  const totalSales = rows.reduce((s,r)=>s+parseFloat((r["POS Sales"]||"0").replace(/[$,]/g,"")),0);
  const maxQty = Math.max(...porProducto.map(([,v])=>v.qty), 1);
  const maxTienda = Math.max(...topTiendas.map(([,v])=>v.qty), 1);

  return (
    <>
      <div className="sec-title" style={{marginTop:20}}>
        Ventas B2B Lider · Sell Out Oficial
      </div>

      {/* Selector de fecha */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
        <Calendar size={14} color="#64748B"/>
        <button className={`fecha-btn ${fechaSel==="todas"?"on":""}`} onClick={()=>handleFecha("todas")}>Todas</button>
        {fechas.map(f=>{
          const d = new Date(f+"T12:00");
          const label = isNaN(d) ? f : d.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
          return (
            <button key={f} className={`fecha-btn ${fechaSel===f?"on":""}`} onClick={()=>handleFecha(f)}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Filtro por tienda */}
      {tiendas.length > 0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
          <Store size={14} color="#64748B"/>
          <button className={`fecha-btn ${tiendaSel==="todas"?"on":""}`} onClick={()=>setTiendaSel("todas")}>
            Todas las tiendas
          </button>
          {tiendas.map(t=>(
            <button key={t} className={`fecha-btn ${tiendaSel===t?"on":""}`} onClick={()=>setTiendaSel(t)}
              style={{fontSize:12}}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* KPIs B2B */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
        <div className="stat">
          <div className="lbl"><Package size={12}/> Unidades totales</div>
          <div className="val">{Math.round(totalQty).toLocaleString("es-CL")}</div>
          <div className="sub">POS Qty</div>
        </div>
        <div className="stat">
          <div className="lbl"><TrendingUp size={12}/> Venta total</div>
          <div className="val" style={{fontSize:16}}>{fmtCLP(totalSales)}</div>
          <div className="sub">POS Sales</div>
        </div>
        <div className="stat">
          <div className="lbl"><Store size={12}/> Tiendas activas</div>
          <div className="val">{new Set(rows.filter(r=>parseFloat(r["POS Qty"]||0)>0).map(r=>r["Store Name"])).size}</div>
          <div className="sub">con ventas &gt; 0</div>
        </div>
        <div className="stat">
          <div className="lbl"><CheckCircle2 size={12}/> Productos</div>
          <div className="val">{porProducto.filter(([,v])=>v.qty>0).length}</div>
          <div className="sub">con ventas &gt; 0</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {/* Ventas por producto */}
        <div className="card">
          <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",fontWeight:700,fontSize:13}}>
            Unidades por producto
          </div>
          <div style={{padding:"12px 16px"}}>
            {porProducto.map(([prod,v],i)=>(
              <div key={prod} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#0B2A2D"}}>{prod}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#0E6F76"}}>{Math.round(v.qty)} u</span>
                </div>
                <div style={{height:8,background:"#F1F5F9",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(v.qty/maxQty)*100}%`,background:COLORES_PROD[i%COLORES_PROD.length],borderRadius:4,transition:"width .3s"}}/>
                </div>
                <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{fmtCLP(v.sales)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top tiendas */}
        <div className="card">
          <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",fontWeight:700,fontSize:13}}>
            Top 10 tiendas por unidades
          </div>
          <div style={{padding:"12px 16px"}}>
            {topTiendas.map(([tienda,v],i)=>(
              <div key={tienda} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,fontWeight:600,color:"#0B2A2D",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8}}>
                    {i+1}. {tienda}
                  </span>
                  <span style={{fontSize:11,fontWeight:700,color:"#0E6F76",flexShrink:0}}>{Math.round(v.qty)} u</span>
                </div>
                <div style={{height:6,background:"#F1F5F9",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(v.qty/maxTienda)*100}%`,background:COLORES_PROM[i%COLORES_PROM.length],borderRadius:3}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla completa */}
      <div className="card" style={{marginTop:12}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",fontWeight:700,fontSize:13}}>
          Detalle por tienda y producto
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tienda</th>
                <th>Ciudad</th>
                <th>Producto</th>
                <th style={{textAlign:"right"}}>Stock OH</th>
                <th style={{textAlign:"right"}}>POS Qty</th>
                <th style={{textAlign:"right"}}>POS Sales</th>
              </tr>
            </thead>
            <tbody>
              {rows.filter(r=>parseFloat(r["POS Qty"]||0)>0).sort((a,b)=>parseFloat(b["POS Qty"]||0)-parseFloat(a["POS Qty"]||0)).map((r,i)=>(
                <tr key={i}>
                  <td style={{fontSize:12,whiteSpace:"nowrap"}}>{r["Fecha"]}</td>
                  <td style={{fontSize:12,fontWeight:600}}>{r["Store Name"]}</td>
                  <td style={{fontSize:12,color:"#64748B"}}>{r["City"]}</td>
                  <td style={{fontSize:12}}>{PROD_MAP[r["Item Desc 1"]]||r["Item Desc 1"]}</td>
                  <td style={{fontSize:12,textAlign:"right",color:"#64748B"}}>{r["Curr Str On Hand Qty"]||r["Stock OnHand"]||"—"}</td>
                  <td style={{fontSize:12,textAlign:"right",fontWeight:700,color:"#0E6F76"}}>{Math.round(parseFloat(r["POS Qty"]||0))}</td>
                  <td style={{fontSize:12,textAlign:"right"}}>{fmtCLP(parseFloat((r["POS Sales"]||"0").replace(/[$,]/g,"")))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AudioPlayer({ url }) {
  const [open, setOpen] = useState(false);
  const fileId = getDriveId(url);
  const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;

  if (!embedUrl) return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{display:"flex",alignItems:"center",gap:5,background:"#0E6F76",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none",flexShrink:0}}>
      <ExternalLink size={12}/> Escuchar
    </a>
  );

  return (
    <div style={{flexShrink:0}}>
      {!open ? (
        <button onClick={()=>setOpen(true)}
          style={{display:"flex",alignItems:"center",gap:5,background:"#0E6F76",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          <Mic size={12}/> Reproducir
        </button>
      ) : (
        <div style={{width:280}}>
          <iframe src={embedUrl} width="280" height="60" allow="autoplay"
            style={{border:"none",borderRadius:8,display:"block"}}/>
          <button onClick={()=>setOpen(false)}
            style={{fontSize:10,color:"#64748B",background:"none",border:"none",cursor:"pointer",marginTop:2}}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

function PromoterCard({ promotor: p }) {
  const [open,setOpen]=useState(false);
  const unds=p.vent.reduce((s,v)=>s+parseInt(v["Unidades"]||0),0);
  const com=p.vent.reduce((s,v)=>s+parseInt(v["Comisión total"]||0),0);
  const audio=p.cierres.find(c=>c["Audio URL"]);
  const porProd={};
  p.vent.forEach(v=>{const pr=v["Producto"];if(!pr)return;if(!porProd[pr])porProd[pr]={u:0,c:0};porProd[pr].u+=parseInt(v["Unidades"]||0);porProd[pr].c+=parseInt(v["Comisión total"]||0);});

  return (
    <div className="card">
      <div className="card-header" onClick={()=>setOpen(!open)}>
        <h3>
          <div className="av">{p.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
          <div><div>{p.nombre}</div><div style={{fontWeight:400,fontSize:12,color:"#64748B"}}>{p.sala} · {p.ciudad}</div></div>
        </h3>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontWeight:700,fontSize:14,color:"#0E6F76"}}>{unds}u · {fmtCLP(com)}</span>
          {audio&&<span className="badge badge-ok" style={{fontSize:10}}><Mic size={10}/> Audio</span>}
          {open?<ChevronUp size={16} color="#94A3B8"/>:<ChevronDown size={16} color="#94A3B8"/>}
        </div>
      </div>
      {open&&(
        <div className="card-body">
          <table className="table">
            <thead><tr><th>Producto</th><th>Unidades</th><th>Comisión</th></tr></thead>
            <tbody>
              {Object.entries(porProd).map(([prod,v])=>(
                <tr key={prod}><td style={{fontSize:12}}>{prod}</td><td style={{fontWeight:700,color:"#0E6F76"}}>{v.u}</td><td style={{fontWeight:600}}>{fmtCLP(v.c)}</td></tr>
              ))}
              <tr style={{background:"#F0FDF4"}}><td style={{fontWeight:700}}>Total</td><td style={{fontWeight:700,color:"#0E6F76"}}>{unds}</td><td style={{fontWeight:700,color:"#15803D"}}>{fmtCLP(com)}</td></tr>
            </tbody>
          </table>
          {audio&&(
            <div style={{marginTop:10,background:"#F0FDF4",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <Mic size={16} color="#15803D"/>
              <span style={{fontSize:13,fontWeight:600,color:"#15803D"}}>Audio de cierre</span>
              <a href={audio["Audio URL"]} target="_blank" rel="noreferrer" style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,color:"#0E6F76",fontSize:12,textDecoration:"none"}}>Escuchar<ExternalLink size={12}/></a>
            </div>
          )}
          <div style={{marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Marcaciones</div>
            {p.marc.map((m,i)=>{
              const lat=normCoord(m["Latitud"]);
              const lng=normCoord(m["Longitud"]);
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #F1F5F9"}}>
                  {m["Tipo"]==="Entrada"?<LogIn size={13} color="#0E6F76"/>:<LogOut size={13} color="#DC2626"/>}
                  <span className={`badge ${m["Turno"]==="AM"?"badge-blue":"badge-warn"}`} style={{fontSize:9}}>{m["Turno"]}</span>
                  <span style={{fontSize:12,fontWeight:600}}>{m["Tipo"]}</span>
                  <span style={{fontFamily:"monospace",fontSize:11,color:"#64748B"}}>{m["Hora"]}</span>
                  {lat&&lng
                    ? <a className="gps-link" href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noreferrer" style={{marginLeft:"auto"}}>
                        <MapPin size={11}/>Ver mapa<ExternalLink size={10}/>
                      </a>
                    : <span style={{marginLeft:"auto",fontSize:11,color:"#94A3B8"}}>Sin GPS</span>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
