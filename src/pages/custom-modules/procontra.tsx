import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  ArrowLeft, CheckCircle2, Award, XCircle,
  Building2, Users, MapPin, ThumbsUp, ThumbsDown,
  Eye, EyeOff, Quote, BookOpen, ChevronDown, ChevronUp, X,
  RotateCcw, Sparkles, ArrowRight, Clock, Building, ExternalLink, Glasses
} from 'lucide-react'

// ===========================================
// TYPEN
// ===========================================

type SlideType = 'info' | 'quiz' | 'truefalse' | 'quote_reveal' | 'term_reveal' | 'definition_match' | 'flipcard' | 'swipe_cards' | 'timeline'

interface BaseSlide {
  type: SlideType
  title: string
}

interface InfoSlide extends BaseSlide {
  type: 'info'
  content: string
  highlight?: string
}

interface QuizSlide extends BaseSlide {
  type: 'quiz'
  question: string
  options: { text: string; correct: boolean }[]
  explanation: string
  points: number
}

interface TrueFalseSlide extends BaseSlide {
  type: 'truefalse'
  statements: { text: string; correct: boolean; explanation: string }[]
  points: number
}

interface QuoteRevealSlide extends BaseSlide {
  type: 'quote_reveal'
  instruction: string
  quotes: { author: string; role: string; quote: string; key_point: string }[]
  points: number
}

interface TermRevealSlide extends BaseSlide {
  type: 'term_reveal'
  instruction: string
  terms: { term: string; definition: string; example?: string }[]
  points: number
}

interface DefinitionMatchSlide extends BaseSlide {
  type: 'definition_match'
  instruction: string
  pairs: { term: string; definition: string }[]
  points: number
}

// NEU: Flipcard (3D Dialogkarten)
interface FlipCardSlide extends BaseSlide {
  type: 'flipcard'
  instruction: string
  cards: { front: string; back: string; emoji?: string }[]
  points: number
}

// NEU: Swipe Cards (PRO/CONTRA wischen)
interface SwipeCardsSlide extends BaseSlide {
  type: 'swipe_cards'
  instruction: string
  cards: { statement: string; correct: 'PRO' | 'CONTRA' }[]
  points: number
}

// NEU: Timeline
interface TimelineSlide extends BaseSlide {
  type: 'timeline'
  instruction: string
  events: { year: string; event: string; detail: string }[]
  points: number
}

type Slide = InfoSlide | QuizSlide | TrueFalseSlide | QuoteRevealSlide | TermRevealSlide | DefinitionMatchSlide | FlipCardSlide | SwipeCardsSlide | TimelineSlide

interface Section {
  id: string
  title: string
  shortTitle: string
  icon: string
  colorClass: string
  bgColor: string
  intro: string
  videoUrl: string
  videoTitle: string
  slides: Slide[]
  totalPoints: number
}

// ===========================================
// 4 AKTEURE MIT INHALTEN (erweitert)
// ===========================================

const SECTIONS: Section[] = [
  // 1. BUNDESRAT
  {
    id: 'bundesrat',
    title: 'Position Bundesrat',
    shortTitle: 'Bundesrat',
    icon: 'Building2',
    colorClass: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500',
    intro: 'Der Bundesrat unter Führung von Finanzministerin Karin Keller-Sutter befürwortet die Individualbesteuerung. Er sieht darin eine Chance, die sogenannte "Heiratsstrafe" abzuschaffen und Erwerbsanreize zu schaffen.',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:77a83d61-aeb0-4984-8e7b-37291a89b62c&startTime=12',
    videoTitle: 'Bundesrat präsentiert Position',
    totalPoints: 55,
    slides: [
      // NEU: 3D Flipcards
      {
        type: 'flipcard',
        title: '🎴 Dialogkarten',
        instruction: 'Klicken Sie auf die Karten, um sie umzudrehen:',
        cards: [
          { front: 'Was ist die Heiratsstrafe?', back: 'Die steuerliche Mehrbelastung von Ehepaaren gegenüber Konkubinatspaaren mit gleichem Einkommen.', emoji: '💍' },
          { front: 'Wie viele neue Stellen erwartet der Bund?', back: 'Bis zu 44\'000 neue Vollzeitstellen, weil sich Mehrarbeit mehr lohnt.', emoji: '👩‍💼' },
          { front: 'Wer profitiert am meisten?', back: 'Doppelverdiener-Ehepaare, bei denen beide ähnlich viel verdienen.', emoji: '👫' }
        ],
        points: 15
      },
      {
        type: 'term_reveal',
        title: 'Schlüsselbegriffe',
        instruction: 'Klicken Sie auf die Begriffe:',
        terms: [
          { term: 'Heiratsstrafe', definition: 'Steuerliche Mehrbelastung von Ehepaaren.', example: 'Ein Ehepaar zahlt mehr als ein Konkubinatspaar.' },
          { term: 'Individualbesteuerung', definition: 'Jede Person wird einzeln besteuert.', example: 'Ehepaare füllen getrennte Steuererklärungen aus.' },
          { term: 'Steuerprogression', definition: 'Höheres Einkommen = höherer Steuersatz.', example: '140\'000 zusammen wird höher besteuert als 2x 70\'000.' }
        ],
        points: 10
      },
      {
        type: 'quiz',
        title: 'Verständnisfrage',
        question: 'Welchen positiven Nebeneffekt erwartet der Bund?',
        options: [
          { text: 'Höhere Steuereinnahmen', correct: false },
          { text: 'Bis zu 44\'000 neue Vollzeitstellen', correct: true },
          { text: 'Weniger Bürokratie', correct: false },
          { text: 'Tiefere Mieten', correct: false }
        ],
        explanation: 'Der Bund rechnet damit, dass v.a. Ehefrauen mehr arbeiten würden.',
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statements: [
          { text: 'Der Bundesrat ist gegen die Individualbesteuerung.', correct: false, explanation: 'Falsch! Der Bundesrat befürwortet die Reform.' },
          { text: 'Ehepaare würden weiterhin gemeinsam besteuert.', correct: false, explanation: 'Falsch! Jeder füllt eine eigene Steuererklärung aus.' }
        ],
        points: 10
      },
      // NEU: Swipe Cards
      {
        type: 'swipe_cards',
        title: '👈 PRO oder CONTRA? 👉',
        instruction: 'Ordnen Sie die Aussagen der richtigen Seite zu:',
        cards: [
          { statement: 'Schafft Erwerbsanreize', correct: 'PRO' },
          { statement: 'Bedeutet mehr Bürokratie', correct: 'CONTRA' },
          { statement: 'Beseitigt Ungleichbehandlung', correct: 'PRO' }
        ],
        points: 10
      }
    ]
  },

  // 2. KOMITEE BEFÜRWORTER:INNEN
  {
    id: 'befuerworter',
    title: 'Komitee Befürworter:innen',
    shortTitle: 'Befürworter:innen',
    icon: 'ThumbsUp',
    colorClass: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500',
    intro: 'Ein breites Komitee unterstützt die Individualbesteuerung als Schritt zur Gleichstellung.',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:234b56bb-fbf4-4a3c-a13b-7c04ea154f4f',
    videoTitle: 'Befürworter:innen präsentieren Argumente',
    totalPoints: 45,
    slides: [
      // NEU: Timeline
      {
        type: 'timeline',
        title: '📅 Zeitstrahl: Weg zur Abstimmung',
        instruction: 'Entdecken Sie die wichtigsten Meilensteine:',
        events: [
          { year: '1984', event: 'Bundesgerichtsentscheid', detail: 'Das Bundesgericht erklärt die gemeinsame Besteuerung von Ehepaaren für verfassungswidrig.' },
          { year: '2016', event: 'CVP-Initiative abgelehnt', detail: 'Volk lehnt Initiative ab – Bundesrat hatte mit falschen Zahlen informiert.' },
          { year: '2024', event: 'Parlament beschliesst Reform', detail: 'National- und Ständerat stimmen der Individualbesteuerung zu.' },
          { year: '2026', event: 'Volksabstimmung', detail: 'Am 8. März 2026 entscheidet das Volk.' }
        ],
        points: 15
      },
      {
        type: 'term_reveal',
        title: 'Argumente PRO',
        instruction: 'Klicken Sie, um die Argumente aufzudecken:',
        terms: [
          { term: 'Gleichbehandlung', definition: 'Alle Paare werden gleich besteuert, egal ob verheiratet.', example: 'Konkubinat = Ehe bei den Steuern.' },
          { term: 'Erwerbsanreiz', definition: 'Zweitverdienende behalten mehr vom Lohn.', example: 'Lohnt sich wieder, mehr zu arbeiten.' },
          { term: 'Fachkräftemangel', definition: 'Mehr Arbeitskräfte durch höhere Erwerbsbeteiligung.', example: '44\'000 neue Vollzeitstellen möglich.' }
        ],
        points: 15
      },
      {
        type: 'quiz',
        title: 'Verständnisfrage',
        question: 'Wer profitiert laut Befürworter:innen am meisten?',
        options: [
          { text: 'Einverdiener-Ehepaare', correct: false },
          { text: 'Unverheiratete Singles', correct: false },
          { text: 'Doppelverdiener-Ehepaare', correct: true },
          { text: 'Rentner:innen', correct: false }
        ],
        explanation: 'Die Mehrbelastung durch gemeinsame Veranlagung fällt weg.',
        points: 15
      }
    ]
  },

  // 3. KOMITEE GEGNER:INNEN
  {
    id: 'gegner',
    title: 'Komitee Gegner:innen',
    shortTitle: 'Gegner:innen',
    icon: 'ThumbsDown',
    colorClass: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500',
    intro: 'SVP, EVP, EDU und Mitte haben das Referendum ergriffen. Sie warnen vor Mehraufwand und neuen Ungerechtigkeiten.',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:76af4420-abff-4a34-8aab-9941193b223e',
    videoTitle: 'Kontra-Komitee präsentiert Argumente',
    totalPoints: 60,
    slides: [
      {
        type: 'quote_reveal',
        title: 'Aussagen des Nein-Komitees',
        instruction: 'Klicken Sie, um die Kritikpunkte aufzudecken:',
        quotes: [
          { author: 'Nein-Komitee', role: 'SVP, EVP, EDU, Mitte', quote: 'Begünstigt werden v.a. Doppelverdiener mit hohen Einkommen. Belastet werden Einverdiener-Familien.', key_point: 'Reiche profitieren' },
          { author: 'Nein-Komitee', role: 'SVP, EVP, EDU, Mitte', quote: 'Zwei Steuererklärungen bedeuten erheblichen Mehraufwand für Ehepaare und Behörden.', key_point: 'Mehr Bürokratie' },
          { author: 'Nein-Komitee', role: 'SVP, EVP, EDU, Mitte', quote: 'Die Frauen würden ganz leicht mehr arbeiten. Das wäre nur ein Tropfen auf den heissen Stein.', key_point: 'Kaum Wirkung' }
        ],
        points: 10
      },
      // NEU: 3D Flipcards für Gegner
      {
        type: 'flipcard',
        title: '🎴 Kritikpunkte entdecken',
        instruction: 'Drehen Sie die Karten um:',
        cards: [
          { front: 'Wer verliert bei der Reform?', back: 'Einverdiener-Familien und Paare mit ungleichem Einkommen haben keinen Vorteil.', emoji: '👨‍👩‍👧' },
          { front: 'Wie hoch sind die Steuerausfälle?', back: '630 Millionen Franken pro Jahr allein bei der direkten Bundessteuer.', emoji: '💸' },
          { front: 'Was sagen die Gegner zum Fachkräftemangel?', back: '"Nur ein Tropfen auf den heissen Stein" - jährlich wandern 80\'000 Personen ein.', emoji: '💧' }
        ],
        points: 15
      },
      {
        type: 'definition_match',
        title: 'Pro oder Contra?',
        instruction: 'Ordnen Sie die Argumente zu:',
        pairs: [
          { term: 'Beseitigung der Heiratsstrafe', definition: 'PRO' },
          { term: 'Erheblicher Mehraufwand', definition: 'CONTRA' },
          { term: 'Erwerbsanreiz für Frauen', definition: 'PRO' },
          { term: 'Bevorzugt Gutverdienende', definition: 'CONTRA' },
          { term: 'Gleichbehandlung aller Paare', definition: 'PRO' },
          { term: 'Nur ein Tropfen auf den heissen Stein', definition: 'CONTRA' }
        ],
        points: 10
      },
      // NEU: Swipe Cards
      {
        type: 'swipe_cards',
        title: '👈 PRO oder CONTRA? 👉',
        instruction: 'Ordnen Sie die Aussagen der richtigen Seite zu:',
        cards: [
          { statement: '630 Mio. Fr. Steuerausfälle', correct: 'CONTRA' },
          { statement: 'Gleichstellung von Mann und Frau', correct: 'PRO' },
          { statement: 'Zwei Steuererklärungen = mehr Arbeit', correct: 'CONTRA' },
          { statement: 'Mehr Lohn bleibt übrig', correct: 'PRO' }
        ],
        points: 15
      },
      {
        type: 'quiz',
        title: 'Abschlussfrage',
        question: 'Welche Partei gehört NICHT zum Nein-Komitee?',
        options: [
          { text: 'SVP', correct: false },
          { text: 'SP', correct: true },
          { text: 'EVP', correct: false },
          { text: 'Mitte', correct: false }
        ],
        explanation: 'Die SP unterstützt die Vorlage.',
        points: 10
      }
    ]
  },

  // 4. KANTONE
  {
    id: 'kantone',
    title: 'Kantone (Kantonsreferendum)',
    shortTitle: 'Kantone',
    icon: 'MapPin',
    colorClass: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500',
    intro: 'Die Kantone haben das Referendum ergriffen wegen befürchteter Steuerausfälle und Umsetzungsaufwand.',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:d3ff0b15-3323-484e-ad97-bde7e23efc52&startTime=455',
    videoTitle: 'Kantone erklären ihre Position',
    totalPoints: 50,
    slides: [
      {
        type: 'info',
        title: 'Was ist ein Kantonsreferendum?',
        content: 'Wenn mindestens 8 Kantone es verlangen, kommt ein Bundesgesetz vors Volk. Die Kantone haben dieses seltene Instrument genutzt.',
        highlight: 'Das Kantonsreferendum zeigt, wie stark die Kantone die Reform ablehnen.'
      },
      // NEU: 3D Flipcards
      {
        type: 'flipcard',
        title: '🎴 Fakten zu den Kantonen',
        instruction: 'Drehen Sie die Karten:',
        cards: [
          { front: 'Wie viele Kantone braucht es für ein Referendum?', back: 'Mindestens 8 Kantone müssen das Referendum verlangen.', emoji: '🗳️' },
          { front: 'Wie hoch sind die Steuerausfälle?', back: '630 Mio. Fr. beim Bund, plus Ausfälle bei Kantonen und Gemeinden.', emoji: '📉' },
          { front: 'Was befürchten die Kantone?', back: 'Hohen Umsetzungsaufwand: neue Software, Formulare, Schulungen.', emoji: '⚙️' }
        ],
        points: 15
      },
      {
        type: 'term_reveal',
        title: 'Bedenken der Kantone',
        instruction: 'Klicken Sie, um mehr zu erfahren:',
        terms: [
          { term: 'Steuerausfälle', definition: '630 Mio. Fr. weniger beim Bund pro Jahr.', example: 'Plus Ausfälle bei Kantons- und Gemeindesteuern.' },
          { term: 'Umsetzungsaufwand', definition: 'Steuerverwaltungen müssen komplett umgestellt werden.', example: 'Neue Software, Formulare, Schulungen.' },
          { term: 'Föderalismus', definition: '26 Kantone mit eigenen Steuergesetzen.', example: 'Umsetzung wäre überall unterschiedlich.' }
        ],
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statements: [
          { text: 'Für ein Kantonsreferendum braucht es mindestens 8 Kantone.', correct: true, explanation: 'Richtig!' },
          { text: 'Die Kantone befürworten die Individualbesteuerung.', correct: false, explanation: 'Falsch! Sie haben das Referendum dagegen ergriffen.' }
        ],
        points: 10
      },
      // NEU: Timeline
      {
        type: 'timeline',
        title: '📅 Wie kam es zum Kantonsreferendum?',
        instruction: 'Die wichtigsten Schritte:',
        events: [
          { year: 'Herbst 2024', event: 'Parlament beschliesst Gesetz', detail: 'National- und Ständerat stimmen der Reform zu.' },
          { year: 'Winter 2024', event: 'Kantonsparlamente beschliessen Referendum', detail: 'Mehr als 8 Kantonsparlamente beschliessen, das Referendum zu ergreifen.' },
          { year: 'Frühling 2025', event: 'Referendum kommt zustande', detail: 'Das Volk wird über das Gesetz abstimmen.' },
          { year: '8. März 2026', event: 'Volksabstimmung', detail: 'Das Schweizer Volk entscheidet.' }
        ],
        points: 15
      }
    ]
  },

  // 5. STÄDTE
  {
    id: 'staedte',
    title: 'Städte (Städteverband)',
    shortTitle: 'Städte',
    icon: 'Building',
    colorClass: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500',
    intro: 'Anders als die Kantone begrüssen die Städte die Individualbesteuerung. Die Konferenz der städtischen Finanzdirektoren sieht darin eine Vereinfachung des Steuersystems: Keine Sonderregeln mehr für Ehepaare, keine Systemwechsel bei Heirat oder Scheidung. Grosse Steuerämter rechnen vor, dass der Prüfaufwand langfristig sinken wird.',
    videoUrl: '',
    videoTitle: '',
    totalPoints: 40,
    slides: [
      {
        type: 'info',
        title: 'Position des Städteverbands',
        content: 'Während die Kantone von einem «Bürokratiemonster» sprechen, argumentieren die Städte genau umgekehrt: Heute existieren zwei parallele Steuersysteme – eines für Ledige, eines für Verheiratete. Bei Heirat, Scheidung oder Tod wechselt man zwischen diesen Systemen, was erheblichen Aufwand verursacht. Das Kreisschreiben der Eidgenössischen Steuerverwaltung zur Ehepaarbesteuerung umfasst über 40 Seiten mit Sonderbestimmungen! Ein einheitliches System würde diese Wechselfälle dauerhaft beseitigen.',
        highlight: '🔗 Mehr erfahren: staedteverband.ch/1543/de/die-stadte-begrussen-die-individualbesteuerung'
      },
      {
        type: 'flipcard',
        title: '🎴 Argumente der Städte',
        instruction: 'Drehen Sie die Karten:',
        cards: [
          { front: 'Warum wird es einfacher?', back: 'Keine Sonderregeln mehr für Ehepaare: Ein einheitliches System für alle, unabhängig vom Zivilstand. Das Steuersystem bleibt für jede Person durchgehend gleich.', emoji: '📋' },
          { front: 'Was passiert heute bei Heirat/Scheidung?', back: 'Systemwechsel: Von Einzelveranlagung zur gemeinsamen Veranlagung und zurück. Vermögen müssen aufgeteilt werden, neue Tarife gelten – das verursacht Mehraufwand.', emoji: '💍' },
          { front: 'Wie funktioniert die Zuordnung?', back: 'Die Regeln sind klar: Einkommen wird der Person zugerechnet, die es erzielt. Vermögen gehört dem Eigentümer. Mit Digitalisierung kann die Mehrarbeit aufgefangen werden.', emoji: '🏙️' }
        ],
        points: 15
      },
      {
        type: 'term_reveal',
        title: 'Kernargumente im Detail',
        instruction: 'Klicken Sie, um mehr zu erfahren:',
        terms: [
          { term: 'Heiratsstrafe auch kantonal', definition: 'Die Kantone behaupten, die Heiratsstrafe sei nur ein Problem des Bundes.', example: 'Falsch! Auch in vielen Kantonen zahlen Doppelverdiener-Ehepaare mehr als Konkubinatspaare.' },
          { term: 'Klare Zuordnung', definition: 'Jede Person deklariert ihr eigenes Einkommen und Vermögen.', example: 'Lohn, Renten, Dividenden: Wer verdient es, dem gehört es. Immobilien, Konti: Nach Eigentum.' },
          { term: 'Langfristige Entlastung', definition: 'Im ersten Jahr ist Koordinationsaufwand nötig.', example: 'Danach sinkt der Prüfaufwand – maschinelle Veranlagung macht es möglich.' }
        ],
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statements: [
          { text: 'Die Städte lehnen die Individualbesteuerung ab, genau wie die Kantone.', correct: false, explanation: 'Falsch! Die Städte begrüssen die Reform und sehen sie als Vereinfachung.' },
          { text: 'Das Kreisschreiben zur Ehepaarbesteuerung umfasst über 40 Seiten.', correct: true, explanation: 'Richtig! Die vielen Sonderbestimmungen für Ehepaare zeigen die Komplexität des heutigen Systems.' },
          { text: 'Mit der Individualbesteuerung würden ca. 1,7 Mio. zusätzliche Steuerdossiers entstehen.', correct: true, explanation: 'Richtig! Aber die Städte argumentieren, dass die Digitalisierung und der Wegfall von Systemwechseln dies kompensieren.' }
        ],
        points: 15
      }
    ]
  }
]

// ===========================================
// ICON MAP
// ===========================================
const IconMap: { [key: string]: any } = { Building2, Users, MapPin, ThumbsUp, ThumbsDown, Building }

// ===========================================
// CSS für 3D Flip Animation (wird inline eingefügt)
// ===========================================
const flipCardStyles = `
  .flip-card {
    perspective: 1000px;
    cursor: pointer;
  }
  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  .flip-card.flipped .flip-card-inner {
    transform: rotateY(180deg);
  }
  .flip-card-front, .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;
  }
  .flip-card-front {
    background: linear-gradient(135deg, #0d9488, #06b6d4);
    color: white;
  }
  .flip-card-back {
    background: white;
    border: 2px solid #0d9488;
    color: #374151;
    transform: rotateY(180deg);
  }
  .swipe-card {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .swipe-card.swiping-left {
    transform: translateX(-100px) rotate(-10deg);
    opacity: 0;
  }
  .swipe-card.swiping-right {
    transform: translateX(100px) rotate(10deg);
    opacity: 0;
  }
  @keyframes pointsPopup {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
  .points-popup {
    animation: pointsPopup 0.5s ease-out;
  }
  @keyframes confetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-50px) rotate(360deg); opacity: 0; }
  }
  .confetti {
    animation: confetti 1s ease-out forwards;
  }
`

// ===========================================
// NEU: 3D FLIPCARD KOMPONENTE
// ===========================================
function FlipCardAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: FlipCardSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [hasCompleted, setHasCompleted] = useState(false)
  
  const allFlipped = flipped.size === slide.cards.length

  // Only complete when ALL cards are flipped
  useEffect(() => {
    if (allFlipped && !isCompleted && !hasCompleted) {
      setHasCompleted(true)
      // Small delay to show the visual feedback
      setTimeout(() => onComplete(), 300)
    }
  }, [allFlipped, isCompleted, hasCompleted, onComplete])

  const handleFlip = (index: number) => {
    if (!flipped.has(index)) {
      const newFlipped = new Set(flipped)
      newFlipped.add(index)
      setFlipped(newFlipped)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎴</span>
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {(isCompleted || (allFlipped && hasCompleted)) && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 points-popup">
              <Sparkles className="h-3 w-3" /> +{slide.points}P
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-600 text-sm mb-4">{slide.instruction}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {slide.cards.map((card, index) => (
              <div 
                key={index}
                onClick={() => handleFlip(index)}
                className={`flip-card h-40 ${flipped.has(index) ? 'flipped' : ''}`}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    {card.emoji && <span className="text-4xl mb-2">{card.emoji}</span>}
                    <p className="font-medium text-sm">{card.front}</p>
                    <p className="text-sm mt-2 opacity-75">Klicken zum Umdrehen</p>
                  </div>
                  <div className="flip-card-back">
                    <p className="text-sm">{card.back}</p>
                    <CheckCircle2 className="h-5 w-5 text-teal-500 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!allFlipped && !isCompleted && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Noch {slide.cards.length - flipped.size} Karte(n) umdrehen
            </p>
          )}
          {allFlipped && !isCompleted && !hasCompleted && (
            <p className="text-center text-sm text-green-600 mt-4 font-semibold">
              ✓ Alle Karten aufgedeckt!
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ===========================================
// NEU: SWIPE CARDS KOMPONENTE
// ===========================================
function SwipeCardsAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: SwipeCardsSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: 'PRO' | 'CONTRA' | null }>({})
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  const allAnswered = Object.keys(answers).length === slide.cards.length

  useEffect(() => {
    if (allAnswered && !isCompleted) {
      setTimeout(() => onComplete(), 500)
    }
  }, [allAnswered, isCompleted, onComplete])

  const handleSwipe = (direction: 'PRO' | 'CONTRA') => {
    const card = slide.cards[currentIndex]
    const isCorrect = card.correct === direction
    
    setSwipeDirection(direction === 'PRO' ? 'swiping-right' : 'swiping-left')
    setAnswers({ ...answers, [currentIndex]: direction })
    if (isCorrect) setScore(score + 1)
    
    setTimeout(() => {
      setSwipeDirection(null)
      if (currentIndex < slide.cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }, 300)
  }

  const currentCard = slide.cards[currentIndex]
  const isLast = currentIndex >= slide.cards.length - 1 && answers[currentIndex] !== undefined

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👆</span>
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 points-popup">
              <Sparkles className="h-3 w-3" /> +{slide.points}P
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-600 text-sm mb-4">{slide.instruction}</p>
          
          {!isLast ? (
            <>
              {/* Swipe Card */}
              <div className={`swipe-card bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center mb-4 border-2 border-slate-200 ${swipeDirection || ''}`}>
                <p className="text-lg font-medium text-gray-800">{currentCard?.statement}</p>
                <p className="text-sm text-gray-500 mt-2">Karte {currentIndex + 1} von {slide.cards.length}</p>
              </div>
              
              {/* Swipe Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => handleSwipe('CONTRA')}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-transform"
                >
                  <ThumbsDown className="h-5 w-5" /> CONTRA
                </button>
                <button 
                  onClick={() => handleSwipe('PRO')}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-transform"
                >
                  PRO <ThumbsUp className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            /* Ergebnis */
            <div className="text-center py-4">
              <div className="text-4xl mb-2">{score === slide.cards.length ? '🎉' : '👍'}</div>
              <p className="text-lg font-bold text-gray-900">
                {score} von {slide.cards.length} richtig!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {score === slide.cards.length ? 'Perfekt!' : 'Gut gemacht!'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===========================================
// NEU: TIMELINE KOMPONENTE
// ===========================================
function TimelineAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: TimelineSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const allRevealed = revealed.size === slide.events.length

  useEffect(() => {
    if (allRevealed && !isCompleted) {
      onComplete()
    }
  }, [allRevealed, isCompleted, onComplete])

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 points-popup">
              <Sparkles className="h-3 w-3" /> +{slide.points}P
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-600 text-sm mb-4">{slide.instruction}</p>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-400 to-cyan-500"></div>
            
            {/* Events */}
            <div className="space-y-4">
              {slide.events.map((event, index) => (
                <div 
                  key={index}
                  onClick={() => { const n = new Set(revealed); n.add(index); setRevealed(n); }}
                  className={`relative pl-10 cursor-pointer transition-all ${revealed.has(index) ? '' : 'hover:bg-gray-50 rounded-lg'}`}
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    revealed.has(index) 
                      ? 'bg-teal-500 border-teal-500' 
                      : 'bg-white border-gray-300 hover:border-teal-400'
                  }`}>
                    {revealed.has(index) && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  
                  {/* Content */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    revealed.has(index) 
                      ? 'bg-teal-50 border-teal-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span className="font-bold text-teal-700">{event.year}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{event.event}</p>
                    {revealed.has(index) && (
                      <p className="text-gray-600 text-sm mt-1">{event.detail}</p>
                    )}
                    {!revealed.has(index) && (
                      <p className="text-gray-400 text-sm mt-1">Klicken für Details...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================================
// BESTEHENDE AKKORDEON KOMPONENTEN (gekürzt)
// ===========================================

function QuoteRevealAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: QuoteRevealSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const allRevealed = revealed.size === slide.quotes.length

  useEffect(() => {
    if (allRevealed && !isCompleted) onComplete()
  }, [allRevealed, isCompleted, onComplete])

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <Quote className="h-5 w-5 text-teal-600" />
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full points-popup">+{slide.points}P ✓</span>}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-600 text-sm mb-3">{slide.instruction}</p>
          <div className="space-y-2">
            {slide.quotes.map((q, index) => (
              <button key={index} onClick={() => { const n = new Set(revealed); n.add(index); setRevealed(n); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${revealed.has(index) ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-200'}`}>
                {revealed.has(index) ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Quote className="h-3 w-3 text-teal-600" />
                      <span className="font-semibold text-gray-900 text-sm">{q.author}</span>
                    </div>
                    <p className="text-gray-700 italic text-sm mb-2">"{q.quote}"</p>
                    <span className="bg-teal-100 text-teal-800 text-sm px-2 py-0.5 rounded-full">💡 {q.key_point}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <EyeOff className="h-4 w-4" />
                    <span className="text-sm">Zitat {index + 1} aufdecken...</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TermRevealAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: TermRevealSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const allRevealed = revealed.size === slide.terms.length

  useEffect(() => {
    if (allRevealed && !isCompleted) onComplete()
  }, [allRevealed, isCompleted, onComplete])

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-teal-600" />
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full points-popup">+{slide.points}P ✓</span>}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-600 text-sm mb-3">{slide.instruction}</p>
          <div className="space-y-2">
            {slide.terms.map((t, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => { const n = new Set(revealed); n.add(index); setRevealed(n); }}
                  className={`w-full text-left p-3 flex items-center justify-between ${revealed.has(index) ? 'bg-teal-50' : 'bg-white hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <BookOpen className={`h-4 w-4 ${revealed.has(index) ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-gray-900 text-sm">{t.term}</span>
                  </div>
                  {revealed.has(index) ? <CheckCircle2 className="h-4 w-4 text-teal-600" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                {revealed.has(index) && (
                  <div className="p-3 border-t border-gray-100 bg-white">
                    <p className="text-gray-700 text-sm mb-2">{t.definition}</p>
                    {t.example && <p className="text-sm text-gray-500 bg-gray-100 p-2 rounded"><strong>Beispiel:</strong> {t.example}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QuizAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: QuizSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSubmit = () => {
    if (selected === null) return
    setShowResult(true)
    if (!isCompleted) onComplete()
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <span className="text-xl">❓</span>
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full points-popup">+{slide.points}P ✓</span>}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-700 text-sm mb-3">{slide.question}</p>
          <div className="space-y-2 mb-3">
            {slide.options.map((opt, index) => {
              const isSelected = selected === index
              const showCorrect = showResult && opt.correct
              const showWrong = showResult && isSelected && !opt.correct
              return (
                <button key={index} onClick={() => !showResult && setSelected(index)} disabled={showResult}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2 ${
                    showCorrect ? 'border-green-400 bg-green-50' : showWrong ? 'border-red-400 bg-red-50' :
                    isSelected ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    showCorrect ? 'bg-green-500 text-white' : showWrong ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-teal-500 text-white' : 'bg-gray-200'
                  }`}>{String.fromCharCode(65 + index)}</span>
                  <span className="flex-1 text-sm">{opt.text}</span>
                  {showCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {showWrong && <XCircle className="h-4 w-4 text-red-500" />}
                </button>
              )
            })}
          </div>
          {showResult ? (
            <div className={`p-2 rounded-lg text-sm ${slide.options[selected!].correct ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {slide.explanation}
            </div>
          ) : selected !== null && (
            <button onClick={handleSubmit} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg">
              Prüfen
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TrueFalseAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: TrueFalseSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [answers, setAnswers] = useState<{ [key: number]: boolean | null }>({})
  const [showResults, setShowResults] = useState(false)
  const allAnswered = Object.keys(answers).filter(k => answers[parseInt(k)] !== null).length === slide.statements.length

  const handleSubmit = () => { setShowResults(true); if (!isCompleted) onComplete() }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <span className="text-xl">✓✗</span>
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full points-popup">+{slide.points}P ✓</span>}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <div className="space-y-3 mb-3">
            {slide.statements.map((s, index) => {
              const answer = answers[index]
              const isCorrect = showResults && answer === s.correct
              const isWrong = showResults && answer !== null && answer !== s.correct
              return (
                <div key={index} className={`p-3 rounded-lg border ${isCorrect ? 'border-green-300 bg-green-50' : isWrong ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <p className="text-gray-800 text-sm mb-2">{s.text}</p>
                  <div className="flex gap-2">
                    <button onClick={() => !showResults && setAnswers({ ...answers, [index]: true })} disabled={showResults}
                      className={`flex-1 py-1.5 rounded text-sm font-semibold ${answer === true ? showResults ? s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>✓ Richtig</button>
                    <button onClick={() => !showResults && setAnswers({ ...answers, [index]: false })} disabled={showResults}
                      className={`flex-1 py-1.5 rounded text-sm font-semibold ${answer === false ? showResults ? !s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>✗ Falsch</button>
                  </div>
                  {showResults && <p className={`mt-2 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{s.explanation}</p>}
                </div>
              )
            })}
          </div>
          {!showResults && allAnswered && (
            <button onClick={handleSubmit} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg">Prüfen</button>
          )}
        </div>
      )}
    </div>
  )
}

function DefinitionMatchAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: { 
  slide: DefinitionMatchSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void 
}) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const options = Array.from(new Set(slide.pairs.map(p => p.definition)))
  const allAnswered = Object.keys(answers).length === slide.pairs.length

  const handleSubmit = () => { setShowResults(true); if (!isCompleted) onComplete() }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔗</span>
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full points-popup">+{slide.points}P ✓</span>}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-600 text-sm mb-3">{slide.instruction}</p>
          <div className="space-y-2 mb-3">
            {slide.pairs.map((pair, index) => {
              const answer = answers[index]
              const isCorrect = showResults && answer === pair.definition
              const isWrong = showResults && answer && answer !== pair.definition
              return (
                <div key={index} className={`p-2 rounded-lg border ${isCorrect ? 'border-green-300 bg-green-50' : isWrong ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <p className="font-medium text-gray-900 text-sm mb-2">{pair.term}</p>
                  <div className="flex gap-2">
                    {options.map((opt) => (
                      <button key={opt} onClick={() => !showResults && setAnswers({ ...answers, [index]: opt })} disabled={showResults}
                        className={`flex-1 px-2 py-1.5 rounded text-sm font-semibold ${
                          answer === opt ? showResults ? opt === pair.definition ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white'
                          : showResults && opt === pair.definition ? 'bg-green-200 text-green-800' : 'bg-gray-100 hover:bg-gray-200'
                        }`}>{opt}</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {!showResults && allAnswered && (
            <button onClick={handleSubmit} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg">Prüfen</button>
          )}
        </div>
      )}
    </div>
  )
}

function InfoAccordion({ slide, isOpen, onToggle, isCompleted, onComplete }: {
  slide: InfoSlide; isOpen: boolean; onToggle: () => void; isCompleted: boolean; onComplete: () => void
}) {
  // Funktion um URLs im Text zu erkennen und Links zu erstellen
  const renderHighlightWithLinks = (text: string) => {
    // Suche nach URLs im Format: staedteverband.ch/... oder https://...
    const urlRegex = /(staedteverband\.ch\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={`https://${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-700 underline hover:text-purple-900 inline-flex items-center gap-1"
          >
            {part} <ExternalLink className="h-3 w-3 inline" />
          </a>
        )
      }
      return part
    })
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150">
        <div className="flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <span className="font-semibold text-gray-900">{slide.title}</span>
          {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓</span>}
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-gray-700 text-sm mb-3">{slide.content}</p>
          {slide.highlight && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
              <p className="text-yellow-800 text-sm">{renderHighlightWithLinks(slide.highlight)}</p>
            </div>
          )}
          {!isCompleted && (
            <button onClick={onComplete} className="text-sm text-teal-600 font-semibold hover:text-teal-700">✓ Gelesen</button>
          )}
        </div>
      )}
    </div>
  )
}

// ===========================================
// SECTION VIEW
// ===========================================

function SectionView({ section, onClose, onComplete, initialCompletedSlides }: { 
  section: Section; onClose: () => void; onComplete: (completedSlides: Set<number>) => void; initialCompletedSlides: Set<number>
}) {
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(initialCompletedSlides)
  const [openAccordion, setOpenAccordion] = useState<number | null>(0)

  const handleSlideComplete = (index: number) => {
    const newCompleted = new Set(completedSlides)
    newCompleted.add(index)
    setCompletedSlides(newCompleted)
    onComplete(newCompleted)
  }

  const earnedPoints = section.slides.reduce((sum, slide, i) => 
    completedSlides.has(i) && 'points' in slide ? sum + (slide.points || 0) : sum, 0
  )

  const renderSlide = (slide: Slide, index: number) => {
    const isOpen = openAccordion === index
    const isCompleted = completedSlides.has(index)
    const toggle = () => setOpenAccordion(isOpen ? null : index)
    const complete = () => handleSlideComplete(index)

    switch (slide.type) {
      case 'flipcard': return <FlipCardAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'swipe_cards': return <SwipeCardsAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'timeline': return <TimelineAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'info': return <InfoAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'quiz': return <QuizAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'truefalse': return <TrueFalseAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'quote_reveal': return <QuoteRevealAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'term_reveal': return <TermRevealAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      case 'definition_match': return <DefinitionMatchAccordion key={index} slide={slide} isOpen={isOpen} onToggle={toggle} isCompleted={isCompleted} onComplete={complete} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <style dangerouslySetInnerHTML={{ __html: flipCardStyles }} />
      
      <header className={`bg-gradient-to-r ${section.colorClass} text-white sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <X className="h-5 w-5" /><span>Schliessen</span>
            </button>
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
              <Award className="h-4 w-4" />
              <span className="font-semibold">{earnedPoints} / {section.totalPoints}</span>
            </div>
          </div>
          <h1 className="text-lg font-bold mt-1">{section.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <p className="text-gray-700 text-sm">{section.intro}</p>
        </div>

        {section.videoUrl && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <iframe className="w-full aspect-video" src={section.videoUrl} title={section.videoTitle} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen />
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-500" /> Interaktive Aufgaben
        </h3>
        
        <div className="space-y-3">
          {section.slides.map((slide, index) => renderSlide(slide, index))}
        </div>

        {completedSlides.size === section.slides.length && (
          <div className="bg-gradient-to-r from-green-400 to-teal-500 rounded-xl p-6 mt-6 text-center text-white">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-lg">Alle Aufgaben erledigt!</p>
            <p className="text-sm opacity-90">{earnedPoints} Punkte erreicht</p>
          </div>
        )}
      </main>
    </div>
  )
}

// ===========================================
// HAUPTKOMPONENTE
// ===========================================

export default function ProContraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [sectionData, setSectionData] = useState<{ [key: string]: { completedSlides: number[] } }>({})
  const [totalScore, setTotalScore] = useState(0)

  // Lesehilfe State
  const [readingHelpActive, setReadingHelpActive] = useState(false)
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0)
  const [readingHelpPosition, setReadingHelpPosition] = useState<{ top: number } | null>(null)

  const maxPoints = SECTIONS.reduce((sum, s) => sum + s.totalPoints, 0)

  // Lesehilfe Targets
  const getReadingTargets = () => {
    if (!activeSection) {
      return [
        { id: 'intro-text', label: '📖 Einführung', description: 'Modul-Überblick' },
        ...SECTIONS.map((s, i) => ({ id: `section-${s.id}`, label: `${s.icon} ${s.shortTitle}`, description: s.shortTitle }))
      ]
    }
    return [
      { id: 'section-content', label: '📝 Inhalt', description: 'Argumente lesen' },
    ]
  }

  const READING_TARGETS = getReadingTargets()

  const navigateReadingHelp = () => {
    if (!readingHelpActive) {
      setReadingHelpActive(true)
      setCurrentReadingIndex(0)
      scrollToReadingTarget(0)
    } else {
      const nextIndex = (currentReadingIndex + 1) % READING_TARGETS.length
      setCurrentReadingIndex(nextIndex)
      scrollToReadingTarget(nextIndex)
    }
  }

  const scrollToReadingTarget = (index: number) => {
    const target = READING_TARGETS[index]
    if (target) {
      const element = document.getElementById(target.id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const closeReadingHelp = () => {
    setReadingHelpActive(false)
    setCurrentReadingIndex(0)
    setReadingHelpPosition(null)
  }

  useEffect(() => {
    setReadingHelpActive(false)
    setCurrentReadingIndex(0)
  }, [activeSection])

  useEffect(() => {
    const updatePosition = () => {
      if (readingHelpActive && READING_TARGETS[currentReadingIndex]) {
        const element = document.getElementById(READING_TARGETS[currentReadingIndex].id)
        if (element) {
          const rect = element.getBoundingClientRect()
          const targetTop = rect.top + (rect.height / 2) - 30
          const clampedTop = Math.max(80, Math.min(targetTop, window.innerHeight - 100))
          setReadingHelpPosition({ top: clampedTop })
        }
      } else {
        setReadingHelpPosition(null)
      }
    }
    updatePosition()
    if (readingHelpActive) {
      window.addEventListener('scroll', updatePosition)
      return () => window.removeEventListener('scroll', updatePosition)
    }
  }, [readingHelpActive, currentReadingIndex, READING_TARGETS])

  // Lesehilfe Styles
  const readingHelpStyles = `
    .reading-highlight-box {
      position: relative;
      box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4) !important;
      border-radius: 12px;
      animation: reading-pulse 2s ease-in-out infinite;
    }
    .reading-highlight-box::before {
      content: attr(data-reading-label);
      position: absolute;
      top: -12px;
      left: 12px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 6px;
      z-index: 10;
      white-space: nowrap;
    }
    @keyframes reading-pulse {
      0%, 100% { box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4); }
      50% { box-shadow: 0 0 0 6px #f59e0b, 0 0 35px rgba(245, 158, 11, 0.6); }
    }
  `

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.procontra
          if (data) {
            setTotalScore(data.score || 0)
            setSectionData(data.sectionData || {})
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSectionComplete = async (sectionId: string, completedSlides: Set<number>) => {
    const newSectionData = { ...sectionData, [sectionId]: { completedSlides: Array.from(completedSlides) } }
    setSectionData(newSectionData)

    let newTotal = 0
    SECTIONS.forEach(s => {
      const data = newSectionData[s.id]
      if (data) {
        s.slides.forEach((slide, i) => {
          if (data.completedSlides.includes(i) && 'points' in slide) newTotal += slide.points || 0
        })
      }
    })
    setTotalScore(newTotal)
    await saveProgress(newTotal, newSectionData)
  }

  const saveProgress = async (score: number, data: typeof sectionData) => {
    const user = auth.currentUser
    if (!user) return
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        const allComplete = SECTIONS.every(s => { const d = data[s.id]; return d && d.completedSlides.length === s.slides.length })
        modules.procontra = { completed: allComplete, score, progress: Math.round((score / maxPoints) * 100), sectionData: data, lastUpdated: new Date().toISOString() }
        let totalPoints = 0
        Object.keys(modules).forEach(k => { if (modules[k].score) totalPoints += modules[k].score })
        const allModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)
        await updateDoc(userRef, { modules, totalPoints, overallProgress })
        if (allComplete && !userData.badges?.procontra) {
          await updateDoc(userRef, { [`badges.procontra`]: { moduleId: 'procontra', moduleName: '3. Pro- und Contra', lerncode: userData.code, issuedAt: new Date().toISOString() } })
        }
      }
    } catch (e) { console.error(e) }
  }

  const getSectionProgress = (sectionId: string) => {
    const section = SECTIONS.find(s => s.id === sectionId)!
    const data = sectionData[sectionId]
    if (!data) return { earned: 0, total: section.totalPoints, complete: false }
    let earned = 0
    section.slides.forEach((slide, i) => { if (data.completedSlides.includes(i) && 'points' in slide) earned += slide.points || 0 })
    return { earned, total: section.totalPoints, complete: data.completedSlides.length === section.slides.length }
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>

  if (activeSection) {
    const section = SECTIONS.find(s => s.id === activeSection)!
    const data = sectionData[activeSection]
    return <SectionView section={section} onClose={() => setActiveSection(null)} onComplete={(c) => handleSectionComplete(activeSection, c)} initialCompletedSlides={new Set(data?.completedSlides || [])} />
  }

  const isComplete = SECTIONS.every(s => getSectionProgress(s.id).complete)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <style dangerouslySetInnerHTML={{ __html: flipCardStyles + readingHelpStyles }} />

      {/* Lesehilfe Button */}
      <div
        className="fixed z-30 right-4 transition-all duration-300 ease-out"
        style={{
          top: readingHelpActive && readingHelpPosition ? `${readingHelpPosition.top}px` : 'auto',
          bottom: readingHelpActive && readingHelpPosition ? 'auto' : '2rem'
        }}
      >
        <div className="relative">
          <button
            onClick={navigateReadingHelp}
            className={`p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
              readingHelpActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
                : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
            }`}
          >
            <Glasses className="h-6 w-6" />
          </button>
          {readingHelpActive && (
            <>
              <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shadow-md animate-pulse">
                {currentReadingIndex + 1}/{READING_TARGETS.length}
              </div>
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-amber-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-[180px]">
                <div className="font-semibold text-xs">{READING_TARGETS[currentReadingIndex]?.label}</div>
                <div className="text-[10px] text-amber-200 mt-0.5">{READING_TARGETS[currentReadingIndex]?.description}</div>
                <div className="text-[10px] text-amber-300 mt-1">Klicken → weiter</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-amber-600"></div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); closeReadingHelp(); }} className="absolute -top-1 -left-1 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-1 shadow-md">
                <X className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
          </button>
          <div className={`flex items-center gap-2 font-semibold px-3 py-1 rounded-full ${isComplete ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'}`}>
            <Award className="h-5 w-5" /><span>{totalScore} / {maxPoints}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pro und Contra</h1>
          <p className="text-gray-600">Abstimmung vom 8. März 2026: Individualbesteuerung</p>
        </div>

        <div
          id="intro-text"
          className={`bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6 transition-all ${readingHelpActive && currentReadingIndex === 0 ? 'reading-highlight-box' : ''}`}
          data-reading-label="📖 Einführung"
        >
          <p className="text-amber-800 mb-2">
            <strong>📣 Bei Abstimmungen gehen die Meinungen auseinander.</strong>
          </p>
          <p className="text-amber-800 mb-2">
            In diesem Modul lernen Sie die verschiedenen <strong>Akteur:innen</strong> und ihre Argumente kennen.
            Sie sehen Video-Statements von Befürworter:innen und Gegner:innen und lösen interaktive Aufgaben wie
            Flipcards, Swipe-Karten und Zuordnungsübungen. Vier Perspektiven stehen im Fokus: Der Bundesrat, das
            Komitee der Befürworter:innen, das Komitee der Gegner:innen und die Kantone.
          </p>
          <p className="text-amber-800 mb-2">
            <strong>Beispiel:</strong> Der Bundesrat argumentiert, dass bis zu 44'000 neue Vollzeitstellen entstehen könnten,
            weil sich Mehrarbeit für verheiratete Personen mehr lohnen würde. Die Gegner:innen warnen hingegen vor
            630 Millionen Franken Steuerausfällen pro Jahr und kritisieren, dass vor allem Gutverdienende profitieren würden.
          </p>
          <p className="text-amber-800">
            Wer hat recht? Bilden Sie sich Ihre eigene Meinung, indem Sie alle Perspektiven kennenlernen!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {SECTIONS.map((section, sectionIndex) => {
            const Icon = IconMap[section.icon] || Users
            const progress = getSectionProgress(section.id)
            const isHighlighted = readingHelpActive && currentReadingIndex === sectionIndex + 1
            return (
              <button
                key={section.id}
                id={`section-${section.id}`}
                onClick={() => setActiveSection(section.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg hover:scale-[1.02] ${
                  progress.complete ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
                } ${isHighlighted ? 'reading-highlight-box' : ''}`}
                data-reading-label={section.shortTitle}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${progress.complete ? 'bg-green-500' : section.bgColor}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{section.shortTitle}</h3>
                    <p className="text-sm text-gray-500">{progress.earned} / {progress.total} Punkte</p>
                  </div>
                  {progress.complete && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${progress.complete ? 'bg-green-500' : section.bgColor} transition-all`} style={{ width: `${(progress.earned / progress.total) * 100}%` }} />
                </div>
              </button>
            )
          })}
        </div>

        {isComplete && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Modul abgeschlossen!</h3>
            <p>Sie haben alle Perspektiven kennengelernt und {totalScore} Punkte erreicht.</p>
          </div>
        )}
      </main>
    </div>
  )
}
