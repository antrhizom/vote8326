// Module Content für Abstimmungs-Lernumgebung

export interface ModuleData {
  id: string
  title: string
  description: string
  estimatedTime: string
  maxPoints: number
  type: 'h5p' | 'quiz' | 'interactive'
  h5pUrl?: string // Path to H5P HTML file
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
  
  // 3. Umfrage Lernset
  umfrage: {
    id: 'umfrage',
    title: '3. Umfrage Lernset',
    description: 'Nehmen Sie an einer Umfrage teil und reflektieren Sie über das Gelernte.',
    estimatedTime: '10 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/68fb34ef86d593ad28dc1d00.html' // Ihre hochgeladene H5P-Datei
  },
  
  // 4. Pro- und Contra
  procontra: {
    id: 'procontra',
    title: '4. Pro- und Contra',
    description: 'Erkunden Sie verschiedene Perspektiven und Argumente zur Abstimmung.',
    estimatedTime: '15 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/procontra.html'
  },
  
  // 5. Lernkontrolle
  lernkontrolle: {
    id: 'lernkontrolle',
    title: '5. Lernkontrolle',
    description: 'Testen Sie Ihr Wissen in einer abschließenden Lernkontrolle.',
    estimatedTime: '20 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/lernkontrolle.html'
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
    modules: ['grundlagen', 'vertiefung', 'umfrage', 'procontra', 'lernkontrolle'],
    color: 'teal'
  }
}

export function getAreaProgress(
  modules: { [key: string]: { completed: boolean; score: number; progress: number } },
  areaId: string
) {
  const area = learningAreas[areaId as keyof typeof learningAreas]
  if (!area) {
    return { progress: 0, points: 0, maxPoints: 0, completed: 0, total: 0 }
  }

  let totalPoints = 0
  let maxPoints = 0
  let completedCount = 0

  area.modules.forEach(moduleId => {
    const module = modules[moduleId]
    const moduleInfo = moduleData[moduleId]
    
    if (module && moduleInfo) {
      totalPoints += module.score || 0
      maxPoints += moduleInfo.maxPoints
      if (module.completed) {
        completedCount++
      }
    }
  })

  const progress = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

  return {
    progress,
    points: totalPoints,
    maxPoints,
    completed: completedCount,
    total: area.modules.length
  }
}

// H5P Event Listener Types
export interface H5PEvent {
  type: 'completed' | 'progress' | 'scored'
  data: {
    score?: number
    maxScore?: number
    percentage?: number
    progress?: number
  }
}

// H5P Integration Helper
export function setupH5PListener(
  iframeElement: HTMLIFrameElement | null,
  onEvent: (event: H5PEvent) => void
) {
  if (!iframeElement) return

  const handleMessage = (event: MessageEvent) => {
    // H5P sendet xAPI-Events
    if (event.data && event.data.statement) {
      const statement = event.data.statement
      
      // Completion Event
      if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/completed') {
        const score = statement.result?.score?.scaled || 0
        const maxScore = statement.result?.score?.max || 100
        
        onEvent({
          type: 'completed',
          data: {
            score: Math.round(score * maxScore),
            maxScore: maxScore,
            percentage: Math.round(score * 100)
          }
        })
      }
      
      // Progress Event
      if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/progressed') {
        const progress = statement.result?.extensions?.['http://id.tincanapi.com/extension/ending-point'] || 0
        
        onEvent({
          type: 'progress',
          data: {
            progress: progress
          }
        })
      }
      
      // Answered/Scored Event
      if (statement.verb?.id === 'http://adlnet.gov/expapi/verbs/answered') {
        const score = statement.result?.score?.raw || 0
        const maxScore = statement.result?.score?.max || 100
        
        onEvent({
          type: 'scored',
          data: {
            score: score,
            maxScore: maxScore,
            percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
          }
        })
      }
    }
  }

  window.addEventListener('message', handleMessage)
  
  // Cleanup function
  return () => {
    window.removeEventListener('message', handleMessage)
  }
}
