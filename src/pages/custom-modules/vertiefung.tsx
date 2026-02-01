import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ArrowLeft, Award, Construction } from 'lucide-react'

export default function VertiefungPage() {
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
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white sticky top-0 z-10">
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
          <h1 className="text-xl font-bold mt-2">4. Vertiefung interaktiv</h1>
          <p className="text-emerald-200 text-sm">Abstimmung vom 8. März 2026</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Construction className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">In Bearbeitung</h2>
          <p className="text-gray-600 mb-6">
            Dieses Modul wird gerade entwickelt und ist bald verfügbar.
            <br />
            Hier werden vertiefende Inhalte zur Individualbesteuerung erscheinen.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
