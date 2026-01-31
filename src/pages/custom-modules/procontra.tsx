import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Award, XCircle, 
  Play, Building2, Users, MapPin, ThumbsUp, ThumbsDown,
  Eye, EyeOff, Quote, BookOpen, Lightbulb, ChevronRight, X, Video
} from 'lucide-react'

// ===========================================
// TYPEN
// ===========================================

type SlideType = 'info' | 'quiz' | 'truefalse' | 'quote_reveal' | 'term_reveal' | 'definition_match'

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

type Slide = InfoSlide | QuizSlide | TrueFalseSlide | QuoteRevealSlide | TermRevealSlide | DefinitionMatchSlide

interface Section {
  id: string
  title: string
  shortTitle: string
  icon: string
  color: string
  colorClass: string
  bgColor: string
  intro: string
  videoUrl: string
  videoTitle: string
  videoPoints: number
  slides: Slide[]
  totalPoints: number
}

// ===========================================
// 4 AKTEURE MIT INHALTEN
// ===========================================

const SECTIONS: Section[] = [
  // 1. BUNDESRAT
  {
    id: 'bundesrat',
    title: 'Position Bundesrat',
    shortTitle: 'Bundesrat',
    icon: 'Building2',
    color: 'blue',
    colorClass: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500',
    intro: 'Der Bundesrat unter Führung von Finanzministerin Karin Keller-Sutter befürwortet die Individualbesteuerung. Er sieht darin eine Chance, die sogenannte "Heiratsstrafe" abzuschaffen und Erwerbsanreize zu schaffen.',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:77a83d61-aeb0-4984-8e7b-37291a89b62c&startTime=12',
    videoTitle: 'Bundesrat präsentiert Position',
    videoPoints: 10,
    totalPoints: 50,
    slides: [
      {
        type: 'quote_reveal',
        title: 'Zitate der Finanzministerin',
        instruction: 'Klicken Sie auf die Karten, um die zentralen Aussagen aufzudecken:',
        quotes: [
          {
            author: 'Karin Keller-Sutter',
            role: 'Bundesrätin, Finanzministerin',
            quote: 'Die Beseitigung der Heiratsstrafe schafft einen Erwerbsanreiz. Das heisst, dass sich Leistung lohnt - auch bei den Steuern.',
            key_point: 'Leistung soll sich lohnen'
          },
          {
            author: 'Karin Keller-Sutter',
            role: 'Bundesrätin, Finanzministerin', 
            quote: 'Paare in vergleichbaren wirtschaftlichen Verhältnissen müssen heute oft unterschiedlich hohe Steuern zahlen. Nur weil sie verheiratet sind oder eben nicht.',
            key_point: 'Ungleichbehandlung je nach Zivilstand'
          }
        ],
        points: 10
      },
      {
        type: 'term_reveal',
        title: 'Schlüsselbegriffe',
        instruction: 'Klicken Sie auf die Begriffe, um ihre Bedeutung zu erfahren:',
        terms: [
          {
            term: 'Heiratsstrafe',
            definition: 'Die steuerliche Mehrbelastung von Ehepaaren gegenüber unverheirateten Paaren mit gleichem Einkommen.',
            example: 'Ein Ehepaar mit zwei Einkommen zahlt mehr als ein Konkubinatspaar.'
          },
          {
            term: 'Individualbesteuerung',
            definition: 'Jede Person wird einzeln besteuert, unabhängig vom Zivilstand. Ehepaare füllen getrennte Steuererklärungen aus.',
            example: 'Wie es heute schon bei unverheirateten Paaren der Fall ist.'
          },
          {
            term: 'Steuerprogression',
            definition: 'Je höher das Einkommen, desto höher der Steuersatz. Bei gemeinsamer Veranlagung steigt das Gesamteinkommen.',
            example: '80\'000 + 60\'000 = 140\'000 wird höher besteuert als zwei Mal 70\'000 einzeln.'
          }
        ],
        points: 10
      },
      {
        type: 'quiz',
        title: 'Verständnisfrage',
        question: 'Welchen positiven Nebeneffekt erwartet der Bund durch die Individualbesteuerung?',
        options: [
          { text: 'Höhere Steuereinnahmen', correct: false },
          { text: 'Bis zu 44\'000 neue Vollzeitstellen', correct: true },
          { text: 'Weniger Bürokratie', correct: false },
          { text: 'Tiefere Mieten', correct: false }
        ],
        explanation: 'Der Bund rechnet damit, dass v.a. Ehefrauen mehr arbeiten würden, weil ihnen mehr vom Lohn bliebe.',
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statements: [
          { 
            text: 'Der Bundesrat ist gegen die Individualbesteuerung.', 
            correct: false, 
            explanation: 'Falsch! Der Bundesrat befürwortet die Reform.' 
          },
          { 
            text: 'Mit der Reform würden Ehepaare weiterhin gemeinsam besteuert.', 
            correct: false, 
            explanation: 'Falsch! Jeder Ehepartner würde eine eigene Steuererklärung ausfüllen.' 
          }
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
    color: 'green',
    colorClass: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500',
    intro: 'Ein breites Komitee von Parteien und Verbänden unterstützt die Individualbesteuerung. Sie sehen darin einen wichtigen Schritt zur Gleichstellung und zur Förderung der Erwerbstätigkeit von Frauen.',
    videoUrl: '[PLATZHALTER]',
    videoTitle: 'Befürworter:innen präsentieren Argumente',
    videoPoints: 10,
    totalPoints: 40,
    slides: [
      {
        type: 'term_reveal',
        title: 'Argumente der Befürworter:innen',
        instruction: 'Klicken Sie, um die Hauptargumente aufzudecken:',
        terms: [
          {
            term: 'Gleichbehandlung',
            definition: 'Alle Paare werden gleich besteuert, unabhängig davon, ob sie verheiratet sind oder nicht.',
            example: 'Ein Konkubinatspaar und ein Ehepaar mit gleichem Einkommen zahlen gleich viel Steuern.'
          },
          {
            term: 'Erwerbsanreiz',
            definition: 'Zweitverdienende behalten mehr vom Lohn, da ihr Einkommen nicht mehr zum Partner addiert wird.',
            example: 'Eine Ehefrau mit 50\'000 Fr. Einkommen behält mehr, als wenn das Einkommen zum Mann addiert wird.'
          },
          {
            term: 'Fachkräftemangel bekämpfen',
            definition: 'Laut Befürworter:innen kann man mit der Individualbesteuerung das Arbeitskräftepotenzial der Frauen besser ausschöpfen.',
            example: 'Der Bund rechnet mit bis zu 44\'000 zusätzlichen Vollzeitstellen.'
          }
        ],
        points: 15
      },
      {
        type: 'quiz',
        title: 'Verständnisfrage',
        question: 'Wer profitiert laut Befürworter:innen am meisten von der Reform?',
        options: [
          { text: 'Einverdiener-Ehepaare', correct: false },
          { text: 'Unverheiratete Singles', correct: false },
          { text: 'Doppelverdiener-Ehepaare', correct: true },
          { text: 'Rentner:innen', correct: false }
        ],
        explanation: 'Bei Doppelverdiener-Ehepaaren fällt die bisherige Mehrbelastung durch die gemeinsame Veranlagung weg.',
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
    color: 'red',
    colorClass: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500',
    intro: 'Ein Komitee aus SVP, EVP, EDU und Mitte hat das Referendum ergriffen. Sie kritisieren, dass vor allem reiche Doppelverdiener profitieren würden und warnen vor Mehraufwand und neuen Ungerechtigkeiten.',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:76af4420-abff-4a34-8aab-9941193b223e',
    videoTitle: 'Kontra-Komitee präsentiert Argumente',
    videoPoints: 10,
    totalPoints: 50,
    slides: [
      {
        type: 'quote_reveal',
        title: 'Aussagen des Nein-Komitees',
        instruction: 'Klicken Sie auf die Karten, um die Kritikpunkte aufzudecken:',
        quotes: [
          {
            author: 'Nein-Komitee',
            role: 'SVP, EVP, EDU, Mitte',
            quote: 'Begünstigt werden v.a. Doppelverdiener-Ehepaare mit ähnlichen, aber v.a. mit hohen Einkommen. Belastet werden Einverdiener-Familien und Paare mit ungleicher Einkommensverteilung.',
            key_point: 'Profiteure sind die reichsten Doppelverdiener'
          },
          {
            author: 'Nein-Komitee',
            role: 'SVP, EVP, EDU, Mitte',
            quote: 'Zwei Steuererklärungen auszufüllen, bedeutet einen erheblichen Mehraufwand - einerseits für die Ehepaare, aber dann auch für die Steuerbehörden, die das kontrollieren müssen.',
            key_point: 'Erheblicher Mehraufwand für alle'
          },
          {
            author: 'Nein-Komitee',
            role: 'SVP, EVP, EDU, Mitte',
            quote: 'Ja gut, die Frauen würden ganz leicht mehr arbeiten. Das wäre wirklich nur ein Tropfen auf den heissen Stein. Mit der Zuwanderung kommen jedes Jahr 80\'000 Leute.',
            key_point: 'Kaum Effekt auf Fachkräftemangel'
          }
        ],
        points: 10
      },
      {
        type: 'term_reveal',
        title: 'Kritikpunkte verstehen',
        instruction: 'Klicken Sie auf die Begriffe, um die Kritik zu verstehen:',
        terms: [
          {
            term: 'Doppelverdiener-Bonus',
            definition: 'Das Nein-Komitee kritisiert, dass vor allem gut verdienende Paare mit zwei Einkommen profitieren.',
            example: 'Ein Paar mit 2x 150\'000 Fr. profitiert mehr als eines mit 1x 100\'000 Fr.'
          },
          {
            term: 'Mehraufwand',
            definition: 'Zukünftig muss jedes Ehepaar zwei Steuererklärungen ausfüllen statt einer.',
            example: 'Auch die Steuerbehörden müssen doppelt so viele Erklärungen kontrollieren.'
          },
          {
            term: 'Einverdiener-Familien',
            definition: 'Familien mit nur einem Einkommen hätten keinen Vorteil von der Reform.',
            example: 'Ein Alleinverdiener mit 120\'000 Fr. wird gleich besteuert wie vorher.'
          },
          {
            term: 'Komplizierte Vorlage',
            definition: 'Die Gegner:innen sagen, die Vorlage sei zu kompliziert. Der Arbeitsaufwand bei der Steuererklärung würde für Ehepaare steigen.',
            example: 'Vermögen, Abzüge und Kinder müssten neu aufgeteilt werden.'
          }
        ],
        points: 10
      },
      {
        type: 'definition_match',
        title: 'Pro oder Contra?',
        instruction: 'Ordnen Sie die Argumente der richtigen Seite zu:',
        pairs: [
          { term: 'Beseitigung der Heiratsstrafe', definition: 'PRO' },
          { term: 'Erheblicher Mehraufwand für Ehepaare', definition: 'CONTRA' },
          { term: 'Erwerbsanreiz für Frauen', definition: 'PRO' },
          { term: 'Bevorzugt reiche Doppelverdiener', definition: 'CONTRA' },
          { term: 'Gleichbehandlung aller Paare', definition: 'PRO' },
          { term: 'Nur ein Tropfen auf den heissen Stein', definition: 'CONTRA' }
        ],
        points: 10
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
        explanation: 'Das Nein-Komitee besteht aus SVP, EVP, EDU und Mitte. Die SP unterstützt die Vorlage.',
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
    color: 'orange',
    colorClass: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500',
    intro: 'Die Kantone haben gemeinsam mit dem Nein-Komitee das Referendum ergriffen. Sie befürchten massive Steuerausfälle und einen hohen Umsetzungsaufwand bei der Umstellung des Steuersystems.',
    videoUrl: '[PLATZHALTER]',
    videoTitle: 'Kantone erklären ihre Position',
    videoPoints: 10,
    totalPoints: 40,
    slides: [
      {
        type: 'info',
        title: 'Was ist ein Kantonsreferendum?',
        content: 'Wenn mindestens 8 Kantone es verlangen, kommt ein Bundesgesetz vors Volk. Bei der Individualbesteuerung haben die Kantone dieses seltene Instrument genutzt, weil sie direkt von den Steuerausfällen betroffen wären.',
        highlight: 'Das Kantonsreferendum zeigt, wie stark die Kantone die Reform ablehnen.'
      },
      {
        type: 'term_reveal',
        title: 'Bedenken der Kantone',
        instruction: 'Klicken Sie, um die Argumente der Kantone zu verstehen:',
        terms: [
          {
            term: 'Steuerausfälle',
            definition: 'Der Bund rechnet mit 630 Mio. Fr. weniger pro Jahr allein bei der direkten Bundessteuer.',
            example: 'Dazu kommen noch Ausfälle bei den Kantons- und Gemeindesteuern.'
          },
          {
            term: 'Umsetzungsaufwand',
            definition: 'Die Steuerverwaltungen müssten komplett umgestellt werden.',
            example: 'Neue Software, neue Formulare, Schulung der Mitarbeitenden.'
          },
          {
            term: 'Föderalismus',
            definition: 'Jeder Kanton hat eigene Steuergesetze, die angepasst werden müssten.',
            example: 'Die Umsetzung würde in 26 Kantonen unterschiedlich ablaufen.'
          }
        ],
        points: 15
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statements: [
          { 
            text: 'Für ein Kantonsreferendum braucht es mindestens 8 Kantone.', 
            correct: true, 
            explanation: 'Richtig! 8 Kantone müssen das Referendum verlangen.' 
          },
          { 
            text: 'Die Kantone befürworten die Individualbesteuerung.', 
            correct: false, 
            explanation: 'Falsch! Die Kantone haben das Referendum dagegen ergriffen.' 
          }
        ],
        points: 15
      }
    ]
  }
]

// ===========================================
// ICON MAP
// ===========================================
const IconMap: { [key: string]: any } = { Building2, Users, MapPin, ThumbsUp, ThumbsDown }

// ===========================================
// SLIDE KOMPONENTEN
// ===========================================

// Info Slide
function InfoSlideComponent({ slide, onComplete }: { slide: InfoSlide; onComplete: () => void }) {
  const [read, setRead] = useState(false)
  
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <h4 className="font-bold text-gray-900 mb-2">{slide.title}</h4>
      <p className="text-gray-700 text-sm mb-3">{slide.content}</p>
      {slide.highlight && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
          <p className="text-yellow-800 text-sm font-medium">{slide.highlight}</p>
        </div>
      )}
      {!read ? (
        <button onClick={() => { setRead(true); onComplete(); }} className="text-sm text-teal-600 font-semibold hover:text-teal-700">
          ✓ Gelesen
        </button>
      ) : (
        <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" /> Erledigt
        </span>
      )}
    </div>
  )
}

// Quote Reveal Slide
function QuoteRevealSlideComponent({ slide, onComplete }: { slide: QuoteRevealSlide; onComplete: () => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [completed, setCompleted] = useState(false)
  const allRevealed = revealed.size === slide.quotes.length

  useEffect(() => {
    if (allRevealed && !completed) {
      setCompleted(true)
      onComplete()
    }
  }, [allRevealed, completed, onComplete])

  const toggleReveal = (index: number) => {
    const newRevealed = new Set(revealed)
    newRevealed.add(index)
    setRevealed(newRevealed)
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{slide.title}</h4>
        {completed && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> +{slide.points}P</span>}
      </div>
      <p className="text-gray-600 text-sm mb-3">{slide.instruction}</p>
      
      <div className="space-y-2">
        {slide.quotes.map((q, index) => (
          <button
            key={index}
            onClick={() => toggleReveal(index)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              revealed.has(index) 
                ? 'border-teal-300 bg-teal-50' 
                : 'border-gray-200 bg-white hover:border-teal-200'
            }`}
          >
            {revealed.has(index) ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Quote className="h-3 w-3 text-teal-600" />
                  <span className="font-semibold text-gray-900 text-sm">{q.author}</span>
                </div>
                <p className="text-gray-700 italic text-sm mb-2">"{q.quote}"</p>
                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full">💡 {q.key_point}</span>
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
  )
}

// Term Reveal Slide
function TermRevealSlideComponent({ slide, onComplete }: { slide: TermRevealSlide; onComplete: () => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [completed, setCompleted] = useState(false)
  const allRevealed = revealed.size === slide.terms.length

  useEffect(() => {
    if (allRevealed && !completed) {
      setCompleted(true)
      onComplete()
    }
  }, [allRevealed, completed, onComplete])

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{slide.title}</h4>
        {completed && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> +{slide.points}P</span>}
      </div>
      <p className="text-gray-600 text-sm mb-3">{slide.instruction}</p>
      
      <div className="space-y-2">
        {slide.terms.map((t, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => {
                const newRevealed = new Set(revealed)
                newRevealed.add(index)
                setRevealed(newRevealed)
              }}
              className={`w-full text-left p-3 flex items-center justify-between ${revealed.has(index) ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className={`h-4 w-4 ${revealed.has(index) ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className="font-semibold text-gray-900 text-sm">{t.term}</span>
              </div>
              {revealed.has(index) ? <CheckCircle2 className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </button>
            {revealed.has(index) && (
              <div className="p-3 border-t border-gray-100 bg-white">
                <p className="text-gray-700 text-sm mb-2">{t.definition}</p>
                {t.example && <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded"><strong>Beispiel:</strong> {t.example}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Definition Match Slide
function DefinitionMatchSlideComponent({ slide, onComplete }: { slide: DefinitionMatchSlide; onComplete: () => void }) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const [completed, setCompleted] = useState(false)
  
  const options = Array.from(new Set(slide.pairs.map(p => p.definition)))
  const allAnswered = Object.keys(answers).length === slide.pairs.length

  const handleSubmit = () => {
    setShowResults(true)
    if (!completed) {
      setCompleted(true)
      onComplete()
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{slide.title}</h4>
        {completed && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> +{slide.points}P</span>}
      </div>
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
                  <button
                    key={opt}
                    onClick={() => !showResults && setAnswers({ ...answers, [index]: opt })}
                    disabled={showResults}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                      answer === opt
                        ? showResults
                          ? opt === pair.definition ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-teal-500 text-white'
                        : showResults && opt === pair.definition
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {!showResults && allAnswered && (
        <button onClick={handleSubmit} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg">
          Prüfen
        </button>
      )}
    </div>
  )
}

// Quiz Slide
function QuizSlideComponent({ slide, onComplete }: { slide: QuizSlide; onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleSubmit = () => {
    if (selected === null) return
    setShowResult(true)
    if (!completed) {
      setCompleted(true)
      onComplete()
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{slide.title}</h4>
        {completed && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> +{slide.points}P</span>}
      </div>
      <p className="text-gray-700 text-sm mb-3">{slide.question}</p>
      
      <div className="space-y-2 mb-3">
        {slide.options.map((opt, index) => {
          const isSelected = selected === index
          const showCorrect = showResult && opt.correct
          const showWrong = showResult && isSelected && !opt.correct
          
          return (
            <button
              key={index}
              onClick={() => !showResult && setSelected(index)}
              disabled={showResult}
              className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2 ${
                showCorrect ? 'border-green-400 bg-green-50' :
                showWrong ? 'border-red-400 bg-red-50' :
                isSelected ? 'border-teal-400 bg-teal-50' :
                'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                showCorrect ? 'bg-green-500 text-white' :
                showWrong ? 'bg-red-500 text-white' :
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
  )
}

// True/False Slide
function TrueFalseSlideComponent({ slide, onComplete }: { slide: TrueFalseSlide; onComplete: () => void }) {
  const [answers, setAnswers] = useState<{ [key: number]: boolean | null }>({})
  const [showResults, setShowResults] = useState(false)
  const [completed, setCompleted] = useState(false)
  const allAnswered = Object.keys(answers).filter(k => answers[parseInt(k)] !== null).length === slide.statements.length

  const handleSubmit = () => {
    setShowResults(true)
    if (!completed) {
      setCompleted(true)
      onComplete()
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{slide.title}</h4>
        {completed && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> +{slide.points}P</span>}
      </div>
      
      <div className="space-y-3 mb-3">
        {slide.statements.map((s, index) => {
          const answer = answers[index]
          const isCorrect = showResults && answer === s.correct
          const isWrong = showResults && answer !== null && answer !== s.correct
          
          return (
            <div key={index} className={`p-3 rounded-lg border ${isCorrect ? 'border-green-300 bg-green-50' : isWrong ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <p className="text-gray-800 text-sm mb-2">{s.text}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => !showResults && setAnswers({ ...answers, [index]: true })} 
                  disabled={showResults}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold ${answer === true ? showResults ? s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >✓ Richtig</button>
                <button 
                  onClick={() => !showResults && setAnswers({ ...answers, [index]: false })} 
                  disabled={showResults}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold ${answer === false ? showResults ? !s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >✗ Falsch</button>
              </div>
              {showResults && <p className={`mt-2 text-xs ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{s.explanation}</p>}
            </div>
          )
        })}
      </div>

      {!showResults && allAnswered && (
        <button onClick={handleSubmit} className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg">
          Prüfen
        </button>
      )}
    </div>
  )
}

// ===========================================
// SECTION VIEW (Video + Aufgaben auf einer Seite)
// ===========================================

function SectionView({ 
  section, 
  onClose, 
  onComplete,
  initialVideoWatched,
  initialCompletedSlides
}: { 
  section: Section
  onClose: () => void
  onComplete: (videoWatched: boolean, completedSlides: Set<number>) => void
  initialVideoWatched: boolean
  initialCompletedSlides: Set<number>
}) {
  const [videoWatched, setVideoWatched] = useState(initialVideoWatched)
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(initialCompletedSlides)
  const isPlaceholder = section.videoUrl.includes('PLATZHALTER')

  const handleVideoConfirm = () => {
    setVideoWatched(true)
  }

  const handleSlideComplete = (index: number) => {
    const newCompleted = new Set(completedSlides)
    newCompleted.add(index)
    setCompletedSlides(newCompleted)
  }

  const allSlidesCompleted = completedSlides.size === section.slides.length
  const earnedPoints = (videoWatched ? section.videoPoints : 0) + 
    section.slides.reduce((sum, slide, i) => completedSlides.has(i) ? sum + (('points' in slide ? slide.points : 0) || 0) : sum, 0)

  // Auto-save on changes
  useEffect(() => {
    onComplete(videoWatched, completedSlides)
  }, [videoWatched, completedSlides])

  const renderSlide = (slide: Slide, index: number) => {
    const isCompleted = completedSlides.has(index)
    
    switch (slide.type) {
      case 'info': return <InfoSlideComponent key={index} slide={slide} onComplete={() => handleSlideComplete(index)} />
      case 'quiz': return <QuizSlideComponent key={index} slide={slide} onComplete={() => handleSlideComplete(index)} />
      case 'truefalse': return <TrueFalseSlideComponent key={index} slide={slide} onComplete={() => handleSlideComplete(index)} />
      case 'quote_reveal': return <QuoteRevealSlideComponent key={index} slide={slide} onComplete={() => handleSlideComplete(index)} />
      case 'term_reveal': return <TermRevealSlideComponent key={index} slide={slide} onComplete={() => handleSlideComplete(index)} />
      case 'definition_match': return <DefinitionMatchSlideComponent key={index} slide={slide} onComplete={() => handleSlideComplete(index)} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className={`bg-gradient-to-r ${section.colorClass} text-white sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <X className="h-5 w-5" /><span>Schliessen</span>
            </button>
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4" />
              <span className="font-semibold">{earnedPoints} / {section.totalPoints} Punkte</span>
            </div>
          </div>
          <h1 className="text-lg font-bold mt-1">{section.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Intro */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <p className="text-gray-700 text-sm">{section.intro}</p>
        </div>

        {/* Video */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="bg-gray-900">
            {isPlaceholder ? (
              <div className="aspect-video flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{section.videoTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">Video-Platzhalter</p>
                </div>
              </div>
            ) : (
              <iframe className="w-full aspect-video" src={section.videoUrl} title={section.videoTitle} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen />
            )}
          </div>
          
          {/* Video Bestätigung */}
          <div className={`p-3 border-t ${videoWatched ? 'bg-green-50' : 'bg-gray-50'}`}>
            {videoWatched ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium text-sm">Video angeschaut</span>
                <span className="ml-auto text-xs font-semibold">+{section.videoPoints} Punkte</span>
              </div>
            ) : (
              <button 
                onClick={handleVideoConfirm}
                className="w-full flex items-center justify-center gap-2 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg text-sm"
              >
                <Video className="h-4 w-4" />
                Video angeschaut (+{section.videoPoints} Punkte)
              </button>
            )}
          </div>
        </div>

        {/* Aufgaben direkt unter dem Video */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Interaktive Aufgaben</h3>
          {section.slides.map((slide, index) => renderSlide(slide, index))}
        </div>

        {/* Abschluss */}
        {videoWatched && allSlidesCompleted && (
          <div className="bg-green-100 border border-green-300 rounded-xl p-4 mt-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-semibold">Sektion abgeschlossen!</p>
            <p className="text-green-700 text-sm">Sie haben {earnedPoints} Punkte erreicht.</p>
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
  const [sectionData, setSectionData] = useState<{ [key: string]: { videoWatched: boolean; completedSlides: number[] } }>({})
  const [totalScore, setTotalScore] = useState(0)

  const maxPoints = SECTIONS.reduce((sum, s) => sum + s.totalPoints, 0)

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

  const handleSectionComplete = async (sectionId: string, videoWatched: boolean, completedSlides: Set<number>) => {
    const section = SECTIONS.find(s => s.id === sectionId)!
    
    const newSectionData = {
      ...sectionData,
      [sectionId]: {
        videoWatched,
        completedSlides: Array.from(completedSlides)
      }
    }
    setSectionData(newSectionData)

    // Calculate total score
    let newTotal = 0
    SECTIONS.forEach(s => {
      const data = newSectionData[s.id]
      if (data) {
        if (data.videoWatched) newTotal += s.videoPoints
        s.slides.forEach((slide, i) => {
          if (data.completedSlides.includes(i) && 'points' in slide) {
            newTotal += slide.points || 0
          }
        })
      }
    })
    setTotalScore(newTotal)

    // Save to Firebase
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
        
        // Check if all sections are complete
        const allComplete = SECTIONS.every(s => {
          const d = data[s.id]
          return d && d.videoWatched && d.completedSlides.length === s.slides.length
        })
        
        modules.procontra = {
          completed: allComplete,
          score,
          progress: Math.round((score / maxPoints) * 100),
          sectionData: data,
          lastUpdated: new Date().toISOString()
        }
        
        let totalPoints = 0
        Object.keys(modules).forEach(k => { if (modules[k].score) totalPoints += modules[k].score })
        
        const allModules = ['grundlagen', 'vertiefung', 'procontra', 'lernkontrolle', 'umfrage']
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
    
    let earned = data.videoWatched ? section.videoPoints : 0
    section.slides.forEach((slide, i) => {
      if (data.completedSlides.includes(i) && 'points' in slide) {
        earned += slide.points || 0
      }
    })
    
    const complete = data.videoWatched && data.completedSlides.length === section.slides.length
    return { earned, total: section.totalPoints, complete }
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>

  // Section View
  if (activeSection) {
    const section = SECTIONS.find(s => s.id === activeSection)!
    const data = sectionData[activeSection]
    return (
      <SectionView 
        section={section}
        onClose={() => setActiveSection(null)}
        onComplete={(v, c) => handleSectionComplete(activeSection, v, c)}
        initialVideoWatched={data?.videoWatched || false}
        initialCompletedSlides={new Set(data?.completedSlides || [])}
      />
    )
  }

  const isComplete = SECTIONS.every(s => getSectionProgress(s.id).complete)

  // Übersicht
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
          </button>
          <div className={`flex items-center gap-2 font-semibold ${isComplete ? 'text-green-600' : 'text-teal-600'}`}>
            <Award className="h-5 w-5" /><span>{totalScore} / {maxPoints}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Titel */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pro und Contra</h1>
          <p className="text-gray-600">Abstimmung vom 8. März 2026: Individualbesteuerung</p>
        </div>

        {/* Intro */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6">
          <p className="text-amber-800">
            <strong>📣 Bei Abstimmungen gehen die Meinungen auseinander.</strong><br />
            Lernen Sie die verschiedenen Akteure und ihre Argumente kennen.
          </p>
        </div>

        {/* Klickbare Akteur-Karten */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {SECTIONS.map((section) => {
            const Icon = IconMap[section.icon] || Users
            const progress = getSectionProgress(section.id)
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                  progress.complete 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${progress.complete ? 'bg-green-500' : section.bgColor}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{section.shortTitle}</h3>
                    <p className="text-xs text-gray-500">{progress.earned} / {progress.total} Punkte</p>
                  </div>
                  {progress.complete && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${progress.complete ? 'bg-green-500' : section.bgColor} transition-all`} style={{ width: `${(progress.earned / progress.total) * 100}%` }} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Abschluss */}
        {isComplete && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white text-center">
            <Award className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-2">🎉 Modul abgeschlossen!</h3>
            <p>Sie haben alle Perspektiven kennengelernt.</p>
          </div>
        )}
      </main>
    </div>
  )
}
