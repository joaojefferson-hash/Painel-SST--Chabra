"use client";

import {
  AlertTriangle,
  BookOpen,
  Brain,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  ListChecks,
  Pencil,
  Plus,
  Printer,
  TriangleAlert,
  User,
  Zap,
} from "lucide-react";

// ─── Dados dos checklists ─────────────────────────────────────────────────────

const FISICA_ITENS = [
  {
    label: "Posturas inadequadas / forçadas",
    como: "Observe durante a execução da tarefa. Verifique flexão de tronco > 45°, rotação lateral, braços elevados acima dos ombros, pescoço em extensão ou flexão acentuada, joelhos em posição não neutra.",
    marque_sim: "Se o trabalhador mantém postura fora do neutro por mais de 30% do tempo de trabalho.",
  },
  {
    label: "Movimentos repetitivos",
    como: "Conte repetições do mesmo padrão de movimento. Considere ciclos de trabalho com frequência > 2 movimentos/minuto envolvendo punho, ombro ou coluna.",
    marque_sim: "Se há ciclos de alta frequência por mais de 2 horas contínuas ou 4 horas no turno.",
  },
  {
    label: "Levantamento / transporte de cargas",
    como: "Observe o peso movimentado, a distância do corpo, a frequência e a postura durante o levantamento. Referência: NIOSH recomenda ≤ 23 kg em condições ideais.",
    marque_sim: "Se há levantamentos > 12 kg de forma irregular ou > 5 kg com alta frequência, especialmente fora do envelope neutro.",
  },
  {
    label: "Mobiliário inadequado",
    como: "Avalie mesa, cadeira, monitor, bancada. Verifique regulagem de altura, apoio lombar, apoio de braços, posição do teclado/mouse, distância do monitor.",
    marque_sim: "Se há mobiliário fixo sem regulagem, alturas impróprias para o trabalhador ou ausência de apoio adequado.",
  },
  {
    label: "Esforço físico elevado",
    como: "Avalie percepção de esforço (Escala de Borg), presença de suor, sinais de fadiga e feedback dos trabalhadores. Considere carga, frequência e duração.",
    marque_sim: "Se os trabalhadores relatam esforço elevado (Borg ≥ 13) de forma rotineira.",
  },
  {
    label: "Iluminação inadequada",
    como: "Use luxímetro se disponível (escritório: 500 lux; linha de montagem: 750–1000 lux) ou avalie qualitativamente: sombras, reflexos, necessidade de aproximação excessiva.",
    marque_sim: "Se há relatos de fadiga visual, iluminação visivelmente insuficiente ou excessiva para a tarefa.",
  },
  {
    label: "Ruído / ambiente sonoro adverso",
    como: "Avalie se a comunicação verbal entre trabalhadores exige que gritem. Referência preliminar: > 80 dB(A) exige atenção; > 85 dB(A) exige PCA.",
    marque_sim: "Se há dificuldade de comunicação a 1 metro de distância ou relatos de zumbido ao final do turno.",
  },
  {
    label: "Vibração (corpo inteiro / mãos e braços)",
    como: "Identifique uso de ferramentas vibratórias (esmerilhadeira, martelete, furadeiras) ou operação de veículos/plataformas vibratórias. Avalie tempo de exposição diária.",
    marque_sim: "Se há uso diário de ferramentas vibratórias por mais de 2 horas ou operação de veículos pesados / esteiras.",
  },
  {
    label: "Desconforto térmico",
    como: "Avalie temperatura ambiente, radiação de calor de fornos/máquinas, correntes de ar frio, umidade e EPIs que dificultem a dissipação de calor.",
    marque_sim: "Se trabalhadores relatam desconforto térmico frequente, há sudorese excessiva ou ambiente claramente inadequado (frigoríficos, fundições, áreas abertas sem proteção).",
  },
];

const COGNITIVA_ITENS = [
  {
    label: "Atenção contínua / concentração elevada",
    como: "Identifique tarefas que exigem monitoramento ininterrupto (operação de máquinas de risco, controle de qualidade visual, checkout de caixa). Avalie se há pausas cognitivas programadas.",
    marque_sim: "Se o trabalhador realiza tarefas de alta vigilância por > 2 horas contínuas sem pausa cognitiva.",
  },
  {
    label: "Sobrecarga mental / complexidade da tarefa",
    como: "Observe o número de decisões simultâneas, diversidade de sistemas utilizados, frequência de exceções e interrupções. Consulte o trabalhador sobre percepção de sobrecarga.",
    marque_sim: "Se o trabalhador relata dificuldade frequente de gerenciar todas as demandas cognitivas da função.",
  },
  {
    label: "Pressão psicológica / cobrança excessiva",
    como: "Entreviste trabalhadores sobre cobrança de metas, feedback negativo frequente, monitoramento eletrônico constante e consequências de erros.",
    marque_sim: "Se há relatos consistentes de medo de punição, pressão constante por resultados ou monitoramento punitivo.",
  },
  {
    label: "Excesso de informações simultâneas",
    como: "Avalie quantidade de telas, alertas, chamadas e comunicações que chegam ao mesmo tempo. Identifique se o trabalhador precisa gerenciar múltiplos fluxos de informação em paralelo.",
    marque_sim: "Se o trabalhador opera mais de 3 sistemas distintos simultaneamente ou recebe interrupções constantes que comprometem a execução da tarefa principal.",
  },
  {
    label: "Ritmo mental acelerado",
    como: "Avalie tempo disponível para concluir cada ciclo de tarefa cognitiva. Verifique se há pressão por velocidade de resposta (atendimento ao cliente, linhas de produção com ritmo imposto).",
    marque_sim: "Se o ritmo é ditado por sistema automatizado sem controle do trabalhador e o tempo é insuficiente para execução segura.",
  },
];

const ORGANIZACIONAL_ITENS = [
  {
    label: "Metas agressivas / inatingíveis",
    como: "Consulte indicadores de produtividade e compare com o histórico. Entreviste trabalhadores e liderança. Avalie se o não cumprimento das metas gera punição ou pressão desproporcional.",
    marque_sim: "Se as metas são regularmente não atingidas ou exigem esforço acima da capacidade normal sem reconhecimento.",
  },
  {
    label: "Ausência ou insuficiência de pausas",
    como: "Verifique se há pausas programadas além das obrigatórias por lei (NR-17: para trabalhos repetitivos). Avalie se as pausas são respeitadas na prática ou há pressão informal para não fazê-las.",
    marque_sim: "Se trabalhadores relatam não conseguir fazer as pausas ou se não há pausa além do almoço em turno de 8h.",
  },
  {
    label: "Jornada extensiva / horas extras frequentes",
    como: "Consulte ponto eletrônico ou pergunte sobre a rotina de horas extras. Avalie se as horas extras são voluntárias ou há pressão para realizá-las.",
    marque_sim: "Se a jornada habitual ultrapassa 44h semanais de forma sistemática ou se há horas extras rotineiras sem descanso compensatório adequado.",
  },
  {
    label: "Pressão hierárquica / assédio moral",
    como: "Realize entrevistas individuais e confidenciais. Observe dinâmica de comunicação entre liderança e equipe. Avalie relatos de humilhação, ameaças ou tratamento desrespeitoso.",
    marque_sim: "Se há relatos de constrangimentos públicos, ameaças de demissão como mecanismo de controle ou tratamento humilhante por parte de gestores.",
  },
  {
    label: "Sobrecarga operacional",
    como: "Compare o volume de demandas com o número de trabalhadores e o tempo disponível. Avalie acúmulo de funções, ausência de substitutos e backlog permanente de tarefas.",
    marque_sim: "Se trabalhadores realizam rotineiramente funções além de suas atribuições formais sem ajuste de carga.",
  },
  {
    label: "Déficit de equipe / trabalho solitário",
    como: "Avalie se há trabalhadores que realizam atividades de risco sem apoio de outro profissional. Verifique índice de absenteísmo e sua relação com cobertura de equipe.",
    marque_sim: "Se um trabalhador realiza atividades de risco elevado sozinho ou se a equipe opera cronicamente abaixo do dimensionamento mínimo.",
  },
  {
    label: "Conflito organizacional / falta de suporte",
    como: "Avalie clareza de papéis e responsabilidades, canais de comunicação com a liderança e disponibilidade de suporte técnico/emocional. Identifique conflitos interpessoais recorrentes.",
    marque_sim: "Se há conflitos frequentes entre equipes ou com liderança, papéis mal definidos ou trabalhadores que relatam não ter a quem recorrer diante de dificuldades.",
  },
];

const PASSOS = [
  {
    numero: "01",
    titulo: "Criar Nova Análise",
    icone: Plus,
    cor: "emerald",
    descricao:
      "Clique em \"Nova Análise\" no menu lateral. Selecione a empresa, informe a data de elaboração e o responsável técnico. A análise será salva como Rascunho.",
    dicas: [
      "Use uma análise por empresa ou por grupo de setores relacionados.",
      "O status muda para Concluído automaticamente quando todos os dados são preenchidos.",
    ],
  },
  {
    numero: "02",
    titulo: "Cadastrar Setores",
    icone: Layers,
    cor: "blue",
    descricao:
      "Na aba Setores / Triagem, adicione cada setor ou posto de trabalho da empresa. Dê nomes claros como \"Almoxarifado\", \"Linha de Montagem 01\", \"Escritório Administrativo\".",
    dicas: [
      "Um setor pode representar um departamento inteiro ou uma função específica.",
      "Você pode reordenar os setores arrastando pela alça lateral.",
    ],
  },
  {
    numero: "03",
    titulo: "Aplicar a Triagem Ergonômica",
    icone: ClipboardCheck,
    cor: "orange",
    descricao:
      "Para cada setor, responda os checklists de Ergonomia Física, Cognitiva e Organizacional usando os botões Sim / Não / N/A. Cada item marcado como Sim gera um alerta e alimenta a Matriz de Riscos.",
    dicas: [
      "Baseie a resposta no que você observou in loco — não no que deveria existir.",
      "Use N/A para itens que genuinamente não se aplicam ao contexto do setor.",
    ],
  },
  {
    numero: "04",
    titulo: "Registrar Riscos na Matriz",
    icone: TriangleAlert,
    cor: "yellow",
    descricao:
      "Clique em \"+ Risco\" para registrar formalmente cada risco identificado. Informe o tipo, a descrição, probabilidade e severidade. O sistema calcula o Nível: Trivial, De Atenção, Moderado, Alto ou Crítico.",
    dicas: [
      "Nem todo Sim no checklist precisa virar um risco — agrupe itens relacionados em um único risco quando fizer sentido.",
      "Riscos Altos e Críticos geralmente indicam necessidade de AET completa.",
    ],
  },
  {
    numero: "05",
    titulo: "Redigir Parecer e Recomendações",
    icone: Pencil,
    cor: "purple",
    descricao:
      "Ao final de cada setor, preencha o Parecer Técnico Preliminar e as Recomendações. O parecer resume o diagnóstico; as recomendações orientam as ações a serem tomadas.",
    dicas: [
      "Seja objetivo: referencie os itens que geraram alerta.",
      "Priorize recomendações por urgência — imediatas primeiro, depois preventivas.",
    ],
  },
  {
    numero: "06",
    titulo: "Preencher Dados e Conclusão",
    icone: Info,
    cor: "blue",
    descricao:
      "Na aba Dados / Conclusão, informe os dados gerais da empresa e redija a conclusão técnica do relatório.",
    dicas: [
      "A conclusão deve consolidar os achados de todos os setores.",
      "Use os Textos Padrão para agilizar a redação.",
    ],
  },
  {
    numero: "07",
    titulo: "Gerar e Imprimir o Laudo",
    icone: Printer,
    cor: "gray",
    descricao:
      "Na aba Laudo / Imprimir, visualize o relatório final formatado e exporte o PDF.",
    dicas: [
      "Revise o laudo antes de entregar ao cliente.",
      "O PDF tem formatação otimizada para impressão A4.",
    ],
  },
];

const COR_BG: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200",
  blue: "bg-blue-50 border-blue-200",
  orange: "bg-orange-50 border-orange-200",
  yellow: "bg-yellow-50 border-yellow-200",
  red: "bg-red-50 border-red-200",
  purple: "bg-purple-50 border-purple-200",
  gray: "bg-gray-50 border-gray-200",
};
const COR_ICON: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-100",
  blue: "text-blue-600 bg-blue-100",
  orange: "text-orange-600 bg-orange-100",
  yellow: "text-yellow-700 bg-yellow-100",
  red: "text-red-600 bg-red-100",
  purple: "text-purple-600 bg-purple-100",
  gray: "text-gray-600 bg-gray-100",
};
const COR_NUMERO: Record<string, string> = {
  emerald: "text-emerald-700",
  blue: "text-blue-700",
  orange: "text-orange-700",
  yellow: "text-yellow-700",
  red: "text-red-700",
  purple: "text-purple-700",
  gray: "text-gray-600",
};

// ─── Subcomponente: bloco de item do checklist ────────────────────────────────

function ItemChecklist({
  label,
  como,
  marque_sim,
}: {
  label: string;
  como: string;
  marque_sim: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 space-y-2">
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <span className="mt-0.5 font-semibold text-blue-600 shrink-0">Como avaliar:</span>
          <span>{como}</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <span className="mt-0.5 font-semibold text-red-500 shrink-0">Marque Sim se:</span>
          <span>{marque_sim}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function AepAjudaPage() {
  return (
    <div className="space-y-10 max-w-4xl">

      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <HelpCircle className="size-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Como aplicar a AEP</h1>
          <p className="mt-1 text-sm text-gray-500">
            Guia técnico para realizar a Análise Ergonômica Preliminar — triagem, checklists, parecer e recomendações.
          </p>
        </div>
      </div>

      {/* O que é a AEP */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="size-5 shrink-0 text-emerald-700 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-emerald-900">O que é a AEP?</p>
            <p className="text-sm text-emerald-800">
              A <strong>Análise Ergonômica Preliminar</strong> é uma triagem qualitativa que mapeia os riscos
              ergonômicos por setor, servindo como base para o <strong>GRO/PGR</strong>. É o primeiro passo antes
              da AET (Análise Ergonômica do Trabalho) aprofundada, quando necessário.
            </p>
          </div>
        </div>
      </div>

      {/* Fluxo de trabalho */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Fluxo de trabalho</h2>
        </div>
        <div className="space-y-3">
          {PASSOS.map((passo, i) => {
            const Icone = passo.icone;
            return (
              <div key={i} className={`rounded-xl border p-4 ${COR_BG[passo.cor]}`}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={`flex size-9 items-center justify-center rounded-xl ${COR_ICON[passo.cor]}`}>
                      <Icone className="size-4" />
                    </div>
                    {i < PASSOS.length - 1 && (
                      <ChevronRight className="size-3.5 text-gray-300 rotate-90" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-xs font-bold tabular-nums ${COR_NUMERO[passo.cor]}`}>{passo.numero}</span>
                      <p className="font-semibold text-gray-900 text-sm">{passo.titulo}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{passo.descricao}</p>
                    {passo.dicas.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {passo.dicas.map((dica, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-gray-400" />
                            {dica}
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

      {/* Legenda tristate */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ClipboardCheck className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Como usar os botões Sim / Não / N/A</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white">Sim</span>
              <span className="text-sm font-semibold text-red-700">Fator presente</span>
            </div>
            <p className="text-xs text-red-800">
              O fator de risco foi identificado durante a visita ou entrevista. Gera um <strong>alerta</strong> no
              cabeçalho do checklist e deve embasar um risco na Matriz.
            </p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-green-500 text-white">Não</span>
              <span className="text-sm font-semibold text-green-700">Fator ausente</span>
            </div>
            <p className="text-xs text-green-800">
              O fator foi avaliado e não foi identificado no setor. Registra que a condição foi verificada e está
              controlada ou ausente.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-gray-400 text-white">N/A</span>
              <span className="text-sm font-semibold text-gray-700">Não se aplica</span>
            </div>
            <p className="text-xs text-gray-700">
              O item não é pertinente ao setor avaliado. Ex.: vibração de ferramentas em um escritório
              administrativo. Use com critério — não substitui "Não".
            </p>
          </div>
        </div>
      </div>

      {/* ── Ergonomia Física ── */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
            <User className="size-4 text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Ergonomia Física</h2>
            <p className="text-xs text-gray-500">
              Avalia as condições biomecânicas, posturais e ambientais do trabalho.
            </p>
          </div>
        </div>
        <div className="space-y-3 bg-blue-50 rounded-xl border border-blue-200 p-4">
          {FISICA_ITENS.map((item, i) => (
            <ItemChecklist key={i} {...item} />
          ))}
        </div>
      </div>

      {/* ── Ergonomia Cognitiva ── */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100">
            <Brain className="size-4 text-purple-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Ergonomia Cognitiva</h2>
            <p className="text-xs text-gray-500">
              Avalia a carga mental, demanda de atenção e processamento de informações.
            </p>
          </div>
        </div>
        <div className="space-y-3 bg-purple-50 rounded-xl border border-purple-200 p-4">
          {COGNITIVA_ITENS.map((item, i) => (
            <ItemChecklist key={i} {...item} />
          ))}
        </div>
      </div>

      {/* ── Ergonomia Organizacional ── */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
            <Building2 className="size-4 text-orange-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Ergonomia Organizacional</h2>
            <p className="text-xs text-gray-500">
              Avalia a estrutura do trabalho: jornada, metas, relações hierárquicas e gestão de pessoas.
            </p>
          </div>
        </div>
        <div className="space-y-3 bg-orange-50 rounded-xl border border-orange-200 p-4">
          {ORGANIZACIONAL_ITENS.map((item, i) => (
            <ItemChecklist key={i} {...item} />
          ))}
        </div>
      </div>

      {/* ── Parecer Técnico Preliminar ── */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
            <FileText className="size-4 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Parecer Técnico Preliminar</h2>
            <p className="text-xs text-gray-500">
              Campo de texto por setor — resume o diagnóstico ergonômico da área avaliada.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
          <p className="text-sm text-gray-700">
            O Parecer é o diagnóstico técnico do profissional sobre as condições do setor. Deve ser objetivo,
            fundamentado nas observações e entrevistas realizadas in loco, e referir os fatores identificados nos checklists.
          </p>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">O que incluir</p>
            {[
              ["Síntese dos fatores identificados", "Cite os principais itens marcados como Sim nos checklists, agrupando por categoria quando possível."],
              ["Nível de risco predominante", "Indique se o setor apresenta risco Trivial, De Atenção, Moderado, Alto ou Crítico com base na Matriz de Riscos preenchida."],
              ["Contexto relevante", "Mencione o número de trabalhadores expostos, turnos de trabalho, perfil da atividade e quaisquer condicionantes que influenciem o risco."],
              ["Necessidade de aprofundamento", "Se identificou riscos Altos ou Críticos, indique explicitamente que o setor necessita de AET completa."],
            ].map(([titulo, desc], i) => (
              <div key={i} className="rounded-lg border border-emerald-200 bg-white p-3.5 flex items-start gap-3">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{titulo}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-emerald-300 bg-white p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Exemplo de parecer</p>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "O setor de Produção — Linha de Montagem apresenta fatores de risco ergonômico de nível Moderado a Alto.
              Foram identificados movimentos repetitivos de membros superiores com alta frequência, posturas inadequadas
              de tronco e ausência de pausas programadas além do horário de almoço. O mobiliário é fixo e não permite
              regulagem para trabalhadores com diferentes biotipologias. Recomenda-se elaboração de AET específica para
              este posto de trabalho."
            </p>
          </div>
        </div>
      </div>

      {/* ── Recomendações ── */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
            <Zap className="size-4 text-amber-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Recomendações</h2>
            <p className="text-xs text-gray-500">
              Campo de texto por setor — orienta as ações para eliminar ou controlar os riscos identificados.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
          <p className="text-sm text-gray-700">
            As recomendações devem ser <strong>específicas, acionáveis e priorizadas</strong>. Evite recomendações
            genéricas como "melhorar as condições de trabalho" — prefira indicações concretas com referência à
            norma aplicável quando possível.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                titulo: "Imediatas",
                cor: "bg-red-50 border-red-200",
                titulo_cor: "text-red-700",
                icon: AlertTriangle,
                icon_cor: "text-red-500",
                desc: "Ações que devem ser tomadas em até 30 dias. Reservadas para riscos Altos e Críticos com potencial de dano imediato.",
                ex: "Substituir imediatamente o banco sem apoio lombar na estação de caixa.",
              },
              {
                titulo: "Preventivas",
                cor: "bg-yellow-50 border-yellow-200",
                titulo_cor: "text-yellow-700",
                icon: Info,
                icon_cor: "text-yellow-500",
                desc: "Ações de médio prazo (30–90 dias) que reduzem a probabilidade de agravamento do risco.",
                ex: "Implementar pausas de 10 min a cada 2h para operadores de caixa a partir do próximo período.",
              },
              {
                titulo: "Estruturais",
                cor: "bg-blue-50 border-blue-200",
                titulo_cor: "text-blue-700",
                icon: Building2,
                icon_cor: "text-blue-500",
                desc: "Mudanças de longo prazo (> 90 dias) que modificam o processo, o ambiente ou a organização do trabalho.",
                ex: "Incluir dimensionamento de equipe mínima para a função no próximo processo seletivo.",
              },
            ].map((card, i) => {
              const Icone = card.icon;
              return (
                <div key={i} className={`rounded-lg border p-4 space-y-2 ${card.cor}`}>
                  <div className="flex items-center gap-2">
                    <Icone className={`size-4 shrink-0 ${card.icon_cor}`} />
                    <p className={`text-sm font-semibold ${card.titulo_cor}`}>{card.titulo}</p>
                  </div>
                  <p className="text-xs text-gray-700">{card.desc}</p>
                  <div className="rounded border border-white/80 bg-white/60 p-2">
                    <p className="text-xs text-gray-500 mb-0.5 font-semibold">Exemplo:</p>
                    <p className="text-xs text-gray-700 italic">{card.ex}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-lg border border-amber-300 bg-white p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Exemplo de recomendações</p>
            <ul className="space-y-1.5 text-sm text-gray-700">
              {[
                "[Imediata] Suspender levantamento manual acima de 20 kg no setor de Expedição até treinamento de ergonomia ser realizado.",
                "[Preventiva] Implantar rodízio de funções a cada 2h na Linha de Montagem para reduzir a exposição a movimentos repetitivos.",
                "[Estrutural] Adquirir cadeiras ergonômicas reguláveis (altura, apoio lombar, apoio de braços) para todas as estações do setor Administrativo.",
                "[Estrutural] Elaborar AET completa para o posto de Operador de Empilhadeira — risco identificado como Alto.",
              ].map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AEP vs AET */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">AEP × AET — quando usar cada uma?</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Critério</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">AEP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">AET</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Profundidade", "Triagem / qualitativa", "Análise aprofundada"],
                ["Abrangência", "Toda a empresa", "Setor ou posto específico"],
                ["Tempo estimado", "Horas a 1 dia", "Dias a semanas"],
                ["Exige medições", "Não obrigatoriamente", "Sim (biomecânica, ambiente)"],
                ["Resultado", "Mapa de riscos + prioridades", "Laudo técnico detalhado"],
                ["Quando realizar", "Início do GRO/PGR ou visita inicial", "Riscos Altos/Críticos identificados na AEP"],
              ].map(([criterio, aep, aet], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3 font-medium text-gray-700">{criterio}</td>
                  <td className="px-4 py-3 text-gray-600">{aep}</td>
                  <td className="px-4 py-3 text-gray-600">{aet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Boas práticas */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="size-5 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-2">Boas práticas durante a visita</p>
            <ul className="space-y-1.5 text-sm text-amber-800">
              {[
                "Realize a visita in loco antes de preencher — não baseie a triagem apenas em descrições de cargo.",
                "Entreviste os trabalhadores individualmente; eles conhecem os riscos do dia a dia melhor do que a gestão.",
                "Documente com fotos e observações diretas para embasar as classificações de risco.",
                "Avalie o setor em diferentes momentos do turno — o risco pode ser maior no início ou no final.",
                "Não preencha os checklists do escritório: leve o dispositivo para a área e responda no momento da observação.",
                "Use N/A com critério — se houver dúvida entre N/A e Não, prefira Não (foi avaliado e descartado).",
              ].map((dica, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                  {dica}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
