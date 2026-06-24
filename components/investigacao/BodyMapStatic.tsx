import React from "react";
import { REGIOES, COR_SEL, COR_OFF, COR_STROKE, type Regiao } from "@/lib/investigacao/corpo";

/** Silhueta estática (só leitura) com as partes selecionadas em destaque.
 *  Pura — usável no laudo PDF via renderToStaticMarkup. */
export default function BodyMapStatic({ value }: { value: string[] }) {
  const has = (p: string) => value.includes(p);
  function shape(r: Regiao) {
    const fill = has(r.parte) ? COR_SEL : COR_OFF;
    const c = { fill, stroke: COR_STROKE, strokeWidth: 1 };
    if (r.t === "circle") return <circle key={r.parte} cx={r.cx} cy={r.cy} r={r.r} {...c} />;
    if (r.t === "ellipse") return <ellipse key={r.parte} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} {...c} />;
    return <rect key={r.parte} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} {...c} />;
  }
  return (
    <svg viewBox="0 0 200 420" width={130} height={273} role="img" aria-label="Partes do corpo atingidas">
      {REGIOES.map(shape)}
    </svg>
  );
}
