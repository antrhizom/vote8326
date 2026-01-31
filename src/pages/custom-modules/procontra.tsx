import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, CheckCircle2, Award, Clock, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

// Fragen basierend auf dem Video-Inhalt
const videoQuestions = [
  {
    id: 1,
    question: "Wann stimmt das Schweizer Stimmvolk über die Individualbesteuerung ab?",
    options: [
      { text: "8. März", correct: true },
      { text: "18. Mai", correct: false },
      { text: "9. Juni", correct: false },
      { text: "22. September", correct: false }
    ],
    explanation: "Die Abstimmung findet am 8. März statt, weil gegen das Gesetz das Referendum ergriffen wurde.",
    points: 15
  },
  {
    id: 2,
    question: "Was kritisiert der Bundesrat am aktuellen Steuersystem?",
    options: [
      { text: "Zu wenig Steuereinnahmen", correct: false },
      { text: "Ungleichbehandlung je nach Zivilstand", correct: true },
      { text: "Zu komplizierte Formulare", correct: false },
      { text: "Fehlende Digitalisierung", correct: false }
    ],
    explanation: "Paare in vergleichbaren wirtschaftlichen Verhältnissen zahlen unterschiedlich hohe Steuern - nur weil sie verheiratet sind oder nicht.",
    points: 15
  },
  {
    id: 3,
    question: "Was ändert sich mit der Individualbesteuerung für Ehepaare?",
    options: [
      { text: "Sie zahlen zusammen weniger Steuern", correct: false },
      { text: "Sie füllen weiterhin eine gemeinsame Steuererklärung aus", correct: false },
      { text: "Beide Partner füllen je eine eigene Steuererklärung aus", correct: true },
      { text: "Nur der Hauptverdiener muss Steuern zahlen", correct: false }
    ],
    explanation: "Mit der Individualbesteuerung würden beide Ehepartner eine eigene Steuererklärung ausfüllen und separat besteuert - genau wie Nicht-Verheiratete.",
    points: 20
  },
  {
    id: 4,
    question: "Wer hat das Referendum gegen die Individualbesteuerung ergriffen?",
    options: [
      { text: "SP, Grüne und Gewerkschaften", correct: false },
      { text: "Kantone sowie SVP, EVP, EDU und Mitte", correct: true },
      { text: "Nur die Wirtschaftsverbände", correct: false },
      { text: "Der Bundesrat selbst", correct: false }
    ],
    explanation: "Die Kantone haben das Referendum ergriffen, zusammen mit einem Komitee von SVP, EVP, EDU und Mitte.",
    points: 20
  },
  {
    id: 5,
    question: "Mit welchem jährlichen Steuerausfall rechnet der Bund bei der direkten Bundessteuer?",
    options: [
      { text: "130 Mio. Franken", correct: false },
      { text: "330 Mio. Franken", correct: false },
      { text: "630 Mio. Franken", correct: true },
      { text: "1.3 Mia. Franken", correct: false }
    ],
    explanation: "Der Bund rechnet bei der direkten Bundessteuer mit einem Ausfall von 630 Mio. Franken pro Jahr.",
    points: 15
  },
  {
    id: 6,
    question: "Welchen positiven Effekt erwartet der Bund durch die Individualbesteuerung?",
    options: [
      { text: "Höhere Steuereinnahmen", correct: false },
      { text: "Weniger Bürokratie", correct: false },
      { text: "Mehr Erwerbstätigkeit, v.a. bei Ehefrauen (bis 44'000 Vollzeitstellen)", correct: true },
      { text: "Tiefere Mieten", correct: false }
    ],
    explanation: "Der Bund schätzt, dass gerade Ehefrauen mehr arbeiten würden, weil ihnen mehr vom Lohn bliebe. Der Effekt wird auf bis zu 44'000 Vollzeitstellen geschätzt.",
    points: 15
  }
]

export default function ProContraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalScore, setTotalScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<{[key: number]: { selected: number, correct: boolean }}>({})
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(1)

  useEffect(() => {
    const loadProgress = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const moduleData = userData.modules?.procontra
          
          if (moduleData) {
            setTotalScore(moduleData.score || 0)
            setIsCompleted(moduleData.completed || false)
            if (moduleData.answers) {
              setAnsweredQuestions(moduleData.answers)
            }
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      }

      setLoading(false)
    }

    loadProgress()
  }, [router])

  const handleAnswer = async (questionId: number, optionIndex: number) => {
    if (answeredQuestions[questionId]) return // Schon beantwortet
    
    const question = videoQuestions.find(q => q.id === questionId)
    if (!question) return
    
    const isCorrect = question.options[optionIndex].correct
    const earnedPoints = isCorrect ? question.points : 0
    
    const newAnswers = {
      ...answeredQuestions,
      [questionId]: { selected: optionIndex, correct: isCorrect }
    }
    setAnsweredQuestions(newAnswers)
    
    // Calculate new total score
    const newTotalScore = Object.entries(newAnswers).reduce((sum, [qId, answer]) => {
      if (answer.correct) {
        const q = videoQuestions.find(q => q.id === parseInt(qId))
        return sum + (q?.points || 0)
      }
      return sum
    }, 0)
    setTotalScore(newTotalScore)
    
    // Check if all questions answered
    const allAnswered = Object.keys(newAnswers).length === videoQuestions.length
    if (allAnswered) {
      setIsCompleted(true)
    }
    
    // Auto-expand next unanswered question
    const nextQuestion = videoQuestions.find(q => !newAnswers[q.id])
    if (nextQuestion) {
      setTimeout(() => setExpandedQuestion(nextQuestion.id), 1000)
    }
    
    // Save progress
    await saveProgress(newTotalScore, newAnswers, allAnswered)
  }

  const saveProgress = async (score: number, answers: typeof answeredQuestions, completed: boolean) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        const progress = Math.round((Object.keys(answers).length / videoQuestions.length) * 100)
        
        modules.procontra = {
          completed: completed,
          score: score,
          progress: progress,
          answers: answers,
          lastUpdated: new Date().toISOString()
        }
        
        // Calculate total points
        let totalPoints = 0
        Object.keys(modules).forEach(key => {
          if (modules[key].completed) {
            totalPoints += modules[key].score || 0
          }
        })
        
        // Calculate overall progress
        const allModules = ['grundlagen', 'vertiefung', 'procontra', 'lernkontrolle', 'umfrage']
        const completedModules = allModules.filter(id => modules[id]?.completed).length
        const overallProgress = Math.round((completedModules / allModules.length) * 100)
        
        await updateDoc(userRef, {
          modules,
          totalPoints,
          overallProgress
        })
        
        if (completed) {
          // Create badge
          const badges = userData.badges || {}
          if (!badges.procontra) {
            badges.procontra = {
              moduleId: 'procontra',
              moduleName: '3. Pro- und Contra',
              lerncode: userData.code,
              issuedAt: new Date().toISOString()
            }
            
            await updateDoc(userRef, { badges })
          }
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const maxPoints = videoQuestions.reduce((sum, q) => sum + q.points, 0)
  const answeredCount = Object.keys(answeredQuestions).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-600 font-semibold">Lade Modul...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Zurück</span>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>~10 Min</span>
              </div>
              <div className={`flex items-center gap-2 font-semibold ${isCompleted ? 'text-green-600' : 'text-teal-600'}`}>
                <Award className="h-5 w-5" />
                <span>{totalScore} / {maxPoints}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">3. Pro- und Contra: Individualbesteuerung</h1>
          <p className="text-gray-600 mb-4">
            Schauen Sie das Video und beantworten Sie die Fragen zum Inhalt.
          </p>
          
          {/* Progress */}
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Fortschritt</span>
              <span className="text-sm font-bold text-teal-600">
                {answeredCount} / {videoQuestions.length} Fragen
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${(answeredCount / videoQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Video */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="bg-gray-900">
            <iframe 
              className="w-full aspect-video"
              src="https://www.srf.ch/play/embed?urn=urn:srf:video:77a83d61-aeb0-4984-8e7b-37291a89b62c&startTime=12"
              title="SRF Beitrag Individualbesteuerung"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
          <div className="p-3 bg-teal-50 border-t-2 border-teal-200">
            <p className="text-sm text-teal-800">
              💡 <strong>Tipp:</strong> Beantworten Sie die Fragen während oder nach dem Video. Die Antworten finden Sie im Beitrag.
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">📝 Verständnisfragen</h2>
          
          {videoQuestions.map((question, qIndex) => {
            const answer = answeredQuestions[question.id]
            const isAnswered = !!answer
            const isExpanded = expandedQuestion === question.id
            
            return (
              <div 
                key={question.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all ${
                  isAnswered 
                    ? answer.correct 
                      ? 'border-green-300' 
                      : 'border-orange-300'
                    : 'border-gray-100'
                }`}
              >
                {/* Question Header */}
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isAnswered
                        ? answer.correct
                          ? 'bg-green-500 text-white'
                          : 'bg-orange-500 text-white'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {isAnswered ? (answer.correct ? '✓' : '✗') : qIndex + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Frage {qIndex + 1}</span>
                      <span className="text-sm text-gray-500 ml-2">({question.points} Punkte)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAnswered && (
                      <span className={`text-sm font-semibold ${answer.correct ? 'text-green-600' : 'text-orange-600'}`}>
                        {answer.correct ? `+${question.points}` : '0'}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>
                
                {/* Question Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="pt-4">
                      <p className="text-lg font-medium text-gray-900 mb-4">{question.question}</p>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isSelected = answer?.selected === optIndex
                          const showCorrect = isAnswered && option.correct
                          const showWrong = isAnswered && isSelected && !option.correct
                          
                          return (
                            <button
                              key={optIndex}
                              onClick={() => handleAnswer(question.id, optIndex)}
                              disabled={isAnswered}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                                showCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : showWrong
                                    ? 'border-red-500 bg-red-50'
                                    : isAnswered
                                      ? 'border-gray-200 bg-gray-50 opacity-60'
                                      : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                              }`}
                            >
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                showCorrect
                                  ? 'bg-green-500 text-white'
                                  : showWrong
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className={`flex-1 ${showCorrect ? 'font-semibold text-green-800' : showWrong ? 'text-red-800' : ''}`}>
                                {option.text}
                              </span>
                              {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                              {showWrong && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Explanation after answering */}
                      {isAnswered && (
                        <div className={`mt-4 p-3 rounded-lg ${answer.correct ? 'bg-green-100' : 'bg-orange-100'}`}>
                          <p className={`text-sm ${answer.correct ? 'text-green-800' : 'text-orange-800'}`}>
                            <strong>{answer.correct ? '✓ Richtig!' : '✗ Leider falsch.'}</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Completion */}
        {isCompleted && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 mb-8 text-white text-center">
            <Award className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-2">🎉 Modul abgeschlossen!</h3>
            <p className="text-lg">
              Sie haben <strong>{totalScore} von {maxPoints} Punkten</strong> erreicht.
            </p>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-lg"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
