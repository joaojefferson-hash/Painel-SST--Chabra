"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, Tooltip,
} from "recharts";

export interface FatiaTipo {
  tipo: string;
  valor: number;
}
export interface PontoMes {
  mes: string;
  valor: number;
}

const COR_TIPO: Record<string, string> = {
  DRPS: "#7c3aed",
  "Análise de Químicos": "#d97706",
  Apreciação: "#0ea5e9",
  AEP: "#0891b2",
  "Não Conformidade": "#dc2626",
  AET: "#16a34a",
  Conformidade: "#0d9488",
};

/** Linha com os dois gráficos: composição de laudos por tipo (donut) e
 *  ritmo de inspeções por mês (barras). Só apresentação. */
export default function GraficosVisaoGeral({
  laudosPorTipo,
  inspecoesPorMes,
}: {
  laudosPorTipo: FatiaTipo[];
  inspecoesPorMes: PontoMes[];
}) {
  const totalLaudos = laudosPorTipo.reduce((s, f) => s + f.valor, 0);
  const totalInsp = inspecoesPorMes.reduce((s, p) => s + p.valor, 0);

  return (
    <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Donut — laudos por tipo */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Laudos por tipo
        </p>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative size-[170px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={laudosPorTipo}
                  dataKey="valor"
                  nameKey="tipo"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive
                >
                  {laudosPorTipo.map((f) => (
                    <Cell key={f.tipo} fill={COR_TIPO[f.tipo] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v, n) => [`${v} laudos`, String(n)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold leading-none text-gray-900">{totalLaudos}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">laudos</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {laudosPorTipo.map((f) => (
              <div key={f.tipo} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: COR_TIPO[f.tipo] ?? "#94a3b8" }} />
                <span className="flex-1 truncate text-gray-600">{f.tipo}</span>
                <span className="font-semibold text-gray-900">{f.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barras — inspeções por mês */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Inspeções por mês
        </p>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{totalInsp}</span> inspeções nos últimos {inspecoesPorMes.length} meses
          </p>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspecoesPorMes} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v) => [`${v} inspeções`, ""]}
                  labelFormatter={(l) => `Mês: ${l}`}
                />
                <Bar dataKey="valor" fill="#00835A" radius={[4, 4, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
