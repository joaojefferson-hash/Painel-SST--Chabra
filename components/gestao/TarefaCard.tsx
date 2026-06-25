"use client";

import { CalendarClock, CheckSquare, Repeat, Clock, Flag } from "lucide-react";
import {
  iniciais, corAvatar, formatarDuracao,
  PRIORIDADES,
  type GestaoTarefa, type GestaoStatus, type GestaoCampo,
} from "@/lib/hooks/useGestao";
import { formatarCampoValor } from "@/components/gestao/CampoInput";

const corPrioridade = (p: string) => PRIORIDADES.find((x) => x.value === p)?.cor ?? "#94a3b8";
const labelPrioridade = (p: string) => PRIORIDADES.find((x) => x.value === p)?.label ?? p;
function diasAte(iso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00").getTime() - hoje.getTime()) / 86_400_000);
}
const fmtPrazo = (iso: string) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };

export default function TarefaCard({
  t,
  statusMap,
  etiquetaCor,
  tempoSeg,
  campos,
  arrastavel,
  arrastando,
  onAbrir,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  t: GestaoTarefa;
  statusMap: Map<string, GestaoStatus>;
  etiquetaCor: Map<string, string>;
  tempoSeg: number;
  campos: GestaoCampo[];
  arrastavel: boolean;
  arrastando: boolean;
  onAbrir: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const st = statusMap.get(t.status);
  const concluido = st?.tipo === "concluido";
  const dias = t.prazo ? diasAte(t.prazo) : null;
  const atrasada = dias != null && dias < 0 && !concluido;
  const subs = t.subtarefas ?? [];
  const subFeitas = subs.filter((s) => s.feito).length;
  const prioridadeAlta = t.prioridade === "Alta" || t.prioridade === "Urgente";

  const chipsCampos = campos
    .filter((c) => c.tipo === "checkbox" || c.tipo === "selecao" || c.tipo === "moeda")
    .map((c) => ({ c, v: (t.campos ?? {})[c.id] }))
    .filter(({ c, v }) => (c.tipo === "checkbox" ? v === true : v != null && v !== ""));

  return (
    <div
      title={`${t.titulo} · prioridade ${labelPrioridade(t.prioridade)} · status ${st?.nome ?? t.status}${atrasada ? " · atrasada" : ""}`}
      draggable={arrastavel}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onAbrir}
      style={{ borderLeftColor: corPrioridade(t.prioridade) }}
      className={`cursor-pointer rounded-lg border border-l-4 border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md ${arrastando ? "rotate-1 opacity-40" : ""}`}
    >
      <p className={`text-sm font-medium ${concluido ? "text-gray-400 line-through" : "text-gray-800"}`}>{t.titulo}</p>

      {(t.etiquetas ?? []).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(t.etiquetas ?? []).map((e) => {
            const cor = etiquetaCor.get(e);
            return <span key={e} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={cor ? { background: cor, color: "#fff" } : { background: "#f3f4f6", color: "#6b7280" }}>{e}</span>;
          })}
        </div>
      )}

      {chipsCampos.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {chipsCampos.map(({ c, v }) => (
            <span key={c.id} className="rounded bg-verde-light/60 px-1.5 py-0.5 text-[10px] font-medium text-verde-primary" title={c.nome}>
              {c.tipo === "checkbox" ? c.nome : formatarCampoValor(c, v)}
            </span>
          ))}
        </div>
      )}

      {subs.length > 0 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-1 rounded-full bg-verde-primary transition-all" style={{ width: `${Math.round((subFeitas / subs.length) * 100)}%` }} />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {prioridadeAlta && (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: corPrioridade(t.prioridade) + "1a", color: corPrioridade(t.prioridade) }}>
            <Flag className="size-3" /> {labelPrioridade(t.prioridade)}
          </span>
        )}
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
          <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-gray-500" title="Recorrente" aria-label="Recorrente">
            <Repeat className="size-3" />
          </span>
        )}
        {tempoSeg > 0 && (
          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500" title="Tempo registrado">
            <Clock className="size-3" /> {formatarDuracao(tempoSeg)}
          </span>
        )}
        {t.responsavel && (
          <span className="ml-auto flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: corAvatar(t.responsavel) }} title={t.responsavel} aria-label={`Responsável: ${t.responsavel}`}>
            {iniciais(t.responsavel)}
          </span>
        )}
      </div>
    </div>
  );
}
