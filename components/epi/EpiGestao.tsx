"use client";

import { useState } from "react";
import { BookOpen, Boxes, Users } from "lucide-react";
import EpiCatalogoTab from "@/components/epi/EpiCatalogoTab";
import EpiEstoqueTab from "@/components/epi/EpiEstoqueTab";
import EpiColaboradoresTab from "@/components/epi/EpiColaboradoresTab";

type AbaId = "catalogo" | "estoque" | "colaboradores";

interface AbaCfg {
  id: AbaId;
  label: string;
  icon: typeof BookOpen;
  render: (empresaId: string, canEdit: boolean) => React.ReactNode;
  soInterno?: boolean; // ocultar no Portal do cliente
}

// Abas da Fase 1. NF-e, Entregas e Transferências entram nas próximas fases.
const ABAS: AbaCfg[] = [
  { id: "catalogo", label: "Catálogo", icon: BookOpen, render: (e, c) => <EpiCatalogoTab empresaId={e} canEdit={c} /> },
  { id: "estoque", label: "Estoque", icon: Boxes, render: (e, c) => <EpiEstoqueTab empresaId={e} canEdit={c} /> },
  { id: "colaboradores", label: "Colaboradores", icon: Users, render: (e, c) => <EpiColaboradoresTab empresaId={e} canEdit={c} /> },
];

/**
 * Shell do módulo Gestão de EPI, reutilizado no contexto interno e no Portal do cliente.
 * `contexto="cliente"` esconde abas marcadas como `soInterno`.
 */
export default function EpiGestao({
  empresaId, canEdit, contexto = "interno",
}: {
  empresaId: string;
  canEdit: boolean;
  contexto?: "interno" | "cliente";
}) {
  const abas = ABAS.filter((a) => !(a.soInterno && contexto === "cliente"));
  const [aba, setAba] = useState<AbaId>(abas[0]?.id ?? "catalogo");
  const atual = abas.find((a) => a.id === aba) ?? abas[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {abas.map((a) => {
          const Icon = a.icon;
          const ativo = aba === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                ativo ? "border-verde-primary text-verde-primary" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              <Icon className="size-4" /> {a.label}
            </button>
          );
        })}
      </div>

      {atual?.render(empresaId, canEdit)}
    </div>
  );
}
