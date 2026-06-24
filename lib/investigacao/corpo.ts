// Partes do corpo + regiões da silhueta (frente). Compartilhado entre o editor
// (BodyMap, clicável) e o laudo PDF (BodyMapStatic, renderToStaticMarkup).
// Lados E/D na perspectiva do acidentado (direita dele = esquerda de quem olha).

export type Regiao =
  | { parte: string; t: "circle"; cx: number; cy: number; r: number }
  | { parte: string; t: "rect"; x: number; y: number; w: number; h: number; rx: number }
  | { parte: string; t: "ellipse"; cx: number; cy: number; rx: number; ry: number };

export const REGIOES: Regiao[] = [
  { parte: "Cabeça", t: "circle", cx: 100, cy: 34, r: 24 },
  { parte: "Pescoço", t: "rect", x: 90, y: 56, w: 20, h: 14, rx: 4 },
  { parte: "Ombro direito", t: "rect", x: 56, y: 70, w: 26, h: 16, rx: 8 },
  { parte: "Ombro esquerdo", t: "rect", x: 118, y: 70, w: 26, h: 16, rx: 8 },
  { parte: "Tórax", t: "rect", x: 72, y: 84, w: 56, h: 50, rx: 8 },
  { parte: "Abdômen", t: "rect", x: 74, y: 136, w: 52, h: 44, rx: 6 },
  { parte: "Quadril", t: "rect", x: 72, y: 182, w: 56, h: 30, rx: 8 },
  { parte: "Braço direito", t: "rect", x: 44, y: 86, w: 16, h: 92, rx: 8 },
  { parte: "Braço esquerdo", t: "rect", x: 140, y: 86, w: 16, h: 92, rx: 8 },
  { parte: "Mão direita", t: "ellipse", cx: 52, cy: 190, rx: 11, ry: 14 },
  { parte: "Mão esquerda", t: "ellipse", cx: 148, cy: 190, rx: 11, ry: 14 },
  { parte: "Coxa direita", t: "rect", x: 74, y: 214, w: 24, h: 66, rx: 9 },
  { parte: "Coxa esquerda", t: "rect", x: 102, y: 214, w: 24, h: 66, rx: 9 },
  { parte: "Joelho direito", t: "rect", x: 76, y: 282, w: 20, h: 18, rx: 6 },
  { parte: "Joelho esquerdo", t: "rect", x: 104, y: 282, w: 20, h: 18, rx: 6 },
  { parte: "Perna direita", t: "rect", x: 78, y: 302, w: 16, h: 78, rx: 7 },
  { parte: "Perna esquerda", t: "rect", x: 106, y: 302, w: 16, h: 78, rx: 7 },
  { parte: "Pé direito", t: "ellipse", cx: 86, cy: 392, rx: 12, ry: 9 },
  { parte: "Pé esquerdo", t: "ellipse", cx: 114, cy: 392, rx: 12, ry: 9 },
];

/** Partes que existem só na lista (sem região na silhueta de frente). */
export const SO_LISTA = ["Olhos", "Costas"];

export const PARTES = [
  "Cabeça", "Olhos", "Pescoço",
  "Ombro direito", "Ombro esquerdo",
  "Braço direito", "Braço esquerdo",
  "Mão direita", "Mão esquerda",
  "Tórax", "Abdômen", "Costas", "Quadril",
  "Coxa direita", "Coxa esquerda",
  "Joelho direito", "Joelho esquerdo",
  "Perna direita", "Perna esquerda",
  "Pé direito", "Pé esquerdo",
];

export const COR_SEL = "#dc2626";
export const COR_OFF = "#e5e7eb";
export const COR_STROKE = "#9ca3af";
