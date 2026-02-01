import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, CheckCircle2, Award, ChevronDown, ChevronUp,
  Film, Radio, BookOpen, ThumbsUp, ThumbsDown, Star, 
  Volume2, Play, Pause
} from 'lucide-react'

// ===========================================
// GRUNDLAGEN INFO BUND MEDIEN - KAPITEL-STRUKTUR
// ===========================================

type Chapter = 'video' | 'quiz' | 'audio' | null

export default function GrundlagenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState<Chapter>(null)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [totalScore, setTotalScore] = useState(0)
  const [bonusScore, setBonusScore] = useState(0)
  
  // Video Quiz
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: string}>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  
  // Matching
  const [matchingAnswers, setMatchingAnswers] = useState<{[key: string]: string}>({})
  const [matchingSubmitted, setMatchingSubmitted] = useState(false)
  
  // Audio bonus
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null)
  const [audioQuizAnswers, setAudioQuizAnswers] = useState<{[key: string]: string}>({})
  const [audioQuizSubmitted, setAudioQuizSubmitted] = useState(false)
  
  const maxPoints = 100 // Grundpunkte
  const maxBonus = 30 // Audio-Bonus

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.grundlagen
          if (data) {
            setTotalScore(data.score || 0)
            setBonusScore(data.bonusScore || 0)
            setCompletedSections(new Set(data.completedSections || []))
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  const completeSection = async (sectionId: string, points: number, isBonus: boolean = false) => {
    if (completedSections.has(sectionId)) return
    
    const newCompleted = new Set(completedSections)
    newCompleted.add(sectionId)
    setCompletedSections(newCompleted)
    
    let newScore = totalScore
    let newBonus = bonusScore
    
    if (isBonus) {
      newBonus += points
      setBonusScore(newBonus)
    } else {
      newScore += points
      setTotalScore(newScore)
    }
    
    await saveProgress(newScore, newBonus, Array.from(newCompleted))
  }

  const saveProgress = async (score: number, bonus: number, completed: string[]) => {
    const user = auth.currentUser
    if (!user) return
    
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        const requiredSections = ['videoquiz', 'matching']
        const allComplete = requiredSections.every(s => completed.includes(s))
        
        modules.grundlagen = {
          completed: allComplete,
          score,
          bonusScore: bonus,
          progress: Math.round((score / maxPoints) * 100),
          completedSections: completed,
          lastUpdated: new Date().toISOString()
        }
        
        let totalPoints = 0
        let totalBonus = 0
        Object.keys(modules).forEach(k => { 
          if (modules[k].score) totalPoints += modules[k].score
          if (modules[k].bonusScore) totalBonus += modules[k].bonusScore
        })
        
        const allModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)
        
        await updateDoc(userRef, { modules, totalPoints, totalBonus, overallProgress })
      }
    } catch (e) { console.error(e) }
  }

  const getChapterProgress = (chapter: Chapter) => {
    switch (chapter) {
      case 'video':
        return { done: completedSections.has('videoquiz') ? 1 : 0, total: 1, points: completedSections.has('videoquiz') ? 50 : 0 }
      case 'quiz':
        return { done: completedSections.has('matching') ? 1 : 0, total: 1, points: completedSections.has('matching') ? 50 : 0 }
      case 'audio':
        const audioDone = completedSections.has('audio_rendezvous') || completedSections.has('audio_echo')
        return { done: audioDone ? 1 : 0, total: 1, points: audioDone ? 30 : 0, isBonus: true }
      default:
        return { done: 0, total: 0, points: 0 }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  // ========== CHAPTER OVERVIEW ==========
  if (!activeChapter) {
    const videoProgress = getChapterProgress('video')
    const quizProgress = getChapterProgress('quiz')
    const audioProgress = getChapterProgress('audio')
    const isComplete = videoProgress.done === 1 && quizProgress.done === 1

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <Award className="h-4 w-4" />
                  <span className="font-semibold">{totalScore} / {maxPoints}</span>
                </div>
                {bonusScore > 0 && (
                  <div className="flex items-center gap-1 text-sm bg-yellow-400/30 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3" />
                    <span className="text-xs">+{bonusScore} Bonus</span>
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold">2. Grundlagen Info Bund Medien</h1>
            <p className="text-blue-200 text-sm mt-1">Abstimmung vom 8. März 2026 – Individualbesteuerung</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Intro Text */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-700">
              Lernen Sie die <strong>offiziellen Informationen des Bundes</strong> und die 
              <strong> Medienberichterstattung</strong> kennen. Verstehen Sie, wer von der Reform profitiert 
              und welche Auswirkungen sie hat.
            </p>
          </div>

          {/* Chapter Cards */}
          <div className="space-y-3">
            {/* Kapitel 1: Video */}
            <button
              onClick={() => setActiveChapter('video')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${videoProgress.done === 1 ? 'bg-green-500' : 'bg-blue-500'}`}>
                    <Film className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 1: Erklärfilm des Bundes</h3>
                    <p className="text-sm text-gray-500">Video anschauen & Fragen beantworten</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">{videoProgress.done}/{videoProgress.total}</div>
                  <div className="text-xs text-gray-400">50 Punkte</div>
                </div>
              </div>
              {videoProgress.done === 1 && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                </div>
              )}
            </button>

            {/* Kapitel 2: Wer profitiert */}
            <button
              onClick={() => setActiveChapter('quiz')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${quizProgress.done === 1 ? 'bg-green-500' : 'bg-indigo-500'}`}>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 2: Wer profitiert?</h3>
                    <p className="text-sm text-gray-500">Auswirkungen verstehen & zuordnen</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-indigo-600">{quizProgress.done}/{quizProgress.total}</div>
                  <div className="text-xs text-gray-400">50 Punkte</div>
                </div>
              </div>
              {quizProgress.done === 1 && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                </div>
              )}
            </button>

            {/* Kapitel 3: Audio BONUS */}
            <button
              onClick={() => setActiveChapter('audio')}
              className="w-full bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-yellow-200 hover:border-yellow-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${audioProgress.done === 1 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    <Radio className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      Bonus: SRF Radio-Beiträge
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">OPTIONAL</span>
                    </h3>
                    <p className="text-sm text-gray-500">Einen Beitrag wählen & Fragen beantworten</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-yellow-600 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    +30 Bonus
                  </div>
                </div>
              </div>
              {audioProgress.done === 1 && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Bonus erhalten!</span>
                </div>
              )}
            </button>
          </div>

          {/* Info about Bonus */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Über Bonus-Punkte</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Die Audio-Beiträge sind <strong>optional</strong> und nicht für die Gesamtpunktzahl erforderlich. 
                  Bonus-Punkte werden separat gezählt und im <strong>Badge</strong> sowie 
                  <strong> Zertifikat</strong> gesondert ausgewiesen.
                </p>
              </div>
            </div>
          </div>

          {/* Completion Banner */}
          {isComplete && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
              <p className="text-blue-100 mb-4">
                Sie haben {totalScore} Punkte erreicht
                {bonusScore > 0 && <span> (+{bonusScore} Bonus)</span>}
              </p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
              >
                Weiter zum nächsten Modul
              </button>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ========== CHAPTER: VIDEO ==========
  if (activeChapter === 'video') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveChapter(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Übersicht</span>
              </button>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <Award className="h-4 w-4" />
                <span className="font-semibold">{totalScore} / {maxPoints}</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2">Kapitel 1: Erklärfilm des Bundes</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Video */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 p-4 border-b">
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Offizieller Erklärfilm</h3>
                  <p className="text-sm text-gray-500">Bundesrat erklärt die Individualbesteuerung</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <iframe 
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/trC9P62Olio"
                  title="Erklärfilm des Bundes zur Individualbesteuerung"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Schauen Sie das Video und beantworten Sie die Fragen in der Reihenfolge des Videos
              </p>
            </div>
          </div>

          {/* Quiz - Fragen in Video-Reihenfolge */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">❓</span>
                <div>
                  <h3 className="font-bold text-gray-900">Verständnisfragen zum Video</h3>
                  <p className="text-sm text-gray-500">In chronologischer Reihenfolge</p>
                </div>
              </div>
              {completedSections.has('videoquiz') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+50P ✓</span>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              {/* Frage 1 - Anfang: Warum Reform? (0:13) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 Video-Anfang</p>
                <p className="font-medium text-gray-800 mb-3">
                  1. Was ist das Ziel von Bundesrat und Parlament?
                </p>
                <div className="space-y-2">
                  {[
                    'Paare sollen vom Zivilstand steuerlich profitieren',
                    'Paare sollen nicht vom Zivilstand steuerlich profitieren oder benachteiligt werden',
                    'Alle sollen mehr Steuern zahlen',
                    'Nur Verheiratete sollen Steuererklärungen ausfüllen'
                  ].map(opt => {
                    const isSelected = quizAnswers.q1 === opt
                    const correct = 'Paare sollen nicht vom Zivilstand steuerlich profitieren oder benachteiligt werden'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q1: opt})}
                        disabled={quizSubmitted}
                        className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isWrong ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-blue-500 text-white' :
                          'bg-white border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 2 - Mitte: Auswirkungen (1:37) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 Video-Mitte</p>
                <p className="font-medium text-gray-800 mb-3">
                  2. Wie hoch würde der Kinderabzug bei der direkten Bundessteuer erhöht?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Auf 8\'000 Fr.', 'Auf 10\'000 Fr.', 'Auf 12\'000 Fr.', 'Auf 15\'000 Fr.'].map(opt => {
                    const isSelected = quizAnswers.q2 === opt
                    const correct = 'Auf 12\'000 Fr.'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q2: opt})}
                        disabled={quizSubmitted}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isWrong ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-blue-500 text-white' :
                          'bg-white border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 3 - Mitte: Zusätzliche Steuererklärungen (2:59) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 Video-Mitte</p>
                <p className="font-medium text-gray-800 mb-3">
                  3. Wie viele zusätzliche Steuererklärungen würde es geben?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['500\'000', '1,7 Millionen', '3 Millionen', '140\'000'].map(opt => {
                    const isSelected = quizAnswers.q3 === opt
                    const correct = '1,7 Millionen'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q3: opt})}
                        disabled={quizSubmitted}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isWrong ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-blue-500 text-white' :
                          'bg-white border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 4 - Ende: Steuerausfälle (2:17) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 Video-Ende</p>
                <p className="font-medium text-gray-800 mb-3">
                  4. Wie hoch wären die geschätzten jährlichen Steuerausfälle beim Bund?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['200 Mio. Fr.', '450 Mio. Fr.', '630 Mio. Fr.', '1 Mrd. Fr.'].map(opt => {
                    const isSelected = quizAnswers.q4 === opt
                    const correct = '630 Mio. Fr.'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q4: opt})}
                        disabled={quizSubmitted}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isWrong ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-blue-500 text-white' :
                          'bg-white border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {!quizSubmitted && quizAnswers.q1 && quizAnswers.q2 && quizAnswers.q3 && quizAnswers.q4 && (
                <button 
                  onClick={() => {
                    setQuizSubmitted(true)
                    if (!completedSections.has('videoquiz')) {
                      completeSection('videoquiz', 50)
                    }
                  }}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Antworten prüfen
                </button>
              )}
              
              {quizSubmitted && (
                <div className="p-4 bg-green-100 rounded-lg text-green-800">
                  <strong>✓ Verständnisfragen abgeschlossen!</strong>
                  <p className="text-sm mt-1">
                    Der Kinderabzug steigt auf 12'000 Fr., es gäbe 1,7 Mio. zusätzliche Steuererklärungen, 
                    und die Steuerausfälle betragen ca. 630 Mio. Fr. pro Jahr.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveChapter(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Zurück zur Übersicht
            </button>
            <button 
              onClick={() => setActiveChapter('quiz')}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
            >
              Weiter zu Kapitel 2 →
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ========== CHAPTER: QUIZ (Wer profitiert) ==========
  if (activeChapter === 'quiz') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveChapter(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Übersicht</span>
              </button>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <Award className="h-4 w-4" />
                <span className="font-semibold">{totalScore} / {maxPoints}</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2">Kapitel 2: Wer profitiert?</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-700">
              Die Individualbesteuerung würde verschiedene Gruppen unterschiedlich treffen. 
              Ordnen Sie zu, wer tendenziell <strong>mehr</strong> und wer <strong>weniger</strong> Steuern zahlen würde.
            </p>
          </div>

          {/* Matching Exercise */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-bold text-gray-900">Zuordnung: Steuerliche Auswirkungen</h3>
                  <p className="text-sm text-gray-500">Wer würde mehr, wer weniger zahlen?</p>
                </div>
              </div>
              {completedSections.has('matching') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+50P ✓</span>
              )}
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { group: 'Doppelverdiener-Ehepaar mit ähnlichem Einkommen', correct: 'weniger', hint: 'Die Heiratsstrafe fällt weg' },
                  { group: 'Einverdiener-Ehepaar mit Kindern', correct: 'mehr', hint: 'Trotz höherem Kinderabzug' },
                  { group: 'Unverheiratete mit tiefem/mittlerem Einkommen', correct: 'weniger', hint: 'Durch neue Tarife' },
                  { group: 'Gutverdienende Doppelverdiener (verheiratet)', correct: 'weniger', hint: 'Profitieren am meisten' },
                  { group: 'Ehepaar mit sehr ungleich verteiltem Einkommen', correct: 'mehr', hint: 'Verlieren den Splitting-Vorteil' },
                ].map((item, idx) => {
                  const answer = matchingAnswers[`m${idx}`]
                  const isCorrect = matchingSubmitted && answer === item.correct
                  const isWrong = matchingSubmitted && answer && answer !== item.correct
                  
                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      isCorrect ? 'border-green-400 bg-green-50' : 
                      isWrong ? 'border-red-400 bg-red-50' : 
                      'border-gray-200 bg-white'
                    }`}>
                      <p className="font-medium text-gray-800 mb-2">{item.group}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => !matchingSubmitted && setMatchingAnswers({...matchingAnswers, [`m${idx}`]: 'weniger'})}
                          disabled={matchingSubmitted}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 ${
                            answer === 'weniger'
                              ? matchingSubmitted
                                ? item.correct === 'weniger' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-indigo-500 text-white'
                              : matchingSubmitted && item.correct === 'weniger'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" /> Weniger Steuern
                        </button>
                        <button
                          onClick={() => !matchingSubmitted && setMatchingAnswers({...matchingAnswers, [`m${idx}`]: 'mehr'})}
                          disabled={matchingSubmitted}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 ${
                            answer === 'mehr'
                              ? matchingSubmitted
                                ? item.correct === 'mehr' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-indigo-500 text-white'
                              : matchingSubmitted && item.correct === 'mehr'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" /> Mehr Steuern
                        </button>
                      </div>
                      {matchingSubmitted && (
                        <p className="text-xs text-gray-500 mt-2 italic">{item.hint}</p>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {!matchingSubmitted && Object.keys(matchingAnswers).length >= 5 && (
                <button 
                  onClick={() => {
                    setMatchingSubmitted(true)
                    if (!completedSections.has('matching')) {
                      completeSection('matching', 50)
                    }
                  }}
                  className="mt-4 w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Antworten prüfen
                </button>
              )}
              
              {matchingSubmitted && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg text-green-800">
                  <strong>✓ Zuordnung abgeschlossen!</strong>
                  <p className="text-sm mt-1">
                    Doppelverdiener mit ähnlichem Einkommen profitieren am meisten. 
                    Einverdiener-Familien und Paare mit ungleichem Einkommen würden tendenziell mehr zahlen.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveChapter('video')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Kapitel 1
            </button>
            <button 
              onClick={() => setActiveChapter('audio')}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Bonus: Audio →
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ========== CHAPTER: AUDIO BONUS ==========
  if (activeChapter === 'audio') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
        <header className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveChapter(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Übersicht</span>
              </button>
              <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                <Star className="h-4 w-4" />
                <span className="font-semibold">Bonus: +{bonusScore}</span>
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2 flex items-center gap-2">
              Bonus: SRF Radio-Beiträge
              <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">OPTIONAL</span>
            </h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-yellow-200">
            <div className="flex items-start gap-3">
              <Star className="h-6 w-6 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Bonus-Punkte sammeln</h3>
                <p className="text-gray-700 text-sm mb-3">
                  <strong>Wählen Sie einen der beiden Audio-Beiträge aus</strong> und beantworten Sie die Fragen dazu. 
                  Sie müssen nur <strong>einen</strong> Beitrag hören, um die Bonus-Punkte zu erhalten.
                </p>
                <p className="text-amber-700 text-sm">
                  💡 Diese Punkte sind <strong>nicht erforderlich</strong> für die Grundpunktzahl. 
                  Sie werden im Badge und Zertifikat separat als "Bonus" ausgewiesen.
                </p>
              </div>
            </div>
          </div>

          {/* Audio Selection */}
          {!selectedAudio && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-center">Wählen Sie einen Beitrag:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rendez-vous */}
                <button
                  onClick={() => setSelectedAudio('rendezvous')}
                  disabled={completedSections.has('audio_rendezvous') || completedSections.has('audio_echo')}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    completedSections.has('audio_rendezvous') 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-red-200 bg-white hover:border-red-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-600 p-3 rounded-lg">
                      <Volume2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">SRF Rendez-vous</p>
                      <p className="text-sm text-gray-500">ca. 5 Minuten</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    <strong>Thema:</strong> Wer profitiert, wer verliert? Politische Positionen der Parteien.
                  </p>
                  {completedSections.has('audio_rendezvous') && (
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Abgeschlossen</span>
                    </div>
                  )}
                </button>

                {/* Echo der Zeit */}
                <button
                  onClick={() => setSelectedAudio('echo')}
                  disabled={completedSections.has('audio_rendezvous') || completedSections.has('audio_echo')}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    completedSections.has('audio_echo') 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-red-200 bg-white hover:border-red-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-600 p-3 rounded-lg">
                      <Volume2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">SRF Echo der Zeit</p>
                      <p className="text-sm text-gray-500">ca. 6 Minuten</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">
                    <strong>Thema:</strong> Auswirkungen auf den Arbeitsmarkt. Wie viele neue Stellen?
                  </p>
                  {completedSections.has('audio_echo') && (
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Abgeschlossen</span>
                    </div>
                  )}
                </button>
              </div>

              {(completedSections.has('audio_rendezvous') || completedSections.has('audio_echo')) && (
                <div className="bg-green-100 rounded-xl p-4 text-center">
                  <p className="text-green-800 font-semibold">
                    ✓ Sie haben bereits einen Audio-Beitrag abgeschlossen und {bonusScore} Bonus-Punkte erhalten!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rendez-vous Content */}
          {selectedAudio === 'rendezvous' && !completedSections.has('audio_rendezvous') && (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedAudio(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Andere Auswahl treffen
              </button>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg">
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">SRF Rendez-vous</h3>
                      <p className="text-sm text-gray-500">Wer profitiert, wer verliert?</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <audio controls className="w-full mb-4">
                    <source src="https://www.srf.ch/play/radio/redirect/detail/0a5f5262-293a-3556-bdf1-9ede96808d61" type="audio/mpeg" />
                  </audio>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    Hören Sie den Beitrag und beantworten Sie die Fragen in der Reihenfolge der Inhalte.
                  </p>

                  {/* Questions - in order of audio content */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-red-600 mb-1">📍 Beitrag-Anfang</p>
                      <p className="font-medium text-gray-800 mb-3">
                        1. Welche Parteien sind FÜR die Individualbesteuerung?
                      </p>
                      <div className="space-y-2">
                        {[
                          'SVP, Mitte, EVP',
                          'FDP, SP, Grüne, GLP',
                          'Nur die FDP',
                          'Alle Parteien'
                        ].map(opt => {
                          const isSelected = audioQuizAnswers.aq1 === opt
                          const correct = 'FDP, SP, Grüne, GLP'
                          const isCorrect = audioQuizSubmitted && opt === correct
                          const isWrong = audioQuizSubmitted && isSelected && opt !== correct
                          return (
                            <button
                              key={opt}
                              onClick={() => !audioQuizSubmitted && setAudioQuizAnswers({...audioQuizAnswers, aq1: opt})}
                              disabled={audioQuizSubmitted}
                              className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                                isCorrect ? 'bg-green-500 text-white' :
                                isWrong ? 'bg-red-500 text-white' :
                                isSelected ? 'bg-yellow-500 text-white' :
                                'bg-white border border-gray-300 hover:border-yellow-400'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-red-600 mb-1">📍 Beitrag-Mitte</p>
                      <p className="font-medium text-gray-800 mb-3">
                        2. Was sagt Mitte-Fraktionschefin Yvonne Bürgin zur FDP?
                      </p>
                      <div className="space-y-2">
                        {[
                          'Die FDP unterstützt die Familie',
                          'Die FDP möchte lieber das Heiraten abschaffen',
                          'Die FDP hat den besten Vorschlag',
                          'Die FDP ist gegen jede Reform'
                        ].map(opt => {
                          const isSelected = audioQuizAnswers.aq2 === opt
                          const correct = 'Die FDP möchte lieber das Heiraten abschaffen'
                          const isCorrect = audioQuizSubmitted && opt === correct
                          const isWrong = audioQuizSubmitted && isSelected && opt !== correct
                          return (
                            <button
                              key={opt}
                              onClick={() => !audioQuizSubmitted && setAudioQuizAnswers({...audioQuizAnswers, aq2: opt})}
                              disabled={audioQuizSubmitted}
                              className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                                isCorrect ? 'bg-green-500 text-white' :
                                isWrong ? 'bg-red-500 text-white' :
                                isSelected ? 'bg-yellow-500 text-white' :
                                'bg-white border border-gray-300 hover:border-yellow-400'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-red-600 mb-1">📍 Beitrag-Ende</p>
                      <p className="font-medium text-gray-800 mb-3">
                        3. Was ist die Alternative der Mitte-Partei?
                      </p>
                      <div className="space-y-2">
                        {[
                          'Gar keine Reform',
                          'Eine eigene Initiative mit alternativer Steuerberechnung',
                          'Höhere Steuern für alle',
                          'Abschaffung der Ehe'
                        ].map(opt => {
                          const isSelected = audioQuizAnswers.aq3 === opt
                          const correct = 'Eine eigene Initiative mit alternativer Steuerberechnung'
                          const isCorrect = audioQuizSubmitted && opt === correct
                          const isWrong = audioQuizSubmitted && isSelected && opt !== correct
                          return (
                            <button
                              key={opt}
                              onClick={() => !audioQuizSubmitted && setAudioQuizAnswers({...audioQuizAnswers, aq3: opt})}
                              disabled={audioQuizSubmitted}
                              className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                                isCorrect ? 'bg-green-500 text-white' :
                                isWrong ? 'bg-red-500 text-white' :
                                isSelected ? 'bg-yellow-500 text-white' :
                                'bg-white border border-gray-300 hover:border-yellow-400'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {!audioQuizSubmitted && audioQuizAnswers.aq1 && audioQuizAnswers.aq2 && audioQuizAnswers.aq3 && (
                    <button 
                      onClick={() => {
                        setAudioQuizSubmitted(true)
                        completeSection('audio_rendezvous', 30, true)
                      }}
                      className="mt-4 w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
                    >
                      Antworten prüfen & Bonus erhalten
                    </button>
                  )}
                  
                  {audioQuizSubmitted && (
                    <div className="mt-4 p-4 bg-green-100 rounded-lg text-green-800">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <strong>+30 Bonus-Punkte erhalten!</strong>
                      </div>
                      <p className="text-sm mt-1">
                        Diese Punkte werden in Ihrem Badge und Zertifikat separat ausgewiesen.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Echo der Zeit Content */}
          {selectedAudio === 'echo' && !completedSections.has('audio_echo') && (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedAudio(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Andere Auswahl treffen
              </button>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg">
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">SRF Echo der Zeit</h3>
                      <p className="text-sm text-gray-500">Auswirkungen auf den Arbeitsmarkt</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <audio controls className="w-full mb-4">
                    <source src="https://www.srf.ch/play/radio/redirect/detail/3a4f8b4b-cbe9-3b28-a210-21977898e358" type="audio/mpeg" />
                  </audio>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    Hören Sie den Beitrag und beantworten Sie die Fragen in der Reihenfolge der Inhalte.
                  </p>

                  {/* Questions - in order of audio content */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-red-600 mb-1">📍 Beitrag-Anfang</p>
                      <p className="font-medium text-gray-800 mb-3">
                        1. Was ist das Problem bei Doppelverdiener-Ehepaaren heute?
                      </p>
                      <div className="space-y-2">
                        {[
                          'Sie zahlen weniger Steuern als Unverheiratete',
                          'Sie zahlen mehr Steuern als wenn sie unverheiratet zusammenleben würden',
                          'Sie müssen keine Steuern zahlen',
                          'Sie bekommen Geld vom Staat'
                        ].map(opt => {
                          const isSelected = audioQuizAnswers.eq1 === opt
                          const correct = 'Sie zahlen mehr Steuern als wenn sie unverheiratet zusammenleben würden'
                          const isCorrect = audioQuizSubmitted && opt === correct
                          const isWrong = audioQuizSubmitted && isSelected && opt !== correct
                          return (
                            <button
                              key={opt}
                              onClick={() => !audioQuizSubmitted && setAudioQuizAnswers({...audioQuizAnswers, eq1: opt})}
                              disabled={audioQuizSubmitted}
                              className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                                isCorrect ? 'bg-green-500 text-white' :
                                isWrong ? 'bg-red-500 text-white' :
                                isSelected ? 'bg-yellow-500 text-white' :
                                'bg-white border border-gray-300 hover:border-yellow-400'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-red-600 mb-1">📍 Beitrag-Mitte</p>
                      <p className="font-medium text-gray-800 mb-3">
                        2. Wie viele neue Vollzeitstellen werden laut Studien geschätzt?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {['5\'000 - 8\'000', '10\'000 - 20\'000', '50\'000 - 100\'000', '200\'000+'].map(opt => {
                          const isSelected = audioQuizAnswers.eq2 === opt
                          const correct = '10\'000 - 20\'000'
                          const isCorrect = audioQuizSubmitted && opt === correct
                          const isWrong = audioQuizSubmitted && isSelected && opt !== correct
                          return (
                            <button
                              key={opt}
                              onClick={() => !audioQuizSubmitted && setAudioQuizAnswers({...audioQuizAnswers, eq2: opt})}
                              disabled={audioQuizSubmitted}
                              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                isCorrect ? 'bg-green-500 text-white' :
                                isWrong ? 'bg-red-500 text-white' :
                                isSelected ? 'bg-yellow-500 text-white' :
                                'bg-white border border-gray-300 hover:border-yellow-400'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-red-600 mb-1">📍 Beitrag-Ende</p>
                      <p className="font-medium text-gray-800 mb-3">
                        3. Wie viele Frauen würden laut Schätzungen neu erwerbstätig werden?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {['ca. 5\'000', 'ca. 11\'500', 'ca. 50\'000', 'ca. 100\'000'].map(opt => {
                          const isSelected = audioQuizAnswers.eq3 === opt
                          const correct = 'ca. 11\'500'
                          const isCorrect = audioQuizSubmitted && opt === correct
                          const isWrong = audioQuizSubmitted && isSelected && opt !== correct
                          return (
                            <button
                              key={opt}
                              onClick={() => !audioQuizSubmitted && setAudioQuizAnswers({...audioQuizAnswers, eq3: opt})}
                              disabled={audioQuizSubmitted}
                              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                isCorrect ? 'bg-green-500 text-white' :
                                isWrong ? 'bg-red-500 text-white' :
                                isSelected ? 'bg-yellow-500 text-white' :
                                'bg-white border border-gray-300 hover:border-yellow-400'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {!audioQuizSubmitted && audioQuizAnswers.eq1 && audioQuizAnswers.eq2 && audioQuizAnswers.eq3 && (
                    <button 
                      onClick={() => {
                        setAudioQuizSubmitted(true)
                        completeSection('audio_echo', 30, true)
                      }}
                      className="mt-4 w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
                    >
                      Antworten prüfen & Bonus erhalten
                    </button>
                  )}
                  
                  {audioQuizSubmitted && (
                    <div className="mt-4 p-4 bg-green-100 rounded-lg text-green-800">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <strong>+30 Bonus-Punkte erhalten!</strong>
                      </div>
                      <p className="text-sm mt-1">
                        Diese Punkte werden in Ihrem Badge und Zertifikat separat ausgewiesen.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveChapter('quiz')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Kapitel 2
            </button>
            <button 
              onClick={() => setActiveChapter(null)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
            >
              Zur Übersicht →
            </button>
          </div>
        </main>
      </div>
    )
  }

  return null
}
