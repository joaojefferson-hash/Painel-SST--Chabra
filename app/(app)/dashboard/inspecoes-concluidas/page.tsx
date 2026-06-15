"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, TrendingUp, Users } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface ConcluidaRow {
  created_at: string;
  responsavel: string | null;
}

async function fetchConcluidas(): Promise<ConcluidaRow[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("inspecoes")
    .select("created_at, responsavel")
    .eq("status", "CONCLUIDA");
  if (error) throw error;
  return (data ?? []) as unknown as ConcluidaRow[];
}

function mesLabel(d: Date) {
  return d
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function InspecoesConcluidasDashboard() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["dashboard-concluidas-detalhe"],
    queryFn: fetchConcluidas,
  });

  const now = new Date();

  // Por mês — últimos 12 meses
  const porMes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { mes: mesLabel(d), total: 0 };
  });
  rows.forEach(({ created_at }) => {
    const d = new Date(created_at);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    const idx = 11 - diff;
    if (idx >= 0 && idx < 12) porMes[idx].total++;
  });

  // Por técnico — contagem por responsável (todas as concluídas)
  const mapaTec = new Map<string, number>();
  rows.forEach(({ responsavel }) => {
    const t = (responsavel ?? "").trim() || "Sem responsável";
    mapaTec.set(t, (mapaTec.get(t) ?? 0) + 1);
  });
  const porTecnico = Array.from(mapaTec.entries())
    .map(([tecnico, total]) => ({ tecnico, total }))
    .sort((a, b) => b.total - a.total);

  const total = rows.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-verde-primary"
          >
            <ArrowLeft className="size-4" /> Voltar ao dashboard
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-gray-900">
            <CheckCircle2 className="size-5 text-verde-primary" />
            Inspeções Concluídas
          </h1>
          <p className="text-sm text-gray-500">
            {isLoading ? "Carregando…" : `${total} inspeção${total !== 1 ? "ões" : ""} concluída${total !== 1 ? "s" : ""} no total`}
          </p>
        </div>
      </div>

      {/* Por mês */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-verde-primary" />
          <h2 className="text-sm font-semibold text-gray-800">Por mês (últimos 12 meses)</h2>
        </div>
        {isLoading ? (
          <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porMes} barSize={26} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip
                cursor={{ fill: "#f0fdf4" }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12, padding: "6px 12px" }}
                formatter={(v) => [`${v} concluída${Number(v) !== 1 ? "s" : ""}`, ""]}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {porMes.map((_, idx, arr) => (
                  <Cell key={idx} fill={idx === arr.length - 1 ? "#006B54" : "#006B5460"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Por técnico */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="size-4 text-verde-primary" />
          <h2 className="text-sm font-semibold text-gray-800">Por técnico</h2>
        </div>
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : porTecnico.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Nenhuma inspeção concluída.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, porTecnico.length * 38)}>
            <BarChart
              data={porTecnico}
              layout="vertical"
              barSize={22}
              margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="tecnico"
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
                width={150}
              />
              <Tooltip
                cursor={{ fill: "#f0fdf4" }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12, padding: "6px 12px" }}
                formatter={(v) => [`${v} concluída${Number(v) !== 1 ? "s" : ""}`, ""]}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#006B54" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
