import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { BookOpen, LogIn, UserPlus, AlertCircle, ArrowRight, Award, FileText } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrationStep, setRegistrationStep] = useState(1) // 1 = Code, 2 = Name & Password
  const [assignedCode, setAssignedCode] = useState('')
  
  const [formData, setFormData] = useState({
    lernname: '',
    code: '',
    password: ''
  })

  // Generate unique code on component mount
  useEffect(() => {
    if (!isLogin && registrationStep === 1) {
      generateUniqueCode()
    }
  }, [isLogin, registrationStep])

  const generateUniqueCode = async () => {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Check if code exists in database
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('code', '==', code))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      setAssignedCode(code)
    } else {
      // If code exists, generate a new one
      generateUniqueCode()
    }
  }

  const generateEmail = (lernname: string, code: string) => {
    // Generate a unique email from code (email is invisible to user)
    return `user.${code}@abstimmung-lernumgebung.local`
  }

  const handleNextStep = () => {
    if (registrationStep === 1 && assignedCode) {
      setFormData({ ...formData, code: assignedCode })
      setRegistrationStep(2)
    }
  }

  const handleBackToStep1 = () => {
    setRegistrationStep(1)
    setFormData({ ...formData, lernname: '', password: '' })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login - use code to find user
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
        setError('Benutzer nicht gefunden. Bitte überprüfen Sie Ihren Lerncode.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Falsches Passwort')
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Dieser Code ist bereits vergeben. Bitte wenden Sie sich an den Support.')
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
          <div className="inline-block bg-white p-4 rounded-2xl shadow-lg mb-4 border-2 border-gray-200">
            <BookOpen className="h-12 w-12 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Abstimmungs-Lernumgebung
          </h1>
          <p className="text-gray-600">
            Bereiten Sie sich optimal auf die kommende Abstimmung vor
          </p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100">
          {/* Tabs */}
          <div className="flex border-b-2 border-gray-200">
            <button
              onClick={() => {
                setIsLogin(true)
                setRegistrationStep(1)
                setError('')
                setFormData({ lernname: '', code: '', password: '' })
              }}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                isLogin
                  ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                <span>Anmelden</span>
              </div>
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setRegistrationStep(1)
                setError('')
                setFormData({ lernname: '', code: '', password: '' })
                generateUniqueCode()
              }}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                !isLogin
                  ? 'text-teal-600 border-b-4 border-teal-600 bg-teal-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5" />
                <span>Registrieren</span>
              </div>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* LOGIN FORM */}
            {isLogin && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="code-login" className="block text-sm font-medium text-gray-700 mb-2">
                    Lerncode
                  </label>
                  <input
                    type="text"
                    id="code-login"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors"
                    placeholder="Ihr persönlicher Code"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Geben Sie Ihren Lerncode ein
                  </p>
                </div>

                <div>
                  <label htmlFor="password-login" className="block text-sm font-medium text-gray-700 mb-2">
                    Passwort
                  </label>
                  <input
                    type="password"
                    id="password-login"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors"
                    placeholder="Ihr Passwort"
                  />
                </div>

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
                      <LogIn className="h-5 w-5" />
                      <span>Anmelden</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* REGISTRATION FORM - STEP 1: CODE ASSIGNMENT */}
            {!isLogin && registrationStep === 1 && (
              <div className="space-y-6">
                <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-6 text-center">
                  <div className="inline-block bg-white p-3 rounded-full mb-4">
                    <Award className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Ihr persönlicher Lerncode
                  </h3>
                  <div className="text-5xl font-bold text-teal-600 mb-3 tracking-wider">
                    {assignedCode || '------'}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Dieser Code wurde automatisch für Sie generiert.
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-teal-300">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      ⚠️ Wichtig: Notieren Sie sich diesen Code!
                    </p>
                    <p className="text-xs text-gray-600">
                      Sie benötigen diesen Code zum Anmelden. Bewahren Sie ihn sicher auf.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNextStep}
                  disabled={!assignedCode}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>Weiter</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* REGISTRATION FORM - STEP 2: NAME & PASSWORD */}
            {!isLogin && registrationStep === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ihr Lerncode:</span>
                    <span className="text-lg font-bold text-teal-600">{formData.code}</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="lernname" className="block text-sm font-medium text-gray-700 mb-2">
                    Lernname *
                  </label>
                  <input
                    type="text"
                    id="lernname"
                    required
                    value={formData.lernname}
                    onChange={(e) => setFormData({ ...formData, lernname: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors"
                    placeholder="Ihr Name oder Nickname"
                  />
                  <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-yellow-900 mb-1">
                          Wichtiger Hinweis:
                        </p>
                        <p className="text-xs text-yellow-800">
                          Ihr Lernname wird auf <strong>Badges und Zertifikaten</strong> angezeigt. 
                          Wählen Sie einen Namen, der für offizielle Dokumente geeignet ist.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Passwort *
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors"
                    placeholder="Mindestens 6 Zeichen"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Mindestens 6 Zeichen erforderlich
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Wird erstellt...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5" />
                        <span>Registrieren</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Info Box - nur bei Login sichtbar */}
        {isLogin && (
          <div className="mt-6 bg-white border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-teal-600" />
              Hinweise zur Anmeldung
            </h3>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Verwenden Sie Ihren persönlichen Lerncode</li>
              <li>• Bei Problemen wenden Sie sich an den Support</li>
              <li>• Ihr Fortschritt wird automatisch gespeichert</li>
            </ul>
          </div>
        )}

        {/* Info Box - nur bei Registrierung sichtbar */}
        {!isLogin && (
          <div className="mt-6 bg-white border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-teal-600" />
              Hinweise zur Registrierung
            </h3>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Sie erhalten einen automatisch generierten Code</li>
              <li>• Ihr Code identifiziert Sie eindeutig</li>
              <li>• Wählen Sie einen Namen für Ihre Zertifikate</li>
              <li>• Ihre Fortschritte werden automatisch gespeichert</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
