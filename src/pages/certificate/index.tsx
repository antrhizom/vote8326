import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Award, Download, ArrowLeft, Calendar, CheckCircle, Vote } from 'lucide-react'

interface UserData {
  lernname: string
  code: string
  modules: {
    ausgangslage?: { score?: number; completed?: boolean }
    grundlagen?: { score?: number; completed?: boolean }
    procontra?: { score?: number; completed?: boolean }
    vertiefung?: { score?: number; completed?: boolean; bonusScore?: number }
    spielerisch?: { score?: number; completed?: boolean }
  }
  totalPoints?: number
  totalBonus?: number
}

const MODULE_TITLES = [
  { id: 'ausgangslage', title: 'Ausgangslage', maxPoints: 100 },
  { id: 'grundlagen', title: 'Grundlagen Info Bund Medien', maxPoints: 100 },
  { id: 'procontra', title: 'Pro & Contra', maxPoints: 100 },
  { id: 'vertiefung', title: 'Vertiefung interaktiv', maxPoints: 100 },
  { id: 'spielerisch', title: 'Spielerisch lernen', maxPoints: 100 }
]

export default function Certificate() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const certificateRef = useRef<HTMLDivElement>(null)

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

    loadUserData()
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

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Zertifikat nicht gefunden</h2>
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

  // Berechne Gesamtpunkte
  const modules = userData.modules || {}
  let totalPoints = 0
  let totalBonus = 0
  const maxPoints = 500

  MODULE_TITLES.forEach(m => {
    const mod = modules[m.id as keyof typeof modules]
    if (mod?.score) totalPoints += mod.score
    if ((mod as any)?.bonusScore) totalBonus += (mod as any).bonusScore
  })

  const progress = Math.round((totalPoints / maxPoints) * 100)
  const completedModules = MODULE_TITLES.filter(m => modules[m.id as keyof typeof modules]?.completed).length
  const modulesProgress = Math.round((completedModules / 5) * 100)

  // Anforderungen:
  // - Badge: mindestens 60% der Module erfüllt (= mindestens 3 von 5 Modulen)
  // - Zertifikat: mindestens 3 Module UND durchschnittlich 60% Punktzahl
  const badgeUnlocked = completedModules >= 3 // 60% der Module = 3 von 5
  const certificateUnlocked = completedModules >= 3 && progress >= 60

  // Prüfe ob Badge freigeschaltet wurde
  if (!badgeUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Badge noch nicht freigeschaltet</h2>
          <p className="text-gray-600 mb-6">
            Sie benötigen mindestens <strong>60% der Module</strong> (3 von 5 Modulen), um das Badge zu erhalten.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Module abgeschlossen</p>
                <p className="text-2xl font-bold text-teal-600">{completedModules} / 5</p>
                <p className="text-xs text-gray-500">({modulesProgress}%)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Punktzahl</p>
                <p className="text-2xl font-bold text-gray-900">{progress}%</p>
                <p className="text-xs text-gray-500">{totalPoints} / {maxPoints}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Für ein <strong>Zertifikat</strong> benötigen Sie zusätzlich mindestens 60% der Gesamtpunkte.
          </p>
          {totalBonus > 0 && (
            <p className="text-sm text-yellow-600 mb-4">✨ Bonus-Punkte: +{totalBonus}</p>
          )}
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

  // Badge-Stufe basierend auf Punktzahl
  const getBadgeLevel = () => {
    if (progress >= 90) return { level: 'Gold', color: 'from-yellow-500 to-amber-600', emoji: '🥇' }
    if (progress >= 75) return { level: 'Silber', color: 'from-gray-400 to-gray-500', emoji: '🥈' }
    return { level: 'Bronze', color: 'from-orange-400 to-orange-600', emoji: '🥉' }
  }

  const badge = getBadgeLevel()

  // Bestimme ob es sich um ein Badge oder Zertifikat handelt
  const documentType = certificateUnlocked ? 'Zertifikat' : 'Badge'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - wird beim Drucken ausgeblendet */}
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

      {/* Zertifikat/Badge */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div
          ref={certificateRef}
          className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
        >
          {/* Zertifikat Header */}
          <div className={`bg-gradient-to-r ${badge.color} px-12 py-8 text-white`}>
            <div className="text-center">
              <div className="text-6xl mb-4">{badge.emoji}</div>
              <h1 className="text-4xl font-bold mb-2">
                {certificateUnlocked ? 'Lern-Zertifikat' : 'Lern-Badge'}
              </h1>
              <p className="text-xl opacity-90">{badge.level}-Stufe</p>
              {!certificateUnlocked && (
                <p className="text-sm mt-2 opacity-75">
                  (Zertifikat ab 60% Punktzahl und 3 Modulen)
                </p>
              )}
            </div>
          </div>

          {/* Badge Inhalt */}
          <div className="px-12 py-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Vote className="h-8 w-8 text-teal-600" />
                <h2 className="text-2xl font-bold text-teal-700">Individualbesteuerung</h2>
              </div>
              <p className="text-gray-600 text-lg mb-4">
                {certificateUnlocked ? 'Dieses Zertifikat wird verliehen an' : 'Dieses Badge wird verliehen an'}
              </p>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">{userData.lernname}</h2>
              <p className="text-gray-500">Lerncode: {userData.code}</p>
            </div>

            <div className="border-t border-b border-gray-200 py-8 mb-8">
              <p className="text-center text-gray-700 text-lg leading-relaxed">
                für die erfolgreiche Teilnahme am Lernset zur Abstimmung vom<br />
                <span className="font-bold text-teal-600 text-2xl">8. März 2026</span><br />
                <span className="text-gray-600">Volksinitiative «Individualbesteuerung»</span>
              </p>
            </div>

            {/* Leistungsübersicht */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Leistungsübersicht
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Erreichte Punkte</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                  <p className="text-xs text-gray-500">von {maxPoints}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Erfolgsquote</p>
                  <p className="text-2xl font-bold text-green-600">{progress}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Module</p>
                  <p className="text-2xl font-bold text-teal-600">{completedModules}/5</p>
                  <p className="text-xs text-gray-500">abgeschlossen</p>
                </div>
              </div>

              {totalBonus > 0 && (
                <div className="text-center mb-4 p-2 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-semibold">✨ Bonus-Punkte: +{totalBonus}</span>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Abgeschlossene Module:</p>
                {MODULE_TITLES.map((module, index) => {
                  const mod = modules[module.id as keyof typeof modules]
                  const isCompleted = mod?.completed
                  return (
                    <div key={module.id} className={`flex items-center justify-between py-2 border-b border-gray-200 last:border-0 ${!isCompleted ? 'opacity-50' : ''}`}>
                      <span className="text-gray-700 flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-gray-300"></span>
                        )}
                        {index + 1}. {module.title}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {mod?.score || 0} / {module.maxPoints} P
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Datum und Signatur */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Ausstellungsdatum</span>
                </div>
                <p className="font-semibold text-gray-900">{currentDate}</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-t-2 border-gray-300 pt-2">
                  <p className="text-sm text-gray-600">Interaktives Lernset zur Abstimmung</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-12 py-6 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {certificateUnlocked
                ? 'Dieses Zertifikat bestätigt die erfolgreiche Teilnahme am interaktiven Lernset'
                : 'Dieses Badge bestätigt die Teilnahme am interaktiven Lernset'
              }<br />
              zur Volksabstimmung über die Individualbesteuerung vom 8. März 2026.
            </p>
            {!certificateUnlocked && (
              <p className="text-xs text-gray-500 mt-2">
                Hinweis: Für ein vollwertiges Zertifikat benötigen Sie mindestens 3 Module und 60% der Gesamtpunkte.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:rounded-none {
            border-radius: 0 !important;
          }

          @page {
            size: A4 portrait;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
