"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { useUnidades } from "@/lib/hooks/useUnidades";

/**
 * Controle de escalas de UMA unidade. Fase 1: placeholder de navegação —
 * o modelo (profissionais, escala padrão, ausências) e a verificação de
 * substituição entram nas próximas fases.
 */
export default function UnidadeEscalasPage() {
  const { idUnidade } = useParams<{ idUnidade: string }>();
  const { data: unidades = [] } = useUnidades();
  const unidade = unidades.find((u) => u.id_unidade === idUnidade);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/gestao-gerencial" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="size-4" /> Unidades
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{unidade?.nome ?? "Unidade"}</h1>
        <p className="mt-1 text-sm text-gray-600">Escalas e Substituições</p>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <CalendarRange className="mx-auto size-8 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700">Módulo de escalas em construção</p>
        <p className="mt-1 text-xs text-gray-500">
          Profissionais, escala padrão semanal, ausências e verificação de substituição chegam nas próximas fases.
        </p>
      </div>
    </div>
  );
}
