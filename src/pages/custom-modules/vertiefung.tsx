import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  ArrowLeft, CheckCircle2, Award,
  History, Scale, Film, ChevronRight, ChevronDown,
  AlertTriangle, Calendar, Users, Star, BookOpen,
  HelpCircle, Lightbulb, Newspaper, ExternalLink, Lock, ThumbsUp, ThumbsDown, Glasses, X
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

// Die drei Werkzeuge im Steuer-Werkzeugkasten (basierend auf dem Film)
const STEUERZIELE = [
  {
    id: 'fairness',
    title: 'Werkzeug 1: Steuern für Fairness',
    description: 'Die Steuerprogression sorgt dafür, dass wer mehr verdient, prozentual auch mehr beiträgt.',
    example: 'Aber: Das reichste 1% besitzt 45% des Vermögens, zahlt aber nur 23% der direkten Steuern. Hier klafft eine Lücke!',
    icon: '⚖️'
  },
  {
    id: 'vermoegenssteuer',
    title: 'Das Schweizer As: Die Vermögenssteuer',
    description: 'Eine jährliche Abgabe auf das Nettovermögen – ein Werkzeug, das es fast nirgendwo sonst gibt.',
    example: 'Dank der Vermögenssteuer zahlen Milliardäre in der Schweiz mehr als in Deutschland oder Österreich.',
    icon: '🇨🇭'
  },
  {
    id: 'lenkung',
    title: 'Werkzeug 2: Lenkungsabgaben',
    description: 'Steuern, die unser Verhalten lenken – unerwünschtes Verhalten wird teurer, erwünschtes attraktiver.',
    example: 'Beispiele: Tabaksteuer (Gesundheit), CO2-Abgabe (Klima), Grundstückgewinnsteuer (stabiler Immobilienmarkt).',
    icon: '🎯'
  },
  {
    id: 'individualbesteuerung',
    title: 'Werkzeug 3: Die Grundsatzfrage',
    description: 'Seit 1984 ist das heutige System verfassungswidrig. Am 8. März 2026 können wir das ändern.',
    example: 'Die Heiratsstrafe: Ehepaare rutschen durch zusammengerechnete Einkommen in höhere Steuerklassen.',
    icon: '🗳️'
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

// Zeitungsartikel-Empfehlungen
const NEWSPAPER_ARTICLES = [
  {
    id: 'nzz',
    title: 'Keine Sonderregeln mehr für Ehepaare',
    source: 'NZZ',
    date: '2026',
    url: 'https://www.nzz.ch/schweiz/keine-sonderregeln-mehr-fuer-ehepaare-die-staedte-erwarten-ein-wesentlich-einfacheres-steuersystem-ld.1923084',
    description: 'Die Städte erwarten ein wesentlich einfacheres Steuersystem. Der Artikel beleuchtet die praktischen Auswirkungen der Reform auf die Steuerverwaltung.',
    hasPaywall: true,
    color: 'blue'
  },
  {
    id: 'republik',
    title: 'Heiratsstrafe: In guten wie in teuren Tagen',
    source: 'Republik',
    date: '6. Februar 2026',
    url: 'https://www.republik.ch/2026/02/06/heiratsstrafe-in-guten-wie-in-teuren-tagen',
    description: 'Umfassende Erklärung zur Vorlage: Woher kommt sie? Wer profitiert? Was sind die Argumente? Ein sehr gut recherchierter Überblicksartikel.',
    hasPaywall: true,
    color: 'purple'
  },
  {
    id: 'woz',
    title: 'Angriff auf den Einzelernährer',
    source: 'WOZ',
    date: '2026',
    url: 'https://www.woz.ch/2605/individualbesteuerung/angriff-auf-den-einzelernaehrer/!TTGR99PS2AFA',
    description: 'Kritische Perspektive aus linker Sicht: Wie verändert die Reform die Arbeitsteilung in Familien? Welche gesellschaftlichen Folgen hat sie?',
    hasPaywall: true,
    color: 'red'
  },
  {
    id: 'tagesanzeiger',
    title: 'Wer profitiert und wer verliert',
    source: 'Tages-Anzeiger',
    date: '2026',
    url: 'https://www.tagesanzeiger.ch/abstimmung-individualbesteuerung-wer-profitiert-und-wer-verliert-940664083586',
    description: 'Detaillierte Analyse mit konkreten Rechenbeispielen: Welche Haushaltstypen zahlen künftig mehr oder weniger Steuern?',
    hasPaywall: true,
    color: 'amber'
  }
]

// Quiz für Kapitel 2 (basierend auf dem Film "Steuergerechtigkeit")
const STEUERZIELE_QUIZ = [
  {
    id: 's1',
    question: 'Wie viel Prozent des Vermögens in der Schweiz gehört dem reichsten 1%?',
    options: [
      '23%',
      '35%',
      '45%',
      '60%'
    ],
    correct: '45%'
  },
  {
    id: 's2',
    question: 'Was ist das besondere "Schweizer As" im Steuersystem?',
    options: [
      'Die Mehrwertsteuer',
      'Die Vermögenssteuer',
      'Die Einkommenssteuer',
      'Die Erbschaftssteuer'
    ],
    correct: 'Die Vermögenssteuer'
  },
  {
    id: 's3',
    question: 'Was ist das Hauptziel von Lenkungsabgaben wie der Tabaksteuer?',
    options: [
      'Möglichst viel Geld für den Staat einzunehmen',
      'Unerwünschtes Verhalten teurer und erwünschtes attraktiver zu machen',
      'Die Wirtschaft anzukurbeln',
      'Arbeitsplätze zu schaffen'
    ],
    correct: 'Unerwünschtes Verhalten teurer und erwünschtes attraktiver zu machen'
  },
  {
    id: 's4',
    question: 'Seit wann ist das heutige Ehepaar-Steuersystem laut Bundesgericht verfassungswidrig?',
    options: [
      'Seit 1964',
      'Seit 1984',
      'Seit 2004',
      'Seit 2016'
    ],
    correct: 'Seit 1984'
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

  // Zeitungsartikel-Bewertungen
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set())
  const [articleRatings, setArticleRatings] = useState<{[key: string]: {lesefreundlichkeit: number, inhalt: number}}>({})
  const [articleClicks, setArticleClicks] = useState<{[key: string]: number}>({})

  // Lesehilfe state
  const [readingHelpActive, setReadingHelpActive] = useState(false)
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0)
  const [readingHelpPosition, setReadingHelpPosition] = useState<{ top: number } | null>(null)

  const maxPoints = 100

  // Lesehilfe Targets je nach Kapitel
  const getReadingTargets = () => {
    if (!activeChapter) {
      return [
        { id: 'intro-text', label: '📖 Einführung', description: 'Modul-Überblick' },
        { id: 'chapter-geschichte', label: '📅 Kapitel 1', description: 'Geschichte' },
        { id: 'chapter-steuern', label: '⚖️ Kapitel 2', description: 'Steuerziele' },
      ]
    } else if (activeChapter === 'geschichte') {
      return [
        { id: 'timeline-intro', label: '📖 Einführung', description: 'Timeline-Info' },
        { id: 'timeline-task', label: '📅 Aufgabe', description: 'Ereignisse erkunden' },
      ]
    } else if (activeChapter === 'steuerziele') {
      return [
        { id: 'steuer-intro', label: '📖 Einführung', description: 'Steuerziele' },
        { id: 'steuer-task', label: '⚖️ Aufgabe', description: 'Ziele erkunden' },
      ]
    }
    return []
  }

  const READING_TARGETS = getReadingTargets()

  const navigateReadingHelp = () => {
    if (!readingHelpActive) {
      setReadingHelpActive(true)
      setCurrentReadingIndex(0)
      scrollToReadingTarget(0)
    } else {
      const nextIndex = (currentReadingIndex + 1) % READING_TARGETS.length
      setCurrentReadingIndex(nextIndex)
      scrollToReadingTarget(nextIndex)
    }
  }

  const scrollToReadingTarget = (index: number) => {
    const target = READING_TARGETS[index]
    if (target) {
      const element = document.getElementById(target.id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const closeReadingHelp = () => {
    setReadingHelpActive(false)
    setCurrentReadingIndex(0)
    setReadingHelpPosition(null)
  }

  // Navigation mit Lesehilfe-Check
  const handleNavigate = (path: string) => {
    if (readingHelpActive) {
      closeReadingHelp()
      alert('Lesehilfe wurde geschlossen. Klicken Sie erneut, um zu navigieren.')
      return
    }
    router.push(path)
  }

  const handleChapterChange = (chapter: Chapter) => {
    if (readingHelpActive) {
      closeReadingHelp()
      alert('Lesehilfe wurde geschlossen. Klicken Sie erneut, um das Kapitel zu wechseln.')
      return
    }
    setActiveChapter(chapter)
  }

  useEffect(() => {
    setReadingHelpActive(false)
    setCurrentReadingIndex(0)
  }, [activeChapter])

  useEffect(() => {
    const updatePosition = () => {
      if (readingHelpActive && READING_TARGETS[currentReadingIndex]) {
        const element = document.getElementById(READING_TARGETS[currentReadingIndex].id)
        if (element) {
          const rect = element.getBoundingClientRect()
          const targetTop = rect.top + (rect.height / 2) - 30
          const clampedTop = Math.max(80, Math.min(targetTop, window.innerHeight - 100))
          setReadingHelpPosition({ top: clampedTop })
        }
      } else {
        setReadingHelpPosition(null)
      }
    }
    updatePosition()
    if (readingHelpActive) {
      window.addEventListener('scroll', updatePosition)
      return () => window.removeEventListener('scroll', updatePosition)
    }
  }, [readingHelpActive, currentReadingIndex, READING_TARGETS])

  // Lesehilfe Styles
  const readingHelpStyles = `
    .reading-highlight-box {
      position: relative;
      box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4) !important;
      border-radius: 12px;
      animation: reading-pulse 2s ease-in-out infinite;
    }
    .reading-highlight-box::before {
      content: attr(data-reading-label);
      position: absolute;
      top: -12px;
      left: 12px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 6px;
      z-index: 10;
      white-space: nowrap;
    }
    @keyframes reading-pulse {
      0%, 100% { box-shadow: 0 0 0 4px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.4); }
      50% { box-shadow: 0 0 0 6px #f59e0b, 0 0 35px rgba(245, 158, 11, 0.6); }
    }
  `

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
            // Zeitungsartikel-Daten laden
            if (data.readArticles) setReadArticles(new Set(data.readArticles))
            if (data.articleRatings) setArticleRatings(data.articleRatings)
            if (data.articleClicks) setArticleClicks(data.articleClicks)
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
          lastUpdated: new Date().toISOString(),
          // Zeitungsartikel-Daten speichern
          readArticles: Array.from(readArticles),
          articleRatings: articleRatings,
          articleClicks: articleClicks
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

  // Speichert nur die Zeitungsartikel-Daten (ohne Punkte zu ändern)
  const saveArticleData = async (newReadArticles: Set<string>, newRatings: {[key: string]: {lesefreundlichkeit: number, inhalt: number}}, newClicks: {[key: string]: number}) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}

        modules.vertiefung = {
          ...modules.vertiefung,
          readArticles: Array.from(newReadArticles),
          articleRatings: newRatings,
          articleClicks: newClicks,
          lastUpdated: new Date().toISOString()
        }

        await updateDoc(userRef, { modules })
      }
    } catch (e) { console.error(e) }
  }

  // Artikel als gelesen markieren und speichern
  const toggleArticleRead = async (articleId: string) => {
    const newRead = new Set(readArticles)
    if (newRead.has(articleId)) {
      newRead.delete(articleId)
    } else {
      newRead.add(articleId)
    }
    setReadArticles(newRead)
    await saveArticleData(newRead, articleRatings, articleClicks)
  }

  // Artikel bewerten und speichern
  const rateArticle = async (articleId: string, category: 'lesefreundlichkeit' | 'inhalt', rating: number) => {
    const newRatings = {
      ...articleRatings,
      [articleId]: {
        ...articleRatings[articleId],
        [category]: rating
      }
    }
    setArticleRatings(newRatings)
    await saveArticleData(readArticles, newRatings, articleClicks)
  }

  // Klick auf Artikel tracken
  const trackArticleClick = async (articleId: string) => {
    const newClicks = {
      ...articleClicks,
      [articleId]: (articleClicks[articleId] || 0) + 1
    }
    setArticleClicks(newClicks)
    await saveArticleData(readArticles, articleRatings, newClicks)
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
      <div className={`min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 ${readingHelpActive ? 'reading-active' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: readingHelpStyles }} />

        {/* Lesehilfe Button */}
        <div
          className="fixed z-30 right-4 transition-all duration-300 ease-out"
          style={{
            top: readingHelpActive && readingHelpPosition ? `${readingHelpPosition.top}px` : 'auto',
            bottom: readingHelpActive && readingHelpPosition ? 'auto' : '2rem'
          }}
        >
          <div className="relative">
            <button
              onClick={navigateReadingHelp}
              className={`p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
                readingHelpActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
                  : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
              }`}
            >
              <Glasses className="h-6 w-6" />
            </button>
            {readingHelpActive && (
              <>
                <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[2.5rem] text-center shadow-md animate-pulse">
                  {currentReadingIndex + 1}/{READING_TARGETS.length}
                </div>
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-amber-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-[180px]">
                  <div className="font-semibold text-xs">{READING_TARGETS[currentReadingIndex]?.label}</div>
                  <div className="text-[10px] text-amber-200 mt-0.5">{READING_TARGETS[currentReadingIndex]?.description}</div>
                  <div className="text-[10px] text-amber-300 mt-1">Klicken → weiter</div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                    <div className="border-8 border-transparent border-l-amber-600"></div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); closeReadingHelp(); }} className="absolute -top-1 -left-1 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-1 shadow-md">
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>

        <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => handleNavigate('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
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
          {/* Lesehilfe Info-Banner */}
          {readingHelpActive && (
            <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Glasses className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-semibold text-sm">
                    Lesehilfe: <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{currentReadingIndex + 1}/{READING_TARGETS.length}</span>
                  </p>
                  <p className="text-amber-700 text-xs">{READING_TARGETS[currentReadingIndex]?.label} — {READING_TARGETS[currentReadingIndex]?.description}</p>
                </div>
              </div>
              <button onClick={closeReadingHelp} className="text-amber-600 hover:text-amber-800"><X className="h-5 w-5" /></button>
            </div>
          )}

          <div
            id="intro-text"
            className={`bg-white rounded-xl p-6 shadow-sm transition-all ${readingHelpActive && currentReadingIndex === 0 ? 'reading-highlight-box' : ''}`}
            data-reading-label="📖 Einführung"
          >
            <p className="text-gray-700 mb-3">
              Tauchen Sie tiefer ein in die <strong>Hintergründe der Abstimmung</strong>. Im ersten Kapitel erfahren Sie,
              welche politischen Ereignisse zur heutigen Abstimmung geführt haben. Eine interaktive Zeitachse zeigt die
              wichtigsten Meilensteine von 2016 bis 2026 – klicken Sie auf die Ereignisse, um mehr zu erfahren.
            </p>
            <p className="text-gray-700 mb-3">
              Ein Beispiel: 2016 wurde die CVP-Initiative gegen die Heiratsstrafe knapp abgelehnt – doch später wurde entdeckt,
              dass der Bundesrat die Stimmberechtigten <strong>falsch informiert</strong> hatte: Statt 80'000 waren über
              450'000 Ehepaare von der Heiratsstrafe betroffen! 2019 wurde die Abstimmung deshalb <strong>erstmals in der
              Schweizer Geschichte</strong> vom Bundesgericht annulliert.
            </p>
            <p className="text-gray-700">
              Im zweiten Kapitel verstehen Sie die <strong>grundlegenden Ziele des Steuersystems</strong>: Warum gibt es
              Steuern? Wie sorgen sie für Fairness? Und was hat die Vermögenssteuer – das «Schweizer As», das es fast
              nirgendwo sonst gibt – damit zu tun? Ein Erklärvideo des Bundes führt Sie durch den «Steuer-Werkzeugkasten»
              der Schweiz.
            </p>
          </div>

          <div className="space-y-3">
            {/* Kapitel 1: Geschichte */}
            <button
              id="chapter-geschichte"
              onClick={() => handleChapterChange('geschichte')}
              className={`w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-emerald-200 ${readingHelpActive && currentReadingIndex === 1 ? 'reading-highlight-box' : ''}`}
              data-reading-label="📅 Kapitel 1"
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
              id="chapter-steuern"
              onClick={() => handleChapterChange('steuerziele')}
              className={`w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-emerald-200 ${readingHelpActive && currentReadingIndex === 2 ? 'reading-highlight-box' : ''}`}
              data-reading-label="⚖️ Kapitel 2"
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

          {/* Zeitungstextempfehlungen - Freiwillige Aufgabe */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-dashed border-slate-300">
            <div className="bg-gradient-to-r from-slate-100 to-gray-100 p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-600 p-2 rounded-lg">
                    <Newspaper className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">📰 Zeitungstextempfehlungen</h3>
                    <p className="text-sm text-gray-500">Vertiefen Sie Ihr Wissen mit Qualitätsjournalismus</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full">
                    📖 Freiwillig
                  </span>
                  <span className="text-xs text-gray-400 mt-1">Keine Punkte</span>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded-r-lg mb-4">
                <p className="text-emerald-800 text-sm">
                  <strong>🎯 Freiwillige Vertiefung:</strong> Diese Texte sind <strong>optional</strong>, aber sehr empfehlenswert!
                  Markieren Sie gelesene Artikel und bewerten Sie diese – Ihr Feedback hilft anderen Lernenden.
                </p>
              </div>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg mb-4">
                <p className="text-amber-800 text-sm">
                  <strong>💡 Hinweis:</strong> Diese Artikel sind z.T. hinter einer <strong>Paywall</strong>.
                  Als Schüler:in können Sie diese über <strong>Swissdox</strong> kostenlos lesen.
                  Fragen Sie Ihre Lehrperson nach dem Zugang.
                </p>
              </div>

              <div className="space-y-3">
                {NEWSPAPER_ARTICLES.map((article) => {
                  const isRead = readArticles.has(article.id)
                  const rating = articleRatings[article.id]
                  const colorClasses: {[key: string]: string} = {
                    blue: 'border-blue-200 hover:border-blue-400',
                    purple: 'border-purple-200 hover:border-purple-400',
                    red: 'border-red-200 hover:border-red-400',
                    amber: 'border-amber-200 hover:border-amber-400'
                  }
                  const bgClasses: {[key: string]: string} = {
                    blue: 'bg-blue-500',
                    purple: 'bg-purple-500',
                    red: 'bg-red-500',
                    amber: 'bg-amber-500'
                  }

                  return (
                    <div
                      key={article.id}
                      className={`p-4 rounded-xl border-2 transition-all ${colorClasses[article.color]} ${isRead ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 ${bgClasses[article.color]} text-white text-xs font-semibold rounded`}>
                              {article.source}
                            </span>
                            {article.hasPaywall && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Lock className="h-3 w-3" /> Paywall
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{article.date}</span>
                            {articleClicks[article.id] > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                👁️ {articleClicks[article.id]}x aufgerufen
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{article.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackArticleClick(article.id)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Artikel öffnen
                          </a>
                        </div>

                        <div className="flex flex-col items-center gap-2 min-w-[140px]">
                          <button
                            onClick={() => toggleArticleRead(article.id)}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                              isRead
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-amber-100 text-amber-800 border-2 border-amber-400 hover:bg-amber-200 animate-pulse'
                            }`}
                          >
                            {isRead ? (
                              <>✓ Gelesen</>
                            ) : (
                              <>
                                <span className="text-lg">👆</span>
                                <span>Hier klicken wenn gelesen</span>
                              </>
                            )}
                          </button>
                          {!isRead && (
                            <p className="text-xs text-gray-500 text-center">Nach dem Lesen hier bestätigen</p>
                          )}
                        </div>
                      </div>

                      {/* Bewertung */}
                      {isRead && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Wie fanden Sie diesen Artikel?</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Lesefreundlichkeit</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => rateArticle(article.id, 'lesefreundlichkeit', star)}
                                    className={`text-lg transition-colors ${
                                      (rating?.lesefreundlichkeit || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Inhalt</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => rateArticle(article.id, 'inhalt', star)}
                                    className={`text-lg transition-colors ${
                                      (rating?.inhalt || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {readArticles.size > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-emerald-800 text-sm">
                  <strong>📚 Sie haben {readArticles.size} von {NEWSPAPER_ARTICLES.length} Artikeln gelesen!</strong>
                  {readArticles.size === NEWSPAPER_ARTICLES.length && (
                    <span className="ml-2">Hervorragend – Sie sind bestens informiert!</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {isComplete && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
              <p className="text-emerald-100 mb-4">
                Sie haben {totalScore} Punkte erreicht{bonusScore > 0 && <span> (+{bonusScore} Bonus)</span>}
              </p>
              <button onClick={() => handleNavigate('/dashboard')} className="px-6 py-2 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50">
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
      <div className={`min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 ${readingHelpActive ? 'reading-active' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: readingHelpStyles }} />

        {/* Lesehilfe Button */}
        <button
          onClick={() => setReadingHelpActive(!readingHelpActive)}
          className={`fixed bottom-6 right-6 z-30 p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
            readingHelpActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
              : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
          }`}
          title={readingHelpActive ? 'Lesehilfe deaktivieren' : 'Lesehilfe aktivieren'}
        >
          <Glasses className="h-6 w-6" />
        </button>

        <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => handleChapterChange(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
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
            <button onClick={() => handleChapterChange(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">← Übersicht</button>
            <button onClick={() => handleChapterChange('steuerziele')} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold flex items-center gap-2">
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
      <div className={`min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 ${readingHelpActive ? 'reading-active' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: readingHelpStyles }} />

        {/* Lesehilfe Button */}
        <button
          onClick={() => setReadingHelpActive(!readingHelpActive)}
          className={`fixed bottom-6 right-6 z-30 p-4 rounded-full shadow-lg hover:shadow-xl transition-all ${
            readingHelpActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300'
              : 'bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-300'
          }`}
          title={readingHelpActive ? 'Lesehilfe deaktivieren' : 'Lesehilfe aktivieren'}
        >
          <Glasses className="h-6 w-6" />
        </button>

        <header className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => handleChapterChange(null)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
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
                  <h3 className="font-bold text-gray-900">Film: Der Steuer-Werkzeugkasten der Schweiz</h3>
                  <p className="text-sm text-gray-500">Steuern als mächtige Werkzeuge für Fairness und Lenkung</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <iframe
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/wtjs1PG4y8s"
                  title="Der Steuer-Werkzeugkasten der Schweiz"
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
                  <h3 className="font-bold text-gray-900">Der Steuer-Werkzeugkasten</h3>
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
            <button onClick={() => handleChapterChange('geschichte')} className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2">
              <History className="h-4 w-4" /> ← Kapitel 1
            </button>
            <button onClick={() => handleChapterChange(null)} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold">
              Zur Übersicht →
            </button>
          </div>
        </main>
      </div>
    )
  }

  return null
}
