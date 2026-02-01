import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, CheckCircle2, Award, ChevronDown, ChevronUp,
  Sparkles, Clock, Play, Film, Radio, BookOpen, 
  ThumbsUp, ThumbsDown, HelpCircle, Volume2
} from 'lucide-react'

// ===========================================
// GRUNDLAGEN INFO BUND MEDIEN MODULE
// ===========================================

export default function GrundlagenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [totalScore, setTotalScore] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>('intro')
  
  // Video tracking
  const [videoStarted, setVideoStarted] = useState(false)
  const [videoTimer, setVideoTimer] = useState(0)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Audio tracking
  const [audioListened, setAudioListened] = useState<Set<string>>(new Set())
  
  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: string}>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [matchingAnswers, setMatchingAnswers] = useState<{[key: string]: string}>({})
  const [matchingSubmitted, setMatchingSubmitted] = useState(false)
  
  // Flipcards
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  
  const maxPoints = 120
  const VIDEO_DURATION = 240 // 4 minutes for Bund video

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
            setCompletedSections(new Set(data.completedSections || []))
            if (data.completedSections?.includes('video')) {
              setVideoCompleted(true)
            }
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
    
    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current)
    }
  }, [router])

  const startVideoTimer = () => {
    if (videoStarted || videoCompleted) return
    setVideoStarted(true)
    
    videoTimerRef.current = setInterval(() => {
      setVideoTimer(prev => {
        if (prev >= VIDEO_DURATION) {
          if (videoTimerRef.current) clearInterval(videoTimerRef.current)
          return VIDEO_DURATION
        }
        return prev + 1
      })
    }, 1000)
  }

  const completeSection = async (sectionId: string, points: number) => {
    if (completedSections.has(sectionId)) return
    
    const newCompleted = new Set(completedSections)
    newCompleted.add(sectionId)
    setCompletedSections(newCompleted)
    
    const newScore = totalScore + points
    setTotalScore(newScore)
    
    await saveProgress(newScore, Array.from(newCompleted))
  }

  const saveProgress = async (score: number, completed: string[]) => {
    const user = auth.currentUser
    if (!user) return
    
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        const allComplete = completed.length >= 5 // intro, video, quiz, audio, matching
        
        modules.grundlagen = {
          completed: allComplete,
          score,
          progress: Math.round((score / maxPoints) * 100),
          completedSections: completed,
          lastUpdated: new Date().toISOString()
        }
        
        let totalPoints = 0
        Object.keys(modules).forEach(k => { if (modules[k].score) totalPoints += modules[k].score })
        
        const allModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)
        
        await updateDoc(userRef, { modules, totalPoints, overallProgress })
      }
    } catch (e) { console.error(e) }
  }

  const handleVideoComplete = () => {
    setVideoCompleted(true)
    if (videoTimerRef.current) clearInterval(videoTimerRef.current)
    completeSection('video', 25)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const flipCard = (index: number) => {
    const newFlipped = new Set(flippedCards)
    newFlipped.add(index)
    setFlippedCards(newFlipped)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const isComplete = completedSections.size >= 5

  // Flipcard CSS
  const flipCardStyles = `
    .flip-card-grundlagen {
      perspective: 1000px;
      cursor: pointer;
    }
    .flip-card-inner-grundlagen {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s;
      transform-style: preserve-3d;
    }
    .flip-card-grundlagen.flipped .flip-card-inner-grundlagen {
      transform: rotateY(180deg);
    }
    .flip-card-front-grundlagen, .flip-card-back-grundlagen {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
    }
    .flip-card-front-grundlagen {
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: white;
    }
    .flip-card-back-grundlagen {
      background: white;
      border: 2px solid #2563eb;
      color: #1e3a8a;
      transform: rotateY(180deg);
    }
  `

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <style dangerouslySetInnerHTML={{ __html: flipCardStyles }} />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
            </button>
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
              <Award className="h-4 w-4" />
              <span className="font-semibold">{totalScore} / {maxPoints}</span>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-2">2. Grundlagen Info Bund Medien</h1>
          <p className="text-blue-200 text-sm">Abstimmung vom 8. März 2026</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        
        {/* SECTION 1: Einführung */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'intro' ? null : 'intro')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Einführung: Offizielle Informationen</span>
              {completedSections.has('intro') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
              )}
            </div>
            {openSection === 'intro' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'intro' && (
            <div className="p-6 border-t">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Um sich eine fundierte Meinung zu bilden, ist es wichtig, die <strong>offiziellen Informationen</strong> 
                  des Bundes und der <strong>unabhängigen Medienberichterstattung</strong> zu kennen.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                  <p className="text-blue-900 font-medium mb-2">🎯 In diesem Modul lernen Sie:</p>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Die offizielle Erklärung des Bundes zur Individualbesteuerung</li>
                    <li>• Was sich konkret ändern würde bei einem JA</li>
                    <li>• Wer profitiert und wer verliert</li>
                    <li>• Die Auswirkungen auf den Arbeitsmarkt</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4">
                  <p className="text-amber-800 text-sm">
                    <strong>💡 Gut zu wissen:</strong> Der Bundesrat empfiehlt ein JA zur Vorlage. 
                    10 Kantone und ein überparteiliches Komitee haben jedoch das Referendum dagegen ergriffen.
                  </p>
                </div>
              </div>
              
              {!completedSections.has('intro') && (
                <button 
                  onClick={() => completeSection('intro', 15)}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold"
                >
                  ✓ Einführung gelesen
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Video des Bundes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'video' ? null : 'video')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">📺 Erklärfilm des Bundes</span>
              {completedSections.has('video') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+25P ✓</span>
              )}
            </div>
            {openSection === 'video' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'video' && (
            <div className="p-6 border-t">
              <p className="text-gray-700 text-sm mb-4">
                Der offizielle Erklärfilm des Bundes fasst die wichtigsten Punkte zur Individualbesteuerung zusammen.
                <strong> Schauen Sie das Video vollständig an, um Punkte zu erhalten.</strong>
              </p>
              
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <iframe 
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/trC9P62Olio"
                  title="Erklärfilm des Bundes zur Individualbesteuerung"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => !videoCompleted && startVideoTimer()}
                />
              </div>
              
              {/* Video Progress */}
              {!videoCompleted && (
                <div className="mt-4 bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {videoStarted ? 'Video läuft...' : 'Klicken Sie auf Play im Video'}
                    </span>
                    <span className="text-sm font-mono text-gray-700">
                      {formatTime(videoTimer)} / {formatTime(VIDEO_DURATION)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${videoTimer >= VIDEO_DURATION ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${(videoTimer / VIDEO_DURATION) * 100}%` }}
                    />
                  </div>
                  
                  {videoTimer >= VIDEO_DURATION && (
                    <button 
                      onClick={handleVideoComplete}
                      className="mt-3 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Video abgeschlossen (+25 Punkte)
                    </button>
                  )}
                </div>
              )}
              
              {videoCompleted && (
                <div className="mt-4 bg-green-100 rounded-lg p-4 flex items-center gap-3 text-green-800">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-semibold">Video erfolgreich angeschaut!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: Verständnisfragen zum Video */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'quiz' ? null : 'quiz')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">❓ Verständnisfragen</span>
              {completedSections.has('quiz') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+30P ✓</span>
              )}
            </div>
            {openSection === 'quiz' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'quiz' && (
            <div className="p-6 border-t">
              <p className="text-gray-600 text-sm mb-4">Testen Sie Ihr Wissen aus dem Video:</p>
              
              <div className="space-y-6">
                {/* Frage 1 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">
                    1. Wie viele zusätzliche Steuererklärungen würde es geben?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['500\'000', '1,7 Millionen', '3 Millionen', '140\'000'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q1: opt})}
                        disabled={quizSubmitted}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          quizAnswers.q1 === opt 
                            ? quizSubmitted 
                              ? opt === '1,7 Millionen' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white'
                            : quizSubmitted && opt === '1,7 Millionen' 
                              ? 'bg-green-200 text-green-800'
                              : 'bg-white border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frage 2 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">
                    2. Um wie viel würde der Kinderabzug erhöht?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Auf 8\'000 Fr.', 'Auf 10\'000 Fr.', 'Auf 12\'000 Fr.', 'Auf 15\'000 Fr.'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q2: opt})}
                        disabled={quizSubmitted}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          quizAnswers.q2 === opt 
                            ? quizSubmitted 
                              ? opt === 'Auf 12\'000 Fr.' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white'
                            : quizSubmitted && opt === 'Auf 12\'000 Fr.' 
                              ? 'bg-green-200 text-green-800'
                              : 'bg-white border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frage 3 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">
                    3. Wie hoch wären die geschätzten Steuerausfälle pro Jahr?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['200 Mio. Fr.', '450 Mio. Fr.', '630 Mio. Fr.', '1 Mrd. Fr.'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q3: opt})}
                        disabled={quizSubmitted}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          quizAnswers.q3 === opt 
                            ? quizSubmitted 
                              ? opt === '630 Mio. Fr.' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white'
                            : quizSubmitted && opt === '630 Mio. Fr.' 
                              ? 'bg-green-200 text-green-800'
                              : 'bg-white border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {!quizSubmitted && quizAnswers.q1 && quizAnswers.q2 && quizAnswers.q3 && (
                <button 
                  onClick={() => {
                    setQuizSubmitted(true)
                    if (!completedSections.has('quiz')) {
                      completeSection('quiz', 30)
                    }
                  }}
                  className="mt-6 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                >
                  Antworten prüfen
                </button>
              )}
              
              {quizSubmitted && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg text-green-800">
                  <strong>✓ Lernkontrolle abgeschlossen!</strong>
                  <p className="text-sm mt-1">
                    Richtige Antworten: 1,7 Millionen zusätzliche Steuererklärungen, 
                    Kinderabzug auf 12'000 Fr., 630 Mio. Fr. Steuerausfälle.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 4: Audio-Beiträge SRF */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'audio' ? null : 'audio')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">🎧 SRF Radio-Beiträge</span>
              {completedSections.has('audio') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+25P ✓</span>
              )}
            </div>
            {openSection === 'audio' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'audio' && (
            <div className="p-6 border-t">
              <p className="text-gray-600 text-sm mb-4">
                Hören Sie die Einschätzungen von SRF-Journalisten. Markieren Sie die Beiträge als gehört:
              </p>
              
              <div className="space-y-4">
                {/* Rendez-vous */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-600 p-2 rounded-lg">
                        <Volume2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">SRF Rendez-vous</p>
                        <p className="text-xs text-gray-600">Wer profitiert, wer verliert?</p>
                      </div>
                    </div>
                    {audioListened.has('rendezvous') && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </div>
                  <div className="p-4">
                    <audio 
                      controls 
                      className="w-full"
                      onEnded={() => {
                        const newListened = new Set(audioListened)
                        newListened.add('rendezvous')
                        setAudioListened(newListened)
                      }}
                    >
                      <source src="https://www.srf.ch/play/radio/redirect/detail/0a5f5262-293a-3556-bdf1-9ede96808d61" type="audio/mpeg" />
                    </audio>
                    <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                      <strong>Kernaussagen:</strong>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• FDP, SP, Grüne, GLP sind FÜR die Individualbesteuerung</li>
                        <li>• SVP und Mitte sind DAGEGEN</li>
                        <li>• Doppelverdiener-Ehepaare profitieren tendenziell</li>
                        <li>• Einverdiener-Ehepaare würden mehr bezahlen</li>
                      </ul>
                    </div>
                    {!audioListened.has('rendezvous') && (
                      <button 
                        onClick={() => {
                          const newListened = new Set(audioListened)
                          newListened.add('rendezvous')
                          setAudioListened(newListened)
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ✓ Als gehört markieren
                      </button>
                    )}
                  </div>
                </div>

                {/* Echo der Zeit */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-600 p-2 rounded-lg">
                        <Volume2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">SRF Echo der Zeit</p>
                        <p className="text-xs text-gray-600">Auswirkungen auf den Arbeitsmarkt</p>
                      </div>
                    </div>
                    {audioListened.has('echo') && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </div>
                  <div className="p-4">
                    <audio 
                      controls 
                      className="w-full"
                      onEnded={() => {
                        const newListened = new Set(audioListened)
                        newListened.add('echo')
                        setAudioListened(newListened)
                      }}
                    >
                      <source src="https://www.srf.ch/play/radio/redirect/detail/3a4f8b4b-cbe9-3b28-a210-21977898e358" type="audio/mpeg" />
                    </audio>
                    <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                      <strong>Kernaussagen:</strong>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• Schätzung: 15'000-20'000 neue Vollzeitstellen</li>
                        <li>• Vor allem Frauen würden mehr arbeiten</li>
                        <li>• Ca. 11'500 Frauen würden neu erwerbstätig</li>
                        <li>• Effekt auf Gesamtarbeitsmarkt eher gering</li>
                      </ul>
                    </div>
                    {!audioListened.has('echo') && (
                      <button 
                        onClick={() => {
                          const newListened = new Set(audioListened)
                          newListened.add('echo')
                          setAudioListened(newListened)
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ✓ Als gehört markieren
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {audioListened.size >= 2 && !completedSections.has('audio') && (
                <button 
                  onClick={() => completeSection('audio', 25)}
                  className="mt-4 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                >
                  ✓ Audio-Beiträge abgeschlossen (+25 Punkte)
                </button>
              )}
              
              {completedSections.has('audio') && (
                <div className="mt-4 bg-green-100 rounded-lg p-4 flex items-center gap-3 text-green-800">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-semibold">Beide Audio-Beiträge angehört!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 5: Wer profitiert? Zuordnung */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'matching' ? null : 'matching')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <span className="font-semibold text-gray-900">Zuordnung: Wer profitiert?</span>
              {completedSections.has('matching') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+25P ✓</span>
              )}
            </div>
            {openSection === 'matching' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'matching' && (
            <div className="p-6 border-t">
              <p className="text-gray-600 text-sm mb-4">
                Ordnen Sie zu: Wer würde tendenziell mehr und wer weniger Steuern zahlen?
              </p>
              
              <div className="space-y-3">
                {[
                  { group: 'Doppelverdiener-Ehepaar mit ähnlichem Einkommen', correct: 'weniger' },
                  { group: 'Einverdiener-Ehepaar mit Kindern', correct: 'mehr' },
                  { group: 'Unverheiratete mit tiefem/mittlerem Einkommen', correct: 'weniger' },
                  { group: 'Gutverdienende Doppelverdiener', correct: 'weniger' },
                  { group: 'Ehepaar mit sehr ungleich verteiltem Einkommen', correct: 'mehr' },
                ].map((item, idx) => {
                  const answer = matchingAnswers[`m${idx}`]
                  const isCorrect = matchingSubmitted && answer === item.correct
                  const isWrong = matchingSubmitted && answer && answer !== item.correct
                  
                  return (
                    <div key={idx} className={`p-3 rounded-lg border ${isCorrect ? 'border-green-400 bg-green-50' : isWrong ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
                      <p className="text-sm font-medium text-gray-800 mb-2">{item.group}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => !matchingSubmitted && setMatchingAnswers({...matchingAnswers, [`m${idx}`]: 'weniger'})}
                          disabled={matchingSubmitted}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 ${
                            answer === 'weniger'
                              ? matchingSubmitted
                                ? item.correct === 'weniger' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-blue-500 text-white'
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
                                : 'bg-blue-500 text-white'
                              : matchingSubmitted && item.correct === 'mehr'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" /> Mehr Steuern
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {!matchingSubmitted && Object.keys(matchingAnswers).length >= 5 && (
                <button 
                  onClick={() => {
                    setMatchingSubmitted(true)
                    if (!completedSections.has('matching')) {
                      completeSection('matching', 25)
                    }
                  }}
                  className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
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
          )}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
            <p className="text-blue-100">Sie haben {totalScore} Punkte erreicht und kennen nun die offiziellen Informationen.</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
            >
              Weiter zum nächsten Modul
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
