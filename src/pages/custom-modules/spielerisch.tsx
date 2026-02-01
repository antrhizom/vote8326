import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, Award, Construction, Gamepad2 } from 'lucide-react'

export default function SpielerischPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser
      if (!user) { router.push('/'); return }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 to-rose-600 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
            </button>
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
              <Award className="h-4 w-4" />
              <span className="font-semibold">0 / 100</span>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-2">5. Spielerisch</h1>
          <p className="text-pink-200 text-sm">Abstimmung vom 8. März 2026</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Gamepad2 className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bald verfügbar!</h2>
          <p className="text-gray-600 mb-6">
            Dieses Modul wird gerade entwickelt.
            <br />
            Hier erwarten Sie spielerische Elemente wie:
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            <div className="bg-pink-50 p-3 rounded-lg">
              <span className="text-2xl">🎮</span>
              <p className="text-sm text-pink-800 mt-1">Quiz-Spiele</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <span className="text-2xl">🧩</span>
              <p className="text-sm text-pink-800 mt-1">Puzzle</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <span className="text-2xl">🏆</span>
              <p className="text-sm text-pink-800 mt-1">Challenges</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <span className="text-2xl">⚡</span>
              <p className="text-sm text-pink-800 mt-1">Speed-Quiz</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
