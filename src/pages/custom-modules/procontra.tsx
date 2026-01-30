import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, CheckCircle2, FileQuestion, Award, Clock, Play } from 'lucide-react'

export default function ProContraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [videoWatched, setVideoWatched] = useState(false)
  const [h5pCompleted, setH5pCompleted] = useState(false)
  const [h5pScore, setH5pScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  
  const h5pRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)

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
            setVideoWatched(moduleData.videoWatched || false)
            setH5pCompleted(moduleData.completed || false)
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      }

      setLoading(false)
    }

    loadProgress()
  }, [router])

  // Listen for H5P events from Lumi
  useEffect(() => {
    const handleH5PEvent = async (event: MessageEvent) => {
      // Lumi sends messages from their domain
      if (event.origin !== 'https://app.lumi.education') return
      
      try {
        // Check if this is an H5P xAPI statement
        if (event.data && event.data.statement) {
          const statement = event.data.statement
          
          console.log('H5P xAPI Event received:', statement.verb?.id)
          
          // Handle completion or answered events
          if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/completed' ||
              statement.verb?.id === 'http://adlnet.gov/expapi/verbs/answered') {
            
            const score = statement.result?.score?.raw || 0
            const maxScore = statement.result?.score?.max || 100
            
            // Normalize score to 100
            const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
            
            console.log('Score received:', score, '/', maxScore, '→', normalizedScore)
            
            setH5pScore(normalizedScore)
            setH5pCompleted(true)
            
            // Save progress
            if (videoWatched) {
              await saveProgress(normalizedScore, true, true)
            } else {
              await saveProgress(normalizedScore, false, true)
            }
          }
        }
        
        // Also listen for Lumi-specific completion messages
        if (event.data && event.data.context === 'h5p' && event.data.action === 'completed') {
          console.log('Lumi completion event received')
          setH5pCompleted(true)
        }
      } catch (error) {
        console.error('Error processing H5P event:', error)
      }
    }

    window.addEventListener('message', handleH5PEvent)
    return () => window.removeEventListener('message', handleH5PEvent)
  }, [videoWatched])

  // Track video progress (simplified - mark as watched after 30 seconds)
  useEffect(() => {
    if (!videoWatched) {
      const timer = setTimeout(() => {
        setVideoWatched(true)
        setVideoProgress(100)
        saveProgress(h5pScore, true, h5pCompleted)
      }, 30000) // 30 seconds

      return () => clearTimeout(timer)
    }
  }, [h5pCompleted, h5pScore, videoWatched])

  const saveProgress = async (score: number, videoComplete: boolean, h5pComplete: boolean) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        const allComplete = videoComplete && h5pComplete
        const progress = (videoComplete ? 50 : 0) + (h5pComplete ? 50 : 0)
        
        modules.procontra = {
          completed: allComplete,
          score: score,
          progress: progress,
          videoWatched: videoComplete,
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
        
        if (allComplete) {
          setIsCompleted(true)
          setTotalScore(score)
          
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
              <span>Zurück zum Dashboard</span>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>~10 Min</span>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{totalScore} Punkte</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">3. Pro- und Contra: Bargeldinitiative</h1>
          <p className="text-lg text-gray-600 mb-6">
            Informieren Sie sich über die Argumente zur Bargeldinitiative und testen Sie Ihr Wissen
          </p>
          
          {/* Progress Indicators */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-lg border-2 ${videoWatched ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                {videoWatched ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Play className="h-5 w-5 text-gray-400" />
                )}
                <span className={`font-semibold ${videoWatched ? 'text-green-700' : 'text-gray-600'}`}>
                  Video {videoWatched ? 'angeschaut' : 'ansehen'}
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-lg border-2 ${h5pCompleted ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                {h5pCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <FileQuestion className="h-5 w-5 text-gray-400" />
                )}
                <span className={`font-semibold ${h5pCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                  Aufgabe {h5pCompleted ? `gelöst (${h5pScore}%)` : 'lösen'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Infotext */}
          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
            <h2 className="text-xl font-bold text-teal-900 mb-3">📋 Über die Bargeldinitiative</h2>
            <div className="text-teal-800 space-y-3">
              <p>
                <strong>[PLATZHALTER - Hier kommt Ihr Einführungstext]</strong>
              </p>
              <p>
                Die Bargeldinitiative fordert, dass Bargeld als gesetzliches Zahlungsmittel in der Schweiz 
                erhalten bleibt. Informieren Sie sich über die verschiedenen Perspektiven zu diesem wichtigen Thema.
              </p>
              <p>
                <strong>Aufgabe:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Schauen Sie sich das SRF-Video aufmerksam an (ca. 5 Minuten)</li>
                <li>Bearbeiten Sie anschließend die interaktive Aufgabe</li>
                <li>Ihre Punkte werden automatisch gespeichert</li>
              </ol>
            </div>
          </div>
        </div>

        {/* SRF Video */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎬 SRF Beitrag: Bargeld-Initiative</h2>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <iframe 
              ref={videoRef}
              className="w-full aspect-video"
              src="https://www.srf.ch/play/embed?urn=urn:srf:video:49db5663-1827-4faa-bc6a-75af51f1c8df"
              title="SRF Beitrag Bargeld-Initiative"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                📺 Schauen Sie sich das Video vollständig an, bevor Sie mit der Aufgabe fortfahren.
              </p>
            </div>
          </div>
        </div>

        {/* H5P Aufgabe */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Interaktive Aufgabe</h2>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileQuestion className="h-6 w-6 text-teal-600" />
                <h3 className="text-xl font-bold text-gray-900">Aussagen zur Bargeld-Initiative</h3>
              </div>
              {h5pCompleted && (
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {h5pScore} Punkte
                </span>
              )}
            </div>
            
            {/* Lumi H5P Embed */}
            <div className="relative">
              <iframe 
                ref={h5pRef}
                src="https://app.lumi.education/api/v1/run/UZmjXP/embed" 
                className="w-full border-2 border-gray-200 rounded-lg"
                style={{ minHeight: '720px', height: '720px' }}
                title="H5P Aufgabe - Aussagen zur Bargeld-Initiative"
                frameBorder="0" 
                allowFullScreen
                allow="geolocation *; microphone *; camera *; midi *; encrypted-media *"
              />
            </div>
            
            {!h5pCompleted && (
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tipp:</strong> Bearbeiten Sie alle Aufgaben, um Ihre Punkte zu erhalten.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Completion Badge */}
        {isCompleted && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 rounded-full p-3">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  🎉 Glückwunsch! Modul abgeschlossen!
                </h3>
                <p className="text-gray-700">
                  Sie haben <strong>{totalScore} von 100 Punkten</strong> erreicht.
                </p>
              </div>
            </div>
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
