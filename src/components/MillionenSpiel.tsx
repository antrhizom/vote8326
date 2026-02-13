import { useState, useEffect } from 'react'
import { Trophy, HelpCircle, X, CheckCircle, XCircle, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

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
  initialCompleted?: boolean
  initialScore?: number
}

// Fragen aus LearningApps - 7 Stufen mit je 2 Fragen pro Stufe
const questionsByLevel: Question[][] = [
  // Stufe 1 - ganz leicht (500)
  [
    {
      question: "Anderes Wort für Steuer?",
      answers: [
        { text: "Abgabe", correct: true, feedback: "Richtig! Steuer und Abgabe werden oft synonym verwendet." },
        { text: "Angabe", correct: false, feedback: "Falsch. Angabe ist keine Bezeichnung für Steuer." },
        { text: "Anlass", correct: false, feedback: "Falsch. Anlass hat nichts mit Steuern zu tun." },
        { text: "Ader", correct: false, feedback: "Falsch. Ader bezeichnet ein Blutgefäss." }
      ]
    },
    {
      question: "Mit welchem Begriff wird bezeichnet, dass man verheiratet mehr an Einkommenssteuer bezahlt?",
      answers: [
        { text: "Heiratsstrafe", correct: true, feedback: "Richtig! Die Heiratsstrafe bezeichnet die steuerliche Benachteiligung von Ehepaaren." },
        { text: "Ringsteuer", correct: false, feedback: "Falsch. Diesen Begriff gibt es nicht." },
        { text: "Ja-Wort-Kosten", correct: false, feedback: "Falsch. Dies ist kein offizieller Begriff." },
        { text: "Ehe-Malus", correct: false, feedback: "Falsch. Der korrekte Begriff ist Heiratsstrafe." }
      ]
    }
  ],
  // Stufe 2 - sehr leicht (1'000)
  [
    {
      question: "Wie viele Kantone müssen sich mindestens bei einem Kantonsreferendum beteiligen?",
      answers: [
        { text: "8", correct: true, feedback: "Richtig! Mindestens 8 Kantone müssen ein Kantonsreferendum unterstützen." },
        { text: "10", correct: false, feedback: "Falsch. Es braucht nur 8 Kantone." },
        { text: "16", correct: false, feedback: "Falsch. 8 Kantone reichen aus." },
        { text: "23", correct: false, feedback: "Falsch. Es braucht nur 8 von 26 Kantonen." }
      ]
    },
    {
      question: "Individualbesteuerung – was ist das?",
      answers: [
        { text: "Jede Person füllt eine eigene Steuererklärung aus – unabhängig vom Zivilstand.", correct: true, feedback: "Richtig! Bei der Individualbesteuerung wird jede Person separat besteuert." },
        { text: "Nur Singles füllen eine Steuererklärung aus.", correct: false, feedback: "Falsch. Alle Personen füllen eine eigene Steuererklärung aus." },
        { text: "Ehepaare zahlen keine Steuern mehr.", correct: false, feedback: "Falsch. Alle zahlen weiterhin Steuern." },
        { text: "Nur der Höherverdienende zahlt Steuern.", correct: false, feedback: "Falsch. Beide Partner zahlen Steuern." }
      ]
    }
  ],
  // Stufe 3 - leicht (5'000) - Sicherheitsstufe
  [
    {
      question: "Mit welchem politischem Instrument wurde die Abstimmung zur Individualbesteuerung 'erzwungen'?",
      answers: [
        { text: "Referendum", correct: true, feedback: "Richtig! Mit dem Kantonsreferendum wurde die Volksabstimmung erzwungen." },
        { text: "Radikalisierung", correct: false, feedback: "Falsch. Das ist kein politisches Instrument." },
        { text: "Royalty", correct: false, feedback: "Falsch. Royalty bezeichnet Lizenzgebühren." },
        { text: "Randomisierung", correct: false, feedback: "Falsch. Das ist ein statistisches Verfahren." }
      ]
    },
    {
      question: "Wer erhebt in der Schweiz Steuern?",
      answers: [
        { text: "Bund, Kanton und Gemeinden", correct: true, feedback: "Richtig! In der Schweiz erheben alle drei Staatsebenen Steuern." },
        { text: "Unternehmen, Schulen und Vereine", correct: false, feedback: "Falsch. Diese erheben keine Steuern." },
        { text: "Tourismus und Wirtschaft", correct: false, feedback: "Falsch. Diese sind keine Steuererheber." },
        { text: "Museen und Musikfestivals", correct: false, feedback: "Falsch. Diese erheben keine Steuern." }
      ]
    }
  ],
  // Stufe 4 - etwas schwierig (50'000)
  [
    {
      question: "Warum wurde die Volksabstimmung von 2016 zur Heiratsstrafe vom Bundesgericht annulliert?",
      answers: [
        { text: "Der Bundesrat hatte falsche Zahlen bezüglich der betroffenen Paare kommuniziert.", correct: true, feedback: "Richtig! Falsche Informationen führten zur Annullierung der Abstimmung." },
        { text: "Das Resultat war zu knapp.", correct: false, feedback: "Falsch. Die Knappheit war nicht der Grund." },
        { text: "Es gab technische Probleme.", correct: false, feedback: "Falsch. Es ging um Fehlinformationen." },
        { text: "Die Kampagnenfinanzierung wurde von mehreren Parteien mit falschen Angaben versehen.", correct: false, feedback: "Falsch. Es ging um falsche Zahlen vom Bundesrat." }
      ]
    },
    {
      question: "Um wie viel soll der Kinderabzug bei der direkten Bundessteuer erhöht werden?",
      answers: [
        { text: "Von 6'800 auf 12'000 CHF", correct: true, feedback: "Richtig! Der Kinderabzug soll fast verdoppelt werden." },
        { text: "Von 4'000 auf 8'000 CHF", correct: false, feedback: "Falsch. Die aktuellen Beträge sind anders." },
        { text: "Von 10'000 auf 15'000 CHF", correct: false, feedback: "Falsch. Der aktuelle Abzug ist tiefer." },
        { text: "Der Kinderabzug wird nicht verändert.", correct: false, feedback: "Falsch. Er wird erhöht." }
      ]
    }
  ],
  // Stufe 5 - sehr schwierig (250'000) - Sicherheitsstufe
  [
    {
      question: "Wie viele zusätzliche Steuererklärungen müssten die Kantone jährlich bearbeiten (laut Gegnern)?",
      answers: [
        { text: "1,7 Millionen", correct: true, feedback: "Richtig! Die Gegner rechnen mit 1,7 Millionen zusätzlichen Steuererklärungen." },
        { text: "500'000", correct: false, feedback: "Falsch. Die Schätzung ist höher." },
        { text: "3 Millionen", correct: false, feedback: "Falsch. Die Schätzung ist tiefer." },
        { text: "750'000", correct: false, feedback: "Falsch. Die Schätzung liegt bei 1,7 Millionen." }
      ]
    },
    {
      question: "Welche Partei gehört NICHT zum Nein-Komitee gegen die Individualbesteuerung?",
      answers: [
        { text: "SP", correct: true, feedback: "Richtig! Die SP unterstützt die Individualbesteuerung." },
        { text: "EVP", correct: false, feedback: "Falsch. Die EVP ist im Nein-Komitee." },
        { text: "SVP", correct: false, feedback: "Falsch. Die SVP ist im Nein-Komitee." },
        { text: "Mitte", correct: false, feedback: "Falsch. Die Mitte ist im Nein-Komitee." }
      ]
    }
  ],
  // Stufe 6 - ganz schwierig (500'000)
  [
    {
      question: "Was ist das KONSERVATIVE Argument GEGEN die Individualbesteuerung?",
      answers: [
        { text: "Es benachteiligt Einverdiener/innen-Familien und traditionelle Familienmodelle.", correct: true, feedback: "Richtig! Konservative sehen traditionelle Familienmodelle benachteiligt." },
        { text: "Der Staat hat weniger Kontrolle über die Heiratspraktiken.", correct: false, feedback: "Falsch. Das ist kein Argument." },
        { text: "Es führt zu weniger Kindern.", correct: false, feedback: "Falsch. Das ist nicht das Hauptargument." },
        { text: "Die Steuereinnahmen fallen tiefer aus.", correct: false, feedback: "Falsch. Das betrifft eher den Bund." }
      ]
    },
    {
      question: "Warum kritisieren Gegner die Individualbesteuerung aus Sicht der Steuergerechtigkeit?",
      answers: [
        { text: "Gutverdienende Doppelverdiener-Paare profitieren am meisten.", correct: true, feedback: "Richtig! Kritiker sehen eine Bevorzugung von gut verdienenden Paaren." },
        { text: "Alle zahlen gleich viel.", correct: false, feedback: "Falsch. Die Belastung variiert." },
        { text: "Arme zahlen mehr.", correct: false, feedback: "Falsch. Das ist nicht das Argument." },
        { text: "Viel zu arbeiten, lohnt sich nicht mehr.", correct: false, feedback: "Falsch. Das Gegenteil ist ein Pro-Argument." }
      ]
    }
  ],
  // Stufe 7 - Finale (1'000'000) - Sicherheitsstufe
  [
    {
      question: "Warum ist die Heiratsstrafe ein Problem für die Gleichstellung?",
      answers: [
        { text: "Es lohnt sich oft nicht für den Zweitverdienenden (meist Frauen) zu arbeiten.", correct: true, feedback: "Richtig! Die Heiratsstrafe setzt negative Erwerbsanreize, besonders für Frauen." },
        { text: "Männer zahlen mehr als Frauen.", correct: false, feedback: "Falsch. Es geht um Erwerbsanreize." },
        { text: "Frauen werden in der Ehe automatisch höher besteuert.", correct: false, feedback: "Falsch. Die Besteuerung ist gemeinsam." },
        { text: "Gleichstellung scheitert wegen unterschiedlicher Löhne.", correct: false, feedback: "Falsch. Das ist ein anderes Thema." }
      ]
    },
    {
      question: "Welches Prinzip steht hinter der Steuerprogression?",
      answers: [
        { text: "Wer mehr verdient, soll prozentual mehr beitragen.", correct: true, feedback: "Richtig! Die Progression basiert auf dem Leistungsfähigkeitsprinzip." },
        { text: "Steuern steigen linear mit dem Einkommen.", correct: false, feedback: "Falsch. Bei der Progression steigt der Satz überproportional." },
        { text: "Steuern sollen Leistung belohnen.", correct: false, feedback: "Falsch. Es geht um Beitrag nach Leistungsfähigkeit." },
        { text: "Wer Kosten verursacht, soll diese selbst tragen.", correct: false, feedback: "Falsch. Das ist das Verursacherprinzip." }
      ]
    }
  ]
]

// Gewinnstufen für 7 Fragen (bis 1 Million)
const prizeLevels = [
  { level: 1, prize: "CHF 500", safe: false },
  { level: 2, prize: "CHF 1'000", safe: false },
  { level: 3, prize: "CHF 5'000", safe: true },
  { level: 4, prize: "CHF 50'000", safe: false },
  { level: 5, prize: "CHF 250'000", safe: true },
  { level: 6, prize: "CHF 500'000", safe: false },
  { level: 7, prize: "CHF 1 Million", safe: true }
]

const STORAGE_KEY = 'millionenspiel_state'

export default function MillionenSpiel({ onComplete, onReset, initialCompleted, initialScore }: MillionenSpielProps) {
  // Wenn bereits abgeschlossen (von Firebase), localStorage ignorieren
  const [selectedQuestions] = useState(() => {
    // Wenn von Firebase als abgeschlossen markiert, localStorage löschen
    if (initialCompleted && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }

    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          if (state.selectedQuestions) return state.selectedQuestions
        } catch (e) {}
      }
    }
    return questionsByLevel.map(levelQuestions =>
      levelQuestions[Math.floor(Math.random() * levelQuestions.length)]
    )
  })

  const [currentLevel, setCurrentLevel] = useState(() => {
    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.currentLevel || 0
        } catch (e) {}
      }
    }
    return 0
  })
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameOver, setGameOver] = useState(() => {
    if (initialCompleted) return true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.gameOver || false
        } catch (e) {}
      }
    }
    return false
  })
  const [gameWon, setGameWon] = useState(() => {
    if (initialCompleted) return true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.gameWon || false
        } catch (e) {}
      }
    }
    return false
  })
  const [finalPrize, setFinalPrize] = useState(() => {
    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.finalPrize || ""
        } catch (e) {}
      }
    }
    return ""
  })
  const [showPrizeLevels, setShowPrizeLevels] = useState(false)

  // Joker States - ab Stufe 3 verfügbar
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(() => {
    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.fiftyFiftyUsed || false
        } catch (e) {}
      }
    }
    return false
  })
  const [audienceUsed, setAudienceUsed] = useState(() => {
    if (typeof window !== 'undefined' && !initialCompleted) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const state = JSON.parse(saved)
          return state.audienceUsed || false
        } catch (e) {}
      }
    }
    return false
  })
  const [eliminatedAnswers, setEliminatedAnswers] = useState<number[]>([])
  const [audienceResult, setAudienceResult] = useState<number[] | null>(null)

  // Shuffled answers für aktuelle Frage
  const [shuffledAnswers, setShuffledAnswers] = useState<{text: string, correct: boolean, feedback: string, originalIndex: number}[]>([])

  const currentQuestion = selectedQuestions[currentLevel]

  // Spielstand in localStorage speichern
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        selectedQuestions,
        currentLevel,
        gameOver,
        gameWon,
        finalPrize,
        fiftyFiftyUsed,
        audienceUsed
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [selectedQuestions, currentLevel, gameOver, gameWon, finalPrize, fiftyFiftyUsed, audienceUsed])

  // Antworten mischen wenn Frage wechselt
  useEffect(() => {
    if (!currentQuestion) return
    const answers = currentQuestion.answers.map((a: { text: string; correct: boolean; feedback: string }, i: number) => ({ ...a, originalIndex: i }))
    // Fisher-Yates Shuffle
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]]
    }
    setShuffledAnswers(answers)
    setEliminatedAnswers([])
    setAudienceResult(null)
  }, [currentLevel, currentQuestion])

  const canUseJoker = currentLevel >= 2 // Ab Stufe 3 (Index 2)

  const use5050Joker = () => {
    if (fiftyFiftyUsed || !canUseJoker) return
    const wrongIndices = shuffledAnswers.map((a, i) => i).filter(i => !shuffledAnswers[i].correct)
    const keepWrongIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
    const toEliminate = wrongIndices.filter(i => i !== keepWrongIndex)
    setEliminatedAnswers(toEliminate)
    setFiftyFiftyUsed(true)
  }

  const useAudienceJoker = () => {
    if (audienceUsed || !canUseJoker) return
    const correctIndex = shuffledAnswers.findIndex(a => a.correct)
    const percentages: number[] = [0, 0, 0, 0]
    percentages[correctIndex] = 50 + Math.floor(Math.random() * 25)
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
        if (currentLevel === selectedQuestions.length - 1) {
          setGameWon(true)
          setGameOver(true)
          setFinalPrize(prizeLevels[currentLevel].prize)
          onComplete(100)
        } else {
          setCurrentLevel((prev: number) => prev + 1)
          setSelectedAnswer(null)
          setShowResult(false)
        }
      } else {
        let safePrize = "CHF 0"
        for (let i = currentLevel - 1; i >= 0; i--) {
          if (prizeLevels[i].safe) {
            safePrize = prizeLevels[i].prize
            break
          }
        }
        setFinalPrize(safePrize)
        setGameOver(true)
        const score = Math.round((currentLevel / selectedQuestions.length) * 100)
        onComplete(score)
      }
    }, 2000)
  }

  const resetGame = () => {
    // localStorage löschen
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setCurrentLevel(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setGameOver(false)
    setGameWon(false)
    setFinalPrize("")
    setFiftyFiftyUsed(false)
    setAudienceUsed(false)
    setEliminatedAnswers([])
    setAudienceResult(null)
    setShowPrizeLevels(false)
    onReset?.()
  }

  if (gameOver) {
    // Wenn von Firebase geladen, zeige gespeicherten Score
    const displayScore = initialCompleted && initialScore !== undefined ? initialScore : null
    const displayPrize = finalPrize || (displayScore !== null ? `${displayScore}% erreicht` : "CHF 0")

    return (
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl p-6 sm:p-8 text-white text-center">
        <div className="text-5xl sm:text-6xl mb-4">{gameWon ? "🎉" : "😔"}</div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          {gameWon ? "Herzlichen Glückwunsch!" : (initialCompleted ? "Quiz abgeschlossen!" : "Leider verloren!")}
        </h2>
        <p className="text-lg sm:text-xl mb-2">
          {gameWon
            ? "Sie haben alle 7 Fragen richtig beantwortet!"
            : (initialCompleted ? "Ihr letztes Ergebnis:" : `Falsche Antwort bei Frage ${currentLevel + 1}.`)
          }
        </p>
        <div className="bg-white/20 rounded-xl p-4 sm:p-6 my-6 inline-block">
          <p className="text-sm text-purple-200">{initialCompleted && !gameWon ? "Ihr Ergebnis:" : "Ihr Gewinn:"}</p>
          <p className="text-3xl sm:text-4xl font-bold text-yellow-300">{displayPrize}</p>
        </div>

        {!gameWon && showResult && !initialCompleted && (
          <div className="bg-red-500/30 rounded-lg p-4 mb-6 text-left max-w-xl mx-auto">
            <p className="font-semibold mb-2 text-sm">Richtige Antwort:</p>
            <p className="text-sm">{shuffledAnswers.find(a => a.correct)?.text}</p>
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
      {/* Mobile: Aktueller Gewinn + Toggle für alle Stufen */}
      <div className="sm:hidden bg-black/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-300 font-bold text-sm">
              Stufe {currentLevel + 1}: {prizeLevels[currentLevel].prize}
            </span>
          </div>
          <button
            onClick={() => setShowPrizeLevels(!showPrizeLevels)}
            className="flex items-center gap-1 text-purple-300 text-xs"
          >
            Alle Stufen
            {showPrizeLevels ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Ausklappbare Gewinnstufen für Mobile */}
        {showPrizeLevels && (
          <div className="mt-3 grid grid-cols-4 gap-1 text-xs">
            {prizeLevels.map((level) => {
              const isCurrentLevel = level.level === currentLevel + 1
              const isPassed = level.level < currentLevel + 1
              return (
                <div
                  key={level.level}
                  className={`px-2 py-1 rounded text-center ${
                    isCurrentLevel
                      ? 'bg-yellow-500 text-black font-bold'
                      : isPassed
                        ? 'bg-green-500/30 text-green-300'
                        : level.safe
                          ? 'bg-purple-500/30 text-yellow-300'
                          : 'bg-white/10 text-white/60'
                  }`}
                >
                  {level.level}. {level.prize.replace("CHF ", "")}
                  {level.safe && " 🛡️"}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* Hauptbereich */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Frage */}
          <div className="bg-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-purple-300 text-xs sm:text-sm">Frage {currentLevel + 1} von {selectedQuestions.length}</span>
              <span className="text-yellow-300 font-bold text-sm sm:text-base hidden sm:block">{prizeLevels[currentLevel].prize}</span>
            </div>
            <h3 className="text-base sm:text-xl text-white font-semibold leading-relaxed">
              {currentQuestion?.question}
            </h3>
          </div>

          {/* Joker */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              onClick={use5050Joker}
              disabled={fiftyFiftyUsed || !canUseJoker}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                fiftyFiftyUsed
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : !canUseJoker
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              <span>50:50</span>
              {fiftyFiftyUsed && <X className="h-3 w-3 sm:h-4 sm:w-4" />}
            </button>
            <button
              onClick={useAudienceJoker}
              disabled={audienceUsed || !canUseJoker}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                audienceUsed
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : !canUseJoker
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Publikum</span>
              {audienceUsed && <X className="h-3 w-3 sm:h-4 sm:w-4" />}
            </button>
            {!canUseJoker && (
              <span className="text-xs text-purple-300 self-center">
                Joker ab Stufe 3
              </span>
            )}
          </div>

          {/* Publikumsjoker Ergebnis */}
          {audienceResult && (
            <div className="bg-blue-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-blue-200 text-xs sm:text-sm mb-2 sm:mb-3">Publikumsergebnis:</p>
              <div className="grid grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={letter} className="flex items-center gap-1 sm:gap-2">
                    <span className="text-white font-bold text-xs sm:text-sm w-4 sm:w-6">{letter}:</span>
                    <div className="flex-1 bg-white/20 rounded-full h-3 sm:h-4 overflow-hidden">
                      <div
                        className="bg-blue-400 h-full transition-all duration-500"
                        style={{ width: `${audienceResult[i]}%` }}
                      />
                    </div>
                    <span className="text-white text-xs sm:text-sm w-8 sm:w-12">{audienceResult[i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Antworten - 1 Spalte auf Mobile, 2 auf Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
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
                  className={`${bgColor} text-white p-3 sm:p-4 rounded-xl text-left transition-all flex items-start gap-2 sm:gap-3`}
                >
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg font-bold text-xs sm:text-sm shrink-0">
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed">
                    {!isEliminated ? answer.text : ''}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Feedback bei Antwort */}
          {showResult && selectedAnswer !== null && (
            <div className={`rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 ${
              shuffledAnswers[selectedAnswer].correct ? 'bg-green-500/30' : 'bg-red-500/30'
            }`}>
              <div className="flex items-start gap-2 sm:gap-3">
                {shuffledAnswers[selectedAnswer].correct
                  ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-300 shrink-0" />
                  : <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-300 shrink-0" />
                }
                <p className="text-white text-xs sm:text-sm">{shuffledAnswers[selectedAnswer].feedback}</p>
              </div>
            </div>
          )}

          {/* Bestätigen Button */}
          {selectedAnswer !== null && !showResult && (
            <button
              onClick={confirmAnswer}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              Antwort bestätigen
            </button>
          )}
        </div>

        {/* Gewinnstufen Sidebar - nur auf Desktop */}
        <div className="hidden sm:block w-44 bg-black/30 p-4">
          <div className="space-y-1">
            {[...prizeLevels].reverse().map((level) => {
              const isCurrentLevel = level.level === currentLevel + 1
              const isPassed = level.level < currentLevel + 1

              return (
                <div
                  key={level.level}
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
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
                  {level.safe && !isCurrentLevel && !isPassed && (
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
