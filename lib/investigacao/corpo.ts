// Partes do corpo + regiões da silhueta humana (frente e costas).
// Compartilhado entre o editor (BodyMap, clicável) e o laudo PDF (BodyMapStatic).
// Lados E/D na perspectiva do acidentado (direita dele = esquerda de quem olha).

export type Vista = "frente" | "costas" | "ambos";

export type Regiao = { parte: string; view: Vista } & (
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { t: "path"; d: string }
);

export const VIEWBOX = "0 0 220 500";

// Áreas do tronco reutilizadas (frente = tórax/abdômen/quadril; costas = costas/lombar/glúteos).
const TRONCO_SUP = "M62 106 C70 100 88 97 110 97 C132 97 150 100 158 106 C156 134 154 154 150 168 L70 168 C66 154 64 134 62 106 Z";
const TRONCO_MEIO = "M70 168 L150 168 C148 184 146 200 142 214 L78 214 C74 200 72 184 70 168 Z";
const TRONCO_INF = "M78 214 L142 214 C149 230 153 244 150 256 C147 262 132 262 119 257 L110 249 L101 257 C88 262 73 262 70 256 C67 244 71 230 78 214 Z";

export const REGIOES: Regiao[] = [
  // Cabeça / pescoço (ambos)
  { parte: "Cabeça", view: "ambos", t: "ellipse", cx: 110, cy: 48, rx: 27, ry: 32 },
  { parte: "Pescoço", view: "ambos", t: "path", d: "M100 78 C100 88 100 95 103 99 L117 99 C120 95 120 88 120 78 C114 84 106 84 100 78 Z" },
  // Ombros (ambos)
  { parte: "Ombro direito", view: "ambos", t: "path", d: "M60 100 C50 99 42 104 39 113 C48 110 56 107 65 109 C65 104 63 101 60 100 Z" },
  { parte: "Ombro esquerdo", view: "ambos", t: "path", d: "M160 100 C170 99 178 104 181 113 C172 110 164 107 155 109 C155 104 157 101 160 100 Z" },
  // Tronco — frente
  { parte: "Tórax", view: "frente", t: "path", d: TRONCO_SUP },
  { parte: "Abdômen", view: "frente", t: "path", d: TRONCO_MEIO },
  { parte: "Quadril", view: "frente", t: "path", d: TRONCO_INF },
  // Tronco — costas
  { parte: "Costas", view: "costas", t: "path", d: TRONCO_SUP },
  { parte: "Lombar", view: "costas", t: "path", d: TRONCO_MEIO },
  { parte: "Glúteos", view: "costas", t: "path", d: TRONCO_INF },
  // Braços (ambos)
  { parte: "Braço direito", view: "ambos", t: "path", d: "M60 106 C49 111 43 128 43 152 C43 182 45 210 49 234 C51 240 61 240 63 234 C61 210 61 182 61 154 C61 134 63 120 67 110 C66 106 62 104 60 106 Z" },
  { parte: "Braço esquerdo", view: "ambos", t: "path", d: "M160 106 C171 111 177 128 177 152 C177 182 175 210 171 234 C169 240 159 240 157 234 C159 210 159 182 159 154 C159 134 157 120 153 110 C154 106 158 104 160 106 Z" },
  // Mãos (ambos)
  { parte: "Mão direita", view: "ambos", t: "ellipse", cx: 55, cy: 248, rx: 12, ry: 15 },
  { parte: "Mão esquerda", view: "ambos", t: "ellipse", cx: 165, cy: 248, rx: 12, ry: 15 },
  // Coxas (ambos)
  { parte: "Coxa direita", view: "ambos", t: "path", d: "M80 258 C74 286 74 316 78 346 C80 352 97 352 99 346 C102 316 102 286 101 260 C96 256 86 256 80 258 Z" },
  { parte: "Coxa esquerda", view: "ambos", t: "path", d: "M140 258 C146 286 146 316 142 346 C140 352 123 352 121 346 C118 316 118 286 119 260 C124 256 134 256 140 258 Z" },
  // Joelhos (ambos)
  { parte: "Joelho direito", view: "ambos", t: "path", d: "M80 348 C78 359 78 370 83 374 C89 377 95 374 97 369 C99 360 98 352 96 348 C90 350 84 350 80 348 Z" },
  { parte: "Joelho esquerdo", view: "ambos", t: "path", d: "M140 348 C142 359 142 370 137 374 C131 377 125 374 123 369 C121 360 122 352 124 348 C130 350 136 350 140 348 Z" },
  // Pernas (ambos)
  { parte: "Perna direita", view: "ambos", t: "path", d: "M83 374 C81 400 81 432 85 458 C87 464 93 464 95 458 C97 432 97 400 95 374 C91 376 87 376 83 374 Z" },
  { parte: "Perna esquerda", view: "ambos", t: "path", d: "M137 374 C139 400 139 432 135 458 C133 464 127 464 125 458 C123 432 123 400 125 374 C129 376 133 376 137 374 Z" },
  // Pés (ambos)
  { parte: "Pé direito", view: "ambos", t: "ellipse", cx: 88, cy: 474, rx: 13, ry: 9 },
  { parte: "Pé esquerdo", view: "ambos", t: "ellipse", cx: 132, cy: 474, rx: 13, ry: 9 },
];

/** Partes só na lista (sem região na silhueta). */
export const SO_LISTA = ["Olhos"];

export const PARTES = [
  "Cabeça", "Olhos", "Pescoço",
  "Ombro direito", "Ombro esquerdo",
  "Braço direito", "Braço esquerdo",
  "Mão direita", "Mão esquerda",
  "Tórax", "Abdômen", "Quadril",
  "Costas", "Lombar", "Glúteos",
  "Coxa direita", "Coxa esquerda",
  "Joelho direito", "Joelho esquerdo",
  "Perna direita", "Perna esquerda",
  "Pé direito", "Pé esquerdo",
];

export function regioesDaVista(v: "frente" | "costas"): Regiao[] {
  return REGIOES.filter((r) => r.view === "ambos" || r.view === v);
}

export const COR_SEL = "#dc2626";
export const COR_OFF = "#e5e7eb";
export const COR_STROKE = "#9ca3af";
