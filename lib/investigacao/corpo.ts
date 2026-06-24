// Silhueta do corpo (imagem do usuário, frente) + marcadores das partes atingidas.
// A imagem fica em public/silhueta-frente.png (348x657). As marcas são anéis
// vermelhos clicáveis posicionados sobre o corpo.
// Lados E/D na perspectiva do acidentado (direita dele = esquerda de quem olha).

export const SILHUETA_IMG = "/silhueta-frente.png";
export const IMG_W = 348;
export const IMG_H = 657;
export const VIEWBOX = `0 0 ${IMG_W} ${IMG_H}`;

export interface Marca {
  parte: string;
  cx: number;
  cy: number;
}

/** Marcas posicionadas sobre a imagem (frente). */
export const MARCAS: Marca[] = [
  { parte: "Cabeça", cx: 174, cy: 52 },
  { parte: "Olhos", cx: 174, cy: 44 },
  { parte: "Pescoço", cx: 174, cy: 104 },
  { parte: "Ombro direito", cx: 124, cy: 128 },
  { parte: "Ombro esquerdo", cx: 224, cy: 128 },
  { parte: "Tórax", cx: 174, cy: 176 },
  { parte: "Abdômen", cx: 174, cy: 250 },
  { parte: "Quadril", cx: 174, cy: 316 },
  { parte: "Braço direito", cx: 92, cy: 255 },
  { parte: "Braço esquerdo", cx: 256, cy: 255 },
  { parte: "Mão direita", cx: 46, cy: 360 },
  { parte: "Mão esquerda", cx: 302, cy: 360 },
  { parte: "Coxa direita", cx: 150, cy: 410 },
  { parte: "Coxa esquerda", cx: 198, cy: 410 },
  { parte: "Joelho direito", cx: 152, cy: 478 },
  { parte: "Joelho esquerdo", cx: 196, cy: 478 },
  { parte: "Perna direita", cx: 153, cy: 545 },
  { parte: "Perna esquerda", cx: 195, cy: 545 },
  { parte: "Pé direito", cx: 150, cy: 628 },
  { parte: "Pé esquerdo", cx: 198, cy: 628 },
];

/** Partes sem marca na silhueta de frente (selecionáveis só pela lista). */
export const PARTES_EXTRA = ["Costas", "Lombar", "Glúteos"];

export const PARTES = [...MARCAS.map((m) => m.parte), ...PARTES_EXTRA];

export const COR_SEL = "#dc2626";
