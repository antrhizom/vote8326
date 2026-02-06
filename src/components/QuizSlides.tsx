import { useState, useEffect, useMemo } from 'react'
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
}

const allQuestions: QuizQuestion[] = [
  {
    question: "Was bezeichnet der Begriff Heiratsstrafe?",
    answers: [
      { text: "Die steuerliche Benachteiligung bestimmter verheirateter Paare gegenüber unverheirateten Paaren", correct: true, feedback: "Bei vielen Ehepaaren werden die Einkommen zusammengerechnet. Dadurch können sie in eine höhere Steuerprogression geraten und zahlen mehr als vergleichbare unverheiratete Paare mit getrennten Steuererklärungen." },
      { text: "Eine Strafabgabe bei Scheidungen", correct: false, feedback: "Die Heiratsstrafe entsteht während der Ehe durch die gemeinsame Veranlagung und nicht erst bei einer Scheidung." },
      { text: "Eine freiwillige Zusatzsteuer", correct: false, feedback: "Die Heiratsstrafe ist eine systembedingte Mehrbelastung für gewisse Ehepaare. Sie ist keine freiwillige Zahlung, sondern ergibt sich aus Tarifen und Progression." },
      { text: "Eine kirchliche Abgabe", correct: false, feedback: "Die Heiratsstrafe entsteht im staatlichen Steuersystem. Sie betrifft die direkte Bundessteuer und nicht Kirchensteuern." }
    ]
  },
  {
    question: "Wie werden Ehepaare heute bei der direkten Bundessteuer besteuert?",
    answers: [
      { text: "Mit einer gemeinsamen Steuererklärung, in der Einkommen und Vermögen zusammengezählt werden", correct: true, feedback: "Ehepaare reichen heute typischerweise eine gemeinsame Steuererklärung ein. Dadurch werden die wirtschaftlichen Verhältnisse als Einheit erfasst, was bei zwei Einkommen zu einer höheren Progression führen kann." },
      { text: "Mit zwei getrennten Steuererklärungen", correct: false, feedback: "Zwei getrennte Steuererklärungen wären ein Kernelement der Individualbesteuerung und sind gerade das, was sich ändern würde." },
      { text: "Nur das höhere Einkommen wird besteuert", correct: false, feedback: "Einkommen und Vermögen beider Ehepartner werden zusammengezählt. Es zählt nicht nur das höhere Einkommen, sondern die Summe." },
      { text: "Pauschal unabhängig vom Einkommen", correct: false, feedback: "Das System ist einkommensabhängig und progressiv. Ehepaare werden gemeinsam veranlagt und die Steuer hängt vom Einkommen ab." }
    ]
  },
  {
    question: "Wer hat das Referendum gegen die Individualbesteuerung ergriffen?",
    answers: [
      { text: "Zehn Kantone und ein überparteiliches Komitee", correct: true, feedback: "Mindestens acht Kantone können ein Kantonsreferendum auslösen. Da dieses Quorum erreicht wurde, kommt die Vorlage vors Volk." },
      { text: "Der Bundesrat", correct: false, feedback: "Der Bundesrat steht hingegen hinter der Vorlage und empfiehlt sie zur Annahme." },
      { text: "Das Bundesgericht", correct: false, feedback: "Das Bundesgericht ist keine politische Akteurin im Referendumsprozess, sondern beurteilt Rechtsfragen." },
      { text: "Ausschliesslich eine Partei", correct: false, feedback: "Es handelt sich nicht um einen Schritt nur einer einzelnen Partei, sondern um ein überparteiliches Engagement." }
    ]
  },
  {
    question: "Was soll mit der Individualbesteuerung hauptsächlich erreicht werden?",
    answers: [
      { text: "Die steuerliche Gleichbehandlung unabhängig vom Zivilstand und damit die Abschaffung der Heiratsstrafe", correct: true, feedback: "Die Vorlage will verhindern, dass Paare wegen Heirat steuerlich besser oder schlechter gestellt werden. Entscheidend soll stärker das individuelle Einkommen sein." },
      { text: "Die Abschaffung der Ehe als Institution", correct: false, feedback: "Am Zivilrecht und an der Ehe als Institution ändert die Vorlage nichts." },
      { text: "Die Abschaffung aller Steuerabzüge", correct: false, feedback: "Abzüge bleiben grundsätzlich möglich, einzelne Elemente wie der Kinderabzug werden sogar angepasst." },
      { text: "Die Abschaffung der Steuerprogression", correct: false, feedback: "Die Progression als Grundprinzip der Besteuerung bleibt bestehen." }
    ]
  },
  {
    question: "Welche Ehepaare profitieren tendenziell eher von der Individualbesteuerung?",
    answers: [
      { text: "Doppelverdiener-Ehepaare mit ähnlich hohen Einkommen", correct: true, feedback: "Wenn zwei Einkommen ähnlich hoch sind, fällt der Effekt der gemeinsamen Progression weg. Dadurch sinkt die Steuerbelastung im Vergleich zum heutigen System häufig." },
      { text: "Einverdiener-Ehepaare", correct: false, feedback: "Einverdiener-Ehepaare profitieren heute oft von der gemeinsamen Veranlagung und könnten nach der Umstellung eher stärker belastet werden." },
      { text: "Alle Familien mit Kindern", correct: false, feedback: "Ob Familien mit Kindern profitieren, hängt stark von Einkommen, Aufteilung und Abzügen ab." },
      { text: "Nur unverheiratete Paare", correct: false, feedback: "Unverheiratete Paare werden heute bereits getrennt besteuert, für sie ist der Systemwechsel weniger grundlegend." }
    ]
  },
  {
    question: "Warum wird der Kinderabzug erhöht?",
    answers: [
      { text: "Um Familien zu entlasten und mögliche Mehrbelastungen bei gewissen Konstellationen abzufedern", correct: true, feedback: "Wenn bestimmte Haushalte durch die Umstellung mehr zahlen würden, soll der höhere Kinderabzug die Belastung reduzieren. Dadurch wird versucht, die Vorlage ausgewogener zu gestalten." },
      { text: "Um die Steuereinnahmen zu erhöhen", correct: false, feedback: "Ein höherer Abzug senkt die Steuerlast und führt nicht zu höheren Einnahmen." },
      { text: "Um Kantone zu bestrafen", correct: false, feedback: "Es geht um soziale Ausgleichsmassnahmen, nicht um Sanktionen gegenüber Kantonen." },
      { text: "Um Heiraten attraktiver zu machen", correct: false, feedback: "Die Reform will gerade zivilstandsneutral sein und nicht Heirat steuerlich besonders fördern." }
    ]
  },
  {
    question: "Welches zentrale Argument bringen Gegner der Individualbesteuerung vor?",
    answers: [
      { text: "Der administrative Aufwand für Bevölkerung und Steuerbehörden steige stark an", correct: true, feedback: "Wenn auch Ehepaare zwei Steuererklärungen einreichen, müssen deutlich mehr Dossiers bearbeitet werden. Gegner erwarten dadurch höhere Verwaltungskosten und mehr Bürokratie." },
      { text: "Die Ehe werde verboten", correct: false, feedback: "Die Ehe bleibt rechtlich unangetastet, es geht um die Art der Besteuerung." },
      { text: "Steuern würden abgeschafft", correct: false, feedback: "Steuern bleiben bestehen, nur die Veranlagungslogik ändert." },
      { text: "Das Referendum sei ungültig", correct: false, feedback: "Das Referendum ist formell zustande gekommen, sonst gäbe es keine Abstimmung." }
    ]
  },
  {
    question: "Warum erwarten Befürworter mehr Erwerbsanreize durch Individualbesteuerung?",
    answers: [
      { text: "Weil der Zweitverdienst weniger stark durch die Progression des gemeinsamen Einkommens belastet wird", correct: true, feedback: "Wenn Einkommen getrennt besteuert werden, fällt ein Teil des Progressionseffekts weg. Dadurch lohnt sich eine Pensumerhöhung für den tiefer verdienenden Partner tendenziell stärker." },
      { text: "Weil weniger gearbeitet werden muss", correct: false, feedback: "Es geht um Anreize, nicht darum, dass weniger gearbeitet werden soll." },
      { text: "Weil Unternehmen weniger Steuern zahlen", correct: false, feedback: "Die Vorlage betrifft natürliche Personen, nicht die Besteuerung von Unternehmen." },
      { text: "Weil alle gleich viel verdienen", correct: false, feedback: "Einkommensunterschiede bleiben bestehen, geändert wird die steuerliche Behandlung." }
    ]
  },
  {
    question: "Welche Ebene ist direkt Gegenstand der Abstimmung?",
    answers: [
      { text: "Die direkte Bundessteuer und deren Regeln zur Veranlagung", correct: true, feedback: "Die Vorlage ist ein Bundesgesetz und betrifft unmittelbar die Bundessteuer. Auswirkungen auf Kantone hängen davon ab, wie sie ihre Systeme anpassen." },
      { text: "Nur die Gemeindesteuern", correct: false, feedback: "Gemeindesteuern wären höchstens indirekt betroffen, weil Kantone und Gemeinden eigene Regeln haben." },
      { text: "Die AHV-Beiträge", correct: false, feedback: "Sozialversicherungen wie die AHV gehören nicht zu dieser Steuervorlage." },
      { text: "Die Kirchensteuer", correct: false, feedback: "Kirchensteuern sind kantonal geregelt und nicht Teil des Bundesgesetzes." }
    ]
  },
  {
    question: "Warum wurde die Abstimmung zur Heiratsstrafe von 2016 aufgehoben?",
    answers: [
      { text: "Wegen schwerwiegender Fehlinformation der Stimmberechtigten und einer Annullierung durch das Bundesgericht im April 2019", correct: true, feedback: "Vor der Abstimmung vom Februar 2016 wurden falsche Angaben zur Anzahl betroffener Ehepaare verbreitet. Das Bundesgericht beurteilte dies als Verletzung der Abstimmungsfreiheit und hob die Volksabstimmung auf - ein historischer Schritt." },
      { text: "Wegen zu tiefer Stimmbeteiligung", correct: false, feedback: "Es ging nicht um die Beteiligung, sondern um falsche Informationen, die die freie Meinungsbildung beeinträchtigten." },
      { text: "Wegen technischer Probleme beim Auszählen", correct: false, feedback: "Das Problem lag nicht beim Auszählen, sondern bei inhaltlich falschen Angaben im Abstimmungskampf." },
      { text: "Weil Parteien verboten wurden", correct: false, feedback: "Parteien waren nicht verboten, entscheidend war die Verletzung der Abstimmungsfreiheit." }
    ]
  },
  {
    question: "Was bedeutet Zivilstandsneutralität im Steuersystem?",
    answers: [
      { text: "Der Zivilstand soll die Steuerbelastung nicht beeinflussen", correct: true, feedback: "Ob jemand verheiratet ist, im Konkubinat lebt oder allein ist, soll nicht darüber entscheiden, ob mehr oder weniger Steuern bezahlt werden. Massgeblich soll die individuelle wirtschaftliche Leistungsfähigkeit sein." },
      { text: "Verheiratete zahlen immer weniger", correct: false, feedback: "Es geht nicht um eine generelle Bevorzugung von Verheirateten, sondern um gleiche Regeln für alle." },
      { text: "Unverheiratete zahlen mehr", correct: false, feedback: "Auch unverheiratete Personen sollen nicht schlechter gestellt werden." },
      { text: "Nur Familien profitieren", correct: false, feedback: "Das Prinzip gilt für alle Steuerpflichtigen, nicht nur für Familien." }
    ]
  },
  {
    question: "Warum kritisieren Kantone die Individualbesteuerung häufig?",
    answers: [
      { text: "Weil sie mehr administrative Arbeit und höhere Kosten bei der Veranlagung erwarten", correct: true, feedback: "Kantone führen die Veranlagung praktisch durch und müssten Prozesse, IT und Personal anpassen. Zudem steigt die Zahl der zu bearbeitenden Steuerfälle, wenn Ehepaare getrennt veranlagt werden." },
      { text: "Weil sie ihre Steuerhoheit verlieren", correct: false, feedback: "Ihre Steuerhoheit bleibt bestehen, sie müssen jedoch die Umsetzung organisatorisch bewältigen." },
      { text: "Weil die Mehrwertsteuer sinkt", correct: false, feedback: "Die Mehrwertsteuer ist nicht Teil der Vorlage." },
      { text: "Weil sie nicht mitbestimmen dürfen", correct: false, feedback: "Tatsächlich haben Kantone aktiv mitbestimmt, indem sie das Referendum ergriffen haben." }
    ]
  },
  {
    question: "Welche Rolle spielte das Bundesgericht in der Debatte um die Heiratsstrafe?",
    answers: [
      { text: "Es stellte 2019 eine Verletzung der Abstimmungsfreiheit fest und annullierte die Volksabstimmung von 2016", correct: true, feedback: "Das Gericht hielt fest, dass die Stimmberechtigten wegen falscher Informationen nicht frei entscheiden konnten. Darum wurde die Abstimmung aufgehoben, ein aussergewöhnlicher Eingriff in den demokratischen Prozess." },
      { text: "Es empfahl ein Ja zur Individualbesteuerung", correct: false, feedback: "Gerichte geben keine Abstimmungsempfehlungen, sie prüfen die Einhaltung von Grundrechten und Verfahren." },
      { text: "Es schrieb das Steuergesetz zur Individualbesteuerung", correct: false, feedback: "Gesetze werden von Parlament und Bundesrat erarbeitet, nicht vom Gericht geschrieben." },
      { text: "Es ergriff das Referendum", correct: false, feedback: "Referenden werden von Stimmberechtigten oder Kantonen ergriffen, nicht von Gerichten." }
    ]
  },
  {
    question: "Warum ist die Abstimmung zur Individualbesteuerung politisch besonders bedeutsam?",
    answers: [
      { text: "Weil sie einen grundlegenden Systemwechsel im Steuersystem darstellt", correct: true, feedback: "Erstmals würde bei der direkten Bundessteuer konsequent auf individuelle Besteuerung umgestellt. Das kann Gewinner und Verlierer je nach Einkommensaufteilung erzeugen und hat Folgen für Steuergerechtigkeit, Verwaltung und Erwerbsanreize." },
      { text: "Weil nur Ehepaare betroffen sind", correct: false, feedback: "Betroffen sind nicht nur Ehepaare, sondern das gesamte System der Veranlagung und damit viele Steuerpflichtige." },
      { text: "Weil sie rein symbolisch ist", correct: false, feedback: "Die Folgen wären konkret, etwa bei der Anzahl Steuererklärungen, bei der Steuerbelastung und beim Verwaltungsaufwand." },
      { text: "Weil sie das letzte Referendum der Schweiz ist", correct: false, feedback: "Die direkte Demokratie bleibt bestehen, Referenden und Abstimmungen werden weiterhin möglich sein." }
    ]
  },
  {
    question: "Was ist der Hauptunterschied zwischen dem heutigen System und der Individualbesteuerung bezüglich der Steuerprogression?",
    answers: [
      { text: "Im heutigen System werden Einkommen zusammengezählt, was zu höherer Progression führen kann; bei Individualbesteuerung wird jede Person separat besteuert", correct: true, feedback: "Bei der gemeinsamen Veranlagung steigt durch die Zusammenrechnung der Einkommen oft der Steuersatz. Bei der Individualbesteuerung würde jeder Partner nur auf sein eigenes Einkommen besteuert, was den Progressionseffekt bei Doppelverdienern reduziert." },
      { text: "Die Progression wird komplett abgeschafft", correct: false, feedback: "Die Steuerprogression als Prinzip bleibt bestehen - höhere Einkommen zahlen prozentual mehr. Nur der Effekt der Zusammenrechnung würde wegfallen." },
      { text: "Alle zahlen denselben Steuersatz", correct: false, feedback: "Auch bei der Individualbesteuerung bleibt die Progression erhalten. Je nach Höhe des individuellen Einkommens variiert der Steuersatz weiterhin." },
      { text: "Nur Unverheiratete profitieren von der Progression", correct: false, feedback: "Die Progression gilt für alle Steuerpflichtigen. Der Unterschied liegt darin, ob bei Ehepaaren die Einkommen zusammengezählt werden oder nicht." }
    ]
  }
]

export default function QuizSlides({ onComplete, onReset }: QuizSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))
  const [showAnswers, setShowAnswers] = useState<boolean[]>(new Array(questions.length).fill(false))
  const [quizCompleted, setQuizCompleted] = useState(false)

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
    setCurrentSlide(0)
    setSelectedAnswers(new Array(questions.length).fill(null))
    setShowAnswers(new Array(questions.length).fill(false))
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
    const score = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-8 text-white text-center">
        <div className="text-6xl mb-4">{score >= 80 ? "🎉" : score >= 50 ? "👍" : "📚"}</div>
        <h2 className="text-3xl font-bold mb-4">Quiz abgeschlossen!</h2>
        <div className="bg-white/20 rounded-xl p-6 mb-6 inline-block">
          <p className="text-lg mb-2">Ihr Ergebnis:</p>
          <p className="text-5xl font-bold">{correctCount} / {questions.length}</p>
          <p className="text-teal-100 mt-2">{score}% richtig</p>
        </div>
        <div className="space-y-2 mb-6">
          {score >= 80 && <p className="text-lg">Hervorragend! Sie kennen sich sehr gut mit der Individualbesteuerung aus.</p>}
          {score >= 50 && score < 80 && <p className="text-lg">Gut gemacht! Sie haben ein solides Grundwissen.</p>}
          {score < 50 && <p className="text-lg">Schauen Sie sich die Lernmodule nochmals an, um Ihr Wissen zu vertiefen.</p>}
        </div>
        <button
          onClick={resetQuiz}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
          Nochmals versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-black/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-teal-100" />
          <span className="text-white font-semibold">Lernkarten</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-teal-100 text-sm">
            {answeredCount} / {questions.length} beantwortet
          </span>
          <span className="text-emerald-200 text-sm font-semibold">
            {correctCount} richtig
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
      <div className="p-6">
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-teal-100 text-sm">Frage {currentSlide + 1} von {questions.length}</span>
            {showAnswer && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                selectedAnswer !== null && currentQuestion.answers[selectedAnswer].correct
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {selectedAnswer !== null && currentQuestion.answers[selectedAnswer].correct ? 'Richtig!' : 'Falsch'}
              </span>
            )}
          </div>
          <h3 className="text-xl text-white font-semibold leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.answers.map((answer, index) => {
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
                className={`w-full ${bgColor} border-2 ${borderColor} text-white p-4 rounded-xl text-left transition-all flex items-start gap-3`}
              >
                <span className="bg-white/20 px-3 py-1 rounded-lg font-bold text-sm shrink-0">
                  {['A', 'B', 'C', 'D'][index]}
                </span>
                <span className="flex-1">{answer.text}</span>
                {showAnswer && isCorrect && (
                  <CheckCircle className="h-6 w-6 text-green-300 shrink-0" />
                )}
                {showAnswer && isSelected && !isCorrect && (
                  <XCircle className="h-6 w-6 text-red-300 shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {showAnswer && selectedAnswer !== null && (
          <div className={`rounded-xl p-5 mb-6 ${
            currentQuestion.answers[selectedAnswer].correct
              ? 'bg-green-500/20 border border-green-400/50'
              : 'bg-orange-500/20 border border-orange-400/50'
          }`}>
            <div className="flex items-start gap-3">
              {currentQuestion.answers[selectedAnswer].correct ? (
                <CheckCircle className="h-6 w-6 text-green-300 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-orange-300 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-white font-semibold mb-1">
                  {currentQuestion.answers[selectedAnswer].correct ? 'Richtig!' : 'Leider falsch'}
                </p>
                <p className="text-white/90 text-sm leading-relaxed">
                  {currentQuestion.answers[selectedAnswer].feedback}
                </p>
                {!currentQuestion.answers[selectedAnswer].correct && (
                  <p className="text-green-300 text-sm mt-3">
                    <strong>Korrekte Antwort:</strong> {currentQuestion.answers.find(a => a.correct)?.text}
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              currentSlide === 0
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
            Zurück
          </button>

          {/* Slide Indicators */}
          <div className="flex gap-1.5">
            {questions.map((_, index) => {
              const isAnswered = selectedAnswers[index] !== null
              const isCorrect = isAnswered && questions[index].answers[selectedAnswers[index]!].correct

              return (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              !showAnswer
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            {currentSlide === questions.length - 1 ? 'Abschliessen' : 'Weiter'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
