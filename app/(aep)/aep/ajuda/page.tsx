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

// ─── Checklists ────────────────────────────────────────────────────────────────

const FISICA_ITENS = [
  {
    label: "Posturas inadequadas / forçadas",
    como: [
      "Observe o trabalhador durante a tarefa real — não peça que ele demonstre. Registre a postura predominante ao longo do ciclo.",
      "Identifique: flexão de tronco > 20° (moderado) ou > 45° (severo); rotação lateral do tronco > 30°; extensão/flexão cervical > 20°; elevação dos braços > 60° do lado do corpo; trabalho com as mãos acima da cabeça.",
      "Método de referência: RULA (membros superiores e pescoço) ou REBA (corpo todo). Escore RULA ≥ 5 ou REBA ≥ 8 indica necessidade de intervenção.",
      "Verifique também: postura estática mantida por > 4 min sem possibilidade de movimento — mesmo que 'neutra', a estaticidade em si é um fator de risco.",
    ],
    marque_sim: "Se o trabalhador mantém postura fora do neutro (ângulos acima dos limites citados) por > 30% do ciclo de trabalho, ou se há postura estática sem alternância por períodos longos.",
  },
  {
    label: "Movimentos repetitivos",
    como: [
      "Cronometre o ciclo de trabalho e conte quantas vezes o mesmo padrão de movimento é repetido por minuto ou por hora.",
      "Critérios ACGIH/OCRA: > 2 repetições/min de um mesmo padrão de cotovelo, punho ou ombro já configura repetitividade significativa; > 30 ciclos/min é considerado alta repetição.",
      "Verifique também a duração acumulada: repetitividade moderada por > 4 h/turno é equivalente em risco à alta repetição por 2 h/turno.",
      "Atenção especial: movimentos de pinça com força (ex.: montagem de peças), rotação de antebraço repetida (ex.: aparafusamento manual) e extensão de punho com carga.",
    ],
    marque_sim: "Se há > 2 repetições/min do mesmo padrão por período ≥ 2 h contínuas, ou > 4 h/turno mesmo com pausas. Inclua trabalhos de digitação intensa (> 10.000 toques/h).",
  },
  {
    label: "Levantamento / transporte de cargas",
    como: [
      "Aplique a Equação de NIOSH (se possível): calcule o Limite de Peso Recomendado (LPR). Índice de Levantamento (IL) > 1,0 = risco; IL > 3,0 = risco alto.",
      "Para triagem rápida: cargas > 12 kg levantadas irregularmente, ou > 5 kg com frequência > 1x/min, ou > 25 kg em qualquer frequência — marcar Sim.",
      "Observe a distância horizontal da carga ao corpo (ideal: < 25 cm da coluna), a altura de pega (ideal: entre joelho e cotovelo) e a assimetria (rotação durante o levantamento).",
      "Para transporte: empurrar/puxar carrinho com carga > 200 kg sem auxílio mecânico, ou transporte manual > 50 m com cargas moderadas, merecem atenção.",
    ],
    marque_sim: "Se há levantamentos acima dos limites NIOSH (IL > 1,0 na equação, ou > 12 kg de forma irregular), transporte manual de carga pesada por distâncias longas, ou levantamento fora da zona de conforto (abaixo do joelho ou acima do ombro).",
  },
  {
    label: "Mobiliário inadequado",
    como: [
      "Medidas de referência para posto sentado: altura da cadeira regulável entre 40–52 cm; assento com profundidade suficiente para apoiar 2/3 da coxa; apoio lombar ajustável entre L2 e L5.",
      "Para postos com monitor: topo da tela ao nível dos olhos (±5 cm); distância dos olhos ao monitor entre 50–70 cm; teclado na altura dos cotovelos com antebraços em posição neutra.",
      "Identifique: cadeira sem regulagem de altura; bancada muito alta obrigando elevação dos ombros; bancada muito baixa obrigando flexão de tronco; ausência de suporte para os pés quando os pés não alcançam o chão.",
      "Para trabalho em pé: piso emborrachado ou antifadiga; possibilidade de alternar para sentado; altura da bancada na linha dos cotovelos fletidos (90°).",
    ],
    marque_sim: "Se o mobiliário é fixo sem regulagem, alturas impróprias para o perfil antropométrico dos trabalhadores (mais de 20% da equipe não se adapta confortavelmente), ou ausência de cadeira ergonômica em posto com > 4 h sentado por turno.",
  },
  {
    label: "Esforço físico elevado",
    como: [
      "Use a Escala de Borg CR-10: peça ao trabalhador que avalie o esforço percebido durante a tarefa. Borg ≥ 5 (forte) é significativo; ≥ 7 (muito forte) é crítico.",
      "Observe sinais físicos: sudorese intensa, rubor facial, respiração ofegante, tremedeira muscular, pausas espontâneas frequentes.",
      "Calcule a carga de trabalho físico se possível: frequência cardíaca de trabalho > 35 bpm acima da FC de repouso de forma sustentada indica sobrecarga cardiovascular.",
      "Considere também a combinação de fatores: levantamento moderado + postura inadequada + repetitividade resulta em sobrecarga maior do que cada fator isolado.",
    ],
    marque_sim: "Se trabalhadores relatam Borg ≥ 5 de forma rotineira, há sinais visíveis de fadiga física antes do final do turno, ou a tarefa exige esforço muscular máximo por mais de 10% do ciclo.",
  },
  {
    label: "Iluminação inadequada",
    como: [
      "Use luxímetro quando disponível. Valores mínimos recomendados pela NBR 5413: escritório geral 500 lux; leitura de documentos manuscritos 750 lux; montagem fina / inspeção visual 1.000–1.500 lux; corredores e circulação 100–200 lux.",
      "Sem luxímetro, avalie qualitativamente: dificuldade de leitura de displays/etiquetas a distância normal de trabalho; sombras projetadas sobre a área de trabalho; reflexos especulares em telas ou superfícies polidas; necessidade de aproximação excessiva para enxergar detalhes.",
      "Verifique também: iluminação muito alta (> 2.000 lux em postos com telas) causando ofuscamento; diferença de iluminação entre posto de trabalho e arredores > 10:1 (fadiga adaptativa).",
      "Pergunte sobre: dores de cabeça ao final do turno, lacrimejamento, visão turva após o trabalho — indicadores de fadiga visual.",
    ],
    marque_sim: "Se a iluminação está abaixo do mínimo para a tarefa, há fontes de ofuscamento direto ou reflexo, ou trabalhadores relatam desconforto visual / dor de cabeça relacionados ao trabalho.",
  },
  {
    label: "Ruído / ambiente sonoro adverso",
    como: [
      "Teste de comunicação: se duas pessoas não conseguem conversar normalmente a 1 metro de distância sem elevar o tom de voz, o nível de ruído provavelmente está > 80 dB(A).",
      "Referências NR-15: exposição a 85 dB(A) por 8h = limite de tolerância. A cada 5 dB de aumento, o tempo de exposição permitido cai pela metade (85 dB/8h; 90 dB/4h; 95 dB/2h; 100 dB/1h).",
      "Verifique: uso obrigatório de protetor auricular (indica exposição > 85 dB); reclamações de zumbido ou diminuição de audição; necessidade de gritar para ser ouvido pelo colega ao lado.",
      "Além do volume, avalie: impactos (prensas, marteletes) > 130 dB(C) de pico; ruído de alta frequência (uivos de motores) que causa fadiga mais rapidamente que ruído de frequência média.",
    ],
    marque_sim: "Se comunicação verbal a 1 m exige voz elevada, há uso rotineiro de protetor auricular, ou trabalhadores relatam zumbido transitório ao final do turno. Qualquer desses indica necessidade de medição por sonômetro.",
  },
  {
    label: "Vibração (corpo inteiro / mãos e braços)",
    como: [
      "Mãos e braços (HAV): verifique uso de ferramentas vibratórias — esmerilhadeiras, furadeiras de impacto, marteletes, serras. Limite de ação ISO 5349-1: 2,5 m/s² por 8h. Limite de exposição: 5,0 m/s².",
      "Corpo inteiro (WBV): operadores de empilhadeiras, tratores, caminhões, plataformas vibratórias. Limite de ação ISO 2631-1: 0,5 m/s² por 8h. Limite de exposição: 1,15 m/s².",
      "Para triagem sem medição: uso de ferramenta vibratória por > 2 h/dia continuamente já é suficiente para marcar Sim; qualquer uso de martelete pneumático por > 30 min/dia também.",
      "Sintomas a investigar com trabalhadores: formigamento ou branqueamento dos dedos no frio (síndrome de Raynaud / dedo branco), dores nas mãos ao amanhecer, dor lombar crônica em operadores de veículos.",
    ],
    marque_sim: "Se há uso diário de ferramentas vibratórias por > 2 h, operação de veículos off-road / empilhadeiras por > 4 h/turno, ou relatos de sintomas de HAV (formigamento, branqueamento dos dedos) ou dor lombar em operadores de veículos.",
  },
  {
    label: "Desconforto térmico",
    como: [
      "Calor: meça ou estime o IBUTG (Índice de Bulbo Úmido Termômetro de Globo). NR-15 Anexo 3: IBUTG > 26–30°C (dependendo da atividade) = situação de risco. Sinais práticos: sudorese intensa, dificuldade de concentração, queixas de tontura.",
      "Frigoríficos/câmaras frias: temperatura < 5°C exige EPIs específicos (luvas, blusas térmicas), intervalos de aquecimento e limitação de tempo de exposição.",
      "Correntes de ar frio (ar-condicionado): verifique se o fluxo de ar incide diretamente sobre o trabalhador. NR-17 7.1.3: velocidade do ar no posto de trabalho ≤ 0,75 m/s.",
      "Trabalho ao ar livre: avalie exposição solar direta, disponibilidade de sombra, acesso a água e horários de pico (10h–15h). NR-21 exige proteção contra intempéries.",
      "Verifique EPIs que dificultam a dissipação de calor corporal: macacões impermeáveis, máscaras integrais — podem elevar a temperatura interna mesmo em ambientes de temperatura moderada.",
    ],
    marque_sim: "Se IBUTG supera os limites da NR-15 para o tipo de atividade, temperatura < 5°C sem proteção adequada, ar-condicionado com fluxo direto sobre o trabalhador, ou relatos frequentes de tontura, cansaço excessivo ou desconforto por frio/calor.",
  },
];

const COGNITIVA_ITENS = [
  {
    label: "Atenção contínua / concentração elevada",
    como: [
      "Identifique tarefas que exigem vigilância sustentada sem possibilidade de redução do nível de atenção: monitoramento de painéis de controle, inspeção visual de linha de produção, operação de máquinas de risco (prensas, tornos), condução de veículos.",
      "Aplique o NASA-TLX (se disponível) ou pergunte ao trabalhador sobre percepção de demanda mental (escala de 0 a 100). Pontuação > 60 em Demanda Mental indica sobrecarga.",
      "Avalie a presença de pausas cognitivas: NR-17 7.4 recomenda pausas de, no mínimo, 10 min a cada 50 min de trabalho em atividades repetitivas; para vigilância contínua o critério é ainda mais restritivo.",
      "Verifique o custo do erro: quanto mais grave a consequência de uma falha de atenção (acidente, produto defeituoso, dado incorreto), maior a carga cognitiva percebida pelo trabalhador, mesmo que a tarefa pareça simples.",
    ],
    marque_sim: "Se a tarefa exige vigilância ininterrupta por > 2 h sem pausa cognitiva, o custo do erro é alto (risco de acidente, produto crítico), ou o trabalhador relata exaustão mental ao final do turno mesmo com carga física baixa.",
  },
  {
    label: "Sobrecarga mental / complexidade da tarefa",
    como: [
      "Conte quantas decisões simultâneas o trabalhador precisa tomar durante a execução da tarefa principal. > 3 decisões paralelas de forma rotineira já indica sobrecarga cognitiva.",
      "Avalie a diversidade de sistemas: uso de mais de 3 softwares distintos com interfaces diferentes durante a mesma jornada aumenta o custo de troca cognitiva (task-switching).",
      "Identifique o índice de erros e retrabalho: alta frequência de erros simples (que o trabalhador mesmo reconhece como 'lapsos') é sinal clássico de sobrecarga mental.",
      "Pergunte sobre: dificuldade de concentração após o almoço, esquecimento frequente de etapas do processo, necessidade de criar 'lembretes paralelos' (post-its, alarmes) para não esquecer ações rotineiras.",
    ],
    marque_sim: "Se há > 3 decisões simultâneas rotineiras, uso de múltiplos sistemas com interfaces complexas, índice de erros / retrabalho acima do esperado, ou o trabalhador relata dificuldade de 'manter o fio' das tarefas.",
  },
  {
    label: "Pressão psicológica / cobrança excessiva",
    como: [
      "Realize entrevistas individuais fora da presença de gestores. Pergunte diretamente: 'Você sente pressão além do razoável para cumprir metas?' e 'Como você se sente ao final de um turno em relação ao trabalho?'",
      "Identifique: metas que são comunicadas com ameaças implícitas ou explícitas de demissão; reuniões de cobrança com exposição pública de resultados individuais; monitoramento eletrônico por câmera ou registro de tempo de pausa em banheiro.",
      "Avalie o índice de absenteísmo por doenças psíquicas (ansiedade, depressão, burnout) — taxas > 5% do quadro em 12 meses indicam fator organizacional relevante.",
      "Verifique presença de síndrome de burnout: exaustão emocional, distanciamento do trabalho e queda de eficácia são os três pilares. Trabalhadores que dizem 'não me importo mais' estão em fase avançada.",
    ],
    marque_sim: "Se há relatos consistentes (> 1 trabalhador de forma independente) de pressão excessiva, cobrança pública, ameaças veladas, ou índice de afastamentos por transtornos mentais acima da média do setor.",
  },
  {
    label: "Excesso de informações simultâneas",
    como: [
      "Observe o posto de trabalho: mais de 2 monitores ativos com informações distintas simultâneas; recebimento de mensagens de WhatsApp/Teams + chamadas + e-mails + demandas presenciais ao mesmo tempo.",
      "Meça a frequência de interrupções: > 5 interrupções/h durante tarefas que exigem concentração é considerado prejudicial à produtividade cognitiva e à qualidade do trabalho (estudos de gestão de TI).",
      "Identifique fluxo de notificações automáticas de sistemas (ERP, WMS, e-commerce): se o trabalhador recebe > 20 alertas/h que exigem alguma ação ou leitura, o fluxo informacional é excessivo.",
      "Pergunte: 'Você consegue finalizar uma tarefa sem ser interrompido?' Se a resposta for raramente, o ambiente é fragmentador da atenção.",
    ],
    marque_sim: "Se o trabalhador opera > 3 canais de comunicação simultâneos com expectativa de resposta imediata, recebe > 20 alertas/h de sistemas, ou relata que raramente consegue concluir uma tarefa sem interrupção.",
  },
  {
    label: "Ritmo mental acelerado",
    como: [
      "Identifique se o ritmo é ditado externamente (ritmo imposto): esteira rolante, sistema automatizado com takt time fixo, atendimento com meta de tempo de ligação (call center). Trabalhador sem controle sobre o próprio ritmo é fator de risco independente.",
      "Calcule o takt time disponível: divide o tempo total disponível pelo número de unidades a serem produzidas/atendidas. Se o takt time disponível é < 80% do tempo necessário para execução segura da tarefa, há risco.",
      "Para call center / atendimento: meta de TMA (Tempo Médio de Atendimento) < 3 min para resolver questões complexas é critério para marcar Sim.",
      "Verifique a possibilidade de acumulação de demanda: se o trabalhador 'perde o ritmo' por 5 min, consegue recuperar? Se não (esteira, máquina cadenciada), o impacto é imediato e estressante.",
    ],
    marque_sim: "Se o ritmo é imposto por máquina ou sistema sem possibilidade de ajuste pelo trabalhador, o takt time disponível é insuficiente para execução confortável, ou há metas de tempo de atendimento incompatíveis com a complexidade da demanda.",
  },
];

const ORGANIZACIONAL_ITENS = [
  {
    label: "Metas agressivas / inatingíveis",
    como: [
      "Peça dados históricos de atingimento de metas: se a equipe atinge a meta < 70% das vezes, as metas provavelmente estão fora da capacidade real.",
      "Calcule o percentual de atingimento médio dos últimos 6 meses. Metas atingidas em > 95% das vezes podem estar subestimadas; < 50% das vezes indicam metas impossíveis.",
      "Entreviste: 'O que acontece quando a meta não é atingida?' Se a resposta incluir ameaças, humilhações, perda de benefícios ou punições, o risco psicossocial é elevado.",
      "Compare as metas com o dimensionamento de equipe: meta foi mantida mesmo com redução do quadro? Aumento de meta sem aumento de recursos é sinal claro de pressão excessiva.",
    ],
    marque_sim: "Se o índice médio de atingimento de metas é < 70% nos últimos 6 meses, houve aumento de meta sem aumento de recursos, ou o não atingimento gera punições formais ou constrangimentos.",
  },
  {
    label: "Ausência ou insuficiência de pausas",
    como: [
      "NR-17 7.4.3: para trabalhos em linhas de produção, digitação ou atendimento que envolvam repetitividade, a norma recomenda pausa mínima de 10 min a cada 50 min de trabalho.",
      "Verifique se as pausas obrigatórias (almoço e intervalos) são respeitadas na prática — trabalhadores frequentemente 'saltam' o intervalo por pressão informal.",
      "Pergunte: 'Você consegue fazer pausas fora do horário de almoço?' Se a resposta for não, ou 'só vou ao banheiro correndo', o fator está presente.",
      "Para trabalhos em ambientes quentes (IBUTG elevado) ou com vibração intensa, as pausas têm papel fisiológico adicional além do descanso muscular — verifique se existem e se são cumpridas.",
    ],
    marque_sim: "Se não há pausas programadas além do almoço em turno de 8h, ou as pausas existem formalmente mas não são respeitadas na prática por pressão de produção.",
  },
  {
    label: "Jornada extensiva / horas extras frequentes",
    como: [
      "CLT Art. 59: limite de 2h extras/dia. Horas extras habituais (ocorrendo em > 3 dias/semana por > 1 mês) configuram sobrecarga e podem indicar subdimensionamento da equipe.",
      "Calcule a jornada semanal real: > 44h semanais de forma habitual é o limite. Jornadas de 10–12h diárias, mesmo com folga compensatória, concentram a exposição e aumentam o risco de fadiga acumulada.",
      "Verifique se as horas extras são voluntárias ou há pressão implícita (último a sair é reconhecido; quem não faz horas extras é preterido em promoções).",
      "Consulte o banco de horas: saldo positivo crescente mês a mês sem previsão de compensação indica que as horas extras são sistemáticas, não pontuais.",
    ],
    marque_sim: "Se a jornada habitual ultrapassa 44h/semana de forma sistemática (> 3 semanas/mês), há horas extras em > 3 dias/semana regularmente, ou banco de horas com saldo crescente sem perspectiva de compensação.",
  },
  {
    label: "Pressão hierárquica / assédio moral",
    como: [
      "Realize entrevistas individuais e confidenciais, fora do ambiente de trabalho se possível. Assédio moral raramente é relatado em grupo ou na presença de supervisores.",
      "Critérios de Leymann para mobbing: conduta negativa repetida, por ≥ 6 meses, com frequência > 1x/semana, por pessoa com poder sobre a vítima (hierarquia ou grupo). Qualquer um desses elementos isolados já justifica atenção.",
      "Identifique práticas específicas: atribuição de tarefas humilhantes ou abaixo da qualificação; isolamento social; críticas públicas; sobrecarga deliberada como punição; ridicularização de erros perante colegas.",
      "Observe o comportamento de liderança durante a visita: tom de voz com a equipe, linguagem corporal, interrupções durante entrevistas (sinal de que a liderança quer controlar o que será dito).",
    ],
    marque_sim: "Se há relatos independentes de dois ou mais trabalhadores sobre condutas negativas repetidas, ou observação direta de tratamento desrespeitoso, humilhação pública ou ameaças durante a visita.",
  },
  {
    label: "Sobrecarga operacional",
    como: [
      "Calcule a relação carga/capacidade: liste as entregas esperadas do trabalhador por turno e o tempo necessário para cada uma com qualidade. Se a soma supera 80–85% da jornada disponível, não há margem para imprevistos — qualquer variação gera sobrecarga.",
      "Identifique acúmulo de funções: compare a descrição de cargo com o que o trabalhador efetivamente faz. Acúmulo sem adequação salarial ou reconhecimento formal é um indicador relevante.",
      "Verifique o backlog: existe fila de pendências que nunca se esgota? Trabalhadores que terminam o turno com mais tarefas abertas do que quando começaram estão em sobrecarga estrutural.",
      "Consulte o índice de absenteísmo: absenteísmo > 4% do quadro mensalmente está associado a sobrecarga operacional em estudos de saúde do trabalhador.",
    ],
    marque_sim: "Se a carga de tarefas excede 85% da capacidade disponível de forma habitual, há acúmulo de funções sem compensação formal, ou backlog permanente que não é reduzido mesmo com horas extras.",
  },
  {
    label: "Déficit de equipe / trabalho solitário",
    como: [
      "Verifique o headcount atual versus o dimensionamento planejado. Operar com > 15% abaixo do quadro previsto por > 30 dias consecutivos é déficit operacional relevante.",
      "Identifique trabalhos de risco realizados por apenas uma pessoa: atividades em altura, espaço confinado, manuseio de produtos químicos perigosos — a NR-33, NR-35 e outras normas exigem equipe mínima para essas atividades.",
      "Avalie o índice de absenteísmo e sua gestão: quando alguém falta, quem cobre? Se a resposta for 'ninguém — a pessoa acumula ao retornar', o dimensionamento é insuficiente.",
      "Pergunte sobre atividades noturnas ou em fim de semana: trabalhadores noturnos ou em turnos de menor demanda frequentemente operam mais isolados — verifique protocolos de segurança e comunicação.",
    ],
    marque_sim: "Se há operação habitual com > 15% abaixo do quadro previsto, atividades de risco realizadas por uma só pessoa sem protocolo de segurança, ou ausência de cobertura para faltas e férias.",
  },
  {
    label: "Conflito organizacional / falta de suporte",
    como: [
      "Verifique a clareza de papéis: peça ao trabalhador que descreva suas responsabilidades e quem ele deve acionar quando encontra um problema. Respostas vagas ou contraditórias indicam estrutura organizacional confusa.",
      "Meça o nível de suporte percebido: 'Quando você tem um problema técnico ou pessoal no trabalho, tem alguém a quem recorrer?' Se a resposta for não, ou 'resolvo sozinho', o suporte é insuficiente.",
      "Identifique conflitos recorrentes entre áreas: TI vs. Operações, Comercial vs. Produção, equipe de turno vs. gestão. Conflitos crônicos que não são mediados pela liderança geram estresse organizacional difuso.",
      "Avalie o turnover: rotatividade > 20% ao ano em funções operacionais é fortemente associada a problemas organizacionais (clima, gestão, suporte). Pergunte 'por que as pessoas saem daqui?' — a resposta espontânea é diagnóstica.",
    ],
    marque_sim: "Se há papéis mal definidos com relatos de 'não sei a quem devo responder', conflitos crônicos entre áreas sem mediação, ausência de canais de suporte técnico/emocional, ou turnover > 20%/ano.",
  },
];

// ─── Passos do fluxo ──────────────────────────────────────────────────────────

const PASSOS = [
  { numero: "01", titulo: "Criar Nova Análise",          icone: Plus,          cor: "emerald",
    descricao: "Clique em \"Nova Análise\" no menu lateral. Selecione a empresa, informe a data de elaboração e o responsável técnico. A análise é salva automaticamente como Rascunho.",
    dicas: ["Use uma análise por empresa ou por grupo homogêneo de setores.", "O status muda para Concluído quando todos os campos obrigatórios são preenchidos."] },
  { numero: "02", titulo: "Cadastrar Setores",            icone: Layers,        cor: "blue",
    descricao: "Na aba Setores / Triagem, adicione cada setor ou posto de trabalho. Use nomes claros como \"Almoxarifado\", \"Linha de Montagem 01\", \"Escritório Administrativo\".",
    dicas: ["Um setor pode ser um departamento inteiro ou uma função específica.", "Setores com tarefas muito distintas devem ser separados mesmo que fisicamente próximos."] },
  { numero: "03", titulo: "Aplicar a Triagem Ergonômica", icone: ClipboardCheck, cor: "orange",
    descricao: "Para cada setor, responda os checklists de Ergonomia Física, Cognitiva e Organizacional com Sim / Não / N/A. Cada Sim gera um alerta e deve embasar um risco na Matriz.",
    dicas: ["Responda durante a observação in loco — não depois, de memória.", "Use N/A apenas quando o fator genuinamente não existe no contexto do setor."] },
  { numero: "04", titulo: "Registrar Riscos na Matriz",   icone: TriangleAlert,  cor: "yellow",
    descricao: "Clique em \"+ Risco\" para registrar cada risco formalmente. Informe tipo, descrição, probabilidade e severidade. O sistema calcula o Nível: Trivial, De Atenção, Moderado, Alto ou Crítico.",
    dicas: ["Agrupe itens relacionados em um único risco quando fizer sentido técnico.", "Riscos Altos e Críticos devem indicar necessidade de AET completa."] },
  { numero: "05", titulo: "Redigir Parecer e Recomendações", icone: Pencil,      cor: "purple",
    descricao: "Preencha o Parecer Técnico Preliminar e as Recomendações ao final de cada setor. O parecer resume o diagnóstico; as recomendações orientam as ações.",
    dicas: ["Referencie os itens que geraram Sim nos checklists.", "Priorize recomendações por urgência — imediatas primeiro, depois preventivas e estruturais."] },
  { numero: "06", titulo: "Preencher Dados e Conclusão",  icone: Info,           cor: "blue",
    descricao: "Na aba Dados / Conclusão, informe os dados gerais da empresa e redija a conclusão técnica consolidando os achados de todos os setores.",
    dicas: ["A conclusão deve citar os setores com maior risco e as prioridades globais de intervenção.", "Use os Textos Padrão para agilizar a redação."] },
  { numero: "07", titulo: "Gerar e Imprimir o Laudo",     icone: Printer,        cor: "gray",
    descricao: "Na aba Laudo / Imprimir, visualize o relatório final e exporte o PDF. Revise antes de entregar ao cliente.",
    dicas: ["O PDF tem formatação otimizada para impressão A4.", "O laudo inclui todos os setores, riscos classificados e recomendações."] },
];

// ─── Helpers de cor ───────────────────────────────────────────────────────────

const COR_BG: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200", blue: "bg-blue-50 border-blue-200",
  orange: "bg-orange-50 border-orange-200", yellow: "bg-yellow-50 border-yellow-200",
  purple: "bg-purple-50 border-purple-200", gray: "bg-gray-50 border-gray-200",
};
const COR_ICON: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-100", blue: "text-blue-600 bg-blue-100",
  orange: "text-orange-600 bg-orange-100", yellow: "text-yellow-700 bg-yellow-100",
  purple: "text-purple-600 bg-purple-100", gray: "text-gray-600 bg-gray-100",
};
const COR_NUMERO: Record<string, string> = {
  emerald: "text-emerald-700", blue: "text-blue-700", orange: "text-orange-700",
  yellow: "text-yellow-700", purple: "text-purple-700", gray: "text-gray-600",
};

// ─── Subcomponente item checklist ─────────────────────────────────────────────

function ItemChecklist({ label, como, marque_sim }: { label: string; como: string[]; marque_sim: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Como avaliar</p>
        <ul className="space-y-1.5">
          {como.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="mt-1.5 size-1.5 rounded-full bg-blue-400 shrink-0" />
              {c}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2">
        <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Marque Sim se: </span>
        <span className="text-xs text-red-800">{marque_sim}</span>
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
            Guia técnico para a Análise Ergonômica Preliminar — triagem, checklists, parecer e recomendações.
          </p>
        </div>
      </div>

      {/* O que é */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="size-5 shrink-0 text-emerald-700 mt-0.5" />
          <div className="space-y-1.5">
            <p className="font-semibold text-emerald-900">O que é a AEP?</p>
            <p className="text-sm text-emerald-800">
              A <strong>Análise Ergonômica Preliminar</strong> é uma triagem qualitativa que mapeia os riscos
              ergonômicos por setor, integrando o <strong>GRO/PGR</strong> conforme a NR-01. É o passo anterior à
              AET (Análise Ergonômica do Trabalho) aprofundada, acionada quando riscos Altos ou Críticos são identificados.
            </p>
          </div>
        </div>
      </div>

      {/* Fluxo */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Fluxo de trabalho</h2>
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
                    {i < PASSOS.length - 1 && <ChevronRight className="size-3.5 text-gray-300 rotate-90" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-xs font-bold tabular-nums ${COR_NUMERO[p.cor]}`}>{p.numero}</span>
                      <p className="font-semibold text-gray-900 text-sm">{p.titulo}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{p.descricao}</p>
                    {p.dicas.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {p.dicas.map((d, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-gray-400" />{d}
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
          <h2 className="font-semibold text-gray-800">Botões Sim / Não / N/A — critério de uso</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { btn: "Sim", btnCor: "bg-red-500", titulo: "Fator presente", cor: "border-red-200 bg-red-50", tituloCor: "text-red-700",
              desc: "O fator de risco foi identificado durante a visita ou entrevista. Gera um alerta e deve embasar um risco na Matriz de Riscos." },
            { btn: "Não", btnCor: "bg-green-500", titulo: "Fator ausente", cor: "border-green-200 bg-green-50", tituloCor: "text-green-700",
              desc: "O fator foi avaliado in loco e não foi identificado. Registra que a condição foi verificada e está controlada ou ausente." },
            { btn: "N/A", btnCor: "bg-gray-400", titulo: "Não se aplica", cor: "border-gray-200 bg-gray-50", tituloCor: "text-gray-700",
              desc: "O item não é pertinente ao setor. Ex.: vibração de ferramentas em escritório administrativo. Não substitui Não — use apenas quando o fator genuinamente inexiste no contexto." },
          ].map((c, i) => (
            <div key={i} className={`rounded-xl border p-4 ${c.cor}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold text-white ${c.btnCor}`}>{c.btn}</span>
                <span className={`text-sm font-semibold ${c.tituloCor}`}>{c.titulo}</span>
              </div>
              <p className="text-xs text-gray-700">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ergonomia Física */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
            <User className="size-4 text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Ergonomia Física</h2>
            <p className="text-xs text-gray-500">Condições biomecânicas, posturais e ambientais. Referências: NR-17, NR-15, NIOSH, ISO 5349-1, ISO 2631-1, NBR 5413.</p>
          </div>
        </div>
        <div className="space-y-3 bg-blue-50 rounded-xl border border-blue-200 p-4">
          {FISICA_ITENS.map((item, i) => <ItemChecklist key={i} {...item} />)}
        </div>
      </div>

      {/* Ergonomia Cognitiva */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100">
            <Brain className="size-4 text-purple-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Ergonomia Cognitiva</h2>
            <p className="text-xs text-gray-500">Carga mental, demanda de atenção e processamento de informações. Referências: NR-17 7.4, NASA-TLX, literatura de ergonomia cognitiva.</p>
          </div>
        </div>
        <div className="space-y-3 bg-purple-50 rounded-xl border border-purple-200 p-4">
          {COGNITIVA_ITENS.map((item, i) => <ItemChecklist key={i} {...item} />)}
        </div>
      </div>

      {/* Ergonomia Organizacional */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
            <Building2 className="size-4 text-orange-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Ergonomia Organizacional</h2>
            <p className="text-xs text-gray-500">Jornada, metas, relações hierárquicas e gestão de pessoas. Referências: NR-17, CLT, critérios de Leymann (mobbing).</p>
          </div>
        </div>
        <div className="space-y-3 bg-orange-50 rounded-xl border border-orange-200 p-4">
          {ORGANIZACIONAL_ITENS.map((item, i) => <ItemChecklist key={i} {...item} />)}
        </div>
      </div>

      {/* Parecer Técnico */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
            <FileText className="size-4 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Parecer Técnico Preliminar</h2>
            <p className="text-xs text-gray-500">Campo por setor — diagnóstico técnico das condições ergonômicas da área avaliada.</p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
          <p className="text-sm text-gray-700">
            O Parecer deve ser <strong>objetivo e técnico</strong>, fundamentado nas observações in loco e entrevistas,
            referenciando os fatores identificados nos checklists. Evite linguagem vaga como "as condições são inadequadas" — aponte o que foi observado.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Estrutura recomendada</p>
            {[
              ["1. Fatores identificados",    "Cite os principais itens marcados como Sim, agrupando por categoria (física, cognitiva, organizacional)."],
              ["2. Nível de risco predominante", "Indique Trivial, De Atenção, Moderado, Alto ou Crítico com base na Matriz de Riscos preenchida."],
              ["3. Contexto",                "Mencione nº de trabalhadores expostos, turno, perfil da atividade e condicionantes relevantes."],
              ["4. Necessidade de AET",       "Se houver riscos Altos ou Críticos, indique expressamente que o setor necessita de AET completa."],
            ].map(([t, d], i) => (
              <div key={i} className="rounded-lg border border-emerald-200 bg-white p-3.5 flex items-start gap-3">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-emerald-300 bg-white p-4">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Exemplo</p>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "O setor de Produção — Linha de Montagem 01 apresenta risco ergonômico de nível Alto. Foram identificados
              movimentos repetitivos de membros superiores com frequência estimada de 8–10 ciclos/min durante todo o turno,
              posturas inadequadas de tronco com flexão > 30° por aproximadamente 40% do ciclo de trabalho, e ausência de
              pausas programadas além do horário de almoço. O mobiliário é fixo sem regulagem de altura, e trabalhadores
              com estatura ≥ 1,75 m relatam desconforto cervical ao final do turno. O setor conta com 12 trabalhadores expostos
              em dois turnos de 8h. Recomenda-se a elaboração de AET específica para este posto de trabalho."
            </p>
          </div>
        </div>
      </div>

      {/* Recomendações */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
            <Zap className="size-4 text-amber-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Recomendações</h2>
            <p className="text-xs text-gray-500">Campo por setor — ações para eliminar ou controlar os riscos identificados, priorizadas por urgência.</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
          <p className="text-sm text-gray-700">
            As recomendações devem ser <strong>específicas, acionáveis e priorizadas</strong>. Evite "melhorar as condições de trabalho".
            Prefira ações concretas com referência à norma aplicável, prazo e responsável sugerido.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { titulo: "Imediatas", prazo: "até 30 dias", cor: "bg-red-50 border-red-200", tituloCor: "text-red-700",
                icon: AlertTriangle, iconCor: "text-red-500",
                desc: "Para riscos Altos e Críticos com potencial de dano imediato. Não podem aguardar planejamento de médio prazo.",
                ex: "Suspender levantamento manual acima de 20 kg no setor de Expedição até treinamento e avaliação NIOSH serem realizados." },
              { titulo: "Preventivas", prazo: "30–90 dias", cor: "bg-yellow-50 border-yellow-200", tituloCor: "text-yellow-700",
                icon: Info, iconCor: "text-yellow-500",
                desc: "Reduzem a probabilidade de agravamento. Exigem planejamento mas têm impacto antes do próximo ciclo de avaliação.",
                ex: "Implantar pausas de 10 min a cada 50 min para operadores de caixa conforme NR-17 7.4.3, a partir do próximo mês." },
              { titulo: "Estruturais", prazo: "> 90 dias", cor: "bg-blue-50 border-blue-200", tituloCor: "text-blue-700",
                icon: Building2, iconCor: "text-blue-500",
                desc: "Modificam processo, ambiente ou organização do trabalho. Exigem investimento ou reestruturação.",
                ex: "Adquirir cadeiras ergonômicas com regulagem de altura (40–52 cm), apoio lombar ajustável e apoio de braços para as 18 estações do setor Administrativo." },
            ].map((card, i) => {
              const Ic = card.icon;
              return (
                <div key={i} className={`rounded-lg border p-4 space-y-2 ${card.cor}`}>
                  <div className="flex items-center gap-2">
                    <Ic className={`size-4 shrink-0 ${card.iconCor}`} />
                    <p className={`text-sm font-semibold ${card.tituloCor}`}>{card.titulo}</p>
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Prazo: {card.prazo}</p>
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
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Exemplo de recomendações para um setor</p>
            <ul className="space-y-1.5 text-sm text-gray-700">
              {[
                "[Imediata] Fornecer e exigir uso de cinto lombar para movimentação de cargas > 15 kg enquanto a avaliação NIOSH não for concluída.",
                "[Preventiva] Implementar rodízio de funções a cada 2h entre as estações da Linha de Montagem 01 para reduzir a exposição cumulativa a movimentos repetitivos.",
                "[Preventiva] Incluir pausa obrigatória de 10 min a cada 50 min de trabalho para os operadores de caixa (NR-17 7.4.3).",
                "[Estrutural] Substituir bancada fixa da linha de montagem por bancada com regulagem de altura entre 85–110 cm, permitindo adaptação para diferentes biotipologias.",
                "[Estrutural] Elaborar AET completa para o posto de Operador de Empilhadeira — nível de risco identificado como Alto (vibração de corpo inteiro e carga postural).",
              ].map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />{r}
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
                ["Tipo de avaliação", "Triagem qualitativa por checklist", "Análise aprofundada com medições"],
                ["Abrangência", "Toda a empresa / todos os setores", "Posto específico ou função específica"],
                ["Tempo médio", "Horas a 1 dia por empresa", "Dias a semanas por posto"],
                ["Medições instrumentais", "Não obrigatórias (opcional)", "Obrigatórias (RULA, NIOSH, sonômetro etc.)"],
                ["Embasamento normativo", "NR-01 GRO/PGR — item 1.5.7", "NR-17 com portaria MTE 1.121/2023"],
                ["Resultado", "Mapa de riscos + priorização de setores", "Laudo técnico detalhado com nexo causal"],
                ["Quando realizar", "No início do GRO/PGR ou na visita inicial", "Quando AEP identificar risco Alto/Crítico"],
              ].map(([c, a, b], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3 font-medium text-gray-700">{c}</td>
                  <td className="px-4 py-3 text-gray-600">{a}</td>
                  <td className="px-4 py-3 text-gray-600">{b}</td>
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
                "Observe a tarefa real sendo executada — não peça para o trabalhador 'demonstrar' ou 'fazer devagar'.",
                "Realize entrevistas individualmente e fora do alcance de gestores para obter relatos fidedignos sobre fatores organizacionais.",
                "Documente com fotos (com autorização) os postos de trabalho — ângulos posturais, layout, ferramentas.",
                "Avalie em diferentes momentos do turno: o risco postural pode ser maior no final do turno por fadiga muscular.",
                "Preencha os checklists durante a observação, não depois — detalhes se perdem com o tempo.",
                "Quando em dúvida entre Não e N/A, prefira Não — significa que avaliou e descartou, o que é tecnicamente mais correto.",
                "Para setores idênticos (ex.: 3 linhas de montagem com mesma tarefa), avalie uma e replique o diagnóstico com nota explicativa.",
              ].map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 shrink-0" />{d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
