import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, CheckCircle2, Award, Clock, XCircle, ChevronLeft, ChevronRight,
  Play, Building2, Users, MapPin, GraduationCap, Scale, ArrowRight
} from 'lucide-react'

// ============================================
// KONFIGURATION - Perspektiven und Inhalte
// ============================================

interface SlideContent {
  type: 'info' | 'quiz' | 'truefalse' | 'fillblank'
  title: string
  content?: string
  question?: string
  options?: { text: string; correct: boolean }[]
  statement?: string
  isTrue?: boolean
  points?: number
}

interface Perspective {
  id: string
  title: string
  icon: string
  color: string
  videoUrl: string
  videoTitle: string
  description: string
  slides: SlideContent[]
}

const perspectives: Perspective[] = [
  // 1. BUNDESRAT
  {
    id: 'bundesrat',
    title: 'Bundesrat',
    icon: 'Building2',
    color: 'blue',
    videoUrl: 'https://www.srf.ch/play/embed?urn=urn:srf:video:77a83d61-aeb0-4984-8e7b-37291a89b62c&startTime=12',
    videoTitle: 'Bundesrat zur Individualbesteuerung',
    description: 'Die Position des Bundesrats und der Finanzministerin',
    slides: [
      {
        type: 'info',
        title: 'Die Position des Bundesrats',
        content: 'Der Bundesrat befürwortet die Individualbesteuerung. Finanzministerin Karin Keller-Sutter betont: Die Beseitigung der Heiratsstrafe schafft einen Erwerbsanreiz - Leistung soll sich auch bei den Steuern lohnen. Bisher füllen Ehepaare eine gemeinsame Steuererklärung aus und ihre Einkommen werden zusammengezählt. Dadurch geraten viele in eine höhere Steuerprogression.'
      },
      {
        type: 'quiz',
        title: 'Verständnisfrage',
        question: 'Was ist laut Bundesrat das Hauptproblem des aktuellen Systems?',
        options: [
          { text: 'Zu wenig Steuereinnahmen', correct: false },
          { text: 'Ungleichbehandlung je nach Zivilstand', correct: true },
          { text: 'Zu komplizierte Formulare', correct: false },
          { text: 'Fehlende Digitalisierung', correct: false }
        ],
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statement: 'Mit der Individualbesteuerung würden beide Ehepartner separat besteuert - genau wie Nicht-Verheiratete.',
        isTrue: true,
        points: 10
      },
      {
        type: 'fillblank',
        title: 'Lückentext',
        question: 'Der Bund schätzt, dass durch die Individualbesteuerung bis zu _____ Vollzeitstellen entstehen könnten.',
        options: [
          { text: '14\'000', correct: false },
          { text: '44\'000', correct: true },
          { text: '84\'000', correct: false },
          { text: '4\'000', correct: false }
        ],
        points: 10
      },
      {
        type: 'quiz',
        title: 'Abschlussfrage',
        question: 'Warum unterstützt der Bundesrat die Reform trotz Steuerausfällen?',
        options: [
          { text: 'Weil die Kantone es fordern', correct: false },
          { text: 'Weil sie Erwerbsanreize schafft und Leistung belohnt', correct: true },
          { text: 'Weil sie die Bürokratie reduziert', correct: false },
          { text: 'Weil sie mehr Steuereinnahmen bringt', correct: false }
        ],
        points: 10
      }
    ]
  },
  
  // 2. PARLAMENT
  {
    id: 'parlament',
    title: 'Parlament',
    icon: 'Users',
    color: 'purple',
    videoUrl: '[PLATZHALTER_VIDEO_URL_PARLAMENT]',
    videoTitle: 'Debatte im Parlament',
    description: 'Die Diskussion und Entscheidung im National- und Ständerat',
    slides: [
      {
        type: 'info',
        title: 'Die Parlamentsdebatte',
        content: '[PLATZHALTER: Hier kommt eine Zusammenfassung der Parlamentsdebatte zur Individualbesteuerung. Wie haben National- und Ständerat abgestimmt? Welche Argumente wurden vorgebracht?]'
      },
      {
        type: 'quiz',
        title: 'Verständnisfrage',
        question: '[PLATZHALTER: Frage zur Parlamentsdebatte]',
        options: [
          { text: '[Option A]', correct: false },
          { text: '[Option B - korrekt]', correct: true },
          { text: '[Option C]', correct: false },
          { text: '[Option D]', correct: false }
        ],
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statement: '[PLATZHALTER: Aussage zur Parlamentsentscheidung]',
        isTrue: true,
        points: 10
      },
      {
        type: 'fillblank',
        title: 'Abstimmungsergebnis',
        question: '[PLATZHALTER: Frage zum Abstimmungsergebnis im Parlament]',
        options: [
          { text: '[Falsche Antwort]', correct: false },
          { text: '[Richtige Antwort]', correct: true },
          { text: '[Falsche Antwort]', correct: false },
          { text: '[Falsche Antwort]', correct: false }
        ],
        points: 10
      }
    ]
  },
  
  // 3. KANTONE (Gegner)
  {
    id: 'kantone',
    title: 'Kantone',
    icon: 'MapPin',
    color: 'red',
    videoUrl: '[PLATZHALTER_VIDEO_URL_KANTONE]',
    videoTitle: 'Position der Kantone',
    description: 'Warum die Kantone das Referendum ergriffen haben',
    slides: [
      {
        type: 'info',
        title: 'Die Kantone als Gegner',
        content: '[PLATZHALTER: Die Kantone haben zusammen mit Parteien das Referendum ergriffen. Hier werden ihre Hauptargumente dargestellt: Steuerausfälle, Umsetzungsprobleme, Föderalismus-Bedenken etc.]'
      },
      {
        type: 'quiz',
        title: 'Steuerausfälle',
        question: 'Mit welchem jährlichen Steuerausfall rechnet der Bund bei der direkten Bundessteuer?',
        options: [
          { text: '130 Mio. Franken', correct: false },
          { text: '330 Mio. Franken', correct: false },
          { text: '630 Mio. Franken', correct: true },
          { text: '1.3 Mia. Franken', correct: false }
        ],
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statement: 'Die Individualbesteuerung würde bedeuten, dass jedes Ehepaar zwei Steuererklärungen ausfüllen muss.',
        isTrue: true,
        points: 10
      },
      {
        type: 'quiz',
        title: 'Gegenargumente',
        question: '[PLATZHALTER: Frage zu den Argumenten der Kantone]',
        options: [
          { text: '[Option A]', correct: false },
          { text: '[Option B - korrekt]', correct: true },
          { text: '[Option C]', correct: false },
          { text: '[Option D]', correct: false }
        ],
        points: 10
      }
    ]
  },
  
  // 4. GEGNER:INNEN ALLGEMEIN
  {
    id: 'gegner',
    title: 'Gegner:innen',
    icon: 'Users',
    color: 'orange',
    videoUrl: '[PLATZHALTER_VIDEO_URL_GEGNER]',
    videoTitle: 'Stimmen der Gegner:innen',
    description: 'SVP, EVP, EDU, Mitte und weitere Kritiker:innen',
    slides: [
      {
        type: 'info',
        title: 'Die Argumente der Gegner:innen',
        content: '[PLATZHALTER: Ein Komitee von SVP, EVP, EDU und Mitte argumentiert: Die Individualbesteuerung schafft neue Ungerechtigkeiten, belohnt vor allem Doppelverdiener mit hohen Einkommen und ist bürokratisch.]'
      },
      {
        type: 'quiz',
        title: 'Kritikpunkte',
        question: '[PLATZHALTER: Frage zu den Gegenargumenten]',
        options: [
          { text: '[Option A]', correct: false },
          { text: '[Option B - korrekt]', correct: true },
          { text: '[Option C]', correct: false },
          { text: '[Option D]', correct: false }
        ],
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statement: '[PLATZHALTER: Kritische Aussage der Gegner]',
        isTrue: false,
        points: 10
      },
      {
        type: 'fillblank',
        title: 'Wer sind die Gegner?',
        question: 'Das Referendum wurde unter anderem von folgenden Parteien unterstützt: SVP, EVP, EDU und _____.',
        options: [
          { text: 'FDP', correct: false },
          { text: 'Mitte', correct: true },
          { text: 'SP', correct: false },
          { text: 'Grüne', correct: false }
        ],
        points: 10
      }
    ]
  },
  
  // 5. EXPERT:INNEN
  {
    id: 'experten',
    title: 'Expert:innen',
    icon: 'GraduationCap',
    color: 'teal',
    videoUrl: '[PLATZHALTER_VIDEO_URL_EXPERTEN]',
    videoTitle: 'Einschätzungen von Expert:innen',
    description: 'Wissenschaftliche Perspektiven und Analysen',
    slides: [
      {
        type: 'info',
        title: 'Was sagen Expert:innen?',
        content: '[PLATZHALTER: Hier kommen Einschätzungen von Steuerexpert:innen, Ökonom:innen und Rechtswissenschaftler:innen zur Individualbesteuerung.]'
      },
      {
        type: 'quiz',
        title: 'Expertenmeinung',
        question: '[PLATZHALTER: Frage zu Expertenanalysen]',
        options: [
          { text: '[Option A]', correct: false },
          { text: '[Option B]', correct: false },
          { text: '[Option C - korrekt]', correct: true },
          { text: '[Option D]', correct: false }
        ],
        points: 10
      },
      {
        type: 'truefalse',
        title: 'Richtig oder Falsch?',
        statement: '[PLATZHALTER: Expertenaussage zur Überprüfung]',
        isTrue: true,
        points: 10
      },
      {
        type: 'fillblank',
        title: 'Faktencheck',
        question: '[PLATZHALTER: Lückentext mit Expertenzitat oder Statistik]',
        options: [
          { text: '[Falsche Zahl]', correct: false },
          { text: '[Richtige Zahl]', correct: true },
          { text: '[Falsche Zahl]', correct: false },
          { text: '[Falsche Zahl]', correct: false }
        ],
        points: 10
      }
    ]
  }
]

// Icon Komponente
const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  const icons: { [key: string]: any } = { Building2, Users, MapPin, GraduationCap, Scale }
  const Icon = icons[name] || Scale
  return <Icon className={className} />
}

// Info Slide
const InfoSlide = ({ slide }: { slide: SlideContent }) => (
  <div className="p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">{slide.title}</h3>
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{slide.content}</p>
    </div>
  </div>
)

// Quiz Slide
const QuizSlide = ({ slide, onAnswer, answered }: { slide: SlideContent; onAnswer: (c: boolean, p: number) => void; answered: boolean }) => {
  const [selected, setSelected] = useState<number | null>(null)
  
  const handleSubmit = () => {
    if (selected === null) return
    const correct = slide.options![selected].correct
    onAnswer(correct, correct ? (slide.points || 10) : 0)
  }
  
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{slide.title}</h3>
      <p className="text-lg text-gray-800 mb-6">{slide.question}</p>
      <div className="space-y-3 mb-6">
        {slide.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => !answered && setSelected(index)}
            disabled={answered}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
              answered && option.correct ? 'border-green-500 bg-green-50' :
              answered && selected === index && !option.correct ? 'border-red-500 bg-red-50' :
              selected === index ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              answered && option.correct ? 'bg-green-500 text-white' :
              answered && selected === index && !option.correct ? 'bg-red-500 text-white' :
              selected === index ? 'bg-teal-500 text-white' : 'bg-gray-200'
            }`}>{String.fromCharCode(65 + index)}</span>
            <span className="flex-1">{option.text}</span>
            {answered && option.correct && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {answered && selected === index && !option.correct && <XCircle className="h-5 w-5 text-red-500" />}
          </button>
        ))}
      </div>
      {!answered && <button onClick={handleSubmit} disabled={selected === null} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50">Antwort prüfen</button>}
      {answered && <div className={`p-3 rounded-lg ${selected !== null && slide.options![selected].correct ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{selected !== null && slide.options![selected].correct ? '✓ Richtig!' : '✗ Leider falsch.'}</div>}
    </div>
  )
}

// True/False Slide
const TrueFalseSlide = ({ slide, onAnswer, answered }: { slide: SlideContent; onAnswer: (c: boolean, p: number) => void; answered: boolean }) => {
  const [selected, setSelected] = useState<boolean | null>(null)
  
  const handleSelect = (value: boolean) => {
    if (answered) return
    setSelected(value)
    onAnswer(value === slide.isTrue, value === slide.isTrue ? (slide.points || 10) : 0)
  }
  
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{slide.title}</h3>
      <div className="bg-gray-100 p-4 rounded-lg mb-6"><p className="text-lg text-gray-800 italic">"{slide.statement}"</p></div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => handleSelect(true)} disabled={answered} className={`p-6 rounded-lg border-2 transition-all ${answered ? slide.isTrue ? 'border-green-500 bg-green-50' : selected === true ? 'border-red-500 bg-red-50' : 'border-gray-200' : selected === true ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}>
          <CheckCircle2 className={`h-8 w-8 mx-auto mb-2 ${answered && slide.isTrue ? 'text-green-500' : selected === true ? 'text-teal-500' : 'text-gray-400'}`} />
          <span className="font-semibold block text-center">Richtig</span>
        </button>
        <button onClick={() => handleSelect(false)} disabled={answered} className={`p-6 rounded-lg border-2 transition-all ${answered ? !slide.isTrue ? 'border-green-500 bg-green-50' : selected === false ? 'border-red-500 bg-red-50' : 'border-gray-200' : selected === false ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}>
          <XCircle className={`h-8 w-8 mx-auto mb-2 ${answered && !slide.isTrue ? 'text-green-500' : selected === false ? 'text-teal-500' : 'text-gray-400'}`} />
          <span className="font-semibold block text-center">Falsch</span>
        </button>
      </div>
      {answered && <div className={`mt-4 p-3 rounded-lg ${selected === slide.isTrue ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{selected === slide.isTrue ? '✓ Richtig!' : '✗ Leider falsch.'}</div>}
    </div>
  )
}

// Fillblank Slide
const FillblankSlide = ({ slide, onAnswer, answered }: { slide: SlideContent; onAnswer: (c: boolean, p: number) => void; answered: boolean }) => {
  const [selected, setSelected] = useState<number | null>(null)
  
  const handleSubmit = () => {
    if (selected === null) return
    const correct = slide.options![selected].correct
    onAnswer(correct, correct ? (slide.points || 10) : 0)
  }
  
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{slide.title}</h3>
      <p className="text-lg text-gray-800 mb-6">{slide.question}</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {slide.options?.map((option, index) => (
          <button key={index} onClick={() => !answered && setSelected(index)} disabled={answered} className={`p-4 rounded-lg border-2 font-semibold transition-all ${answered && option.correct ? 'border-green-500 bg-green-50 text-green-800' : answered && selected === index && !option.correct ? 'border-red-500 bg-red-50 text-red-800' : selected === index ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-gray-200 hover:border-teal-300'}`}>{option.text}</button>
        ))}
      </div>
      {!answered && <button onClick={handleSubmit} disabled={selected === null} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50">Antwort prüfen</button>}
      {answered && <div className={`p-3 rounded-lg ${selected !== null && slide.options![selected].correct ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{selected !== null && slide.options![selected].correct ? '✓ Richtig!' : '✗ Leider falsch.'}</div>}
    </div>
  )
}

// Perspektive View
const PerspectiveView = ({ perspective, onComplete }: { perspective: Perspective; onComplete: (p: number) => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [videoWatched, setVideoWatched] = useState(false)
  const [slideAnswers, setSlideAnswers] = useState<{ [key: number]: { correct: boolean; points: number } }>({})
  const [totalPoints, setTotalPoints] = useState(0)
  
  const handleSlideAnswer = (i: number, c: boolean, p: number) => {
    const newAnswers = { ...slideAnswers, [i]: { correct: c, points: p } }
    setSlideAnswers(newAnswers)
    setTotalPoints(Object.values(newAnswers).reduce((s, a) => s + a.points, 0))
  }
  
  const colorClasses: { [key: string]: string } = { blue: 'bg-blue-500', purple: 'bg-purple-500', red: 'bg-red-500', orange: 'bg-orange-500', teal: 'bg-teal-500' }
  const isLastSlide = currentSlide === perspective.slides.length - 1
  const currentSlideAnswered = !!slideAnswers[currentSlide] || perspective.slides[currentSlide].type === 'info'
  const allSlidesCompleted = perspective.slides.every((s, i) => s.type === 'info' || slideAnswers[i])

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className={`${colorClasses[perspective.color]} p-4 text-white`}>
        <div className="flex items-center gap-3">
          <IconComponent name={perspective.icon} className="h-6 w-6" />
          <h2 className="text-xl font-bold">{perspective.title}</h2>
          <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">{totalPoints} Punkte</span>
        </div>
      </div>
      
      {!videoWatched ? (
        <div>
          <div className="aspect-video bg-gray-900">
            {perspective.videoUrl.startsWith('[') ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center"><Play className="h-16 w-16 mx-auto mb-4 opacity-50" /><p className="text-lg">{perspective.videoTitle}</p><p className="text-sm mt-2 text-gray-500">Video-Platzhalter</p></div>
              </div>
            ) : (
              <iframe className="w-full h-full" src={perspective.videoUrl} title={perspective.videoTitle} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen />
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-600 mb-3">{perspective.description}</p>
            <button onClick={() => setVideoWatched(true)} className={`w-full py-3 ${colorClasses[perspective.color]} hover:opacity-90 text-white font-semibold rounded-lg flex items-center justify-center gap-2`}>
              <CheckCircle2 className="h-5 w-5" />Video angeschaut - Weiter zu den Aufgaben
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="px-4 py-3 bg-gray-100 border-b flex items-center gap-2">
            {perspective.slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i === currentSlide ? `${colorClasses[perspective.color]} text-white` : slideAnswers[i] ? slideAnswers[i].correct ? 'bg-green-500 text-white' : 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}`}>{i + 1}</button>
            ))}
          </div>
          <div className="min-h-[350px]">
            {perspective.slides[currentSlide].type === 'info' && <InfoSlide slide={perspective.slides[currentSlide]} />}
            {perspective.slides[currentSlide].type === 'quiz' && <QuizSlide slide={perspective.slides[currentSlide]} onAnswer={(c, p) => handleSlideAnswer(currentSlide, c, p)} answered={!!slideAnswers[currentSlide]} />}
            {perspective.slides[currentSlide].type === 'truefalse' && <TrueFalseSlide slide={perspective.slides[currentSlide]} onAnswer={(c, p) => handleSlideAnswer(currentSlide, c, p)} answered={!!slideAnswers[currentSlide]} />}
            {perspective.slides[currentSlide].type === 'fillblank' && <FillblankSlide slide={perspective.slides[currentSlide]} onAnswer={(c, p) => handleSlideAnswer(currentSlide, c, p)} answered={!!slideAnswers[currentSlide]} />}
          </div>
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"><ChevronLeft className="h-5 w-5" />Zurück</button>
            {isLastSlide && allSlidesCompleted ? (
              <button onClick={() => onComplete(totalPoints)} className={`flex items-center gap-2 px-6 py-2 ${colorClasses[perspective.color]} text-white rounded-lg font-semibold`}>Abschliessen<CheckCircle2 className="h-5 w-5" /></button>
            ) : (
              <button onClick={() => setCurrentSlide(Math.min(perspective.slides.length - 1, currentSlide + 1))} disabled={!currentSlideAnswered} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Weiter<ChevronRight className="h-5 w-5" /></button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Hauptkomponente
export default function ProContraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activePerspective, setActivePerspective] = useState<string | null>(null)
  const [completedPerspectives, setCompletedPerspectives] = useState<{ [key: string]: { points: number } }>({})
  const [totalScore, setTotalScore] = useState(0)

  useEffect(() => {
    const loadProgress = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const moduleData = userDoc.data().modules?.procontra
          if (moduleData) { setTotalScore(moduleData.score || 0); setCompletedPerspectives(moduleData.perspectives || {}) }
        }
      } catch (e) { console.error('Error:', e) }
      setLoading(false)
    }
    loadProgress()
  }, [router])

  const handlePerspectiveComplete = async (id: string, points: number) => {
    const newCompleted = { ...completedPerspectives, [id]: { points } }
    setCompletedPerspectives(newCompleted)
    setActivePerspective(null)
    const newTotal = Object.values(newCompleted).reduce((s, p) => s + p.points, 0)
    setTotalScore(newTotal)
    
    const user = auth.currentUser
    if (!user) return
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        const allComplete = Object.keys(newCompleted).length === 5
        modules.procontra = { completed: allComplete, score: newTotal, progress: Math.round((Object.keys(newCompleted).length / 5) * 100), perspectives: newCompleted, lastUpdated: new Date().toISOString() }
        let totalPoints = 0
        Object.keys(modules).forEach(k => { if (modules[k].score) totalPoints += modules[k].score })
        const allModules = ['grundlagen', 'vertiefung', 'procontra', 'lernkontrolle', 'umfrage']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)
        await updateDoc(userRef, { modules, totalPoints, overallProgress })
        if (allComplete && !userData.badges?.procontra) {
          await updateDoc(userRef, { [`badges.procontra`]: { moduleId: 'procontra', moduleName: '3. Pro- und Contra', lerncode: userData.code, issuedAt: new Date().toISOString() } })
        }
      }
    } catch (e) { console.error('Error:', e) }
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>

  if (activePerspective) {
    const perspective = perspectives.find(p => p.id === activePerspective)!
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <header className="bg-white shadow-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setActivePerspective(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /><span>Zurück</span></button>
            <div className="flex items-center gap-2 text-teal-600 font-semibold"><Award className="h-5 w-5" /><span>{totalScore} Punkte</span></div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8"><PerspectiveView perspective={perspective} onComplete={(p) => handlePerspectiveComplete(perspective.id, p)} /></main>
      </div>
    )
  }

  const isAllComplete = Object.keys(completedPerspectives).length === perspectives.length
  const colorClasses: { [k: string]: { bg: string; border: string; text: string } } = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
    red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-600' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /><span>Dashboard</span></button>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 flex items-center gap-2"><Clock className="h-4 w-4" /><span>~25 Min</span></div>
            <div className="flex items-center gap-2 text-teal-600 font-semibold"><Award className="h-5 w-5" /><span>{totalScore} Punkte</span></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-teal-100 p-3 rounded-xl"><Scale className="h-8 w-8 text-teal-600" /></div>
            <div><h1 className="text-3xl font-bold text-gray-900">3. Pro und Contra</h1><p className="text-gray-600">Individualbesteuerung</p></div>
          </div>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6">
            <h2 className="font-bold text-amber-900 mb-2">📣 Bei Abstimmungen gehen die Meinungen auseinander</h2>
            <p className="text-amber-800">In einer Demokratie ist es normal, dass verschiedene Akteure unterschiedliche Positionen vertreten. Der Bundesrat, das Parlament, die Kantone, Parteien und Expert:innen haben jeweils ihre eigenen Argumente. In diesem Modul lernen Sie die wichtigsten Positionen zur Individualbesteuerung kennen.</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Fortschritt</span>
              <span className="text-sm font-bold text-teal-600">{Object.keys(completedPerspectives).length} / {perspectives.length} Perspektiven</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all" style={{ width: `${(Object.keys(completedPerspectives).length / perspectives.length) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 mb-8">
          {perspectives.map((p) => {
            const done = !!completedPerspectives[p.id]
            const c = colorClasses[p.color]
            return (
              <button key={p.id} onClick={() => setActivePerspective(p.id)} className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${done ? 'bg-green-50 border-green-300' : `${c.bg} ${c.border} hover:shadow-md`}`}>
                <div className={`p-3 rounded-lg ${done ? 'bg-green-500' : c.bg}`}><IconComponent name={p.icon} className={`h-6 w-6 ${done ? 'text-white' : c.text}`} /></div>
                <div className="flex-1"><h3 className="font-bold text-gray-900">{p.title}</h3><p className="text-sm text-gray-600">{p.description}</p></div>
                {done ? <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">{completedPerspectives[p.id].points}P</span></div> : <ArrowRight className={`h-5 w-5 ${c.text}`} />}
              </button>
            )
          })}
        </div>

        {isAllComplete && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white text-center mb-8">
            <Award className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-2">🎉 Modul abgeschlossen!</h3>
            <p className="text-lg">Sie haben alle Perspektiven bearbeitet und {totalScore} Punkte erreicht.</p>
          </div>
        )}

        <div className="text-center">
          <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg">Zurück zum Dashboard</button>
        </div>
      </main>
    </div>
  )
}
