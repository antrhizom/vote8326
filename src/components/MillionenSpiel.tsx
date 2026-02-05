import { useState, useEffect } from 'react'
import { Trophy, HelpCircle, X, CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-react'

interface Question {
  question: string
  answers: {
    text: string
    correct: boolean
    feedback: string
  }[]
}

interface MillionenSpielProps {
  onComplete: (score: number) => void
  onReset?: () => void
}

const questions: Question[] = [
  // Stufe 1 (einfach)
  {
    question: "Was bezeichnet der Begriff Heiratsstrafe?",
    answers: [
      { text: "Die steuerliche Benachteiligung bestimmter verheirateter Paare gegenüber unverheirateten Paaren", correct: true, feedback: "Das ist richtig! Bei vielen Ehepaaren werden die Einkommen zusammengerechnet. Dadurch können sie in eine höhere Steuerprogression geraten und zahlen mehr als vergleichbare unverheiratete Paare mit getrennten Steuererklärungen." },
      { text: "Eine Strafabgabe bei Scheidungen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die Heiratsstrafe eine steuerliche Benachteiligung verheirateter Paare ist. Sie entsteht während der Ehe durch die gemeinsame Veranlagung und nicht erst bei einer Scheidung." },
      { text: "Eine freiwillige Zusatzsteuer", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die Heiratsstrafe eine systembedingte Mehrbelastung für gewisse Ehepaare ist. Sie ist keine freiwillige Zahlung, sondern ergibt sich aus Tarifen und Progression." },
      { text: "Eine kirchliche Abgabe", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die Heiratsstrafe im staatlichen Steuersystem entsteht. Sie betrifft die direkte Bundessteuer und nicht Kirchensteuern." }
    ]
  },
  // Stufe 2
  {
    question: "Wie werden Ehepaare heute bei der direkten Bundessteuer besteuert?",
    answers: [
      { text: "Mit einer gemeinsamen Steuererklärung, in der Einkommen und Vermögen zusammengezählt werden", correct: true, feedback: "Das ist richtig! Ehepaare reichen heute typischerweise eine gemeinsame Steuererklärung ein. Dadurch werden die wirtschaftlichen Verhältnisse als Einheit erfasst, was bei zwei Einkommen zu einer höheren Progression führen kann." },
      { text: "Mit zwei getrennten Steuererklärungen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Ehepaare heute gemeinsam veranlagt werden. Zwei getrennte Steuererklärungen wären ein Kernelement der Individualbesteuerung und sind gerade das, was sich ändern würde." },
      { text: "Nur das höhere Einkommen wird besteuert", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Einkommen und Vermögen beider Ehepartner zusammengezählt werden. Es zählt nicht nur das höhere Einkommen, sondern die Summe der beiden Einkommen." },
      { text: "Pauschal unabhängig vom Einkommen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Ehepaare gemeinsam veranlagt werden und die Steuer vom Einkommen abhängt. Das System ist einkommensabhängig und progressiv." }
    ]
  },
  // Stufe 3
  {
    question: "Wer hat das Referendum gegen die Individualbesteuerung ergriffen?",
    answers: [
      { text: "Zehn Kantone und ein überparteiliches Komitee", correct: true, feedback: "Das ist richtig! Mindestens acht Kantone können ein Kantonsreferendum auslösen. Da dieses Quorum erreicht wurde, kommt die Vorlage vors Volk." },
      { text: "Der Bundesrat", correct: false, feedback: "Das ist falsch! Korrekt ist, dass zehn Kantone und ein überparteiliches Komitee das Referendum ergriffen haben. Der Bundesrat steht hingegen hinter der Vorlage und empfiehlt sie zur Annahme." },
      { text: "Das Bundesgericht", correct: false, feedback: "Das ist falsch! Korrekt ist, dass zehn Kantone und ein überparteiliches Komitee das Referendum ergriffen haben. Das Bundesgericht ist keine politische Akteurin im Referendumsprozess, sondern beurteilt Rechtsfragen." },
      { text: "Ausschliesslich eine Partei", correct: false, feedback: "Das ist falsch! Korrekt ist, dass zehn Kantone und ein überparteiliches Komitee das Referendum ergriffen haben. Es handelt sich nicht um einen Schritt nur einer einzelnen Partei." }
    ]
  },
  // Stufe 4
  {
    question: "Was soll mit der Individualbesteuerung hauptsächlich erreicht werden?",
    answers: [
      { text: "Die steuerliche Gleichbehandlung unabhängig vom Zivilstand und damit die Abschaffung der Heiratsstrafe", correct: true, feedback: "Das ist richtig! Die Vorlage will verhindern, dass Paare wegen Heirat steuerlich besser oder schlechter gestellt werden. Entscheidend soll stärker das individuelle Einkommen sein und nicht der Zivilstand." },
      { text: "Die Abschaffung der Ehe als Institution", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die steuerliche Gleichbehandlung unabhängig vom Zivilstand erreicht werden soll. Am Zivilrecht und an der Ehe als Institution ändert die Vorlage nichts." },
      { text: "Die Abschaffung aller Steuerabzüge", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die steuerliche Gleichbehandlung unabhängig vom Zivilstand erreicht werden soll. Abzüge bleiben grundsätzlich möglich, einzelne Elemente wie der Kinderabzug werden sogar angepasst." },
      { text: "Die Abschaffung der Steuerprogression", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die steuerliche Gleichbehandlung unabhängig vom Zivilstand erreicht werden soll. Die Progression als Grundprinzip der Besteuerung bleibt bestehen." }
    ]
  },
  // Stufe 5
  {
    question: "Welche Ehepaare profitieren tendenziell eher von der Individualbesteuerung?",
    answers: [
      { text: "Doppelverdiener-Ehepaare mit ähnlich hohen Einkommen", correct: true, feedback: "Das ist richtig! Wenn zwei Einkommen ähnlich hoch sind, fällt der Effekt der gemeinsamen Progression weg. Dadurch sinkt die Steuerbelastung im Vergleich zum heutigen System häufig." },
      { text: "Einverdiener-Ehepaare", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Doppelverdiener-Ehepaare mit ähnlich hohen Einkommen tendenziell profitieren. Einverdiener-Ehepaare profitieren heute oft von der gemeinsamen Veranlagung und könnten nach der Umstellung eher stärker belastet werden." },
      { text: "Alle Familien mit Kindern", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Doppelverdiener-Ehepaare mit ähnlich hohen Einkommen tendenziell profitieren. Ob Familien mit Kindern profitieren, hängt stark von Einkommen, Aufteilung und Abzügen ab." },
      { text: "Nur unverheiratete Paare", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Doppelverdiener-Ehepaare mit ähnlich hohen Einkommen tendenziell profitieren. Unverheiratete Paare werden heute bereits getrennt besteuert, für sie ist der Systemwechsel weniger grundlegend." }
    ]
  },
  // Stufe 6
  {
    question: "Warum wird der Kinderabzug erhöht?",
    answers: [
      { text: "Um Familien zu entlasten und mögliche Mehrbelastungen bei gewissen Konstellationen abzufedern", correct: true, feedback: "Das ist richtig! Wenn bestimmte Haushalte durch die Umstellung mehr zahlen würden, soll der höhere Kinderabzug die Belastung reduzieren. Dadurch wird versucht, die Vorlage ausgewogener zu gestalten." },
      { text: "Um die Steuereinnahmen zu erhöhen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Kinderabzug erhöht wird, um Familien zu entlasten. Ein höherer Abzug senkt die Steuerlast und führt nicht zu höheren Einnahmen." },
      { text: "Um Kantone zu bestrafen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Kinderabzug erhöht wird, um Familien zu entlasten. Es geht um soziale Ausgleichsmassnahmen, nicht um Sanktionen gegenüber Kantonen." },
      { text: "Um Heiraten attraktiver zu machen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Kinderabzug erhöht wird, um Familien zu entlasten. Die Reform will gerade zivilstandsneutral sein und nicht Heirat steuerlich besonders fördern." }
    ]
  },
  // Stufe 7
  {
    question: "Welches zentrale Argument bringen Gegner der Individualbesteuerung vor?",
    answers: [
      { text: "Der administrative Aufwand für Bevölkerung und Steuerbehörden steige stark an", correct: true, feedback: "Das ist richtig! Wenn auch Ehepaare zwei Steuererklärungen einreichen, müssen deutlich mehr Dossiers bearbeitet werden. Gegner erwarten dadurch höhere Verwaltungskosten und mehr Bürokratie." },
      { text: "Die Ehe werde verboten", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Gegner vor allem den stark steigenden administrativen Aufwand kritisieren. Die Ehe bleibt rechtlich unangetastet, es geht um die Art der Besteuerung." },
      { text: "Steuern würden abgeschafft", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Gegner vor allem den stark steigenden administrativen Aufwand kritisieren. Steuern bleiben bestehen, nur die Veranlagungslogik ändert." },
      { text: "Das Referendum sei ungültig", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Gegner vor allem den stark steigenden administrativen Aufwand kritisieren. Das Referendum ist formell zustande gekommen, sonst gäbe es keine Abstimmung." }
    ]
  },
  // Stufe 8
  {
    question: "Warum erwarten Befürworter mehr Erwerbsanreize durch Individualbesteuerung?",
    answers: [
      { text: "Weil der Zweitverdienst weniger stark durch die Progression des gemeinsamen Einkommens belastet wird", correct: true, feedback: "Das ist richtig! Wenn Einkommen getrennt besteuert werden, fällt ein Teil des Progressionseffekts weg. Dadurch lohnt sich eine Pensumerhöhung für den tiefer verdienenden Partner tendenziell stärker." },
      { text: "Weil weniger gearbeitet werden muss", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Zweitverdienst weniger stark belastet wird und dadurch Mehrarbeit attraktiver wird. Es geht um Anreize, nicht darum, dass weniger gearbeitet werden soll." },
      { text: "Weil Unternehmen weniger Steuern zahlen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Zweitverdienst weniger stark belastet wird. Die Vorlage betrifft natürliche Personen, nicht die Besteuerung von Unternehmen." },
      { text: "Weil alle gleich viel verdienen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Zweitverdienst weniger stark belastet wird. Einkommensunterschiede bleiben bestehen, geändert wird die steuerliche Behandlung." }
    ]
  },
  // Stufe 9
  {
    question: "Welche Ebene ist direkt Gegenstand der Abstimmung?",
    answers: [
      { text: "Die direkte Bundessteuer und deren Regeln zur Veranlagung", correct: true, feedback: "Das ist richtig! Die Vorlage ist ein Bundesgesetz und betrifft unmittelbar die Bundessteuer. Auswirkungen auf Kantone hängen davon ab, wie sie ihre Systeme anpassen und umsetzen." },
      { text: "Nur die Gemeindesteuern", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die direkte Bundessteuer Gegenstand der Abstimmung ist. Gemeindesteuern wären höchstens indirekt betroffen, weil Kantone und Gemeinden eigene Regeln haben." },
      { text: "Die AHV-Beiträge", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die direkte Bundessteuer Gegenstand der Abstimmung ist. Sozialversicherungen wie die AHV gehören nicht zu dieser Steuervorlage." },
      { text: "Die Kirchensteuer", correct: false, feedback: "Das ist falsch! Korrekt ist, dass die direkte Bundessteuer Gegenstand der Abstimmung ist. Kirchensteuern sind kantonal geregelt und nicht Teil des Bundesgesetzes." }
    ]
  },
  // Stufe 10
  {
    question: "Warum wurde die Abstimmung zur Heiratsstrafe von 2016 aufgehoben?",
    answers: [
      { text: "Wegen schwerwiegender Fehlinformation der Stimmberechtigten und einer Annullierung durch das Bundesgericht im April 2019", correct: true, feedback: "Das ist richtig! Vor der Abstimmung vom Februar 2016 wurden falsche Angaben zur Anzahl betroffener Ehepaare verbreitet. Das Bundesgericht beurteilte dies als Verletzung der Abstimmungsfreiheit und hob die Volksabstimmung im April 2019 auf, was in der Schweiz ein historischer Schritt war." },
      { text: "Wegen zu tiefer Stimmbeteiligung", correct: false, feedback: "Das ist falsch! Korrekt ist, dass das Bundesgericht im April 2019 die Abstimmung wegen Fehlinformation aufgehoben hat. Es ging nicht um die Beteiligung, sondern um falsche Informationen, die die freie Meinungsbildung beeinträchtigten." },
      { text: "Wegen technischer Probleme beim Auszählen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass das Bundesgericht im April 2019 die Abstimmung wegen Fehlinformation aufgehoben hat. Das Problem lag nicht beim Auszählen, sondern bei inhaltlich falschen Angaben im Abstimmungskampf." },
      { text: "Weil Parteien verboten wurden", correct: false, feedback: "Das ist falsch! Korrekt ist, dass das Bundesgericht im April 2019 die Abstimmung wegen Fehlinformation aufgehoben hat. Parteien waren nicht verboten, entscheidend war die Verletzung der Abstimmungsfreiheit." }
    ]
  },
  // Stufe 11
  {
    question: "Was bedeutet Zivilstandsneutralität im Steuersystem?",
    answers: [
      { text: "Der Zivilstand soll die Steuerbelastung nicht beeinflussen", correct: true, feedback: "Das ist richtig! Ob jemand verheiratet ist, im Konkubinat lebt oder allein ist, soll nicht darüber entscheiden, ob mehr oder weniger Steuern bezahlt werden. Massgeblich soll stärker die individuelle wirtschaftliche Leistungsfähigkeit sein." },
      { text: "Verheiratete zahlen immer weniger", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Zivilstand die Steuerbelastung nicht beeinflussen soll. Es geht nicht um eine generelle Bevorzugung von Verheirateten, sondern um gleiche Regeln für alle." },
      { text: "Unverheiratete zahlen mehr", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Zivilstand die Steuerbelastung nicht beeinflussen soll. Auch unverheiratete Personen sollen nicht schlechter gestellt werden." },
      { text: "Nur Familien profitieren", correct: false, feedback: "Das ist falsch! Korrekt ist, dass der Zivilstand die Steuerbelastung nicht beeinflussen soll. Das Prinzip gilt für alle Steuerpflichtigen, nicht nur für Familien." }
    ]
  },
  // Stufe 12
  {
    question: "Warum kritisieren Kantone die Individualbesteuerung häufig?",
    answers: [
      { text: "Weil sie mehr administrative Arbeit und höhere Kosten bei der Veranlagung erwarten", correct: true, feedback: "Das ist richtig! Kantone führen die Veranlagung praktisch durch und müssten Prozesse, IT und Personal anpassen. Zudem steigt die Zahl der zu bearbeitenden Steuerfälle, wenn Ehepaare getrennt veranlagt werden." },
      { text: "Weil sie ihre Steuerhoheit verlieren", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Kantone vor allem den administrativen Mehraufwand kritisieren. Ihre Steuerhoheit bleibt bestehen, sie müssen jedoch die Umsetzung organisatorisch bewältigen." },
      { text: "Weil die Mehrwertsteuer sinkt", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Kantone vor allem den administrativen Mehraufwand kritisieren. Die Mehrwertsteuer ist nicht Teil der Vorlage." },
      { text: "Weil sie nicht mitbestimmen dürfen", correct: false, feedback: "Das ist falsch! Korrekt ist, dass Kantone vor allem den administrativen Mehraufwand kritisieren. Tatsächlich haben Kantone aktiv mitbestimmt, indem sie das Referendum ergriffen haben." }
    ]
  },
  // Stufe 13
  {
    question: "Welche Rolle spielte das Bundesgericht in der Debatte um die Heiratsstrafe?",
    answers: [
      { text: "Es stellte 2019 eine Verletzung der Abstimmungsfreiheit fest und annullierte die Volksabstimmung von 2016", correct: true, feedback: "Das ist richtig! Das Gericht hielt fest, dass die Stimmberechtigten wegen falscher Informationen nicht frei entscheiden konnten. Darum wurde die Abstimmung aufgehoben, ein aussergewöhnlicher Eingriff in den demokratischen Prozess." },
      { text: "Es empfahl ein Ja zur Individualbesteuerung", correct: false, feedback: "Das ist falsch! Korrekt ist, dass das Bundesgericht 2019 die Abstimmung von 2016 annullierte. Gerichte geben keine Abstimmungsempfehlungen, sie prüfen die Einhaltung von Grundrechten und Verfahren." },
      { text: "Es schrieb das Steuergesetz zur Individualbesteuerung", correct: false, feedback: "Das ist falsch! Korrekt ist, dass das Bundesgericht 2019 die Abstimmung von 2016 annullierte. Gesetze werden von Parlament und Bundesrat erarbeitet, nicht vom Gericht geschrieben." },
      { text: "Es ergriff das Referendum", correct: false, feedback: "Das ist falsch! Korrekt ist, dass das Bundesgericht 2019 die Abstimmung von 2016 annullierte. Referenden werden von Stimmberechtigten oder Kantonen ergriffen, nicht von Gerichten." }
    ]
  },
  // Stufe 14
  {
    question: "Warum ist die Abstimmung zur Individualbesteuerung politisch besonders bedeutsam?",
    answers: [
      { text: "Weil sie einen grundlegenden Systemwechsel im Steuersystem darstellt", correct: true, feedback: "Das ist richtig! Erstmals würde bei der direkten Bundessteuer konsequent auf individuelle Besteuerung umgestellt. Das kann Gewinner und Verlierer je nach Einkommensaufteilung erzeugen und hat Folgen für Steuergerechtigkeit, Verwaltung und Erwerbsanreize." },
      { text: "Weil nur Ehepaare betroffen sind", correct: false, feedback: "Das ist falsch! Korrekt ist, dass es ein grundlegender Systemwechsel ist. Betroffen sind nicht nur Ehepaare, sondern das gesamte System der Veranlagung und damit viele Steuerpflichtige, auch weil Tarife und Abzüge angepasst werden." },
      { text: "Weil sie rein symbolisch ist", correct: false, feedback: "Das ist falsch! Korrekt ist, dass es ein grundlegender Systemwechsel ist. Die Folgen wären konkret, etwa bei der Anzahl Steuererklärungen, bei der Steuerbelastung je nach Haushaltsmodell und beim Verwaltungsaufwand." },
      { text: "Weil sie das letzte Referendum der Schweiz ist", correct: false, feedback: "Das ist falsch! Korrekt ist, dass es ein grundlegender Systemwechsel ist. Die direkte Demokratie bleibt bestehen, Referenden und Abstimmungen werden weiterhin möglich sein." }
    ]
  },
  // Stufe 15 (schwierigste)
  {
    question: "Was ist der Hauptunterschied zwischen dem heutigen System und der Individualbesteuerung bezüglich der Steuerprogression?",
    answers: [
      { text: "Im heutigen System werden Einkommen zusammengezählt, was zu höherer Progression führen kann; bei Individualbesteuerung wird jede Person separat besteuert", correct: true, feedback: "Das ist richtig! Bei der gemeinsamen Veranlagung steigt durch die Zusammenrechnung der Einkommen oft der Steuersatz. Bei der Individualbesteuerung würde jeder Partner nur auf sein eigenes Einkommen besteuert, was den Progressionseffekt bei Doppelverdienern reduziert." },
      { text: "Die Progression wird komplett abgeschafft", correct: false, feedback: "Das ist falsch! Die Steuerprogression als Prinzip bleibt bestehen - höhere Einkommen zahlen prozentual mehr. Nur der Effekt der Zusammenrechnung von Ehegatten-Einkommen würde wegfallen." },
      { text: "Alle zahlen denselben Steuersatz", correct: false, feedback: "Das ist falsch! Auch bei der Individualbesteuerung bleibt die Progression erhalten. Je nach Höhe des individuellen Einkommens variiert der Steuersatz weiterhin." },
      { text: "Nur Unverheiratete profitieren von der Progression", correct: false, feedback: "Das ist falsch! Die Progression gilt für alle Steuerpflichtigen. Der Unterschied liegt darin, ob bei Ehepaaren die Einkommen zusammengezählt werden oder nicht." }
    ]
  }
]

// Gewinnstufen (klassisches Millionenspiel-Format)
const prizeLevels = [
  { level: 1, prize: "CHF 50", safe: false },
  { level: 2, prize: "CHF 100", safe: false },
  { level: 3, prize: "CHF 200", safe: false },
  { level: 4, prize: "CHF 300", safe: false },
  { level: 5, prize: "CHF 500", safe: true },
  { level: 6, prize: "CHF 1'000", safe: false },
  { level: 7, prize: "CHF 2'000", safe: false },
  { level: 8, prize: "CHF 4'000", safe: false },
  { level: 9, prize: "CHF 8'000", safe: false },
  { level: 10, prize: "CHF 16'000", safe: true },
  { level: 11, prize: "CHF 32'000", safe: false },
  { level: 12, prize: "CHF 64'000", safe: false },
  { level: 13, prize: "CHF 125'000", safe: false },
  { level: 14, prize: "CHF 500'000", safe: false },
  { level: 15, prize: "CHF 1 Million", safe: true }
]

export default function MillionenSpiel({ onComplete, onReset }: MillionenSpielProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [finalPrize, setFinalPrize] = useState("")

  // Joker States - ab Stufe 3 verfügbar
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false)
  const [audienceUsed, setAudienceUsed] = useState(false)
  const [eliminatedAnswers, setEliminatedAnswers] = useState<number[]>([])
  const [audienceResult, setAudienceResult] = useState<number[] | null>(null)

  // Shuffled answers für aktuelle Frage
  const [shuffledAnswers, setShuffledAnswers] = useState<{text: string, correct: boolean, feedback: string, originalIndex: number}[]>([])

  // Antworten mischen wenn Frage wechselt
  useEffect(() => {
    const answers = questions[currentQuestion].answers.map((a, i) => ({ ...a, originalIndex: i }))
    // Fisher-Yates Shuffle
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]]
    }
    setShuffledAnswers(answers)
    setEliminatedAnswers([])
    setAudienceResult(null)
  }, [currentQuestion])

  const canUseJoker = currentQuestion >= 2 // Ab Stufe 3 (Index 2)

  const use5050Joker = () => {
    if (fiftyFiftyUsed || !canUseJoker) return

    // Finde korrekte Antwort und eine zufällige falsche
    const correctIndex = shuffledAnswers.findIndex(a => a.correct)
    const wrongIndices = shuffledAnswers.map((a, i) => i).filter(i => !shuffledAnswers[i].correct)

    // Wähle zufällig eine falsche Antwort die bleiben darf
    const keepWrongIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)]

    // Eliminiere die anderen beiden falschen
    const toEliminate = wrongIndices.filter(i => i !== keepWrongIndex)
    setEliminatedAnswers(toEliminate)
    setFiftyFiftyUsed(true)
  }

  const useAudienceJoker = () => {
    if (audienceUsed || !canUseJoker) return

    // Simuliere Publikumsjoker - korrekte Antwort hat höhere Wahrscheinlichkeit
    const correctIndex = shuffledAnswers.findIndex(a => a.correct)
    const percentages: number[] = [0, 0, 0, 0]

    // Korrekte Antwort bekommt 50-75%
    percentages[correctIndex] = 50 + Math.floor(Math.random() * 25)

    // Rest verteilen
    const remaining = 100 - percentages[correctIndex]
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex)

    let left = remaining
    wrongIndices.forEach((i, idx) => {
      if (idx === wrongIndices.length - 1) {
        percentages[i] = left
      } else {
        const share = Math.floor(Math.random() * (left / 2))
        percentages[i] = share
        left -= share
      }
    })

    setAudienceResult(percentages)
    setAudienceUsed(true)
  }

  const handleAnswerSelect = (index: number) => {
    if (showResult || eliminatedAnswers.includes(index)) return
    setSelectedAnswer(index)
  }

  const confirmAnswer = () => {
    if (selectedAnswer === null) return
    setShowResult(true)

    const isCorrect = shuffledAnswers[selectedAnswer].correct

    setTimeout(() => {
      if (isCorrect) {
        if (currentQuestion === questions.length - 1) {
          // Gewonnen!
          setGameWon(true)
          setGameOver(true)
          setFinalPrize(prizeLevels[currentQuestion].prize)
          onComplete(100)
        } else {
          // Nächste Frage
          setCurrentQuestion(prev => prev + 1)
          setSelectedAnswer(null)
          setShowResult(false)
        }
      } else {
        // Verloren - finde Sicherheitsstufe
        let safePrize = "CHF 0"
        for (let i = currentQuestion - 1; i >= 0; i--) {
          if (prizeLevels[i].safe) {
            safePrize = prizeLevels[i].prize
            break
          }
        }
        setFinalPrize(safePrize)
        setGameOver(true)

        // Score basierend auf erreichter Stufe
        const score = Math.round((currentQuestion / questions.length) * 100)
        onComplete(score)
      }
    }, 2500)
  }

  const resetGame = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setGameOver(false)
    setGameWon(false)
    setFinalPrize("")
    setFiftyFiftyUsed(false)
    setAudienceUsed(false)
    setEliminatedAnswers([])
    setAudienceResult(null)
    onReset?.()
  }

  if (gameOver) {
    return (
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl p-8 text-white text-center">
        <div className="text-6xl mb-4">{gameWon ? "🎉" : "😔"}</div>
        <h2 className="text-3xl font-bold mb-4">
          {gameWon ? "Herzlichen Glückwunsch!" : "Leider verloren!"}
        </h2>
        <p className="text-xl mb-2">
          {gameWon
            ? "Sie haben alle 15 Fragen richtig beantwortet!"
            : `Sie haben bei Frage ${currentQuestion + 1} eine falsche Antwort gegeben.`
          }
        </p>
        <div className="bg-white/20 rounded-xl p-6 my-6 inline-block">
          <p className="text-sm text-purple-200">Ihr Gewinn:</p>
          <p className="text-4xl font-bold text-yellow-300">{finalPrize}</p>
        </div>

        {!gameWon && showResult && (
          <div className="bg-red-500/30 rounded-lg p-4 mb-6 text-left max-w-xl mx-auto">
            <p className="font-semibold mb-2">Richtige Antwort:</p>
            <p className="text-sm">{shuffledAnswers.find(a => a.correct)?.text}</p>
            <p className="text-xs mt-2 text-red-200">{shuffledAnswers[selectedAnswer!]?.feedback}</p>
          </div>
        )}

        <button
          onClick={resetGame}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
          Nochmals spielen
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl overflow-hidden">
      {/* Header mit Gewinnstufen */}
      <div className="flex">
        {/* Hauptbereich */}
        <div className="flex-1 p-6">
          {/* Frage */}
          <div className="bg-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-purple-300 text-sm">Frage {currentQuestion + 1} von {questions.length}</span>
              <span className="text-yellow-300 font-bold">{prizeLevels[currentQuestion].prize}</span>
            </div>
            <h3 className="text-xl text-white font-semibold leading-relaxed">
              {questions[currentQuestion].question}
            </h3>
          </div>

          {/* Joker */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={use5050Joker}
              disabled={fiftyFiftyUsed || !canUseJoker}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                fiftyFiftyUsed
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : !canUseJoker
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
              title={!canUseJoker ? "Joker ab Stufe 3 verfügbar" : "50:50 Joker"}
            >
              <span className="text-lg">50:50</span>
              {fiftyFiftyUsed && <X className="h-4 w-4" />}
            </button>
            <button
              onClick={useAudienceJoker}
              disabled={audienceUsed || !canUseJoker}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                audienceUsed
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : !canUseJoker
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              title={!canUseJoker ? "Joker ab Stufe 3 verfügbar" : "Publikumsjoker"}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Publikum</span>
              {audienceUsed && <X className="h-4 w-4" />}
            </button>
            {!canUseJoker && (
              <span className="text-xs text-purple-300 self-center ml-2">
                Joker ab Stufe 3 verfügbar
              </span>
            )}
          </div>

          {/* Publikumsjoker Ergebnis */}
          {audienceResult && (
            <div className="bg-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-blue-200 text-sm mb-3">Publikumsergebnis:</p>
              <div className="grid grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={letter} className="flex items-center gap-2">
                    <span className="text-white font-bold w-6">{letter}:</span>
                    <div className="flex-1 bg-white/20 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-400 h-full transition-all duration-500"
                        style={{ width: `${audienceResult[i]}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-12">{audienceResult[i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Antworten */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {shuffledAnswers.map((answer, index) => {
              const letter = ['A', 'B', 'C', 'D'][index]
              const isSelected = selectedAnswer === index
              const isEliminated = eliminatedAnswers.includes(index)
              const isCorrect = answer.correct

              let bgColor = 'bg-white/10 hover:bg-white/20'
              if (isEliminated) bgColor = 'bg-gray-800/50 opacity-30 cursor-not-allowed'
              else if (showResult && isSelected && isCorrect) bgColor = 'bg-green-500'
              else if (showResult && isSelected && !isCorrect) bgColor = 'bg-red-500'
              else if (showResult && isCorrect) bgColor = 'bg-green-500/50'
              else if (isSelected) bgColor = 'bg-yellow-500'

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult || isEliminated}
                  className={`${bgColor} text-white p-4 rounded-xl text-left transition-all flex items-start gap-3`}
                >
                  <span className="bg-white/20 px-3 py-1 rounded-lg font-bold text-sm shrink-0">
                    {letter}
                  </span>
                  <span className="text-sm leading-relaxed">
                    {!isEliminated ? answer.text : ''}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Feedback bei Antwort */}
          {showResult && selectedAnswer !== null && (
            <div className={`rounded-lg p-4 mb-6 ${
              shuffledAnswers[selectedAnswer].correct ? 'bg-green-500/30' : 'bg-red-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {shuffledAnswers[selectedAnswer].correct
                  ? <CheckCircle className="h-6 w-6 text-green-300 shrink-0" />
                  : <XCircle className="h-6 w-6 text-red-300 shrink-0" />
                }
                <p className="text-white text-sm">{shuffledAnswers[selectedAnswer].feedback}</p>
              </div>
            </div>
          )}

          {/* Bestätigen Button */}
          {selectedAnswer !== null && !showResult && (
            <button
              onClick={confirmAnswer}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Antwort bestätigen
            </button>
          )}
        </div>

        {/* Gewinnstufen Sidebar */}
        <div className="w-48 bg-black/30 p-4">
          <div className="space-y-1">
            {[...prizeLevels].reverse().map((level) => {
              const isCurrentLevel = level.level === currentQuestion + 1
              const isPassed = level.level < currentQuestion + 1

              return (
                <div
                  key={level.level}
                  className={`flex items-center justify-between px-3 py-1.5 rounded text-xs ${
                    isCurrentLevel
                      ? 'bg-yellow-500 text-black font-bold'
                      : isPassed
                        ? 'bg-green-500/30 text-green-300'
                        : level.safe
                          ? 'text-yellow-300'
                          : 'text-white/60'
                  }`}
                >
                  <span>{level.level}</span>
                  <span className={level.safe ? 'font-semibold' : ''}>{level.prize}</span>
                  {level.safe && !isCurrentLevel && (
                    <Trophy className="h-3 w-3 text-yellow-400" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
