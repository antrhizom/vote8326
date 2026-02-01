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
  // 1. Ausgangslage kollaborativ interaktiv
  ausgangslage: {
    id: 'ausgangslage',
    title: '1. Ausgangslage kollaborativ interaktiv',
    description: 'Erarbeiten Sie Ihre persönliche Ausgangslage und lernen Sie das Referendum als politisches Instrument kennen.',
    estimatedTime: '15 Min',
    maxPoints: 100,
    type: 'interactive',
    h5pUrl: null // Uses custom page
  },
  
  // 2. Grundlagen Info Bund Medien
  grundlagen: {
    id: 'grundlagen',
    title: '2. Grundlagen Info Bund Medien',
    description: 'Lernen Sie die offiziellen Informationen des Bundes und die Medienberichterstattung kennen.',
    estimatedTime: '20 Min',
    maxPoints: 120,
    type: 'interactive',
    h5pUrl: null // Uses custom page
  },
  
  // 3. Pro Contra
  procontra: {
    id: 'procontra',
    title: '3. Pro Contra',
    description: 'Lernen Sie die verschiedenen Perspektiven zur Individualbesteuerung kennen.',
    estimatedTime: '25 Min',
    maxPoints: 210,
    type: 'interactive',
    h5pUrl: null // Uses custom page
  },
  
  // 4. Vertiefung interaktiv
  vertiefung: {
    id: 'vertiefung',
    title: '4. Vertiefung interaktiv',
    description: 'Vertiefen Sie Ihr Wissen mit interaktiven Übungen und praktischen Beispielen.',
    estimatedTime: '20 Min',
    maxPoints: 100,
    type: 'interactive',
    h5pUrl: null // Uses custom page
  },
  
  // 5. Spielerisch
  spielerisch: {
    id: 'spielerisch',
    title: '5. Spielerisch',
    description: 'Festigen Sie Ihr Wissen spielerisch mit Quiz und Challenges.',
    estimatedTime: '15 Min',
    maxPoints: 100,
    type: 'interactive',
    h5pUrl: null // Uses custom page
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
    title: 'Abstimmung vom 8. März 2026',
    description: 'Individualbesteuerung: Bereiten Sie sich optimal auf die kommende Abstimmung vor.',
    modules: ['ausgangslage', 'grundlagen', 'procontra', 'vertiefung', 'spielerisch'],
    color: 'teal'
  }
}

// Interface for area progress
export interface AreaProgress {
  progress: number
  points: number
  maxPoints: number
  completed: number
  total: number
}

// Calculate progress for a learning area - returns full object
export function getAreaProgress(userModules: any, areaId: string): AreaProgress {
  const area = learningAreas[areaId as keyof typeof learningAreas]
  if (!area) {
    return { progress: 0, points: 0, maxPoints: 0, completed: 0, total: 0 }
  }
  
  const completedModules = area.modules.filter(
    moduleId => userModules[moduleId]?.completed
  ).length
  
  const totalModules = area.modules.length
  const progress = Math.round((completedModules / totalModules) * 100)
  
  // Calculate points
  const points = area.modules.reduce((sum, moduleId) => {
    const moduleProgress = userModules[moduleId]
    return sum + (moduleProgress?.score || 0)
  }, 0)
  
  const maxPoints = area.modules.reduce((sum, moduleId) => {
    const module = moduleData[moduleId]
    return sum + (module?.maxPoints || 0)
  }, 0)
  
  return {
    progress,
    points,
    maxPoints,
    completed: completedModules,
    total: totalModules
  }
}

// Legacy function for backward compatibility (returns only number)
export function calculateAreaProgress(userModules: any, areaId: string): number {
  return getAreaProgress(userModules, areaId).progress
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

// H5P Event Interface
export interface H5PEvent {
  type: 'completed' | 'progress' | 'scored'
  data: {
    score?: number
    maxScore?: number
    progress?: number
  }
}

// Setup H5P event listener
export function setupH5PListener(
  iframe: HTMLIFrameElement | null,
  onEvent: (event: H5PEvent) => void
): () => void {
  const handleH5PEvent = (event: MessageEvent) => {
    if (event.data && event.data.statement) {
      const statement = event.data.statement
      
      // Handle different xAPI verbs
      if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/completed') {
        const score = statement.result?.score?.raw || 0
        const maxScore = statement.result?.score?.max || 100
        onEvent({
          type: 'completed',
          data: { score, maxScore }
        })
      } else if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/answered') {
        const score = statement.result?.score?.raw || 0
        const maxScore = statement.result?.score?.max || 100
        onEvent({
          type: 'scored',
          data: { score, maxScore }
        })
      } else if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/progressed') {
        const progress = statement.result?.extensions?.['http://id.tincanapi.com/extension/ending-point'] || 0
        onEvent({
          type: 'progress',
          data: { progress }
        })
      }
    }
    
    // Also handle direct H5P events (non-xAPI)
    if (event.data && event.data.context === 'h5p') {
      if (event.data.action === 'completed') {
        onEvent({
          type: 'completed',
          data: {
            score: event.data.score || 0,
            maxScore: event.data.maxScore || 100
          }
        })
      } else if (event.data.action === 'scored') {
        onEvent({
          type: 'scored',
          data: {
            score: event.data.score || 0,
            maxScore: event.data.maxScore || 100
          }
        })
      }
    }
  }
  
  window.addEventListener('message', handleH5PEvent)
  
  return () => window.removeEventListener('message', handleH5PEvent)
}
