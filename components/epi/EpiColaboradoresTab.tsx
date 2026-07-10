"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, UserRound, Search, Fingerprint, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EpiModal, { inputCls, labelCls } from "@/components/epi/EpiModal";
import { useEpiColaboradores, useColaboradorMut, useCadastrarBiometria } from "@/lib/hooks/useEpi";
import { capturarDigitalWeb } from "@/lib/epi/digitalPersonaWeb";
import type { EpiColaborador } from "@/lib/epi/types";

const fmtDia = (iso: string) => iso.split("T")[0].split("-").reverse().join("/");

export default function EpiColaboradoresTab({ empresaId, canEdit }: { empresaId: string; canEdit: boolean }) {
  const { data: lista = [], isLoading } = useEpiColaboradores(empresaId);
  const mut = useColaboradorMut();
  const [busca, setBusca] = useState("");
  const [editar, setEditar] = useState<EpiColaborador | null>(null);
  const [novo, setNovo] = useState(false);
  const [excluir, setExcluir] = useState<EpiColaborador | null>(null);

  const filtrados = lista.filter((c) =>
    [c.nome, c.cpf, c.matricula, c.cargo, c.setor].filter(Boolean).join(" ").toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-gray-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar colaborador…" className={`${inputCls} pl-8`} />
        </div>
        {canEdit && (
          <button type="button" onClick={() => setNovo(true)} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-2 text-sm font-semibold text-white hover:bg-verde-accent">
            <Plus className="size-4" /> Novo colaborador
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : filtrados.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          {lista.length === 0 ? "Nenhum colaborador cadastrado nesta empresa." : "Nada encontrado para a busca."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-3 py-2">Nome</th><th className="px-3 py-2">CPF</th>
                <th className="px-3 py-2">Matrícula</th><th className="px-3 py-2">Cargo</th>
                <th className="px-3 py-2">Setor</th><th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((c) => (
                <tr key={c.id} className={c.ativo ? "" : "bg-gray-50 text-gray-400"}>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    <span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5 text-gray-400" />{c.nome}{!c.ativo && <span className="text-[10px] uppercase text-gray-400">(inativo)</span>}</span>
                  </td>
                  <td className="px-3 py-2">{c.cpf ?? "—"}</td>
                  <td className="px-3 py-2">{c.matricula ?? "—"}</td>
                  <td className="px-3 py-2">{c.cargo ?? "—"}</td>
                  <td className="px-3 py-2">{c.setor ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {canEdit && (
                      <div className="inline-flex gap-1">
                        <button type="button" onClick={() => setEditar(c)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-verde-primary" title="Editar"><Pencil className="size-3.5" /></button>
                        <button type="button" onClick={() => setExcluir(c)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-alert" title="Excluir"><Trash2 className="size-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(novo || editar) && (
        <ColaboradorForm
          empresaId={empresaId}
          inicial={editar}
          mut={mut}
          onClose={() => { setNovo(false); setEditar(null); }}
        />
      )}

      <ConfirmDialog
        open={!!excluir}
        title="Excluir colaborador"
        description={`Excluir "${excluir?.nome}"? As entregas já registradas para ele são mantidas (histórico).`}
        confirmLabel="Excluir"
        variant="danger"
        loading={mut.excluir.isPending}
        onConfirm={() => { if (excluir) mut.excluir.mutate({ id: excluir.id, empresa_id: empresaId }, { onSuccess: () => setExcluir(null) }); }}
        onCancel={() => setExcluir(null)}
      />
    </div>
  );
}

function ColaboradorForm({
  empresaId, inicial, mut, onClose,
}: {
  empresaId: string;
  inicial: EpiColaborador | null;
  mut: ReturnType<typeof useColaboradorMut>;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [cpf, setCpf] = useState(inicial?.cpf ?? "");
  const [matricula, setMatricula] = useState(inicial?.matricula ?? "");
  const [cargo, setCargo] = useState(inicial?.cargo ?? "");
  const [setor, setSetor] = useState(inicial?.setor ?? "");
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true);
  const pending = mut.criar.isPending || mut.atualizar.isPending;

  function salvar() {
    if (!nome.trim()) { toast.error("Informe o nome"); return; }
    if (inicial) {
      mut.atualizar.mutate({ id: inicial.id, empresa_id: empresaId, patch: { nome: nome.trim(), cpf: cpf.trim() || null, matricula: matricula.trim() || null, cargo: cargo.trim() || null, setor: setor.trim() || null, ativo } }, { onSuccess: onClose });
    } else {
      mut.criar.mutate({ empresa_id: empresaId, nome, cpf, matricula, cargo, setor }, { onSuccess: onClose });
    }
  }

  return (
    <EpiModal
      open
      title={inicial ? "Editar colaborador" : "Novo colaborador"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="button" onClick={salvar} disabled={pending} className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-60">
            {pending && <Loader2 className="size-4 animate-spin" />} Salvar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className={labelCls}>Nome *</label><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></div>
        <div><label className={labelCls}>CPF</label><input className={inputCls} value={cpf} onChange={(e) => setCpf(e.target.value)} /></div>
        <div><label className={labelCls}>Matrícula</label><input className={inputCls} value={matricula} onChange={(e) => setMatricula(e.target.value)} /></div>
        <div><label className={labelCls}>Cargo</label><input className={inputCls} value={cargo} onChange={(e) => setCargo(e.target.value)} /></div>
        <div><label className={labelCls}>Setor</label><input className={inputCls} value={setor} onChange={(e) => setSetor(e.target.value)} /></div>
        {inicial && (
          <label className="col-span-2 mt-1 inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="size-4 rounded border-gray-300 text-verde-primary focus:ring-verde-primary" /> Ativo
          </label>
        )}
      </div>
      {inicial && <BiometriaColaborador colaborador={inicial} />}
    </EpiModal>
  );
}

const MAOS = ["Direita", "Esquerda"] as const;
const DEDOS = ["Polegar", "Indicador", "Médio", "Anelar", "Mínimo"] as const;
const TOTAL_CAPTURAS = 4;

/** Cadastro da digital do colaborador — escolhe o dedo e captura 4× no navegador. */
function BiometriaColaborador({ colaborador }: { colaborador: EpiColaborador }) {
  const cadastrar = useCadastrarBiometria();
  const [consent, setConsent] = useState(false);
  const [mao, setMao] = useState<(typeof MAOS)[number]>("Direita");
  const [dedo, setDedo] = useState<(typeof DEDOS)[number]>("Indicador");
  const [capturas, setCapturas] = useState<string[]>([]);
  const [capturando, setCapturando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const jaTem = !!colaborador.biometria_em;
  const dedoLabel = `${dedo} — mão ${mao.toLowerCase()}`;

  async function capturarToque() {
    if (!consent) { toast.error("É preciso o consentimento do colaborador para a biometria."); return; }
    setCapturando(true); setErro(null);
    try {
      const r = await capturarDigitalWeb();
      if (!r.ok || !r.imagem) { setErro(r.erro || "Não foi possível capturar a digital."); return; }
      setCapturas((c) => [...c, r.imagem as string]);
    } finally {
      setCapturando(false);
    }
  }

  function salvar() {
    setErro(null);
    cadastrar.mutate(
      { empresa_id: colaborador.empresa_id, id_colaborador: colaborador.id, template: JSON.stringify(capturas), consentimento: true, dedo: dedoLabel },
      { onSuccess: () => setCapturas([]), onError: (e) => setErro(e.message) },
    );
  }

  const completo = capturas.length >= TOTAL_CAPTURAS;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <Fingerprint className="size-4 text-verde-primary" /> Biometria digital
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Cadastra a digital do colaborador para <strong>conferência na assinatura da ficha</strong> (evita que outra pessoa assine no lugar dele). Requer o leitor + o agente da DigitalPersona (DpHost) na máquina.
      </p>

      {jaTem ? (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="size-3.5" /> Cadastrada em {fmtDia(colaborador.biometria_em!)}{colaborador.biometria_dedo ? ` · ${colaborador.biometria_dedo}` : ""}
        </div>
      ) : (
        <div className="mt-2 text-xs text-amber-700">Ainda não cadastrada.</div>
      )}

      <div className="mt-2 space-y-2">
        {/* seletor de dedo */}
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-gray-600">Mão
            <select value={mao} onChange={(e) => { setMao(e.target.value as typeof mao); setCapturas([]); }} disabled={capturas.length > 0} className={`${inputCls} py-1`}>
              {MAOS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600">Dedo
            <select value={dedo} onChange={(e) => { setDedo(e.target.value as typeof dedo); setCapturas([]); }} disabled={capturas.length > 0} className={`${inputCls} py-1`}>
              {DEDOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 rounded border-gray-300 text-verde-primary focus:ring-verde-primary" />
          O colaborador consente com o cadastro da sua digital (dado biométrico) para fins de conferência de assinatura, nos termos da LGPD.
        </label>

        {/* progresso: mostra a IMAGEM de cada captura */}
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: TOTAL_CAPTURAS }).map((_, i) => (
            <div key={i} className={`size-12 overflow-hidden rounded-md border ${i < capturas.length ? "border-verde-primary" : "border-dashed border-gray-300 bg-white"}`}>
              {i < capturas.length ? (
                <img src={`data:image/png;base64,${capturas[i]}`} alt={`captura ${i + 1}`} className="size-full bg-white object-contain" />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-gray-400">{i + 1}</div>
              )}
            </div>
          ))}
          <span className="text-xs text-gray-500">{capturas.length}/{TOTAL_CAPTURAS} · <strong>{dedoLabel}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {!completo ? (
            <button
              type="button"
              onClick={capturarToque}
              disabled={capturando || !consent}
              className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-verde-accent disabled:opacity-60"
            >
              {capturando ? <Loader2 className="size-3.5 animate-spin" /> : <Fingerprint className="size-3.5" />}
              {capturando ? `Encoste o dedo… (${capturas.length + 1}/${TOTAL_CAPTURAS})` : capturas.length === 0 ? (jaTem ? "Recadastrar (4 toques)" : "Cadastrar (4 toques)") : `Capturar toque ${capturas.length + 1}/${TOTAL_CAPTURAS}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={salvar}
              disabled={cadastrar.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-verde-accent disabled:opacity-60"
            >
              {cadastrar.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              {cadastrar.isPending ? "Salvando…" : "Salvar biometria"}
            </button>
          )}
          {capturas.length > 0 && (
            <button type="button" onClick={() => { setCapturas([]); setErro(null); }} className="text-xs text-gray-500 hover:text-red-alert">Recomeçar</button>
          )}
        </div>
        {erro && <p className="text-xs text-red-alert">{erro}</p>}
      </div>
    </div>
  );
}
