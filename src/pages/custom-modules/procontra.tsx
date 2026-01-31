import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Award, Clock, XCircle, 
  Play, Building2, Users, MapPin, GraduationCap, ChevronRight,
  Eye, EyeOff, Quote, BookOpen, Lightbulb, AlertCircle
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
  icon: string
  color: string
  description: string
  videoUrl: string
  videoTitle: string
  videoDuration: string
  slides: Slide[]
  totalPoints: number
}

// ===========================================
// SEKTIONEN MIT INHALTEN
// ===========================================

const SECTIONS: Section[] = [
  // BUNDESRAT
  {
    id: 'bundesrat',
    title: 'Position Bundesrat',
    icon: 'Building2',
    color: 'blue',
    description: 'Der Bundesrat und Finanzministerin Karin Keller-Sutter befürworten die Individualbesteuerung',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:77a83d61-aeb0-4984-8e7b-37291a89b62c&startTime=12',
    videoTitle: 'Bundesrat präsentiert Position zur Individualbesteuerung',
    videoDuration: '3 Min',
    totalPoints: 40,
    slides: [
      {
        type: 'info',
        title: 'Die Kernaussage des Bundesrats',
        content: 'Der Bundesrat befürwortet die Individualbesteuerung, weil sie die sogenannte "Heiratsstrafe" abschafft. Heute zahlen viele Ehepaare mehr Steuern als unverheiratete Paare in der gleichen wirtschaftlichen Situation.',
        highlight: 'Die Ungleichbehandlung aufgrund des Zivilstands soll beseitigt werden.'
      },
      {
        type: 'quote_reveal',
        title: 'Zentrale Zitate aus dem Video',
        instruction: 'Klicken Sie auf die Karten, um die Zitate der Finanzministerin aufzudecken:',
        quotes: [
          {
            author: 'Karin Keller-Sutter',
            role: 'Bundesrätin, Finanzministerin',
            quote: 'Die Beseitigung der Heiratsstrafe schafft einen Erwerbsanreiz. Das heisst, dass sich Leistung lohnt - auch bei den Steuern.',
            key_point: 'Erwerbsanreiz durch Steuerreform'
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
        title: 'Schlüsselbegriffe verstehen',
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
            definition: 'Je höher das Einkommen, desto höher der Steuersatz. Bei gemeinsamer Veranlagung von Ehepaaren steigt das Gesamteinkommen.',
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
          { text: 'Bis zu 44\'000 neue Vollzeitstellen (v.a. bei Ehefrauen)', correct: true },
          { text: 'Weniger Bürokratie bei den Steuerbehörden', correct: false },
          { text: 'Tiefere Mieten', correct: false }
        ],
        explanation: 'Der Bund rechnet damit, dass v.a. Ehefrauen mehr arbeiten würden, weil ihnen mit der individuellen Besteuerung mehr vom Lohn bleiben würde.',
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statements: [
          { 
            text: 'Der Bundesrat ist gegen die Individualbesteuerung.', 
            correct: false, 
            explanation: 'Falsch! Der Bundesrat befürwortet die Reform ausdrücklich.' 
          },
          { 
            text: 'Die Abstimmung findet am 18. Mai 2025 statt.', 
            correct: true, 
            explanation: 'Richtig! Nach dem erfolgreichen Referendum kommt es zur Volksabstimmung.' 
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

  // GEGNER:INNEN - MIT ECHTEM VIDEO
  {
    id: 'gegner',
    title: 'Position Gegner:innen',
    icon: 'Users',
    color: 'red',
    description: 'SVP, EVP, EDU, Mitte und die Kantone haben das Referendum ergriffen',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:76af4420-abff-4a34-8aab-9941193b223e',
    videoTitle: 'Kontra-Komitee präsentiert Argumente gegen die Individualbesteuerung',
    videoDuration: '2 Min',
    totalPoints: 40,
    slides: [
      {
        type: 'info',
        title: 'Wer sind die Gegner:innen?',
        content: 'Gegen die Individualbesteuerung haben die Kantone sowie ein Komitee bestehend aus SVP, EVP, EDU und der Mitte-Partei das Referendum ergriffen. Sie sehen in der Reform mehr Nachteile als Vorteile.',
        highlight: 'Die Gegner:innen warnen vor Steuerausfällen und neuen Ungerechtigkeiten.'
      },
      {
        type: 'quote_reveal',
        title: 'Argumente der Gegner:innen',
        instruction: 'Klicken Sie auf die Karten, um die Hauptargumente aufzudecken:',
        quotes: [
          {
            author: 'Kontra-Komitee',
            role: 'Referendumskomitee',
            quote: 'Die Individualbesteuerung schafft neue Ungerechtigkeit, indem sie vor allem Doppelverdiener mit hohen Einkommen belohnt.',
            key_point: 'Profiteure sind Gutverdienende'
          },
          {
            author: 'Kontra-Komitee',
            role: 'Referendumskomitee',
            quote: 'Die Reform ist bürokratisch. Zukünftig muss jedes Ehepaar zwei Steuererklärungen ausfüllen.',
            key_point: 'Mehr Aufwand für alle'
          },
          {
            author: 'Kantone',
            role: 'Finanzdirektorenkonferenz',
            quote: 'Die Reform führt zu massiven Steuerausfällen bei Bund und Kantonen.',
            key_point: 'Weniger Geld für öffentliche Aufgaben'
          }
        ],
        points: 10
      },
      {
        type: 'term_reveal',
        title: 'Kritische Begriffe verstehen',
        instruction: 'Klicken Sie auf die Begriffe, um die Kritikpunkte zu verstehen:',
        terms: [
          {
            term: 'Steuerausfälle',
            definition: 'Der Bund rechnet mit 630 Mio. Franken weniger pro Jahr allein bei der direkten Bundessteuer.',
            example: 'Dieses Geld fehlt dann für Bildung, Gesundheit, Infrastruktur etc.'
          },
          {
            term: 'Doppelverdiener-Bonus',
            definition: 'Die Kritik, dass vor allem gut verdienende Paare mit zwei Einkommen profitieren würden.',
            example: 'Ein Paar mit 2x 150\'000 profitiert mehr als eines mit 1x 100\'000.'
          },
          {
            term: 'Familienmodell',
            definition: 'Gegner:innen argumentieren, dass traditionelle Familienmodelle mit einem Hauptverdiener benachteiligt würden.',
            example: 'Einverdiener-Ehepaare hätten keinen Vorteil von der Reform.'
          }
        ],
        points: 10
      },
      {
        type: 'definition_match',
        title: 'Argumente zuordnen',
        instruction: 'Ordnen Sie die Argumente der richtigen Seite zu:',
        pairs: [
          { term: 'Beseitigung der Heiratsstrafe', definition: 'PRO' },
          { term: 'Steuerausfälle von 630 Mio.', definition: 'CONTRA' },
          { term: 'Erwerbsanreiz für Ehefrauen', definition: 'PRO' },
          { term: 'Mehr Bürokratie (2 Steuererklärungen)', definition: 'CONTRA' },
          { term: 'Gleichbehandlung aller Paare', definition: 'PRO' },
          { term: 'Bevorzugt Gutverdienende', definition: 'CONTRA' }
        ],
        points: 10
      },
      {
        type: 'quiz',
        title: 'Abschlussfrage',
        question: 'Welche Partei gehört NICHT zum Kontra-Komitee?',
        options: [
          { text: 'SVP', correct: false },
          { text: 'SP', correct: true },
          { text: 'EVP', correct: false },
          { text: 'Mitte', correct: false }
        ],
        explanation: 'Die SP unterstützt die Individualbesteuerung. Das Kontra-Komitee besteht aus SVP, EVP, EDU und Mitte, zusammen mit den Kantonen.',
        points: 10
      }
    ]
  },

  // PARLAMENT (Platzhalter)
  {
    id: 'parlament',
    title: 'Position Parlament',
    icon: 'Users',
    color: 'purple',
    description: 'Wie haben National- und Ständerat entschieden?',
    videoUrl: '[PLATZHALTER]',
    videoTitle: 'Parlamentsdebatte zur Individualbesteuerung',
    videoDuration: '3 Min',
    totalPoints: 30,
    slides: [
      {
        type: 'info',
        title: 'Entscheidung des Parlaments',
        content: '[PLATZHALTER: Hier kommt der Inhalt zur Parlamentsentscheidung. Wie haben National- und Ständerat abgestimmt? Welche Argumente wurden vorgebracht?]',
        highlight: '[PLATZHALTER: Kernaussage]'
      },
      {
        type: 'quiz',
        title: 'Verständnisfrage',
        question: '[PLATZHALTER: Frage zur Parlamentsentscheidung]',
        options: [
          { text: '[Option A]', correct: false },
          { text: '[Option B - korrekt]', correct: true },
          { text: '[Option C]', correct: false },
          { text: '[Option D]', correct: false }
        ],
        explanation: '[PLATZHALTER: Erklärung]',
        points: 15
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statements: [
          { text: '[PLATZHALTER: Aussage 1]', correct: true, explanation: '[Erklärung]' },
          { text: '[PLATZHALTER: Aussage 2]', correct: false, explanation: '[Erklärung]' }
        ],
        points: 15
      }
    ]
  },

  // KANTONE (Platzhalter)
  {
    id: 'kantone',
    title: 'Position Kantone',
    icon: 'MapPin',
    color: 'orange',
    description: 'Warum haben die Kantone das Referendum unterstützt?',
    videoUrl: '[PLATZHALTER]',
    videoTitle: 'Kantone gegen die Individualbesteuerung',
    videoDuration: '2 Min',
    totalPoints: 30,
    slides: [
      {
        type: 'info',
        title: 'Die Kantone als Gegner',
        content: '[PLATZHALTER: Hier kommen die spezifischen Argumente der Kantone. Steuerausfälle, Umsetzungsprobleme, föderale Bedenken etc.]',
        highlight: '[PLATZHALTER: Kernaussage]'
      },
      {
        type: 'term_reveal',
        title: 'Begriffe der Kantone',
        instruction: 'Klicken Sie, um die Begriffe zu verstehen:',
        terms: [
          { term: '[Begriff 1]', definition: '[Definition]' },
          { term: '[Begriff 2]', definition: '[Definition]' }
        ],
        points: 15
      },
      {
        type: 'quiz',
        title: 'Abschlussfrage',
        question: '[PLATZHALTER: Frage zu den Kantonen]',
        options: [
          { text: '[Option A]', correct: false },
          { text: '[Option B - korrekt]', correct: true },
          { text: '[Option C]', correct: false },
          { text: '[Option D]', correct: false }
        ],
        explanation: '[PLATZHALTER: Erklärung]',
        points: 15
      }
    ]
  },

  // EXPERT:INNEN (Platzhalter)
  {
    id: 'experten',
    title: 'Expert:innen-Stimmen',
    icon: 'GraduationCap',
    color: 'teal',
    description: 'Was sagen Fachleute zur Individualbesteuerung?',
    videoUrl: '[PLATZHALTER]',
    videoTitle: 'Expert:innen analysieren die Reform',
    videoDuration: '3 Min',
    totalPoints: 30,
    slides: [
      {
        type: 'info',
        title: 'Wissenschaftliche Einschätzungen',
        content: '[PLATZHALTER: Hier kommen Einschätzungen von Steuerexpert:innen, Ökonom:innen und Rechtswissenschaftler:innen.]',
        highlight: '[PLATZHALTER: Kernaussage]'
      },
      {
        type: 'quote_reveal',
        title: 'Expert:innen-Zitate',
        instruction: 'Klicken Sie, um die Einschätzungen aufzudecken:',
        quotes: [
          { author: '[Expert:in]', role: '[Institution]', quote: '[PLATZHALTER: Zitat]', key_point: '[Kernpunkt]' }
        ],
        points: 15
      },
      {
        type: 'quiz',
        title: 'Zusammenfassung',
        question: '[PLATZHALTER: Abschlussfrage]',
        options: [
          { text: '[Option A]', correct: false },
          { text: '[Option B - korrekt]', correct: true },
          { text: '[Option C]', correct: false },
          { text: '[Option D]', correct: false }
        ],
        explanation: '[PLATZHALTER: Erklärung]',
        points: 15
      }
    ]
  }
]

// ===========================================
// ICON MAP
// ===========================================
const IconMap: { [key: string]: any } = { Building2, Users, MapPin, GraduationCap }

// ===========================================
// SLIDE KOMPONENTEN
// ===========================================

// Info Slide
function InfoSlideComponent({ slide, onNext }: { slide: InfoSlide; onNext: () => void }) {
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{slide.title}</h3>
      <p className="text-gray-700 mb-4 leading-relaxed">{slide.content}</p>
      {slide.highlight && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-800 font-medium">{slide.highlight}</p>
          </div>
        </div>
      )}
      <button onClick={onNext} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
        Weiter <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  )
}

// Quote Reveal Slide
function QuoteRevealSlideComponent({ slide, onComplete }: { slide: QuoteRevealSlide; onComplete: (correct: boolean) => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const allRevealed = revealed.size === slide.quotes.length

  const toggleReveal = (index: number) => {
    const newRevealed = new Set(revealed)
    if (newRevealed.has(index)) {
      newRevealed.delete(index)
    } else {
      newRevealed.add(index)
    }
    setRevealed(newRevealed)
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{slide.title}</h3>
      <p className="text-gray-600 mb-4">{slide.instruction}</p>
      
      <div className="space-y-4 mb-6">
        {slide.quotes.map((q, index) => (
          <button
            key={index}
            onClick={() => toggleReveal(index)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              revealed.has(index) 
                ? 'border-teal-400 bg-teal-50' 
                : 'border-gray-200 bg-gray-50 hover:border-teal-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${revealed.has(index) ? 'bg-teal-500' : 'bg-gray-300'}`}>
                {revealed.has(index) ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
              </div>
              <div className="flex-1">
                {revealed.has(index) ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="h-4 w-4 text-teal-600" />
                      <span className="font-semibold text-gray-900">{q.author}</span>
                      <span className="text-sm text-gray-500">— {q.role}</span>
                    </div>
                    <p className="text-gray-700 italic mb-2">"{q.quote}"</p>
                    <div className="bg-teal-100 text-teal-800 text-sm px-3 py-1 rounded-full inline-block">
                      💡 {q.key_point}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">
                    <span className="font-medium">Zitat von {q.author}</span>
                    <p className="text-sm mt-1">Klicken zum Aufdecken...</p>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onComplete(true)}
        disabled={!allRevealed}
        className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {allRevealed ? 'Weiter' : `Noch ${slide.quotes.length - revealed.size} Zitat(e) aufdecken`}
      </button>
    </div>
  )
}

// Term Reveal Slide
function TermRevealSlideComponent({ slide, onComplete }: { slide: TermRevealSlide; onComplete: (correct: boolean) => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const allRevealed = revealed.size === slide.terms.length

  const toggleReveal = (index: number) => {
    const newRevealed = new Set(revealed)
    newRevealed.add(index)
    setRevealed(newRevealed)
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{slide.title}</h3>
      <p className="text-gray-600 mb-4">{slide.instruction}</p>
      
      <div className="space-y-3 mb-6">
        {slide.terms.map((t, index) => (
          <div key={index} className="border-2 border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleReveal(index)}
              className={`w-full text-left p-4 flex items-center justify-between ${
                revealed.has(index) ? 'bg-teal-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={`h-5 w-5 ${revealed.has(index) ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className="font-bold text-gray-900">{t.term}</span>
              </div>
              {revealed.has(index) ? (
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
              ) : (
                <span className="text-sm text-gray-500">Klicken →</span>
              )}
            </button>
            {revealed.has(index) && (
              <div className="p-4 bg-white border-t border-gray-100">
                <p className="text-gray-700 mb-2">{t.definition}</p>
                {t.example && (
                  <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-600">
                    <strong>Beispiel:</strong> {t.example}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => onComplete(true)}
        disabled={!allRevealed}
        className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {allRevealed ? 'Weiter' : `Noch ${slide.terms.length - revealed.size} Begriff(e) aufdecken`}
      </button>
    </div>
  )
}

// Definition Match Slide
function DefinitionMatchSlideComponent({ slide, onComplete }: { slide: DefinitionMatchSlide; onComplete: (correct: boolean) => void }) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  
  const options = [...new Set(slide.pairs.map(p => p.definition))]
  const allAnswered = Object.keys(answers).length === slide.pairs.length

  const handleAnswer = (index: number, value: string) => {
    if (showResults) return
    setAnswers({ ...answers, [index]: value })
  }

  const handleSubmit = () => {
    setShowResults(true)
    const allCorrect = slide.pairs.every((p, i) => answers[i] === p.definition)
    setTimeout(() => onComplete(allCorrect), 2000)
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{slide.title}</h3>
      <p className="text-gray-600 mb-4">{slide.instruction}</p>
      
      <div className="space-y-3 mb-6">
        {slide.pairs.map((pair, index) => {
          const answer = answers[index]
          const isCorrect = showResults && answer === pair.definition
          const isWrong = showResults && answer && answer !== pair.definition
          
          return (
            <div 
              key={index}
              className={`p-4 rounded-xl border-2 ${
                isCorrect ? 'border-green-400 bg-green-50' :
                isWrong ? 'border-red-400 bg-red-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <p className="font-medium text-gray-900 mb-3">{pair.term}</p>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(index, opt)}
                    disabled={showResults}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      answer === opt
                        ? showResults
                          ? opt === pair.definition ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-teal-500 text-white'
                        : showResults && opt === pair.definition
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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

      {!showResults && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50"
        >
          Antworten prüfen
        </button>
      )}
    </div>
  )
}

// Quiz Slide
function QuizSlideComponent({ slide, onComplete }: { slide: QuizSlide; onComplete: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSubmit = () => {
    if (selected === null) return
    setShowResult(true)
    setTimeout(() => onComplete(slide.options[selected].correct), 2000)
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{slide.title}</h3>
      <p className="text-lg text-gray-700 mb-4">{slide.question}</p>
      
      <div className="space-y-2 mb-6">
        {slide.options.map((opt, index) => {
          const isSelected = selected === index
          const isCorrect = opt.correct
          const showCorrect = showResult && isCorrect
          const showWrong = showResult && isSelected && !isCorrect
          
          return (
            <button
              key={index}
              onClick={() => !showResult && setSelected(index)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                showCorrect ? 'border-green-500 bg-green-50' :
                showWrong ? 'border-red-500 bg-red-50' :
                isSelected ? 'border-teal-500 bg-teal-50' :
                'border-gray-200 hover:border-teal-300'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                showCorrect ? 'bg-green-500 text-white' :
                showWrong ? 'bg-red-500 text-white' :
                isSelected ? 'bg-teal-500 text-white' : 'bg-gray-200'
              }`}>{String.fromCharCode(65 + index)}</span>
              <span className="flex-1">{opt.text}</span>
              {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {showWrong && <XCircle className="h-5 w-5 text-red-500" />}
            </button>
          )
        })}
      </div>

      {showResult ? (
        <div className={`p-4 rounded-lg ${slide.options[selected!].correct ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
          <p className="text-sm">{slide.explanation}</p>
        </div>
      ) : (
        <button onClick={handleSubmit} disabled={selected === null} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50">
          Antwort prüfen
        </button>
      )}
    </div>
  )
}

// True/False Slide
function TrueFalseSlideComponent({ slide, onComplete }: { slide: TrueFalseSlide; onComplete: (correct: boolean) => void }) {
  const [answers, setAnswers] = useState<{ [key: number]: boolean | null }>({})
  const [showResults, setShowResults] = useState(false)
  const allAnswered = Object.keys(answers).filter(k => answers[parseInt(k)] !== null).length === slide.statements.length

  const handleAnswer = (index: number, value: boolean) => {
    if (showResults) return
    setAnswers({ ...answers, [index]: value })
  }

  const handleSubmit = () => {
    setShowResults(true)
    const allCorrect = slide.statements.every((s, i) => answers[i] === s.correct)
    setTimeout(() => onComplete(allCorrect), 2500)
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{slide.title}</h3>
      
      <div className="space-y-4 mb-6">
        {slide.statements.map((s, index) => {
          const answer = answers[index]
          const isCorrect = showResults && answer === s.correct
          const isWrong = showResults && answer !== null && answer !== s.correct
          
          return (
            <div key={index} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-400 bg-green-50' : isWrong ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
              <p className="text-gray-800 mb-3">{s.text}</p>
              <div className="flex gap-2">
                <button onClick={() => handleAnswer(index, true)} disabled={showResults} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${answer === true ? showResults ? s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>✓ Richtig</button>
                <button onClick={() => handleAnswer(index, false)} disabled={showResults} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${answer === false ? showResults ? !s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>✗ Falsch</button>
              </div>
              {showResults && <p className={`mt-2 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{s.explanation}</p>}
            </div>
          )
        })}
      </div>

      {!showResults && <button onClick={handleSubmit} disabled={!allAnswered} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50">Antworten prüfen</button>}
    </div>
  )
}

// Video Section mit klarer Anforderung
function VideoSection({ section, onComplete }: { section: Section; onComplete: () => void }) {
  const [watched, setWatched] = useState(false)
  const [progress, setProgress] = useState(0)
  const isPlaceholder = section.videoUrl.includes('PLATZHALTER')
  const requiredTime = 30 // Sekunden

  useEffect(() => {
    if (!watched && !isPlaceholder) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= requiredTime) {
            setWatched(true)
            clearInterval(interval)
            return requiredTime
          }
          return prev + 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [watched, isPlaceholder])

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Video Anforderung Banner */}
      <div className={`px-4 py-3 flex items-center gap-3 ${watched ? 'bg-green-100' : 'bg-amber-100'}`}>
        {watched ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Video vollständig angeschaut</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-medium">Bitte schauen Sie das Video vollständig an, bevor Sie fortfahren</span>
          </>
        )}
      </div>

      {/* Video */}
      <div className="bg-gray-900">
        {isPlaceholder ? (
          <div className="aspect-video flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{section.videoTitle}</p>
              <p className="text-sm text-gray-500 mt-2">Video-Platzhalter ({section.videoDuration})</p>
              <button onClick={() => setWatched(true)} className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-semibold text-white">
                Als geschaut markieren (Test)
              </button>
            </div>
          </div>
        ) : (
          <iframe className="w-full aspect-video" src={section.videoUrl} title={section.videoTitle} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen />
        )}
      </div>

      {/* Progress */}
      {!isPlaceholder && !watched && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Fortschritt</span>
            <span>{Math.round((progress / requiredTime) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${(progress / requiredTime) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Weiter Button */}
      {watched && (
        <div className="p-4 border-t">
          <button onClick={onComplete} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
            Zu den interaktiven Aufgaben <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ===========================================
// HAUPTKOMPONENTE
// ===========================================

export default function ProContraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(true)
  const [currentSection, setCurrentSection] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(-1) // -1 = Video
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [sectionScores, setSectionScores] = useState<{ [key: string]: number }>({})
  const [totalScore, setTotalScore] = useState(0)

  const section = SECTIONS[currentSection]
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
            setCompletedSections(new Set(data.completedSections || []))
            setSectionScores(data.sectionScores || {})
            if (data.completedSections?.length > 0) setShowIntro(false)
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSlideComplete = async (correct: boolean) => {
    const isLast = currentSlide === section.slides.length - 1
    
    if (isLast) {
      const newCompleted = new Set(completedSections)
      newCompleted.add(section.id)
      setCompletedSections(newCompleted)
      
      const newScores = { ...sectionScores, [section.id]: section.totalPoints }
      setSectionScores(newScores)
      
      const newTotal = Object.values(newScores).reduce((s, v) => s + v, 0)
      setTotalScore(newTotal)
      
      await saveProgress(newTotal, newCompleted, newScores)
      
      if (currentSection < SECTIONS.length - 1) {
        setCurrentSection(currentSection + 1)
        setCurrentSlide(-1)
      }
    } else {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const saveProgress = async (score: number, completed: Set<string>, scores: typeof sectionScores) => {
    const user = auth.currentUser
    if (!user) return
    
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        const isComplete = completed.size === SECTIONS.length
        
        modules.procontra = {
          completed: isComplete,
          score,
          progress: Math.round((completed.size / SECTIONS.length) * 100),
          completedSections: Array.from(completed),
          sectionScores: scores,
          lastUpdated: new Date().toISOString()
        }
        
        let totalPoints = 0
        Object.keys(modules).forEach(k => { if (modules[k].score) totalPoints += modules[k].score })
        
        const allModules = ['grundlagen', 'vertiefung', 'procontra', 'lernkontrolle', 'umfrage']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)
        
        await updateDoc(userRef, { modules, totalPoints, overallProgress })
        
        if (isComplete && !userData.badges?.procontra) {
          await updateDoc(userRef, { [`badges.procontra`]: { moduleId: 'procontra', moduleName: '3. Pro- und Contra', lerncode: userData.code, issuedAt: new Date().toISOString() } })
        }
      }
    } catch (e) { console.error(e) }
  }

  const renderSlide = () => {
    if (currentSlide === -1) return <VideoSection section={section} onComplete={() => setCurrentSlide(0)} />
    
    const slide = section.slides[currentSlide]
    switch (slide.type) {
      case 'info': return <InfoSlideComponent slide={slide} onNext={() => handleSlideComplete(true)} />
      case 'quiz': return <QuizSlideComponent slide={slide} onComplete={handleSlideComplete} />
      case 'truefalse': return <TrueFalseSlideComponent slide={slide} onComplete={handleSlideComplete} />
      case 'quote_reveal': return <QuoteRevealSlideComponent slide={slide} onComplete={handleSlideComplete} />
      case 'term_reveal': return <TermRevealSlideComponent slide={slide} onComplete={handleSlideComplete} />
      case 'definition_match': return <DefinitionMatchSlideComponent slide={slide} onComplete={handleSlideComplete} />
      default: return null
    }
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>

  const isComplete = completedSections.size === SECTIONS.length

  // Intro
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <header className="bg-white shadow-md"><div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /><span>Zurück</span></button>
          <div className="text-teal-600 font-semibold">0 / {maxPoints} Punkte</div>
        </div></header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pro und Contra</h1>
            <h2 className="text-xl text-teal-600 font-semibold mb-6">Individualbesteuerung</h2>
            
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6">
              <h3 className="font-bold text-amber-900 mb-2">📣 Bei Abstimmungen gehen die Meinungen auseinander</h3>
              <p className="text-amber-800">In der direkten Demokratie vertreten verschiedene Akteure unterschiedliche Standpunkte. Der Bundesrat, das Parlament, die Kantone, Parteien und Expert:innen haben jeweils ihre eigenen Argumente. Lernen Sie alle Seiten kennen!</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
              <h3 className="font-bold text-blue-900 mb-2">🎬 So funktioniert dieses Modul</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Schauen Sie jedes Video <strong>vollständig</strong> an</li>
                <li>• Bearbeiten Sie die interaktiven Aufgaben</li>
                <li>• Decken Sie Zitate und Begriffe auf</li>
                <li>• Testen Sie Ihr Verständnis mit Quizfragen</li>
              </ul>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">Sie werden folgende Perspektiven kennenlernen:</h3>
            <div className="space-y-3">
              {SECTIONS.map((s) => {
                const Icon = IconMap[s.icon] || Users
                const colorMap: { [k: string]: string } = { blue: 'bg-blue-100 text-blue-600', red: 'bg-red-100 text-red-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600', teal: 'bg-teal-100 text-teal-600' }
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${colorMap[s.color]}`}><Icon className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{s.title}</span>
                      <span className="text-gray-500 text-sm ml-2">({s.totalPoints} Punkte)</span>
                    </div>
                    {s.videoUrl.includes('PLATZHALTER') && <span className="text-xs text-gray-400">Platzhalter</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <button onClick={() => setShowIntro(false)} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-xl font-semibold rounded-xl shadow-lg flex items-center justify-center gap-3">
            Modul starten <ChevronRight className="h-6 w-6" />
          </button>
        </main>
      </div>
    )
  }

  // Main Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /><span>Zurück</span></button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-1"><Clock className="h-4 w-4" /><span>~20 Min</span></div>
              <div className={`flex items-center gap-2 font-semibold ${isComplete ? 'text-green-600' : 'text-teal-600'}`}><Award className="h-5 w-5" /><span>{totalScore} / {maxPoints}</span></div>
            </div>
          </div>
          <div className="flex gap-1">
            {SECTIONS.map((s, i) => (
              <div key={s.id} className={`flex-1 h-2 rounded-full ${completedSections.has(s.id) ? 'bg-green-500' : i === currentSection ? 'bg-teal-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Section Header */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex items-center gap-3">
            {(() => { const Icon = IconMap[section.icon] || Users; return <Icon className="h-6 w-6 text-gray-600" /> })()}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
            <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{section.totalPoints} P</span>
          </div>
          {currentSlide >= 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Aufgabe {currentSlide + 1} / {section.slides.length}</span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full"><div className="h-full bg-teal-400 rounded-full transition-all" style={{ width: `${((currentSlide + 1) / section.slides.length) * 100}%` }} /></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {renderSlide()}
        </div>

        {/* Completion */}
        {isComplete && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 mt-6 text-white text-center">
            <Award className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-2">🎉 Modul abgeschlossen!</h3>
            <p className="text-lg">Sie haben {totalScore} von {maxPoints} Punkten erreicht.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100">Zurück zum Dashboard</button>
          </div>
        )}
      </main>
    </div>
  )
}
