"use client";

import {
  REGIOES, PARTES, SO_LISTA, COR_SEL, COR_OFF, COR_STROKE, type Regiao,
} from "@/lib/investigacao/corpo";

/**
 * Seletor de partes do corpo atingidas: silhueta (frente) clicável + lista.
 * Lados E/D na perspectiva do acidentado. Clicar na região ou na lista alterna
 * a seleção (sincronizadas).
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
      style: { cursor: ro ? "default" : "pointer" } as const,
      onClick: () => toggle(r.parte),
    };
    const title = <title>{r.parte}</title>;
    if (r.t === "circle") return <circle key={r.parte} cx={r.cx} cy={r.cy} r={r.r} {...common}>{title}</circle>;
    if (r.t === "ellipse") return <ellipse key={r.parte} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} {...common}>{title}</ellipse>;
    return <rect key={r.parte} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} {...common}>{title}</rect>;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <svg viewBox="0 0 200 470" className="h-[360px] w-auto shrink-0 select-none" role="img" aria-label="Silhueta do corpo">
        {REGIOES.map(shape)}
        <text x={100} y={462} textAnchor="middle" fontSize={9} fill="#9ca3af">frente · lados na perspectiva do acidentado</text>
      </svg>

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
                title={soLista ? "Sem região na silhueta de frente" : undefined}
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
