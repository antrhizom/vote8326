import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Award, Download, ArrowLeft, Calendar, CheckCircle, Star } from 'lucide-react'
import { moduleData } from '@/lib/abstimmungModuleContent'

interface UserData {
  lernname: string
  code: string
  modules: {
    [key: string]: {
      score?: number
      completed?: boolean
      progress?: number
    }
  }
}

export default function ModuleBadge() {
  const router = useRouter()
  const { moduleId } = router.query
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/')
        return
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData)
      }

      setLoading(false)
    }

    if (router.isReady) {
      loadUserData()
    }
  }, [router])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const module = moduleId ? moduleData[moduleId as string] : null
  const moduleProgress = moduleId && userData?.modules?.[moduleId as string]

  if (!userData || !module || !moduleProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Modul nicht gefunden</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-teal-600 hover:underline"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Berechne Prozentsatz
  const maxPoints = module.maxPoints
  const earnedPoints = moduleProgress.score || 0
  const percentage = Math.round((earnedPoints / maxPoints) * 100)

  // Badge-Anforderung: mindestens 60%
  const badgeUnlocked = percentage >= 60

  if (!badgeUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Badge noch nicht freigeschaltet</h2>
          <p className="text-gray-600 mb-4">
            Sie benötigen mindestens <strong>60%</strong> in diesem Modul, um das Badge zu erhalten.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">{module.title}</p>
            <p className="text-3xl font-bold text-teal-600">{percentage}%</p>
            <p className="text-sm text-gray-500">{earnedPoints} / {maxPoints} Punkte</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className="bg-teal-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            <div className="relative">
              <div
                className="absolute -top-3 w-0.5 h-3 bg-red-500"
                style={{ left: '60%' }}
              />
              <span className="absolute -top-6 text-xs text-red-500" style={{ left: '55%' }}>60%</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 mx-auto bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Badge-Level basierend auf Prozentsatz
  const getBadgeLevel = () => {
    if (percentage >= 90) return { level: 'Gold', color: 'from-yellow-400 to-amber-500', textColor: 'text-yellow-600', emoji: '🥇', stars: 3 }
    if (percentage >= 75) return { level: 'Silber', color: 'from-gray-300 to-gray-400', textColor: 'text-gray-600', emoji: '🥈', stars: 2 }
    return { level: 'Bronze', color: 'from-orange-300 to-orange-400', textColor: 'text-orange-600', emoji: '🥉', stars: 1 }
  }

  const badge = getBadgeLevel()

  // Modul-spezifische Farben
  const moduleColors: { [key: string]: string } = {
    ausgangslage: 'from-blue-500 to-blue-600',
    grundlagen: 'from-green-500 to-green-600',
    procontra: 'from-purple-500 to-purple-600',
    vertiefung: 'from-orange-500 to-orange-600',
    spielerisch: 'from-pink-500 to-pink-600'
  }

  const moduleColor = moduleColors[moduleId as string] || 'from-teal-500 to-teal-600'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="print:hidden bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Zurück zum Dashboard
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Als PDF drucken
          </button>
        </div>
      </div>

      {/* Badge */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div
          ref={badgeRef}
          className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none"
        >
          {/* Badge Header */}
          <div className={`bg-gradient-to-br ${moduleColor} px-8 py-6 text-white text-center`}>
            <div className="text-5xl mb-2">{badge.emoji}</div>
            <h1 className="text-2xl font-bold">Modul-Badge</h1>
            <p className="text-white/80 text-sm">{badge.level}-Stufe</p>
          </div>

          {/* Badge Content */}
          <div className="px-8 py-6">
            {/* Sterne */}
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${star <= badge.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">{module.title}</h2>
              <p className="text-gray-500 text-sm">Individualbesteuerung</p>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm mb-1">Verliehen an</p>
              <h3 className="text-2xl font-bold text-gray-900">{userData.lernname}</h3>
              <p className="text-gray-400 text-xs">Code: {userData.code}</p>
            </div>

            {/* Ergebnis */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lernerfolg</p>
                  <p className={`text-3xl font-bold ${badge.textColor}`}>{percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Punkte</p>
                  <p className="text-xl font-semibold text-gray-900">{earnedPoints} / {maxPoints}</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${badge.color} h-2 rounded-full`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Datum */}
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{currentDate}</span>
            </div>
          </div>

          {/* Footer */}
          <div className={`bg-gradient-to-r ${moduleColor} bg-opacity-10 px-8 py-4 text-center border-t`}>
            <p className="text-xs text-gray-600">
              Abstimmung vom 8. März 2026 – Individualbesteuerung
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          @page { size: A5 portrait; margin: 1cm; }
        }
      `}</style>
    </div>
  )
}
