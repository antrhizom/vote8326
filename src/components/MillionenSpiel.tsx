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

// Fragen basierend auf LearningApps Steuern-Quiz (andere als Lernkontrolle)
const questions: Question[] = [
  // Stufe 1 (einfach)
  {
    question: "Was ist die Steuerprogression?",
    answers: [
      { text: "Je höher das Einkommen, desto höher der Steuersatz", correct: true, feedback: "Richtig! Bei der Steuerprogression steigt der Steuersatz mit zunehmendem Einkommen. Wer mehr verdient, zahlt prozentual mehr Steuern." },
      { text: "Alle zahlen den gleichen Steuersatz", correct: false, feedback: "Das wäre ein Flat-Tax-System. Bei der Progression steigt der Steuersatz mit dem Einkommen." },
      { text: "Je höher das Einkommen, desto tiefer der Steuersatz", correct: false, feedback: "Das wäre eine degressive Besteuerung. Bei der Progression ist es umgekehrt: höheres Einkommen = höherer Steuersatz." },
      { text: "Steuern werden nur auf Vermögen erhoben", correct: false, feedback: "Die Progression bezieht sich auf die Einkommenssteuer, nicht nur auf Vermögenssteuern." }
    ]
  },
  // Stufe 2
  {
    question: "Was ist eine direkte Steuer?",
    answers: [
      { text: "Eine Steuer, die direkt vom Steuerpflichtigen erhoben wird (z.B. Einkommenssteuer)", correct: true, feedback: "Richtig! Direkte Steuern werden direkt beim Steuerpflichtigen erhoben, wie die Einkommens- oder Vermögenssteuer." },
      { text: "Eine Steuer auf Konsumgüter", correct: false, feedback: "Das wäre eine indirekte Steuer wie die Mehrwertsteuer. Direkte Steuern werden direkt beim Steuerpflichtigen erhoben." },
      { text: "Eine freiwillige Abgabe", correct: false, feedback: "Steuern sind grundsätzlich nicht freiwillig. Direkte Steuern werden direkt vom Steuerpflichtigen erhoben." },
      { text: "Eine Steuer nur für Unternehmen", correct: false, feedback: "Auch natürliche Personen zahlen direkte Steuern wie die Einkommenssteuer." }
    ]
  },
  // Stufe 3
  {
    question: "Was versteht man unter dem Heiratsbonus?",
    answers: [
      { text: "Die steuerliche Begünstigung gewisser Ehepaare gegenüber Konkubinatspaaren", correct: true, feedback: "Richtig! Der Heiratsbonus ist das Gegenteil der Heiratsstrafe - bestimmte Ehepaare (oft Einverdiener) zahlen weniger Steuern als vergleichbare unverheiratete Paare." },
      { text: "Ein Geschenk zur Hochzeit vom Staat", correct: false, feedback: "Der Heiratsbonus ist kein Geschenk, sondern eine steuerliche Begünstigung durch das Veranlagungssystem." },
      { text: "Eine Zusatzsteuer bei Heirat", correct: false, feedback: "Das wäre die Heiratsstrafe. Der Heiratsbonus ist das Gegenteil - eine Begünstigung." },
      { text: "Ein Rabatt auf die Hochzeitsfeier", correct: false, feedback: "Der Heiratsbonus bezieht sich auf Steuervorteile, nicht auf Hochzeitskosten." }
    ]
  },
  // Stufe 4
  {
    question: "Was ist das Ziel von Lenkungsabgaben?",
    answers: [
      { text: "Verhalten der Bevölkerung in eine gewünschte Richtung zu lenken", correct: true, feedback: "Richtig! Lenkungsabgaben wie die CO2-Abgabe sollen umweltschädliches Verhalten verteuern und so Anreize für klimafreundlichere Alternativen schaffen." },
      { text: "Möglichst hohe Staatseinnahmen zu generieren", correct: false, feedback: "Bei Lenkungsabgaben steht die Verhaltenssteuerung im Vordergrund, nicht die Einnahmenmaximierung. Oft werden die Einnahmen rückverteilt." },
      { text: "Alle Bürger gleich zu belasten", correct: false, feedback: "Lenkungsabgaben belasten bewusst bestimmte Verhaltensweisen stärker, um diese zu reduzieren." },
      { text: "Die Wirtschaft zu bremsen", correct: false, feedback: "Ziel ist die Verhaltensänderung, nicht die Wirtschaftsbremsung. Es geht um Anreize für nachhaltigeres Verhalten." }
    ]
  },
  // Stufe 5
  {
    question: "Was bedeutet horizontale Steuergerechtigkeit?",
    answers: [
      { text: "Personen in gleicher wirtschaftlicher Lage sollen gleich besteuert werden", correct: true, feedback: "Richtig! Horizontale Gerechtigkeit bedeutet Gleichbehandlung von Personen mit gleicher wirtschaftlicher Leistungsfähigkeit - unabhängig von Zivilstand oder anderen Faktoren." },
      { text: "Reiche sollen mehr Steuern zahlen als Arme", correct: false, feedback: "Das beschreibt die vertikale Steuergerechtigkeit. Horizontale Gerechtigkeit betrifft die Gleichbehandlung bei gleicher Leistungsfähigkeit." },
      { text: "Alle Kantone erheben die gleichen Steuern", correct: false, feedback: "Das betrifft den Steuerwettbewerb, nicht die horizontale Gerechtigkeit innerhalb eines Steuersystems." },
      { text: "Steuern werden nur auf waagrechten Flächen erhoben", correct: false, feedback: "Horizontal bezieht sich hier auf die Gleichbehandlung von Personen auf gleicher wirtschaftlicher Ebene." }
    ]
  },
  // Stufe 6
  {
    question: "Welches Argument spricht für die Individualbesteuerung aus gleichstellungspolitischer Sicht?",
    answers: [
      { text: "Sie setzt Anreize für die Erwerbstätigkeit beider Partner", correct: true, feedback: "Richtig! Da der Zweitverdienst nicht mehr zum Einkommen des Partners addiert wird, lohnt sich Erwerbsarbeit für beide Partner stärker - das fördert die wirtschaftliche Unabhängigkeit." },
      { text: "Sie bevorzugt traditionelle Familienmodelle", correct: false, feedback: "Im Gegenteil: Die Individualbesteuerung fördert eher die Erwerbstätigkeit beider Partner und ist damit zivilstandsneutral." },
      { text: "Sie senkt die Steuern für alle", correct: false, feedback: "Die Individualbesteuerung verteilt die Steuerlast um. Manche zahlen mehr, manche weniger." },
      { text: "Sie macht Heiraten attraktiver", correct: false, feedback: "Ziel ist die Zivilstandsneutralität - weder Heirat noch Konkubinat soll steuerlich bevorzugt werden." }
    ]
  },
  // Stufe 7
  {
    question: "Was ist ein Kantonsreferendum?",
    answers: [
      { text: "Mindestens 8 Kantone können eine Volksabstimmung über ein Bundesgesetz verlangen", correct: true, feedback: "Richtig! Das Kantonsreferendum ermöglicht es 8 oder mehr Kantonen, eine Volksabstimmung über ein vom Parlament beschlossenes Gesetz zu erzwingen. Dies geschah bei der Individualbesteuerung." },
      { text: "Eine Abstimmung nur innerhalb eines Kantons", correct: false, feedback: "Das wäre ein kantonales Referendum. Das Kantonsreferendum betrifft Bundesgesetze und erfordert 8 Kantone." },
      { text: "Der Bundesrat kann Kantone zur Abstimmung zwingen", correct: false, feedback: "Das Kantonsreferendum geht von den Kantonen aus, nicht vom Bundesrat." },
      { text: "Alle Kantone müssen zustimmen", correct: false, feedback: "Es braucht nur 8 von 26 Kantonen für ein Kantonsreferendum, nicht alle." }
    ]
  },
  // Stufe 8
  {
    question: "Was bedeutet vertikale Steuergerechtigkeit?",
    answers: [
      { text: "Personen mit höherer wirtschaftlicher Leistungsfähigkeit sollen mehr Steuern zahlen", correct: true, feedback: "Richtig! Vertikale Gerechtigkeit bedeutet, dass die Steuerlast entsprechend der wirtschaftlichen Leistungsfähigkeit verteilt wird - wer mehr hat, trägt mehr bei." },
      { text: "Alle zahlen den gleichen Betrag", correct: false, feedback: "Das wäre eine Kopfsteuer. Vertikale Gerechtigkeit bedeutet höhere Belastung bei höherer Leistungsfähigkeit." },
      { text: "Steuern werden nur von oben nach unten verteilt", correct: false, feedback: "Vertikal bezieht sich hier auf die unterschiedliche Belastung je nach wirtschaftlicher Stellung." },
      { text: "Nur Hochhäuser werden besteuert", correct: false, feedback: "Vertikal bezieht sich auf die Einkommens-/Vermögenshierarchie, nicht auf Gebäudehöhe." }
    ]
  },
  // Stufe 9 (schwierigste)
  {
    question: "Warum ist die Abstimmung von 2016 zur Heiratsstrafe historisch bedeutsam?",
    answers: [
      { text: "Es war die erste Volksabstimmung in der Schweiz, die vom Bundesgericht annulliert wurde", correct: true, feedback: "Richtig! Im April 2019 annullierte das Bundesgericht erstmals in der Geschichte eine eidgenössische Volksabstimmung wegen Verletzung der Abstimmungsfreiheit durch Fehlinformationen - ein historischer Präzedenzfall." },
      { text: "Es war die erste Abstimmung über Steuern", correct: false, feedback: "Über Steuern wurde in der Schweiz schon oft abgestimmt. Historisch bedeutsam ist die erstmalige Annullierung einer Volksabstimmung." },
      { text: "Es war die letzte Abstimmung vor einer Verfassungsänderung", correct: false, feedback: "Die historische Bedeutung liegt in der erstmaligen Annullierung durch das Bundesgericht, nicht in einer Verfassungsänderung." },
      { text: "Alle Kantone stimmten gleich ab", correct: false, feedback: "Die historische Bedeutung liegt in der Annullierung wegen Fehlinformation, nicht im Abstimmungsverhalten der Kantone." }
    ]
  }
]

// Gewinnstufen für 9 Fragen
const prizeLevels = [
  { level: 1, prize: "CHF 100", safe: false },
  { level: 2, prize: "CHF 200", safe: false },
  { level: 3, prize: "CHF 500", safe: true },
  { level: 4, prize: "CHF 1'000", safe: false },
  { level: 5, prize: "CHF 2'000", safe: false },
  { level: 6, prize: "CHF 5'000", safe: true },
  { level: 7, prize: "CHF 10'000", safe: false },
  { level: 8, prize: "CHF 25'000", safe: false },
  { level: 9, prize: "CHF 50'000", safe: true }
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
            ? "Sie haben alle 9 Fragen richtig beantwortet!"
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
