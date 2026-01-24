import { useState } from 'react'
import { useRouter } from 'next/router'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { BookOpen, LogIn, UserPlus, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    lernname: '',
    code: '',
    email: '',
    password: ''
  })

  const generateEmail = (lernname: string, code: string) => {
    // Generate a unique email from lernname and code
    const cleanName = lernname.toLowerCase().replace(/\s+/g, '')
    return `${cleanName}.${code}@abstimmung-lernumgebung.local`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const email = generateEmail(formData.lernname, formData.code)
        const userCredential = await signInWithEmailAndPassword(auth, email, formData.password)
        
        // Check if user data exists
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
        if (userDoc.exists()) {
          router.push('/dashboard')
        } else {
          setError('Benutzerdaten nicht gefunden')
        }
      } else {
        // Registration
        const email = generateEmail(formData.lernname, formData.code)
        const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password)
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          lernname: formData.lernname,
          code: formData.code,
          email: email,
          totalPoints: 0,
          overallProgress: 0,
          createdAt: new Date().toISOString(),
          modules: {
            grundlagen: { completed: false, score: 0, progress: 0 },
            vertiefung: { completed: false, score: 0, progress: 0 },
            umfrage: { completed: false, score: 0, progress: 0 },
            procontra: { completed: false, score: 0, progress: 0 },
            lernkontrolle: { completed: false, score: 0, progress: 0 }
          }
        })
        
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('Benutzer nicht gefunden. Bitte registrieren Sie sich.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Falsches Passwort')
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Diese Kombination aus Lernname und Code existiert bereits')
      } else if (err.code === 'auth/weak-password') {
        setError('Passwort muss mindestens 6 Zeichen lang sein')
      } else {
        setError(err.message || 'Ein Fehler ist aufgetreten')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-teal-500 to-cyan-600 p-4 rounded-2xl shadow-lg mb-4">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Abstimmungs-Lernumgebung
          </h1>
          <p className="text-gray-600">
            Bereiten Sie sich optimal auf die kommende Abstimmung vor
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                isLogin
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                <span>Anmelden</span>
              </div>
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                !isLogin
                  ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5" />
                <span>Registrieren</span>
              </div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Lernname */}
            <div>
              <label htmlFor="lernname" className="block text-sm font-medium text-gray-700 mb-2">
                Lernname
              </label>
              <input
                type="text"
                id="lernname"
                required
                value={formData.lernname}
                onChange={(e) => setFormData({ ...formData, lernname: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors"
                placeholder="Ihr Name oder Nickname"
              />
            </div>

            {/* Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Lerncode
              </label>
              <input
                type="text"
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors"
                placeholder="Ihr persönlicher Code"
              />
              <p className="mt-1 text-xs text-gray-500">
                {isLogin ? 'Geben Sie Ihren Lerncode ein' : 'Wählen Sie einen einzigartigen Code (z.B. Ihre Matrikelnummer)'}
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Passwort
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors"
                placeholder={isLogin ? 'Ihr Passwort' : 'Mindestens 6 Zeichen'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Bitte warten...</span>
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  <span>{isLogin ? 'Anmelden' : 'Registrieren'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-teal-50 border-2 border-teal-200 rounded-xl p-4 text-sm text-teal-800">
          <h3 className="font-semibold mb-2">ℹ️ Hinweise zur Registrierung</h3>
          <ul className="space-y-1 text-xs">
            <li>• Wählen Sie einen eindeutigen Lernnamen und Code</li>
            <li>• Ihr Code identifiziert Sie eindeutig (z.B. Matrikelnummer)</li>
            <li>• Das Passwort muss mindestens 6 Zeichen haben</li>
            <li>• Ihre Fortschritte werden automatisch gespeichert</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
