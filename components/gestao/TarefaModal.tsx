"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  useSalvarTarefa, useExcluirTarefa, useUsuariosLista,
  STATUS_TAREFA, PRIORIDADES,
  type GestaoTarefa, type StatusTarefa, type PrioridadeTarefa,
} from "@/lib/hooks/useGestao";

export default function TarefaModal({
  open,
  onClose,
  idQuadro,
  tarefa,
  statusInicial = "A_FAZER",
  podeEditar,
}: {
  open: boolean;
  onClose: () => void;
  idQuadro: string;
  tarefa: GestaoTarefa | null;
  statusInicial?: StatusTarefa;
  podeEditar: boolean;
}) {
  const salvar = useSalvarTarefa();
  const excluir = useExcluirTarefa();
  const { data: usuarios = [] } = useUsuariosLista();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>("Media");
  const [prazo, setPrazo] = useState("");
  const [status, setStatus] = useState<StatusTarefa>(statusInicial);

  useEffect(() => {
    if (!open) return;
    setTitulo(tarefa?.titulo ?? "");
    setDescricao(tarefa?.descricao ?? "");
    setResponsavel(tarefa?.responsavel ?? "");
    setPrioridade(tarefa?.prioridade ?? "Media");
    setPrazo(tarefa?.prazo ?? "");
    setStatus(tarefa?.status ?? statusInicial);
  }, [open, tarefa, statusInicial]);

  const ro = !podeEditar;

  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error("Informe o título da tarefa.");
      return;
    }
    await salvar.mutateAsync({
      id_tarefa: tarefa?.id_tarefa,
      id_quadro: idQuadro,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      responsavel: responsavel.trim() || null,
      prioridade,
      prazo: prazo || null,
      status,
    });
    toast.success(tarefa ? "Tarefa atualizada" : "Tarefa criada");
    onClose();
  }

  function handleExcluir() {
    if (!tarefa) return;
    excluir.mutate(tarefa.id_tarefa, { onSuccess: () => { toast.success("Tarefa excluída"); onClose(); } });
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-verde-primary focus:outline-none focus:ring-1 focus:ring-verde-primary/30 disabled:bg-gray-50";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tarefa ? "Editar tarefa" : "Nova tarefa"}
      size="lg"
      footer={
        !ro ? (
          <div className="flex items-center justify-between">
            {tarefa ? (
              <button
                type="button"
                onClick={handleExcluir}
                disabled={excluir.isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" /> Excluir
              </button>
            ) : <span />}
            <button
              type="button"
              onClick={handleSalvar}
              disabled={salvar.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-verde-primary px-5 py-2 text-sm font-semibold text-white hover:bg-verde-accent disabled:opacity-50"
            >
              {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
              {tarefa ? "Salvar" : "Criar tarefa"}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Título *</label>
          <input value={titulo} disabled={ro} onChange={(e) => setTitulo(e.target.value)} placeholder="O que precisa ser feito?" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Descrição</label>
          <textarea value={descricao} disabled={ro} onChange={(e) => setDescricao(e.target.value)} rows={3} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Responsável</label>
            <input list="gestao-usuarios" value={responsavel} disabled={ro} onChange={(e) => setResponsavel(e.target.value)} placeholder="Quem vai fazer" className={inputCls} />
            <datalist id="gestao-usuarios">
              {usuarios.map((u) => <option key={u} value={u} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Prazo</label>
            <input type="date" value={prazo} disabled={ro} onChange={(e) => setPrazo(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Prioridade</label>
            <select value={prioridade} disabled={ro} onChange={(e) => setPrioridade(e.target.value as PrioridadeTarefa)} className={inputCls}>
              {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
            <select value={status} disabled={ro} onChange={(e) => setStatus(e.target.value as StatusTarefa)} className={inputCls}>
              {STATUS_TAREFA.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
