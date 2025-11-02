/* ===============================================
 * AUDITORÍA DE INVENTARIO (CONTEO FÍSICO)
 * - Filtros estilo Catálogo (arriba)
 * - Tabs: Operativos / Perpetuos (se elimina "Todos")
 * - Paginación inferior: "Mostrando N de Y · Por página [10] · Anterior 1/7 Siguiente"
 * - Abre el modal de "Iniciar Auditoría" automáticamente si no hay sesión
 * =============================================== */

import React, { useEffect, useMemo, useRef, useState } from "react";
import "../Inventario.css";
import "./Auditoria.css";
import { MdCheckCircle, MdEventNote, MdErrorOutline } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { PiBroomBold } from "react-icons/pi";
import { useAuth } from "../../../../hooks/useAuth";
import { supabase } from "../../../../api/supabaseClient";

/* ======================= Tipos ======================= */
type Row = {
  id_insumo: number;
  insumo: string;
  categoria: string | null;
  unidad: string | null;
  tipo_insumo: "operativo" | "perpetuo" | "desconocido";
  esperado: number;
  contado: number | null;
  diferencia: number;
  estado: "pendiente" | "contado";
  observacion: string;
  fue_contado?: boolean | null;
  id_tipo_ajuste: number | null;
  causa_nombre: string | null;
};

type VwUiConteoDetalleRow = {
  id_insumo: number | null;
  insumo: string | null;
  categoria: string | null;
  unidad_medida: string | null;
  tipo_insumo: string | null;
  esperado: number | null;
  contado: number | null;
  diferencia: number | null;
  estado: string | null;
  fue_contado: boolean | null;
};

// Mock de causas/ajustes (puedes sustituir por tu tabla real)
const TIPOS_AJUSTE = [
  { id: 1, nombre: "Merma (Dañado/Vencido)", tipo: "salida", aplica_a: "operativo" },
  { id: 2, nombre: "Faltante (Pérdida/Robo)", tipo: "salida", aplica_a: "operativo" },
  { id: 3, nombre: "Consumo Operativo (Gasto)", tipo: "salida", aplica_a: "perpetuo" },
  { id: 4, nombre: "Sobrante (Conteo)", tipo: "entrada", aplica_a: "todos" },
  { id: 5, nombre: "Error de Sistema", tipo: "entrada", aplica_a: "todos" },
];

type AuditoriaProps = {
  initialSessionId?: string;
  auditorName?: string;
};

/* ======================= Seed (demo) ======================= */
const SEED_ROWS: Row[] = [
  { id_insumo: 1, insumo: "Pan para Shuco",        categoria: "Panadería", unidad: "u",  tipo_insumo: "operativo",  esperado: 120, contado: 118,  diferencia: -2,  estado: "contado",   observacion: "Se quemaron 2", fue_contado: true, id_tipo_ajuste: 1, causa_nombre: "Merma (Dañado/Vencido)" },
  { id_insumo: 2, insumo: "Carne Asada (libra)",   categoria: "Cárnicos",   unidad: "lb", tipo_insumo: "operativo",  esperado: 25,  contado: 25.5, diferencia: 0.5, estado: "contado",   observacion: "Sobrante",      fue_contado: true, id_tipo_ajuste: 4, causa_nombre: "Sobrante (Conteo)" },
  { id_insumo: 3, insumo: "Chorizo",               categoria: "Cárnicos",   unidad: "u",  tipo_insumo: "operativo",  esperado: 70,  contado: null, diferencia: 0,   estado: "pendiente", observacion: "",      fue_contado: false, id_tipo_ajuste: null, causa_nombre: null },
  { id_insumo: 4, insumo: "Servilletas (paquete)", categoria: "Desechables", unidad: "u",  tipo_insumo: "perpetuo",   esperado: 5,   contado: 3,    diferencia: -2,  estado: "contado",   observacion: "Gasto del día", fue_contado: true, id_tipo_ajuste: 3, causa_nombre: "Consumo Operativo (Gasto)" },
  { id_insumo: 5, insumo: "Bolsas para llevar",    categoria: "Desechables", unidad: "u",  tipo_insumo: "perpetuo",   esperado: 100, contado: null, diferencia: 0,   estado: "pendiente", observacion: "",      fue_contado: false, id_tipo_ajuste: null, causa_nombre: null },
  { id_insumo: 6, insumo: "Ketchup (Botella)",     categoria: "Salsas",      unidad: "u",  tipo_insumo: "perpetuo",   esperado: 10,  contado: 10,   diferencia: 0,   estado: "contado",   observacion: "",      fue_contado: true, id_tipo_ajuste: null, causa_nombre: null },
];

/* ============ Utilidades comunes ============ */
function getDefaultStartDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
function csvEscape(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function buildPrintHtml(title: string, tableHtml: string, subtitle?: string) {
  const fecha = new Date().toLocaleString();
  return `<!doctype html><html><head><meta charset="utf-8"/>
<title>${title}</title>
<style>
:root { color-scheme: light; }
body{font-family: Arial, Helvetica, sans-serif; color:#111; margin:20px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.brand{display:flex;gap:12px;align-items:center}
.brand img{height:56px}
h2{margin:0 0 4px 0}.meta{font-size:13px;color:#444}
table{width:100%;border-collapse:collapse;margin-top:12px; margin-bottom: 24px;}
th,td{padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:13px; vertical-align: top;}
th{background:#f3f4f6;color:#111}tbody tr:nth-child(even){background:#fbfbfb}
.footer{margin-top:16px;font-size:12px;color:#666}@media print{ .no-print{display:none} }
h3.table-title{margin: 24px 0 8px 0; font-size: 1.1em; color: #333;}
</style></head>
<body>
<div class="header">
  <div class="brand"><img src="/img/logo.png"/><div><h2>${title}</h2><div class="meta">${subtitle ?? ""}</div></div></div>
  <div style="text-align:right"><div class="meta">Fecha: ${fecha}</div></div>
</div>
${tableHtml}
<div class="footer">Generado desde Shucway - Auditoría</div>
<script>setTimeout(function(){ window.print(); }, 350);</script>
</body></html>`;
}

function openPrintWindow(html: string) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

function calcDiferencia(r: Row): Row {
  const c = r.contado;
  const diff = typeof c === "number" ? Number((c - r.esperado).toFixed(2)) : 0;
  const counted = typeof c === "number";
  const esCero = !counted || diff === 0;
  return {
    ...r,
    diferencia: counted ? diff : 0,
    estado: counted ? "contado" : "pendiente",
    fue_contado: r.fue_contado ?? counted,
    id_tipo_ajuste: esCero ? null : r.id_tipo_ajuste,
    causa_nombre: esCero ? null : r.causa_nombre,
  };
}

function isVolumetricUnit(u?: string | null): boolean {
  if (!u) return false;
  const v = u.toLowerCase();
  return ["lb", "kg", "lt", "l", "ml", "g"].includes(v);
}

/* ===== Helpers seguros ===== */
function readString(obj: unknown, key: string): string | null {
  if (obj && typeof obj === "object" && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === "string") return val;
  }
  return null;
}
function getUserId(u: unknown): string | null {
  const direct =
    readString(u, "id") ?? readString(u, "userId") ?? readString(u, "uid");
  if (direct) return direct;
  if (u && typeof u === "object" && "profile" in u) {
    const p = (u as Record<string, unknown>)["profile"];
    if (p && typeof p === "object") {
      const idp = readString(p, "id_perfil");
      if (idp) return idp;
    }
  }
  return null;
}
function getUserDisplayName(u: unknown, fallback?: string): string {
  if (u && typeof u === "object" && "user_metadata" in u) {
    const meta = (u as Record<string, unknown>)["user_metadata"];
    if (meta && typeof meta === "object") {
      const fn = readString(meta, "full_name");
      if (fn) return fn;
    }
  }
  return (
    readString(u, "name") ??
    readString(u, "username") ??
    readString(u, "email") ??
    fallback ??
    "—"
  );
}

/* =================== Componente =================== */
const Auditoria: React.FC<AuditoriaProps> = ({ initialSessionId, auditorName }) => {
  const { user } = useAuth();

  // Sesión
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [sessionDate, setSessionDate] = useState<string | undefined>();
  const [sessionLabel, setSessionLabel] = useState<string | undefined>();

  // Estado UI
  const [rows, setRows] = useState<Row[]>(() => SEED_ROWS.map(calcDiferencia));

  // ===== Tabs (sin "Todos") =====
  const TABS = [
    { id: "operativos", label: "Solo Operativos" },
    { id: "perpetuos", label: "Solo Perpetuos" },
  ] as const;
  type TabId = (typeof TABS)[number]["id"];
  const [activeTab, setActiveTab] = useState<TabId>("operativos");

  // Filtros
  const [categoria, setCategoria] = useState<string>("Todas las categorías");
  const [term, setTerm] = useState<string>("");

  const categoriasOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.categoria && r.categoria.trim()) set.add(r.categoria); });
    return ["Todas las categorías", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const clearFilters = () => {
    setActiveTab("operativos");
    setCategoria("Todas las categorías");
    setTerm("");
  };

  // ===== Export modal =====
  const [showExport, setShowExport] = useState(false);

  // ===== Modal "Iniciar Auditoría" =====
  const [showStartModal, setShowStartModal] = useState(false);
  const [auditLabel, setAuditLabel] = useState("Auditoría Quincenal");
  const [auditStartDate, setAuditStartDate] = useState(() => getDefaultStartDate(14));
  const [auditEndDate, setAuditEndDate] = useState(() => getTodayDate());

  // Abre modal de bienvenida auto si no hay sesión
  useEffect(() => {
    if (!initialSessionId) setShowStartModal(true);
  }, [initialSessionId]);

  // ===== Modal "Finalizar" =====
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [optComentario, setOptComentario] = useState<string>("");
  const [isStarting, setIsStarting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Notificación
  const [notif, setNotif] = useState<{ type: "info" | "success" | "error"; msg: string } | null>(null);
  const notify = (type: "info" | "success" | "error", msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 2600);
  };
  const detectedName = getUserDisplayName(user, auditorName);

  // Refs
  const lastLoadAbort = useRef<AbortController | null>(null);

  /* ============== Derivados / filtros ============== */
  const baseFilteredRows = useMemo(() => {
    let r = [...rows];
    if (categoria !== "Todas las categorías") {
      r = r.filter((x) => (x.categoria ?? "").toLowerCase() === categoria.toLowerCase());
    }
    const q = term.trim().toLowerCase();
    if (q) {
      r = r.filter(
        (x) =>
          x.insumo.toLowerCase().includes(q) ||
          (x.categoria ?? "").toLowerCase().includes(q) ||
          (x.unidad ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [rows, categoria, term]);

  const operativosRows = useMemo(
    () => baseFilteredRows.filter((r) => r.tipo_insumo === "operativo"),
    [baseFilteredRows]
  );
  const perpetuosRows = useMemo(
    () => baseFilteredRows.filter((r) => r.tipo_insumo === "perpetuo" || r.tipo_insumo === "desconocido"),
    [baseFilteredRows]
  );

  // ===== Contadores y totales SOLO del tab activo =====
  const totalCount = useMemo(
    () => (activeTab === "operativos" ? operativosRows.length : perpetuosRows.length),
    [activeTab, operativosRows.length, perpetuosRows.length]
  );
  const counted = useMemo(() => {
    const list = activeTab === "operativos" ? operativosRows : perpetuosRows;
    return list.filter((r) => typeof r.contado === "number").length;
  }, [activeTab, operativosRows, perpetuosRows]);
  const discrepancies = useMemo(() => {
    const list = activeTab === "operativos" ? operativosRows : perpetuosRows;
    return list.filter((r) => Math.abs(r.diferencia) !== 0 && r.id_tipo_ajuste != null).length;
  }, [activeTab, operativosRows, perpetuosRows]);

  // ===== Paginación =====
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Cambios de filtros/tabs reinician a página 1
  useEffect(() => { setPage(1); }, [activeTab, categoria, term]);

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;

  const currentTabData = activeTab === "operativos" ? operativosRows : perpetuosRows;
  const pageRows = useMemo(
    () => currentTabData.slice(startIdx, endIdx),
    [currentTabData, startIdx, endIdx]
  );

  /* ============== Carga ============== */
  async function loadRows(search: string) {
    try {
      lastLoadAbort.current?.abort();
      const ac = new AbortController();
      lastLoadAbort.current = ac;

      const { data, error } = await supabase
        .from("vw_ui_conteo_detalle")
        .select(
          "id_insumo, insumo, categoria, unidad_medida, tipo_insumo, esperado, contado, diferencia, estado, fue_contado"
        )
        .eq("id_conteo", sessionId)
        .ilike("insumo", `%${search}%`)
        .limit(500);

      if (error || !Array.isArray(data)) {
        setRows(
          SEED_ROWS.filter((r) => r.insumo.toLowerCase().includes(search.trim().toLowerCase())).map(
            calcDiferencia
          )
        );
        return;
      }

      const mapped: Row[] = (data as VwUiConteoDetalleRow[]).map((d) => {
        const contado = d?.contado == null ? null : Number(d.contado);
        const tipo: Row["tipo_insumo"] =
          String(d?.tipo_insumo).toLowerCase() === "operativo"
            ? "operativo"
            : String(d?.tipo_insumo).toLowerCase() === "perpetuo"
            ? "perpetuo"
            : "desconocido";
        return {
          id_insumo: Number(d?.id_insumo ?? 0),
          insumo: String(d?.insumo ?? ""),
          categoria: d?.categoria ?? null,
          unidad: d?.unidad_medida ?? null,
          tipo_insumo: tipo,
          esperado: Number(d?.esperado ?? 0),
          contado,
          diferencia: Number(d?.diferencia ?? 0),
          estado:
            String(d?.estado ?? "pendiente").toLowerCase() === "contado"
              ? "contado"
              : "pendiente",
          observacion: "",
          fue_contado: typeof d?.fue_contado === "boolean" ? d.fue_contado : contado != null,
          id_tipo_ajuste: null,
          causa_nombre: null,
        };
      });
      setRows(mapped.map(calcDiferencia));
    } catch {
      setRows(
        SEED_ROWS.filter((r) => r.insumo.toLowerCase().includes(search.trim().toLowerCase())).map(
          calcDiferencia
        )
      );
    }
  }

  useEffect(() => {
    if (!sessionId) return;
    const t = setTimeout(() => {
      void loadRows(term);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, sessionId]);

  /* ============== Handlers ============== */
  function handleConteoChange(id_insumo: number, value: string) {
    const v = value === "" ? null : Number(value);
    setRows((prev) =>
      prev.map((r) =>
        r.id_insumo === id_insumo ? calcDiferencia({ ...r, contado: v, fue_contado: v != null }) : r
      )
    );
  }

  function handleNotasChange(id_insumo: number, value: string) {
    setRows((prev) => prev.map((r) => (r.id_insumo === id_insumo ? { ...r, observacion: value } : r)));
  }

  function handleCausaChange(id_insumo: number, value: string) {
    const selectedId = Number(value) || null;
    const causa = TIPOS_AJUSTE.find((c) => c.id === selectedId);
    setRows((prev) =>
      prev.map((r) =>
        r.id_insumo === id_insumo
          ? {
              ...r,
              id_tipo_ajuste: causa?.id ?? null,
              causa_nombre: causa?.nombre ?? null,
            }
          : r
      )
    );
  }

  async function handleBlurSave(id_insumo: number) {
    const row = rows.find((r) => r.id_insumo === id_insumo);
    if (!row) return;

    if (!sessionId) {
      notify("info", "Sesión demo: cambios guardados localmente.");
      return;
    }
    const { error } = await supabase.rpc("fn_conteo_registrar_linea", {
      p_id_conteo: sessionId,
      p_id_insumo: row.id_insumo,
      p_contado: row.contado,
      p_observacion: row.observacion,
    });
    if (error)
      notify(
        "error",
        `Error guardando línea: ${String((error as { message?: string }).message ?? error)}`
      );
    else notify("success", "Línea guardada.");
  }

  async function startAudit() {
    setIsStarting(true);
    const etiqueta = `${auditLabel} (${auditStartDate} al ${auditEndDate})`;

    try {
      const { data, error } = await supabase.rpc("fn_conteo_iniciar", {
        p_ambito: "todos",
        p_id_categoria: null,
        p_etiqueta: etiqueta,
        p_frecuencia: "ad-hoc",
        p_id_perfil: getUserId(user),
      });
      if (error) {
        const demoId = `demo-${Date.now()}`;
        setSessionId(demoId);
        setSessionDate(new Date().toISOString());
        setSessionLabel(etiqueta);
        notify("info", "Sesión demo iniciada.");
      } else {
        const created = (data as { id_conteo?: string; fecha_creacion?: string }) || {};
        setSessionId(created.id_conteo);
        setSessionDate(created.fecha_creacion);
        setSessionLabel(etiqueta);
        notify("success", "Auditoría iniciada.");
      }
      setShowStartModal(false);
    } catch {
      const demoId = `demo-${Date.now()}`;
      setSessionId(demoId);
      setSessionDate(new Date().toISOString());
      setSessionLabel(etiqueta);
      notify("info", "Sesión demo iniciada.");
    } finally {
      setIsStarting(false);
    }
  }

  function markNoDiff() {
    setRows((prev) =>
      prev.map((r) => calcDiferencia({ ...r, contado: r.esperado, fue_contado: true }))
    );
    notify("info", "Se marcaron todos los ítems como sin diferencias.");
  }

  function resetConteo() {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        contado: null,
        diferencia: 0,
        estado: "pendiente",
        fue_contado: false,
        id_tipo_ajuste: null,
        causa_nombre: null,
      }))
    );
    notify("info", "Conteos reiniciados.");
  }

  function exportCSV() {
    const headers = [
      "Insumo",
      "Categoría",
      "Unidad",
      "Tipo",
      "Esperado",
      "Conteo Físico",
      "Diferencia",
      "Causa",
      "Notas",
    ];
    const out: string[] = [headers.map(csvEscape).join(",")];
    const src = activeTab === "operativos" ? operativosRows : perpetuosRows;
    src.forEach((r) => {
      out.push(
        [
          r.insumo,
          r.categoria ?? "",
          r.unidad ?? "",
          r.tipo_insumo,
          r.esperado,
          r.contado ?? "",
          r.diferencia,
          r.causa_nombre ?? "",
          r.observacion,
        ]
          .map(csvEscape)
          .join(",")
      );
    });
    const blob = new Blob([out.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_inventario_${sessionId ?? "reporte"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  function exportPDF() {
    const makeTableHtml = (title: string, data: Row[]) => {
      if (data.length === 0) return "";
      const headerHtml = `<thead><tr>
        <th>Insumo</th><th>Categoría</th><th>Unidad</th>
        <th>Esperado</th><th>Conteo Físico</th><th>Diferencia</th><th>Causa</th><th>Notas</th>
      </tr></thead>`;
      const bodyHtml = `<tbody>${data
        .map(
          (r) => `
        <tr><td>${r.insumo}</td><td>${r.categoria ?? ""}</td><td>${r.unidad ?? ""}</td>
        <td>${r.esperado}</td><td>${r.contado ?? ""}</td><td>${r.diferencia}</td>
        <td>${r.causa_nombre ?? ""}</td><td>${r.observacion}</td></tr>
      `
        )
        .join("")}</tbody>`;
      return `<h3 class="table-title">${title}</h3><table>${headerHtml}${bodyHtml}</table>`;
    };

    const tableHtml =
      activeTab === "operativos"
        ? makeTableHtml("Insumos Operativos (Merma/Ajuste)", operativosRows)
        : makeTableHtml("Insumos Perpetuos (Consumo)", perpetuosRows);

    const subtitle = `Auditor: ${detectedName} · Sesión: ${sessionId ?? "—"}${
      sessionDate ? " · " + new Date(sessionDate).toLocaleString() : ""
    }`;
    const html = buildPrintHtml("Auditoría de Inventario", tableHtml, subtitle);
    setShowExport(false);
    openPrintWindow(html);
  }

  async function finalizeAudit() {
    if (!sessionId) {
      notify("info", "Sesión demo: se generará únicamente el resumen imprimible.");
    }
    setIsFinalizing(true);

    try {
      const diffsFinal = rows.filter(
        (r) => typeof r.contado === "number" && r.diferencia !== 0 && r.id_tipo_ajuste != null
      );
      const diffsIgnoradas = rows.filter(
        (r) => typeof r.contado === "number" && r.diferencia !== 0 && r.id_tipo_ajuste == null
      );

      // Encabezado
      let idEncabezado: number | null = null;
      if (sessionId) {
        const descripcionCierre = [sessionLabel || `Auditoría ${sessionId}`, optComentario.trim()]
          .filter(Boolean)
          .join(" - ");

        const { data: encData, error: encErr } = await supabase
          .from("movimiento_encabezado")
          .insert({
            modulo_origen: "CONTEO_FISICO",
            descripcion: descripcionCierre,
            id_perfil: getUserId(user),
            id_referencia: sessionId,
          })
          .select("id_encabezado")
          .single();
        if (!encErr) {
          idEncabezado = (encData as { id_encabezado?: number } | null)?.id_encabezado ?? null;
        } else {
          notify("error", "No se pudo crear el encabezado de movimiento. Se continuará con el resumen.");
        }
      }

      // Líneas
      if (sessionId && idEncabezado && diffsFinal.length > 0) {
        const lineas = diffsFinal.map((r) => {
          const diff = r.diferencia;
          const tipo = diff > 0 ? "ENTRADA" : "SALIDA";
          const comentarioLinea = `[${r.causa_nombre ?? "Ajuste"}] ${r.observacion || `Conteo ${sessionId}`}`;
          return {
            id_encabezado: idEncabezado as number,
            id_insumo: r.id_insumo,
            cantidad: Math.abs(diff),
            tipo_movimiento: tipo,
            unidad: r.unidad ?? null,
            comentario: comentarioLinea,
          };
        });

        const { error: lineErr } = await supabase.from("movimiento_linea").insert(lineas);
        if (lineErr) {
          notify("error", "No se pudieron registrar las líneas de movimiento. Se continuará con el resumen.");
        } else {
          notify("success", `${diffsFinal.length} movimientos registrados.`);
        }
      } else if (diffsFinal.length === 0) {
        notify("info", "No hay diferencias justificadas para registrar.");
      }

      // Resumen imprimible
      const allDiffs = [...diffsFinal, ...diffsIgnoradas];
      const headerHtml =
        `<thead><tr><th>Insumo</th><th>Tipo</th><th>Esperado</th><th>Conteo</th><th>Diferencia</th><th>Estado</th><th>Causa/Notas</th></tr></thead>`;
      const bodyHtml = `<tbody>${allDiffs
        .map((d) => {
          const esRegistrada = d.id_tipo_ajuste != null;
          return `
          <tr style="${!esRegistrada ? "color:#777; background:#f9f9f9;" : ""}">
            <td>${d.insumo}</td>
            <td>${d.tipo_insumo}</td>
            <td>${d.esperado}</td>
            <td>${d.contado ?? ""}</td>
            <td>${d.diferencia.toFixed(2)}</td>
            <td>${esRegistrada ? "APLICADO" : "IGNORADO (Sin Causa)"}</td>
            <td><b>${d.causa_nombre ?? ""}</b> ${d.observacion}</td>
          </tr>`;
        })
        .join("")}</tbody>`;

      const tableHtml =
        allDiffs.length > 0 ? `<table>${headerHtml}${bodyHtml}</table>` : "<p>No hay diferencias.</p>";

      const pdfSubtitle = [`Sesión: ${sessionLabel ?? sessionId}`, optComentario ? `Motivo: ${optComentario}` : ""]
        .filter(Boolean)
        .join(" · ");

      const summaryHtml = buildPrintHtml("Resumen de Ajuste - Auditoría", tableHtml, pdfSubtitle);
      openPrintWindow(summaryHtml);

      // Reset UI
      setShowFinalizeModal(false);
      setSessionId(undefined);
      setSessionDate(undefined);
      setSessionLabel(undefined);
      setTerm("");
      setRows(SEED_ROWS.map(calcDiferencia));
      setAuditLabel("Auditoría Quincenal");
      setAuditStartDate(getDefaultStartDate(14));
      setAuditEndDate(getTodayDate());
      setOptComentario("");
      clearFilters();
      notify("success", "Auditoría finalizada.");
    } catch {
      notify("error", "Error al finalizar la auditoría.");
    } finally {
      setIsFinalizing(false);
    }
  }

  /* ============== Render helpers ============== */
  function causasAplicables(row: Row) {
    const tipoDiff = row.diferencia > 0 ? "entrada" : "salida";
    return TIPOS_AJUSTE.filter(
      (c) => (c.aplica_a === "todos" || c.aplica_a === row.tipo_insumo) && c.tipo === tipoDiff
    );
  }

  function renderTable(data: Row[], title: string) {
    return (
      <>
        <h3 className="auditoria-table-title">{title}</h3>
        {data.length > 0 ? (
          <div className="auditoria-table">
            <table className="inv-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Unidad</th>
                  <th>Esperado</th>
                  <th>Conteo Físico</th>
                  <th>Diferencia</th>
                  <th>Causa (si aplica)</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const isCounted = !!(r.fue_contado || r.contado != null);
                  const step = isVolumetricUnit(r.unidad) ? 0.01 : 1;
                  const hasDiff = isCounted && r.diferencia !== 0;
                  const causas = hasDiff ? causasAplicables(r) : [];

                  return (
                    <tr key={r.id_insumo}>
                      <td>
                        {r.insumo}
                        <div style={{ fontSize: "0.8em", color: "#666" }}>{r.categoria ?? ""}</div>
                      </td>
                      <td>{r.unidad ?? ""}</td>
                      <td>{r.esperado}</td>
                      <td>
                        <input
                          type="number"
                          step={step}
                          value={r.contado ?? ""}
                          onChange={(e) => handleConteoChange(r.id_insumo, e.target.value)}
                          onBlur={() => handleBlurSave(r.id_insumo)}
                          className={`p-1 border rounded w-28 ${isCounted ? "counted" : ""}`}
                          style={isCounted ? { background: "#ecfdf5", borderColor: "#a7f3d0" } : undefined}
                        />
                      </td>
                      <td>
                        <span
                          className={`diff-cell ${
                            hasDiff ? (r.diferencia > 0 ? "diff-positive" : "diff-negative") : "diff-zero"
                          }`}
                        >
                          {isCounted
                            ? r.diferencia > 0
                              ? `+${r.diferencia.toFixed(2)}`
                              : r.diferencia.toFixed(2)
                            : ""}
                        </span>
                      </td>

                      <td>
                        {hasDiff ? (
                          <select
                            value={r.id_tipo_ajuste ?? ""}
                            onChange={(e) => handleCausaChange(r.id_insumo, e.target.value)}
                            className="p-1 border rounded w-full"
                            style={{ minWidth: "150px" }}
                          >
                            <option value="">-- Justificar diferencia --</option>
                            {causas.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: "#999" }}>—</span>
                        )}
                      </td>

                      <td>
                        <input
                          className="p-1 border rounded w-full"
                          placeholder="Observaciones"
                          value={r.observacion}
                          onChange={(e) => handleNotasChange(r.id_insumo, e.target.value)}
                          onBlur={() => handleBlurSave(r.id_insumo)}
                          style={{ minWidth: "150px" }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-4 mt-2 mb-4 text-center text-gray-500 text-sm">
            No hay insumos para mostrar (o no coinciden con los filtros).
          </div>
        )}
      </>
    );
  }

  /* ============== Render ============== */
  return (
    <div className="inv-list">
      <h3>AUDITORÍA DE INVENTARIO (CONTEO FÍSICO)</h3>

      {/* Notificación */}
      {notif && (
        <div style={{ position: "fixed", right: 18, top: 70, zIndex: 99999 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 12px",
              borderRadius: 999,
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 6px 18px rgba(16,24,40,0.06)",
              minWidth: 220,
              maxWidth: 360,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: notif.type === "success" ? "#16a34a" : notif.type === "error" ? "#dc2626" : "#2563eb",
              }}
            />
            <div style={{ fontSize: 13, color: "#111", flex: 1 }}>{notif.msg}</div>
            <button
              aria-label="Cerrar"
              onClick={() => setNotif(null)}
              style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: 14, padding: "6px 8px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cards resumen */}
      <div className="auditoria-top">
        <div className="auditoria-cards">
          <div className="audit-card audit-success">
            <div>
              <div className="small">Sesión de Auditoría</div>
              <div className="big">
                {sessionId ? (
                  <>
                    {sessionLabel ? <span title={`ID: ${sessionId}`}>{sessionLabel}</span> : sessionId}
                    {sessionDate && (
                      <span className="text-xs text-gray-500"> · {new Date(sessionDate).toLocaleString()}</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Sin sesión asignada</span>
                )}
              </div>
            </div>
            <div className="audit-icon" aria-hidden>
              <MdCheckCircle size={20} />
            </div>
          </div>
          <div className="audit-card audit-count">
            <div>
              <div className="small">Items Contados (tab activo)</div>
              <div className="big">
                {counted}/{totalCount}
              </div>
            </div>
            <div className="audit-icon" aria-hidden>
              <MdEventNote size={20} />
            </div>
          </div>
          <div className="audit-card audit-danger">
            <div>
              <div className="small">Discrepancias (Justificadas)</div>
              <div className="big">{discrepancies}</div>
            </div>
            <div className="audit-icon" aria-hidden>
              <MdErrorOutline size={20} />
            </div>
          </div>
          <div className="audit-card audit-user">
            <div>
              <div className="small">Auditor</div>
              <div className="big">{detectedName}</div>
            </div>
            <div className="audit-icon" aria-hidden>
              <FaUserCircle size={20} />
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="auditoria-actions-wrapper">
          <div className="auditoria-actions">
            {sessionId ? (
              <button className="btn primary" onClick={() => setShowFinalizeModal(true)} disabled={isFinalizing}>
                {isFinalizing ? "Aplicando..." : "Finalizar Auditoría"}
              </button>
            ) : (
              <button className="btn primary" onClick={() => setShowStartModal(true)} disabled={isStarting}>
                {isStarting ? "Iniciando..." : "Iniciar Auditoría"}
              </button>
            )}
            <button className="btn secondary" onClick={markNoDiff}>
              Marcar Sin Diferencias
            </button>
            <button className="btn outline" onClick={() => setShowExport(true)}>
              Exportar Resultados
            </button>
            <button className="btn ghost" onClick={resetConteo}>
              Reiniciar Conteo
            </button>
          </div>
        </div>
      </div>

      {/* ==== FILTROS SUPERIORES ==== */}
      {sessionId && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Tabs (solo 2) */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Categoría */}
              <label className="sr-only" htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
              >
                {categoriasOptions.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Buscar */}
              <div className="relative">
                <label className="sr-only" htmlFor="search">Buscar</label>
                <input
                  id="search"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Buscar insumos…"
                  className="h-10 w-64 rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Limpiar */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="h-10 rounded-lg border px-3 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
                title="Limpiar filtros"
              >
                <PiBroomBold />
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla según TAB activo (paginada) */}
      {sessionId ? (
        <div>
          {activeTab === "operativos"
            ? renderTable(pageRows, "Insumos Operativos (Merma/Ajuste)")
            : renderTable(pageRows, "Insumos Perpetuos (Consumo)")}

          {/* ==== PAGINACIÓN INFERIOR ==== */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{pageRows.length}</span> de{" "}
                <span className="font-semibold">{totalCount}</span> insumos
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">Por página</div>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>

                <button
                  className="btn outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={{ minWidth: 90 }}
                >
                  Anterior
                </button>

                <div className="text-sm text-gray-700" style={{ minWidth: 48, textAlign: "center" }}>
                  {currentPage} / {pageCount}
                </div>

                <button
                  className="btn outline"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  style={{ minWidth: 90 }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 mt-4 text-center text-gray-600">
          Inicia una auditoría para ver el <b>Detalle del Conteo</b>.
        </div>
      )}

      {/* Modal Exportar */}
      {showExport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 280, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <h4 style={{ marginBottom: 16 }}>Exportar Reporte</h4>
            <button className="btn primary" style={{ marginBottom: 8, width: "100%" }} onClick={exportCSV}>
              Descargar CSV (tab activo)
            </button>
            <button className="btn secondary" style={{ marginBottom: 8, width: "100%" }} onClick={exportPDF}>
              Imprimir / Guardar como PDF
            </button>
            <button className="btn ghost" style={{ width: "100%" }} onClick={() => setShowExport(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Finalizar */}
      {showFinalizeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 12px 28px rgba(16,24,40,0.14)",
            }}
          >
            <h4 className="text-lg font-semibold mb-3">Finalizar Auditoría</h4>

            <p className="text-gray-600 mb-3">
              Se registrarán todas las diferencias que hayan sido justificadas con una "Causa". Las
              diferencias sin causa serán ignoradas.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1">Comentario de cierre (Opcional)</label>
              <textarea
                rows={3}
                value={optComentario}
                onChange={(e) => setOptComentario(e.target.value)}
                className="w-full p-2 rounded border"
                placeholder="Ej: Cierre semanal..."
              />
            </div>

            <div className="mt-4 flex gap-8 justify-end">
              <button className="btn ghost" onClick={() => setShowFinalizeModal(false)}>
                Cancelar
              </button>
              <button className="btn primary" disabled={isFinalizing} onClick={finalizeAudit}>
                {isFinalizing ? "Aplicando..." : "Confirmar Cierre"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Iniciar */}
      {showStartModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 12px 28px rgba(16,24,40,0.14)",
            }}
          >
            <h4 className="text-lg font-semibold mb-3">Iniciar Nueva Auditoría</h4>

            <p className="text-gray-600 mb-4">
              Define el período que cubrirá esta auditoría. Esto es usado para calcular el consumo de
              perpetuos.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Etiqueta (Nombre)</label>
                <input
                  type="text"
                  value={auditLabel}
                  onChange={(e) => setAuditLabel(e.target.value)}
                  className="w-full p-2 rounded border"
                  placeholder="Ej: Auditoría Quincenal"
                />
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-medium mb-1">Fecha Inicio Período</label>
                  <input
                    type="date"
                    value={auditStartDate}
                    onChange={(e) => setAuditStartDate(e.target.value)}
                    className="w-full p-2 rounded border"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-medium mb-1">Fecha Fin Período</label>
                  <input
                    type="date"
                    value={auditEndDate}
                    onChange={(e) => setAuditEndDate(e.target.value)}
                    className="w-full p-2 rounded border"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-8 justify-end">
              <button className="btn ghost" onClick={() => setShowStartModal(false)}>
                Cancelar
              </button>
              <button className="btn primary" disabled={isStarting} onClick={startAudit}>
                {isStarting ? "Iniciando..." : "Confirmar e Iniciar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auditoria;
