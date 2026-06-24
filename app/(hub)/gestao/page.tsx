"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, KanbanSquare, Plus, Loader2, CalendarClock } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useCanEdit } from "@/lib/hooks/useUsuario";
import {
  useQuadroPadrao, useTarefas, useMoverTarefa,
  STATUS_TAREFA, PRIORIDADES,
  type GestaoTarefa, type StatusTarefa,
} from "@/lib/hooks/useGestao";
import TarefaModal from "@/components/gestao/TarefaModal";

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function corPrioridade(p: string): string {
  return PRIORIDADES.find((x) => x.value === p)?.cor ?? "#94a3b8";
}

function diasAte(iso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00").getTime() - hoje.getTime()) / 86_400_000);
}

function fmtPrazo(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function GestaoChabraPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const podeEditar = useCanEdit();
  const { data: quadro, isLoading: loadingQuadro } = useQuadroPadrao();
  const { data: tarefas = [], isLoading: loadingTarefas } = useTarefas(quadro?.id_quadro);
  const mover = useMoverTarefa();

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<GestaoTarefa | null>(null);
  const [statusNovo, setStatusNovo] = useState<StatusTarefa>("A_FAZER");

  useEffect(() => {
    if (user?.perfil === "Cliente") router.replace("/portal-cliente/inicio");
  }, [user?.perfil, router]);

  const porStatus = useMemo(() => {
    const m: Record<string, GestaoTarefa[]> = {};
    for (const s of STATUS_TAREFA) m[s.value] = [];
    for (const t of tarefas) (m[t.status] ??= []).push(t);
    return m;
  }, [tarefas]);

  function novaTarefa(status: StatusTarefa) {
    setEditando(null);
    setStatusNovo(status);
    setModalOpen(true);
  }
  function abrirTarefa(t: GestaoTarefa) {
    setEditando(t);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <Link href="/visao-geral" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="size-4" /> Visão geral
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-verde-light text-verde-primary">
              <KanbanSquare className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão Chabra</h1>
              <p className="text-sm text-gray-500">
                {quadro?.nome ? `Quadro ${quadro.nome}` : "Gestão de tarefas"} · {tarefas.length} tarefa(s)
              </p>
            </div>
          </div>
          {podeEditar && (
            <button
              type="button"
              onClick={() => novaTarefa("A_FAZER")}
              className="inline-flex items-center gap-2 rounded-xl bg-verde-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-verde-accent active:scale-95"
            >
              <Plus className="size-4" /> Nova tarefa
            </button>
          )}
        </div>

        {(loadingQuadro || loadingTarefas) ? (
          <div className="flex items-center gap-2 py-20 text-sm text-gray-400">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_TAREFA.map((col) => {
              const lista = porStatus[col.value] ?? [];
              return (
                <div key={col.value} className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: col.cor }} />
                      <p className="text-sm font-semibold text-gray-700">{col.label}</p>
                      <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold text-gray-600">{lista.length}</span>
                    </div>
                    {podeEditar && (
                      <button type="button" onClick={() => novaTarefa(col.value)} className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700" title="Nova tarefa aqui">
                        <Plus className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {lista.map((t) => {
                      const dias = t.prazo ? diasAte(t.prazo) : null;
                      const atrasada = dias != null && dias < 0 && t.status !== "CONCLUIDO";
                      return (
                        <div
                          key={t.id_tarefa}
                          onClick={() => abrirTarefa(t)}
                          className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: corPrioridade(t.prioridade) }} title={`Prioridade: ${t.prioridade}`} />
                            <p className="flex-1 text-sm font-medium text-gray-800">{t.titulo}</p>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            {t.prazo && (
                              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${atrasada ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                                <CalendarClock className="size-3" /> {fmtPrazo(t.prazo)}
                              </span>
                            )}
                            <div className="ml-auto flex items-center gap-1.5">
                              {t.responsavel && (
                                <span className="flex size-6 items-center justify-center rounded-full bg-verde-light text-[10px] font-bold text-verde-primary" title={t.responsavel}>
                                  {iniciais(t.responsavel)}
                                </span>
                              )}
                            </div>
                          </div>
                          {podeEditar && (
                            <select
                              value={t.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => { e.stopPropagation(); mover.mutate({ id_tarefa: t.id_tarefa, status: e.target.value as StatusTarefa }); }}
                              className="mt-2 w-full rounded border border-gray-200 bg-gray-50 px-1.5 py-1 text-[11px] text-gray-600 focus:border-verde-primary focus:outline-none"
                            >
                              {STATUS_TAREFA.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          )}
                        </div>
                      );
                    })}
                    {lista.length === 0 && (
                      <p className="px-1 py-3 text-center text-xs text-gray-300">Sem tarefas</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {quadro && (
        <TarefaModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          idQuadro={quadro.id_quadro}
          tarefa={editando}
          statusInicial={statusNovo}
          podeEditar={podeEditar}
        />
      )}
    </div>
  );
}
