import { useState, useEffect, useMemo } from "react";
import {
  Users, MapPin, ShoppingCart, Mic, RefreshCw,
  CheckCircle2, AlertCircle, TrendingUp, ChevronDown,
  ChevronUp, ExternalLink, LogIn, LogOut, Calendar, Package
} from "lucide-react";

const CLAVE = "nanolife2026";
const PAGO_JORNADA = 22000;
const COLORES_PROD = ["#0E6F76","#16A34A","#F5A623","#DC2626","#7C3AED"];
const COLORES_PROM = ["#0E6F76","#16A34A","#F5A623","#DC2626","#7C3AED","#0891B2","#D97706","#059669"];

const fmtCLP = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(Math.round(n||0));
const fmtFecha = f => f ? new Date(f+"T12:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"}) : "—";

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
