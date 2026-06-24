"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, KanbanSquare, ListTodo, Calendar, Users } from "lucide-react";
import { useUserStore } from "@/lib/store";

const COLUNAS = [
  { titulo: "A fazer", cor: "#94a3b8" },
  { titulo: "Em andamento", cor: "#f59e0b" },
  { titulo: "Em revisão", cor: "#6366f1" },
  { titulo: "Concluído", cor: "#16a34a" },
];

export default function GestaoChabraPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (user?.perfil === "Cliente") router.replace("/portal-cliente/inicio");
  }, [user?.perfil, router]);

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <Link href="/visao-geral" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="size-4" /> Visão geral
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-verde-light text-verde-primary">
            <KanbanSquare className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão Chabra</h1>
            <p className="text-sm text-gray-500">Gestão de projetos e tarefas da equipe (estilo quadro Kanban).</p>
          </div>
        </div>

        {/* Prévia do quadro (em construção) */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUNAS.map((c) => (
            <div key={c.titulo} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: c.cor }} />
                <p className="text-sm font-semibold text-gray-700">{c.titulo}</p>
              </div>
              <div className="space-y-2">
                <div className="skeleton-shimmer h-14 rounded-lg" />
                <div className="skeleton-shimmer h-14 rounded-lg opacity-60" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-gray-800">Módulo em construção 🚧</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-gray-500">
            Aqui vai ficar a gestão de projetos e tarefas da equipe — quadro Kanban, listas, responsáveis,
            prazos e prioridades. Estamos montando por etapas.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1"><KanbanSquare className="size-3.5" /> Quadro Kanban</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1"><ListTodo className="size-3.5" /> Tarefas e subtarefas</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1"><Users className="size-3.5" /> Responsáveis</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1"><Calendar className="size-3.5" /> Prazos e prioridades</span>
          </div>
        </div>
      </div>
    </div>
  );
}
