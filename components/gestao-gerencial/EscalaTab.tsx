"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCanEdit } from "@/lib/hooks/useUsuario";
import {
  useGGEquipe, useGGTurnos, useGGEscala, useToggleEscala, DIAS_SEMANA,
} from "@/lib/hooks/useGestaoGerencial";

/**
 * Escala padrão semanal da unidade: para o turno selecionado, uma grade
 * profissionais × dias. Clicar numa célula marca/desmarca quem atua naquele
 * dia+turno (gg_escala_padrao).
 */
export default function EscalaTab({ idUnidade }: { idUnidade: string }) {
  const podeEditar = useCanEdit();
  const equipe = useGGEquipe(idUnidade);
  const turnos = useGGTurnos(idUnidade);
  const escala = useGGEscala(idUnidade);
  const toggle = useToggleEscala();

  const turnosAtivos = useMemo(() => (turnos.data ?? []).filter((t) => t.ativo), [turnos.data]);
  const [idTurno, setIdTurno] = useState<string>("");
  const turnoSel = idTurno || turnosAtivos[0]?.id || "";

  // índice das células marcadas: chave "prof|dia|turno" → id do registro
  const marcados = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of escala.data ?? []) m.set(`${e.id_profissional}|${e.dia_semana}|${e.id_turno}`, e.id);
    return m;
  }, [escala.data]);

  const equipeAtiva = useMemo(
    () => (equipe.data ?? []).filter((v) => v.profissional?.ativo ?? true),
    [equipe.data],
  );

  if (turnosAtivos.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-800">
        Cadastre ao menos um <strong>turno</strong> na aba <em>Configuração</em> para montar a escala.
      </p>
    );
  }
  if (equipeAtiva.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Cadastre profissionais na aba <em>Profissionais</em> para montar a escala.
      </p>
    );
  }

  function clique(idProf: string, dia: number) {
    if (!podeEditar || !turnoSel) return;
    const chave = `${idProf}|${dia}|${turnoSel}`;
    const existente = marcados.get(chave);
    toggle.mutate({
      id_profissional: idProf,
      id_unidade: idUnidade,
      dia_semana: dia,
      id_turno: turnoSel,
      marcar: !existente,
      id_existente: existente,
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Turno:</label>
        <select
          value={turnoSel}
          onChange={(e) => setIdTurno(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-verde-primary focus:outline-none focus:ring-1 focus:ring-verde-primary/30"
        >
          {turnosAtivos.map((t) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
        {toggle.isPending && <Loader2 className="size-4 animate-spin text-verde-primary" />}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                Profissional
              </th>
              {DIAS_SEMANA.map((d) => (
                <th key={d.n} className="border-b border-gray-200 px-2 py-2 text-center font-semibold text-gray-600">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipeAtiva.map((v) => (
              <tr key={v.id} className="hover:bg-verde-primary/[0.03]">
                <td className="sticky left-0 z-10 border-r border-gray-200 bg-white px-3 py-1.5">
                  <div className="font-medium text-gray-900">{v.profissional?.nome}</div>
                  {v.categoria?.nome && <div className="text-xs text-gray-400">{v.categoria.nome}</div>}
                </td>
                {DIAS_SEMANA.map((d) => {
                  const on = marcados.has(`${v.id_profissional}|${d.n}|${turnoSel}`);
                  return (
                    <td key={d.n} className="border-b border-gray-100 px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => clique(v.id_profissional, d.n)}
                        disabled={!podeEditar}
                        aria-pressed={on}
                        className={`size-6 rounded-md border text-xs transition-colors ${
                          on
                            ? "border-verde-primary bg-verde-primary text-white"
                            : "border-gray-300 bg-white text-transparent hover:border-verde-primary/50 hover:bg-verde-primary/5"
                        } ${podeEditar ? "cursor-pointer" : "cursor-default"}`}
                        title={on ? "Atua neste dia — clique para remover" : "Clique para marcar"}
                      >
                        {on ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Marque em quais dias cada profissional atua neste turno. A escala padrão é o ponto de partida para detectar quem
        precisa de substituto quando houver ausências.
      </p>
    </section>
  );
}
