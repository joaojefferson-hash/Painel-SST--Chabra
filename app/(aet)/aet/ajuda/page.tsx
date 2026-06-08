"use client";

import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  ListChecks,
  Pencil,
  Plus,
  Printer,
  Ruler,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { useState, useCallback } from "react";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface ItemData {
  label: string;
  conceito: string;
  como: string[];
  atencao?: string;
  marque_sim: string;
}

// ─── Dados — Fatores de Risco ─────────────────────────────────────────────────

const FATORES_ITENS: ItemData[] = [
  {
    label: "Postura e carga musculoesquelética",
    conceito:
      "A postura é o elemento central da avaliação ergonômica física. O instrumento padrão para membros superiores e pescoço é o RULA (Rapid Upper Limb Assessment, McAtamney & Corlett, 1993) — que classifica posturas em scores de 1 a 7 com ações recomendadas. Para o corpo todo, usa-se o REBA (Rapid Entire Body Assessment, Hignett & McAtamney, 2000). A pontuação não é aleatória: considera ângulo, duração, repetição e força simultânea. Um braço elevado a 90° com torção de tronco e carga de 5 kg pontua diferente do mesmo braço a 45° sem carga — mesmo que visualmente \"pareçam parecidos\". A precisão metodológica é o que diferencia um laudo técnico de uma impressão visual.",
    como: [
      "RULA: avalie os dois lados separadamente. No formulário: Grupo A (braço, antebraço, punho e giro de punho) → escore 1–6; Grupo B (pescoço, tronco e pernas) → escore 1–6. Combine na tabela C → escore final 1–7. Ação: 1–2 aceitável; 3–4 investigar; 5–6 mudança em breve; 7 mudança imediata.",
      "REBA: ideal para tarefas com envolvimento de corpo inteiro (movimentação de cargas, trabalho em pé com posturas variadas). Segue lógica similar ao RULA — grupos A e B → score C → ação 1–15.",
      "Registre o ciclo observado: se a postura varia, avalie o pico postural (posição mais extrema no ciclo) e a postura média. Ambas são relevantes.",
      "Para postura estática: registre o tempo contínuo de manutenção. > 4 min parado na mesma posição, mesmo em posição próxima do neutro, é fator de risco.",
      "Documente com foto ou vídeo: ângulos posturais são difíceis de transmitir em texto. A imagem é a evidência mais clara que você tem.",
    ],
    atencao:
      "Não avalie apenas a postura que o trabalhador adota quando sabe que está sendo observado. Posturas de alta exposição muitas vezes desaparecem quando há observador presente — a postura de \"correção\" dura minutos, não o turno.",
    marque_sim:
      "RULA ≥ 5 ou REBA ≥ 8 em qualquer segmento corporal, ou manutenção de postura não-neutra por > 30% do ciclo de trabalho.",
  },
  {
    label: "Força e esforço mecânico",
    conceito:
      "A força muscular exercida no trabalho gera risco quando supera determinados limiares de forma repetida ou sustentada. A escala de Borg CR-10 (0–10) é o instrumento padrão para avaliação subjetiva do esforço percebido — simples, validada e de aplicação imediata. Para força de aperto e de preensão, o dinamômetro de mão (grip strength test) oferece medições objetivas. A força combinada com repetição ou postura inadequada tem efeito multiplicador no risco: empurrar uma alavanca com o punho em extensão é mais lesivo que a mesma força com o punho em posição neutra, mesmo com carga idêntica.",
    como: [
      "Borg CR-10: mostre a escala ao trabalhador durante a tarefa real. \"Quanto esforço você está sentindo agora, de 0 a 10?\" Borg ≥ 5 de forma habitual é risco significativo.",
      "Categorize a tarefa por nível de força (NIOSH): força de aperto < 10 N = leve; 10–45 N = moderada; > 45 N = elevada. Referência de ordem de grandeza: aperto de torneira padrão ≈ 10–20 N; aperto de ferramenta pneumática ≈ 50–100 N.",
      "Avalie a força + duração: uma força moderada (Borg 4) por 7h contínuas é mais lesiva que força alta (Borg 7) por 30 minutos com recuperação.",
      "Observe compensações: trabalhadores que levantam o ombro, seguram a respiração ou contraem outros grupos musculares durante a tarefa estão compensando esforço excessivo.",
      "Para movimentação de cargas: aplique a Equação NIOSH. LPR = 23 × HM × VM × DM × AM × FM × CM. Índice de Levantamento = peso real ÷ LPR. IL > 1,0 indica risco; IL > 3,0 é alto risco.",
    ],
    atencao:
      "Não confunda \"o trabalhador aguenta\" com \"é seguro\". Trabalhadores adaptados a cargas excessivas têm limiar de percepção de esforço deslocado — relatam Borg 4 em situações que terceiros classificariam como 7.",
    marque_sim:
      "Borg CR-10 ≥ 5 de forma habitual, Índice de Levantamento NIOSH > 1,0, ou tarefas com força de aperto classificada como elevada (> 45 N) por > 1h/turno.",
  },
  {
    label: "Repetitividade",
    conceito:
      "A repetitividade é o fator de risco musculoesquelético mais prevalente no trabalho industrial e de serviços. A classificação crítica é: ciclo < 30 segundos = alta repetição por definição (Silverstein, 1987). Mas o conceito vai além do ciclo — o OCRA Index (Occupational Repetitive Actions, Colombini et al.) é o método mais completo para quantificação: considera frequência técnica de ações, recuperação, postura, força, fatores adicionais e tempo real de exposição no turno. OCRA ≤ 2,2 = aceitável; 2,3–3,5 = muito leve; 3,6–9,0 = leve; 9,1–22,5 = médio; > 22,5 = alto.",
    como: [
      "Cronometre o ciclo: tempo do início de uma operação completa ao início da próxima idêntica. Ciclo < 30s → alta repetição automática.",
      "Conte ações técnicas por minuto (ATM): cada movimento distinto (pega, soltar, girar, pressionar) conta como 1 ação. Referência OCRA: 20–40 ATM = aceitável; > 40 ATM = elevado para a maioria das tarefas.",
      "Calcule o tempo real de exposição: se o trabalhador faz 8h de turno mas a tarefa repetitiva é apenas 5h (com outras atividades intercaladas), use 5h no cálculo.",
      "Verifique o padrão de recuperação: o OCRA penaliza pesadamente ausência de períodos de recuperação (pausa ou atividade não repetitiva). Trabalho contínuo sem recuperação multiplica o risco.",
      "Para triagem rápida sem OCRA completo: ciclo < 30s OU > 4h de exposição à repetição no turno OU frequência > 40 ATM → classifique como risco moderado mínimo e aprofunde.",
    ],
    atencao:
      "A repetitividade de membros inferiores (pedais, caminhar rápido, subir e descer) raramente é avaliada mas causa lesão real em operadores de pedal, trabalhadores de logística e cirurgiões de pé.",
    marque_sim:
      "Ciclo < 30 segundos, > 4h de exposição à repetição no turno, OCRA Index > 9,0, ou combinação de repetição moderada com postura inadequada por > 2h contínuas.",
  },
  {
    label: "Vibração",
    conceito:
      "A vibração transmitida pelas mãos (HAV — Hand Arm Vibration) e ao corpo inteiro (WBV — Whole Body Vibration) são riscos comprovados com limites normativos definidos pelas ISO 5349-1 e ISO 2631-1 respectivamente. Para HAV, as frequências lesivas ficam na faixa de 8–16 Hz (exatamente a de ferramentas pneumáticas e elétricas) e causam Síndrome de Raynaud, neuropatia vibratória e artrose precoce. Para WBV, a faixa crítica é 0,5–80 Hz, com alvo na coluna lombar — hernias e artrose lombar precoce em operadores de veículos pesados são achados frequentes.",
    como: [
      "HAV — inventarie todas as ferramentas vibratórias usadas no setor: esmerilhadeiras, furadeiras de impacto, marteletes, pistolas pneumáticas, compactadores. Registre o tempo de uso diário de cada.",
      "Valores limites ISO 5349-1: valor de ação = 2,5 m/s² (8h equivalente); limite de exposição = 5,0 m/s². Para triagem sem acelerômetro: martelete demolidor > 30 min/dia → Sim; esmerilhadora angular > 2h/dia → Sim.",
      "WBV — identifique veículos: empilhadeiras, tratores, caminhões, plataformas vibratórias. Valor de ação ISO 2631-1: 0,5 m/s²; limite: 1,15 m/s². Para triagem: empilhadeira em piso irregular > 4h/turno → Sim.",
      "Verifique o estado dos amortecedores do assento: assentos de veículos desgastados multiplicam a transmissão de vibração para o operador. Assento sem amortecimento funcional em empilhadeira = risco automaticamente elevado.",
      "Para HAV: pergunte sobre sintomas de Síndrome de Raynaud — dedos que ficam brancos ou dormentes no frio ou após uso das ferramentas. Em jovens (< 35 anos), esse sintoma é altamente sugestivo de neuropatia vibratória.",
    ],
    atencao:
      "Não ignore a vibração de veículos por parecer \"suave\". Empilhadeiras em piso de concreto rugoso, sem amortecimento no assento, podem entregar doses de WBV equivalentes a caminhões fora de estrada.",
    marque_sim:
      "Uso de ferramentas HAV > 2h/dia, operação de veículos WBV > 4h/turno, ou sintomas de Síndrome de Raynaud em trabalhadores com uso de ferramentas vibratórias.",
  },
  {
    label: "Ambiente térmico e físico",
    conceito:
      "O ambiente de trabalho inclui temperatura, umidade, ventilação, ruído e iluminação. A AET aprofunda a triagem feita na AEP com medições específicas quando indicado. Para o calor, o instrumento padrão é o IBUTG (Índice de Bulbo Úmido Termômetro de Globo), medido com termômetro de globo + bulbo úmido + bulbo seco. Para o ruído, o dosímetro de ruído ou medidor de nível de pressão sonora são instrumentos básicos da avaliação. Para a iluminação, o luxímetro fornece valores no plano de trabalho comparáveis com os da NBR ISO/CIE 8995-1.",
    como: [
      "IBUTG: ambientes com calor moderado a intenso, especialmente com carga solar ou fontes de calor radiante. Limites NR-15 Anexo 3 por tipo de atividade: leve (< 175 W) → 30,0°C; moderado (175–350 W) → 26,7°C; pesado (> 350 W) → 25,0°C.",
      "Ruído: use o dosímetro para jornada completa ou o medidor de NPS para cada posto. Limite NR-15 Anexo 1: 85 dB(A) por 8h. A cada 5 dB(A) de aumento, o tempo permitido cai à metade. Registre os pontos de medição e horário.",
      "Iluminação: meça no plano de trabalho na direção da tarefa. Mínimos NBR ISO/CIE 8995-1: escritório geral 500 lux; montagem fina 750–1.000 lux; inspeção visual 1.000–1.500 lux.",
      "Verifique a uniformidade: diferença de iluminância entre posto e entorno > 10:1 causa fadiga visual por adaptação constante — mesmo que cada zona individualmente esteja adequada.",
      "Temperaturas extremas: abaixo de 0°C (câmaras frias), verifique equipamentos de proteção térmica, limite de exposição contínua e protocolo de aquecimento periódico.",
    ],
    atencao:
      "Avalie sempre no plano real de trabalho, não a 0,75 m do chão por padrão. Uma medição de iluminação feita na posição \"padrão\" quando o trabalho é realizado a 1,20 m de altura é simplesmente inútil.",
    marque_sim:
      "IBUTG acima dos limites para a atividade, NPS > 85 dB(A) sem protetor auditivo, iluminância < 50% do mínimo para a tarefa, ou temperatura < 5°C sem proteção térmica adequada.",
  },
];

// ─── Passos ───────────────────────────────────────────────────────────────────

const PASSOS = [
  {
    n: "01",
    titulo: "Criar novo laudo",
    icone: Plus,
    cor: "emerald",
    descricao:
      "Clique em \"Novo Laudo\" no menu lateral. Selecione empresa, responsável técnico e data. O laudo nasce como Rascunho.",
    dicas: [
      "Crie um laudo por setor ou grupo homogêneo avaliado.",
      "O técnico responsável assina o laudo — confira as credenciais antes de gerar o PDF.",
    ],
  },
  {
    n: "02",
    titulo: "Adicionar setores",
    icone: Layers,
    cor: "blue",
    descricao:
      "Cadastre cada posto de trabalho ou setor avaliado. Especifique o cargo, número de trabalhadores, turno e carga horária exposta.",
    dicas: [
      "Um setor com sub-postos diferentes (ex: montagem e embalagem na mesma linha) deve ter entradas separadas.",
      "A jornada exposta é diferente da jornada total — se o trabalhador passa 4h em tarefa repetitiva e 4h em outra, registre 4h.",
    ],
  },
  {
    n: "03",
    titulo: "Avaliar os 13 fatores de risco",
    icone: ClipboardList,
    cor: "orange",
    descricao:
      "Para cada setor, avalie os 13 fatores no formulário. A escala Likert vai de 1 (ausente/aceitável) a 5 (crítico). O sistema classifica automaticamente em Verde / Amarelo / Laranja / Vermelho.",
    dicas: [
      "Avalie com dados coletados in loco — não de memória após a visita.",
      "Para cada fator que pontua ≥ 3, registre a evidência: metodologia usada, valor medido ou estimado.",
    ],
  },
  {
    n: "04",
    titulo: "Registrar riscos na matriz",
    icone: Activity,
    cor: "yellow",
    descricao:
      "Os fatores com pontuação ≥ 3 devem gerar registros formais na Matriz de Riscos do setor, com tipo, descrição e medidas de controle.",
    dicas: [
      "Agrupe fatores correlacionados (ex: postura + repetitividade) em um único risco quando tiverem mesma fonte.",
      "Riscos Altos e Críticos precisam de medida de controle imediata registrada.",
    ],
  },
  {
    n: "05",
    titulo: "Redigir parecer e recomendações",
    icone: Pencil,
    cor: "purple",
    descricao:
      "Escreva o diagnóstico técnico e as recomendações por setor. Use dados concretos: valores medidos, metodologias aplicadas, tempo de exposição.",
    dicas: [
      "Cite explicitamente o método utilizado (ex: \"RULA aplicado conforme McAtamney e Corlett, 1993\").",
      "Classifique recomendações por urgência: imediata (< 30d), preventiva (30–90d) e estrutural (> 90d).",
    ],
  },
  {
    n: "06",
    titulo: "Gerar o laudo final",
    icone: Printer,
    cor: "blue",
    descricao:
      "Na aba Laudo / Imprimir, visualize o PDF com todos os setores, fatores avaliados e recomendações. Revise antes de entregar.",
    dicas: [
      "O laudo inclui a assinatura eletrônica do técnico responsável.",
      "Entregue sempre o PDF — nunca o acesso ao sistema — para o cliente.",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COR_BG: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200",
  blue: "bg-blue-50 border-blue-200",
  orange: "bg-orange-50 border-orange-200",
  yellow: "bg-yellow-50 border-yellow-200",
  purple: "bg-purple-50 border-purple-200",
  gray: "bg-gray-50 border-gray-200",
};
const COR_ICON: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-100",
  blue: "text-blue-600 bg-blue-100",
  orange: "text-orange-600 bg-orange-100",
  yellow: "text-yellow-700 bg-yellow-100",
  purple: "text-purple-600 bg-purple-100",
  gray: "text-gray-600 bg-gray-100",
};
const COR_NUM: Record<string, string> = {
  emerald: "text-emerald-700",
  blue: "text-blue-700",
  orange: "text-orange-700",
  yellow: "text-yellow-700",
  purple: "text-purple-700",
  gray: "text-gray-600",
};

// ─── ItemChecklist com expansão ───────────────────────────────────────────────

function ItemChecklist({ label, conceito, como, atencao, marque_sim, forceOpen }: ItemData & { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const isOpen = open || !!forceOpen;
  return (
    <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {isOpen ? (
          <ChevronUp className="size-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-gray-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Conceito */}
          <div className="pt-3 space-y-1">
            <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
              Por que é importante?
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">{conceito}</p>
          </div>

          {/* Como aplicar */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Como aplicar na prática
            </p>
            <ul className="space-y-2">
              {como.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="mt-1.5 size-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Atenção */}
          {atencao && (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-amber-600" />
              <p className="text-xs text-amber-800">
                <span className="font-bold">Atenção: </span>
                {atencao}
              </p>
            </div>
          )}

          {/* Critério */}
          <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5">
            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1">
              Critério de uso
            </p>
            <p className="text-xs text-red-800">{marque_sim}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AetAjudaPage() {
  const [printMode, setPrintMode] = useState(false);

  const handlePrint = useCallback(() => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      const reset = () => { setPrintMode(false); window.removeEventListener("afterprint", reset); };
      window.addEventListener("afterprint", reset);
    }, 200);
  }, []);

  return (
    <div className="space-y-10 max-w-4xl">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <HelpCircle className="size-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Guia Técnico da AET — Análise Ergonômica do Trabalho
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manual de instrução para técnicos e engenheiros de segurança do trabalho — metodologias instrumentais, avaliação
              quantitativa de fatores de risco e elaboração de laudo com nexo causal. Base normativa: NR-17 + Portaria MTE 1.121/2023.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="print:hidden shrink-0 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Printer className="size-4" />
          Exportar PDF
        </button>
      </div>

      {/* O que é */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="size-5 shrink-0 text-blue-700 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-blue-900">O que é a AET e qual é o seu papel?</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              A <strong>Análise Ergonômica do Trabalho</strong> é o aprofundamento do que a AEP triou. Enquanto a AEP é qualitativa
              (Sim/Não), a AET é <strong>quantitativa</strong>: usa instrumentos (RULA, REBA, NIOSH, OCRA, sonômetro, luxímetro) e
              avalia setores específicos com risco Alto ou Crítico identificado na triagem preliminar. O resultado é um laudo com{" "}
              <strong>nexo causal</strong>, classificação por fator e plano de intervenção detalhado. A AET não substitui a AEP —
              ela a complementa, aprofundando os pontos onde a triagem apontou necessidade de investigação instrumental. Base
              normativa: <strong>NR-17</strong> + <strong>Portaria MTE 1.121/2023</strong>.
            </p>
            <div className="rounded-lg border border-blue-200 bg-white/70 px-4 py-3 mt-1">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                AEP × AET — diferença fundamental
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-blue-900">
                <div>
                  <p className="font-semibold mb-0.5">AEP (Análise Preliminar)</p>
                  <p className="text-blue-800">Triagem qualitativa de toda a empresa. Checklist Sim/Não. Identifica onde há risco e qual a urgência. Não exige instrumentos.</p>
                </div>
                <div>
                  <p className="font-semibold mb-0.5">AET (Análise Ergonômica do Trabalho)</p>
                  <p className="text-blue-800">Análise quantitativa de postos específicos. Usa RULA, REBA, NIOSH, OCRA, sonômetro, luxímetro. Resulta em laudo com nexo causal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fluxo de trabalho */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Fluxo de trabalho no sistema</h2>
        </div>
        <div className="space-y-3">
          {PASSOS.map((p, i) => {
            const Ic = p.icone;
            return (
              <div key={i} className={`rounded-xl border p-4 ${COR_BG[p.cor]}`}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={`flex size-9 items-center justify-center rounded-xl ${COR_ICON[p.cor]}`}>
                      <Ic className="size-4" />
                    </div>
                    {i < PASSOS.length - 1 && (
                      <ChevronRight className="size-3.5 text-gray-300 rotate-90" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-xs font-bold tabular-nums ${COR_NUM[p.cor]}`}>
                        {p.n}
                      </span>
                      <p className="font-semibold text-gray-900 text-sm">{p.titulo}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{p.descricao}</p>
                    {p.dicas.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {p.dicas.map((d, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-gray-400" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escala Likert */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Ruler className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Escala de pontuação — Likert 1 a 5</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            {
              valor: "1",
              label: "Ausente / Aceitável",
              cor: "border-emerald-200 bg-emerald-50",
              tc: "text-emerald-700",
              bc: "bg-emerald-500",
              desc: "O fator não está presente ou está completamente dentro dos limites aceitáveis. Nenhuma intervenção necessária.",
            },
            {
              valor: "2",
              label: "Leve",
              cor: "border-teal-200 bg-teal-50",
              tc: "text-teal-700",
              bc: "bg-teal-500",
              desc: "Fator presente mas abaixo dos limites de ação. Monitorar na reavaliação periódica.",
            },
            {
              valor: "3",
              label: "Moderado",
              cor: "border-yellow-200 bg-yellow-50",
              tc: "text-yellow-700",
              bc: "bg-yellow-500",
              desc: "Fator presente acima do limite de ação. Deve gerar risco formal na matriz e recomendação preventiva.",
            },
            {
              valor: "4",
              label: "Alto",
              cor: "border-orange-200 bg-orange-50",
              tc: "text-orange-700",
              bc: "bg-orange-500",
              desc: "Fator presente acima do limite de tolerância. Requer intervenção imediata e registro de medida de controle.",
            },
            {
              valor: "5",
              label: "Crítico",
              cor: "border-red-200 bg-red-50",
              tc: "text-red-700",
              bc: "bg-red-500",
              desc: "Fator em nível crítico — risco de dano grave ou imediato. Exige ação emergencial e possível paralisação da atividade.",
            },
          ].map((c, i) => (
            <div key={i} className={`rounded-xl border p-3 space-y-2 ${c.cor}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-white ${c.bc}`}
                >
                  {c.valor}
                </span>
                <span className={`text-xs font-semibold ${c.tc}`}>{c.label}</span>
              </div>
              <p className="text-xs text-gray-700">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-2.5">
          <Info className="size-4 shrink-0 mt-0.5 text-blue-600" />
          <p className="text-xs text-blue-800">
            <span className="font-bold">Regra prática: </span>
            Fatores com pontuação ≥ 3 devem obrigatoriamente gerar um registro formal na Matriz de Riscos do setor. A pontuação
            deve ser sustentada por evidência documentada — valor medido, metodologia aplicada e referência normativa.
          </p>
        </div>
      </div>

      {/* Instrumentos de medição */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100">
            <Ruler className="size-4 text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Instrumentos de medição — referência rápida</h2>
            <p className="text-xs text-gray-500">
              Métodos e instrumentos utilizados na AET, com critérios de aplicação e limites normativos de referência.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          {[
            {
              nome: "RULA",
              fullname: "Rapid Upper Limb Assessment",
              icone: Activity,
              cor: "text-blue-600",
              quando: "Membros superiores e pescoço em tarefas sentadas ou em pé com predomínio de ações de braço.",
              escala: "Score 1–7. Ação: 1–2 aceitável; 3–4 investigar; 5–6 mudar em breve; 7 mudar imediatamente.",
              referencia: "McAtamney & Corlett, 1993 — Applied Ergonomics.",
            },
            {
              nome: "REBA",
              fullname: "Rapid Entire Body Assessment",
              icone: Activity,
              cor: "text-teal-600",
              quando: "Corpo inteiro — tarefas que envolvem tronco, pernas e membros superiores simultaneamente (movimentação de cargas, trabalho em pé com posturas variadas).",
              escala: "Score 1–15. Ação: 1 risco negligível; 2–3 baixo; 4–7 médio; 8–10 alto; 11–15 muito alto.",
              referencia: "Hignett & McAtamney, 2000 — Applied Ergonomics.",
            },
            {
              nome: "NIOSH",
              fullname: "Equação de Levantamento — NIOSH 1994",
              icone: Zap,
              cor: "text-orange-600",
              quando: "Tarefas de levantamento e abaixamento de cargas com dois membros superiores em posições definidas.",
              escala: "IL (Índice de Levantamento) = Peso Real ÷ LPR. IL ≤ 1,0 aceitável; 1,0–3,0 risco moderado; > 3,0 alto risco.",
              referencia: "Waters et al., 1994 — Ergonomics. LPR base = 23 kg com fatores HM, VM, DM, AM, FM, CM.",
            },
            {
              nome: "OCRA Index",
              fullname: "Occupational Repetitive Actions",
              icone: Activity,
              cor: "text-purple-600",
              quando: "Tarefas repetitivas de membros superiores — montagem, embalagem, digitação, costura, caixa de supermercado.",
              escala: "OCRA ≤ 2,2 aceitável; 2,3–3,5 muito leve; 3,6–9,0 leve; 9,1–22,5 médio; > 22,5 alto.",
              referencia: "Colombini, Occhipinti & Grieco — EN ISO 11228-3. Considera: frequência, recuperação, postura, força e fatores adicionais.",
            },
            {
              nome: "Sonômetro / Dosímetro",
              fullname: "Medição de Nível de Pressão Sonora",
              icone: Wind,
              cor: "text-red-600",
              quando: "Setores com fontes de ruído identificadas — produção industrial, gráficas, serrarias, call centers, exposição a ruído de impacto.",
              escala: "NR-15 Anexo 1: 85 dB(A) por 8h = limite de tolerância. A cada +5 dB(A), tempo permitido cai à metade.",
              referencia: "NR-15 Anexos 1 e 2. Medição conforme NHO-01 (FUNDACENTRO). Calibração obrigatória antes das medições.",
            },
            {
              nome: "Luxímetro",
              fullname: "Medição de Iluminância",
              icone: Zap,
              cor: "text-yellow-600",
              quando: "Postos com tarefas visuais relevantes — montagem, inspeção de qualidade, leitura, digitação, costura fina.",
              escala: "NBR ISO/CIE 8995-1: escritório geral 500 lux; montagem fina 750–1.000 lux; inspeção visual 1.000–1.500 lux.",
              referencia: "NBR ISO/CIE 8995-1 (substitui NBR 5413). Medição no plano de trabalho, na direção da tarefa.",
            },
            {
              nome: "IBUTG",
              fullname: "Índice de Bulbo Úmido Termômetro de Globo",
              icone: Thermometer,
              cor: "text-orange-600",
              quando: "Ambientes com calor — fundições, fornos, lavanderias industriais, trabalho externo ao sol, câmaras de secagem.",
              escala: "NR-15 Anexo 3 — leve (< 175 W): 30,0°C; moderado (175–350 W): 26,7°C; pesado (> 350 W): 25,0°C.",
              referencia: "NR-15 Anexo 3. IBUTG = 0,7 Tbn + 0,2 Tg + 0,1 Tbs (ambientes externos) ou 0,7 Tbn + 0,3 Tg (ambientes internos).",
            },
          ].map((inst, i) => {
            const Ic = inst.icone;
            return (
              <div key={i} className="rounded-lg border border-blue-100 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Ic className={`size-4 ${inst.cor}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{inst.nome}</p>
                      <p className="text-xs text-gray-500">{inst.fullname}</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">
                          Quando usar
                        </p>
                        <p className="text-gray-700">{inst.quando}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">
                          Escala / Limites
                        </p>
                        <p className="text-gray-700">{inst.escala}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">
                          Referência
                        </p>
                        <p className="text-gray-700">{inst.referencia}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fatores de risco expandíveis */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100">
            <ClipboardList className="size-4 text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Fatores de risco — como avaliar cada um</h2>
            <p className="text-xs text-gray-500">
              Clique em cada fator para ver o conceito técnico detalhado, como aplicar na prática e o critério de pontuação ≥ 3.
              Referências: NR-17, NR-15, NIOSH, ISO 5349-1, ISO 2631-1, NBR ISO/CIE 8995-1, EN ISO 11228-3.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="rounded-lg border border-blue-100 bg-white/70 px-4 py-3">
            <p className="text-xs text-gray-700 leading-relaxed">
              Para cada fator avaliado com pontuação ≥ 3, registre imediatamente: (1) a metodologia usada, (2) o valor obtido ou
              estimado e (3) a referência normativa consultada. Sem esse registro, o laudo expressa uma opinião subjetiva — não
              uma avaliação técnica. Os itens abaixo detalham como aplicar cada avaliação em campo.
            </p>
          </div>
          {FATORES_ITENS.map((item, i) => (
            <ItemChecklist key={i} {...item} forceOpen={printMode} />
          ))}
        </div>
      </div>

      {/* Como redigir o laudo */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100">
            <FileText className="size-4 text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Como redigir o diagnóstico técnico e as recomendações</h2>
            <p className="text-xs text-gray-500">
              O laudo da AET é um documento técnico com nexo causal — não um relatório de visita.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Um parecer fraco na AET diz <em>&ldquo;há risco ergonômico no setor de montagem&rdquo;</em>. Um parecer forte diz{" "}
            <em>
              &ldquo;o setor de Montagem 01 apresenta risco ergonômico de nível Alto caracterizado por: RULA score 6 no membro superior
              direito (braço elevado 80°, punho em desvio ulnar de 20°, ciclo de 22 segundos, 6h de exposição/turno); OCRA Index
              estimado de 12,4 (médio-alto) para flexores dos dedos; ausência de períodos de recuperação além do almoço&rdquo;
            </em>
            . A diferença é a especificidade — ela é o que transforma uma visita em um documento técnico com valor legal e
            clínico real.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Estrutura recomendada do diagnóstico (5 elementos)
            </p>
            {[
              [
                "1. Fatores identificados com evidência",
                "Liste cada fator com pontuação ≥ 3, citando: metodologia usada, valor obtido, referência normativa e tempo de exposição. Ex.: \"RULA score 6 no membro superior direito (braço a 80°, ciclo 22s, 6h/turno) — mudança imediata recomendada conforme McAtamney & Corlett, 1993.\"",
              ],
              [
                "2. Nexo causal",
                "Relacione os fatores encontrados às patologias conhecidas que podem resultar deles. Ex.: \"A combinação de OCRA > 9 com RULA score ≥ 5 caracteriza perfil clássico de risco para tendinite de manguito rotador e síndrome do túnel do carpo (DORT grupo II, CID M65–M77).\"",
              ],
              [
                "3. Nível de risco predominante",
                "Declare explicitamente o nível — Verde / Amarelo / Laranja / Vermelho — conforme a pontuação mais alta do setor. O leitor do laudo precisa entender a urgência sem consultar os dados brutos.",
              ],
              [
                "4. Trabalhadores expostos",
                "Número de trabalhadores, cargos, turnos, regime de trabalho e qualquer condicionante relevante (restrições médicas, gestantes, trabalhadores novos com < 3 meses na função).",
              ],
              [
                "5. Plano de intervenção por urgência",
                "Divida as recomendações em: imediatas (< 30d) para riscos Altos/Críticos, preventivas (30–90d) e estruturais (> 90d). Cada recomendação deve ser específica o suficiente para que um engenheiro de processos a implemente sem precisar perguntar o que você quis dizer.",
              ],
            ].map(([t, d], i) => (
              <div
                key={i}
                className="rounded-lg border border-blue-100 bg-white p-3.5 flex items-start gap-3"
              >
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Exemplo de diagnóstico */}
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Exemplo de diagnóstico técnico — Setor de Montagem de Componentes
            </p>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              &ldquo;O setor de Montagem de Componentes Eletrônicos (Linha 03) apresenta risco ergonômico de nível Alto. Foram
              identificados os seguintes fatores: (1) RULA score 6 no membro superior direito — braço elevado entre 70–90°,
              punho em desvio ulnar de 15–20°, ciclo de 22 segundos, exposição estimada de 5,5h/turno; ação: mudança em breve
              (McAtamney & Corlett, 1993); (2) OCRA Index estimado de 11,3 — frequência de 45 ATM/min, ausência de períodos de
              recuperação, força de preensão classificada como moderada; nível médio (EN ISO 11228-3); (3) iluminância medida
              de 310 lux no plano de trabalho — abaixo do mínimo de 750 lux para montagem fina (NBR ISO/CIE 8995-1), com
              reflexo de luminária no microscópio de inspeção identificado. Foram entrevistados 8 dos 12 trabalhadores do setor:
              7 relatam dor em punhos e ombros com frequência semanal; 4 relatam zumbido transitório pós-turno. A combinação
              dos fatores identificados caracteriza perfil de risco para DORT de membros superiores (CID M65–M77) e perda
              auditiva induzida por ruído (CID H83.3) — embora o NPS medido seja 82 dB(A), abaixo do limite de tolerância.
              Recomenda-se intervenção imediata no layout do posto e implantação de pausas programadas.&rdquo;
            </p>
          </div>

          {/* Recomendações por urgência */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Classificação das recomendações por urgência
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  titulo: "Imediatas",
                  prazo: "até 30 dias",
                  cor: "bg-red-50 border-red-200",
                  tc: "text-red-700",
                  ic: "text-red-500",
                  desc: "Para fatores com pontuação 4–5 ou RULA/REBA acima do nível de mudança imediata. Não podem aguardar planejamento orçamentário.",
                  ex: "[Imediata] Suspender tarefas com RULA score 7 no membro superior direito até reestruturação do posto de montagem — implantar suporte de braço ajustável como medida provisória.",
                },
                {
                  titulo: "Preventivas",
                  prazo: "30–90 dias",
                  cor: "bg-yellow-50 border-yellow-200",
                  tc: "text-yellow-700",
                  ic: "text-yellow-500",
                  desc: "Ações que reduzem a probabilidade de agravamento. Envolvem treinamento, reorganização ou aquisição de baixo custo.",
                  ex: "[Preventiva] Implantar pausas de 10 min a cada 50 min para tarefas com OCRA > 9,0, com rodízio de postos conforme NR-17 7.4.",
                },
                {
                  titulo: "Estruturais",
                  prazo: "> 90 dias",
                  cor: "bg-blue-50 border-blue-200",
                  tc: "text-blue-700",
                  ic: "text-blue-500",
                  desc: "Mudanças que modificam o processo ou o ambiente. Exigem projeto, investimento ou reestruturação de layout.",
                  ex: "[Estrutural] Redesenhar o posto de montagem com bancada de altura regulável (800–1.100 mm) e posicionamento de componentes dentro da zona de conforto articular.",
                },
              ].map((c, i) => (
                <div key={i} className={`rounded-lg border p-4 space-y-2 ${c.cor}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`size-4 shrink-0 ${c.ic}`} />
                    <p className={`text-sm font-semibold ${c.tc}`}>{c.titulo}</p>
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Prazo sugerido: {c.prazo}
                  </p>
                  <p className="text-xs text-gray-700">{c.desc}</p>
                  <div className="rounded border border-white/80 bg-white/60 p-2">
                    <p className="text-xs text-gray-500 mb-0.5 font-semibold">Exemplo:</p>
                    <p className="text-xs text-gray-700 italic">{c.ex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Boas práticas */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="size-5 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-3">
              Boas práticas de campo — o que diferencia um laudo técnico de uma opinião
            </p>
            <ul className="space-y-2 text-sm text-amber-800">
              {[
                "Realize a visita de campo ANTES de preencher o sistema. Nunca preencha de memória — os detalhes técnicos que diferenciam um laudo bom de um excelente se perdem em horas.",
                "Para cada fator avaliado, registre imediatamente o método, o valor obtido e a referência normativa usada. Sem isso, o laudo vira opinião, não ciência.",
                "Combine múltiplas fontes: observação + entrevista + dados de saúde (histórico de atestados, diagnósticos de LER/DORT) + dados de produção (metas, cadência). Nenhuma fonte isolada dá o quadro completo.",
                "Avalie o mesmo posto em pelo menos dois momentos do turno: no início (trabalhador \"fresco\") e depois de 3–4h (fadiga instalada). As posturas e o ritmo mudam significativamente.",
                "O laudo da AET deve ser suficientemente específico para que um engenheiro de processos consiga implementar as recomendações sem precisar perguntar o que você quis dizer.",
              ].map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
