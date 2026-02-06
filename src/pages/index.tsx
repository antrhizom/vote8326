import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { BookOpen, LogIn, UserPlus, AlertCircle, ArrowRight, Award, FileText, Key, Copy, CheckCircle, X } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true) // Prüft ob bereits eingeloggt
  const [error, setError] = useState('')
  const [registrationStep, setRegistrationStep] = useState(1) // 1 = Code wird angezeigt, 2 = Name eingeben
  const [assignedCode, setAssignedCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [showNamePopup, setShowNamePopup] = useState(true) // Popup für Namen-Hinweis

  const [formData, setFormData] = useState({
    lernname: '',
    code: ''
  })

  // Prüfe ob bereits angemeldet - wenn ja, zum Dashboard weiterleiten
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Benutzer ist bereits angemeldet, weiterleiten zum Dashboard
        router.push('/dashboard')
      } else {
        // Nicht angemeldet, Login-Seite anzeigen
        setCheckingAuth(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  // Generate unique 6-digit code on component mount
  useEffect(() => {
    if (!isLogin && registrationStep === 1 && !assignedCode) {
      generateUniqueCode()
    }
  }, [isLogin, registrationStep])

  const generateUniqueCode = async () => {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    try {
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
    } catch (error) {
      console.error('Error checking code:', error)
      // Even if check fails, use the generated code
      setAssignedCode(code)
    }
  }

  const copyCodeToClipboard = async () => {
    if (assignedCode) {
      try {
        await navigator.clipboard.writeText(assignedCode)
        setCodeCopied(true)
        setTimeout(() => setCodeCopied(false), 3000)
      } catch (err) {
        console.error('Failed to copy code:', err)
      }
    }
  }

  const handleNextStep = () => {
    if (registrationStep === 1 && assignedCode && codeCopied) {
      setFormData({ ...formData, code: assignedCode })
      setRegistrationStep(2)
      setShowNamePopup(true) // Reset popup for step 2
    }
  }

  const handleBackToStep1 = () => {
    setRegistrationStep(1)
    setFormData({ ...formData, lernname: '' })
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use code as both email identifier and password
      const email = `user${formData.code}@abstimmung.local`
      const password = formData.code // Code is also the password!
      
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Dieser Code wurde nicht gefunden. Bitte überprüfen Sie Ihren Code.')
      } else {
        setError('Anmeldefehler. Bitte versuchen Sie es erneut.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use code as both email identifier and password
      const email = `user${formData.code}@abstimmung.local`
      const password = formData.code // Code is also the password!
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
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
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Dieser Code ist bereits registriert.')
      } else {
        setError('Registrierungsfehler. Bitte versuchen Sie es erneut.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Ladebildschirm während Auth-Check
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    )
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
                setFormData({ lernname: '', code: '' })
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
                setFormData({ lernname: '', code: '' })
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="code-login" className="block text-sm font-medium text-gray-700 mb-2">
                    Lerncode eingeben
                  </label>
                  <input
                    type="text"
                    id="code-login"
                    required
                    maxLength={6}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-colors text-center text-2xl font-bold tracking-widest"
                    placeholder="000000"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Geben Sie Ihren 6-stelligen Lerncode ein
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || formData.code.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Anmelden...</span>
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
                    <Key className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Ihr persönlicher Lerncode
                  </h3>
                  <div className="text-5xl font-bold text-teal-600 mb-3 tracking-widest">
                    {assignedCode || '------'}
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={copyCodeToClipboard}
                    disabled={!assignedCode}
                    className={`mb-4 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 mx-auto ${
                      codeCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {codeCopied ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Code kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        <span>Code in Zwischenablage kopieren</span>
                      </>
                    )}
                  </button>

                  {codeCopied && (
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-4 animate-pulse">
                      <p className="text-sm font-semibold text-green-800">
                        ✅ Ihr Code wurde in die Zwischenablage kopiert!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Speichern Sie ihn jetzt an einem sicheren Ort (z.B. Notizen, E-Mail an sich selbst).
                      </p>
                    </div>
                  )}

                  {!codeCopied && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-900 mb-2">
                        ⚠️ Wichtig: Speichern Sie diesen Code!
                      </p>
                      <p className="text-xs text-amber-800">
                        Sie benötigen diesen Code zum Anmelden. Klicken Sie auf «Code kopieren» und
                        speichern Sie ihn an einem sicheren Ort.<br />
                        <strong>Kein Passwort erforderlich – nur dieser Code!</strong>
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextStep}
                  disabled={!assignedCode || !codeCopied}
                  className={`w-full py-3 font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                    codeCopied
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>{codeCopied ? 'Weiter' : 'Bitte zuerst Code kopieren'}</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* REGISTRATION FORM - STEP 2: NAME ONLY */}
            {!isLogin && registrationStep === 2 && (
              <>
                {/* Popup Modal für Namen-Hinweis */}
                {showNamePopup && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
                      <div className="text-center mb-4">
                        <div className="inline-block bg-amber-100 p-4 rounded-full mb-3">
                          <Award className="h-10 w-10 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Wichtig: Ihr Name auf Zertifikaten
                        </h3>
                      </div>

                      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                        <p className="text-sm text-amber-900 mb-3">
                          Der Name, den Sie im nächsten Schritt eingeben, wird auf Ihren
                          <strong> Badges und Zertifikaten</strong> erscheinen.
                        </p>
                        <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-amber-200">
                          <FileText className="h-8 w-8 text-amber-600 flex-shrink-0" />
                          <div className="text-xs text-gray-700">
                            <p className="font-semibold mb-1">Beispiel:</p>
                            <p className="italic">«Zertifikat für <span className="font-bold text-teal-600">Max Muster</span>»</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 text-center mb-4">
                        Wählen Sie einen Namen, der für offizielle Dokumente geeignet ist.
                      </p>

                      <button
                        onClick={() => setShowNamePopup(false)}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Verstanden, weiter zur Eingabe</span>
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ihr Lerncode:</span>
                      <span className="text-lg font-bold text-teal-600 tracking-wider">{formData.code}</span>
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
                      disabled={showNamePopup}
                      className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                        showNamePopup
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                          : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                      }`}
                      placeholder="Ihr Name oder Nickname"
                    />
                    <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-yellow-900 mb-1">
                            Erinnerung:
                          </p>
                          <p className="text-xs text-yellow-800">
                            Ihr Lernname wird auf <strong>Badges und Zertifikaten</strong> angezeigt.
                          </p>
                        </div>
                      </div>
                    </div>
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
                      disabled={loading || showNamePopup}
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
              </>
            )}
          </div>
        </div>

        {/* Info Box */}
        {isLogin && (
          <div className="mt-6 bg-white border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-teal-600" />
              Hinweise zur Anmeldung
            </h3>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Verwenden Sie Ihren 6-stelligen Lerncode</li>
              <li>• <strong>Kein Passwort erforderlich!</strong></li>
              <li>• Ihr Fortschritt wird automatisch gespeichert</li>
            </ul>
          </div>
        )}

        {!isLogin && (
          <div className="mt-6 bg-white border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-teal-600" />
              Hinweise zur Registrierung
            </h3>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Sie erhalten einen automatisch generierten 6-stelligen Code</li>
              <li>• <strong>Speichern Sie diesen Code!</strong> Er ist Ihr Login</li>
              <li>• <strong>Kein Passwort nötig</strong> - nur Ihr Code!</li>
              <li>• Wählen Sie einen Namen für Ihre Zertifikate</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
