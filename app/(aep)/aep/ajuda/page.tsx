"use client";

import {
  AlertTriangle,
  BookOpen,
  Brain,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
import { useState } from "react";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface ItemData {
  label: string;
  conceito: string;
  como: string[];
  atencao?: string;
  marque_sim: string;
}

// ─── Dados — Ergonomia Física ─────────────────────────────────────────────────

const FISICA_INTRO = `A Ergonomia Física estuda a relação entre o corpo humano e as demandas mecânicas do trabalho.
Quando o trabalhador é obrigado a manter posições que afastam as articulações da posição neutra, realizar movimentos
de alta frequência ou exercer força acima da capacidade sustentável, o sistema musculoesquelético entra em sobrecarga.
O resultado são as LER/DORT — Lesões por Esforços Repetitivos e Distúrbios Osteomusculares Relacionados ao Trabalho —
que representam a principal causa de afastamento por doença ocupacional no Brasil. A grande armadilha é que o dano
se acumula silenciosamente por meses ou anos antes de o trabalhador sentir dor, o que torna a triagem preventiva
fundamental. A sua função aqui é identificar os fatores de risco antes que o dano aconteça.`;

const FISICA_ITENS: ItemData[] = [
  {
    label: "Posturas inadequadas / forçadas",
    conceito: `Postura inadequada é qualquer posição que afasta uma ou mais articulações do chamado "envelope neutro" — a faixa em que os músculos e tendões trabalham com menor tensão interna. Fora desse envelope, os músculos precisam de mais força para sustentar a mesma carga, os tendões ficam comprimidos em suas bainhas e os nervos podem ser pressionados. Quanto maior o ângulo de desvio e maior o tempo de manutenção, maior o risco. A combinação de ângulo acentuado + manutenção estática + força é a mais perigosa de todas — é o que acontece, por exemplo, com um montador que segura uma peça pesada com os braços estendidos acima da cabeça.`,
    como: [
      "Observe o trabalhador executando a tarefa real, no ritmo real. Nunca peça que 'demonstre devagar' — o corpo adota posturas de compensação quando está consciente de ser observado.",
      "Avalie cada segmento separadamente: pescoço, tronco, ombros, cotovelos, punhos. Um trabalhador pode ter postura de tronco adequada e postura cervical crítica ao mesmo tempo.",
      "Ângulos de referência — VERMELHO acima disso: pescoço flexão > 20°; tronco flexão > 45°; tronco rotação > 30°; ombro elevação > 60°; punho desvio > 15° em qualquer plano.",
      "Método RULA (membros superiores e pescoço): escore 1–2 = aceitável; 3–4 = investigar; 5–6 = mudança em breve; 7 = mudança imediata. Para o corpo todo, use REBA com a mesma escala.",
      "Postura estática também é risco: ficar parado na mesma posição por > 4 minutos sem se mover — mesmo em posição neutra — reduz o fluxo sanguíneo muscular e causa fadiga precoce. Pergunte: 'Você consegue mudar de posição durante o trabalho ou fica parado a maior parte do tempo?'",
    ],
    atencao: "Erro comum: avaliar só o tronco e ignorar pescoço e punhos. Digitadores com tronco reto e punho em extensão de 30° estão em risco alto para síndrome do túnel do carpo — e o técnico que olhar só a cadeira vai embora sem identificar o problema.",
    marque_sim: "Se qualquer articulação supera os ângulos de referência por > 30% do ciclo de trabalho, ou se há postura estática sem alternância por > 4 minutos de forma habitual.",
  },
  {
    label: "Movimentos repetitivos",
    conceito: `O problema da repetitividade não é o movimento em si — é o acúmulo de microtraumas nos tendões, bainhas tendíneas e nervos quando o mesmo padrão é repetido centenas ou milhares de vezes por turno. O tendão suporta bem cargas ocasionais, mas não se recupera completamente entre ciclos curtos. Com o tempo, a inflamação crônica instala a tendinite ou a tenossinovite. A frequência crítica identificada pela literatura é de 2 repetições por minuto do mesmo padrão de movimento para um mesmo grupo muscular — abaixo disso, o tecido tem tempo de se recuperar; acima, a recuperação fica incompleta. Uma digitadora que pressiona teclas 8.000 vezes por hora está 66 vezes acima desse limite para os flexores dos dedos.`,
    como: [
      "Cronometre o ciclo de trabalho: o tempo do início de uma unidade de trabalho até o início da próxima idêntica. Ciclos < 30 segundos são automaticamente classificados como alta repetição.",
      "Conte as repetições do padrão dominante por minuto. Para montagem manual, costura, embalagem, caixa de supermercado: frequências > 5–10 ciclos/min em punho/ombro são comuns e problemáticas.",
      "Calcule a dose diária: frequência × duração. Uma tarefa com repetição moderada (3 ciclos/min) feita por 7h contínuas é mais lesiva do que alta repetição (10 ciclos/min) por 1h.",
      "Verifique a combinação com força: digitar sem força é diferente de aparafusar manualmente sem ferramenta. Força + repetição multiplica o risco — esta combinação é o perfil clássico de LER/DORT.",
      "Identifique a dominância manual: trabalhadores destros usando apenas a mão direita durante todo o turno acumulam carga unilateral. Verifique se o posto permite troca de mãos.",
    ],
    atencao: "Erro comum: considerar apenas tarefas manuais. Trabalhadores de telemarketing repetem padrões vocais e cognitivos de forma intensa, e operadores de pedal repetem movimentos de tornozelo/joelho que raramente são avaliados.",
    marque_sim: "Se o ciclo de trabalho é < 30 segundos, ou se há > 2 repetições/min do mesmo padrão por ≥ 2 horas contínuas, ou > 4 horas/turno mesmo com pausas intermediárias.",
  },
  {
    label: "Levantamento / transporte de cargas",
    conceito: `A coluna lombar é a estrutura mais lesionada no trabalho manual pesado. Os discos intervertebrais funcionam como amortecedores hidráulicos — suportam bem cargas axiais (peso direto sobre a coluna ereta), mas são altamente vulneráveis à combinação de compressão + torção que ocorre quando levantamos uma carga curvados e rodando o tronco. A pressão intradiscal nessa posição pode superar 10 vezes o peso da carga. A hérnia de disco lombar em trabalhadores jovens é quase sempre de origem ocupacional. O método NIOSH quantifica o Limite de Peso Recomendado (LPR) para cada situação específica — o mesmo trabalhador pode levantar 23 kg com segurança em uma situação e apenas 8 kg em outra, dependendo de altura, distância, frequência e assimetria.`,
    como: [
      "Observe a postura durante o levantamento: curvatura lombar durante a fase de pega, rotação do tronco enquanto carrega, distância horizontal da carga ao corpo. A carga a 60 cm à frente do corpo exerce o triplo do torque na coluna em relação à carga encostada ao abdômen.",
      "Equação de NIOSH simplificada para triagem: peso recomendado base = 23 kg. Reduza conforme: pega baixa (abaixo do joelho) → × 0,6; pega alta (acima dos ombros) → × 0,6; distância > 40 cm do corpo → × 0,5; rotação > 30° → × 0,7. Multiplique os fatores — em más condições, o limite real pode ser < 7 kg.",
      "Para transporte horizontal: avalie distância, frequência e terreno. Carregar 15 kg por 100 metros em piso liso é muito diferente de carregar pelo mesmo peso por escadas ou piso irregular.",
      "Empurrar e puxar: a força inicial de partida é geralmente 2–3× maior que a força de manutenção. Para carrinhos manuais, a força de partida não deve exceder 20 kgf para homens e 15 kgf para mulheres. Verifique o estado das rodas — rodas travadas ou danificadas multiplicam a força necessária.",
      "Entreviste trabalhadores sobre dor lombar: dor que piora durante a jornada e melhora no fim de semana é sinal clássico de origem mecânico-ocupacional.",
    ],
    atencao: "Erro comum: avaliar o peso isoladamente. Um técnico que vê '10 kg' e considera aceitável pode estar ignorando que a pega é feita abaixo do joelho, com rotação de 45° e 15 vezes por hora — situação de risco alto mesmo com carga aparentemente razoável.",
    marque_sim: "Se o Índice de Levantamento NIOSH estimado é > 1,0 para a situação observada, ou se há cargas > 12 kg com frequência ou > 25 kg em qualquer frequência, ou levantamento habitual fora da zona entre joelho e cotovelo.",
  },
  {
    label: "Mobiliário inadequado",
    conceito: `O mobiliário é o principal mediador da postura no trabalho sedentário. Uma cadeira sem regulagem de altura obriga o trabalhador baixo a sentar com os pés suspensos (comprimindo a face posterior das coxas e reduzindo a circulação) e o trabalhador alto a sentar com os joelhos elevados acima do quadril (invertendo a lordose lombar). Uma mesa muito alta obriga elevação dos ombros; muito baixa, flexão excessiva de tronco. O ponto-chave é que o trabalhador se adapta ao mobiliário inadequado — adota uma postura de sobrevivência, não uma postura saudável. Essa adaptação é o que o técnico precisa identificar.`,
    como: [
      "Avalie a cadeira com o trabalhador sentado na sua posição real de trabalho, não na posição 'correta' que ele adota quando sabe que está sendo observado. Verifique: pés apoiados no chão (ou em apoio de pés)? Ângulo quadril-tronco ≥ 90°? Apoio lombar posicionado na região L2–L5? Cotovelos próximos ao ângulo de 90° com o plano de trabalho?",
      "Para monitor: topo da tela ao nível dos olhos ± 5 cm. Monitor muito baixo força flexão cervical; muito alto força extensão. Distância ideal: 50–70 cm. Monitores laterais forçam rotação cervical mantida — verifique a posição relativa à visão principal do trabalhador.",
      "Para trabalho em pé: bancada na altura do cotovelo fletido a 90° para tarefas de precisão; 10–15 cm abaixo do cotovelo para tarefas que exigem força; possibilidade de alternar sentado/em pé é fortemente recomendada pela NR-17.",
      "Medidas de referência para cadeira: altura do assento 40–52 cm (regulável); profundidade do assento que permita apoio de 2/3 da coxa sem pressionar o oco poplíteo; apoio lombar regulável em altura; apoio de braços na altura dos cotovelos.",
      "Verifique também o piso: trabalho em pé por > 4 horas em piso rígido sem tapete antifadiga causa sobrecarga vascular nos membros inferiores e dor nos pés/tornozelos — condição frequentemente subnotificada.",
    ],
    atencao: "Erro comum: ver uma cadeira ergonômica de marca renomada e assumir que está adequada. Cadeira de qualidade com regulagem errada (ou sem regulagem feita pelo trabalhador por falta de treinamento) não protege. Sempre verifique a regulagem real, não o modelo do equipamento.",
    marque_sim: "Se o mobiliário é fixo sem regulagem, se a regulagem existente não é utilizada por falta de conhecimento, ou se > 20% dos trabalhadores do setor não conseguem adotar postura próxima ao neutro com o mobiliário disponível.",
  },
  {
    label: "Esforço físico elevado",
    conceito: `O esforço físico elevado vai além do levantamento de cargas — inclui qualquer atividade que exija mobilização significativa da musculatura esquelética ou do sistema cardiovascular de forma sustentada. O critério fisiológico é simples: quando o trabalhador consome mais energia do que consegue repor durante a jornada, instala-se a fadiga acumulada. A longo prazo, a fadiga crônica aumenta o risco de erro, acidente e lesão musculoesquelética, além de contribuir para doenças cardiovasculares em trabalhadores expostos por anos. O problema é que os trabalhadores frequentemente normalizam o esforço excessivo — "é assim mesmo nesse trabalho" é uma resposta que o técnico precisa saber interpretar como um sinal de alerta, não como tranquilidade.`,
    como: [
      "Escala de Borg CR-10: mostre a escala ao trabalhador e pergunte 'durante a maior parte do turno, quanto esforço físico você sente?' Referência: 0 = nenhum esforço; 3 = moderado (conversação normal possível); 5 = forte (fala entrecortada); 7 = muito forte (difícil falar); 10 = esforço máximo. Borg ≥ 5 de forma habitual é significativo.",
      "Sinais observáveis: sudorese intensa mesmo em ambiente termicamente adequado, rubor facial persistente, respiração ofegante durante a tarefa, tremor muscular ao final de ciclos, pausas espontâneas frequentes não previstas.",
      "Frequência cardíaca como indicador: em adultos saudáveis, FC de trabalho sustentada > (FC máxima × 0,33) indica sobrecarga cardiovascular. FC máxima estimada = 220 − idade. Um trabalhador de 40 anos com FC de trabalho > 59 bpm acima do repouso pode estar em sobrecarga.",
      "Avalie a combinação: esforço moderado isolado raramente é problema. A combinação de esforço físico + postura inadequada + calor + turno de 12h é crítica mesmo que cada fator individualmente seja tolerável.",
      "Pergunte sobre recuperação: 'Ao acordar na manhã seguinte ao trabalho, você se sente descansado ou ainda cansado?' Fadiga que não se dissipa com o sono é fadiga crônica — indicador de sobrecarga sistemática.",
    ],
    atencao: "Erro comum: normalizar esforço elevado em setores historicamente pesados (construção, frigoríficos, fundições). 'Sempre foi assim' não é critério técnico — é normalização do risco.",
    marque_sim: "Se Borg ≥ 5 de forma rotineira, há sinais visíveis de fadiga física antes do final do turno, ou o trabalhador relata não se recuperar completamente com o descanso noturno.",
  },
  {
    label: "Iluminação inadequada",
    conceito: `A iluminação inadequada causa dois problemas distintos e opostos: insuficiência, quando o trabalhador força a visão para enxergar detalhes, causando fadiga dos músculos ciliares (que controlam o foco), dor de cabeça e erros; e excesso ou ofuscamento, quando a luz incide diretamente nos olhos ou em superfícies reflexivas, causando contração pupilar intensa e fadiga visual. Os dois podem coexistir: um monitor exibindo conteúdo escuro em sala muito iluminada cria ofuscamento periférico enquanto exige esforço para ler a tela. A NR-17 não especifica valores de lux diretamente — a referência técnica brasileira é a NBR ISO/CIE 8995-1, que substitui a antiga NBR 5413.`,
    como: [
      "Com luxímetro (ideal): meça no plano de trabalho, na direção da tarefa. Valores mínimos por tipo de tarefa: circulação geral 100–200 lux; escritório geral (leitura, digitação) 500 lux; leitura de manuscritos/documentos 750 lux; inspeção visual fina / montagem eletrônica 1.000–1.500 lux; trabalhos de altíssima precisão (cirurgia, gravação) > 2.000 lux.",
      "Sem luxímetro: teste de leitura — coloque um texto impresso em fonte 10 no plano de trabalho. Se o trabalhador precisar se aproximar ou franzir os olhos para ler confortavelmente, a iluminação está abaixo do necessário.",
      "Ofuscamento direto: verifique se luminárias estão no campo visual do trabalhador (entre 45° e 90° da linha de visão horizontal). Luminárias sem difusor acima da linha de visão em ângulo < 45° causam ofuscamento.",
      "Ofuscamento por reflexo: em monitores, superfícies de trabalho polidas, instrumentos com vidro — posicione-se na cadeira do trabalhador e observe se há reflexo de janelas, luminárias ou outras fontes. O uso de telas foscase o posicionamento a 90° das janelas são as soluções mais simples.",
      "Contraste e adaptação: diferença de iluminação entre o posto e a área ao redor > 10:1 obriga os olhos a adaptarem constantemente (escotopio ↔ fotópico), causando fadiga mesmo que cada zona individualmente esteja adequada.",
    ],
    atencao: "Erro comum: avaliar a iluminação geral da sala sem medir no plano de trabalho. Uma sala com 300 lux médios pode ter 150 lux no posto de trabalho específico se a luminária estiver posicionada atrás do trabalhador.",
    marque_sim: "Se a iluminação no plano de trabalho está abaixo do mínimo para a tarefa (estimado ou medido), há fontes de ofuscamento direto ou reflexo não controladas, ou trabalhadores relatam dor de cabeça, lacrimejamento ou visão turva ao final do turno.",
  },
  {
    label: "Ruído / ambiente sonoro adverso",
    conceito: `O ruído age no organismo em dois níveis. No nível fisiológico direto, sons acima de 85 dB(A) danificam progressiva e irreversivelmente as células ciliadas da cóclea — as células responsáveis por converter vibração sonora em sinal nervoso. Não existe reparação: a célula destruída pelo ruído não se regenera. A PAIR (Perda Auditiva Induzida por Ruído) é a doença ocupacional mais prevalente no mundo e a segunda causa de surdez depois da genética. No nível fisiológico indireto, mesmo ruídos abaixo do limite de dano auditivo (60–75 dB) elevam cortisol, aumentam frequência cardíaca e prejudicam a concentração e a qualidade do sono — especialmente ruídos imprevisíveis e incontroláveis pelo trabalhador.`,
    como: [
      "Teste de conversação a 1 metro: fique a 1 metro do trabalhador e tente conversar em volume normal. Se precisar elevar o tom, o ruído provavelmente supera 80 dB(A). Se precisar gritar, provavelmente supera 85 dB(A). Se precisar falar no ouvido, provavelmente supera 90 dB(A).",
      "Referências NR-15 Anexo 1: 85 dB(A) por 8h = limite máximo de tolerância. A cada 5 dB(A) de aumento, o tempo permitido cai pela metade: 90 dB → 4h; 95 dB → 2h; 100 dB → 1h; 105 dB → 30 min; 115 dB → 7 min.",
      "Ruído de impacto: prensas, marteletes, disparos de grampeadores pneumáticos — picos acima de 130 dB(C) são imediatamente lesivos independentemente da duração. Identifique fontes de impacto no setor.",
      "Verifique o uso de protetores auditivos: se são fornecidos e obrigatórios, isso indica exposição confirmada acima de 85 dB(A). A simples existência de EPI auditivo no setor já é um indicador que justifica Sim no checklist.",
      "Pergunte sobre sintomas: zumbido transitório após o turno (que passa nas horas seguintes), dificuldade de entender conversas em ambientes barulhentos, necessidade de aumentar o volume da TV são sinais iniciais de PAIR.",
    ],
    atencao: "Erro comum: avaliar apenas o ruído contínuo e ignorar impactos. Uma prensa que bate 20 vezes por turno pode ser mais lesiva auditivarmente que uma linha de produção barulhenta que o trabalhador usa protetor — porque os impactos costumam ser ignorados.",
    marque_sim: "Se comunicação verbal a 1 m exige voz elevada, há uso obrigatório de protetor auricular, trabalhadores relatam zumbido pós-turno, ou há fontes de impacto sonoro identificadas sem proteção adequada.",
  },
  {
    label: "Vibração (corpo inteiro / mãos e braços)",
    conceito: `A vibração transfere energia mecânica para os tecidos vivos em frequências que o corpo não consegue amortecer adequadamente. Para mãos e braços (HAV — Hand-Arm Vibration), as frequências mais lesivas estão entre 8 e 16 Hz — exatamente a faixa de muitas ferramentas pneumáticas e elétricas. O dano acumula-se nos vasos sanguíneos (síndrome de Raynaud / dedo branco), nos nervos periféricos (neuropatia vibratória) e nas articulações (artrose precoce de punho e cotovelo). Para o corpo inteiro (WBV — Whole-Body Vibration), as frequências lesivas ficam entre 0,5 e 80 Hz, e o alvo principal é a coluna lombar — hernias e artrose lombar precoce são achados frequentes em operadores de veículos pesados.`,
    como: [
      "HAV — identifique ferramentas vibratórias no setor: esmerilhadeiras angulares, furadeiras de impacto, marteletes demolidores, compactadores de solo, serras circulares, pistolas de parafusos pneumáticas. Pergunte ao trabalhador há quanto tempo usa cada uma e por quantas horas/dia.",
      "Limite de ação ISO 5349-1 para HAV: 2,5 m/s² (8h equivalente). Limite de exposição: 5,0 m/s². Na prática, para triagem sem medição: uso de martelete demolidor ou esmerilhadora > 30 min/dia → Sim. Uso de furadeira de impacto > 2h/dia → Sim.",
      "WBV — identifique veículos operados no setor: empilhadeiras, tratores, caminhões, plataformas vibratórias, veículos todo terreno. Verifique o estado do assento: assento sem amortecimento ou amortecimento estourado multiplica a vibração transmitida.",
      "Limite de ação ISO 2631-1 para WBV: 0,5 m/s² (8h). Limite de exposição: 1,15 m/s². Para triagem: operação de empilhadeira em piso irregular > 4h/turno → Sim. Operação de trator agrícola > 2h/turno → Sim.",
      "Sintomas de HAV: pergunte se os dedos ficam brancos ou dormentes no frio ou após o uso das ferramentas (síndrome de Raynaud), se há formigamento nas mãos ao acordar, dor nos punhos. Esses sintomas em trabalhadores jovens são fortemente sugestivos de neuropatia vibratória.",
    ],
    atencao: "Erro comum: ignorar a vibração de veículos por considerar que 'andar de empilhadeira não é um trabalho tão pesado'. Operadores de empilhadeira em piso de concreto rugoso podem receber doses de WBV equivalentes às de motoristas de caminhão fora de estrada.",
    marque_sim: "Se há uso diário de ferramentas vibratórias por > 2h, operação de veículos com WBV por > 4h/turno, ou relatos de sintomas de HAV (branqueamento dos dedos, formigamento) ou dor lombar crônica em operadores de veículos.",
  },
  {
    label: "Desconforto térmico",
    conceito: `O corpo humano funciona dentro de uma faixa muito estreita de temperatura interna (36,5–37,5°C). Para manter essa homeotermia, o organismo usa mecanismos que têm custo fisiológico: vasodilatação periférica, sudorese e taquicardia no calor; vasoconstrição e tremor no frio. Quando esses mecanismos são sobrecarregados pelo ambiente, a capacidade cognitiva e física cai significativamente. Estudos mostram queda de 2% na produtividade para cada grau Celsius acima de 25°C em trabalhos que exigem atenção. No calor intenso, o risco vai além da queda de desempenho: a exaustão por calor e a insolação são emergências médicas. No frio, a hipotermia localizada reduz a destreza manual — o trabalhador torna-se mais propenso a acidentes mesmo antes de sentir frio intenso.`,
    como: [
      "Calor — IBUTG (Índice de Bulbo Úmido e Termômetro de Globo): mede a combinação de temperatura, umidade e radiação. Sem equipamento, sinais práticos: trabalhadores suando intensamente mesmo em atividade leve; relatos de tontura, mal-estar ou náusea; necessidade de beber > 1 litro de água por hora.",
      "Limites NR-15 Anexo 3 por tipo de atividade: atividade leve sentado → IBUTG ≤ 30°C; trabalho moderado em pé → ≤ 26,7°C; trabalho pesado → ≤ 25°C. Em ambientes externos com carga solar, adicione 1°C ao IBUTG medido.",
      "Frio — frigoríficos e câmaras: temperatura < 5°C exige EPIs de proteção térmica (luvas, jaqueta, bota isolante), limite de exposição contínua (NR-29 e literatura: máximo 1–2h contínuos em câmaras frias abaixo de 0°C) e aquecimento periódico.",
      "Correntes de ar: NR-17 7.1.3 limita a velocidade do ar no posto de trabalho a 0,75 m/s. Ar-condicionado direcionado diretamente sobre o trabalhador mesmo a temperatura amena causa desconforto músculo-esquelético (contratura muscular cervical é queixa frequente).",
      "EPIs que retêm calor: macacões impermeáveis, aventais de chumbo, máscaras integrais — avaliem se há medidas de controle da temperatura interna (intervalos, hidratação, monitoramento de FC) quando esses EPIs são obrigatórios.",
    ],
    atencao: "Erro comum: avaliar o desconforto térmico apenas em ambientes extremos (fundições, frigoríficos). Escritórios com ar-condicionado mal direcionado, galpões com telhado de metal sem isolamento e trabalhos ao ar livre no verão brasileiro são fontes frequentes e subavaliadas.",
    marque_sim: "Se o IBUTG estimado supera os limites NR-15 para a atividade, temperatura < 5°C sem proteção adequada, ar-condicionado com fluxo direto sobre trabalhadores, ou relatos de tontura/mal-estar por calor ou dor muscular por frio.",
  },
];

// ─── Dados — Ergonomia Cognitiva ─────────────────────────────────────────────

const COGNITIVA_INTRO = `A Ergonomia Cognitiva estuda como o trabalho demanda os recursos mentais do ser humano: atenção, memória de trabalho, tomada de decisão, processamento de informações. O cérebro humano tem capacidade cognitiva limitada — não é multitarefa real, é um processador serial de alta velocidade que alterna rapidamente entre tarefas, pagando um 'custo de troca' a cada alternância. Quando a demanda cognitiva do trabalho supera consistentemente a capacidade do trabalhador, instala-se a sobrecarga mental. O resultado imediato é a queda de desempenho e o aumento de erros; a longo prazo, são os transtornos mentais relacionados ao trabalho — ansiedade, burnout, depressão. No Brasil, os transtornos mentais são a terceira causa de afastamento previdenciário. A sua avaliação aqui pode identificar o problema antes da crise.`;

const COGNITIVA_ITENS: ItemData[] = [
  {
    label: "Atenção contínua / concentração elevada",
    conceito: `A atenção sustentada — manter o foco em um estímulo específico por períodos prolongados à espera de eventos raros — é uma das tarefas mais desgastantes que o cérebro humano pode realizar. Estudos clássicos de vigilância mostram que o desempenho cai significativamente após 20–30 minutos de monitoramento contínuo, mesmo em sujeitos treinados. Operadores de salas de controle, inspetores de qualidade em linha de produção, controladores de tráfego aéreo, motoristas de longa distância — todos compartilham esse perfil de demanda. A particularidade é que o trabalhador muitas vezes não percebe sua própria queda de desempenho: o sinal de perigo é justamente o que eles deixam de detectar.`,
    como: [
      "Classifique a tarefa: é de vigilância (monitoramento passivo esperando eventos raros) ou de execução ativa (tomada de decisão constante)? As duas são desgastantes, mas por mecanismos diferentes.",
      "Para vigilância: avalie o tempo de exposição sem pausa. Pesquisas indicam que após 20 min de vigilância intensa, a taxa de detecção de sinais anômalos já começa a cair. Após 45–60 min, pode estar 30–50% abaixo do nível inicial.",
      "NASA-TLX (se disponível): escala de 6 dimensões (Demanda Mental, Demanda Física, Demanda Temporal, Desempenho, Esforço, Frustração). Peça ao trabalhador que avalie de 0 a 100. Pontuação geral > 60 ou Demanda Mental isolada > 70 indica sobrecarga.",
      "Pergunte sobre erros e quase-acidentes: 'Já deixou passar algum defeito que só percebeu depois?' ou 'Já se pegou 'viajando' durante o trabalho?' Respostas afirmativas frequentes indicam vigilância comprometida.",
      "Avalie as pausas cognitivas: NR-17 7.4 orienta pausas para trabalhos repetitivos, mas o mesmo princípio se aplica à vigilância. O ideal é 10 min de pausa a cada 50 min de trabalho de alta atenção, com estímulo diferente (pausa ativa, não ficar olhando para a mesma tela).",
    ],
    atencao: "Erro comum: confundir 'não tem muito o que fazer' com 'trabalho tranquilo'. Um vigilante de monitoramento de câmeras pode parecer ocioso, mas a exigência de manter a atenção pronta para detectar o evento raro é cognitivamente exaustiva.",
    marque_sim: "Se a tarefa exige vigilância ininterrupta por > 2h sem pausa cognitiva, o custo do erro é grave (acidente, produto crítico, dado irreversível), ou o trabalhador relata lapsos de atenção frequentes ou exaustão mental ao final do turno mesmo sem carga física.",
  },
  {
    label: "Sobrecarga mental / complexidade da tarefa",
    conceito: `A memória de trabalho humana consegue manipular simultaneamente apenas 4 ± 1 'chunks' de informação. Quando a tarefa exige gerenciar mais itens simultaneamente, o sistema entra em sobrecarga e começa a descartar informações — é o que chamamos de erro por sobrecarga (overload error), diferente do erro por lapso de atenção. Trabalhos complexos como gestão de equipes, análise de dados em tempo real, atendimento técnico especializado e gestão de projetos simultâneos são alvos clássicos. A sobrecarga cognitiva também interrompe a 'consolidação' de tarefas — o trabalhador perde o 'fio' do que estava fazendo quando interrompido e precisa reconstruir o contexto, o que custa tempo e energia mental.`,
    como: [
      "Observe e anote quantas tarefas distintas o trabalhador gerencia simultaneamente: quantos sistemas abertos, quantas demandas em paralelo, quantas exceções precisa tratar enquanto executa o fluxo principal.",
      "Peça ao trabalhador que descreva o que faz: se a descrição der mais de 3 camadas simultâneas ('enquanto atendo o cliente, preciso checar o estoque no sistema A, registrar no sistema B e verificar o prazo no sistema C'), a complexidade é alta.",
      "Avalie o índice de erros documentados: retrabalho frequente, reclamações de clientes por erros operacionais simples, correções frequentes de registros — são manifestações de sobrecarga cognitiva.",
      "Pergunte sobre estratégias de compensação: o trabalhador criou post-its, listas paralelas, alarmes, planilhas próprias para 'não esquecer'? Isso revela que a demanda mental superou a capacidade sem auxílios, obrigando o trabalhador a criar sistemas de suporte informais.",
      "Avalie o impacto das interrupções: pesquisas em engenharia de software mostram que após uma interrupção, o trabalhador leva em média 23 minutos para retomar o nível de foco anterior à interrupção em tarefas complexas.",
    ],
    atencao: "Erro comum: avaliar a complexidade da tarefa pelo nível de instrução exigido. Um operador de caixa pode ter sobrecarga cognitiva não pela complexidade técnica, mas pelo volume de transações, multitarefa (atendimento + caixa + fidelidade + vouchers) e ritmo acelerado.",
    marque_sim: "Se há > 3 fluxos simultâneos com decisões independentes, múltiplos sistemas com interfaces distintas, índice elevado de erros documentados, ou o trabalhador criou sistemas de compensação informal (listas, alarmes) para não esquecer tarefas rotineiras.",
  },
  {
    label: "Pressão psicológica / cobrança excessiva",
    conceito: `A cobrança é inerente ao trabalho — metas e responsabilidades são necessárias para o funcionamento das organizações. O problema começa quando a cobrança excede os limites da capacidade real do trabalhador e é exercida por meio de mecanismos que ativam a resposta de ameaça do sistema nervoso autônomo. Quando o trabalhador percebe o ambiente de trabalho como cronicamente ameaçador, o eixo hipotálamo-hipófise-adrenal mantém níveis elevados de cortisol de forma permanente. O cortisol cronicamente elevado está associado a imunossupressão, distúrbios do sono, hipertensão, ansiedade e depressão. O burnout é o extremo desse processo — não é fraqueza individual, é o resultado previsível de demanda crônica acima da capacidade com controle insuficiente sobre o próprio trabalho.`,
    como: [
      "Realize entrevistas individuais e confidenciais, idealmente fora do local de trabalho direto (sala separada, corredor afastado). Nunca pergunte sobre pressão hierárquica com o gestor presente.",
      "Perguntas abertas e diagnósticas: 'Como você descreveria o clima de trabalho aqui?' / 'O que acontece quando você não consegue cumprir uma meta?' / 'Você consegue desligar do trabalho quando está em casa?' / 'Você acha que poderia cumprir suas responsabilidades com o tempo e recursos disponíveis?'",
      "Sinais observáveis durante a visita: trabalhadores que param de falar imediatamente quando o gestor se aproxima; linguagem corporal fechada ao falar sobre gestão; respostas muito 'politicamente corretas' que parecem ensaiadas.",
      "Dados quantitativos correlacionados: absenteísmo por transtornos mentais (CID F) > 5% do quadro em 12 meses; rotatividade > 20%/ano; apresentação de atestados médicos por diagnósticos vagos (cefaleia recorrente, distúrbios do sono) — podem mascarar sofrimento psíquico real.",
      "Modelo de Karasek (Demanda-Controle): o risco psicossocial é máximo quando há alta demanda E baixo controle sobre o próprio trabalho. Verifique: o trabalhador tem alguma autonomia sobre como executa sua tarefa, ou tudo é prescrito e monitorado?",
    ],
    atencao: "Erro comum: considerar que a ausência de conflitos declarados significa que está tudo bem. Ambientes com pressão hierárquica intensa frequentemente têm aparência superficial de harmonia — os trabalhadores aprenderam que reclamar é perigoso.",
    marque_sim: "Se há relatos independentes de pressão excessiva por ≥ 2 trabalhadores, absenteísmo por transtornos mentais acima de 5%, rotatividade > 20%/ano, ou observação direta de tratamento desrespeitoso durante a visita.",
  },
  {
    label: "Excesso de informações simultâneas",
    conceito: `Vivemos na era da hiperinformação — e o ambiente de trabalho moderno é um amplificador de interrupções. Cada notificação de aplicativo, cada mensagem de WhatsApp corporativo, cada alerta de sistema ERP é uma interrupção cognitiva que obriga o cérebro a interromper o processamento atual, avaliar a nova informação e decidir o que fazer com ela. Pesquisas da Microsoft Research mostraram que trabalhadores em ambientes de escritório são interrompidos, em média, a cada 3–5 minutos. O custo cumulativo dessas micro-interrupções em termos de produtividade e saúde mental é enorme. A fragmentação da atenção está associada a aumento de erros, aumento de estresse percebido e sensação de 'trabalhar o dia inteiro sem terminar nada' — uma das queixas mais comuns no burnout moderno.`,
    como: [
      "Observe o posto de trabalho por 15 minutos sem interagir: conte quantas notificações, mensagens, alertas ou interrupções chegam ao trabalhador. > 5 interrupções em 15 minutos = 20 por hora = 160 por turno de 8h.",
      "Identifique os canais ativos simultâneos: e-mail; WhatsApp corporativo; Teams/Slack; alertas de sistema (ERP, WMS, CRM); telefone; demandas presenciais de colegas. Cada canal adicional aumenta a carga cognitiva de gerenciamento.",
      "Avalie a expectativa de resposta: há resposta imediata esperada para as mensagens? Se o trabalhador sente que não pode ignorar nenhuma notificação, o estado de vigilância permanece ativo continuamente — mesmo que as mensagens em si sejam triviais.",
      "Pergunte: 'Você consegue trabalhar por 30 minutos sem ser interrompido quando precisa se concentrar?' Se a resposta for raramente ou nunca, o ambiente é fragmentador.",
      "Avalie as 'reuniões desnecessárias': agenda com > 3h de reuniões/dia em funções que também têm demandas operacionais fragmenta profundamente o tempo disponível para trabalho focado.",
    ],
    atencao: "Erro comum: considerar que alta conectividade é sinal de modernidade e eficiência. Ambientes com notificações contínuas e expectativa de resposta imediata estão sistematicamente destruindo a capacidade de trabalho profundo (deep work) que gera os resultados mais valiosos.",
    marque_sim: "Se o trabalhador recebe > 5 interrupções/15 min de forma habitual, opera > 3 canais de comunicação com expectativa de resposta imediata, ou relata que raramente consegue concluir uma tarefa sem ser interrompido.",
  },
  {
    label: "Ritmo mental acelerado",
    conceito: `Existe uma diferença fundamental entre trabalho rápido autônomo e trabalho acelerado imposto. No primeiro, o trabalhador regula seu próprio ritmo conforme sua capacidade e estado — pode acelerar quando está descansado e desacelerar quando precisa. No ritmo imposto (máquina, sistema, cliente, meta de TMA), o trabalhador não tem esse controle. A ausência de controle sobre o próprio ritmo é, por si só, um fator estressor independente do volume de trabalho — é o que o modelo de Karasek chama de 'trabalho de alta demanda / baixo controle', associado ao dobro do risco cardiovascular em relação a trabalhadores com controle sobre seu ritmo. O ritmo imposto também amplifica o impacto de cada erro: se a esteira não para e você comete um defeito, a fila se acumula e a pressão aumenta.`,
    como: [
      "Identifique se o ritmo é imposto externamente: esteira de produção com velocidade fixa; sistema de call center com tela que avança automaticamente; operação de caixa com fila visível; takt time de linha definido pelo planejamento de produção.",
      "Calcule o takt time disponível: divida o tempo total disponível pelo número de unidades a produzir/atender. Compare com o tempo real necessário para executar a tarefa com qualidade. Se o takt disponível é < 80% do tempo real necessário, há risco.",
      "Para call center / atendimento: investigue a meta de TMA (Tempo Médio de Atendimento). Pergunte ao trabalhador: 'Você consegue resolver a maioria das chamadas dentro do tempo meta sem se apressar de forma que compromete a qualidade?' Se não, o TMA está abaixo da realidade operacional.",
      "Avalie a capacidade de recuperação: se o trabalhador 'perde o ritmo' por um evento (pausa no banheiro, dúvida de um colega, consulta ao manual), consegue retomar sem pressão? Em ritmos impostos por máquina, a perda de ritmo cria imediatamente acúmulo visível — o que gera ansiedade imediata.",
      "Pergunte: 'Você se sente pressionado pelo tempo durante a maior parte do turno?' / 'Tem tempo para verificar seu trabalho antes de passar para o próximo?' Respostas consistentemente negativas indicam ritmo além da capacidade.",
    ],
    atencao: "Erro comum: confundir eficiência com ritmo acelerado insustentável. Um posto de trabalho calibrado no limite máximo da capacidade humana não tem margem para variações — qualquer imprevisto vira gargalo e fonte de estresse.",
    marque_sim: "Se o ritmo é imposto por máquina ou sistema sem possibilidade de ajuste, o takt disponível é < 80% do tempo necessário para execução confortável, ou trabalhadores relatam que raramente têm tempo de verificar o próprio trabalho.",
  },
];

// ─── Dados — Ergonomia Organizacional ────────────────────────────────────────

const ORGANIZACIONAL_INTRO = `A Ergonomia Organizacional — também chamada de macroergonomia ou ergonomia do trabalho — examina como a estrutura, os processos e as relações da organização afetam a saúde e o desempenho dos trabalhadores. É a dimensão mais difícil de avaliar porque os fatores são menos visíveis que uma bancada alta ou um ruído estridente. Mas é também onde os riscos psicossociais têm seu maior impacto: transtornos mentais, burnout, doenças cardiovasculares relacionadas ao trabalho e acidentes causados por fadiga organizacional são, em grande parte, resultados de problemas organizacionais não tratados. A resistência mais comum que o técnico vai encontrar aqui é: 'Isso não é ergonomia, isso é RH.' Não é verdade — a NR-17 revisada e a NR-01 GRO/PGR incluem explicitamente os fatores psicossociais e organizacionais no escopo da avaliação ergonômica.`;

const ORGANIZACIONAL_ITENS: ItemData[] = [
  {
    label: "Metas agressivas / inatingíveis",
    conceito: `Metas são necessárias — sem elas não há direção. O problema são as metas inatingíveis com consequências punitivas pelo não cumprimento. Do ponto de vista da fisiologia do estresse, a percepção de que o fracasso é inevitável e punível é um dos estressores mais potentes identificados na literatura. O trabalhador entra em estado de ameaça crônica: aumenta o esforço (efeito de curto prazo), depois aumenta o estresse e começa a tomar atalhos de qualidade (efeito de médio prazo), e finalmente colapsa em burnout ou absenteísmo (efeito de longo prazo). A ironia é que metas impossíveis frequentemente produzem menos resultado do que metas desafiadoras mas alcançáveis, por conta desse ciclo de degradação do desempenho.`,
    como: [
      "Peça dados de atingimento de metas dos últimos 6–12 meses. A meta ideal está no limiar do desafiador: atingida em 70–90% das vezes. < 50% de atingimento de forma consistente indica meta fora da capacidade real.",
      "Calcule se o aumento de meta acompanhou aumento de capacidade: se a meta aumentou 20% no último ano, mas o quadro de pessoal e os recursos permaneceram os mesmos, a meta per capita é 20% mais agressiva.",
      "Investigue a consequência do não cumprimento: reuniões de 'cobrança', exposição pública de rankings, desconto em variável, ameaça de demissão. A consequência é tão importante quanto o nível da meta — meta exigente com consequência proporcional é diferente de meta impossível com consequência punitiva.",
      "Pergunte ao trabalhador: 'Quando você não bate a meta, o que acontece?' A resposta espontânea é mais diagnóstica do que qualquer dado formal.",
      "Compare com benchmarks do setor: se empresas comparáveis atingem 80% de uma meta equivalente e esta empresa atinge 40%, provavelmente a meta está desalinhada com a realidade operacional.",
    ],
    atencao: "Erro comum: aceitar a narrativa da gestão de que os trabalhadores 'não estão se esforçando suficientemente'. Quando o não atingimento de metas é sistemático e generalizado, o problema é estrutural (meta ou capacidade), não individual.",
    marque_sim: "Se o índice de atingimento médio é < 70% nos últimos 6 meses, houve aumento de meta sem aumento de recursos, ou o não atingimento gera punições formais ou constrangimentos públicos sistemáticos.",
  },
  {
    label: "Ausência ou insuficiência de pausas",
    conceito: `A pausa não é um luxo — é uma necessidade fisiológica. Músculos em contração estática (como os paravertebrais mantendo a postura sentada ou os estabilizadores de ombro durante trabalho repetitivo) ficam isquêmicos: o fluxo sanguíneo é reduzido pela própria contração, reduzindo o aporte de oxigênio e o clearance de metabólitos do esforço (lactato, íons K+). A pausa restaura esse fluxo. Do ponto de vista cognitivo, a pausa ativa a chamada Default Mode Network — a rede cerebral que processa experiências, consolida memórias e restaura os recursos atencionais. Trabalhar sem pausa não é mais produtivo: é como tentar correr mais rápido com o carro sem gasolina.`,
    como: [
      "NR-17 7.4.3 e 7.5.4: em trabalhos repetitivos ou de digitação, a norma orienta pausas de no mínimo 10 minutos para cada 50 minutos de trabalho. Verifique se essa proporção existe formalmente e se é respeitada na prática.",
      "Entreviste separadamente: 'Você consegue fazer pausas além do horário de almoço?' A resposta formal pode ser 'sim', mas a resposta real pode ser 'só vou ao banheiro correndo quando dá'. Há diferença entre pausa permitida e pausa praticada.",
      "Observe a dinâmica real: um posto de trabalho onde o trabalhador não se levanta por 3–4 horas seguidas sem olhar para longe, sem relaxar a musculatura, não tem pausa cognitiva nem física efetiva — mesmo que formalmente tenha 'intervalo a cada hora'.",
      "Em ambientes com calor elevado ou vibração: pausas têm função adicional de recuperação térmica e vascular. Verifique se o protocolo de pausas prevê isso explicitamente.",
      "Para trabalho em call center: NR-17 Anexo II é específica — 20 min de pausa distribuída por jornada, sendo 10 min antes e 10 min depois da metade da jornada, proibida sua supressão mesmo com compensação financeira.",
    ],
    atencao: "Erro comum: verificar o cartão de ponto e ver que o sistema registra pausa, e concluir que a pausa é feita. Em muitas operações, os trabalhadores 'batem o ponto' de pausa e continuam trabalhando por pressão informal.",
    marque_sim: "Se não há pausas programadas além do almoço em turno de 8h, ou as pausas existem no papel mas não são praticadas por pressão de produção, ou em call center não há o protocolo obrigatório da NR-17 Anexo II.",
  },
  {
    label: "Jornada extensiva / horas extras frequentes",
    conceito: `A CLT limita a jornada a 8h/dia e 44h/semana, com no máximo 2h extras/dia (Art. 59). Essas limitações não são arbitrárias — são baseadas em décadas de pesquisa sobre recuperação fisiológica. O sono de 7–8h por noite é o principal mecanismo de recuperação do organismo: é durante o sono que o sistema imunológico realiza manutenção, o cérebro consolida memórias e elimina resíduos metabólicos, e os tecidos musculoesqueléticos se reparam. Jornadas de 10–12h/dia comprimem o tempo disponível para sono e atividades de recuperação (alimentação, exercício, relacionamentos). Estudos mostram que trabalhar > 55h/semana aumenta em 33% o risco de acidente vascular cerebral e em 13% o risco de cardiopatia coronariana em relação a jornadas de 35–40h.`,
    como: [
      "Analise os registros de ponto: calcule a média de horas/semana nos últimos 3 meses. Jornada média > 50h/semana é preocupante; > 55h/semana é alto risco cardiovascular conforme a literatura.",
      "Verifique o banco de horas: saldo crescente mês a mês sem previsão de compensação significa que as horas extras são estruturais, não pontuais. A empresa está usando o banco de horas como mecanismo de extensão permanente de jornada.",
      "Investigue a voluntariedade: pergunte ao trabalhador se se sente pressionado a fazer horas extras. 'A empresa paga, então é tudo bem' não é o mesmo que 'faço porque escolho livremente'. Recompensa financeira não elimina o risco fisiológico da sobrecarga.",
      "Avalie o perfil de turno: turnos de 12h (comuns em saúde, segurança patrimonial, operações industriais) comprimem mais a exposição. A fadiga acumula exponencialmente nas últimas horas — os acidentes em turnos de 12h se concentram nas horas 9–12.",
      "Calcule o tempo de deslocamento: um trabalhador com 10h de jornada + 2h de deslocamento tem apenas 12h restantes para sono, alimentação, higiene e vida pessoal. Se dorme 7h, sobram apenas 5h para tudo o mais — situação de comprometimento severo da recuperação.",
    ],
    atencao: "Erro comum: normalizar horas extras em setores onde são culturalmente aceitas (tecnologia, saúde, agronegócio). A cronificação das horas extras como 'parte da cultura' não reduz o risco fisiológico — apenas torna-o invisível.",
    marque_sim: "Se a jornada habitual média ultrapassa 50h/semana, há horas extras em > 3 dias/semana de forma sistemática, banco de horas com saldo crescente sem perspectiva de compensação, ou turnos de 12h sem protocolo de gestão de fadiga.",
  },
  {
    label: "Pressão hierárquica / assédio moral",
    conceito: `O assédio moral no trabalho (mobbing) é definido como conduta abusiva, repetitiva, que degrada as condições de trabalho e atenta contra a dignidade do trabalhador. Os critérios de Leymann — o pesquisador sueco que sistematizou o fenômeno na década de 1980 — exigem: conduta negativa, repetida, por no mínimo 6 meses, com frequência de ao menos 1 vez por semana. Na prática, o técnico de segurança não precisa esperar esse intervalo para identificar e registrar o problema — qualquer padrão de conduta degradante merece registro. O assédio moral está associado a aumento de 2–3 vezes na probabilidade de transtornos ansiosos e depressivos, e a estudos de neuroimagem mostram que a exclusão social ativa as mesmas áreas cerebrais que a dor física — o sofrimento é literal, não metafórico.`,
    como: [
      "Realize entrevistas individuais em local privado, garantindo confidencialidade. Diga explicitamente: 'O que você me contar aqui não será divulgado com seu nome'. Trabalhadores sob assédio raramente falam espontaneamente — precisam se sentir seguros.",
      "Perguntas diagnósticas: 'Como é a sua relação com a liderança direta?' / 'Já se sentiu tratado de forma injusta ou desrespeitosa aqui?' / 'Existe alguém no trabalho que te faz se sentir mal com frequência?'",
      "Critérios comportamentais de Leymann para identificar mobbing: isolamento social do trabalhador; atribuição de tarefas humilhantes ou incompatíveis com a função; crítica constante e sem fundamento; ridicularização pública; negação de informação necessária para o trabalho; sabotagem do trabalho.",
      "Indicadores indiretos: verifique se um trabalhador específico tem índice de absenteísmo significativamente maior que a média do setor, solicita férias com muita frequência, ou tem histórico de conflitos com o mesmo gestor em postos diferentes.",
      "Observe a dinâmica durante a visita: gestores que interrompem trabalhadores para 'corrigir' o que está sendo dito ao técnico, ou que insistem em estar presentes em todas as conversas, estão sinalizando controle sobre o discurso da equipe.",
    ],
    atencao: "Erro comum: confundir exigência de desempenho com assédio, ou o contrário. Gestão firme que estabelece padrões claros e dá feedback técnico objetivo não é assédio. Assédio é a conduta repetida que visa humilhar, desestabilizar ou excluir — independente do resultado de trabalho do alvo.",
    marque_sim: "Se há relatos independentes de ≥ 2 trabalhadores sobre condutas abusivas repetidas, observação direta de tratamento desrespeitoso durante a visita, ou indicadores indiretos consistentes (absenteísmo elevado num trabalhador específico, rotatividade concentrada num setor com o mesmo gestor).",
  },
  {
    label: "Sobrecarga operacional",
    conceito: `A sobrecarga operacional é a condição em que o volume de demandas regularmente excede a capacidade disponível de tempo e recursos para atendê-las com qualidade. É diferente de um pico pontual de demanda — toda operação tem variações. O problema é a sobrecarga crônica: quando o trabalhador termina todos os turnos com mais tarefas abertas do que quando começou, quando o backlog nunca diminui, quando o 'padrão' é trabalhar sob pressão constante. A sobrecarga crônica ativa mecanismos de coping que, a curto prazo, parecem soluções: trabalhar mais rápido, pular etapas de verificação, fazer horas extras. A longo prazo, esses mecanismos aumentam erros, deterioram a qualidade e levam ao burnout.`,
    como: [
      "Mapeie a carga de trabalho: liste as entregas esperadas por turno e estime o tempo necessário para cada uma com qualidade adequada. Se a soma excede 80–85% da jornada disponível, não há margem para imprevistos.",
      "Pergunte ao trabalhador: 'Você consegue fazer tudo que precisa ser feito durante o turno?' e 'Quando você sai, fica com a sensação de que ficaram coisas importantes pendentes?' Respostas consistentemente afirmativas ao segundo indicam sobrecarga estrutural.",
      "Verifique o acúmulo de funções: compare a descrição formal do cargo com o que o trabalhador realmente faz. Acúmulo sem formalização (e sem ajuste de carga ou salário) é exploração mascarada de polivalência.",
      "Observe o índice de absenteísmo geral: taxas > 4% mensais estão consistentemente associadas a sobrecarga operacional na literatura de gestão de saúde ocupacional. O trabalhador que falta frequentemente pode estar usando a ausência como válvula de escape de uma carga insuportável.",
      "Identifique se há substituto quando alguém falta: 'Quando uma pessoa do setor está de férias ou afastada, quem faz o trabalho dela?' Se a resposta for 'os outros absorvem' de forma rotineira, o dimensionamento é insuficiente.",
    ],
    atencao: "Erro comum: responsabilizar o trabalhador pela sobrecarga operacional. Frases como 'precisa aprender a se organizar melhor' ou 'tem gente aqui que rende menos' frequentemente mascaram um problema de dimensionamento ou processo que é responsabilidade da organização.",
    marque_sim: "Se a carga de tarefas excede 85% da jornada de forma habitual, há acúmulo de funções sem compensação formal, backlog permanente mesmo com horas extras, ou absenteísmo > 4% mensalmente sem causa médica específica identificada.",
  },
  {
    label: "Déficit de equipe / trabalho solitário",
    conceito: `O déficit de equipe opera em dois eixos de risco. No eixo de segurança direta, atividades que exigem equipe mínima por norma — espaço confinado (NR-33), trabalho em altura (NR-35), operações com produtos químicos perigosos (NR-26) — realizadas por uma pessoa só representam risco de acidente grave sem possibilidade de resgate. No eixo psicossocial, o trabalhador que opera cronicamente sozinho ou com equipe reduzida carrega uma pressão desproporcional: cada ausência sobrecarrega os remanescentes, o erro não tem quem detecte, e o suporte técnico e emocional de colegas — um importante amortecedor de estresse — está ausente. Ambientes de trabalho noturno e de fim de semana são especialmente vulneráveis a este fator.`,
    como: [
      "Verifique o headcount atual versus o planejado: consulte o organograma ou a descrição do setor. Quantas posições estão abertas ou temporariamente não preenchidas? Operar com > 15% abaixo do quadro previsto por > 30 dias consecutivos é déficit operacional relevante.",
      "Identifique atividades de risco realizadas com quantas pessoas: qualquer atividade em espaço confinado, em altura > 2m, com produtos inflamáveis ou tóxicos ou com máquinas de risco grave deve ter no mínimo 2 pessoas (operador + vigia/apoio). Verifique.",
      "Avalie o protocolo de faltas e férias: 'Quando alguém falta, o que acontece com o trabalho dessa pessoa?' Se a resposta for 'cada um absorve um pouco' de forma habitual, o dimensionamento não prevê ausências — e ausências são inevitáveis.",
      "Para trabalho noturno: verifique a quantidade de trabalhadores por turno noturno. Equipes muito reduzidas à noite enfrentam duplo risco: menor supervisão de segurança e menor suporte social em caso de emergência.",
      "Pergunte sobre isolamento percebido: 'Você trabalha a maior parte do tempo sozinho?' / 'Se tiver um problema técnico ou de segurança, a quem você recorre imediatamente?' A ausência de resposta clara para a segunda pergunta é um indicador de risco.",
    ],
    atencao: "Erro comum: aceitar 'a empresa sempre funcionou assim' como justificativa para equipes subdimensionadas. O risco existe independentemente de nunca ter ocorrido um acidente — o acidente ainda não ocorreu, não significa que o risco não existe.",
    marque_sim: "Se há operação habitual com > 15% abaixo do quadro previsto, atividades de risco grave realizadas por uma só pessoa, ausência de protocolo de cobertura para faltas e férias, ou trabalhadores que relatam não ter a quem recorrer imediatamente diante de um problema.",
  },
  {
    label: "Conflito organizacional / falta de suporte",
    conceito: `Organizações são sistemas sociais complexos onde conflitos são inevitáveis — a diferença é se eles são gerenciados ou ignorados. Conflitos crônicos não resolvidos entre departamentos, funções ou indivíduos criam 'ruído social' constante que consome energia mental e emocional dos trabalhadores mesmo quando não estão diretamente envolvidos. A falta de suporte — percepção de que não há a quem recorrer quando há dificuldade — é um preditor independente de burnout mesmo quando o volume de trabalho é aceitável. O modelo JD-R (Job Demands-Resources) de Bakker e Demerouti mostra que recursos de trabalho (suporte do supervisor, clareza de papel, feedback, autonomia) funcionam como amortecedores do estresse gerado pelas demandas — sem esses recursos, as mesmas demandas que seriam manejáveis tornam-se esmagadoras.`,
    como: [
      "Avalie a clareza de papéis: peça ao trabalhador que descreva em 2 minutos suas principais responsabilidades e a quem reporta. Respostas vagas, contraditórias ou que envolvem múltiplos gestores com instruções conflitantes indicam ambiguidade de papel — um estressor comprovado.",
      "Avalie o suporte percebido: 'Quando você tem um problema técnico que não consegue resolver sozinho, o que você faz?' / 'Você sente que pode ir ao seu gestor quando tem uma dificuldade no trabalho?' Trabalhadores que respondem 'resolvo sozinho sempre' ou 'prefiro não incomodar' podem estar sinalizando falta de suporte.",
      "Observe a taxa de turnover segmentada: rotatividade alta em um setor específico com o mesmo gestor, enquanto setores similares têm turnover baixo, é forte indicador de problema de liderança naquele setor.",
      "Identifique conflitos entre áreas: 'Como é a relação entre sua equipe e a equipe de X?' Conflitos crônicos não resolvidos entre TI e Operações, Comercial e Produção, Qualidade e Produção são comuns e têm impacto real no bem-estar.",
      "Avalie os canais formais de comunicação ascendente: há mecanismo confiável para o trabalhador expressar preocupações (ouvidoria, pesquisa de clima anônima, reuniões estruturadas)? A ausência de canais confiáveis significa que os problemas não chegam à gestão — eles acumulam nos trabalhadores.",
    ],
    atencao: "Erro comum: avaliar clima organizacional apenas em conversa com gestores. Gestores raramente percebem ou admitem conflitos que acontecem sob sua supervisão. A única forma de identificar esses problemas é falar individualmente com trabalhadores da base.",
    marque_sim: "Se há papéis mal definidos com ambiguidade reportada por ≥ 2 trabalhadores, conflitos crônicos entre áreas sem mediação, ausência de canais de suporte e comunicação ascendente confiáveis, ou turnover > 20%/ano concentrado em setores específicos.",
  },
];

// ─── Passos ───────────────────────────────────────────────────────────────────

const PASSOS = [
  { numero: "01", titulo: "Criar Nova Análise",             icone: Plus,          cor: "emerald",
    descricao: "Clique em \"Nova Análise\" no menu lateral. Selecione a empresa, data de elaboração e responsável técnico. A análise é salva como Rascunho — você pode interromper e retomar a qualquer momento.",
    dicas: ["Use uma análise por empresa ou por grupo homogêneo de setores.", "O status muda para Concluído automaticamente quando todos os campos obrigatórios são preenchidos."] },
  { numero: "02", titulo: "Cadastrar Setores",               icone: Layers,        cor: "blue",
    descricao: "Na aba Setores / Triagem, adicione cada setor ou posto de trabalho. Nomes específicos facilitam a comunicação com o cliente — prefira \"Linha de Montagem 01\" a \"Produção\".",
    dicas: ["Setores com tarefas muito distintas devem ser separados mesmo se fisicamente próximos.", "Setores idênticos (3 linhas com a mesma tarefa) podem ser avaliados um e replicado com nota explicativa."] },
  { numero: "03", titulo: "Aplicar a Triagem Ergonômica",    icone: ClipboardCheck, cor: "orange",
    descricao: "Para cada setor, responda os checklists de Ergonomia Física, Cognitiva e Organizacional com Sim / Não / N/A. Cada Sim gera um alerta e deve embasar um risco na Matriz.",
    dicas: ["Responda durante a observação in loco — não depois, de memória.", "Leia as orientações de cada item nesta página de Ajuda antes da visita para saber o que observar."] },
  { numero: "04", titulo: "Registrar Riscos na Matriz",       icone: TriangleAlert,  cor: "yellow",
    descricao: "Clique em \"+ Risco\" para registrar cada risco formalmente: tipo, descrição, probabilidade e severidade. O sistema calcula o Nível: Trivial, De Atenção, Moderado, Alto ou Crítico.",
    dicas: ["Agrupe itens relacionados do checklist em um único risco quando tiver mesma origem.", "Riscos Altos e Críticos devem indicar necessidade de AET completa no campo de observações."] },
  { numero: "05", titulo: "Redigir Parecer e Recomendações",  icone: Pencil,        cor: "purple",
    descricao: "Preencha o Parecer Técnico e as Recomendações ao final de cada setor. O parecer resume o diagnóstico; as recomendações orientam as ações prioritárias.",
    dicas: ["Cite dados observados: ângulos, frequências, durações — não apenas 'há risco de postura'.", "Divida as recomendações em: imediatas (< 30 dias), preventivas (30–90 dias) e estruturais (> 90 dias)."] },
  { numero: "06", titulo: "Preencher Dados e Conclusão",      icone: Info,          cor: "blue",
    descricao: "Na aba Dados / Conclusão, informe os dados gerais da empresa e redija a conclusão técnica consolidando os achados de todos os setores.",
    dicas: ["A conclusão deve identificar os setores prioritários e as ações globais recomendadas.", "Use os Textos Padrão do sistema para acelerar a redação sem perder a personalização."] },
  { numero: "07", titulo: "Gerar e Imprimir o Laudo",         icone: Printer,       cor: "gray",
    descricao: "Na aba Laudo / Imprimir, visualize o relatório final e exporte o PDF. Revise cuidadosamente antes de entregar ao cliente.",
    dicas: ["O PDF tem formatação otimizada para A4.", "O laudo inclui todos os setores, checklists, riscos classificados e recomendações."] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COR_BG: Record<string, string> = {
  emerald: "bg-emerald-50 border-emerald-200", blue: "bg-blue-50 border-blue-200",
  orange: "bg-orange-50 border-orange-200",   yellow: "bg-yellow-50 border-yellow-200",
  purple: "bg-purple-50 border-purple-200",   gray: "bg-gray-50 border-gray-200",
};
const COR_ICON: Record<string, string> = {
  emerald: "text-emerald-600 bg-emerald-100", blue: "text-blue-600 bg-blue-100",
  orange: "text-orange-600 bg-orange-100",   yellow: "text-yellow-700 bg-yellow-100",
  purple: "text-purple-600 bg-purple-100",   gray: "text-gray-600 bg-gray-100",
};
const COR_NUM: Record<string, string> = {
  emerald: "text-emerald-700", blue: "text-blue-700", orange: "text-orange-700",
  yellow: "text-yellow-700",  purple: "text-purple-700", gray: "text-gray-600",
};

// ─── ItemChecklist com expansão ───────────────────────────────────────────────

function ItemChecklist({ label, conceito, como, atencao, marque_sim }: ItemData) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {open ? <ChevronUp className="size-4 text-gray-400 shrink-0" /> : <ChevronDown className="size-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          {/* Conceito */}
          <div className="pt-3 space-y-1">
            <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Por que é um risco?</p>
            <p className="text-xs text-gray-700 leading-relaxed">{conceito}</p>
          </div>

          {/* Como avaliar */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Como avaliar na prática</p>
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
              <p className="text-xs text-amber-800"><span className="font-bold">Erro comum: </span>{atencao.replace("Erro comum: ", "")}</p>
            </div>
          )}

          {/* Critério */}
          <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5">
            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1">Marque Sim se:</p>
            <p className="text-xs text-red-800">{marque_sim}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Seção de categoria ───────────────────────────────────────────────────────

function CategoriaChecklist({
  icon: Ic, iconCor, titulo, subtitulo, intro, itens, bg, border,
}: {
  icon: React.ElementType; iconCor: string; titulo: string; subtitulo: string;
  intro: string; itens: ItemData[]; bg: string; border: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex size-9 items-center justify-center rounded-lg ${iconCor}`}>
          <Ic className="size-4" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">{titulo}</h2>
          <p className="text-xs text-gray-500">{subtitulo}</p>
        </div>
      </div>
      <div className={`rounded-xl border ${border} ${bg} p-4 space-y-3`}>
        <div className={`rounded-lg border ${border} bg-white/70 px-4 py-3`}>
          <p className="text-xs text-gray-700 leading-relaxed">{intro}</p>
        </div>
        {itens.map((item, i) => <ItemChecklist key={i} {...item} />)}
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AepAjudaPage() {
  return (
    <div className="space-y-10 max-w-4xl">

      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <HelpCircle className="size-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guia Técnico da AEP</h1>
          <p className="mt-1 text-sm text-gray-500">
            Material de referência para técnicos e engenheiros de segurança do trabalho — triagem ergonômica, checklists, parecer e recomendações.
          </p>
        </div>
      </div>

      {/* O que é */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="size-5 shrink-0 text-emerald-700 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-emerald-900">O que é a AEP e qual é o seu papel?</p>
            <p className="text-sm text-emerald-800 leading-relaxed">
              A <strong>Análise Ergonômica Preliminar</strong> é a triagem do GRO/PGR para riscos ergonômicos, prevista na NR-01.
              Ela mapeia todos os setores da empresa de forma qualitativa, identificando onde há fatores de risco e qual é o nível de
              urgência de cada um. Quando a AEP identifica riscos Altos ou Críticos, esses setores devem evoluir para a
              <strong> AET (Análise Ergonômica do Trabalho)</strong> — uma análise aprofundada com medições instrumentais, prevista
              na NR-17. O papel do técnico na AEP é o de um investigador clínico: observar, perguntar, medir quando possível e,
              principalmente, saber o que procurar e por que é importante encontrá-lo antes que cause dano.
            </p>
          </div>
        </div>
      </div>

      {/* Fluxo */}
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
                    {i < PASSOS.length - 1 && <ChevronRight className="size-3.5 text-gray-300 rotate-90" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-xs font-bold tabular-nums ${COR_NUM[p.cor]}`}>{p.numero}</span>
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
          <h2 className="font-semibold text-gray-800">Botões Sim / Não / N/A — critério técnico de uso</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { btn: "Sim", bc: "bg-red-500", titulo: "Fator presente e confirmado", cor: "border-red-200 bg-red-50", tc: "text-red-700",
              desc: "O fator de risco foi identificado durante a visita ou entrevista com evidência suficiente. Gera um alerta e DEVE embasar um risco na Matriz de Riscos. Não marque Sim por precaução — marque quando há evidência." },
            { btn: "Não", bc: "bg-green-500", titulo: "Fator avaliado e ausente", cor: "border-green-200 bg-green-50", tc: "text-green-700",
              desc: "O fator foi especificamente avaliado in loco (não apenas suposto) e não foi identificado. Registra que a condição foi verificada. 'Não' é um resultado técnico válido e importante — indica que você avaliou." },
            { btn: "N/A", bc: "bg-gray-400", titulo: "Genuinamente inaplicável", cor: "border-gray-200 bg-gray-50", tc: "text-gray-700",
              desc: "O item não existe no contexto do setor — não pela ausência do risco, mas pela ausência da condição que o geraria. Ex.: vibração de ferramentas em setor 100% administrativo. Em dúvida entre N/A e Não, sempre prefira Não." },
          ].map((c, i) => (
            <div key={i} className={`rounded-xl border p-4 ${c.cor}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold text-white ${c.bc}`}>{c.btn}</span>
                <span className={`text-sm font-semibold ${c.tc}`}>{c.titulo}</span>
              </div>
              <p className="text-xs text-gray-700">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ergonomia Física */}
      <CategoriaChecklist
        icon={User} iconCor="text-blue-700 bg-blue-100"
        titulo="Ergonomia Física"
        subtitulo="Clique em cada item para ver a explicação completa, como avaliar e o critério de Sim. Referências: NR-17, NR-15, NIOSH, ISO 5349-1, ISO 2631-1, NBR ISO/CIE 8995-1."
        intro={FISICA_INTRO} itens={FISICA_ITENS}
        bg="bg-blue-50" border="border-blue-200"
      />

      {/* Ergonomia Cognitiva */}
      <CategoriaChecklist
        icon={Brain} iconCor="text-purple-700 bg-purple-100"
        titulo="Ergonomia Cognitiva"
        subtitulo="Clique em cada item para ver a explicação completa. Referências: NR-17 7.4, NASA-TLX, modelo de Karasek, JD-R, literatura de ergonomia cognitiva."
        intro={COGNITIVA_INTRO} itens={COGNITIVA_ITENS}
        bg="bg-purple-50" border="border-purple-200"
      />

      {/* Ergonomia Organizacional */}
      <CategoriaChecklist
        icon={Building2} iconCor="text-orange-700 bg-orange-100"
        titulo="Ergonomia Organizacional"
        subtitulo="Clique em cada item para ver a explicação completa. Referências: NR-17, NR-01 GRO/PGR, CLT, critérios de Leymann, modelo de Karasek, JD-R."
        intro={ORGANIZACIONAL_INTRO} itens={ORGANIZACIONAL_ITENS}
        bg="bg-orange-50" border="border-orange-200"
      />

      {/* Parecer */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100">
            <FileText className="size-4 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Como redigir o Parecer Técnico Preliminar</h2>
            <p className="text-xs text-gray-500">Campo por setor — o seu diagnóstico técnico das condições ergonômicas da área avaliada.</p>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            O Parecer é o texto onde você, como profissional, assume a responsabilidade técnica pelo diagnóstico. Não é um resumo dos
            checklists — é a sua interpretação do que foi encontrado. Um parecer fraco diz &ldquo;há riscos ergonômicos no setor&rdquo;. Um parecer
            forte diz &ldquo;o setor apresenta risco Alto, caracterizado por movimentos repetitivos de membros superiores com frequência
            estimada de 8 ciclos/min, durante 6h por turno, em trabalhadores que não realizam pausas além do horário de almoço&rdquo;.
            A diferença é a especificidade — ela é o que transforma um formulário preenchido em um documento técnico com valor real.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Estrutura recomendada (4 elementos)</p>
            {[
              ["1. Fatores identificados",       "Cite os principais itens marcados como Sim, com dados observados: ângulos, frequências, durações, temperaturas, nível de ruído estimado."],
              ["2. Nível de risco predominante",  "Declare explicitamente: Trivial / De Atenção / Moderado / Alto / Crítico, com base na Matriz de Riscos. O leitor do laudo precisa entender o grau de urgência sem consultar os dados brutos."],
              ["3. Contexto do setor",            "Número de trabalhadores expostos, turnos, regime de trabalho, tempo de exposição diário, e qualquer condicionante relevante (trabalhadores com restrições, gestantes, trabalhadores novos)."],
              ["4. Indicação de aprofundamento",  "Se identificou risco Alto ou Crítico, indique expressamente: 'Recomenda-se elaboração de AET completa para este posto'. Sem essa indicação, o gestor pode interpretar que a AEP é suficiente."],
            ].map(([t, d], i) => (
              <div key={i} className="rounded-lg border border-emerald-200 bg-white p-3.5 flex items-start gap-3">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                <div><p className="text-sm font-semibold text-gray-800">{t}</p><p className="text-xs text-gray-600 mt-0.5">{d}</p></div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-emerald-300 bg-white p-4">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Exemplo de parecer — Linha de Montagem</p>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              &ldquo;O setor de Produção — Linha de Montagem 01 apresenta risco ergonômico de nível Alto. Foram identificados movimentos
              repetitivos de membros superiores com frequência estimada de 8–10 ciclos/min (pega e encaixe de componentes) durante
              aproximadamente 6h do turno de 8h, com ciclo de trabalho de 25 segundos. Identificou-se também flexão de tronco
              recorrente entre 30–45° durante a pega de componentes na parte inferior da esteira (30–40% do ciclo), e ausência de
              pausas programadas além do intervalo de almoço. O mobiliário é fixo sem regulagem de altura — trabalhadores com
              estatura ≥ 1,78 m (aproximadamente 4 dos 12 trabalhadores observados) adotam flexão cervical compensatória para
              visualizar a esteira. Os trabalhadores relatam dor em punhos e ombros ao final do turno de forma consistente.
              Recomenda-se elaboração de AET completa para este posto, com aplicação de RULA e OCRA index para quantificação
              das exposições.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Recomendações */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100">
            <Zap className="size-4 text-amber-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Como redigir as Recomendações</h2>
            <p className="text-xs text-gray-500">Campo por setor — orientações acionáveis para eliminar ou controlar os riscos identificados.</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Uma recomendação técnica ruim diz &ldquo;melhorar as condições ergonômicas do posto&rdquo;. Uma recomendação técnica boa diz
            exatamente o quê fazer, com que referência técnica, em quanto tempo e com que resultado esperado. A priorização
            por urgência não é opcional — é o que permite ao gestor alocar recursos de forma racional: o que precisa ser feito
            esta semana versus o que pode entrar no orçamento do próximo trimestre.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { titulo: "Imediatas", prazo: "até 30 dias", cor: "bg-red-50 border-red-200", tc: "text-red-700",
                icon: AlertTriangle, ic: "text-red-500",
                desc: "Para riscos Altos e Críticos com potencial de dano imediato. Não podem aguardar planejamento orçamentário. Se necessário, a medida imediata pode ser temporária enquanto a estrutural é planejada.",
                ex: "[Imediata] Suspender levantamento manual > 20 kg no setor de Expedição até realização de avaliação NIOSH e treinamento de movimentação de cargas (NR-11)." },
              { titulo: "Preventivas", prazo: "30–90 dias", cor: "bg-yellow-50 border-yellow-200", tc: "text-yellow-700",
                icon: Info, ic: "text-yellow-500",
                desc: "Ações que reduzem a probabilidade de agravamento, exigem planejamento mas têm impacto antes do próximo ciclo de avaliação. Frequentemente envolvem treinamento, reorganização ou aquisição de baixo custo.",
                ex: "[Preventiva] Implantar pausas de 10 min a cada 50 min de trabalho para operadores de caixa conforme NR-17 7.4.3, com escalonamento por grupo para não interromper operação." },
              { titulo: "Estruturais", prazo: "> 90 dias", cor: "bg-blue-50 border-blue-200", tc: "text-blue-700",
                icon: Building2, ic: "text-blue-500",
                desc: "Mudanças que modificam o processo, o ambiente ou a organização do trabalho. Exigem investimento, projeto ou reestruturação. Devem entrar no planejamento orçamentário com prazo definido.",
                ex: "[Estrutural] Substituir as 18 bancadas fixas da Linha de Montagem 01 por bancadas com regulagem elétrica de altura (800–1.100 mm) e possibilidade de trabalho sentado/em pé — orçar para próximo exercício." },
            ].map((c, i) => {
              const Ic = c.icon;
              return (
                <div key={i} className={`rounded-lg border p-4 space-y-2 ${c.cor}`}>
                  <div className="flex items-center gap-2">
                    <Ic className={`size-4 shrink-0 ${c.ic}`} />
                    <p className={`text-sm font-semibold ${c.tc}`}>{c.titulo}</p>
                  </div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Prazo sugerido: {c.prazo}</p>
                  <p className="text-xs text-gray-700">{c.desc}</p>
                  <div className="rounded border border-white/80 bg-white/60 p-2">
                    <p className="text-xs text-gray-500 mb-0.5 font-semibold">Exemplo:</p>
                    <p className="text-xs text-gray-700 italic">{c.ex}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-lg border border-amber-300 bg-white p-4">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Exemplo de conjunto de recomendações — Linha de Montagem 01</p>
            <ul className="space-y-1.5 text-sm text-gray-700">
              {[
                "[Imediata] Fornecer e exigir o uso de suporte de punho para os operadores que realizam montagem de precisão com punho em desvio — medida temporária até reestruturação do posto.",
                "[Imediata] Proibir levantamento manual de caixas > 15 kg abaixo do nível do joelho até rearranjo da estação de pega — uso de plataforma elevatória provisória.",
                "[Preventiva] Implementar rodízio de funções entre as 4 estações da linha a cada 2h para reduzir a exposição cumulativa de membros superiores por estação.",
                "[Preventiva] Incluir pausa obrigatória de 10 min após as primeiras 2h de trabalho e após as primeiras 2h do período da tarde (NR-17 7.4).",
                "[Estrutural] Adquirir bancadas com regulagem de altura elétrica (800–1.100 mm) para as 12 estações da Linha 01 — orçamento previsto para Q1 do próximo exercício.",
                "[Estrutural] Elaborar AET completa com aplicação de RULA e OCRA index para quantificação das exposições e dimensionamento preciso das intervenções.",
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
        <div className="mb-3 flex items-center gap-2">
          <FileText className="size-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">AEP × AET — quando cada uma se aplica?</h2>
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
                ["Tipo",           "Triagem qualitativa por checklist",     "Análise aprofundada com medições instrumentais"],
                ["Abrangência",    "Toda a empresa / todos os setores",     "Posto ou função específica"],
                ["Tempo médio",    "Horas a 1 dia por empresa",             "Dias a semanas por posto"],
                ["Instrumentos",   "Não obrigatórios (observação + entrevista)", "RULA, REBA, NIOSH, OCRA, sonômetro, luxímetro, acelerômetro"],
                ["Base normativa", "NR-01 GRO/PGR — item 1.5.7",           "NR-17 + Portaria MTE 1.121/2023"],
                ["Resultado",      "Mapa de riscos + priorização de setores",   "Laudo com nexo causal + plano de intervenção detalhado"],
                ["Quando usar",    "Início do GRO/PGR, visita inicial, reavaliação periódica", "Sempre que AEP identificar risco Alto ou Crítico"],
                ["Substitui a AET?", "Não — é a triagem que a precede",    "—"],
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
            <p className="font-semibold text-amber-900 mb-3">Boas práticas de campo — o que os técnicos experientes fazem diferente</p>
            <ul className="space-y-2 text-sm text-amber-800">
              {[
                "Chegue antes do início do turno para observar a preparação do posto e os primeiros 30 minutos de trabalho — é quando surgem compensações posturais que desaparecem quando o trabalhador está 'quente'.",
                "Nunca anuncie com antecedência o que vai avaliar — ambientes 'preparados' para a visita técnica escondem os problemas reais.",
                "Entreviste trabalhadores longe do posto de trabalho e longe dos gestores. Uma conversa de 5 minutos no corredor afastado vale mais que 30 minutos de entrevista formal na presença da chefia.",
                "Quando o trabalhador diz 'aqui é assim mesmo' ou 'sempre foi desse jeito' — esse é exatamente o momento de perguntar mais. Normalização do risco é um sinal de alerta, não de que está tudo bem.",
                "Documente com fotos e vídeos curtos (com autorização) — ângulos posturais, layout do posto, posição relativa dos componentes. Sem evidência visual, é difícil comunicar o risco ao cliente com a mesma clareza que você viu.",
                "Avalie setores em diferentes momentos: um posto de trabalho no início do turno pode parecer adequado; no final, com fadiga acumulada, o trabalhador adota posturas completamente diferentes.",
                "Para fatores organizacionais, compare as respostas de trabalhadores de turnos diferentes sobre o mesmo setor e gestor. Consistência entre relatos independentes é o critério mais forte de diagnóstico.",
                "Seu laudo vai para a gestão e pode ser lido por trabalhadores — escreva como se fosse apresentar para os dois ao mesmo tempo. Técnico e compreensível não são opostos.",
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
