'use client'
import { useState } from 'react'
import EditorDiagrama from './EditorDiagrama'
import DiagramaFase from './DiagramaFase'
import { useRouter } from 'next/navigation'

const SYNE = 'Syne, sans-serif'
const NAVY = '#0A0E1A'
const BLUE = '#4169E1'
const CYAN = '#00BFFF'
const SKY = '#7DD3FC'
const OFF = '#F0F4FF'
const CARD = 'rgba(65,105,225,0.08)'
const BORDER = '1px solid rgba(65,105,225,0.25)'

type Categoria = 'Sub-5' | 'Sub-7' | 'Sub-9' | 'Sub-11' | 'Sub-13' | 'Sub-15' | 'Sub-17' | 'Sub-20'
type Exercicio = {
  id: string
  nome: string
  descricao: string
  metodologia: string
  categorias: Categoria[]
  duracao: string
  jogadores: string
  videoUrl?: string
  diagrama: string // SVG string
}
type Fundamento = {
  id: string
  label: string
  icon: string
  cor: string
  exercicios: Exercicio[]
}

// ── Diagramas SVG ──────────────────────────────────────────────────────────
const CAMPO_BASE = (content: string) => `
<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:8px">
  <rect width="300" height="200" fill="#1a4a1a" rx="8"/>
  <rect x="10" y="10" width="280" height="180" fill="none" stroke="#ffffff22" stroke-width="1"/>
  <line x1="150" y1="10" x2="150" y2="190" stroke="#ffffff22" stroke-width="1"/>
  <circle cx="150" cy="100" r="25" fill="none" stroke="#ffffff22" stroke-width="1"/>
  <rect x="10" y="65" width="35" height="70" fill="none" stroke="#ffffff22" stroke-width="1"/>
  <rect x="255" y="65" width="35" height="70" fill="none" stroke="#ffffff22" stroke-width="1"/>
  ${content}
</svg>`

const SVG_PASSE = CAMPO_BASE(`
  <circle cx="60" cy="100" r="8" fill="#4169E1"/>
  <circle cx="140" cy="70" r="8" fill="#4169E1"/>
  <circle cx="200" cy="130" r="8" fill="#00BFFF"/>
  <line x1="68" y1="96" x2="132" y2="74" stroke="#FFD700" stroke-width="2" stroke-dasharray="4"/>
  <line x1="148" y1="74" x2="194" y2="126" stroke="#FFD700" stroke-width="2" stroke-dasharray="4"/>
  <polygon points="192,118 196,130 184,126" fill="#FFD700"/>
  <polygon points="130,68 142,70 136,80" fill="#FFD700"/>
  <text x="55" y="90" fill="#fff" font-size="8" text-anchor="middle">A</text>
  <text x="140" y="60" fill="#fff" font-size="8" text-anchor="middle">B</text>
  <text x="200" y="148" fill="#fff" font-size="8" text-anchor="middle">C</text>
  <circle cx="95" cy="88" r="5" fill="#FFD700" opacity="0.8"/>`)

const SVG_CHUTE = CAMPO_BASE(`
  <circle cx="80" cy="100" r="8" fill="#4169E1"/>
  <circle cx="240" cy="100" r="5" fill="#FFD700"/>
  <rect x="255" y="75" width="8" height="50" fill="#ffffff33"/>
  <path d="M88,96 Q160,60 252,95" stroke="#FF6B6B" stroke-width="2" fill="none" stroke-dasharray="4"/>
  <polygon points="248,90 256,96 248,102" fill="#FF6B6B"/>
  <circle cx="80" cy="100" r="4" fill="#FFD700"/>
  <text x="80" y="120" fill="#fff" font-size="8" text-anchor="middle">Atacante</text>
  <text x="265" y="70" fill="#fff" font-size="7" text-anchor="middle">GOL</text>`)

const SVG_DRIBLE = CAMPO_BASE(`
  <circle cx="50" cy="100" r="8" fill="#4169E1"/>
  <circle cx="100" cy="85" r="6" fill="#FF6B6B" opacity="0.7"/>
  <circle cx="140" cy="110" r="6" fill="#FF6B6B" opacity="0.7"/>
  <circle cx="180" cy="88" r="6" fill="#FF6B6B" opacity="0.7"/>
  <circle cx="220" cy="105" r="6" fill="#FF6B6B" opacity="0.7"/>
  <path d="M58,98 Q75,80 94,85 Q120,95 134,108 Q158,120 175,90 Q198,75 215,103" stroke="#FFD700" stroke-width="2" fill="none"/>
  <circle cx="50" cy="100" r="4" fill="#FFD700"/>
  <text x="50" y="118" fill="#fff" font-size="7" text-anchor="middle">Condutor</text>
  <text x="100" y="75" fill="#FF6B6B" font-size="7" text-anchor="middle">D</text>
  <text x="140" y="125" fill="#FF6B6B" font-size="7" text-anchor="middle">D</text>`)

const SVG_POSICIONAMENTO = CAMPO_BASE(`
  <circle cx="70" cy="160" r="7" fill="#4169E1"/>
  <circle cx="120" cy="145" r="7" fill="#4169E1"/>
  <circle cx="150" cy="100" r="7" fill="#00BFFF"/>
  <circle cx="180" cy="145" r="7" fill="#4169E1"/>
  <circle cx="230" cy="160" r="7" fill="#4169E1"/>
  <circle cx="150" cy="170" r="7" fill="#7DD3FC"/>
  <line x1="70" y1="153" x2="120" y2="145" stroke="#ffffff33" stroke-width="1"/>
  <line x1="120" y1="145" x2="180" y2="145" stroke="#ffffff33" stroke-width="1"/>
  <line x1="180" y1="145" x2="230" y2="153" stroke="#ffffff33" stroke-width="1"/>
  <text x="70" y="178" fill="#7DD3FC" font-size="6" text-anchor="middle">LE</text>
  <text x="120" y="135" fill="#7DD3FC" font-size="6" text-anchor="middle">MC</text>
  <text x="150" y="90" fill="#00BFFF" font-size="6" text-anchor="middle">CA</text>
  <text x="180" y="135" fill="#7DD3FC" font-size="6" text-anchor="middle">MC</text>
  <text x="230" y="178" fill="#7DD3FC" font-size="6" text-anchor="middle">LD</text>`)

const SVG_AEREO = CAMPO_BASE(`
  <circle cx="100" cy="150" r="7" fill="#4169E1"/>
  <circle cx="200" cy="150" r="7" fill="#00BFFF"/>
  <circle cx="150" cy="90" r="7" fill="#4169E1"/>
  <ellipse cx="150" cy="60" rx="8" ry="8" fill="#FFD700" opacity="0.9"/>
  <path d="M150,68 Q150,80 150,83" stroke="#FFD700" stroke-width="2"/>
  <path d="M108,143 Q130,100 147,68" stroke="#4169E1" stroke-width="1.5" stroke-dasharray="3" fill="none"/>
  <path d="M193,143 Q170,100 153,68" stroke="#00BFFF" stroke-width="1.5" stroke-dasharray="3" fill="none"/>
  <text x="90" y="168" fill="#fff" font-size="7" text-anchor="middle">Cruzador</text>
  <text x="150" y="108" fill="#fff" font-size="7" text-anchor="middle">Cabeceiro</text>`)

const SVG_GOLEIRO = CAMPO_BASE(`
  <rect x="10" y="65" width="35" height="70" fill="#4169E133" rx="2"/>
  <circle cx="30" cy="100" r="9" fill="#FFD700"/>
  <circle cx="200" cy="80" r="6" fill="#4169E1"/>
  <circle cx="220" cy="115" r="6" fill="#4169E1"/>
  <circle cx="190" cy="120" r="5" fill="#FF6B6B" opacity="0.8"/>
  <path d="M196,118 Q100,105 39,98" stroke="#FF6B6B" stroke-width="2" stroke-dasharray="3" fill="none"/>
  <path d="M39,100 Q25,90 18,85" stroke="#FFD700" stroke-width="2" fill="none"/>
  <text x="30" y="118" fill="#fff" font-size="7" text-anchor="middle">GL</text>
  <text x="185" y="135" fill="#FF6B6B" font-size="7" text-anchor="middle">Bola</text>`)

const SVG_FISICO = CAMPO_BASE(`
  <rect x="40" y="80" width="220" height="10" fill="#4169E133" rx="5"/>
  <rect x="40" y="110" width="220" height="10" fill="#4169E133" rx="5"/>
  <circle cx="60" cy="85" r="7" fill="#4169E1"/>
  <circle cx="110" cy="115" r="7" fill="#00BFFF"/>
  <circle cx="160" cy="85" r="7" fill="#4169E1"/>
  <circle cx="210" cy="115" r="7" fill="#00BFFF"/>
  <path d="M67,85 L103,113" stroke="#FFD700" stroke-width="1.5" stroke-dasharray="3"/>
  <path d="M117,113 L153,85" stroke="#FFD700" stroke-width="1.5" stroke-dasharray="3"/>
  <path d="M167,85 L203,113" stroke="#FFD700" stroke-width="1.5" stroke-dasharray="3"/>
  <text x="150" y="145" fill="#7DD3FC" font-size="8" text-anchor="middle">Circuito de ativacao</text>`)

// ── Dados dos fundamentos ──────────────────────────────────────────────────
const FUNDAMENTOS: Fundamento[] = [
  {
    id: 'passe',
    label: 'Passe e Transicao',
    icon: 'ti-arrows-exchange',
    cor: '#4169E1',
    exercicios: [
      {
        id: 'passe-1',
        nome: 'Triangulo de Passe',
        descricao: 'Tres jogadores formam um triangulo. Jogador A passa para B, B para C, C para A. Apos o passe o jogador se move para outra posicao do triangulo.',
        metodologia: 'Enfatiza a qualidade do passe (pe correto, direcao, forca), comunicacao verbal e movimento apos o passe. O jogador que passa NUNCA fica parado.',
        categorias: ['Sub-9', 'Sub-11', 'Sub-13'],
        duracao: '15 min',
        jogadores: '3-6',
        diagrama: SVG_PASSE,
      },
      {
        id: 'passe-2',
        nome: 'Passe e Vai + Desmarcacao',
        descricao: 'Em grupo de 4, jogador passa e se desmarca em diagonal. Receptor controla, passa para o terceiro e repete o ciclo. Progressao: adicionar oposicao passiva.',
        metodologia: 'Trabalha passe em movimento, desmarcacao em profundidade e timing de recepcao. Fundamental a partir do Sub-11 para entender linhas de passe.',
        categorias: ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17'],
        duracao: '20 min',
        jogadores: '4-8',
        diagrama: SVG_PASSE,
      },
    ],
  },
  {
    id: 'chute',
    label: 'Chute e Finalizacao',
    icon: 'ti-circle-arrow-right',
    cor: '#FF6B6B',
    exercicios: [
      {
        id: 'chute-1',
        nome: 'Finalizacao Apos Conducao',
        descricao: 'Jogador conduz a bola da meia distancia e finaliza ao gol. Variacao: receber passe e finalizar de primeira ou com uma toque de controle.',
        metodologia: 'Foco no contato com a bola (pe cheio, bico, peito do pe), equilibrio no momento do chute e posicionamento do corpo. Para categorias menores usar gol menor.',
        categorias: ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13'],
        duracao: '20 min',
        jogadores: '4-10',
        diagrama: SVG_CHUTE,
      },
      {
        id: 'chute-2',
        nome: 'Finalizacao de Primeira',
        descricao: 'Jogador recebe cruzamento ou passe e finaliza de primeira. Variacao: finalizacao de volei, de cabeca, apos tabela.',
        metodologia: 'Tecnica avancada que exige timing, posicionamento de corpo e decisao rapida. Adequado a partir do Sub-13. Enfatizar que o erro faz parte do aprendizado.',
        categorias: ['Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'],
        duracao: '25 min',
        jogadores: '6-12',
        diagrama: SVG_CHUTE,
      },
    ],
  },
  {
    id: 'drible',
    label: 'Drible e Conducao',
    icon: 'ti-route',
    cor: '#FFD700',
    exercicios: [
      {
        id: 'drible-1',
        nome: 'Slalom com Cones',
        descricao: 'Conducao em zigue-zague entre cones espalhados em linha. Progressao: aumentar velocidade, alternar pes, adicionar finalizacao ao final.',
        metodologia: 'Base tecnica para controle de bola. Nas categorias menores (Sub-5/Sub-7) o foco e apenas tocar a bola e se divertir. Progressivamente aumentar exigencia tecnica.',
        categorias: ['Sub-5', 'Sub-7', 'Sub-9', 'Sub-11'],
        duracao: '15 min',
        jogadores: '4-16',
        diagrama: SVG_DRIBLE,
      },
      {
        id: 'drible-2',
        nome: '1x1 Direto',
        descricao: 'Dois jogadores em espaco delimitado. Um ataca, outro defende. Ganha ponto quem passar o adversario ou recuperar a bola. Trocar papeis a cada 30s.',
        metodologia: 'Desenvolve coragem, criatividade e leitura defensiva. Para Sub-5/Sub-7: espaco maior e sem pressao. Para Sub-13+: adicionar finalizacao e regras tatais.',
        categorias: ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15'],
        duracao: '20 min',
        jogadores: '2-20',
        diagrama: SVG_DRIBLE,
      },
    ],
  },
  {
    id: 'posicionamento',
    label: 'Posicionamento Tatico',
    icon: 'ti-layout-distribute-horizontal',
    cor: '#00BFFF',
    exercicios: [
      {
        id: 'pos-1',
        nome: 'Jogo de Posicao 4x4',
        descricao: 'Dois times de 4 em espaco delimitado. Time com bola tenta manter posse. Ponto a cada 5 passes consecutivos. Variacao: neutrals (jogadores extras sempre com o time que tem a bola).',
        metodologia: 'Fundamento do modelo de jogo moderno. Ensina triangulacao, largura, profundidade e cobertura. Introduzir a partir do Sub-11 com linguagem simples.',
        categorias: ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'],
        duracao: '25 min',
        jogadores: '8-12',
        diagrama: SVG_POSICIONAMENTO,
      },
      {
        id: 'pos-2',
        nome: 'Sombra Tatica',
        descricao: 'Equipe executa movimentacoes combinadas sem oposicao. Treinador guia as posicoes e transicoes. Depois reproduzir em jogo reduzido.',
        metodologia: 'Ferramenta de treinamento coletivo para fixar principios tatticos. Recomendado apenas a partir do Sub-15 quando a maturidade tatica permite assimilar.',
        categorias: ['Sub-15', 'Sub-17', 'Sub-20'],
        duracao: '30 min',
        jogadores: '10-15',
        diagrama: SVG_POSICIONAMENTO,
      },
    ],
  },
  {
    id: 'aereo',
    label: 'Jogo Aereo',
    icon: 'ti-arrow-up',
    cor: '#7DD3FC',
    exercicios: [
      {
        id: 'aereo-1',
        nome: 'Dominio de Bola Alta',
        descricao: 'Jogador recebe bola lançada pelo treinador e domina com peito, coxa ou pe. Progressao: dominar e passar de primeira, depois dominar e finalizar.',
        metodologia: 'Tecnica de recepcao de bola alta. Nas categorias menores (Sub-9/11) usar bolas mais leves e lancamentos mais baixos. Enfatizar amortecimento e controle.',
        categorias: ['Sub-9', 'Sub-11', 'Sub-13', 'Sub-15'],
        duracao: '15 min',
        jogadores: '4-12',
        diagrama: SVG_AEREO,
      },
      {
        id: 'aereo-2',
        nome: 'Cabecamento Ofensivo',
        descricao: 'Treinador cruza bola na area, jogadores disputam e tentam cabecear ao gol. Variacao: cabecamento de defesa (afastar) vs ataque (direcionar ao gol).',
        metodologia: 'Tecnicamente exigente e fisicamente sensitivo. Nao realizar cabecamento de bola pesada com jovens Sub-13 ou menores. Preferir bolas de espuma ate Sub-13.',
        categorias: ['Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'],
        duracao: '20 min',
        jogadores: '4-10',
        diagrama: SVG_AEREO,
      },
    ],
  },
  {
    id: 'goleiro',
    label: 'Treino de Goleiro',
    icon: 'ti-hand-stop',
    cor: '#4ADE80',
    exercicios: [
      {
        id: 'gol-1',
        nome: 'Defesas Anguladas',
        descricao: 'Goleiro parte do centro do gol, treinador finaliza de diferentes angulos. Goleiro trabalha posicionamento, saida do gol e defesa nas diversas regioes.',
        metodologia: 'Ensina reducao de angulo, posicionamento de maos e pe de apoio. Para categorias menores focar apenas em nao ter medo da bola e posicionar as maos corretamente.',
        categorias: ['Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'],
        duracao: '20 min',
        jogadores: '1-3',
        diagrama: SVG_GOLEIRO,
      },
    ],
  },
  {
    id: 'fisico',
    label: 'Fisico e Aquecimento',
    icon: 'ti-run',
    cor: '#FB923C',
    exercicios: [
      {
        id: 'fis-1',
        nome: 'Circuito de Ativacao com Bola',
        descricao: 'Estacoes com: conducao, passe na parede, dominio, chute a gol pequeno. Cada atleta passa por todas as estacoes em 2 minutos. Foco: ativacao neuromuscular com bola.',
        metodologia: 'Aquecimento especifico para futebol. Evitar aquecimento sem bola nas categorias de base — a bola deve estar sempre presente. Intensidade baixa a moderada.',
        categorias: ['Sub-5', 'Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20'],
        duracao: '15 min',
        jogadores: '4-20',
        diagrama: SVG_FISICO,
      },
      {
        id: 'fis-2',
        nome: 'Pega-Pega com Bola',
        descricao: 'Jogadores conduzem bola. Um pegador (sem bola) tenta tocar outro jogador. Quem for tocado vira pegador. Variacao: varios pegadores simultaneamente.',
        metodologia: 'Atividade ludica ideal para Sub-5 a Sub-9. Desenvolve conducao sob pressao, mudanca de direcao e percepcao espacial de forma divertida e sem instrucao tecnica excessiva.',
        categorias: ['Sub-5', 'Sub-7', 'Sub-9'],
        duracao: '10 min',
        jogadores: '6-20',
        diagrama: SVG_FISICO,
      },
    ],
  },
]

const CAT_CORES: Record<string, string> = {
  'Sub-5': '#FB923C', 'Sub-7': '#FBBF24', 'Sub-9': '#4ADE80',
  'Sub-11': '#00BFFF', 'Sub-13': '#4169E1', 'Sub-15': '#A78BFA',
  'Sub-17': '#F472B6', 'Sub-20': '#FF6B6B',
}

export default function TreinamentosPage() {
  const router = useRouter()
  const [filtro, setFiltro] = useState('todos')
  const [exercicioAberto, setExercicioAberto] = useState<string | null>(null)
  const [gerandoPlano, setGerandoPlano] = useState(false)
  const [plano, setPlano] = useState<string | null>(null)
  const [planoEstruturado, setPlanoEstruturado] = useState<any>(null)
  const [ideiaTreino, setIdeiaTreino] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria>('Sub-11')
  const [exercicioEditando, setExercicioEditando] = useState<string | null>(null)

  const fundamentosFiltrados = filtro === 'todos'
    ? FUNDAMENTOS
    : FUNDAMENTOS.filter(f => f.id === filtro)

  async function gerarPlanoIA() {
    setGerandoPlano(true)
    setPlano(null)
    setPlanoEstruturado(null)
    try {
      const res = await fetch('/api/treino-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: categoriaSelecionada, ideia: ideiaTreino.trim() }),
      })
      const data = await res.json()
      if (data.tipo === 'estruturado' && typeof data.plano === 'object') {
        setPlanoEstruturado(data.plano)
      } else {
        setPlano(typeof data.plano === 'string' ? data.plano : JSON.stringify(data.plano, null, 2))
      }
    } catch {
      setPlano('Erro ao gerar plano. Tente novamente.')
    }
    setGerandoPlano(false)
  }

  return (
    <>
    {exercicioEditando && <EditorDiagrama exercicioId={exercicioEditando} onFechar={() => setExercicioEditando(null)} />}
    <div style={{ minHeight: '100vh', background: NAVY, paddingBottom: 88, fontFamily: 'Inter, sans-serif', color: OFF }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A3FA8 0%, #4169E1 100%)', padding: '16px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: OFF }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
          <div>
            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 18, color: OFF, textTransform: 'uppercase', letterSpacing: 1 }}>Treinamentos</div>
            <div style={{ fontSize: 12, color: SKY }}>Biblioteca metodologica + IA</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Gerador de Plano IA */}
        <div style={{ background: 'linear-gradient(135deg, rgba(65,105,225,0.15) 0%, rgba(0,191,255,0.1) 100%)', border: '1px solid rgba(0,191,255,0.3)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <i className="ti ti-brain" style={{ fontSize: 18, color: CYAN }} />
            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, color: OFF, textTransform: 'uppercase', letterSpacing: 0.5 }}>Plano de Treino IA</div>
          </div>
          <div style={{ fontSize: 12, color: SKY, marginBottom: 12 }}>Selecione a categoria e gere um plano de treino completo com IA</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <select
              value={categoriaSelecionada}
              onChange={e => setCategoriaSelecionada(e.target.value as Categoria)}
              style={{ background: 'rgba(65,105,225,0.2)', border: '1px solid rgba(65,105,225,0.4)', borderRadius: 8, padding: '8px 12px', color: OFF, fontSize: 13, cursor: 'pointer' }}
            >
              {(['Sub-5','Sub-7','Sub-9','Sub-11','Sub-13','Sub-15','Sub-17','Sub-20'] as Categoria[]).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <textarea
            value={ideiaTreino}
            onChange={e => setIdeiaTreino(e.target.value)}
            placeholder="Descreva a ideia do treino (opcional)... Ex: Foco em pressão alta e transição rápida, trabalhar saída de bola pelo goleiro"
            rows={3}
            style={{ width: '100%', background: 'rgba(65,105,225,0.08)', border: '1px solid rgba(65,105,225,0.3)', borderRadius: 10, padding: '10px 12px', color: OFF, fontSize: 13, resize: 'none', marginBottom: 10, fontFamily: 'Inter, sans-serif', lineHeight: 1.5, boxSizing: 'border-box' }}
          />
          <button
            onClick={gerarPlanoIA}
            disabled={gerandoPlano}
            style={{ width: '100%', background: gerandoPlano ? 'rgba(65,105,225,0.3)' : BLUE, border: 'none', borderRadius: 8, padding: '10px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: gerandoPlano ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <i className="ti ti-sparkles" style={{ fontSize: 14 }} />
            {gerandoPlano ? 'Gerando plano...' : 'Gerar Plano com IA'}
          </button>
          {plano && (
            <div style={{ marginTop: 14, background: 'rgba(10,14,26,0.6)', borderRadius: 10, padding: 14, fontSize: 13, color: OFF, lineHeight: 1.7, whiteSpace: 'pre-wrap', border: '1px solid rgba(65,105,225,0.2)' }}>
              {plano}
            </div>
          )}

          {planoEstruturado && (
            <div style={{ marginTop: 14 }}>
              <div style={{ background: 'rgba(10,14,26,0.8)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: '1px solid rgba(0,191,255,0.3)' }}>
                <div style={{ fontSize: 11, color: CYAN, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Plano — {planoEstruturado.categoria}</div>
                <div style={{ fontSize: 12, color: SKY, marginTop: 2 }}>{planoEstruturado.contexto}</div>
              </div>
              {(planoEstruturado.fases || []).map((fase: any) => (
                <div key={fase.id} style={{ background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(65,105,225,0.2)', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
                  {fase.diagrama && <DiagramaFase dados={fase.diagrama} />}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: CYAN, background: 'rgba(0,191,255,0.15)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{fase.tempo}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: OFF, fontFamily: SYNE, textTransform: 'uppercase' }}>{fase.nome}</span>
                    </div>
                    {fase.subtitulo && <div style={{ fontSize: 12, color: SKY, marginBottom: 8, fontStyle: 'italic' }}>"{fase.subtitulo}"</div>}
                    <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.8)', lineHeight: 1.6, marginBottom: 10 }}>{fase.descricao}</div>
                    {fase.dica && (
                      <div style={{ background: 'rgba(65,105,225,0.1)', border: '1px solid rgba(65,105,225,0.25)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: SKY }}>
                        <span style={{ fontWeight: 700, color: CYAN }}>💡 Dica: </span>{fase.dica}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {planoEstruturado.objetivos?.length > 0 && (
                <div style={{ background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(65,105,225,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: CYAN, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Objetivos do Treino</div>
                  {planoEstruturado.objetivos.map((o: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: OFF, marginBottom: 4 }}>• {o}</div>
                  ))}
                </div>
              )}
              {planoEstruturado.pontos_atencao?.length > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>⚠️ Pontos de Atenção</div>
                  {planoEstruturado.pontos_atencao.map((p: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: OFF, marginBottom: 4 }}>• {p}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filtros por fundamento */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
          {[{ id: 'todos', label: 'Todos', icon: 'ti-apps' }, ...FUNDAMENTOS.map(f => ({ id: f.id, label: f.label.split(' ')[0], icon: f.icon }))].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              style={{ flexShrink: 0, background: filtro === f.id ? BLUE : CARD, border: filtro === f.id ? 'none' : BORDER, borderRadius: 20, padding: '6px 14px', color: filtro === f.id ? '#fff' : SKY, fontSize: 11, fontWeight: filtro === f.id ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: SYNE, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              <i className={'ti ' + f.icon} style={{ fontSize: 13 }} />
              {f.label}
            </button>
          ))}
        </div>

        {/* Fundamentos e Exercicios */}
        {fundamentosFiltrados.map(fund => (
          <div key={fund.id} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 20, background: fund.cor, borderRadius: 2 }} />
              <i className={'ti ' + fund.icon} style={{ fontSize: 16, color: fund.cor }} />
              <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, color: OFF, textTransform: 'uppercase', letterSpacing: 0.5 }}>{fund.label}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fund.exercicios.map(ex => (
                <div key={ex.id} style={{ background: CARD, border: BORDER, borderRadius: 14, overflow: 'hidden' }}>

                  {/* Diagrama SVG + Editor */}
                  <div style={{ position: 'relative' }}>
                    <div dangerouslySetInnerHTML={{ __html: ex.diagrama }} style={{ width: '100%' }} />
                    <button onClick={() => setExercicioEditando(ex.id)}
                      style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(65,105,225,0.9)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      ✏️ Editar
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 14px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: OFF, fontFamily: SYNE }}>{ex.nome}</div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: SKY, background: 'rgba(65,105,225,0.15)', padding: '2px 8px', borderRadius: 10 }}>
                          <i className="ti ti-clock" style={{ fontSize: 9, marginRight: 3 }} />{ex.duracao}
                        </span>
                        <span style={{ fontSize: 10, color: SKY, background: 'rgba(65,105,225,0.15)', padding: '2px 8px', borderRadius: 10 }}>
                          <i className="ti ti-users" style={{ fontSize: 9, marginRight: 3 }} />{ex.jogadores}
                        </span>
                      </div>
                    </div>

                    {/* Categorias sugeridas */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {ex.categorias.map(c => (
                        <span key={c} style={{ fontSize: 9, fontWeight: 700, color: CAT_CORES[c], background: CAT_CORES[c] + '22', padding: '2px 8px', borderRadius: 10, fontFamily: SYNE }}>
                          {c}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.75)', lineHeight: 1.6, marginBottom: 10 }}>{ex.descricao}</div>

                    <button
                      onClick={() => setExercicioAberto(exercicioAberto === ex.id ? null : ex.id)}
                      style={{ background: 'none', border: 'none', color: CYAN, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 14px', fontWeight: 600 }}
                    >
                      <i className={'ti ' + (exercicioAberto === ex.id ? 'ti-chevron-up' : 'ti-chevron-down')} style={{ fontSize: 13 }} />
                      {exercicioAberto === ex.id ? 'Menos detalhes' : 'Ver metodologia'}
                    </button>

                    {exercicioAberto === ex.id && (
                      <div style={{ borderTop: BORDER, paddingTop: 12, paddingBottom: 14 }}>
                        <div style={{ fontSize: 11, color: CYAN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 700 }}>Orientacao Metodologica</div>
                        <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.8)', lineHeight: 1.7 }}>{ex.metodologia}</div>
                        {ex.videoUrl && (
                          <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 8, padding: '6px 14px', color: '#FF6B6B', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            <i className="ti ti-brand-youtube" style={{ fontSize: 14 }} />
                            Ver video
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}
