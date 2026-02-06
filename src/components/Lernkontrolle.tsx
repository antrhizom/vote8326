import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, RotateCcw, ClipboardCheck } from 'lucide-react'

interface QuizQuestion {
  question: string
  answers: {
    text: string
    correct: boolean
    feedback: string
  }[]
}

interface LernkontrolleProps {
  onComplete: (score: number) => void
  onReset?: () => void
  initialCompleted?: boolean
  initialScore?: number
}

const allQuestions: QuizQuestion[] = [
  {
    question: "Was bezeichnet der Begriff Heiratsstrafe?",
    answers: [
      { text: "Die steuerliche Benachteiligung bestimmter verheirateter Paare gegenüber unverheirateten Paaren", correct: true, feedback: "Bei vielen Ehepaaren werden die Einkommen zusammengerechnet. Dadurch können sie in eine höhere Steuerprogression geraten und zahlen mehr als vergleichbare unverheiratete Paare mit getrennten Steuererklärungen." },
      { text: "Eine Strafabgabe, die bei einer Scheidung fällig wird und vom Gericht festgelegt werden kann", correct: false, feedback: "Die Heiratsstrafe entsteht während der Ehe durch die gemeinsame Veranlagung und nicht erst bei einer Scheidung." },
      { text: "Eine freiwillige Zusatzsteuer, die Ehepaare beim Bund beantragen können für bessere Leistungen", correct: false, feedback: "Die Heiratsstrafe ist eine systembedingte Mehrbelastung für gewisse Ehepaare. Sie ist keine freiwillige Zahlung, sondern ergibt sich aus Tarifen und Progression." },
      { text: "Eine kirchliche Abgabe, die im Zusammenhang mit der kirchlichen Trauung erhoben wird", correct: false, feedback: "Die Heiratsstrafe entsteht im staatlichen Steuersystem. Sie betrifft die direkte Bundessteuer und nicht Kirchensteuern." }
    ]
  },
  {
    question: "Wie werden Ehepaare heute bei der direkten Bundessteuer besteuert?",
    answers: [
      { text: "Mit einer gemeinsamen Steuererklärung, in der Einkommen und Vermögen zusammengezählt werden", correct: true, feedback: "Ehepaare reichen heute typischerweise eine gemeinsame Steuererklärung ein. Dadurch werden die wirtschaftlichen Verhältnisse als Einheit erfasst, was bei zwei Einkommen zu einer höheren Progression führen kann." },
      { text: "Mit zwei getrennten Steuererklärungen, wobei jeder Partner sein eigenes Einkommen deklariert", correct: false, feedback: "Zwei getrennte Steuererklärungen wären ein Kernelement der Individualbesteuerung und sind gerade das, was sich ändern würde." },
      { text: "Nur das höhere Einkommen wird besteuert, das tiefere Einkommen bleibt komplett steuerfrei", correct: false, feedback: "Einkommen und Vermögen beider Ehepartner werden zusammengezählt. Es zählt nicht nur das höhere Einkommen, sondern die Summe." },
      { text: "Pauschal mit einem festen Betrag, der unabhängig vom tatsächlichen Einkommen erhoben wird", correct: false, feedback: "Das System ist einkommensabhängig und progressiv. Ehepaare werden gemeinsam veranlagt und die Steuer hängt vom Einkommen ab." }
    ]
  },
  {
    question: "Wer hat das Referendum gegen die Individualbesteuerung ergriffen?",
    answers: [
      { text: "Zehn Kantone und ein überparteiliches Komitee haben gemeinsam das Referendum lanciert", correct: true, feedback: "Mindestens acht Kantone können ein Kantonsreferendum auslösen. Da dieses Quorum erreicht wurde, kommt die Vorlage vors Volk." },
      { text: "Der Bundesrat hat das Referendum eingeleitet, um die Vorlage dem Volk vorzulegen", correct: false, feedback: "Der Bundesrat steht hingegen hinter der Vorlage und empfiehlt sie zur Annahme." },
      { text: "Das Bundesgericht hat das Referendum angeordnet aufgrund rechtlicher Bedenken zur Vorlage", correct: false, feedback: "Das Bundesgericht ist keine politische Akteurin im Referendumsprozess, sondern beurteilt Rechtsfragen." },
      { text: "Ausschliesslich eine einzelne Partei hat das Referendum ohne weitere Unterstützung ergriffen", correct: false, feedback: "Es handelt sich nicht um einen Schritt nur einer einzelnen Partei, sondern um ein überparteiliches Engagement." }
    ]
  },
  {
    question: "Was soll mit der Individualbesteuerung hauptsächlich erreicht werden?",
    answers: [
      { text: "Die steuerliche Gleichbehandlung unabhängig vom Zivilstand und damit die Abschaffung der Heiratsstrafe", correct: true, feedback: "Die Vorlage will verhindern, dass Paare wegen Heirat steuerlich besser oder schlechter gestellt werden. Entscheidend soll stärker das individuelle Einkommen sein." },
      { text: "Die vollständige Abschaffung der Ehe als rechtliche Institution im Schweizer Zivilrecht", correct: false, feedback: "Am Zivilrecht und an der Ehe als Institution ändert die Vorlage nichts." },
      { text: "Die komplette Abschaffung aller Steuerabzüge für natürliche Personen beim Bund", correct: false, feedback: "Abzüge bleiben grundsätzlich möglich, einzelne Elemente wie der Kinderabzug werden sogar angepasst." },
      { text: "Die vollständige Abschaffung der Steuerprogression zugunsten eines Einheitssteuersatzes", correct: false, feedback: "Die Progression als Grundprinzip der Besteuerung bleibt bestehen." }
    ]
  },
  {
    question: "Welche Ehepaare profitieren tendenziell eher von der Individualbesteuerung?",
    answers: [
      { text: "Doppelverdiener-Ehepaare, bei denen beide Partner ähnlich hohe Einkommen erzielen", correct: true, feedback: "Wenn zwei Einkommen ähnlich hoch sind, fällt der Effekt der gemeinsamen Progression weg. Dadurch sinkt die Steuerbelastung im Vergleich zum heutigen System häufig." },
      { text: "Einverdiener-Ehepaare, bei denen nur ein Partner erwerbstätig ist und Einkommen erzielt", correct: false, feedback: "Einverdiener-Ehepaare profitieren heute oft von der gemeinsamen Veranlagung und könnten nach der Umstellung eher stärker belastet werden." },
      { text: "Alle Familien mit Kindern profitieren automatisch und unabhängig von ihrer Einkommenssituation", correct: false, feedback: "Ob Familien mit Kindern profitieren, hängt stark von Einkommen, Aufteilung und Abzügen ab." },
      { text: "Nur unverheiratete Paare im Konkubinat können von dieser Steuerreform wirklich profitieren", correct: false, feedback: "Unverheiratete Paare werden heute bereits getrennt besteuert, für sie ist der Systemwechsel weniger grundlegend." }
    ]
  },
  {
    question: "Warum wird der Kinderabzug erhöht?",
    answers: [
      { text: "Um Familien zu entlasten und mögliche Mehrbelastungen bei gewissen Konstellationen abzufedern", correct: true, feedback: "Wenn bestimmte Haushalte durch die Umstellung mehr zahlen würden, soll der höhere Kinderabzug die Belastung reduzieren. Dadurch wird versucht, die Vorlage ausgewogener zu gestalten." },
      { text: "Um die Steuereinnahmen des Bundes zu erhöhen und neue Projekte finanzieren zu können", correct: false, feedback: "Ein höherer Abzug senkt die Steuerlast und führt nicht zu höheren Einnahmen." },
      { text: "Um die Kantone zu bestrafen, die das Referendum gegen die Vorlage ergriffen haben", correct: false, feedback: "Es geht um soziale Ausgleichsmassnahmen, nicht um Sanktionen gegenüber Kantonen." },
      { text: "Um das Heiraten steuerlich attraktiver zu machen und mehr Ehen zu fördern", correct: false, feedback: "Die Reform will gerade zivilstandsneutral sein und nicht Heirat steuerlich besonders fördern." }
    ]
  },
  {
    question: "Welches zentrale Argument bringen Gegner der Individualbesteuerung vor?",
    answers: [
      { text: "Der administrative Aufwand für Bevölkerung und Steuerbehörden steige stark an", correct: true, feedback: "Wenn auch Ehepaare zwei Steuererklärungen einreichen, müssen deutlich mehr Dossiers bearbeitet werden. Gegner erwarten dadurch höhere Verwaltungskosten und mehr Bürokratie." },
      { text: "Die Ehe als Institution werde durch diese Steuerreform faktisch verboten werden", correct: false, feedback: "Die Ehe bleibt rechtlich unangetastet, es geht um die Art der Besteuerung." },
      { text: "Alle Steuern würden mit dieser Reform komplett abgeschafft werden", correct: false, feedback: "Steuern bleiben bestehen, nur die Veranlagungslogik ändert." },
      { text: "Das Referendum sei formell ungültig und dürfte gar nicht stattfinden", correct: false, feedback: "Das Referendum ist formell zustande gekommen, sonst gäbe es keine Abstimmung." }
    ]
  },
  {
    question: "Warum erwarten Befürworter mehr Erwerbsanreize durch Individualbesteuerung?",
    answers: [
      { text: "Weil der Zweitverdienst weniger stark durch die Progression des gemeinsamen Einkommens belastet wird", correct: true, feedback: "Wenn Einkommen getrennt besteuert werden, fällt ein Teil des Progressionseffekts weg. Dadurch lohnt sich eine Pensumerhöhung für den tiefer verdienenden Partner tendenziell stärker." },
      { text: "Weil generell weniger gearbeitet werden muss, um den gleichen Nettolohn zu erreichen", correct: false, feedback: "Es geht um Anreize, nicht darum, dass weniger gearbeitet werden soll." },
      { text: "Weil Unternehmen durch diese Reform deutlich weniger Steuern zahlen müssen", correct: false, feedback: "Die Vorlage betrifft natürliche Personen, nicht die Besteuerung von Unternehmen." },
      { text: "Weil durch die Reform alle Personen gleich viel verdienen werden", correct: false, feedback: "Einkommensunterschiede bleiben bestehen, geändert wird die steuerliche Behandlung." }
    ]
  },
  {
    question: "Welche Ebene ist direkt Gegenstand der Abstimmung?",
    answers: [
      { text: "Die direkte Bundessteuer und deren Regeln zur Veranlagung von natürlichen Personen", correct: true, feedback: "Die Vorlage ist ein Bundesgesetz und betrifft unmittelbar die Bundessteuer. Auswirkungen auf Kantone hängen davon ab, wie sie ihre Systeme anpassen." },
      { text: "Nur die Gemeindesteuern, während die Bundessteuer unverändert bleibt", correct: false, feedback: "Gemeindesteuern wären höchstens indirekt betroffen, weil Kantone und Gemeinden eigene Regeln haben." },
      { text: "Die AHV-Beiträge und andere Sozialversicherungsabgaben der Arbeitnehmenden", correct: false, feedback: "Sozialversicherungen wie die AHV gehören nicht zu dieser Steuervorlage." },
      { text: "Die Kirchensteuer und deren Erhebung durch die Landeskirchen", correct: false, feedback: "Kirchensteuern sind kantonal geregelt und nicht Teil des Bundesgesetzes." }
    ]
  },
  {
    question: "Warum wurde die Abstimmung zur Heiratsstrafe von 2016 aufgehoben?",
    answers: [
      { text: "Wegen schwerwiegender Fehlinformation der Stimmberechtigten und einer Annullierung durch das Bundesgericht im April 2019", correct: true, feedback: "Vor der Abstimmung vom Februar 2016 wurden falsche Angaben zur Anzahl betroffener Ehepaare verbreitet. Das Bundesgericht beurteilte dies als Verletzung der Abstimmungsfreiheit und hob die Volksabstimmung auf - ein historischer Schritt." },
      { text: "Wegen einer zu tiefen Stimmbeteiligung, die unter dem erforderlichen Quorum lag", correct: false, feedback: "Es ging nicht um die Beteiligung, sondern um falsche Informationen, die die freie Meinungsbildung beeinträchtigten." },
      { text: "Wegen technischer Probleme beim Auszählen der Stimmen in mehreren Kantonen", correct: false, feedback: "Das Problem lag nicht beim Auszählen, sondern bei inhaltlich falschen Angaben im Abstimmungskampf." },
      { text: "Weil mehrere Parteien im Vorfeld der Abstimmung verboten worden waren", correct: false, feedback: "Parteien waren nicht verboten, entscheidend war die Verletzung der Abstimmungsfreiheit." }
    ]
  },
  {
    question: "Was bedeutet Zivilstandsneutralität im Steuersystem?",
    answers: [
      { text: "Der Zivilstand einer Person soll keinen Einfluss auf deren Steuerbelastung haben", correct: true, feedback: "Ob jemand verheiratet ist, im Konkubinat lebt oder allein ist, soll nicht darüber entscheiden, ob mehr oder weniger Steuern bezahlt werden. Massgeblich soll die individuelle wirtschaftliche Leistungsfähigkeit sein." },
      { text: "Verheiratete Personen zahlen grundsätzlich immer weniger Steuern als Ledige", correct: false, feedback: "Es geht nicht um eine generelle Bevorzugung von Verheirateten, sondern um gleiche Regeln für alle." },
      { text: "Unverheiratete Personen zahlen systematisch mehr Steuern als verheiratete Paare", correct: false, feedback: "Auch unverheiratete Personen sollen nicht schlechter gestellt werden." },
      { text: "Nur Familien mit Kindern profitieren von diesem Prinzip der Steuererhebung", correct: false, feedback: "Das Prinzip gilt für alle Steuerpflichtigen, nicht nur für Familien." }
    ]
  },
  {
    question: "Warum kritisieren Kantone die Individualbesteuerung häufig?",
    answers: [
      { text: "Weil sie mehr administrative Arbeit und höhere Kosten bei der Veranlagung erwarten", correct: true, feedback: "Kantone führen die Veranlagung praktisch durch und müssten Prozesse, IT und Personal anpassen. Zudem steigt die Zahl der zu bearbeitenden Steuerfälle, wenn Ehepaare getrennt veranlagt werden." },
      { text: "Weil sie durch diese Reform ihre kantonale Steuerhoheit komplett verlieren würden", correct: false, feedback: "Ihre Steuerhoheit bleibt bestehen, sie müssen jedoch die Umsetzung organisatorisch bewältigen." },
      { text: "Weil die Mehrwertsteuer durch diese Reform deutlich sinken würde", correct: false, feedback: "Die Mehrwertsteuer ist nicht Teil der Vorlage." },
      { text: "Weil die Kantone bei der Ausarbeitung der Vorlage nicht mitbestimmen durften", correct: false, feedback: "Tatsächlich haben Kantone aktiv mitbestimmt, indem sie das Referendum ergriffen haben." }
    ]
  },
  {
    question: "Welche Rolle spielte das Bundesgericht in der Debatte um die Heiratsstrafe?",
    answers: [
      { text: "Es stellte 2019 eine Verletzung der Abstimmungsfreiheit fest und annullierte die Volksabstimmung von 2016", correct: true, feedback: "Das Gericht hielt fest, dass die Stimmberechtigten wegen falscher Informationen nicht frei entscheiden konnten. Darum wurde die Abstimmung aufgehoben, ein aussergewöhnlicher Eingriff in den demokratischen Prozess." },
      { text: "Es empfahl dem Stimmvolk ein Ja zur Individualbesteuerung und unterstützte die Vorlage", correct: false, feedback: "Gerichte geben keine Abstimmungsempfehlungen, sie prüfen die Einhaltung von Grundrechten und Verfahren." },
      { text: "Es schrieb den Gesetzestext zur Individualbesteuerung und legte die Details fest", correct: false, feedback: "Gesetze werden von Parlament und Bundesrat erarbeitet, nicht vom Gericht geschrieben." },
      { text: "Es ergriff selbst das Referendum gegen die Vorlage des Parlaments", correct: false, feedback: "Referenden werden von Stimmberechtigten oder Kantonen ergriffen, nicht von Gerichten." }
    ]
  },
  {
    question: "Warum ist die Abstimmung zur Individualbesteuerung politisch besonders bedeutsam?",
    answers: [
      { text: "Weil sie einen grundlegenden Systemwechsel im Schweizer Steuersystem darstellt", correct: true, feedback: "Erstmals würde bei der direkten Bundessteuer konsequent auf individuelle Besteuerung umgestellt. Das kann Gewinner und Verlierer je nach Einkommensaufteilung erzeugen und hat Folgen für Steuergerechtigkeit, Verwaltung und Erwerbsanreize." },
      { text: "Weil ausschliesslich Ehepaare von dieser Abstimmung betroffen sein werden", correct: false, feedback: "Betroffen sind nicht nur Ehepaare, sondern das gesamte System der Veranlagung und damit viele Steuerpflichtige." },
      { text: "Weil die Vorlage rein symbolischer Natur ist und keine praktischen Auswirkungen hat", correct: false, feedback: "Die Folgen wären konkret, etwa bei der Anzahl Steuererklärungen, bei der Steuerbelastung und beim Verwaltungsaufwand." },
      { text: "Weil dies das allerletzte Referendum in der Geschichte der Schweiz sein wird", correct: false, feedback: "Die direkte Demokratie bleibt bestehen, Referenden und Abstimmungen werden weiterhin möglich sein." }
    ]
  },
  {
    question: "Was ist der Hauptunterschied zwischen dem heutigen System und der Individualbesteuerung bezüglich der Steuerprogression?",
    answers: [
      { text: "Im heutigen System werden Einkommen zusammengezählt, was zu höherer Progression führen kann; bei Individualbesteuerung wird jede Person separat besteuert", correct: true, feedback: "Bei der gemeinsamen Veranlagung steigt durch die Zusammenrechnung der Einkommen oft der Steuersatz. Bei der Individualbesteuerung würde jeder Partner nur auf sein eigenes Einkommen besteuert, was den Progressionseffekt bei Doppelverdienern reduziert." },
      { text: "Die Steuerprogression wird durch die Individualbesteuerung komplett abgeschafft und durch einen Einheitssatz ersetzt", correct: false, feedback: "Die Steuerprogression als Prinzip bleibt bestehen - höhere Einkommen zahlen prozentual mehr. Nur der Effekt der Zusammenrechnung würde wegfallen." },
      { text: "Bei der Individualbesteuerung zahlen alle Steuerpflichtigen denselben prozentualen Steuersatz", correct: false, feedback: "Auch bei der Individualbesteuerung bleibt die Progression erhalten. Je nach Höhe des individuellen Einkommens variiert der Steuersatz weiterhin." },
      { text: "Nur unverheiratete Personen profitieren von der Progression, Ehepaare werden davon ausgeschlossen", correct: false, feedback: "Die Progression gilt für alle Steuerpflichtigen. Der Unterschied liegt darin, ob bei Ehepaaren die Einkommen zusammengezählt werden oder nicht." }
    ]
  }
]

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Fragen UND deren Antworten mischen
function shuffleQuestionsWithAnswers(questions: QuizQuestion[]): QuizQuestion[] {
  return shuffleArray(questions).map(q => ({
    ...q,
    answers: shuffleArray(q.answers)
  }))
}

const QUESTION_COUNT = 10
const STORAGE_KEY = 'lernkontrolle_state'

export default function Lernkontrolle({ onComplete, onReset, initialCompleted, initialScore }: LernkontrolleProps) {
  // Wenn bereits abgeschlossen (von Firebase), localStorage ignorieren und neu starten bei Bedarf
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    // Wenn von Firebase als abgeschlossen markiert, localStorage löschen
    if (initialCompleted && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }

    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (state.questions) return state.questions
        } catch (e) {}
      }
    }
    return shuffleQuestionsWithAnswers(allQuestions).slice(0, QUESTION_COUNT)
  })

  const [currentSlide, setCurrentSlide] = useState(() => {
    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.currentSlide || 0
        } catch (e) {}
      }
    }
    return 0
  })

  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(() => {
    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (state.selectedAnswers) return state.selectedAnswers
        } catch (e) {}
      }
    }
    return new Array(QUESTION_COUNT).fill(null)
  })

  const [showAnswers, setShowAnswers] = useState<boolean[]>(() => {
    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (state.showAnswers) return state.showAnswers
        } catch (e) {}
      }
    }
    return new Array(QUESTION_COUNT).fill(false)
  })

  const [quizCompleted, setQuizCompleted] = useState(() => {
    // Wenn von Firebase als abgeschlossen, zeige abgeschlossenen Zustand
    if (initialCompleted) {
      return true
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.quizCompleted || false
        } catch (e) {}
      }
    }
    return false
  })

  // Spielstand in localStorage speichern
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        questions,
        currentSlide,
        selectedAnswers,
        showAnswers,
        quizCompleted
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [questions, currentSlide, selectedAnswers, showAnswers, quizCompleted])

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswers[currentSlide]) return

    const newAnswers = [...selectedAnswers]
    newAnswers[currentSlide] = answerIndex
    setSelectedAnswers(newAnswers)

    // Antwort zeigen
    const newShowAnswers = [...showAnswers]
    newShowAnswers[currentSlide] = true
    setShowAnswers(newShowAnswers)
  }

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const goToNextSlide = () => {
    if (currentSlide < questions.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else if (!quizCompleted) {
      // Quiz abschliessen
      const correctCount = selectedAnswers.filter((answer, index) =>
        answer !== null && questions[index].answers[answer].correct
      ).length
      const score = Math.round((correctCount / questions.length) * 100)
      setQuizCompleted(true)
      onComplete(score)
    }
  }

  const resetQuiz = () => {
    // localStorage löschen
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    // Neue zufällige Fragen mit gemischten Antworten
    const newQuestions = shuffleQuestionsWithAnswers(allQuestions).slice(0, QUESTION_COUNT)
    setQuestions(newQuestions)
    setCurrentSlide(0)
    setSelectedAnswers(new Array(QUESTION_COUNT).fill(null))
    setShowAnswers(new Array(QUESTION_COUNT).fill(false))
    setQuizCompleted(false)
    onReset?.()
  }

  const correctCount = selectedAnswers.filter((answer, index) =>
    answer !== null && questions[index].answers[answer].correct
  ).length

  const answeredCount = selectedAnswers.filter(a => a !== null).length

  const currentQuestion = questions[currentSlide]
  const selectedAnswer = selectedAnswers[currentSlide]
  const showAnswer = showAnswers[currentSlide]

  if (quizCompleted) {
    // Verwende initialScore von Firebase wenn vorhanden, sonst berechne aus Antworten
    const score = initialCompleted && initialScore !== undefined
      ? initialScore
      : Math.round((correctCount / questions.length) * 100)
    const displayCorrectCount = initialCompleted && initialScore !== undefined
      ? Math.round((initialScore / 100) * QUESTION_COUNT)
      : correctCount
    return (
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-4 sm:p-8 text-white text-center">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{score >= 80 ? "🎉" : score >= 50 ? "👍" : "📚"}</div>
        <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">Lernkontrolle abgeschlossen!</h2>
        <div className="bg-white/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 inline-block">
          <p className="text-sm sm:text-lg mb-2">Ihr Ergebnis:</p>
          <p className="text-3xl sm:text-5xl font-bold">{displayCorrectCount} / {QUESTION_COUNT}</p>
          <p className="text-teal-100 mt-2 text-sm sm:text-base">{score}% richtig</p>
        </div>
        <div className="space-y-2 mb-4 sm:mb-6">
          {score >= 80 && <p className="text-sm sm:text-lg">Hervorragend! Sie kennen sich sehr gut mit der Individualbesteuerung aus.</p>}
          {score >= 50 && score < 80 && <p className="text-sm sm:text-lg">Gut gemacht! Sie haben ein solides Grundwissen.</p>}
          {score < 50 && <p className="text-sm sm:text-lg">Schauen Sie sich die Lernmodule nochmals an, um Ihr Wissen zu vertiefen.</p>}
        </div>
        <button
          onClick={resetQuiz}
          className="flex items-center gap-2 mx-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors text-sm sm:text-base"
        >
          <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
          Nochmals versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-black/20 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-teal-100" />
          <span className="text-white font-semibold text-sm sm:text-base">Lernkontrolle</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-teal-100 text-xs sm:text-sm">
            {answeredCount}/{questions.length}
          </span>
          <span className="text-emerald-200 text-xs sm:text-sm font-semibold">
            {correctCount} ✓
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-black/20">
        <div
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-3 sm:p-6">
        <div className="bg-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-teal-100 text-xs sm:text-sm">Frage {currentSlide + 1} von {questions.length}</span>
            {showAnswer && (
              <span className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full ${
                selectedAnswer !== null && currentQuestion.answers[selectedAnswer].correct
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {selectedAnswer !== null && currentQuestion.answers[selectedAnswer].correct ? 'Richtig!' : 'Falsch'}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-xl text-white font-semibold leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Answer Options */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {currentQuestion.answers.map((answer: { text: string; correct: boolean; feedback: string }, index: number) => {
            const isSelected = selectedAnswer === index
            const isCorrect = answer.correct

            let bgColor = 'bg-white/10 hover:bg-white/20'
            let borderColor = 'border-transparent'

            if (showAnswer) {
              if (isCorrect) {
                bgColor = 'bg-green-500/30'
                borderColor = 'border-green-400'
              } else if (isSelected && !isCorrect) {
                bgColor = 'bg-red-500/30'
                borderColor = 'border-red-400'
              }
            } else if (isSelected) {
              bgColor = 'bg-yellow-500/30'
              borderColor = 'border-yellow-400'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showAnswer}
                className={`w-full ${bgColor} border-2 ${borderColor} text-white p-3 sm:p-4 rounded-xl text-left transition-all flex items-start gap-2 sm:gap-3`}
              >
                <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg font-bold text-xs sm:text-sm shrink-0">
                  {['A', 'B', 'C', 'D'][index]}
                </span>
                <span className="flex-1 text-sm sm:text-base">{answer.text}</span>
                {showAnswer && isCorrect && (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-300 shrink-0" />
                )}
                {showAnswer && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-300 shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {showAnswer && selectedAnswer !== null && (
          <div className={`rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 ${
            currentQuestion.answers[selectedAnswer].correct
              ? 'bg-green-500/20 border border-green-400/50'
              : 'bg-orange-500/20 border border-orange-400/50'
          }`}>
            <div className="flex items-start gap-2 sm:gap-3">
              {currentQuestion.answers[selectedAnswer].correct ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-300 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-300 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-white font-semibold mb-1 text-sm sm:text-base">
                  {currentQuestion.answers[selectedAnswer].correct ? 'Richtig!' : 'Leider falsch'}
                </p>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  {currentQuestion.answers[selectedAnswer].feedback}
                </p>
                {!currentQuestion.answers[selectedAnswer].correct && (
                  <p className="text-green-300 text-xs sm:text-sm mt-2 sm:mt-3">
                    <strong>Korrekte Antwort:</strong> {currentQuestion.answers.find((a: { text: string; correct: boolean; feedback: string }) => a.correct)?.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevSlide}
            disabled={currentSlide === 0}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-xs sm:text-base ${
              currentSlide === 0
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Zurück</span>
          </button>

          {/* Slide Indicators */}
          <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-center max-w-[140px] sm:max-w-none">
            {questions.map((_: QuizQuestion, index: number) => {
              const isAnswered = selectedAnswers[index] !== null
              const isCorrect = isAnswered && questions[index].answers[selectedAnswers[index]!].correct

              return (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-yellow-400 scale-125'
                      : isAnswered
                        ? isCorrect
                          ? 'bg-green-400'
                          : 'bg-red-400'
                        : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              )
            })}
          </div>

          <button
            onClick={goToNextSlide}
            disabled={!showAnswer}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-xs sm:text-base ${
              !showAnswer
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            <span className="hidden sm:inline">{currentSlide === questions.length - 1 ? 'Abschliessen' : 'Weiter'}</span>
            <span className="sm:hidden">{currentSlide === questions.length - 1 ? 'Ende' : 'Vor'}</span>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
