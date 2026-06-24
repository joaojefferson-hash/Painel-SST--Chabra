"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, KanbanSquare, Plus, CalendarClock, Search, X, CheckSquare, LayoutList, CalendarDays, GanttChartSquare, SlidersHorizontal, Tags, Zap, Repeat, Settings, ChevronDown } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useCanEdit } from "@/lib/hooks/useUsuario";
import {
  useQuadros, useTarefas, useReordenar, useUsuariosLista,
  usePreferenciaVisao, useSalvarPreferenciaVisao,
  useStatusQuadro, statusPadrao, useCamposQuadro,
  useEspacos, usePastas, useTodasDependencias, useAutomacaoRunner,
  iniciais, corAvatar,
  PRIORIDADES,
  type GestaoTarefa, type StatusTarefa, type VistaGestao, type AgruparPor, type GestaoStatus, type GestaoNotificacao,
} from "@/lib/hooks/useGestao";
import GestaoSidebar from "@/components/gestao/GestaoSidebar";
import NotificacoesSino from "@/components/gestao/NotificacoesSino";
import TarefaModal from "@/components/gestao/TarefaModal";
import StatusManagerModal from "@/components/gestao/StatusManagerModal";
import CamposManagerModal from "@/components/gestao/CamposManagerModal";
import AutomacoesManagerModal from "@/components/gestao/AutomacoesManagerModal";
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
  const { data: dependencias = [] } = useTodasDependencias();
  const runAuto = useAutomacaoRunner(quadro?.id_quadro);

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
    () => [...new Set(items.flatMap((t) => t.etiquetas ?? []))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items],
  );

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

  const colunas = useMemo(() => {
    const m: Record<string, GestaoTarefa[]> = {};
    for (const s of colunasDef) m[s.slug] = [];
    for (const t of items) (m[t.status] ??= []).push(t);
    for (const k of Object.keys(m)) m[k].sort((a, b) => a.ordem - b.ordem || a.created_at.localeCompare(b.created_at));
    return m;
  }, [items, colunasDef]);

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

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <Link href="/visao-geral" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="size-4" /> Visão geral
        </Link>

        <div className="flex gap-5">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2">
              <p className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Espaços</p>
              <GestaoSidebar espacos={espacos} pastas={pastas} quadros={quadros} quadroId={quadro?.id_quadro ?? null} onSelect={setQuadroId} podeEditar={podeEditar} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
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
              <button type="button" onClick={() => setConfigOpen((v) => !v)} title="Configurar quadro" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Settings className="size-4" /> Configurar <ChevronDown className="size-3.5 text-gray-400" />
              </button>
              {configOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setConfigOpen(false)} />
                  <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button type="button" onClick={() => { setConfigOpen(false); setManagerOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><SlidersHorizontal className="size-4 text-gray-400" /> Status</button>
                    <button type="button" onClick={() => { setConfigOpen(false); setCamposOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Tags className="size-4 text-gray-400" /> Campos personalizados</button>
                    <button type="button" onClick={() => { setConfigOpen(false); setAutoOpen(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Zap className="size-4 text-gray-400" /> Automações</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

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
            {colunasDef.map((col) => {
              const todas = colunas[col.slug] ?? [];
              const lista = todas.filter(passaFiltro);
              return (
                <div
                  key={col.slug}
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setColHover(col.slug); setDropAlvo({ col: col.slug, beforeId: null }); } }}
                  onDragLeave={(e) => { if (dragId && !e.currentTarget.contains(e.relatedTarget as Node)) setColHover((c) => (c === col.slug ? null : c)); }}
                  onDrop={() => soltar(col.slug)}
                  className={`w-72 shrink-0 rounded-xl border bg-gray-50/60 p-2.5 transition ${colHover === col.slug ? "border-verde-primary ring-2 ring-verde-primary/20" : "border-gray-200"}`}
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: col.cor }} />
                      <p className="text-sm font-semibold text-gray-700">{col.nome}</p>
                      <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold text-gray-600">{temFiltro ? `${lista.length}/${todas.length}` : todas.length}</span>
                    </div>
                    {podeEditar && (
                      <button type="button" onClick={() => novaTarefa(col.slug)} className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700" title="Nova tarefa aqui">
                        <Plus className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="min-h-[40px] space-y-2">
                    {lista.map((t) => {
                      const dias = t.prazo ? diasAte(t.prazo) : null;
                      const concluido = statusMap.get(t.status)?.tipo === "concluido";
                      const atrasada = dias != null && dias < 0 && !concluido;
                      const subs = t.subtarefas ?? [];
                      const subFeitas = subs.filter((s) => s.feito).length;
                      return (
                        <div key={t.id_tarefa}>
                          {dropAlvo?.col === col.slug && dropAlvo.beforeId === t.id_tarefa && dragId !== t.id_tarefa && (
                            <div className="mb-2 h-1 rounded-full bg-verde-primary/70" />
                          )}
                          <div
                            draggable={podeEditar}
                            onDragStart={() => setDragId(t.id_tarefa)}
                            onDragEnd={() => { setDragId(null); setColHover(null); setDropAlvo(null); }}
                            onDragOver={(e) => { if (dragId) { e.preventDefault(); e.stopPropagation(); setColHover(col.slug); setDropAlvo({ col: col.slug, beforeId: t.id_tarefa }); } }}
                            onDrop={(e) => { e.stopPropagation(); soltar(col.slug, t.id_tarefa); }}
                            onClick={() => { setEditando(t); setModalOpen(true); }}
                            style={{ borderLeftColor: corPrioridade(t.prioridade) }}
                            className={`cursor-pointer rounded-lg border border-l-4 border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md ${dragId === t.id_tarefa ? "rotate-1 opacity-40" : ""}`}
                          >
                            <p className={`text-sm font-medium ${concluido ? "text-gray-400 line-through" : "text-gray-800"}`}>{t.titulo}</p>
                            {(t.etiquetas ?? []).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {(t.etiquetas ?? []).map((e) => (
                                  <span key={e} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{e}</span>
                                ))}
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
                    {dropAlvo?.col === col.slug && dropAlvo.beforeId === null && dragId && (
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
          <p className="mt-3 text-center text-xs text-gray-400">Arraste os cards entre as colunas para mudar o status.</p>
        )}
          </div>
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
          podeEditar={podeEditar}
        />
      )}
    </div>
  );
}
