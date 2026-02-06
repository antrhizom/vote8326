import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  ArrowLeft, CheckCircle2, Award,
  Film, Radio, ThumbsUp, ThumbsDown, Star,
  Volume2, ChevronRight, ListOrdered, Info
} from 'lucide-react'

// ===========================================
// GRUNDLAGEN INFO BUND MEDIEN - KAPITEL-STRUKTUR
// Kapitel 1: Video (50P)
// Kapitel 2: Audio wählen (50P) + Bonus zweites Audio (+30)
// NEUE AUFGABE: Reihenfolge der Inhalte anklicken mit Kurzinfos
// ===========================================

// SRF Audio Embed URLs
const SRF_EMBED_URLS = {
  rendezvous: 'https://www.srf.ch/play/embed?urn=urn:srf:audio:0a5f5262-293a-3556-bdf1-9ede96808d61',
  echo: 'https://www.srf.ch/play/embed?urn=urn:srf:audio:3a4f8b4b-cbe9-3b28-a210-21977898e358'
}

// Reihenfolge-Inhalte für Rendez-vous
const RENDEZVOUS_SEQUENCE = [
  { id: 1, title: 'Einleitung: Abstimmung am 8. März', info: 'Die Individualbesteuerung wäre eine grosse Änderung des Steuersystems. Doppelverdiener profitieren, Einverdiener werden benachteiligt.' },
  { id: 2, title: 'Parteien-Positionen', info: 'Dafür: FDP, SP, Grüne, GLP. Dagegen: SVP und Mitte.' },
  { id: 3, title: 'Yvonne Bürgin (Mitte)', info: '«Die Ehe soll eine Wirtschaftsgemeinschaft bleiben. Das wollen wir beibehalten.»' },
  { id: 4, title: 'Katrin Bertschy (GLP)', info: '«Fast alle Länder in Europa haben Individualbesteuerung. Niemand behauptet, die Ehe sei gefährdet.»' },
  { id: 5, title: 'Wer profitiert, wer verliert', info: 'Doppelverdiener zahlen weniger (Heiratsstrafe fällt weg). Einverdiener zahlen mehr wegen Progression.' },
  { id: 6, title: 'Alternative der Mitte-Partei', info: 'Eigene Initiative: Steuern zweimal berechnen (als Verheiratete und Unverheiratete), tieferer Betrag gilt.' },
]

// Reihenfolge-Inhalte für Echo der Zeit
const ECHO_SEQUENCE = [
  { id: 1, title: 'Einleitung: Heiratsstrafe', info: 'Doppelverdiener-Ehepaare zahlen heute mehr Steuern als Unverheiratete. Das soll sich ändern.' },
  { id: 2, title: 'Problem der Progression', info: 'Wenn eine Person im Ehepaar das Pensum erhöht, bleibt oft nicht mehr Geld übrig – es geht an die Steuern.' },
  { id: 3, title: 'Studie Uni Luzern (Martin Mosler)', info: 'Schätzung: 15\'400 Personen treten neu in den Arbeitsmarkt ein, ca. 16\'300 neue Vollzeitstellen.' },
  { id: 4, title: 'Andere Studien bestätigen', info: '10\'000 bis 20\'000 neue Stellen durch mehr erwerbstätige Eheleute.' },
  { id: 5, title: 'Warum mehr Arbeit?', info: '«Mehr Lohn auf dem Konto führt dazu, dass Menschen mehr arbeiten wollen.»' },
  { id: 6, title: 'Effekt bei Frauen stärker', info: 'Ca. 11\'500 Frauen würden neu erwerbstätig. Effekt ist bei Frauen grösser, weil Pensen tiefer sind.' },
  { id: 7, title: 'Einschränkungen', info: 'Erwerbsquote Frauen bereits 80%. 10-20\'000 Stellen bei 4.5 Mio total = keine fundamentale Änderung.' },
]

type Chapter = 'video' | 'audio' | null

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

  // Audio
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null)

  // Rendez-vous: Reihenfolge + Wer profitiert
  const [rvClickedItems, setRvClickedItems] = useState<Set<number>>(new Set())
  const [rvExpandedItem, setRvExpandedItem] = useState<number | null>(null)
  const [matchingAnswers, setMatchingAnswers] = useState<{[key: string]: string}>({})
  const [matchingSubmitted, setMatchingSubmitted] = useState(false)

  // Echo der Zeit: Reihenfolge + Quiz
  const [echoClickedItems, setEchoClickedItems] = useState<Set<number>>(new Set())
  const [echoExpandedItem, setEchoExpandedItem] = useState<number | null>(null)
  const [echoQuizAnswers, setEchoQuizAnswers] = useState<{[key: string]: string}>({})
  const [echoQuizSubmitted, setEchoQuizSubmitted] = useState(false)

  // Bonus Audio
  const [bonusClickedItems, setBonusClickedItems] = useState<Set<number>>(new Set())
  const [bonusExpandedItem, setBonusExpandedItem] = useState<number | null>(null)
  const [bonusQuizAnswers, setBonusQuizAnswers] = useState<{[key: string]: string}>({})
  const [bonusQuizSubmitted, setBonusQuizSubmitted] = useState(false)

  const maxPoints = 100

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
            if (data.selectedAudio) setSelectedAudio(data.selectedAudio)
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

    await saveProgress(newScore, newBonus, Array.from(newCompleted), selectedAudio)
  }

  const saveProgress = async (score: number, bonus: number, completed: string[], audioChoice: string | null) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}

        const hasFirstAudio = completed.includes('audio_first')
        const requiredSections = ['videoquiz']
        const allComplete = requiredSections.every(s => completed.includes(s)) && hasFirstAudio

        modules.grundlagen = {
          completed: allComplete,
          score,
          bonusScore: bonus,
          progress: Math.round((score / maxPoints) * 100),
          completedSections: completed,
          selectedAudio: audioChoice,
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

  const getOtherAudio = () => {
    if (selectedAudio === 'echo') return 'rendezvous'
    if (selectedAudio === 'rendezvous') return 'echo'
    return null
  }

  // Reihenfolge-Item klicken
  const handleSequenceClick = (id: number, type: 'rv' | 'echo' | 'bonus') => {
    if (type === 'rv') {
      const newClicked = new Set(rvClickedItems)
      newClicked.add(id)
      setRvClickedItems(newClicked)
      setRvExpandedItem(rvExpandedItem === id ? null : id)
    } else if (type === 'echo') {
      const newClicked = new Set(echoClickedItems)
      newClicked.add(id)
      setEchoClickedItems(newClicked)
      setEchoExpandedItem(echoExpandedItem === id ? null : id)
    } else {
      const newClicked = new Set(bonusClickedItems)
      newClicked.add(id)
      setBonusClickedItems(newClicked)
      setBonusExpandedItem(bonusExpandedItem === id ? null : id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const firstAudioDone = completedSections.has('audio_first')
  const bonusAudioDone = completedSections.has('audio_bonus')
  const videoDone = completedSections.has('videoquiz')
  const isComplete = videoDone && firstAudioDone

  // ========== CHAPTER OVERVIEW ==========
  if (!activeChapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-700 mb-3">
              In diesem Modul lernen Sie die <strong>offiziellen Informationen des Bundes</strong> und die
              <strong> Medienberichterstattung</strong> zur Individualbesteuerung kennen.
            </p>
            <p className="text-gray-700 mb-3">
              Im <strong>Erklärfilm des Bundes</strong> erfahren Sie, wie die Reform funktioniert: Wer würde
              mehr zahlen, wer weniger? Wie hoch sind die geschätzten Steuerausfälle? Wie viele zusätzliche
              Steuererklärungen müssten verarbeitet werden?
            </p>
            <p className="text-gray-700">
              Die <strong>SRF Radio-Beiträge</strong> zeigen unterschiedliche Perspektiven: Ein Beitrag erklärt,
              wer von der Reform profitiert und wer verliert. Der andere analysiert die Auswirkungen auf den
              Arbeitsmarkt – beispielsweise, wie viele Frauen durch die Individualbesteuerung mehr arbeiten würden.
            </p>
          </div>

          <div className="space-y-3">
            {/* Kapitel 1: Video */}
            <button
              onClick={() => setActiveChapter('video')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${videoDone ? 'bg-green-500' : 'bg-blue-500'}`}>
                    <Film className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 1: Erklärfilm des Bundes</h3>
                    <p className="text-sm text-gray-500">Video anschauen & Fragen beantworten</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">{videoDone ? '1' : '0'}/1</div>
                  <div className="text-xs text-gray-400">50 Punkte</div>
                </div>
              </div>
              {videoDone && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                </div>
              )}
            </button>

            {/* Kapitel 2: Audio */}
            <button
              onClick={() => setActiveChapter('audio')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${firstAudioDone ? 'bg-green-500' : 'bg-red-500'}`}>
                    <Radio className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 2: SRF Radio-Beiträge</h3>
                    <p className="text-sm text-gray-500">Einen Beitrag wählen & Aufgaben lösen</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600">{firstAudioDone ? '1' : '0'}/1 Pflicht</div>
                  <div className="text-xs text-gray-400">50 Punkte</div>
                  {bonusAudioDone && (
                    <div className="text-xs text-yellow-600 flex items-center gap-1 justify-end mt-1">
                      <Star className="h-3 w-3" /> +30 Bonus
                    </div>
                  )}
                </div>
              </div>
              {firstAudioDone && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Pflicht abgeschlossen</span>
                  {!bonusAudioDone && <span className="text-yellow-600 ml-2">• Bonus verfügbar!</span>}
                </div>
              )}
            </button>
          </div>

          {isComplete && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
              <p className="text-blue-100 mb-4">
                Sie haben {totalScore} Punkte erreicht{bonusScore > 0 && <span> (+{bonusScore} Bonus)</span>}
              </p>
              <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50">
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 p-4 border-b">
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Offizieller Erklärfilm</h3>
                  <p className="text-sm text-gray-500">Bundesrat erklärt die Individualbesteuerung (3:50 Min.)</p>
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
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">❓</span>
                <div>
                  <h3 className="font-bold text-gray-900">Verständnisfragen</h3>
                  <p className="text-sm text-gray-500">4 Fragen zum Video</p>
                </div>
              </div>
              {videoDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+50P ✓</span>}
            </div>
            <div className="p-6 space-y-4">
              {/* Frage 1 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 0:13</p>
                <p className="font-medium text-gray-800 mb-3">1. Was ist das Ziel von Bundesrat und Parlament?</p>
                <div className="space-y-2">
                  {['Paare sollen vom Zivilstand steuerlich profitieren', 'Paare sollen nicht vom Zivilstand steuerlich profitieren oder benachteiligt werden', 'Alle sollen mehr Steuern zahlen', 'Nur Verheiratete sollen Steuererklärungen ausfüllen'].map(opt => {
                    const isSelected = quizAnswers.q1 === opt
                    const correct = 'Paare sollen nicht vom Zivilstand steuerlich profitieren oder benachteiligt werden'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button key={opt} onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q1: opt})} disabled={quizSubmitted}
                        className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 hover:border-blue-400'}`}>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 2 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 2:00</p>
                <p className="font-medium text-gray-800 mb-3">2. Wie hoch würde der Kinderabzug bei der direkten Bundessteuer erhöht?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Auf 8\'000 Fr.', 'Auf 10\'000 Fr.', 'Auf 12\'000 Fr.', 'Auf 15\'000 Fr.'].map(opt => {
                    const isSelected = quizAnswers.q2 === opt
                    const correct = 'Auf 12\'000 Fr.'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button key={opt} onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q2: opt})} disabled={quizSubmitted}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 hover:border-blue-400'}`}>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 3 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 2:17</p>
                <p className="font-medium text-gray-800 mb-3">3. Wie hoch wären die geschätzten jährlichen Steuerausfälle beim Bund?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['200 Mio. Fr.', '450 Mio. Fr.', '630 Mio. Fr.', '1 Mrd. Fr.'].map(opt => {
                    const isSelected = quizAnswers.q3 === opt
                    const correct = '630 Mio. Fr.'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button key={opt} onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q3: opt})} disabled={quizSubmitted}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 hover:border-blue-400'}`}>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Frage 4 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 mb-1">📍 2:59</p>
                <p className="font-medium text-gray-800 mb-3">4. Wie viele zusätzliche Steuererklärungen würde es geben?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['500\'000', '1,7 Millionen', '3 Millionen', '140\'000'].map(opt => {
                    const isSelected = quizAnswers.q4 === opt
                    const correct = '1,7 Millionen'
                    const isCorrect = quizSubmitted && opt === correct
                    const isWrong = quizSubmitted && isSelected && opt !== correct
                    return (
                      <button key={opt} onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, q4: opt})} disabled={quizSubmitted}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 hover:border-blue-400'}`}>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {!quizSubmitted && quizAnswers.q1 && quizAnswers.q2 && quizAnswers.q3 && quizAnswers.q4 && (
                <button onClick={() => { setQuizSubmitted(true); completeSection('videoquiz', 50) }}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">
                  Antworten prüfen
                </button>
              )}
              {quizSubmitted && (
                <div className="p-4 bg-green-100 rounded-lg text-green-800">
                  <strong>✓ Verständnisfragen abgeschlossen! +50 Punkte</strong>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setActiveChapter(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">← Übersicht</button>
            <button onClick={() => setActiveChapter('audio')} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4" /> Kapitel 2: Audio →
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ========== CHAPTER: AUDIO ==========
  if (activeChapter === 'audio') {
    const otherAudio = getOtherAudio()

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <header className="bg-gradient-to-r from-red-600 to-red-700 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveChapter(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
                <ArrowLeft className="h-5 w-5" /><span>Übersicht</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <Award className="h-4 w-4" />
                  <span className="font-semibold">{totalScore} / {maxPoints}</span>
                </div>
                {bonusScore > 0 && (
                  <div className="flex items-center gap-1 text-sm bg-yellow-400/30 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3" /><span className="text-xs">+{bonusScore}</span>
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-xl font-bold mt-2">Kapitel 2: SRF Radio-Beiträge</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* AUDIO AUSWAHL */}
          {!selectedAudio && !firstAudioDone && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-center text-lg">Wählen Sie einen Beitrag (Pflicht):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setSelectedAudio('rendezvous')}
                  className="p-6 rounded-xl border-2 border-red-200 bg-white hover:border-red-400 hover:shadow-md text-left transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-600 p-3 rounded-lg"><Volume2 className="h-6 w-6 text-white" /></div>
                    <div>
                      <p className="font-bold text-gray-900">SRF Rendez-vous</p>
                      <p className="text-sm text-gray-500">ca. 4 Minuten</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm"><strong>Thema:</strong> Was ändert sich? Wer profitiert, wer verliert?</p>
                </button>

                <button onClick={() => setSelectedAudio('echo')}
                  className="p-6 rounded-xl border-2 border-red-200 bg-white hover:border-red-400 hover:shadow-md text-left transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-600 p-3 rounded-lg"><Volume2 className="h-6 w-6 text-white" /></div>
                    <div>
                      <p className="font-bold text-gray-900">SRF Echo der Zeit</p>
                      <p className="text-sm text-gray-500">ca. 5 Minuten</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm"><strong>Thema:</strong> Auswirkungen auf den Arbeitsmarkt</p>
                </button>
              </div>
            </div>
          )}

          {/* RENDEZ-VOUS */}
          {selectedAudio === 'rendezvous' && !firstAudioDone && (
            <div className="space-y-6">
              <button onClick={() => setSelectedAudio(null)} className="text-sm text-gray-500 hover:text-gray-700">← Andere Auswahl</button>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg"><Volume2 className="h-5 w-5 text-white" /></div>
                    <div>
                      <h3 className="font-bold text-gray-900">SRF Rendez-vous</h3>
                      <p className="text-sm text-gray-500">Was ändert sich, wer profitiert, wer verliert?</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-gray-100 rounded-lg overflow-hidden mb-6">
                    <iframe
                      src={SRF_EMBED_URLS.rendezvous}
                      className="w-full h-[200px]"
                      frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope"
                      allowFullScreen
                      title="SRF Rendez-vous"
                    />
                  </div>

                  {/* Aufgabe 1: Reihenfolge */}
                  <div className="mb-6">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ListOrdered className="h-5 w-5 text-purple-600" />
                        <h4 className="font-bold text-gray-900">Aufgabe 1: Inhalte erkunden</h4>
                      </div>
                      <p className="text-sm text-gray-600">Klicken Sie auf die Themen, um mehr zu erfahren. ({rvClickedItems.size}/{RENDEZVOUS_SEQUENCE.length} erkundet)</p>
                    </div>
                    <div className="space-y-2">
                      {RENDEZVOUS_SEQUENCE.map((item) => {
                        const isClicked = rvClickedItems.has(item.id)
                        const isExpanded = rvExpandedItem === item.id
                        return (
                          <div key={item.id}>
                            <button
                              onClick={() => handleSequenceClick(item.id, 'rv')}
                              className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between ${isClicked ? 'bg-purple-100 border-purple-300' : 'bg-gray-50 hover:bg-gray-100'} border`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isClicked ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                  {item.id}
                                </span>
                                <span className={`font-medium ${isClicked ? 'text-purple-800' : 'text-gray-700'}`}>{item.title}</span>
                              </div>
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isClicked ? 'text-purple-500' : 'text-gray-400'}`} />
                            </button>
                            {isExpanded && (
                              <div className="ml-9 mt-2 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                                <div className="flex items-start gap-2">
                                  <Info className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-purple-800">{item.info}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Aufgabe 2: Wer profitiert */}
                  <div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4">
                      <h4 className="font-bold text-gray-900">Aufgabe 2: Wer profitiert?</h4>
                      <p className="text-sm text-gray-600 mt-1">Ordnen Sie zu, wer mehr und wer weniger Steuern zahlen würde.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { group: 'Doppelverdiener-Ehepaar mit ähnlichem Einkommen', correct: 'weniger', hint: 'Die Heiratsstrafe fällt weg' },
                        { group: 'Einverdiener-Ehepaar', correct: 'mehr', hint: 'Verlieren den Splitting-Vorteil' },
                        { group: 'Unverheiratete mit niedrigem/mittlerem Einkommen', correct: 'weniger', hint: 'Durch neue Tarife' },
                        { group: 'Gutverdienende Doppelverdiener (verheiratet)', correct: 'weniger', hint: 'Profitieren am meisten' },
                        { group: 'Ehepaar mit sehr ungleich verteiltem Einkommen', correct: 'mehr', hint: 'Besonders mit Kindern' },
                      ].map((item, idx) => {
                        const answer = matchingAnswers[`m${idx}`]
                        const isCorrect = matchingSubmitted && answer === item.correct
                        const isWrong = matchingSubmitted && answer && answer !== item.correct
                        return (
                          <div key={idx} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-400 bg-green-50' : isWrong ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
                            <p className="font-medium text-gray-800 mb-2">{item.group}</p>
                            <div className="flex gap-2">
                              <button onClick={() => !matchingSubmitted && setMatchingAnswers({...matchingAnswers, [`m${idx}`]: 'weniger'})} disabled={matchingSubmitted}
                                className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 ${answer === 'weniger' ? (matchingSubmitted ? (item.correct === 'weniger' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-indigo-500 text-white') : (matchingSubmitted && item.correct === 'weniger' ? 'bg-green-200 text-green-800' : 'bg-gray-100 hover:bg-gray-200')}`}>
                                <ThumbsUp className="h-4 w-4" /> Weniger
                              </button>
                              <button onClick={() => !matchingSubmitted && setMatchingAnswers({...matchingAnswers, [`m${idx}`]: 'mehr'})} disabled={matchingSubmitted}
                                className={`flex-1 py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 ${answer === 'mehr' ? (matchingSubmitted ? (item.correct === 'mehr' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-indigo-500 text-white') : (matchingSubmitted && item.correct === 'mehr' ? 'bg-green-200 text-green-800' : 'bg-gray-100 hover:bg-gray-200')}`}>
                                <ThumbsDown className="h-4 w-4" /> Mehr
                              </button>
                            </div>
                            {matchingSubmitted && <p className="text-xs text-gray-500 mt-2 italic">{item.hint}</p>}
                          </div>
                        )
                      })}
                    </div>
                    {!matchingSubmitted && Object.keys(matchingAnswers).length >= 5 && (
                      <button onClick={() => { setMatchingSubmitted(true); completeSection('audio_first', 50) }}
                        className="w-full py-3 mt-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold">
                        Antworten prüfen (+50 Punkte)
                      </button>
                    )}
                    {matchingSubmitted && <div className="p-4 mt-4 bg-green-100 rounded-lg text-green-800"><strong>✓ Pflicht-Audio abgeschlossen! +50 Punkte</strong></div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ECHO DER ZEIT */}
          {selectedAudio === 'echo' && !firstAudioDone && (
            <div className="space-y-6">
              <button onClick={() => setSelectedAudio(null)} className="text-sm text-gray-500 hover:text-gray-700">← Andere Auswahl</button>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg"><Volume2 className="h-5 w-5 text-white" /></div>
                    <div>
                      <h3 className="font-bold text-gray-900">SRF Echo der Zeit</h3>
                      <p className="text-sm text-gray-500">Auswirkungen auf den Arbeitsmarkt</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-gray-100 rounded-lg overflow-hidden mb-6">
                    <iframe
                      src={SRF_EMBED_URLS.echo}
                      className="w-full h-[200px]"
                      frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope"
                      allowFullScreen
                      title="SRF Echo der Zeit"
                    />
                  </div>

                  {/* Aufgabe 1: Reihenfolge */}
                  <div className="mb-6">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ListOrdered className="h-5 w-5 text-purple-600" />
                        <h4 className="font-bold text-gray-900">Aufgabe 1: Inhalte erkunden</h4>
                      </div>
                      <p className="text-sm text-gray-600">Klicken Sie auf die Themen, um mehr zu erfahren. ({echoClickedItems.size}/{ECHO_SEQUENCE.length} erkundet)</p>
                    </div>
                    <div className="space-y-2">
                      {ECHO_SEQUENCE.map((item) => {
                        const isClicked = echoClickedItems.has(item.id)
                        const isExpanded = echoExpandedItem === item.id
                        return (
                          <div key={item.id}>
                            <button
                              onClick={() => handleSequenceClick(item.id, 'echo')}
                              className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between ${isClicked ? 'bg-purple-100 border-purple-300' : 'bg-gray-50 hover:bg-gray-100'} border`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isClicked ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                  {item.id}
                                </span>
                                <span className={`font-medium ${isClicked ? 'text-purple-800' : 'text-gray-700'}`}>{item.title}</span>
                              </div>
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isClicked ? 'text-purple-500' : 'text-gray-400'}`} />
                            </button>
                            {isExpanded && (
                              <div className="ml-9 mt-2 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                                <div className="flex items-start gap-2">
                                  <Info className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-purple-800">{item.info}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Aufgabe 2: Quiz */}
                  <div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4">
                      <h4 className="font-bold text-gray-900">Aufgabe 2: Fragen zum Arbeitsmarkt</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-800 mb-3">1. Was ist das Problem bei Doppelverdiener-Ehepaaren heute?</p>
                        <div className="space-y-2">
                          {['Sie zahlen weniger Steuern als Unverheiratete', 'Sie zahlen mehr Steuern als wenn sie unverheiratet zusammenleben würden', 'Sie müssen keine Steuern zahlen'].map(opt => {
                            const isSelected = echoQuizAnswers.eq1 === opt
                            const correct = 'Sie zahlen mehr Steuern als wenn sie unverheiratet zusammenleben würden'
                            const isCorrect = echoQuizSubmitted && opt === correct
                            const isWrong = echoQuizSubmitted && isSelected && opt !== correct
                            return (
                              <button key={opt} onClick={() => !echoQuizSubmitted && setEchoQuizAnswers({...echoQuizAnswers, eq1: opt})} disabled={echoQuizSubmitted}
                                className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-white border border-gray-300 hover:border-red-400'}`}>
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-800 mb-3">2. Wie viele neue Vollzeitstellen werden laut Studien geschätzt?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['5\'000 - 8\'000', '10\'000 - 20\'000', '50\'000 - 100\'000', '200\'000+'].map(opt => {
                            const isSelected = echoQuizAnswers.eq2 === opt
                            const correct = '10\'000 - 20\'000'
                            const isCorrect = echoQuizSubmitted && opt === correct
                            const isWrong = echoQuizSubmitted && isSelected && opt !== correct
                            return (
                              <button key={opt} onClick={() => !echoQuizSubmitted && setEchoQuizAnswers({...echoQuizAnswers, eq2: opt})} disabled={echoQuizSubmitted}
                                className={`p-2 rounded-lg text-sm font-medium transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-white border border-gray-300 hover:border-red-400'}`}>
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-800 mb-3">3. Wie viele Frauen würden laut Schätzungen neu erwerbstätig werden?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['ca. 5\'000', 'ca. 11\'500', 'ca. 50\'000', 'ca. 100\'000'].map(opt => {
                            const isSelected = echoQuizAnswers.eq3 === opt
                            const correct = 'ca. 11\'500'
                            const isCorrect = echoQuizSubmitted && opt === correct
                            const isWrong = echoQuizSubmitted && isSelected && opt !== correct
                            return (
                              <button key={opt} onClick={() => !echoQuizSubmitted && setEchoQuizAnswers({...echoQuizAnswers, eq3: opt})} disabled={echoQuizSubmitted}
                                className={`p-2 rounded-lg text-sm font-medium transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-white border border-gray-300 hover:border-red-400'}`}>
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {!echoQuizSubmitted && echoQuizAnswers.eq1 && echoQuizAnswers.eq2 && echoQuizAnswers.eq3 && (
                      <button onClick={() => { setEchoQuizSubmitted(true); completeSection('audio_first', 50) }}
                        className="w-full py-3 mt-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold">
                        Antworten prüfen (+50 Punkte)
                      </button>
                    )}
                    {echoQuizSubmitted && <div className="p-4 mt-4 bg-green-100 rounded-lg text-green-800"><strong>✓ Pflicht-Audio abgeschlossen! +50 Punkte</strong></div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BONUS AUDIO */}
          {firstAudioDone && !bonusAudioDone && (
            <div className="space-y-6">
              <div className="bg-green-100 border border-green-300 rounded-xl p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Pflicht-Audio abgeschlossen!</h3>
                <p className="text-green-700">Sie haben 50 Punkte erhalten.</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-400 p-3 rounded-xl"><Star className="h-6 w-6 text-white" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Bonus: +30 Punkte</h3>
                    <p className="text-gray-700 mb-4">Hören Sie den anderen Beitrag und erkunden Sie die Inhalte.</p>

                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-red-600 p-2 rounded-lg"><Volume2 className="h-5 w-5 text-white" /></div>
                        <div>
                          <p className="font-bold text-gray-900">{otherAudio === 'echo' ? 'SRF Echo der Zeit' : 'SRF Rendez-vous'}</p>
                          <p className="text-sm text-gray-500">{otherAudio === 'echo' ? 'Auswirkungen Arbeitsmarkt' : 'Wer profitiert?'}</p>
                        </div>
                      </div>

                      <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                        <iframe
                          src={otherAudio === 'echo' ? SRF_EMBED_URLS.echo : SRF_EMBED_URLS.rendezvous}
                          className="w-full h-[200px]"
                          frameBorder="0"
                          allow="accelerometer; autoplay; encrypted-media; gyroscope"
                          allowFullScreen
                          title={otherAudio === 'echo' ? 'SRF Echo der Zeit' : 'SRF Rendez-vous'}
                        />
                      </div>

                      {/* Bonus: Inhalte erkunden */}
                      <div className="mb-4">
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-3">
                          <div className="flex items-center gap-2">
                            <ListOrdered className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-900">Inhalte erkunden ({bonusClickedItems.size}/{otherAudio === 'echo' ? ECHO_SEQUENCE.length : RENDEZVOUS_SEQUENCE.length})</span>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {(otherAudio === 'echo' ? ECHO_SEQUENCE : RENDEZVOUS_SEQUENCE).map((item) => {
                            const isClicked = bonusClickedItems.has(item.id)
                            const isExpanded = bonusExpandedItem === item.id
                            return (
                              <div key={item.id}>
                                <button
                                  onClick={() => handleSequenceClick(item.id, 'bonus')}
                                  className={`w-full p-2 rounded-lg text-left transition-all flex items-center justify-between text-sm ${isClicked ? 'bg-purple-100 border-purple-300' : 'bg-gray-50 hover:bg-gray-100'} border`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isClicked ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                      {item.id}
                                    </span>
                                    <span className={`font-medium ${isClicked ? 'text-purple-800' : 'text-gray-700'}`}>{item.title}</span>
                                  </div>
                                  <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                {isExpanded && (
                                  <div className="ml-7 mt-1 p-2 bg-purple-50 rounded text-xs text-purple-800 border-l-2 border-purple-400">
                                    {item.info}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Bonus Frage */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Bonus-Frage:</h4>
                        {otherAudio === 'echo' ? (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-800 mb-2 text-sm">Wie viele Vollzeitstellen könnten entstehen?</p>
                            <div className="grid grid-cols-2 gap-2">
                              {['5\'000 - 8\'000', '10\'000 - 20\'000'].map(opt => {
                                const isSelected = bonusQuizAnswers.bq1 === opt
                                const correct = '10\'000 - 20\'000'
                                const isCorrect = bonusQuizSubmitted && opt === correct
                                const isWrong = bonusQuizSubmitted && isSelected && opt !== correct
                                return (
                                  <button key={opt} onClick={() => !bonusQuizSubmitted && setBonusQuizAnswers({...bonusQuizAnswers, bq1: opt})} disabled={bonusQuizSubmitted}
                                    className={`p-2 rounded-lg text-sm font-medium transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-yellow-500 text-white' : 'bg-white border border-gray-300'}`}>
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-800 mb-2 text-sm">Wer profitiert am meisten?</p>
                            <div className="space-y-2">
                              {['Einverdiener-Ehepaare', 'Doppelverdiener-Ehepaare mit ähnlichem Einkommen'].map(opt => {
                                const isSelected = bonusQuizAnswers.bq1 === opt
                                const correct = 'Doppelverdiener-Ehepaare mit ähnlichem Einkommen'
                                const isCorrect = bonusQuizSubmitted && opt === correct
                                const isWrong = bonusQuizSubmitted && isSelected && opt !== correct
                                return (
                                  <button key={opt} onClick={() => !bonusQuizSubmitted && setBonusQuizAnswers({...bonusQuizAnswers, bq1: opt})} disabled={bonusQuizSubmitted}
                                    className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-yellow-500 text-white' : 'bg-white border border-gray-300'}`}>
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {!bonusQuizSubmitted && bonusQuizAnswers.bq1 && (
                          <button onClick={() => { setBonusQuizSubmitted(true); completeSection('audio_bonus', 30, true) }}
                            className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold">
                            Bonus erhalten (+30)
                          </button>
                        )}
                        {bonusQuizSubmitted && <div className="p-3 bg-yellow-100 rounded-lg text-yellow-800 flex items-center gap-2"><Star className="h-5 w-5" /><strong>+30 Bonus!</strong></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {firstAudioDone && bonusAudioDone && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-2">Alle Audios abgeschlossen!</h3>
              <p className="text-green-100 mb-2">Pflicht: 50 Punkte ✓</p>
              <p className="text-yellow-200 flex items-center justify-center gap-1"><Star className="h-4 w-4" /> Bonus: +30 ✓</p>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setActiveChapter('video')} className="px-4 py-2 text-gray-600 hover:text-gray-800">← Kapitel 1</button>
            <button onClick={() => setActiveChapter(null)} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">Zur Übersicht →</button>
          </div>
        </main>
      </div>
    )
  }

  return null
}
