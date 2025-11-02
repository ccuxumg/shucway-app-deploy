// src/features/Dashboard/Reportes/Reportes.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

/* ========================= Helpers & tipos ========================= */
type Categoria = "Shucos" | "Hamburguesas" | "Mixtas" | "Bebidas" | "Papás";
type MetodoPago = "Efectivo" | "Tarjeta";
type FiltroCategoria = "Todas" | Categoria;
type FiltroMetodo = "Todos" | MetodoPago;

type Venta = {
  fechaISO: string;          // p.ej. "2025-10-31"
  producto: string;          // p.ej. "Shuco Mixto"
  categoria: Categoria;
  cantidad: number;          // unidades
  totalQ: number;            // monto en quetzales (venta)
  cogsQ: number;             // costo de venta (COGS)
  metodo: "Efectivo" | "Tarjeta";
};

const CATS: Categoria[] = ["Shucos","Hamburguesas","Mixtas","Bebidas","Papás"];

// Para formatear dinero
const q = (n: number) =>
  `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Colores para charts
const COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#3B82F6","#F97316","#84CC16","#14B8A6"];

/* ========= Mock catálogo y datos ========= */
const CATALOGO: { producto: string; categoria: Categoria }[] = [
  { producto: "Shuco de Asada", categoria: "Shucos" },
  { producto: "Shuco Mixto", categoria: "Shucos" },
  { producto: "Cheese Burger", categoria: "Hamburguesas" },
  { producto: "Bacon Burger", categoria: "Hamburguesas" },
  { producto: "Combo Mixto", categoria: "Mixtas" },
  { producto: "Papas Fritas", categoria: "Papás" },
  { producto: "Pepsi Cola", categoria: "Bebidas" },
  { producto: "Coca Cola", categoria: "Bebidas" },
];

// RNG simple (determinístico)
function rng(seed: number) {
  let s = seed % 2147483647;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

// Generar ventas desde 2024-01-01
function generarVentasMock(): Venta[] {
  const start = new Date(2024, 0, 1);
  const end = new Date();
  const rand = rng(12345);

  const ventas: Venta[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const tickets = 3 + Math.floor(rand() * 6); // 3-8 tickets/día
    for (let i = 0; i < tickets; i++) {
      const item = CATALOGO[Math.floor(rand() * CATALOGO.length)];
      const cant = 1 + Math.floor(rand() * 3);
      const precioBase =
        item.categoria === "Shucos" ? 15 :
        item.categoria === "Hamburguesas" ? 20 :
        item.categoria === "Mixtas" ? 25 :
        item.categoria === "Papás" ? 12 : 6;

      const total = Math.round((precioBase * cant * (0.85 + rand() * 0.5)) * 100) / 100;
      const cogsRatio = 0.55 + (rand() * 0.15);
      const cogs = Math.round(total * cogsRatio * 100) / 100;
      const metodo: "Efectivo" | "Tarjeta" = rand() < 0.7 ? "Efectivo" : "Tarjeta";

      ventas.push({
        fechaISO: new Date(d).toISOString().slice(0, 10),
        producto: item.producto,
        categoria: item.categoria,
        cantidad: cant,
        totalQ: total,
        cogsQ: cogs,
        metodo,
      });
    }
  }
  return ventas;
}

/* ========================= Componente principal ========================= */
const Reportes: React.FC = () => {
  const navigate = useNavigate();

  // MOCK – reemplazar por fetch a backend
  const mockVentas = useMemo(() => generarVentasMock(), []);

  /* ---------- Filtros GLOBALes (afectan KPIs + Tabla) ---------- */
  type Periodo = "hoy" | "ayer" | "30d" | "rango";
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [rangoInicio, setRangoInicio] = useState<string>("");
  const [rangoFin, setRangoFin] = useState<string>("");

  const [catGlobal, setCatGlobal] = useState<FiltroCategoria>("Todas");
  const [metodoGlobal, setMetodoGlobal] = useState<FiltroMetodo>("Todos");
  const [search, setSearch] = useState<string>("");

  // Específicos de tarjetas de estrategia
  const [topVendidosFiltro, setTopVendidosFiltro] = useState<FiltroCategoria>("Todas");
  const [topRentablesFiltro, setTopRentablesFiltro] = useState<FiltroCategoria>("Todas");

  /* ---------- Rango de fechas ---------- */
  const [ini, fin] = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);

    if (periodo === "hoy") {
      start.setHours(0, 0, 0, 0);
    } else if (periodo === "ayer") {
      start.setDate(end.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (periodo === "30d") {
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    } else {
      let rIni = rangoInicio ? new Date(rangoInicio) : new Date(end);
      let rFin = rangoFin ? new Date(rangoFin) : new Date(end);
      // Corrige inversión si es necesario
      if (rIni > rFin) {
        const temp = rIni;
        rIni = rFin;
        rFin = temp;
      }
      // Ajusta las horas
      rIni = new Date(rIni.setHours(0, 0, 0, 0));
      rFin = new Date(rFin.setHours(23, 59, 59, 999));
      return [rIni, rFin] as const;
    }
    return [start, end] as const;
  }, [periodo, rangoInicio, rangoFin]);

  /* ---------- Conjuntos de datos ---------- */
  const ventasEnRango = useMemo(
    () => mockVentas.filter(v => {
      const d = new Date(v.fechaISO + "T00:00:00");
      return d >= ini && d <= fin;
    }),
    [mockVentas, ini, fin]
  );

  // Filtrado global para KPIs/Tabla
  const ventasFiltradas = useMemo(() => {
    let arr = ventasEnRango;
    if (catGlobal !== "Todas") arr = arr.filter(v => v.categoria === catGlobal);
    if (metodoGlobal !== "Todos") arr = arr.filter(v => v.metodo === metodoGlobal);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(v => v.producto.toLowerCase().includes(s));
    }
    return arr;
  }, [ventasEnRango, catGlobal, metodoGlobal, search]);

  /* ---------- KPIs ---------- */
  const ventaTotal = useMemo(() => ventasFiltradas.reduce((a, v) => a + v.totalQ, 0), [ventasFiltradas]);
  const cogsTotal  = useMemo(() => ventasFiltradas.reduce((a, v) => a + v.cogsQ, 0),  [ventasFiltradas]);
  const gBruta     = useMemo(() => Math.max(0, ventaTotal - cogsTotal), [ventaTotal, cogsTotal]);
  const gastosOper = useMemo(() => Math.round((ventaTotal * 0.08 + 60) * 100) / 100, [ventaTotal]); // mock
  const gNeta      = useMemo(() => Math.max(0, gBruta - gastosOper), [gBruta, gastosOper]);

  /* ---------- Gráficas (independientes de filtros globales) ---------- */
  // Pie por categoría: SIEMPRE distribuye el total en el rango (no usa catGlobal/metodoGlobal)
  const pieCategoria = useMemo(() => {
    const map = new Map<Categoria, number>();
    ventasEnRango.forEach(v => map.set(v.categoria, (map.get(v.categoria) || 0) + v.totalQ));
    const arr = [...map.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
    return arr.length ? arr : [{ name: "Sin datos", value: 1 }];
  }, [ventasEnRango]);

  // Pie por método de pago: distribución Efectivo/Tarjeta en el rango
  const pieMetodo = useMemo(() => {
    const map = new Map<"Efectivo" | "Tarjeta", number>();
    ventasEnRango.forEach(v => map.set(v.metodo, (map.get(v.metodo) || 0) + v.totalQ));
    const arr = [...map.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
    return arr.length ? arr : [{ name: "Sin datos", value: 1 }];
  }, [ventasEnRango]);

  /* ---------- Tabla agregada por producto ---------- */
  type RowAgg = { producto: string; categoria: Categoria; unidades: number; ventaQ: number; cogsQ: number; gananciaQ: number; };
  const tablaProductosBase: RowAgg[] = useMemo(() => {
    const map = new Map<string, RowAgg>();
    ventasFiltradas.forEach(v => {
      const row = map.get(v.producto) || {
        producto: v.producto,
        categoria: v.categoria,
        unidades: 0,
        ventaQ: 0,
        cogsQ: 0,
        gananciaQ: 0,
      };
      row.unidades += v.cantidad;
      row.ventaQ   += v.totalQ;
      row.cogsQ    += v.cogsQ;
      row.gananciaQ = row.ventaQ - row.cogsQ;
      map.set(v.producto, row);
    });
    return [...map.values()];
  }, [ventasFiltradas]);

  // Orden + paginación
  type SortKey = "producto" | "categoria" | "unidades" | "ventaQ" | "cogsQ" | "gananciaQ";
  const [sortBy, setSortBy] = useState<SortKey>("ventaQ");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const tablaOrdenada = useMemo(() => {
    const copy = [...tablaProductosBase];
    copy.sort((a, b) => {
      const A = a[sortBy], B = b[sortBy];
      const r = (A < B ? -1 : A > B ? 1 : 0);
      return sortDir === "asc" ? r : -r;
    });
    return copy;
  }, [tablaProductosBase, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(tablaOrdenada.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const tablaPaginada = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return tablaOrdenada.slice(start, start + pageSize);
  }, [tablaOrdenada, pageClamped, pageSize]);

  // Top 5 (estrategia) tomando SIEMPRE el total del rango (no los filtros globales)
  const tablaEstrategia: RowAgg[] = useMemo(() => {
    const map = new Map<string, RowAgg>();
    ventasEnRango.forEach(v => {
      const row = map.get(v.producto) || {
        producto: v.producto,
        categoria: v.categoria,
        unidades: 0,
        ventaQ: 0,
        cogsQ: 0,
        gananciaQ: 0,
      };
      row.unidades += v.cantidad;
      row.ventaQ   += v.totalQ;
      row.cogsQ    += v.cogsQ;
      row.gananciaQ = row.ventaQ - row.cogsQ;
      map.set(v.producto, row);
    });
    return [...map.values()];
  }, [ventasEnRango]);

  const topVendidos = useMemo(() => {
    const filtered = tablaEstrategia.filter(r => topVendidosFiltro === "Todas" ? true : r.categoria === topVendidosFiltro);
    return [...filtered].sort((a,b)=> b.unidades - a.unidades).slice(0,5).map(r=>({name:r.producto, value:r.unidades}));
  }, [tablaEstrategia, topVendidosFiltro]);

  const topRentables = useMemo(() => {
    const filtered = tablaEstrategia.filter(r => topRentablesFiltro === "Todas" ? true : r.categoria === topRentablesFiltro);
    return [...filtered].sort((a,b)=> b.gananciaQ - a.gananciaQ).slice(0,5).map(r=>({name:r.producto, value:Math.round(r.gananciaQ*100)/100}));
  }, [tablaEstrategia, topRentablesFiltro]);

  /* ---------- Export (CSV / PDF) del estado filtrado y ORDENADO ---------- */
  function exportCSV() {
    const headers = ["Producto","Categoría","Unidades","Venta Total","COGS","Ganancia"];
    const lines = [headers.join(",")];
    tablaOrdenada.forEach(r=>{
      lines.push([
        `"${r.producto.replace(/"/g,'""')}"`,
        r.categoria,
        r.unidades,
        r.ventaQ.toFixed(2),
        r.cogsQ.toFixed(2),
        r.gananciaQ.toFixed(2),
      ].join(","));
    });
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reporte_productos.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const rangoTxt = `${ini.toLocaleDateString("es-GT")} – ${fin.toLocaleDateString("es-GT")}`;
    const kpiHtml = `
      <table style="width:100%; border-collapse:collapse; margin:8px 0; font-size:12px">
        <tr>
          <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">Venta Total</th>
          <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">Costo de Ventas</th>
          <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">Ganancia Bruta</th>
          <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">Gastos Operativos</th>
          <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">Ganancia Neta</th>
        </tr>
        <tr>
          <td style="padding:6px; border:1px solid #e5e7eb">${q(ventaTotal)}</td>
          <td style="padding:6px; border:1px solid #e5e7eb">${q(cogsTotal)}</td>
          <td style="padding:6px; border:1px solid #e5e7eb">${q(gBruta)}</td>
          <td style="padding:6px; border:1px solid #e5e7eb">${q(gastosOper)}</td>
          <td style="padding:6px; border:1px solid #e5e7eb">${q(gNeta)}</td>
        </tr>
      </table>
    `;
    const rowsHtml = tablaOrdenada.map((r,i)=>`
      <tr>
        <td style="padding:6px; border:1px solid #e5e7eb">${i+1}</td>
        <td style="padding:6px; border:1px solid #e5e7eb">${r.producto}</td>
        <td style="padding:6px; border:1px solid #e5e7eb">${r.categoria}</td>
        <td style="padding:6px; border:1px solid #e5e7eb; text-align:right">${r.unidades}</td>
        <td style="padding:6px; border:1px solid #e5e7eb; text-align:right">${q(r.ventaQ)}</td>
        <td style="padding:6px; border:1px solid #e5e7eb; text-align:right">${q(r.cogsQ)}</td>
        <td style="padding:6px; border:1px solid #e5e7eb; text-align:right">${q(r.gananciaQ)}</td>
      </tr>
    `).join("");

    const html = `
<!doctype html><html><head><meta charset="utf-8"/>
<title>Reportes</title>
<style>
body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;margin:16px;color:#111}
h1{margin:0 0 4px 0} .muted{color:#6b7280; font-size:12px}
table{font-size:12px}
@media print { .no-print{display:none} }
</style></head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px">
    <div>
      <h1>Reportes</h1>
      <div class="muted">Rango: ${rangoTxt}</div>
    </div>
    <div class="muted">${new Date().toLocaleString()}</div>
  </div>
  <h3 style="margin:12px 0 6px 0">KPIs</h3>
  ${kpiHtml}
  <h3 style="margin:14px 0 6px 0">Productos (según filtros)</h3>
  <table style="width:100%; border-collapse:collapse">
    <thead>
      <tr>
        <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">#</th>
        <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">Producto</th>
        <th style="text-align:left; padding:6px; border:1px solid #e5e7eb">Categoría</th>
        <th style="text-align:right; padding:6px; border:1px solid #e5e7eb">Unidades</th>
        <th style="text-align:right; padding:6px; border:1px solid #e5e7eb">Venta</th>
        <th style="text-align:right; padding:6px; border:1px solid #e5e7eb">COGS</th>
        <th style="text-align:right; padding:6px; border:1px solid #e5e7eb">Ganancia</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || `<tr><td colspan="7" style="padding:10px;color:#6b7280">Sin datos</td></tr>`}</tbody>
  </table>
  <script>setTimeout(()=>window.print(),300)</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open(); w.document.write(html); w.document.close();
  }

  /* ========================= UI ========================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header compacto */}
      <div className="w-full max-w-7xl mx-auto mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm font-semibold"
            >
              ← Regresar
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">Reportes</h1>
              <div className="text-xs text-gray-500">Estado general y rentabilidad</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="h-10 px-3 rounded-md border bg-white hover:bg-gray-50 text-sm">CSV</button>
            <button onClick={exportPDF} className="h-10 px-3 rounded-md text-white text-sm" style={{ background:"#10B981" }}>PDF</button>
          </div>
        </div>

        {/* Filtros GLOBALes */}
        <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 mr-1">Periodo:</span>
            {(["hoy","ayer","30d","rango"] as Periodo[]).map(p=>(
              <button
                key={p}
                onClick={()=>setPeriodo(p)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  periodo===p ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                }`}
              >
                {p==="hoy"?"Hoy":p==="ayer"?"Ayer":p==="30d"?"Últimos 30 días":"Rango"}
              </button>
            ))}

            {periodo==="rango" && (
              <div className="flex items-center gap-2 ml-1">
                <input type="date" value={rangoInicio} onChange={(e)=>setRangoInicio(e.target.value)} className="h-9 rounded-md border border-gray-200 px-2 text-sm" />
                <span className="text-gray-500 text-sm">a</span>
                <input type="date" value={rangoFin} onChange={(e)=>setRangoFin(e.target.value)} className="h-9 rounded-md border border-gray-200 px-2 text-sm" />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <select 
                className="h-9 rounded-md border border-gray-200 px-2 text-sm" 
                value={catGlobal} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCatGlobal(e.target.value as FiltroCategoria)}
              >
                <option value="Todas">Todas</option>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                className="h-9 rounded-md border border-gray-200 px-2 text-sm" 
                value={metodoGlobal} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetodoGlobal(e.target.value as FiltroMetodo)}
              >
                <option value="Todos">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
              <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                placeholder="Buscar producto…"
                className="h-9 w-48 rounded-md border border-gray-200 px-2 text-sm"
              />
              <button
                onClick={()=>{ setCatGlobal("Todas"); setMetodoGlobal("Todos"); setSearch(""); }}
                className="h-9 px-3 rounded-md border bg-white hover:bg-gray-50 text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards compactas */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label:"VENTA TOTAL",  value:q(ventaTotal) },
          { label:"COSTO DE VENTAS", value:q(cogsTotal) },
          { label:"GANANCIA BRUTA", value:q(gBruta) },
          { label:"GASTOS OPERATIVOS", value:q(gastosOper) },
          { label:"GANANCIA NETA", value:q(gNeta) },
        ].map((c,i)=>(
          <div key={i} className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div className="text-sm tracking-wide text-gray-500 font-semibold">{c.label}</div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Gráficas: Pie Categoría + Pie Método (lado a lado) */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-800">Distribución por Categoría</h3>
            <span className="text-xs text-gray-500">{ini.toLocaleDateString("es-GT")} – {fin.toLocaleDateString("es-GT")}</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieCategoria} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {pieCategoria.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number|string, n: string)=>[q(Number(v)), n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-800">Métodos de Pago</h3>
            <span className="text-xs text-gray-500">{ini.toLocaleDateString("es-GT")} – {fin.toLocaleDateString("es-GT")}</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieMetodo} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {pieMetodo.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number|string, n: string)=>[q(Number(v)), n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Estrategia: Top 5 más vendidos / Top 5 más rentables */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-800">Top 5 Productos Más Vendidos (unidades)</h3>
              <select
                className="h-8 rounded-md border border-gray-200 px-2 text-sm"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTopVendidosFiltro(e.target.value as FiltroCategoria)}
                value={topVendidosFiltro}
              >
                <option value="Todas">Todas</option>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVendidos} margin={{left:10,right:10,top:10,bottom:10}}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-800">Top 5 Productos Más Rentables (Q)</h3>
              <select
                className="h-8 rounded-md border border-gray-200 px-2 text-sm"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTopRentablesFiltro(e.target.value as FiltroCategoria)}
                value={topRentablesFiltro}
              >
                <option value="Todas">Todas</option>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRentables} margin={{left:10,right:10,top:10,bottom:10}}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number | string)=>q(Number(v))} />
                <Bar dataKey="value" fill="#10B981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Tabla interactiva con orden y paginación */}
      <div className="w-full max-w-7xl mx-auto mt-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Productos (según filtros globales)</h3>
            <div className="text-xs text-gray-500">
              {ini.toLocaleDateString("es-GT")} – {fin.toLocaleDateString("es-GT")}
            </div>
          </div>

          <div className="px-4 py-3 flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600">Ordenar por:</label>
            <select
              className="h-9 rounded-md border border-gray-200 px-2 text-sm"
              value={sortBy}
              onChange={(e)=>setSortBy(e.target.value as SortKey)}
            >
              <option value="producto">Producto</option>
              <option value="categoria">Categoría</option>
              <option value="unidades">Unidades</option>
              <option value="ventaQ">Venta</option>
              <option value="cogsQ">COGS</option>
              <option value="gananciaQ">Ganancia</option>
            </select>
            <select
              className="h-9 rounded-md border border-gray-200 px-2 text-sm"
              value={sortDir}
              onChange={(e)=>setSortDir(e.target.value as "asc" | "desc")}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-600">Filas:</label>
              <select
                className="h-9 rounded-md border border-gray-200 px-2 text-sm"
                value={pageSize}
                onChange={(e)=>{ setPage(1); setPageSize(Number(e.target.value)); }}
              >
                {[5,8,10,20].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-left">Categoría</th>
                  <th className="px-3 py-2 text-right">Unidades</th>
                  <th className="px-3 py-2 text-right">Venta</th>
                  <th className="px-3 py-2 text-right">COGS</th>
                  <th className="px-3 py-2 text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tablaPaginada.length ? tablaPaginada.map((r,idx)=>(
                  <tr key={`${r.producto}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{(pageClamped-1)*pageSize + idx + 1}</td>
                    <td className="px-3 py-2">{r.producto}</td>
                    <td className="px-3 py-2">{r.categoria}</td>
                    <td className="px-3 py-2 text-right">{r.unidades}</td>
                    <td className="px-3 py-2 text-right">{q(r.ventaQ)}</td>
                    <td className="px-3 py-2 text-right">{q(r.cogsQ)}</td>
                    <td className="px-3 py-2 text-right">{q(r.gananciaQ)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">Sin datos para los filtros actuales.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* paginación */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Página {pageClamped} de {totalPages} • {tablaOrdenada.length} registros
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                onClick={()=>setPage(1)}
                disabled={pageClamped===1}
              >
                « Primero
              </button>
              <button
                className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                onClick={()=>setPage(p=>Math.max(1,p-1))}
                disabled={pageClamped===1}
              >
                ‹ Prev
              </button>
              <button
                className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                disabled={pageClamped===totalPages}
              >
                Next ›
              </button>
              <button
                className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                onClick={()=>setPage(totalPages)}
                disabled={pageClamped===totalPages}
              >
                Última »
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
};

export default Reportes;
