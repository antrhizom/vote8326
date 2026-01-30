// Module Content für Abstimmungs-Lernumgebung

export interface ModuleData {
  id: string
  title: string
  description: string
  estimatedTime: string
  maxPoints: number
  type: 'h5p' | 'quiz' | 'interactive'
  h5pUrl?: string | null
}

export const moduleData: { [key: string]: ModuleData } = {
  // 1. Grundlagen: Info Bund und Medien
  grundlagen: {
    id: 'grundlagen',
    title: '1. Grundlagen: Info Bund und Medien',
    description: 'Lernen Sie die Grundlagen über Bundesinformationen und Medienberichterstattung kennen.',
    estimatedTime: '15 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/grundlagen.html'
  },
  
  // 2. Vertiefung interaktiv
  vertiefung: {
    id: 'vertiefung',
    title: '2. Vertiefung interaktiv',
    description: 'Vertiefen Sie Ihr Wissen mit interaktiven Übungen und praktischen Beispielen.',
    estimatedTime: '20 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/vertiefung.html'
  },
  
  // 3. Pro- und Contra
  procontra: {
    id: 'procontra',
    title: '3. Pro- und Contra',
    description: 'Schauen Sie ein Video zur Bargeldinitiative und bearbeiten Sie eine interaktive Aufgabe.',
    estimatedTime: '10 Min',
    maxPoints: 100,
    type: 'interactive',
    h5pUrl: null // Uses custom page
  },
  
  // 4. Lernkontrolle
  lernkontrolle: {
    id: 'lernkontrolle',
    title: '4. Lernkontrolle',
    description: 'Testen Sie Ihr Gesamtwissen in einer abschließenden Lernkontrolle.',
    estimatedTime: '15 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/lernkontrolle.html'
  },
  
  // 5. Umfrage Lernset (vorher Modul 3)
  umfrage: {
    id: 'umfrage',
    title: '5. Umfrage Lernset',
    description: 'Nehmen Sie an einer Umfrage teil und reflektieren Sie über das Gelernte.',
    estimatedTime: '10 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/68fb34ef86d593ad28dc1d00.html'
  }
}

export interface LearningArea {
  id: string
  title: string
  description: string
  modules: string[]
  color: string
}

export const learningAreas = {
  abstimmung2026: {
    id: 'abstimmung2026',
    title: 'Abstimmung 2026 - Lernumgebung',
    description: 'Bereiten Sie sich optimal auf die kommende Abstimmung vor.',
    modules: ['grundlagen', 'vertiefung', 'procontra', 'lernkontrolle', 'umfrage'],
    color: 'teal'
  }
}

// Calculate progress for a learning area
export function calculateAreaProgress(userModules: any, areaId: string): number {
  const area = learningAreas[areaId as keyof typeof learningAreas]
  if (!area) return 0
  
  const completedModules = area.modules.filter(
    moduleId => userModules[moduleId]?.completed
  ).length
  
  return Math.round((completedModules / area.modules.length) * 100)
}

// Get total possible points for an area
export function getTotalPossiblePoints(areaId: string): number {
  const area = learningAreas[areaId as keyof typeof learningAreas]
  if (!area) return 0
  
  return area.modules.reduce((sum, moduleId) => {
    const module = moduleData[moduleId]
    return sum + (module?.maxPoints || 0)
  }, 0)
}

// Setup H5P event listener
export function setupH5PListener(
  onScoreUpdate: (score: number, maxScore: number) => void,
  onCompleted: () => void
) {
  const handleH5PEvent = (event: MessageEvent) => {
    if (event.data && event.data.statement) {
      const statement = event.data.statement
      
      // Handle different xAPI verbs
      if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/completed') {
        const score = statement.result?.score?.raw || 0
        const maxScore = statement.result?.score?.max || 100
        onScoreUpdate(score, maxScore)
        onCompleted()
      } else if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/answered') {
        const score = statement.result?.score?.raw || 0
        const maxScore = statement.result?.score?.max || 100
        onScoreUpdate(score, maxScore)
      } else if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/progressed') {
        // Handle progress updates
        const progress = statement.result?.extensions?.['http://id.tincanapi.com/extension/ending-point'] || 0
        // Optional: track progress
      }
    }
  }
  
  window.addEventListener('message', handleH5PEvent)
  
  return () => window.removeEventListener('message', handleH5PEvent)
}
