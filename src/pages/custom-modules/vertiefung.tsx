import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  ArrowLeft, CheckCircle2, Award,
  History, Scale, Film, ChevronRight, ChevronDown,
  AlertTriangle, Calendar, Users, Star, BookOpen,
  HelpCircle, Lightbulb
} from 'lucide-react'

// ===========================================
// VERTIEFUNG INTERAKTIV - KAPITEL-STRUKTUR
// Kapitel 1: Geschichte der Abstimmungen (50P)
// Kapitel 2: Ziele der Steuern & Steuergerechtigkeit (50P)
// ===========================================

// Timeline-Daten für Kapitel 1
const TIMELINE_EVENTS = [
  {
    id: 1,
    year: '2016',
    date: '28. Februar 2016',
    title: 'Volksabstimmung zur CVP-Initiative',
    description: 'Die Volksinitiative "Für Ehe und Familie – gegen die Heiratsstrafe" wird zur Abstimmung gebracht.',
    details: 'Die Initiative erhielt ein Ständemehr (15 3/2 Ja gegen 5 3/2 Nein), aber kein Volksmehr mit 50.8% Nein-Stimmen. Die Initiative wurde somit abgelehnt.',
    icon: 'vote',
    type: 'abstimmung'
  },
  {
    id: 2,
    year: '2018',
    date: 'Juni 2018',
    title: 'Fehler des Bundesrats entdeckt',
    description: 'Der Bundesrat räumt gravierende Fehler bei den Zahlen ein.',
    details: 'Vor der Abstimmung hiess es, 80\'000 Ehepaare seien von der Heiratsstrafe betroffen. Tatsächlich waren es 454\'000 Ehepaare – mehr als fünfmal so viele!',
    icon: 'alert',
    type: 'skandal'
  },
  {
    id: 3,
    year: '2019',
    date: '10. April 2019',
    title: 'Bundesgericht annulliert Abstimmung',
    description: 'Erstmals in der Schweizer Geschichte wird eine nationale Volksabstimmung annulliert.',
    details: 'Das Bundesgericht entschied: Die Stimmbevölkerung konnte sich keine zuverlässige Meinung bilden. Die Abstimmungsfreiheit wurde verletzt.',
    icon: 'history',
    type: 'gericht'
  },
  {
    id: 4,
    year: '2020',
    date: '4. Februar 2020',
    title: 'Rückzug der Initiative',
    description: 'Das Initiativkomitee zieht die CVP-Initiative zurück.',
    details: 'Anstatt eine neue Abstimmung durchzuführen, wurde die Initiative zurückgezogen. Der Bundesrat arbeitete bereits an alternativen Lösungen.',
    icon: 'calendar',
    type: 'politik'
  },
  {
    id: 5,
    year: '2022',
    date: '8. September 2022',
    title: 'FDP-Frauen reichen Initiative ein',
    description: 'Die "Steuergerechtigkeits-Initiative" wird mit über 112\'000 Unterschriften eingereicht.',
    details: 'Die Volksinitiative fordert, dass natürliche Personen unabhängig von ihrem Zivilstand besteuert werden. Spätestens drei Jahre nach Annahme müsste die Heiratsstrafe abgeschafft sein.',
    icon: 'users',
    type: 'initiative'
  },
  {
    id: 6,
    year: '2025',
    date: 'September 2025',
    title: 'Debatte im Nationalrat',
    description: 'Der Nationalrat debattiert über die Mitte-Initiative "Ja zu fairen Bundessteuern".',
    details: 'Die Mitte will die Heiratsstrafe anders lösen: Ehepaare sollen wählen können, welches Steuermodell günstiger ist. National- und Ständerat unterstützen jedoch die Individualbesteuerung.',
    icon: 'users',
    type: 'politik'
  },
  {
    id: 7,
    year: '2026',
    date: '8. März 2026',
    title: 'Volksabstimmung Individualbesteuerung',
    description: 'Die Schweizer Stimmbevölkerung entscheidet über den Systemwechsel.',
    details: 'Wenn angenommen, füllen alle Personen – ob verheiratet oder nicht – eine eigene Steuererklärung aus. Die Heiratsstrafe für Doppelverdiener-Paare würde damit abgeschafft.',
    icon: 'vote',
    type: 'abstimmung'
  }
]

// Quiz-Fragen für Kapitel 1
const HISTORY_QUIZ = [
  {
    id: 'h1',
    question: 'Warum wurde die Abstimmung von 2016 vom Bundesgericht annulliert?',
    options: [
      'Weil zu wenige Personen abgestimmt haben',
      'Weil die Stimmbevölkerung falsch informiert wurde',
      'Weil das Resultat zu knapp war',
      'Weil es technische Probleme gab'
    ],
    correct: 'Weil die Stimmbevölkerung falsch informiert wurde'
  },
  {
    id: 'h2',
    question: 'Wie viele Ehepaare waren laut korrigierten Zahlen tatsächlich von der Heiratsstrafe betroffen?',
    options: ['80\'000', '200\'000', '454\'000', '1 Million'],
    correct: '454\'000'
  },
  {
    id: 'h3',
    question: 'Wer hat die "Steuergerechtigkeits-Initiative" eingereicht?',
    options: ['Die SVP', 'Die FDP-Frauen', 'Die Mitte-Partei', 'Der Bundesrat'],
    correct: 'Die FDP-Frauen'
  }
]

// Ziele der Steuern für Kapitel 2
const STEUERZIELE = [
  {
    id: 'finanzierung',
    title: 'Finanzierung öffentlicher Aufgaben',
    description: 'Steuern finanzieren Schulen, Spitäler, Strassen, Polizei und vieles mehr.',
    example: 'Ohne Steuern gäbe es keine öffentlichen Schulen oder Universitäten.',
    icon: '🏫'
  },
  {
    id: 'umverteilung',
    title: 'Umverteilung',
    description: 'Wer mehr verdient, zahlt mehr. Damit werden soziale Ungleichheiten ausgeglichen.',
    example: 'Die AHV wird durch Steuern finanziert – alle profitieren, auch wer wenig eingezahlt hat.',
    icon: '⚖️'
  },
  {
    id: 'lenkung',
    title: 'Lenkungswirkung',
    description: 'Steuern können Verhalten beeinflussen – positiv wie negativ.',
    example: 'Die Tabaksteuer macht Rauchen teurer. Die aktuelle Debatte: Beeinflusst das Steuersystem, ob Paare heiraten oder wie viel sie arbeiten?',
    icon: '🎯'
  },
  {
    id: 'gerechtigkeit',
    title: 'Steuergerechtigkeit',
    description: 'Gleiche wirtschaftliche Verhältnisse sollen gleich besteuert werden.',
    example: 'Die Heiratsstrafe verletzt dieses Prinzip: Zwei Paare mit gleichem Einkommen zahlen unterschiedlich viel Steuern – je nach Zivilstand.',
    icon: '⚖️'
  }
]

// Zuordnungsaufgabe: Parteien und Positionen
const PARTY_POSITIONS = [
  { party: 'FDP', position: 'pro', reason: 'Liberale Partei für Individualbesteuerung' },
  { party: 'SP', position: 'pro', reason: 'Für Gleichstellung und wirtschaftliche Unabhängigkeit' },
  { party: 'Grüne', position: 'pro', reason: 'Für moderne Familienmodelle' },
  { party: 'GLP', position: 'pro', reason: 'Für Chancengleichheit und Arbeitsanreize' },
  { party: 'SVP', position: 'contra', reason: 'Für traditionelles Familienmodell' },
  { party: 'Mitte', position: 'contra', reason: 'Eigene Initiative mit alternativem Modell' }
]

// Quiz für Kapitel 2 (Steuerziele)
const STEUERZIELE_QUIZ = [
  {
    id: 's1',
    question: 'Welches Steuerprinzip wird durch die "Heiratsstrafe" verletzt?',
    options: [
      'Das Prinzip der Finanzierung',
      'Das Prinzip der Steuergerechtigkeit',
      'Das Prinzip der Lenkung',
      'Das Prinzip der Einfachheit'
    ],
    correct: 'Das Prinzip der Steuergerechtigkeit'
  },
  {
    id: 's2',
    question: 'Warum könnte die Individualbesteuerung mehr Frauen in den Arbeitsmarkt bringen?',
    options: [
      'Weil Frauen dann weniger Steuern zahlen müssen',
      'Weil das zusätzliche Einkommen nicht mehr so stark besteuert wird',
      'Weil Arbeitgebende Frauen bevorzugen müssen',
      'Weil Männer dann weniger arbeiten dürfen'
    ],
    correct: 'Weil das zusätzliche Einkommen nicht mehr so stark besteuert wird'
  },
  {
    id: 's3',
    question: 'Was ist die "Heiratsstrafe"?',
    options: [
      'Eine Gebühr für Hochzeiten',
      'Höhere Steuern für verheiratete Doppelverdiener-Paare im Vergleich zu Unverheirateten',
      'Ein Strafzuschlag für späte Steuererklärungen',
      'Eine Steuer auf Erbschaften'
    ],
    correct: 'Höhere Steuern für verheiratete Doppelverdiener-Paare im Vergleich zu Unverheirateten'
  }
]

type Chapter = 'geschichte' | 'steuerziele' | null

export default function VertiefungPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState<Chapter>(null)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [totalScore, setTotalScore] = useState(0)
  const [bonusScore, setBonusScore] = useState(0)

  // Kapitel 1: Geschichte
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null)
  const [exploredEvents, setExploredEvents] = useState<Set<number>>(new Set())
  const [historyQuizAnswers, setHistoryQuizAnswers] = useState<{[key: string]: string}>({})
  const [historyQuizSubmitted, setHistoryQuizSubmitted] = useState(false)
  const [partyAssignments, setPartyAssignments] = useState<{[key: string]: string}>({})
  const [partySubmitted, setPartySubmitted] = useState(false)

  // Kapitel 2: Steuerziele
  const [expandedZiel, setExpandedZiel] = useState<string | null>(null)
  const [exploredZiele, setExploredZiele] = useState<Set<string>>(new Set())
  const [steuerQuizAnswers, setSteuerQuizAnswers] = useState<{[key: string]: string}>({})
  const [steuerQuizSubmitted, setSteuerQuizSubmitted] = useState(false)

  const maxPoints = 100

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.vertiefung
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

        const requiredSections = ['geschichte_quiz', 'steuerziele_quiz']
        const allComplete = requiredSections.every(s => completed.includes(s))

        modules.vertiefung = {
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

  const handleEventClick = (id: number) => {
    const newExplored = new Set(exploredEvents)
    newExplored.add(id)
    setExploredEvents(newExplored)
    setExpandedEvent(expandedEvent === id ? null : id)
  }

  const handleZielClick = (id: string) => {
    const newExplored = new Set(exploredZiele)
    newExplored.add(id)
    setExploredZiele(newExplored)
    setExpandedZiel(expandedZiel === id ? null : id)
  }

  const getEventIcon = (icon: string) => {
    switch (icon) {
      case 'vote': return <Scale className="h-5 w-5" />
      case 'alert': return <AlertTriangle className="h-5 w-5" />
      case 'history': return <History className="h-5 w-5" />
      case 'calendar': return <Calendar className="h-5 w-5" />
      case 'users': return <Users className="h-5 w-5" />
      default: return <BookOpen className="h-5 w-5" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'abstimmung': return 'bg-blue-500'
      case 'skandal': return 'bg-red-500'
      case 'gericht': return 'bg-purple-500'
      case 'politik': return 'bg-amber-500'
      case 'initiative': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const geschichteDone = completedSections.has('geschichte_quiz')
  const steuerzieleDone = completedSections.has('steuerziele_quiz')
  const partyDone = completedSections.has('party_bonus')
  const isComplete = geschichteDone && steuerzieleDone

  // ========== CHAPTER OVERVIEW ==========
  if (!activeChapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
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
            <h1 className="text-2xl font-bold">4. Vertiefung interaktiv</h1>
            <p className="text-emerald-200 text-sm mt-1">Abstimmung vom 8. März 2026 – Hintergründe</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-gray-700">
              Tauchen Sie tiefer ein: Erfahren Sie, welche <strong>politischen Ereignisse</strong> zur heutigen
              Abstimmung geführt haben und verstehen Sie die <strong>grundlegenden Ziele des Steuersystems</strong>.
            </p>
          </div>

          <div className="space-y-3">
            {/* Kapitel 1: Geschichte */}
            <button
              onClick={() => setActiveChapter('geschichte')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-emerald-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${geschichteDone ? 'bg-green-500' : 'bg-emerald-500'}`}>
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 1: Geschichte der Abstimmungen</h3>
                    <p className="text-sm text-gray-500">Von der annullierten Abstimmung bis heute</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-emerald-600">{geschichteDone ? '1' : '0'}/1</div>
                  <div className="text-xs text-gray-400">50 Punkte</div>
                </div>
              </div>
              {geschichteDone && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                </div>
              )}
            </button>

            {/* Kapitel 2: Steuerziele */}
            <button
              onClick={() => setActiveChapter('steuerziele')}
              className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-emerald-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${steuerzieleDone ? 'bg-green-500' : 'bg-cyan-500'}`}>
                    <Scale className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Kapitel 2: Ziele der Steuern</h3>
                    <p className="text-sm text-gray-500">Steuergerechtigkeit und der Film des Bundes</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-cyan-600">{steuerzieleDone ? '1' : '0'}/1</div>
                  <div className="text-xs text-gray-400">50 Punkte</div>
                  {geschichteDone && !partyDone && (
                    <div className="text-xs text-yellow-600 flex items-center gap-1 justify-end mt-1">
                      <Star className="h-3 w-3" /> Bonus verfügbar!
                    </div>
                  )}
                </div>
              </div>
              {steuerzieleDone && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Abgeschlossen</span>
                  {partyDone && <span className="text-yellow-600 ml-2">• +20 Bonus ✓</span>}
                </div>
              )}
            </button>
          </div>

          {isComplete && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
              <p className="text-emerald-100 mb-4">
                Sie haben {totalScore} Punkte erreicht{bonusScore > 0 && <span> (+{bonusScore} Bonus)</span>}
              </p>
              <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50">
                Weiter zum nächsten Modul
              </button>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ========== CHAPTER 1: GESCHICHTE ==========
  if (activeChapter === 'geschichte') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white sticky top-0 z-10">
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
            <h1 className="text-xl font-bold mt-2">Kapitel 1: Geschichte der Abstimmungen</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Einleitung */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-xl">
                <Lightbulb className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Wussten Sie?</h3>
                <p className="text-gray-700">
                  Die Abstimmung vom 8. März 2026 hat eine bewegte Vorgeschichte. 2019 wurde erstmals
                  in der Schweizer Geschichte eine nationale Volksabstimmung annulliert – wegen
                  <strong> falscher Informationen des Bundesrats</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-emerald-50 p-4 border-b">
              <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Interaktive Zeitachse</h3>
                  <p className="text-sm text-gray-500">Klicken Sie auf die Ereignisse für Details ({exploredEvents.size}/{TIMELINE_EVENTS.length} erkundet)</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="relative">
                {/* Vertikale Linie */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-4">
                  {TIMELINE_EVENTS.map((event) => {
                    const isExplored = exploredEvents.has(event.id)
                    const isExpanded = expandedEvent === event.id
                    return (
                      <div key={event.id} className="relative pl-16">
                        {/* Punkt auf der Zeitachse */}
                        <div className={`absolute left-4 w-5 h-5 rounded-full border-2 border-white ${getEventColor(event.type)} flex items-center justify-center shadow-sm`}>
                          {isExplored && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>

                        <button
                          onClick={() => handleEventClick(event.id)}
                          className={`w-full text-left p-4 rounded-xl transition-all ${
                            isExplored ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 hover:bg-gray-100'
                          } border`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-emerald-600">{event.date}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-400`} />
                          </div>
                          <h4 className="font-bold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">{event.details}</p>
                            </div>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quiz */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-purple-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Verständnisfragen</h3>
                  <p className="text-sm text-gray-500">Testen Sie Ihr Wissen</p>
                </div>
              </div>
              {geschichteDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+50P ✓</span>}
            </div>
            <div className="p-6 space-y-4">
              {HISTORY_QUIZ.map((q, idx) => (
                <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">{idx + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map(opt => {
                      const isSelected = historyQuizAnswers[q.id] === opt
                      const isCorrect = historyQuizSubmitted && opt === q.correct
                      const isWrong = historyQuizSubmitted && isSelected && opt !== q.correct
                      return (
                        <button
                          key={opt}
                          onClick={() => !historyQuizSubmitted && setHistoryQuizAnswers({...historyQuizAnswers, [q.id]: opt})}
                          disabled={historyQuizSubmitted}
                          className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                            isCorrect ? 'bg-green-500 text-white' :
                            isWrong ? 'bg-red-500 text-white' :
                            isSelected ? 'bg-purple-500 text-white' :
                            'bg-white border border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {!historyQuizSubmitted && Object.keys(historyQuizAnswers).length === HISTORY_QUIZ.length && (
                <button
                  onClick={() => {
                    setHistoryQuizSubmitted(true)
                    completeSection('geschichte_quiz', 50)
                  }}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                >
                  Antworten prüfen
                </button>
              )}
              {historyQuizSubmitted && (
                <div className="p-4 bg-green-100 rounded-lg text-green-800">
                  <strong>✓ Verständnisfragen abgeschlossen! +50 Punkte</strong>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setActiveChapter(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">← Übersicht</button>
            <button onClick={() => setActiveChapter('steuerziele')} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4" /> Kapitel 2: Steuerziele →
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ========== CHAPTER 2: STEUERZIELE ==========
  if (activeChapter === 'steuerziele') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
        <header className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white sticky top-0 z-10">
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
            <h1 className="text-xl font-bold mt-2">Kapitel 2: Ziele der Steuern</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Video Steuergerechtigkeit */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 p-4 border-b">
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Film: Tagesschau zur Individualbesteuerung</h3>
                  <p className="text-sm text-gray-500">Welche Familienmodelle profitieren, welche verlieren?</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <iframe
                  className="w-full aspect-video"
                  src="https://www.srf.ch/play/embed?urn=urn:srf:video:7578f77a-59d8-4453-a1ba-eedb4ede1451"
                  title="Tagesschau zur Individualbesteuerung"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* Steuerziele erkunden */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-cyan-50 p-4 border-b">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-cyan-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Die vier Ziele des Steuersystems</h3>
                  <p className="text-sm text-gray-500">Klicken Sie auf die Karten für Details ({exploredZiele.size}/{STEUERZIELE.length} erkundet)</p>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {STEUERZIELE.map((ziel) => {
                const isExplored = exploredZiele.has(ziel.id)
                const isExpanded = expandedZiel === ziel.id
                return (
                  <button
                    key={ziel.id}
                    onClick={() => handleZielClick(ziel.id)}
                    className={`text-left p-4 rounded-xl transition-all border-2 ${
                      isExplored ? 'bg-cyan-50 border-cyan-300' : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{ziel.icon}</span>
                      {isExplored && <CheckCircle2 className="h-4 w-4 text-cyan-500" />}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{ziel.title}</h4>
                    <p className="text-sm text-gray-600">{ziel.description}</p>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-cyan-800 bg-cyan-100 p-2 rounded-lg">
                          <strong>Beispiel:</strong> {ziel.example}
                        </p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Parteien-Zuordnung (Bonus) */}
          {geschichteDone && !partyDone && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-yellow-50 p-4 border-b">
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-bold text-gray-900">Bonus: Parteien-Positionen</h3>
                    <p className="text-sm text-gray-500">Ordnen Sie die Parteien der richtigen Position zu (+20 Bonus)</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center border-2 border-green-200">
                    <span className="font-bold text-green-700">PRO</span>
                    <p className="text-xs text-green-600 mt-1">Für die Individualbesteuerung</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center border-2 border-red-200">
                    <span className="font-bold text-red-700">CONTRA</span>
                    <p className="text-xs text-red-600 mt-1">Gegen die Individualbesteuerung</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {PARTY_POSITIONS.map(item => {
                    const currentAssignment = partyAssignments[item.party]
                    const isCorrect = partySubmitted && currentAssignment === item.position
                    const isWrong = partySubmitted && currentAssignment && currentAssignment !== item.position

                    return (
                      <div key={item.party} className={`flex items-center justify-between p-3 rounded-lg ${
                        isCorrect ? 'bg-green-100' : isWrong ? 'bg-red-100' : 'bg-gray-50'
                      }`}>
                        <span className="font-semibold text-gray-800">{item.party}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => !partySubmitted && setPartyAssignments({...partyAssignments, [item.party]: 'pro'})}
                            disabled={partySubmitted}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              currentAssignment === 'pro'
                                ? (partySubmitted && item.position === 'pro' ? 'bg-green-500 text-white' : partySubmitted ? 'bg-red-500 text-white' : 'bg-green-500 text-white')
                                : 'bg-gray-200 hover:bg-green-200'
                            }`}
                          >
                            Pro
                          </button>
                          <button
                            onClick={() => !partySubmitted && setPartyAssignments({...partyAssignments, [item.party]: 'contra'})}
                            disabled={partySubmitted}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              currentAssignment === 'contra'
                                ? (partySubmitted && item.position === 'contra' ? 'bg-green-500 text-white' : partySubmitted ? 'bg-red-500 text-white' : 'bg-red-500 text-white')
                                : 'bg-gray-200 hover:bg-red-200'
                            }`}
                          >
                            Contra
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!partySubmitted && Object.keys(partyAssignments).length === PARTY_POSITIONS.length && (
                  <button
                    onClick={() => {
                      setPartySubmitted(true)
                      completeSection('party_bonus', 20, true)
                    }}
                    className="w-full mt-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
                  >
                    Zuordnung prüfen
                  </button>
                )}
                {partySubmitted && (
                  <div className="mt-4 p-4 bg-yellow-100 rounded-lg text-yellow-800">
                    <strong>✓ Bonus abgeschlossen! +20 Punkte</strong>
                    <div className="mt-2 text-sm space-y-1">
                      {PARTY_POSITIONS.map(item => (
                        <p key={item.party}><strong>{item.party}:</strong> {item.reason}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quiz Steuerziele */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-gray-900">Verständnisfragen</h3>
                  <p className="text-sm text-gray-500">Testen Sie Ihr Wissen zu Steuern und Gerechtigkeit</p>
                </div>
              </div>
              {steuerzieleDone && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+50P ✓</span>}
            </div>
            <div className="p-6 space-y-4">
              {STEUERZIELE_QUIZ.map((q, idx) => (
                <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">{idx + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map(opt => {
                      const isSelected = steuerQuizAnswers[q.id] === opt
                      const isCorrect = steuerQuizSubmitted && opt === q.correct
                      const isWrong = steuerQuizSubmitted && isSelected && opt !== q.correct
                      return (
                        <button
                          key={opt}
                          onClick={() => !steuerQuizSubmitted && setSteuerQuizAnswers({...steuerQuizAnswers, [q.id]: opt})}
                          disabled={steuerQuizSubmitted}
                          className={`w-full p-2 rounded-lg text-sm font-medium text-left transition-all ${
                            isCorrect ? 'bg-green-500 text-white' :
                            isWrong ? 'bg-red-500 text-white' :
                            isSelected ? 'bg-indigo-500 text-white' :
                            'bg-white border border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {!steuerQuizSubmitted && Object.keys(steuerQuizAnswers).length === STEUERZIELE_QUIZ.length && (
                <button
                  onClick={() => {
                    setSteuerQuizSubmitted(true)
                    completeSection('steuerziele_quiz', 50)
                  }}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Antworten prüfen
                </button>
              )}
              {steuerQuizSubmitted && (
                <div className="p-4 bg-green-100 rounded-lg text-green-800">
                  <strong>✓ Verständnisfragen abgeschlossen! +50 Punkte</strong>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setActiveChapter('geschichte')} className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2">
              <History className="h-4 w-4" /> ← Kapitel 1
            </button>
            <button onClick={() => setActiveChapter(null)} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold">
              Zur Übersicht →
            </button>
          </div>
        </main>
      </div>
    )
  }

  return null
}
