import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, CheckCircle2, Play, Award, FileQuestion } from 'lucide-react'

interface H5PScore {
  section: number
  score: number
  maxScore: number
  completed: boolean
}

export default function ProContraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [h5pScores, setH5PScores] = useState<H5PScore[]>([
    { section: 1, score: 0, maxScore: 100, completed: false },
    { section: 2, score: 0, maxScore: 100, completed: false },
    { section: 3, score: 0, maxScore: 100, completed: false }
  ])
  const [totalScore, setTotalScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  
  const h5pRef1 = useRef<HTMLIFrameElement>(null)
  const h5pRef2 = useRef<HTMLIFrameElement>(null)
  const h5pRef3 = useRef<HTMLIFrameElement>(null)

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
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      }

      setLoading(false)
    }

    loadProgress()
  }, [router])

  // Listen for H5P events
  useEffect(() => {
    const handleH5PEvent = (event: MessageEvent) => {
      if (event.data && event.data.statement) {
        const statement = event.data.statement
        
        // Check for completion or answered events
        if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/completed' ||
            statement.verb?.id === 'http://adlnet.gov/expapi/verbs/answered') {
          
          const score = statement.result?.score?.raw || 0
          const maxScore = statement.result?.score?.max || 100
          const contentId = statement.object?.id || ''
          
          // Determine which section this event belongs to
          // You can customize this logic based on your H5P content IDs
          let section = 1
          if (contentId.includes('section2') || contentId.includes('h5p2')) {
            section = 2
          } else if (contentId.includes('section3') || contentId.includes('h5p3')) {
            section = 3
          }
          
          // Update the score for this section
          setH5PScores(prev => {
            const updated = prev.map(s => 
              s.section === section 
                ? { ...s, score, maxScore, completed: true }
                : s
            )
            return updated
          })
        }
      }
    }

    window.addEventListener('message', handleH5PEvent)
    return () => window.removeEventListener('message', handleH5PEvent)
  }, [])

  // Calculate total score and save progress
  useEffect(() => {
    const total = h5pScores.reduce((sum, item) => sum + item.score, 0)
    const allCompleted = h5pScores.every(item => item.completed)
    
    setTotalScore(total)
    
    if (allCompleted && !isCompleted) {
      setIsCompleted(true)
      saveProgress(total, true)
    } else if (h5pScores.some(item => item.completed)) {
      saveProgress(total, false)
    }
  }, [h5pScores])

  const saveProgress = async (score: number, completed: boolean) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        const completedCount = h5pScores.filter(s => s.completed).length
        const progress = Math.round((completedCount / 3) * 100)
        
        modules.procontra = {
          completed,
          score,
          progress,
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
        const allModules = ['grundlagen', 'vertiefung', 'umfrage', 'procontra', 'lernkontrolle']
        const completedModules = allModules.filter(id => modules[id]?.completed).length
        const overallProgress = Math.round((completedModules / allModules.length) * 100)
        
        await updateDoc(userRef, {
          modules,
          totalPoints,
          overallProgress
        })
        
        // Create badge if completed
        if (completed) {
          const badges = userData.badges || {}
          if (!badges.procontra) {
            badges.procontra = {
              moduleId: 'procontra',
              moduleName: '4. Pro- und Contra',
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
              <div className="text-sm text-gray-600">
                Fortschritt: {h5pScores.filter(s => s.completed).length} / 3 Aufgaben
              </div>
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Abgeschlossen: {totalScore} Punkte</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">4. Pro- und Contra</h1>
          <p className="text-lg text-gray-600 mb-6">
            Erkunden Sie verschiedene Perspektiven und Argumente zur Abstimmung
          </p>
          
          {/* Aufgabenstellung */}
          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
            <h2 className="text-xl font-bold text-teal-900 mb-3">📋 Aufgabenstellung</h2>
            <p className="text-teal-800 mb-3">
              In diesem Modul lernen Sie verschiedene Argumente <strong>PRO</strong> und <strong>CONTRA</strong> zur Abstimmung kennen.
            </p>
            <p className="text-teal-800 mb-3">
              <strong>Ablauf:</strong>
            </p>
            <ol className="list-decimal list-inside text-teal-800 space-y-2 ml-4">
              <li>Schauen Sie sich jedes Video aufmerksam an</li>
              <li>Bearbeiten Sie die interaktive Aufgabe direkt nach dem Video</li>
              <li>Die Aufgaben beziehen sich auf das jeweilige Video</li>
              <li>Ihre Punkte werden automatisch gespeichert</li>
            </ol>
          </div>
        </div>

        {/* SECTION 1: Video + H5P */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎬 Argument 1: PRO</h2>
          
          {/* Video Placeholder 1 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              <div className="text-center">
                <Play className="h-20 w-20 text-white mx-auto mb-4 opacity-50" />
                <p className="text-white text-lg font-semibold">Video Platzhalter 1</p>
                <p className="text-gray-300 text-sm mt-2">YouTube oder SRF Video hier einbetten</p>
              </div>
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 px-3 py-1 rounded text-white text-sm">
                ~5 Min
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                💡 <strong>Beispiel YouTube:</strong> <code className="bg-gray-200 px-2 py-1 rounded">&lt;iframe src="https://www.youtube.com/embed/VIDEO_ID"&gt;&lt;/iframe&gt;</code>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                💡 <strong>Beispiel SRF:</strong> <code className="bg-gray-200 px-2 py-1 rounded">&lt;iframe src="https://www.srf.ch/play/embed/..."&gt;&lt;/iframe&gt;</code>
              </p>
            </div>
          </div>

          {/* H5P Placeholder 1 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileQuestion className="h-6 w-6 text-teal-600" />
              <h3 className="text-xl font-bold text-gray-900">Aufgabe 1</h3>
              {h5pScores[0].completed && (
                <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {h5pScores[0].score} / {h5pScores[0].maxScore} Punkte
                </span>
              )}
            </div>
            
            <div className="border-2 border-dashed border-teal-300 rounded-lg p-8 bg-teal-50 text-center">
              <FileQuestion className="h-16 w-16 text-teal-400 mx-auto mb-4" />
              <p className="text-teal-900 font-semibold mb-2">H5P Aufgabe Platzhalter 1</p>
              <p className="text-teal-700 text-sm mb-4">
                Hier wird Ihre H5P-Aufgabe eingebettet (z.B. Multiple Choice, Drag & Drop, etc.)
              </p>
              <div className="bg-white border-2 border-teal-200 rounded p-4 text-left">
                <p className="text-xs text-gray-600 mb-2"><strong>Einbetten:</strong></p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  &lt;iframe ref={'{h5pRef1}'} src="/h5p/procontra-aufgabe1.html" ...&gt;&lt;/iframe&gt;
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Video + H5P */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎬 Argument 2: CONTRA</h2>
          
          {/* Video Placeholder 2 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              <div className="text-center">
                <Play className="h-20 w-20 text-white mx-auto mb-4 opacity-50" />
                <p className="text-white text-lg font-semibold">Video Platzhalter 2</p>
                <p className="text-gray-300 text-sm mt-2">YouTube oder SRF Video hier einbetten</p>
              </div>
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 px-3 py-1 rounded text-white text-sm">
                ~5 Min
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                💡 Fügen Sie hier Ihr zweites Video ein
              </p>
            </div>
          </div>

          {/* H5P Placeholder 2 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileQuestion className="h-6 w-6 text-teal-600" />
              <h3 className="text-xl font-bold text-gray-900">Aufgabe 2</h3>
              {h5pScores[1].completed && (
                <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {h5pScores[1].score} / {h5pScores[1].maxScore} Punkte
                </span>
              )}
            </div>
            
            <div className="border-2 border-dashed border-teal-300 rounded-lg p-8 bg-teal-50 text-center">
              <FileQuestion className="h-16 w-16 text-teal-400 mx-auto mb-4" />
              <p className="text-teal-900 font-semibold mb-2">H5P Aufgabe Platzhalter 2</p>
              <p className="text-teal-700 text-sm mb-4">
                Hier wird Ihre zweite H5P-Aufgabe eingebettet
              </p>
              <div className="bg-white border-2 border-teal-200 rounded p-4 text-left">
                <p className="text-xs text-gray-600 mb-2"><strong>Einbetten:</strong></p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  &lt;iframe ref={'{h5pRef2}'} src="/h5p/procontra-aufgabe2.html" ...&gt;&lt;/iframe&gt;
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Video + H5P */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎬 Argument 3: PRO & CONTRA im Vergleich</h2>
          
          {/* Video Placeholder 3 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              <div className="text-center">
                <Play className="h-20 w-20 text-white mx-auto mb-4 opacity-50" />
                <p className="text-white text-lg font-semibold">Video Platzhalter 3</p>
                <p className="text-gray-300 text-sm mt-2">YouTube oder SRF Video hier einbetten</p>
              </div>
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 px-3 py-1 rounded text-white text-sm">
                ~5 Min
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                💡 Fügen Sie hier Ihr drittes Video ein
              </p>
            </div>
          </div>

          {/* H5P Placeholder 3 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileQuestion className="h-6 w-6 text-teal-600" />
              <h3 className="text-xl font-bold text-gray-900">Aufgabe 3</h3>
              {h5pScores[2].completed && (
                <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {h5pScores[2].score} / {h5pScores[2].maxScore} Punkte
                </span>
              )}
            </div>
            
            <div className="border-2 border-dashed border-teal-300 rounded-lg p-8 bg-teal-50 text-center">
              <FileQuestion className="h-16 w-16 text-teal-400 mx-auto mb-4" />
              <p className="text-teal-900 font-semibold mb-2">H5P Aufgabe Platzhalter 3</p>
              <p className="text-teal-700 text-sm mb-4">
                Hier wird Ihre dritte H5P-Aufgabe eingebettet
              </p>
              <div className="bg-white border-2 border-teal-200 rounded p-4 text-left">
                <p className="text-xs text-gray-600 mb-2"><strong>Einbetten:</strong></p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  &lt;iframe ref={'{h5pRef3}'} src="/h5p/procontra-aufgabe3.html" ...&gt;&lt;/iframe&gt;
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Summary */}
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
                  Sie haben <strong>{totalScore} von 300 Punkten</strong> erreicht.
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
