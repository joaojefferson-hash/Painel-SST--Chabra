"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, UserRound, Search, Fingerprint, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EpiModal, { inputCls, labelCls } from "@/components/epi/EpiModal";
import { useEpiColaboradores, useColaboradorMut, useCadastrarBiometria } from "@/lib/hooks/useEpi";
import { biometriaSuportada, enrollDigital } from "@/lib/epi/digitalPersona";
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

/** Cadastro da 1ª digital do colaborador (só no app desktop com leitor). */
function BiometriaColaborador({ colaborador }: { colaborador: EpiColaborador }) {
  const cadastrar = useCadastrarBiometria();
  const [consent, setConsent] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const suportada = biometriaSuportada();
  const jaTem = !!colaborador.biometria_em;

  async function registrar() {
    if (!consent) { toast.error("É preciso o consentimento do colaborador para a biometria."); return; }
    setCapturando(true);
    try {
      const r = await enrollDigital();
      if (!r.ok || !r.template) { toast.error(r.erro || "Não foi possível capturar a digital."); return; }
      cadastrar.mutate({ empresa_id: colaborador.empresa_id, id_colaborador: colaborador.id, template: r.template, consentimento: true });
    } finally {
      setCapturando(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <Fingerprint className="size-4 text-verde-primary" /> Biometria digital
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Cadastra a digital do colaborador para <strong>conferência na assinatura da ficha</strong> (evita que outra pessoa assine no lugar dele).
      </p>

      {jaTem ? (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="size-3.5" /> Cadastrada em {fmtDia(colaborador.biometria_em!)}
        </div>
      ) : (
        <div className="mt-2 text-xs text-amber-700">Ainda não cadastrada.</div>
      )}

      {!suportada ? (
        <p className="mt-2 text-xs text-gray-400">Disponível apenas no aplicativo desktop com o leitor de digital.</p>
      ) : (
        <div className="mt-2 space-y-2">
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 rounded border-gray-300 text-verde-primary focus:ring-verde-primary" />
            O colaborador consente com o cadastro da sua digital (dado biométrico) para fins de conferência de assinatura, nos termos da LGPD.
          </label>
          <button
            type="button"
            onClick={registrar}
            disabled={capturando || cadastrar.isPending || !consent}
            className="inline-flex items-center gap-1.5 rounded-md bg-verde-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-verde-accent disabled:opacity-60"
          >
            {capturando || cadastrar.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Fingerprint className="size-3.5" />}
            {jaTem ? "Atualizar biometria" : "Cadastrar biometria"}
          </button>
        </div>
      )}
    </div>
  );
}
