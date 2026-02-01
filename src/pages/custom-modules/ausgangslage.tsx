import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { 
  ArrowLeft, CheckCircle2, Award, ChevronDown, ChevronUp,
  Sparkles, Vote, Film, ExternalLink, BarChart3, Info,
  Lightbulb, BookOpen, Scale, Building2, Users, Calendar
} from 'lucide-react'

// ===========================================
// AUSGANGSLAGE MODULE - VERBESSERT
// ===========================================

export default function AusgangslagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [totalScore, setTotalScore] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>('survey')
  
  // Accordion states for sub-sections
  const [openSubSection, setOpenSubSection] = useState<string | null>(null)
  
  // Interactive states
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set())
  const [timelineRevealed, setTimelineRevealed] = useState<Set<number>>(new Set())
  const [dragDropAnswers, setDragDropAnswers] = useState<{[key: string]: string}>({})
  const [dragDropSubmitted, setDragDropSubmitted] = useState(false)
  const [matchingAnswers, setMatchingAnswers] = useState<{[key: string]: string}>({})
  const [matchingSubmitted, setMatchingSubmitted] = useState(false)
  const [videoQuizAnswers, setVideoQuizAnswers] = useState<{[key: string]: string}>({})
  const [videoQuizSubmitted, setVideoQuizSubmitted] = useState(false)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  
  const maxPoints = 150

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data().modules?.ausgangslage
          if (data) {
            setTotalScore(data.score || 0)
            setCompletedSections(new Set(data.completedSections || []))
          }
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [router])

  const completeSection = async (sectionId: string, points: number) => {
    if (completedSections.has(sectionId)) return
    
    const newCompleted = new Set(completedSections)
    newCompleted.add(sectionId)
    setCompletedSections(newCompleted)
    
    const newScore = totalScore + points
    setTotalScore(newScore)
    
    await saveProgress(newScore, Array.from(newCompleted))
  }

  const saveProgress = async (score: number, completed: string[]) => {
    const user = auth.currentUser
    if (!user) return
    
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const modules = userData.modules || {}
        
        const allComplete = completed.length >= 5
        
        modules.ausgangslage = {
          completed: allComplete,
          score,
          progress: Math.round((score / maxPoints) * 100),
          completedSections: completed,
          lastUpdated: new Date().toISOString()
        }
        
        let totalPoints = 0
        Object.keys(modules).forEach(k => { if (modules[k].score) totalPoints += modules[k].score })
        
        const allModules = ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch']
        const overallProgress = Math.round((allModules.filter(id => modules[id]?.completed).length / allModules.length) * 100)
        
        await updateDoc(userRef, { modules, totalPoints, overallProgress })
      }
    } catch (e) { console.error(e) }
  }

  const toggleSubSection = (id: string) => {
    setOpenSubSection(openSubSection === id ? null : id)
  }

  const revealCard = (id: string) => {
    const newRevealed = new Set(revealedCards)
    newRevealed.add(id)
    setRevealedCards(newRevealed)
  }

  const flipCard = (index: number) => {
    const newFlipped = new Set(flippedCards)
    newFlipped.add(index)
    setFlippedCards(newFlipped)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const isComplete = completedSections.size >= 5

  // CSS für Animationen
  const styles = `
    .flip-card {
      perspective: 1000px;
      cursor: pointer;
    }
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s;
      transform-style: preserve-3d;
    }
    .flip-card.flipped .flip-card-inner {
      transform: rotateY(180deg);
    }
    .flip-card-front, .flip-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
    }
    .flip-card-front {
      background: linear-gradient(135deg, #7c3aed, #8b5cf6);
      color: white;
    }
    .flip-card-back {
      background: white;
      border: 2px solid #7c3aed;
      color: #4c1d95;
      transform: rotateY(180deg);
    }
    .reveal-card {
      transition: all 0.3s ease;
    }
    .reveal-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in {
      animation: fadeIn 0.3s ease-out;
    }
  `

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
            </button>
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
              <Award className="h-4 w-4" />
              <span className="font-semibold">{totalScore} / {maxPoints}</span>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-2">1. Ausgangslage kollaborativ interaktiv</h1>
          <p className="text-purple-200 text-sm">Abstimmung vom 8. März 2026 – Individualbesteuerung</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        
        {/* ================================================
            SECTION 1: UMFRAGE (kommt zuerst!)
        ================================================ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'survey' ? null : 'survey')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <span className="font-semibold text-gray-900">Umfrage: Ihre persönliche Ausgangslage</span>
              {completedSections.has('survey') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+20P ✓</span>
              )}
            </div>
            {openSection === 'survey' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'survey' && (
            <div className="p-6 border-t">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
                <p className="text-purple-900 font-medium mb-2">🎯 Warum diese Umfrage?</p>
                <p className="text-purple-800 text-sm">
                  Bevor Sie in die Inhalte eintauchen, interessiert uns Ihre persönliche Ausgangslage. 
                  Die Umfrage hilft Ihnen, Ihre eigene Position zu reflektieren – und ermöglicht später 
                  spannende Vergleiche mit anderen Teilnehmer:innen.
                </p>
              </div>
              
              {/* Eingebettete Umfrage */}
              <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                <iframe 
                  src="https://findmind.ch/c/Gi3E-hSdy"
                  className="w-full h-[500px] border-0"
                  title="Ausgangslage Umfrage"
                />
              </div>
              
              {!completedSections.has('survey') && (
                <button 
                  onClick={() => completeSection('survey', 20)}
                  className="mt-4 w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                >
                  ✓ Umfrage abgeschlossen
                </button>
              )}
              
              {/* Ergebnisse-Accordion */}
              <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSubSection('results')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">📈 Umfrage-Ergebnisse anzeigen</span>
                  </div>
                  {openSubSection === 'results' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {openSubSection === 'results' && (
                  <div className="p-4 border-t bg-white">
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
                      <p className="text-amber-800 text-sm">
                        <strong>💡 Tipp:</strong> In der Ergebnisansicht können Sie auf die <strong>Antwortbezeichnungen</strong> klicken, 
                        um die Ergebnisse entsprechend zu filtern. So sehen Sie z.B. nur die Antworten von Personen, 
                        die bereits Steuern zahlen, oder von bestimmten Altersgruppen.
                      </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <iframe 
                        src="https://findmind.ch/c/Gi3E-hSdy/results"
                        className="w-full h-[400px] border-0"
                        title="Umfrage-Ergebnisse"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Die Ergebnisse werden laufend aktualisiert
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================
            SECTION 2: REFERENDUM - INTERAKTIV & UMFANGREICH
        ================================================ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'referendum' ? null : 'referendum')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <Vote className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Das Referendum als politisches Instrument</span>
              {completedSections.has('referendum') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+50P ✓</span>
              )}
            </div>
            {openSection === 'referendum' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'referendum' && (
            <div className="p-6 border-t space-y-4">
              
              {/* Einführungstext */}
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Das Referendum ist ein zentrales Instrument der <strong>direkten Demokratie</strong> in der Schweiz. 
                  Es ermöglicht den Stimmberechtigten, über Entscheide des Parlaments das letzte Wort zu haben.
                </p>
              </div>

              {/* INFO-KARTEN ZUM AUFDECKEN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Obligatorisches Referendum */}
                <div 
                  onClick={() => revealCard('obligatorisch')}
                  className={`reveal-card p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    revealedCards.has('obligatorisch') 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${revealedCards.has('obligatorisch') ? 'bg-blue-500' : 'bg-gray-200'}`}>
                      <Scale className={`h-5 w-5 ${revealedCards.has('obligatorisch') ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h4 className="font-bold text-gray-900">Obligatorisches Referendum</h4>
                  </div>
                  {revealedCards.has('obligatorisch') ? (
                    <div className="fade-in">
                      <p className="text-blue-800 text-sm mb-2">
                        Bei <strong>Verfassungsänderungen</strong> muss das Volk <strong>immer</strong> abstimmen.
                      </p>
                      <ul className="text-blue-700 text-xs space-y-1">
                        <li>• Gilt seit 1848</li>
                        <li>• Braucht Volks- UND Ständemehr</li>
                        <li>• Keine Unterschriften nötig</li>
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Klicken zum Aufdecken...</p>
                  )}
                </div>

                {/* Fakultatives Referendum */}
                <div 
                  onClick={() => revealCard('fakultativ')}
                  className={`reveal-card p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    revealedCards.has('fakultativ') 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${revealedCards.has('fakultativ') ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <Users className={`h-5 w-5 ${revealedCards.has('fakultativ') ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h4 className="font-bold text-gray-900">Fakultatives Referendum</h4>
                  </div>
                  {revealedCards.has('fakultativ') ? (
                    <div className="fade-in">
                      <p className="text-green-800 text-sm mb-2">
                        Gegen <strong>Bundesgesetze</strong> kann innerhalb von 100 Tagen ein Referendum ergriffen werden.
                      </p>
                      <ul className="text-green-700 text-xs space-y-1">
                        <li>• <strong>50'000 Unterschriften</strong> ODER</li>
                        <li>• <strong>8 Kantone</strong> verlangen es</li>
                        <li>• Nur Volksmehr nötig</li>
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Klicken zum Aufdecken...</p>
                  )}
                </div>

                {/* Kantonsreferendum */}
                <div 
                  onClick={() => revealCard('kantonsref')}
                  className={`reveal-card p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    revealedCards.has('kantonsref') 
                      ? 'border-orange-400 bg-orange-50' 
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${revealedCards.has('kantonsref') ? 'bg-orange-500' : 'bg-gray-200'}`}>
                      <Building2 className={`h-5 w-5 ${revealedCards.has('kantonsref') ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h4 className="font-bold text-gray-900">Kantonsreferendum</h4>
                  </div>
                  {revealedCards.has('kantonsref') ? (
                    <div className="fade-in">
                      <p className="text-orange-800 text-sm mb-2">
                        <strong>8 Kantone</strong> können gemeinsam ein Referendum erzwingen – sehr selten!
                      </p>
                      <ul className="text-orange-700 text-xs space-y-1">
                        <li>• Erst <strong>2x in der Geschichte</strong></li>
                        <li>• 2003: Steuerpaket (abgelehnt mit 65.9%)</li>
                        <li>• 2025: Individualbesteuerung</li>
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Klicken zum Aufdecken...</p>
                  )}
                </div>

                {/* Aktueller Fall */}
                <div 
                  onClick={() => revealCard('aktuell')}
                  className={`reveal-card p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    revealedCards.has('aktuell') 
                      ? 'border-red-400 bg-red-50' 
                      : 'border-gray-200 bg-white hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${revealedCards.has('aktuell') ? 'bg-red-500' : 'bg-gray-200'}`}>
                      <Calendar className={`h-5 w-5 ${revealedCards.has('aktuell') ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <h4 className="font-bold text-gray-900">Individualbesteuerung 2026</h4>
                  </div>
                  {revealedCards.has('aktuell') ? (
                    <div className="fade-in">
                      <p className="text-red-800 text-sm mb-2">
                        <strong>10 Kantone</strong> haben das Referendum ergriffen!
                      </p>
                      <ul className="text-red-700 text-xs space-y-1">
                        <li>• Dafür: SVP, Mitte, EVP, EDU</li>
                        <li>• Dagegen: SP, FDP, Grüne, GLP</li>
                        <li>• Abstimmung: 8. März 2026</li>
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Klicken zum Aufdecken...</p>
                  )}
                </div>
              </div>

              {revealedCards.size >= 4 && !completedSections.has('referendum_info') && (
                <button 
                  onClick={() => completeSection('referendum_info', 15)}
                  className="w-full py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-semibold text-sm"
                >
                  ✓ Alle Info-Karten aufgedeckt (+15 Punkte)
                </button>
              )}

              {/* ÜBUNG 1: Timeline ordnen */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <button 
                  onClick={() => toggleSubSection('timeline')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <span className="font-semibold text-gray-900">Übung: Zeitstrahl entdecken</span>
                    {completedSections.has('timeline') && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
                    )}
                  </div>
                  {openSubSection === 'timeline' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {openSubSection === 'timeline' && (
                  <div className="p-4 border-t bg-white">
                    <p className="text-gray-600 text-sm mb-4">Klicken Sie auf die Ereignisse, um mehr zu erfahren:</p>
                    
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 to-indigo-500"></div>
                      
                      {[
                        { year: '1984', event: 'Bundesgerichtsurteil', detail: 'Das Bundesgericht erklärt die Heiratsstrafe für verfassungswidrig.' },
                        { year: '2016', event: 'CVP-Initiative abgelehnt', detail: 'Volk lehnt Initiative ab – später wird ein Zählfehler entdeckt!' },
                        { year: '2024', event: 'Parlament beschliesst Reform', detail: 'National- und Ständerat stimmen der Individualbesteuerung zu.' },
                        { year: '2025', event: 'Kantonsreferendum', detail: '10 Kantone ergreifen das Referendum – erst das 2. Mal in der Geschichte.' },
                        { year: '8.3.2026', event: 'Volksabstimmung', detail: 'Das Schweizer Volk entscheidet an der Urne.' }
                      ].map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            const newRevealed = new Set(timelineRevealed)
                            newRevealed.add(idx)
                            setTimelineRevealed(newRevealed)
                          }}
                          className={`relative pl-10 mb-4 cursor-pointer transition-all ${
                            timelineRevealed.has(idx) ? '' : 'hover:bg-gray-50 rounded-lg'
                          }`}
                        >
                          <div className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            timelineRevealed.has(idx) 
                              ? 'bg-purple-500 border-purple-500' 
                              : 'bg-white border-gray-300 hover:border-purple-400'
                          }`}>
                            {timelineRevealed.has(idx) && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          
                          <div className={`p-3 rounded-lg border transition-all ${
                            timelineRevealed.has(idx) 
                              ? 'bg-purple-50 border-purple-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-purple-700">{item.year}</span>
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">{item.event}</p>
                            {timelineRevealed.has(idx) && (
                              <p className="text-gray-600 text-sm mt-1 fade-in">{item.detail}</p>
                            )}
                            {!timelineRevealed.has(idx) && (
                              <p className="text-gray-400 text-xs mt-1">Klicken für Details...</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {timelineRevealed.size >= 5 && !completedSections.has('timeline') && (
                      <button 
                        onClick={() => completeSection('timeline', 15)}
                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                      >
                        ✓ Timeline abgeschlossen (+15 Punkte)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ÜBUNG 2: Zuordnung */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSubSection('matching')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔗</span>
                    <span className="font-semibold text-gray-900">Übung: Begriffe zuordnen</span>
                    {completedSections.has('matching') && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+20P ✓</span>
                    )}
                  </div>
                  {openSubSection === 'matching' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {openSubSection === 'matching' && (
                  <div className="p-4 border-t bg-white">
                    <p className="text-gray-600 text-sm mb-4">Ordnen Sie die Begriffe der richtigen Beschreibung zu:</p>
                    
                    <div className="space-y-3">
                      {[
                        { term: '50\'000 Unterschriften', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Fakultatives Ref.' },
                        { term: '8 Kantone', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Kantonsreferendum' },
                        { term: 'Verfassungsänderung', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Obligatorisches Ref.' },
                        { term: 'Bundesgesetz anfechten', options: ['Obligatorisches Ref.', 'Fakultatives Ref.', 'Kantonsreferendum'], correct: 'Fakultatives Ref.' },
                      ].map((item, idx) => {
                        const answer = matchingAnswers[`match${idx}`]
                        const isCorrect = matchingSubmitted && answer === item.correct
                        const isWrong = matchingSubmitted && answer && answer !== item.correct
                        
                        return (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            isCorrect ? 'border-green-400 bg-green-50' : 
                            isWrong ? 'border-red-400 bg-red-50' : 
                            'border-gray-200 bg-white'
                          }`}>
                            <p className="font-medium text-gray-800 text-sm mb-2">{item.term}</p>
                            <div className="flex flex-wrap gap-2">
                              {item.options.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => !matchingSubmitted && setMatchingAnswers({...matchingAnswers, [`match${idx}`]: opt})}
                                  disabled={matchingSubmitted}
                                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    answer === opt
                                      ? matchingSubmitted
                                        ? opt === item.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                        : 'bg-purple-500 text-white'
                                      : matchingSubmitted && opt === item.correct
                                        ? 'bg-green-200 text-green-800'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {!matchingSubmitted && Object.keys(matchingAnswers).length >= 4 && (
                      <button 
                        onClick={() => {
                          setMatchingSubmitted(true)
                          if (!completedSections.has('matching')) {
                            completeSection('matching', 20)
                          }
                        }}
                        className="mt-4 w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                      >
                        Antworten prüfen
                      </button>
                    )}
                    
                    {matchingSubmitted && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg text-green-800 text-sm">
                        <strong>✓ Zuordnung abgeschlossen!</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Gesamtfortschritt Referendum */}
              {completedSections.has('referendum_info') && completedSections.has('timeline') && completedSections.has('matching') && !completedSections.has('referendum') && (
                <button 
                  onClick={() => completeSection('referendum', 0)}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold"
                >
                  ✓ Referendum-Kapitel abschliessen
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================================================
            SECTION 3: VIDEO + INTERAKTIVE ÜBUNGEN
        ================================================ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'video' ? null : 'video')}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50"
          >
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Video: Der Weg zur Individualbesteuerung</span>
              {completedSections.has('video_exercises') && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+45P ✓</span>
              )}
            </div>
            {openSection === 'video' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {openSection === 'video' && (
            <div className="p-6 border-t space-y-4">
              <p className="text-gray-700 text-sm">
                Dieses Video erklärt die Geschichte der "Heiratsstrafe" und warum es über <strong>40 Jahre</strong> gedauert hat, 
                bis eine Lösung gefunden wurde. Schauen Sie das Video und bearbeiten Sie anschliessend die Übungen.
              </p>
              
              {/* YouTube Video */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <iframe 
                  className="w-full aspect-video"
                  src="https://www.youtube.com/embed/wP8DA6YHkJo"
                  title="Geschichte der Heiratsstrafe"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* ÜBUNG 1: Flipcards zu Schlüsselbegriffen */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSubSection('flipcards')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎴</span>
                    <span className="font-semibold text-gray-900">Übung: Schlüsselbegriffe (Flipcards)</span>
                    {completedSections.has('flipcards') && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+15P ✓</span>
                    )}
                  </div>
                  {openSubSection === 'flipcards' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {openSubSection === 'flipcards' && (
                  <div className="p-4 border-t bg-white">
                    <p className="text-gray-600 text-sm mb-4">Klicken Sie auf die Karten, um die Erklärung zu sehen:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { front: 'Heiratsstrafe', back: 'Ehepaare zahlen mehr Steuern als unverheiratete Paare mit gleichem Einkommen.', emoji: '💍' },
                        { front: 'Steuerprogression', back: 'Je höher das Einkommen, desto höher der Steuersatz. Zusammengelegte Einkommen werden stärker besteuert.', emoji: '📈' },
                        { front: 'Individualbesteuerung', back: 'Jede Person füllt eine eigene Steuererklärung aus – unabhängig vom Zivilstand.', emoji: '👤' }
                      ].map((card, idx) => (
                        <div 
                          key={idx}
                          onClick={() => flipCard(idx)}
                          className={`flip-card h-36 ${flippedCards.has(idx) ? 'flipped' : ''}`}
                        >
                          <div className="flip-card-inner">
                            <div className="flip-card-front">
                              <span className="text-3xl mb-2">{card.emoji}</span>
                              <p className="font-bold text-sm">{card.front}</p>
                              <p className="text-xs mt-2 opacity-75">Klicken</p>
                            </div>
                            <div className="flip-card-back">
                              <p className="text-sm">{card.back}</p>
                              <CheckCircle2 className="h-5 w-5 text-purple-500 mt-2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {flippedCards.size >= 3 && !completedSections.has('flipcards') && (
                      <button 
                        onClick={() => completeSection('flipcards', 15)}
                        className="mt-4 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                      >
                        ✓ Flipcards abgeschlossen (+15 Punkte)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ÜBUNG 2: Video-Verständnisfragen */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSubSection('videoquiz')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">❓</span>
                    <span className="font-semibold text-gray-900">Übung: Verständnisfragen zum Video</span>
                    {completedSections.has('videoquiz') && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+30P ✓</span>
                    )}
                  </div>
                  {openSubSection === 'videoquiz' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {openSubSection === 'videoquiz' && (
                  <div className="p-4 border-t bg-white">
                    <div className="space-y-4">
                      {/* Frage 1 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-800 mb-3">
                          1. In welchem Jahr erklärte das Bundesgericht die Heiratsstrafe für verfassungswidrig?
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {['1974', '1984', '1994', '2004'].map(opt => {
                            const isSelected = videoQuizAnswers.vq1 === opt
                            const isCorrect = videoQuizSubmitted && opt === '1984'
                            const isWrong = videoQuizSubmitted && isSelected && opt !== '1984'
                            return (
                              <button
                                key={opt}
                                onClick={() => !videoQuizSubmitted && setVideoQuizAnswers({...videoQuizAnswers, vq1: opt})}
                                disabled={videoQuizSubmitted}
                                className={`p-2 rounded-lg text-sm font-medium transition-all ${
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

                      {/* Frage 2 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-800 mb-3">
                          2. Was passierte 2016 bei der CVP-Initiative?
                        </p>
                        <div className="space-y-2">
                          {[
                            'Sie wurde angenommen',
                            'Sie wurde abgelehnt, aber ein Zählfehler wurde entdeckt',
                            'Sie kam gar nicht zur Abstimmung',
                            'Das Bundesgericht erklärte sie für ungültig'
                          ].map(opt => {
                            const isSelected = videoQuizAnswers.vq2 === opt
                            const correct = 'Sie wurde abgelehnt, aber ein Zählfehler wurde entdeckt'
                            const isCorrect = videoQuizSubmitted && opt === correct
                            const isWrong = videoQuizSubmitted && isSelected && opt !== correct
                            return (
                              <button
                                key={opt}
                                onClick={() => !videoQuizSubmitted && setVideoQuizAnswers({...videoQuizAnswers, vq2: opt})}
                                disabled={videoQuizSubmitted}
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

                      {/* Frage 3 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-800 mb-3">
                          3. Warum dauerte es so lange, die Heiratsstrafe abzuschaffen?
                        </p>
                        <div className="space-y-2">
                          {[
                            'Es fehlte das politische Interesse',
                            'Das Bundesgericht blockierte alle Vorstösse',
                            'Es gab immer wieder Streit über den besten Lösungsweg',
                            'Die Kantone weigerten sich'
                          ].map(opt => {
                            const isSelected = videoQuizAnswers.vq3 === opt
                            const correct = 'Es gab immer wieder Streit über den besten Lösungsweg'
                            const isCorrect = videoQuizSubmitted && opt === correct
                            const isWrong = videoQuizSubmitted && isSelected && opt !== correct
                            return (
                              <button
                                key={opt}
                                onClick={() => !videoQuizSubmitted && setVideoQuizAnswers({...videoQuizAnswers, vq3: opt})}
                                disabled={videoQuizSubmitted}
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
                    </div>
                    
                    {!videoQuizSubmitted && videoQuizAnswers.vq1 && videoQuizAnswers.vq2 && videoQuizAnswers.vq3 && (
                      <button 
                        onClick={() => {
                          setVideoQuizSubmitted(true)
                          if (!completedSections.has('videoquiz')) {
                            completeSection('videoquiz', 30)
                          }
                        }}
                        className="mt-4 w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
                      >
                        Antworten prüfen
                      </button>
                    )}
                    
                    {videoQuizSubmitted && (
                      <div className="mt-4 p-4 bg-green-100 rounded-lg text-green-800">
                        <strong>✓ Verständnisfragen abgeschlossen!</strong>
                        <p className="text-sm mt-1">
                          Das Bundesgericht entschied 1984. Die CVP-Initiative 2016 wurde abgelehnt (mit Zählfehler). 
                          Der Streit über den Lösungsweg verzögerte die Lösung über 40 Jahre.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Video-Kapitel abschliessen */}
              {completedSections.has('flipcards') && completedSections.has('videoquiz') && !completedSections.has('video_exercises') && (
                <button 
                  onClick={() => completeSection('video_exercises', 0)}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold"
                >
                  ✓ Video-Kapitel abschliessen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2">Modul abgeschlossen!</h3>
            <p className="text-purple-100">Sie haben {totalScore} Punkte erreicht und kennen nun die Ausgangslage.</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50"
            >
              Weiter zum nächsten Modul
            </button>
          </div>
        )}

        {/* Quellenangabe */}
        <div className="text-xs text-gray-500 flex items-center gap-1 justify-center">
          <ExternalLink className="h-3 w-3" />
          <a href="https://hls-dhs-dss.ch/de/articles/010387/2011-12-23/" target="_blank" rel="noopener" className="hover:underline">
            Quelle Referendum: Historisches Lexikon der Schweiz (CC BY-SA)
          </a>
        </div>
      </main>
    </div>
  )
}
