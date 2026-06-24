"use client";

import { useState } from "react";
import {
  regioesDaVista, PARTES, SO_LISTA, VIEWBOX, COR_SEL, COR_OFF, COR_STROKE, type Regiao,
} from "@/lib/investigacao/corpo";

/**
 * Seletor de partes do corpo atingidas: silhueta humana (frente/costas) clicável
 * + lista. Lados E/D na perspectiva do acidentado. Clicar na região ou na lista
 * alterna a seleção (sincronizadas).
 */
export default function BodyMap({
  value,
  onChange,
  ro,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  ro?: boolean;
}) {
  const [vista, setVista] = useState<"frente" | "costas">("frente");
  const has = (p: string) => value.includes(p);
  const toggle = (p: string) => {
    if (ro) return;
    onChange(has(p) ? value.filter((x) => x !== p) : [...value, p]);
  };

  function shape(r: Regiao) {
    const common = {
      fill: has(r.parte) ? COR_SEL : COR_OFF,
      stroke: COR_STROKE,
      strokeWidth: 1,
      style: { cursor: ro ? "default" : "pointer", transition: "fill .12s" } as const,
      onClick: () => toggle(r.parte),
    };
    const el =
      r.t === "ellipse"
        ? <ellipse key={r.parte} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} {...common} />
        : <path key={r.parte} d={r.d} {...common} />;
    return el;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="shrink-0">
        {/* Toggle Frente / Costas */}
        <div className="mb-1 inline-flex rounded-lg border border-gray-200 p-0.5 text-xs font-medium">
          {(["frente", "costas"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              className={`rounded-md px-3 py-1 capitalize transition ${vista === v ? "bg-verde-primary text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <svg viewBox={VIEWBOX} className="h-[340px] w-auto select-none" role="img" aria-label={`Silhueta — ${vista}`}>
          {regioesDaVista(vista).map(shape)}
        </svg>
        <p className="text-center text-[10px] text-gray-400">lados na perspectiva do acidentado</p>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap gap-1.5">
          {PARTES.map((p) => {
            const on = has(p);
            const soLista = SO_LISTA.includes(p);
            return (
              <button
                key={p}
                type="button"
                disabled={ro}
                onClick={() => toggle(p)}
                className={[
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  on ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  soLista && !on ? "border-dashed" : "",
                ].join(" ")}
              >
                {p}
              </button>
            );
          })}
        </div>
        {value.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">{value.length} parte(s) selecionada(s).</p>
        )}
      </div>
    </div>
  );
}
