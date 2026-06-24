import React from "react";
import { regioesDaVista, VIEWBOX, COR_SEL, COR_OFF, COR_STROKE, type Regiao } from "@/lib/investigacao/corpo";

/** Silhueta estática (frente + costas) com as partes selecionadas em destaque.
 *  Pura — usável no laudo PDF via renderToStaticMarkup. */
export default function BodyMapStatic({ value }: { value: string[] }) {
  const has = (p: string) => value.includes(p);
  function shape(r: Regiao) {
    const c = { fill: has(r.parte) ? COR_SEL : COR_OFF, stroke: COR_STROKE, strokeWidth: 1 };
    return r.t === "ellipse"
      ? <ellipse key={r.parte} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} {...c} />
      : <path key={r.parte} d={r.d} {...c} />;
  }
  const fig = (v: "frente" | "costas") => (
    <div style={{ textAlign: "center" }}>
      <svg viewBox={VIEWBOX} width={104} height={236} role="img" aria-label={`Silhueta ${v}`}>
        {regioesDaVista(v).map(shape)}
      </svg>
      <div style={{ fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".06em" }}>{v}</div>
    </div>
  );
  return <div style={{ display: "flex", gap: 18 }}>{fig("frente")}{fig("costas")}</div>;
}
