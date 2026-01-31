import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Award, Clock, XCircle, 
  Play, Building2, Users, MapPin, ThumbsUp, ThumbsDown,
  Eye, EyeOff, Quote, BookOpen, Lightbulb, AlertCircle, ChevronRight, X
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
  videoDuration: string
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
    videoDuration: '3 Min',
    totalPoints: 40,
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
    videoDuration: '2 Min',
    totalPoints: 30,
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

  // 3. KOMITEE GEGNER:INNEN (mit Inhalten aus TXT-Transkript)
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
    videoDuration: '2 Min',
    totalPoints: 40,
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

  // 4. KANTONE (Kantonsreferendum)
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
    videoDuration: '2 Min',
    totalPoints: 30,
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
    newRevealed.add(index)
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
                : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full flex-shrink-0 ${revealed.has(index) ? 'bg-teal-500' : 'bg-gray-300'}`}>
                {revealed.has(index) ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                {revealed.has(index) ? (
                  <>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Quote className="h-4 w-4 text-teal-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">{q.author}</span>
                    </div>
                    <p className="text-gray-700 italic mb-2 text-sm">"{q.quote}"</p>
                    <div className="bg-teal-100 text-teal-800 text-xs px-3 py-1 rounded-full inline-block">
                      💡 {q.key_point}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">
                    <span className="font-medium">Zitat {index + 1}</span>
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
        {allRevealed ? 'Weiter' : `Noch ${slide.quotes.length - revealed.size} aufdecken`}
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
                <BookOpen className={`h-5 w-5 flex-shrink-0 ${revealed.has(index) ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className="font-bold text-gray-900">{t.term}</span>
              </div>
              {revealed.has(index) ? (
                <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {revealed.has(index) && (
              <div className="p-4 bg-white border-t border-gray-100">
                <p className="text-gray-700 mb-2 text-sm">{t.definition}</p>
                {t.example && (
                  <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600">
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
        {allRevealed ? 'Weiter' : `Noch ${slide.terms.length - revealed.size} aufdecken`}
      </button>
    </div>
  )
}

// Definition Match Slide
function DefinitionMatchSlideComponent({ slide, onComplete }: { slide: DefinitionMatchSlide; onComplete: (correct: boolean) => void }) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  
  const options = Array.from(new Set(slide.pairs.map(p => p.definition)))
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
              className={`p-3 rounded-xl border-2 ${
                isCorrect ? 'border-green-400 bg-green-50' :
                isWrong ? 'border-red-400 bg-red-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <p className="font-medium text-gray-900 mb-2 text-sm">{pair.term}</p>
              <div className="flex gap-2">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(index, opt)}
                    disabled={showResults}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
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
      <p className="text-gray-700 mb-4">{slide.question}</p>
      
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
              className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                showCorrect ? 'border-green-500 bg-green-50' :
                showWrong ? 'border-red-500 bg-red-50' :
                isSelected ? 'border-teal-500 bg-teal-50' :
                'border-gray-200 hover:border-teal-300'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                showCorrect ? 'bg-green-500 text-white' :
                showWrong ? 'bg-red-500 text-white' :
                isSelected ? 'bg-teal-500 text-white' : 'bg-gray-200'
              }`}>{String.fromCharCode(65 + index)}</span>
              <span className="flex-1 text-sm">{opt.text}</span>
              {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
              {showWrong && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
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
              <p className="text-gray-800 mb-3 text-sm">{s.text}</p>
              <div className="flex gap-2">
                <button onClick={() => handleAnswer(index, true)} disabled={showResults} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${answer === true ? showResults ? s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>✓ Richtig</button>
                <button onClick={() => handleAnswer(index, false)} disabled={showResults} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${answer === false ? showResults ? !s.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : 'bg-teal-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>✗ Falsch</button>
              </div>
              {showResults && <p className={`mt-2 text-xs ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{s.explanation}</p>}
            </div>
          )
        })}
      </div>

      {!showResults && <button onClick={handleSubmit} disabled={!allAnswered} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50">Antworten prüfen</button>}
    </div>
  )
}

// Video Section
function VideoSection({ section, onComplete }: { section: Section; onComplete: () => void }) {
  const [watched, setWatched] = useState(false)
  const [progress, setProgress] = useState(0)
  const isPlaceholder = section.videoUrl.includes('PLATZHALTER')
  const requiredTime = 15

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
    <div>
      {/* Video */}
      <div className="bg-gray-900">
        {isPlaceholder ? (
          <div className="aspect-video flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{section.videoTitle}</p>
              <p className="text-sm text-gray-500 mt-2">Video-Platzhalter</p>
              <button onClick={() => setWatched(true)} className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-semibold text-white">
                Überspringen
              </button>
            </div>
          </div>
        ) : (
          <iframe className="w-full aspect-video" src={section.videoUrl} title={section.videoTitle} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen />
        )}
      </div>

      {/* Progress / Status */}
      <div className={`px-4 py-3 ${watched ? 'bg-green-100' : 'bg-amber-50'}`}>
        {watched ? (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Video angeschaut</span>
          </div>
        ) : !isPlaceholder ? (
          <div>
            <div className="flex items-center justify-between text-sm text-amber-700 mb-1">
              <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Bitte Video anschauen</span>
              <span>{Math.round((progress / requiredTime) * 100)}%</span>
            </div>
            <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${(progress / requiredTime) * 100}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Weiter Button */}
      {watched && (
        <div className="p-4">
          <button onClick={onComplete} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
            Zu den Aufgaben <ArrowRight className="h-5 w-5" />
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
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(-1)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [sectionScores, setSectionScores] = useState<{ [key: string]: number }>({})
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
            setCompletedSections(new Set(data.completedSections || []))
            setSectionScores(data.sectionScores || {})
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSlideComplete = async (correct: boolean) => {
    const section = SECTIONS.find(s => s.id === activeSection)!
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
      
      setActiveSection(null)
      setCurrentSlide(-1)
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
    const section = SECTIONS.find(s => s.id === activeSection)!
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

  // Einzelne Sektion anzeigen
  if (activeSection) {
    const section = SECTIONS.find(s => s.id === activeSection)!
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        {/* Header */}
        <header className={`bg-gradient-to-r ${section.colorClass} text-white sticky top-0 z-10`}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => { setActiveSection(null); setCurrentSlide(-1) }} className="flex items-center gap-2 text-white/80 hover:text-white">
                <X className="h-5 w-5" /><span>Schliessen</span>
              </button>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" /><span className="font-semibold">{section.totalPoints} Punkte</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2">{section.title}</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Einleitung (vor Video) */}
          {currentSlide === -1 && (
            <div className="bg-white rounded-xl shadow-md p-4 mb-4">
              <p className="text-gray-700">{section.intro}</p>
            </div>
          )}

          {/* Aufgaben-Fortschritt */}
          {currentSlide >= 0 && (
            <div className="bg-white rounded-t-xl shadow-md px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Aufgabe {currentSlide + 1} / {section.slides.length}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div className={`h-full ${section.bgColor} rounded-full transition-all`} style={{ width: `${((currentSlide + 1) / section.slides.length) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`bg-white ${currentSlide >= 0 ? 'rounded-b-xl' : 'rounded-xl'} shadow-md overflow-hidden`}>
            {renderSlide()}
          </div>
        </main>
      </div>
    )
  }

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
          <p className="text-gray-600">Verschiedene Positionen zur Individualbesteuerung</p>
        </div>

        {/* Intro */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6">
          <p className="text-amber-800">
            <strong>📣 Bei Abstimmungen gehen die Meinungen auseinander.</strong><br />
            Lernen Sie die verschiedenen Akteure und ihre Argumente kennen. Klicken Sie auf eine Karte, um zu starten.
          </p>
        </div>

        {/* Klickbare Akteur-Karten */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {SECTIONS.map((section) => {
            const Icon = IconMap[section.icon] || Users
            const isDone = completedSections.has(section.id)
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                  isDone 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isDone ? 'bg-green-500' : section.bgColor}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{section.shortTitle}</h3>
                    <p className="text-xs text-gray-500">{section.totalPoints} Punkte</p>
                  </div>
                  {isDone && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                </div>
                {!isDone && (
                  <p className="text-xs text-gray-500 line-clamp-2">{section.intro.substring(0, 80)}...</p>
                )}
              </button>
            )
          })}
        </div>

        {/* Fortschritt */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Fortschritt</span>
            <span className="text-sm font-bold text-teal-600">{completedSections.size} / {SECTIONS.length}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" style={{ width: `${(completedSections.size / SECTIONS.length) * 100}%` }} />
          </div>
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
