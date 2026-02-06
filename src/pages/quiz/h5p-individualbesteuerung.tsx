import Head from 'next/head'
import { Download } from 'lucide-react'

// Öffentliche Seite für das H5P-Quiz - einfach nur das Quiz zum Spielen
export default function H5PQuizPublic() {
  return (
    <>
      <Head>
        <title>Quiz: Individualbesteuerung | Abstimmung 8. März 2026</title>
        <meta name="description" content="Interaktives H5P-Quiz zur Individualbesteuerung - Abstimmung vom 8. März 2026" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Quiz: Individualbesteuerung</h1>
            <p className="text-purple-200 mt-1">Testen Sie Ihr Wissen zur Abstimmung vom 8. März 2026</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* H5P Quiz */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative" style={{ paddingBottom: '600px', height: 0 }}>
              <iframe
                src="/h5p-quiz/index.html"
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="fullscreen"
                title="Individualbesteuerung Quiz (H5P)"
              />
            </div>
          </div>

          {/* Download für Lehrpersonen */}
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Für Lehrpersonen</h3>
                <p className="text-xs text-gray-600">
                  H5P-Datei für Moodle, ILIAS oder andere LMS herunterladen
                </p>
              </div>
              <a
                href="/h5p-quiz-download/individualbesteuerung-quiz.h5p"
                download="individualbesteuerung-quiz.h5p"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>H5P herunterladen</span>
              </a>
            </div>
          </div>

          {/* Quellenhinweis */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              Ein Projekt der <strong>Lernplattform Individualbesteuerung</strong> •
              Abstimmung vom 8. März 2026
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
