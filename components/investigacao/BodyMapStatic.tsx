import React from "react";
import { MARCAS, VIEWBOX, IMG_W, IMG_H, COR_SEL } from "@/lib/investigacao/corpo";

/** Silhueta (imagem) com as marcas vermelhas das partes selecionadas.
 *  `imgSrc` deve ser uma URL absoluta ou data URI (o Puppeteer não resolve
 *  caminho relativo). Pura — usável no laudo PDF via renderToStaticMarkup. */
export default function BodyMapStatic({ value, imgSrc }: { value: string[]; imgSrc: string }) {
  const w = 132;
  const h = Math.round((w * IMG_H) / IMG_W);
  const marcas = MARCAS.filter((m) => value.includes(m.parte));
  return (
    <svg viewBox={VIEWBOX} width={w} height={h} role="img" aria-label="Partes do corpo atingidas">
      <image href={imgSrc} x={0} y={0} width={IMG_W} height={IMG_H} preserveAspectRatio="xMidYMid meet" />
      {marcas.map((m) => (
        <g key={m.parte}>
          <circle cx={m.cx} cy={m.cy} r={20} fill="none" stroke={COR_SEL} strokeWidth={2} opacity={0.4} />
          <circle cx={m.cx} cy={m.cy} r={14} fill="none" stroke={COR_SEL} strokeWidth={2.5} opacity={0.85} />
          <circle cx={m.cx} cy={m.cy} r={8} fill={COR_SEL} />
        </g>
      ))}
    </svg>
  );
}
