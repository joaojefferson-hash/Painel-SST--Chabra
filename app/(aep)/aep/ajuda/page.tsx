"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  ListChecks,
  Plus,
  Printer,
  TriangleAlert,
} from "lucide-react";

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
    titulo: "Registrar Riscos Ergonômicos",
    icone: ClipboardCheck,
    cor: "orange",
    descricao:
      "Para cada setor, adicione os riscos ergonômicos identificados. Informe a atividade, a descrição do risco e a fonte/causa. Os tipos incluem biomecânico, cognitivo, organizacional e ambiental.",
    dicas: [
      "Registre o que você observou in loco, não o que deveria existir.",
      "Um setor pode ter múltiplos riscos — adicione todos que forem identificados.",
    ],
  },
  {
    numero: "04",
    titulo: "Classificar a Gravidade",
    icone: TriangleAlert,
    cor: "yellow",
    descricao:
      "Para cada risco, informe Probabilidade e Severidade. O sistema calcula automaticamente o Nível de Risco: Trivial, De Atenção, Moderado, Alto ou Crítico.",
    dicas: [
      "Baseie a classificação na situação atual, sem considerar medidas de controle inexistentes.",
      "Riscos Altos e Críticos exigem atenção imediata e geralmente indicam necessidade de AET completa.",
    ],
  },
  {
    numero: "05",
    titulo: "Indicar Necessidade de AET",
    icone: AlertTriangle,
    cor: "red",
    descricao:
      "Se o setor apresentar riscos que demandam análise aprofundada, marque \"Necessita AET completa\". Isso será destacado no laudo para orientar a contratação de Análise Ergonômica do Trabalho.",
    dicas: [
      "A AEP é uma triagem — riscos críticos identificados aqui devem evoluir para AET.",
      "Setores sem riscos críticos podem ser gerenciados com medidas básicas de controle.",
    ],
  },
  {
    numero: "06",
    titulo: "Preencher Dados e Conclusão",
    icone: Info,
    cor: "purple",
    descricao:
      "Na aba Dados / Conclusão, informe os dados gerais da empresa (CNPJ, endereço, atividade econômica) e redigir a conclusão técnica do relatório. Use o campo de texto enriquecido para formatação.",
    dicas: [
      "A conclusão deve resumir os principais achados e as recomendações prioritárias.",
      "Você pode usar os Textos Padrão para agilizar a redação da conclusão.",
    ],
  },
  {
    numero: "07",
    titulo: "Gerar e Imprimir o Laudo",
    icone: Printer,
    cor: "gray",
    descricao:
      "Na aba Laudo / Imprimir, visualize o relatório final formatado. Clique em \"Baixar PDF\" para exportar ou utilize a impressão do navegador. O laudo inclui todos os setores, riscos e recomendações.",
    dicas: [
      "Revise o laudo antes de entregar ao cliente.",
      "O PDF gerado tem formatação otimizada para impressão A4.",
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

export default function AepAjudaPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <HelpCircle className="size-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Como aplicar a AEP
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Guia passo a passo para realizar a Análise Ergonômica Preliminar na empresa.
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
              A <strong>Análise Ergonômica Preliminar</strong> é uma triagem ergonômica que identifica e classifica os
              riscos nos postos de trabalho, servindo como base para o <strong>GRO/PGR</strong>. É o primeiro passo
              antes da elaboração da AET (Análise Ergonômica do Trabalho) completa, quando necessário.
            </p>
            <p className="text-sm text-emerald-800">
              Diferente da AET, a AEP é uma <strong>avaliação qualitativa e preliminar</strong> — mais rápida e
              abrangente, ideal para mapear todas as áreas da empresa e priorizar onde aprofundar a análise.
            </p>
          </div>
        </div>
      </div>

      {/* Fluxo de trabalho — passos */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Fluxo de trabalho</h2>
        </div>

        <div className="space-y-4">
          {PASSOS.map((passo, i) => {
            const Icone = passo.icone;
            return (
              <div
                key={i}
                className={`rounded-xl border p-5 ${COR_BG[passo.cor]}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`flex size-10 items-center justify-center rounded-xl ${COR_ICON[passo.cor]}`}>
                      <Icone className="size-5" />
                    </div>
                    {i < PASSOS.length - 1 && (
                      <ChevronRight className="size-4 text-gray-300 rotate-90" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-xs font-bold tabular-nums ${COR_NUMERO[passo.cor]}`}>
                        {passo.numero}
                      </span>
                      <p className="font-semibold text-gray-900">{passo.titulo}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{passo.descricao}</p>
                    {passo.dicas.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
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

      {/* Dicas gerais */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="size-5 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-2">Boas práticas</p>
            <ul className="space-y-1.5 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                Realize a visita in loco antes de preencher — não baseie a triagem apenas em descrições de cargo.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                Entreviste os trabalhadores durante a visita; eles conhecem os riscos do dia a dia.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                Documente com fotos e observações diretas para embasar as classificações de risco.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                Salve a análise regularmente — o sistema salva automaticamente ao navegar entre abas.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                Use os Textos Padrão para padronizar a linguagem técnica entre análises da mesma empresa.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
