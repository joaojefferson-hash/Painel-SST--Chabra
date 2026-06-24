"use client";

import {
  SILHUETA_IMG, MARCAS, PARTES, PARTES_EXTRA, VIEWBOX, IMG_W, IMG_H, COR_SEL,
} from "@/lib/investigacao/corpo";

/**
 * Seletor de partes do corpo atingidas: a silhueta é a imagem do usuário
 * (frente) e as marcas são anéis vermelhos clicáveis posicionados sobre o corpo.
 * Clicar na marca ou na lista alterna a seleção (sincronizadas).
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="shrink-0">
        <svg viewBox={VIEWBOX} className="h-[360px] w-auto select-none" role="img" aria-label="Silhueta do corpo (frente)">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <image href={SILHUETA_IMG} x={0} y={0} width={IMG_W} height={IMG_H} preserveAspectRatio="xMidYMid meet" />
          {MARCAS.map((m) => {
            const on = has(m.parte);
            return (
              <g key={m.parte} onClick={() => toggle(m.parte)} style={{ cursor: ro ? "default" : "pointer" }}>
                <title>{m.parte}</title>
                <circle cx={m.cx} cy={m.cy} r={20} fill="transparent" />
                {on ? (
                  <>
                    <circle cx={m.cx} cy={m.cy} r={20} fill="none" stroke={COR_SEL} strokeWidth={2} opacity={0.4} />
                    <circle cx={m.cx} cy={m.cy} r={14} fill="none" stroke={COR_SEL} strokeWidth={2.5} opacity={0.85} />
                    <circle cx={m.cx} cy={m.cy} r={8} fill={COR_SEL} />
                  </>
                ) : (
                  !ro && <circle cx={m.cx} cy={m.cy} r={5} fill={COR_SEL} opacity={0.28} />
                )}
              </g>
            );
          })}
        </svg>
        <p className="text-center text-[10px] text-gray-400">frente · lados na perspectiva do acidentado</p>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap gap-1.5">
          {PARTES.map((p) => {
            const on = has(p);
            const extra = PARTES_EXTRA.includes(p);
            return (
              <button
                key={p}
                type="button"
                disabled={ro}
                onClick={() => toggle(p)}
                className={[
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  on ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  extra && !on ? "border-dashed" : "",
                ].join(" ")}
                title={extra ? "Sem marca na vista de frente" : undefined}
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
