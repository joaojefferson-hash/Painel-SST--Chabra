"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, KanbanSquare, Plus, CalendarClock, Search, X, CheckSquare, LayoutList, CalendarDays, GanttChartSquare, SlidersHorizontal, Tags, Tag, Zap, Repeat, Settings, ChevronDown, Clock } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useCanEdit } from "@/lib/hooks/useUsuario";
import {
  useQuadros, useTarefas, useReordenar, useUsuariosLista, useSalvarTarefa,
  usePreferenciaVisao, useSalvarPreferenciaVisao,
  useStatusQuadro, statusPadrao, useCamposQuadro, useEtiquetasQuadro,
  useEspacos, usePastas, useTodasDependencias, useAutomacaoRunner, useTempoQuadro,
  iniciais, corAvatar, formatarDuracao,
  PRIORIDADES,
  type GestaoTarefa, type StatusTarefa, type VistaGestao, type AgruparPor, type GestaoStatus, type GestaoNotificacao, type PrioridadeTarefa,
} from "@/lib/hooks/useGestao";
import GestaoSidebar from "@/components/gestao/GestaoSidebar";
import NotificacoesSino from "@/components/gestao/NotificacoesSino";
import TarefaModal from "@/components/gestao/TarefaModal";
import StatusManagerModal from "@/components/gestao/StatusManagerModal";
import CamposManagerModal from "@/components/gestao/CamposManagerModal";
import AutomacoesManagerModal from "@/components/gestao/AutomacoesManagerModal";
import TempoRelatorioModal from "@/components/gestao/TempoRelatorioModal";
import EtiquetasManagerModal from "@/components/gestao/EtiquetasManagerModal";
import { formatarCampoValor } from "@/components/gestao/CampoInput";
import VistaLista from "@/components/gestao/VistaLista";
import VistaCalendario from "@/components/gestao/VistaCalendario";
import VistaTimeline from "@/components/gestao/VistaTimeline";

const corPrioridade = (p: string) => PRIORIDADES.find((x) => x.value === p)?.cor ?? "#94a3b8";
function diasAte(iso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00").getTime() - hoje.getTime()) / 86_400_000);
}
function fmtPrazo(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

const VISTAS: { value: VistaGestao; label: string; icon: typeof KanbanSquare }[] = [
  { value: "quadro", label: "Quadro", icon: KanbanSquare },
  { value: "lista", label: "Lista", icon: LayoutList },
  { value: "calendario", label: "Calendário", icon: CalendarDays },
  { value: "timeline", label: "Timeline", icon: GanttChartSquare },
];

export default function GestaoChabraPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const podeEditar = useCanEdit();
  const { data: quadros = [], isLoading: loadingQuadros } = useQuadros();
  const { data: espacos = [] } = useEspacos();
  const { data: pastas = [] } = usePastas();
  const { data: usuarios = [] } = useUsuariosLista();
  const reordenar = useReordenar();

  const [quadroId, setQuadroId] = useState<string | null>(null);
  const quadro = quadros.find((q) => q.id_quadro === quadroId) ?? quadros[0] ?? null;
  useEffect(() => {
    if (!quadroId && quadros.length) setQuadroId(quadros[0].id_quadro);
  }, [quadros, quadroId]);

  const { data: tarefas = [], isLoading: loadingTarefas } = useTarefas(quadro?.id_quadro);
  const { data: pref } = usePreferenciaVisao(quadro?.id_quadro);
  const salvarPref = useSalvarPreferenciaVisao();
  const { data: statusList = [], isLoading: loadingStatus } = useStatusQuadro(quadro?.id_quadro);
  const { data: campos = [] } = useCamposQuadro(quadro?.id_quadro);
  const { data: etiquetasCat = [] } = useEtiquetasQuadro(quadro?.id_quadro);
  const { data: dependencias = [] } = useTodasDependencias();
  const runAuto = useAutomacaoRunner(quadro?.id_quadro);
  const salvar = useSalvarTarefa();
  const { data: tempoEntries = [] } = useTempoQuadro(quadro?.id_quadro, tarefas.map((t) => t.id_tarefa));
  const etiquetaCor = useMemo(() => new Map(etiquetasCat.map((e) => [e.nome, e.cor])), [etiquetasCat]);

  const [items, setItems] = useState<GestaoTarefa[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [colHover, setColHover] = useState<StatusTarefa | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<GestaoTarefa | null>(null);
  const [statusNovo, setStatusNovo] = useState<StatusTarefa>("A_FAZER");

  const [busca, setBusca] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [filtroPrio, setFiltroPrio] = useState("");
  const [vista, setVista] = useState<VistaGestao>("quadro");
  const [agruparPor, setAgruparPor] = useState<AgruparPor | null>(null);
  const [soMinhas, setSoMinhas] = useState(false);
  const [dropAlvo, setDropAlvo] = useState<{ col: StatusTarefa; beforeId: string | null } | null>(null);

  const [managerOpen, setManagerOpen] = useState(false);
  const [camposOpen, setCamposOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [etiquetasOpen, setEtiquetasOpen] = useState(false);
  const [quadroAgrupar, setQuadroAgrupar] = useState<"status" | "responsavel" | "prioridade" | "etiqueta">("status");

  useEffect(() => {
    if (user?.perfil === "Cliente") router.replace("/portal-cliente/inicio");
  }, [user?.perfil, router]);

  useEffect(() => setItems(tarefas), [tarefas]);

  // Aplica a preferência de visão salva (por usuário/quadro).
  useEffect(() => {
    if (pref) { setVista(pref.vista); setAgruparPor(pref.agrupar_por); }
  }, [pref]);

  function mudarVista(v: VistaGestao) {
    setVista(v);
    if (quadro) salvarPref.mutate({ id_quadro: quadro.id_quadro, vista: v, agrupar_por: agruparPor });
  }
  function mudarAgrupar(a: AgruparPor | null) {
    setAgruparPor(a);
    if (quadro) salvarPref.mutate({ id_quadro: quadro.id_quadro, vista, agrupar_por: a });
  }

  const etiquetasSugeridas = useMemo(
    () => [...new Set([...etiquetasCat.map((e) => e.nome), ...items.flatMap((t) => t.etiquetas ?? [])])].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items, etiquetasCat],
  );

  const tempoPorTarefa = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of tempoEntries) {
      const seg = e.fim ? (e.segundos ?? 0) : Math.max(0, Math.round((Date.now() - new Date(e.inicio).getTime()) / 1000));
      m.set(e.id_tarefa, (m.get(e.id_tarefa) ?? 0) + seg);
    }
    return m;
  }, [tempoEntries]);

  const temFiltro = !!(busca.trim() || filtroResp || filtroPrio || soMinhas);
  const passaFiltro = (t: GestaoTarefa) => {
    if (soMinhas && (t.responsavel ?? "") !== (user?.nome ?? "")) return false;
    if (filtroResp && (t.responsavel ?? "") !== filtroResp) return false;
    if (filtroPrio && t.prioridade !== filtroPrio) return false;
    const q = busca.trim().toLowerCase();
    if (q) {
      const valoresCampos = Object.values(t.campos ?? {}).map((v) => (Array.isArray(v) ? v.join(" ") : v ?? "")).join(" ");
      const hay = `${t.titulo} ${t.descricao ?? ""} ${t.responsavel ?? ""} ${(t.etiquetas ?? []).join(" ")} ${valoresCampos}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const statuses = useMemo<GestaoStatus[]>(
    () => (statusList.length ? statusList : quadro ? statusPadrao(quadro.id_quadro) : []),
    [statusList, quadro],
  );
  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.slug, s])), [statuses]);
  const statusInicialSlug = statuses.find((s) => s.tipo === "nao_iniciado")?.slug ?? statuses[0]?.slug ?? "A_FAZER";

  // Colunas do Kanban = status do quadro + quaisquer slugs órfãos presentes nas tarefas (nada some).
  const colunasDef = useMemo<GestaoStatus[]>(() => {
    const conhecidos = new Set(statuses.map((s) => s.slug));
    const extras = [...new Set(items.map((t) => t.status))].filter((slug) => !conhecidos.has(slug));
    return [
      ...statuses,
      ...extras.map((slug, i) => ({ id: slug, id_quadro: quadro?.id_quadro ?? "", slug, nome: slug, cor: "#cbd5e1", ordem: 9990 + i, tipo: "ativo" as const })),
    ];
  }, [statuses, items, quadro]);

  // Grupos do Quadro: por status (default) ou por responsável/prioridade/etiqueta.
  const gruposQuadro = useMemo<{ slug: string; nome: string; cor: string }[]>(() => {
    if (quadroAgrupar === "status") return colunasDef.map((c) => ({ slug: c.slug, nome: c.nome, cor: c.cor }));
    if (quadroAgrupar === "prioridade") return PRIORIDADES.map((p) => ({ slug: p.value, nome: p.label, cor: p.cor }));
    if (quadroAgrupar === "responsavel") {
      const nomes = [...new Set(items.map((t) => t.responsavel).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR"));
      return [...nomes.map((n) => ({ slug: n, nome: n, cor: corAvatar(n) })), { slug: "__none__", nome: "Sem responsável", cor: "#cbd5e1" }];
    }
    const tags = [...new Set(items.flatMap((t) => t.etiquetas ?? []))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [...tags.map((tg) => ({ slug: tg, nome: tg, cor: etiquetaCor.get(tg) ?? "#94a3b8" })), { slug: "__none__", nome: "Sem etiqueta", cor: "#cbd5e1" }];
  }, [quadroAgrupar, colunasDef, items, etiquetaCor]);

  const porGrupo = useMemo(() => {
    const pertence = (t: GestaoTarefa, chave: string) => {
      if (quadroAgrupar === "status") return t.status === chave;
      if (quadroAgrupar === "prioridade") return t.prioridade === chave;
      if (quadroAgrupar === "responsavel") return (t.responsavel || "__none__") === chave;
      return chave === "__none__" ? (t.etiquetas?.length ?? 0) === 0 : (t.etiquetas ?? []).includes(chave);
    };
    const m: Record<string, GestaoTarefa[]> = {};
    for (const g of gruposQuadro) {
      m[g.slug] = items.filter((t) => pertence(t, g.slug));
      m[g.slug].sort(quadroAgrupar === "status"
        ? (a, b) => a.ordem - b.ordem || a.created_at.localeCompare(b.created_at)
        : (a, b) => a.created_at.localeCompare(b.created_at));
    }
    return m;
  }, [gruposQuadro, items, quadroAgrupar]);

  function novaTarefa(status: StatusTarefa) {
    setEditando(null);
    setStatusNovo(status);
    setModalOpen(true);
  }

  function abrirNotif(n: GestaoNotificacao) {
    if (n.id_quadro) setQuadroId(n.id_quadro);
    if (n.id_tarefa) {
      const t = items.find((x) => x.id_tarefa === n.id_tarefa);
      if (t) { setEditando(t); setModalOpen(true); }
    }
  }

  function soltar(targetStatus: StatusTarefa, beforeId?: string) {
    setColHover(null);
    setDropAlvo(null);
    const dragged = items.find((t) => t.id_tarefa === dragId);
    setDragId(null);
    if (!dragged || !podeEditar) return;
    const rest = items.filter((t) => t.id_tarefa !== dragId);
    const col = rest.filter((t) => t.status === targetStatus).sort((a, b) => a.ordem - b.ordem);
    const fora = rest.filter((t) => t.status !== targetStatus);
    let idx = col.length;
    if (beforeId && beforeId !== dragId) {
      const i = col.findIndex((t) => t.id_tarefa === beforeId);
      if (i >= 0) idx = i;
    }
    col.splice(idx, 0, { ...dragged, status: targetStatus });
    const reindex = col.map((t, i) => ({ ...t, ordem: i }));
    setItems([...fora, ...reindex]);
    reordenar.mutate(reindex.map((t) => ({ id_tarefa: t.id_tarefa, status: targetStatus, ordem: t.ordem })));
    if (dragged.status !== targetStatus) {
      runAuto({ gatilho: "status_muda", tarefa: { ...dragged, status: targetStatus }, de: dragged.status, para: targetStatus });
    }
  }

  // Soltar num grupo: por status reaproveita soltar(); nos demais, define o campo do grupo.
  function soltarGrupo(chave: string, beforeId?: string) {
    if (quadroAgrupar === "status") { soltar(chave, beforeId); return; }
    setColHover(null);
    const dragged = items.find((t) => t.id_tarefa === dragId);
    setDragId(null);
    if (!dragged || !podeEditar) return;
    const base = { id_tarefa: dragged.id_tarefa, id_quadro: dragged.id_quadro };
    if (quadroAgrupar === "prioridade") salvar.mutate({ ...base, prioridade: chave as PrioridadeTarefa });
    else if (quadroAgrupar === "responsavel") salvar.mutate({ ...base, responsavel: chave === "__none__" ? null : chave });
  }

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      {/* Menu lateral fixo (verde, igual ao app) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col lg:flex print:hidden" style={{ background: "linear-gradient(180deg, #1a3d26 0%, #112a1a 60%, #0d2016 100%)" }}>
        <Link href="/visao-geral" className="flex items-center gap-2.5 border-b border-white/[0.09] px-4 py-3.5 transition-colors hover:bg-white/[0.05]">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-verde-primary text-white shadow"><KanbanSquare className="size-4" /></span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-bold tracking-tight text-white">Gestão Chabra</p>
            <p className="inline-flex items-center gap-1 text-[10px] tracking-wide text-white/50"><ArrowLeft className="size-3" /> Visão geral</p>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">Espaços</p>
          <GestaoSidebar espacos={espacos} pastas={pastas} quadros={quadros} quadroId={quadro?.id_quadro ?? null} onSelect={setQuadroId} podeEditar={podeEditar} />
        </div>
      </aside>

      {/* Conteúdo: desloca pela sidebar e ocupa toda a largura restante */}
      <div className="lg:pl-64">
        <div className="px-5 py-7 sm:px-8">
          <Link href="/visao-geral" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 lg:hidden">
            <ArrowLeft className="size-4" /> Visão geral
          </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-verde-light text-verde-primary">
              <KanbanSquare className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quadro?.nome ?? "Gestão Chabra"}</h1>
              <p className="text-sm text-gray-500">{items.length} tarefa(s) nesta lista</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificacoesSino onAbrir={abrirNotif} />
            {podeEditar && (
              <button type="button" onClick={() => novaTarefa(statusInicialSlug)} className="inline-flex items-center gap-2 rounded-xl bg-verde-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-verde-accent active:scale-95">
                <Plus className="size-4" /> Nova tarefa
              </button>
            )}
          </div>
        </div>

        {/* Seletor de lista (mobile, já que a árvore fica oculta em telas pequenas) */}
        <div className="mt-4 lg:hidden">
          <select value={quadro?.id_quadro ?? ""} onChange={(e) => setQuadroId(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            {quadros.map((q) => <option key={q.id_quadro} value={q.id_quadro}>{q.nome}</option>)}
          </select>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar tarefa…" className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-verde-primary focus:outline-none" />
          </div>
          <select value={filtroResp} onChange={(e) => setFiltroResp(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-verde-primary focus:outline-none">
            <option value="">Todos os responsáveis</option>
            {usuarios.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filtroPrio} onChange={(e) => setFiltroPrio(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-verde-primary focus:outline-none">
            <option value="">Toda prioridade</option>
            {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {user?.nome && (
            <button type="button" onClick={() => setSoMinhas((v) => !v)} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${soMinhas ? "bg-verde-primary text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
              Minhas
            </button>
          )}
          {temFiltro && (
            <button type="button" onClick={() => { setBusca(""); setFiltroResp(""); setFiltroPrio(""); setSoMinhas(false); }} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
              <X className="size-4" /> Limpar
            </button>
          )}
          <div className="inline-flex flex-wrap rounded-lg border border-gray-200 bg-white p-0.5 text-sm font-medium sm:ml-auto">
            {VISTAS.map((v) => {
              const Icon = v.icon;
              return (
                <button key={v.value} type="button" onClick={() => mudarVista(v.value)} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 ${vista === v.value ? "bg-verde-primary text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                  <Icon className="size-4" /> {v.label}
                </button>
              );
            })}
          </div>
          {podeEditar && (
            <div className="relative">
              <button type="button" onClick={() => setConfigOpen((v) => !v)} title="Configurar quadro" className="relative z-40 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Settings className="size-4" /> Configurar <ChevronDown className="size-3.5 text-gray-400" />
              </button>
              {configOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setConfigOpen(false)} />
                  <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button type="button" onClick={() => { setConfigOpen(false); setManagerOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><SlidersHorizontal className="size-4 text-gray-400" /> Status</button>
                    <button type="button" onClick={() => { setConfigOpen(false); setCamposOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Tags className="size-4 text-gray-400" /> Campos personalizados</button>
                    <button type="button" onClick={() => { setConfigOpen(false); setEtiquetasOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Tag className="size-4 text-gray-400" /> Etiquetas</button>
                    <button type="button" onClick={() => { setConfigOpen(false); setAutoOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Zap className="size-4 text-gray-400" /> Automações</button>
                    <button type="button" onClick={() => { setConfigOpen(false); setRelatorioOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Clock className="size-4 text-gray-400" /> Relatório de tempo</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {vista === "quadro" && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Agrupar:</span>
            {([["status", "Status"], ["responsavel", "Responsável"], ["prioridade", "Prioridade"], ["etiqueta", "Etiqueta"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setQuadroAgrupar(v)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${quadroAgrupar === v ? "bg-verde-primary text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}>
                {l}
              </button>
            ))}
          </div>
        )}

        {(loadingQuadros || loadingTarefas || loadingStatus) ? (
          <div className="mt-5 flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-72 shrink-0 rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-16 animate-pulse rounded-lg bg-white" />
                  <div className="h-16 animate-pulse rounded-lg bg-white" />
                </div>
              </div>
            ))}
          </div>
        ) : vista === "quadro" ? (
          <div className="relative mt-5">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {gruposQuadro.map((col) => {
              const todas = porGrupo[col.slug] ?? [];
              const lista = todas.filter(passaFiltro);
              const atrasadasCol = todas.filter((t) => t.prazo && diasAte(t.prazo) < 0 && statusMap.get(t.status)?.tipo !== "concluido").length;
              const tempoCol = todas.reduce((s, t) => s + (tempoPorTarefa.get(t.id_tarefa) ?? 0), 0);
              return (
                <div
                  key={col.slug}
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setColHover(col.slug); setDropAlvo({ col: col.slug, beforeId: null }); } }}
                  onDragLeave={(e) => { if (dragId && !e.currentTarget.contains(e.relatedTarget as Node)) setColHover((c) => (c === col.slug ? null : c)); }}
                  onDrop={() => soltarGrupo(col.slug)}
                  className={`flex w-72 shrink-0 flex-col rounded-xl border bg-gray-50/60 p-2.5 transition ${colHover === col.slug ? "border-verde-primary ring-2 ring-verde-primary/20" : "border-gray-200"}`}
                  style={{ minHeight: "calc(100vh - 15rem)" }}
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: col.cor }} />
                      <p className="text-sm font-semibold text-gray-700">{col.nome}</p>
                      <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold text-gray-600">{temFiltro ? `${lista.length}/${todas.length}` : todas.length}</span>
                      {atrasadasCol > 0 && <span className="rounded-full bg-red-50 px-1.5 text-[11px] font-semibold text-red-600" title="Atrasadas">{atrasadasCol} atras.</span>}
                      {tempoCol > 0 && <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400" title="Tempo total"><Clock className="size-3" />{formatarDuracao(tempoCol)}</span>}
                    </div>
                    {podeEditar && (
                      <button type="button" onClick={() => novaTarefa(quadroAgrupar === "status" ? col.slug : statusInicialSlug)} className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700" title="Nova tarefa aqui">
                        <Plus className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="min-h-[40px] flex-1 space-y-2">
                    {lista.map((t) => {
                      const dias = t.prazo ? diasAte(t.prazo) : null;
                      const concluido = statusMap.get(t.status)?.tipo === "concluido";
                      const atrasada = dias != null && dias < 0 && !concluido;
                      const subs = t.subtarefas ?? [];
                      const subFeitas = subs.filter((s) => s.feito).length;
                      return (
                        <div key={t.id_tarefa}>
                          {quadroAgrupar === "status" && dropAlvo?.col === col.slug && dropAlvo.beforeId === t.id_tarefa && dragId !== t.id_tarefa && (
                            <div className="mb-2 h-1 rounded-full bg-verde-primary/70" />
                          )}
                          <div
                            draggable={podeEditar && quadroAgrupar !== "etiqueta"}
                            onDragStart={() => setDragId(t.id_tarefa)}
                            onDragEnd={() => { setDragId(null); setColHover(null); setDropAlvo(null); }}
                            onDragOver={(e) => { if (dragId) { e.preventDefault(); e.stopPropagation(); setColHover(col.slug); setDropAlvo({ col: col.slug, beforeId: t.id_tarefa }); } }}
                            onDrop={(e) => { e.stopPropagation(); soltarGrupo(col.slug, t.id_tarefa); }}
                            onClick={() => { setEditando(t); setModalOpen(true); }}
                            style={{ borderLeftColor: corPrioridade(t.prioridade) }}
                            className={`cursor-pointer rounded-lg border border-l-4 border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md ${dragId === t.id_tarefa ? "rotate-1 opacity-40" : ""}`}
                          >
                            <p className={`text-sm font-medium ${concluido ? "text-gray-400 line-through" : "text-gray-800"}`}>{t.titulo}</p>
                            {(t.etiquetas ?? []).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {(t.etiquetas ?? []).map((e) => {
                                  const cor = etiquetaCor.get(e);
                                  return (
                                    <span key={e} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={cor ? { background: cor, color: "#fff" } : { background: "#f3f4f6", color: "#6b7280" }}>{e}</span>
                                  );
                                })}
                              </div>
                            )}
                            {(() => {
                              const chips = campos
                                .filter((c) => c.tipo === "checkbox" || c.tipo === "selecao" || c.tipo === "moeda")
                                .map((c) => ({ c, v: (t.campos ?? {})[c.id] }))
                                .filter(({ c, v }) => (c.tipo === "checkbox" ? v === true : v != null && v !== ""));
                              return chips.length > 0 ? (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {chips.map(({ c, v }) => (
                                    <span key={c.id} className="rounded bg-verde-light/60 px-1.5 py-0.5 text-[10px] font-medium text-verde-primary" title={c.nome}>
                                      {c.tipo === "checkbox" ? c.nome : formatarCampoValor(c, v)}
                                    </span>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                            {subs.length > 0 && (
                              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                                <div className="h-1 rounded-full bg-verde-primary transition-all" style={{ width: `${Math.round((subFeitas / subs.length) * 100)}%` }} />
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              {t.prazo && (
                                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${atrasada ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                                  <CalendarClock className="size-3" /> {fmtPrazo(t.prazo)}
                                </span>
                              )}
                              {subs.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500" title="Subtarefas">
                                  <CheckSquare className="size-3" /> {subFeitas}/{subs.length}
                                </span>
                              )}
                              {t.recorrencia && (
                                <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-gray-500" title="Recorrente">
                                  <Repeat className="size-3" />
                                </span>
                              )}
                              {(tempoPorTarefa.get(t.id_tarefa) ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500" title="Tempo registrado">
                                  <Clock className="size-3" /> {formatarDuracao(tempoPorTarefa.get(t.id_tarefa)!)}
                                </span>
                              )}
                              {t.responsavel && (
                                <span className="ml-auto flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: corAvatar(t.responsavel) }} title={t.responsavel}>
                                  {iniciais(t.responsavel)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {quadroAgrupar === "status" && dropAlvo?.col === col.slug && dropAlvo.beforeId === null && dragId && (
                      <div className="h-1 rounded-full bg-verde-primary/70" />
                    )}
                    {lista.length === 0 && (
                      <div className="rounded-lg border border-dashed border-gray-200 px-2 py-6 text-center text-xs text-gray-300">{todas.length > 0 ? "Nada no filtro" : "Sem tarefas"}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#f6f5f2] to-transparent" />
          </div>
        ) : vista === "lista" ? (
          <VistaLista
            tarefas={items.filter(passaFiltro)}
            statuses={statuses}
            campos={campos}
            agruparPor={agruparPor}
            onAgruparPor={mudarAgrupar}
            podeEditar={podeEditar}
            onAbrir={(t) => { setEditando(t); setModalOpen(true); }}
            aoMudarStatus={(t, de, para) => runAuto({ gatilho: "status_muda", tarefa: { ...t, status: para }, de, para })}
          />
        ) : vista === "calendario" ? (
          <VistaCalendario
            tarefas={items.filter(passaFiltro)}
            statuses={statuses}
            podeEditar={podeEditar}
            onAbrir={(t) => { setEditando(t); setModalOpen(true); }}
          />
        ) : (
          <VistaTimeline
            tarefas={items.filter(passaFiltro)}
            statuses={statuses}
            dependencias={dependencias}
            onAbrir={(t) => { setEditando(t); setModalOpen(true); }}
          />
        )}

        {podeEditar && vista === "quadro" && (
          <p className="mt-3 text-center text-xs text-gray-400">
            {quadroAgrupar === "etiqueta"
              ? "Agrupado por etiqueta — arraste desabilitado neste modo."
              : `Arraste os cards entre as colunas para mudar ${quadroAgrupar === "responsavel" ? "o responsável" : quadroAgrupar === "prioridade" ? "a prioridade" : "o status"}.`}
          </p>
        )}
        </div>
      </div>

      {quadro && (
        <TarefaModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          idQuadro={quadro.id_quadro}
          tarefa={editando}
          statusInicial={statusNovo}
          statuses={statuses}
          campos={campos}
          tarefasQuadro={items}
          podeEditar={podeEditar}
          etiquetasSugeridas={etiquetasSugeridas}
          aoAutomatizar={runAuto}
        />
      )}

      {quadro && (
        <StatusManagerModal
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
          idQuadro={quadro.id_quadro}
          statuses={statuses}
          podeEditar={podeEditar}
        />
      )}

      {quadro && (
        <CamposManagerModal
          open={camposOpen}
          onClose={() => setCamposOpen(false)}
          idQuadro={quadro.id_quadro}
          campos={campos}
          podeEditar={podeEditar}
        />
      )}

      {quadro && (
        <AutomacoesManagerModal
          open={autoOpen}
          onClose={() => setAutoOpen(false)}
          idQuadro={quadro.id_quadro}
          statuses={statuses}
          campos={campos}
          podeEditar={podeEditar}
        />
      )}

      <TempoRelatorioModal open={relatorioOpen} onClose={() => setRelatorioOpen(false)} entries={tempoEntries} />

      {quadro && (
        <EtiquetasManagerModal
          open={etiquetasOpen}
          onClose={() => setEtiquetasOpen(false)}
          idQuadro={quadro.id_quadro}
          etiquetas={etiquetasCat}
          podeEditar={podeEditar}
        />
      )}
    </div>
  );
}
