import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, CheckCircle2, Clock, Trophy, Award } from 'lucide-react'
import { moduleData, setupH5PListener, H5PEvent } from '@/lib/abstimmungModuleContent'

export default function ModulePage() {
  const router = useRouter()
  const { moduleId } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [moduleScore, setModuleScore] = useState(0)
  const [moduleProgress, setModuleProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const module = moduleId ? moduleData[moduleId as string] : null

  useEffect(() => {
    if (!moduleId || !module) return

    const loadModuleProgress = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const moduleData = userData.modules?.[moduleId as string]
          
          if (moduleData) {
            setModuleScore(moduleData.score || 0)
            setModuleProgress(moduleData.progress || 0)
            setIsCompleted(moduleData.completed || false)
          }
        }
      } catch (error) {
        console.error('Error loading module progress:', error)
      }

      setLoading(false)
    }

    loadModuleProgress()
  }, [moduleId, module, router])

  useEffect(() => {
    if (!iframeRef.current || !module?.h5pUrl) return

    // Setup H5P Event Listener
    const cleanup = setupH5PListener(iframeRef.current, handleH5PEvent)

    return cleanup
  }, [module])

  const handleH5PEvent = async (event: H5PEvent) => {
    console.log('H5P Event:', event)

    const user = auth.currentUser
    if (!user || !moduleId) return

    try {
      if (event.type === 'completed') {
        const score = event.data.score || 0
        const maxScore = event.data.maxScore || module?.maxPoints || 100
        
        // Calculate score based on module's maxPoints
        const normalizedScore = Math.round((score / maxScore) * (module?.maxPoints || 100))
        
        setModuleScore(normalizedScore)
        setModuleProgress(100)
        setIsCompleted(true)
        setShowSuccess(true)

        await saveProgress(normalizedScore, 100, true)
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000)
      } else if (event.type === 'progress') {
        const progress = event.data.progress || 0
        setModuleProgress(progress)
        
        await saveProgress(moduleScore, progress, false)
      } else if (event.type === 'scored') {
        const score = event.data.score || 0
        const maxScore = event.data.maxScore || module?.maxPoints || 100
        
        const normalizedScore = Math.round((score / maxScore) * (module?.maxPoints || 100))
        setModuleScore(normalizedScore)
        
        await saveProgress(normalizedScore, moduleProgress, false)
      }
    } catch (error) {
      console.error('Error handling H5P event:', error)
    }
  }

  const saveProgress = async (score: number, progress: number, completed: boolean) => {
    const user = auth.currentUser
    if (!user || !moduleId) return

    setSaving(true)

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        // Update module data
        modules[moduleId as string] = {
          completed,
          score,
          progress,
          lastUpdated: new Date().toISOString()
        }
        
        // Calculate total points (only from completed modules)
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
        if (completed && module) {
          const badges = userData.badges || {}
          if (!badges[moduleId as string]) {
            badges[moduleId as string] = {
              moduleId: moduleId as string,
              moduleName: module.title,
              lerncode: userData.code,
              issuedAt: new Date().toISOString()
            }
            
            await updateDoc(userRef, { badges })
          }
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
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

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Modul nicht gefunden</p>
          <button
            onClick={handleBackToDashboard}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Zurück zum Dashboard
          </button>
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
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Zurück</span>
            </button>
            
            <div className="flex items-center gap-4">
              {saving && (
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  Speichere...
                </span>
              )}
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  Abgeschlossen
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="bg-green-500 rounded-full p-3">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  🎉 Glückwunsch! Modul abgeschlossen!
                </h3>
                <p className="text-green-700 mb-2">
                  Sie haben <strong>{moduleScore} von {module.maxPoints} Punkten</strong> erreicht.
                </p>
                <p className="text-sm text-green-600">
                  Ihr Fortschritt wurde automatisch gespeichert. Kehren Sie zum Dashboard zurück, um fortzufahren.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Module Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
              <p className="text-gray-600 mb-4">{module.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{module.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Trophy className="h-4 w-4" />
                  <span>Max. {module.maxPoints} Punkte</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Fortschritt</span>
              <span className="text-sm font-semibold text-teal-600">{moduleProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${moduleProgress}%` }}
              />
            </div>
            {moduleScore > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Aktuelle Punktzahl: {moduleScore} / {module.maxPoints}
              </p>
            )}
          </div>
        </div>

        {/* H5P Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interaktives Lernmodul</h2>
            
            {module.h5pUrl ? (
              <div className="relative w-full" style={{ minHeight: '600px' }}>
                <iframe
                  ref={iframeRef}
                  src={module.h5pUrl}
                  className="w-full border-2 border-gray-200 rounded-lg"
                  style={{ minHeight: '600px', height: '80vh' }}
                  title={module.title}
                  allow="autoplay; fullscreen"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Keine H5P-Inhalte verfügbar</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Zurück zum Dashboard
          </button>
          
          {isCompleted && (
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              Weiter zum Dashboard
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
