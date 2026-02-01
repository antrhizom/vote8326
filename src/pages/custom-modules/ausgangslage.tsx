import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, CheckCircle2, Award, ChevronDown, ChevronUp, X,
  Sparkles, Clock, Play, FileText, Vote, Film, ExternalLink
} from 'lucide-react'

// ===========================================
// AUSGANGSLAGE MODULE
// ===========================================

export default function AusgangslagePage() {
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
  
  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: string}>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  
  const maxPoints = 100
  const VIDEO_DURATION = 450 // 7:30 minutes for the history video (approx)

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.ausgangslage
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
        
        const allComplete = completed.length >= 4 // intro, survey, referendum, video
        
        modules.ausgangslage = {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const isComplete = completedSections.size >= 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0 z-10">
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
          <h1 className="text-xl font-bold mt-2">1. Ausgangslage kollaborativ interaktiv</h1>
          <p className="text-purple-200 text-sm">Abstimmung vom 8. März 2026</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        
        {/* SECTION 1: Einführung */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'intro' ? null : 'intro')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Einführung: Ihre Ausgangslage</span>
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
                  Am <strong>8. März 2026</strong> stimmt die Schweiz über die <strong>Individualbesteuerung</strong> ab. 
                  Diese Vorlage würde das Steuersystem grundlegend verändern: Künftig würden Ehepaare getrennt 
                  besteuert – genau wie unverheiratete Paare heute schon.
                </p>
                
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                  <p className="text-purple-900 font-medium mb-2">🎯 Lernziele dieses Moduls:</p>
                  <ul className="text-purple-800 text-sm space-y-1">
                    <li>• Ihre eigene Ausgangslage reflektieren</li>
                    <li>• Das politische Instrument des Referendums verstehen</li>
                    <li>• Die Geschichte der Heiratsstrafe kennenlernen</li>
                  </ul>
                </div>
                
                <p className="text-gray-700">
                  Bevor wir in die Details gehen, interessiert uns: <strong>Wie ist Ihre persönliche Ausgangslage?</strong> 
                  Füllen Sie die kurze Umfrage aus und sehen Sie später, wie andere Teilnehmer:innen geantwortet haben.
                </p>
              </div>
              
              {!completedSections.has('intro') && (
                <button 
                  onClick={() => completeSection('intro', 15)}
                  className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold"
                >
                  ✓ Einführung gelesen
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Findmind Umfrage */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'survey' ? null : 'survey')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <span className="font-semibold text-gray-900">Umfrage: Ihre Ausgangslage</span>
              {completedSections.has('survey') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+20P ✓</span>
              )}
            </div>
            {openSection === 'survey' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'survey' && (
            <div className="p-6 border-t">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  <strong>📝 Anonyme Umfrage:</strong> Ihre Antworten helfen uns, die Ergebnisse später zu filtern. 
                  Sie können dann sehen, wie andere mit ähnlicher Ausgangslage geantwortet haben.
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                <iframe 
                  src="https://findmind.ch/c/Gi3E-hSdy"
                  className="w-full h-[500px] border-0"
                  title="Ausgangslage Umfrage"
                />
              </div>
              
              <p className="text-sm text-gray-500 mt-3 text-center">
                Nach dem Ausfüllen der Umfrage klicken Sie auf "Abgeschlossen"
              </p>
              
              {!completedSections.has('survey') && (
                <button 
                  onClick={() => completeSection('survey', 20)}
                  className="mt-4 w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                >
                  ✓ Umfrage abgeschlossen
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: Referendum erklärt */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'referendum' ? null : 'referendum')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <Vote className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Das Referendum als politisches Instrument</span>
              {completedSections.has('referendum') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+40P ✓</span>
              )}
            </div>
            {openSection === 'referendum' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'referendum' && (
            <div className="p-6 border-t">
              {/* Info Section */}
              <div className="space-y-4 mb-6">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-bold text-indigo-900 mb-2">🗳️ Was ist ein Referendum?</h4>
                  <p className="text-indigo-800 text-sm">
                    Das Referendum ist ein zentrales Instrument der direkten Demokratie in der Schweiz. 
                    Es ermöglicht den Stimmberechtigten, über Entscheide des Parlaments abzustimmen.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-900 mb-2">Obligatorisches Referendum</h5>
                    <p className="text-blue-800 text-sm">
                      Bei Verfassungsänderungen <strong>muss</strong> immer das Volk abstimmen. 
                      Gilt seit 1848 für alle Änderungen der Bundesverfassung.
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-semibold text-green-900 mb-2">Fakultatives Referendum</h5>
                    <p className="text-green-800 text-sm">
                      Gegen Bundesgesetze kann innerhalb von 100 Tagen ein Referendum ergriffen werden. 
                      Benötigt: <strong>50'000 Unterschriften</strong> oder <strong>8 Kantone</strong>.
                    </p>
                  </div>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <h5 className="font-semibold text-orange-900 mb-2">🏛️ Das Kantonsreferendum bei der Individualbesteuerung</h5>
                  <p className="text-orange-800 text-sm mb-2">
                    Bei der Individualbesteuerung haben <strong>10 Kantone</strong> das Referendum ergriffen – 
                    das ist erst das <strong>zweite Mal</strong> in der Schweizer Geschichte!
                  </p>
                  <p className="text-orange-700 text-xs">
                    Das erste Kantonsreferendum war 2003 gegen ein Steuerpaket. Das Volk lehnte es mit 65.9% ab.
                  </p>
                </div>
              </div>
              
              {/* Quiz */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-4">📝 Kurze Lernkontrolle</h4>
                
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-800 mb-2">1. Wie viele Kantone braucht es für ein Kantonsreferendum?</p>
                    <div className="flex flex-wrap gap-2">
                      {['5', '8', '10', '13'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q1: opt})}
                          disabled={quizSubmitted}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            quizAnswers.q1 === opt 
                              ? quizSubmitted 
                                ? opt === '8' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-purple-500 text-white'
                              : quizSubmitted && opt === '8' 
                                ? 'bg-green-200 text-green-800'
                                : 'bg-white border border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {opt} Kantone
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-800 mb-2">2. Wie viele Unterschriften braucht ein fakultatives Referendum?</p>
                    <div className="flex flex-wrap gap-2">
                      {['30\'000', '50\'000', '100\'000'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q2: opt})}
                          disabled={quizSubmitted}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            quizAnswers.q2 === opt 
                              ? quizSubmitted 
                                ? opt === '50\'000' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-purple-500 text-white'
                              : quizSubmitted && opt === '50\'000' 
                                ? 'bg-green-200 text-green-800'
                                : 'bg-white border border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-800 mb-2">3. Wann war das erste Kantonsreferendum in der Schweiz?</p>
                    <div className="flex flex-wrap gap-2">
                      {['1984', '2003', '2024'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q3: opt})}
                          disabled={quizSubmitted}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            quizAnswers.q3 === opt 
                              ? quizSubmitted 
                                ? opt === '2003' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-purple-500 text-white'
                              : quizSubmitted && opt === '2003' 
                                ? 'bg-green-200 text-green-800'
                                : 'bg-white border border-gray-300 hover:border-purple-400'
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
                      if (!completedSections.has('referendum')) {
                        completeSection('referendum', 40)
                      }
                    }}
                    className="mt-4 w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                  >
                    Antworten prüfen
                  </button>
                )}
                
                {quizSubmitted && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg text-green-800 text-sm">
                    <strong>✓ Lernkontrolle abgeschlossen!</strong> Die richtigen Antworten sind: 8 Kantone, 50'000 Unterschriften, 2003.
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                <a href="https://hls-dhs-dss.ch/de/articles/010387/2011-12-23/" target="_blank" rel="noopener" className="hover:underline">
                  Quelle: Historisches Lexikon der Schweiz (CC BY-SA)
                </a>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Geschichte Video */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'video' ? null : 'video')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Video: Der Weg zur Individualbesteuerung</span>
              {completedSections.has('video') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+25P ✓</span>
              )}
            </div>
            {openSection === 'video' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'video' && (
            <div className="p-6 border-t">
              <p className="text-gray-700 text-sm mb-4">
                Dieses Video erklärt die Geschichte der "Heiratsstrafe" und warum es über 40 Jahre gedauert hat, 
                bis eine Lösung gefunden wurde.
              </p>
              
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <iframe 
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/wP8DA6YHkJo"
                  title="Geschichte der Heiratsstrafe"
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
                      {videoStarted ? 'Video läuft...' : 'Klicken Sie auf Play'}
                    </span>
                    <span className="text-sm font-mono text-gray-700">
                      {formatTime(videoTimer)} / {formatTime(VIDEO_DURATION)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${videoTimer >= VIDEO_DURATION ? 'bg-green-500' : 'bg-purple-500'}`}
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

        {/* Completion Message */}
        {isComplete && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
            <p className="text-purple-100">Sie haben {totalScore} Punkte erreicht und kennen nun die Ausgangslage.</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50"
            >
              Weiter zum nächsten Modul
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
