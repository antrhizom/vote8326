# Abstimmungs-Lernumgebung 🗳️

Eine interaktive Lernplattform für Abstimmungen mit H5P-Integration, automatischer Punkteerfassung und Live-Statistiken.

## ✨ Features

- **🎨 Modernes türkises Design** - Ansprechendes UI basierend auf dem Jahresrückblick-Dashboard
- **📚 5 Lernsets** mit strukturiertem Aufbau:
  1. Grundlagen: Info Bund und Medien
  2. Vertiefung interaktiv
  3. Umfrage Lernset
  4. Pro- und Contra
  5. Lernkontrolle
- **🎯 H5P-Integration** - Einbettung interaktiver H5P-Inhalte als HTML-Dateien
- **📊 Automatische Punkteerfassung** - xAPI-Events von H5P werden abgefangen und gespeichert
- **🏆 Badge-System** - Automatische Badges für abgeschlossene Module
- **📜 Zertifikate** - Zertifikat bei 50% Fortschritt
- **📈 Live-Statistiken** - Vergleich mit anderen Teilnehmer:innen
- **💾 Firebase-Integration** - Automatische Speicherung des Fortschritts
- **📱 Responsive Design** - Funktioniert auf Desktop, Tablet und Smartphone

## 🚀 Installation

### 1. Voraussetzungen

- Node.js 18 oder höher
- npm oder yarn
- Firebase-Account (kostenlos)

### 2. Projekt Setup

```bash
# Repository klonen oder Dateien kopieren
git clone <your-repo-url>
cd abstimmung-lernumgebung

# Abhängigkeiten installieren
npm install
```

### 3. Firebase Setup

1. **Firebase-Projekt erstellen:**
   - Gehen Sie zu https://console.firebase.google.com
   - Klicken Sie auf "Projekt hinzufügen"
   - Folgen Sie den Anweisungen

2. **Firebase Authentication aktivieren:**
   - Gehen Sie zu Authentication > Sign-in method
   - Aktivieren Sie "E-Mail/Passwort"

3. **Firestore Database erstellen:**
   - Gehen Sie zu Firestore Database
   - Klicken Sie auf "Datenbank erstellen"
   - Wählen Sie "Im Testmodus starten" (später auf Produktionsmodus umstellen!)

4. **Firebase-Konfiguration:**
   - Gehen Sie zu Projekteinstellungen > Allgemein
   - Scrollen Sie zu "Ihre Apps" > Web-App hinzufügen
   - Kopieren Sie die Konfigurationsdaten

5. **`.env.local` erstellen:**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore-Regeln

Ersetzen Sie die Standard-Firestore-Regeln mit:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Benutzer kann nur seine eigenen Daten lesen und schreiben
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Alle authentifizierten Benutzer können alle User-Dokumente lesen (für Statistiken)
      allow read: if request.auth != null;
    }
  }
}
```

### 5. H5P-Dateien einrichten

1. **Verzeichnisstruktur erstellen:**

```
public/
  └── h5p/
      ├── grundlagen.html
      ├── vertiefung.html
      ├── 68fb34ef86d593ad28dc1d00.html  (Ihre Umfrage)
      ├── procontra.html
      └── lernkontrolle.html
```

2. **H5P-Dateien kopieren:**
   - Kopieren Sie Ihre H5P-HTML-Dateien in den `/public/h5p/` Ordner
   - Die Datei `68fb34ef86d593ad28dc1d00.html` ist bereits als Umfrage-Lernset konfiguriert

3. **H5P xAPI aktivieren:**
   - Stellen Sie sicher, dass Ihre H5P-Inhalte xAPI-Events senden
   - Die meisten H5P-Typen unterstützen dies automatisch

### 6. Projektstruktur

```
src/
├── pages/
│   ├── index.tsx                    # Login-Seite
│   ├── dashboard.tsx                # Hauptdashboard
│   └── modules/
│       └── [moduleId].tsx          # Dynamische Modul-Seiten
├── lib/
│   ├── firebase.ts                  # Firebase-Konfiguration
│   └── abstimmungModuleContent.ts  # Modul-Definitionen
└── components/
    └── (weitere Komponenten)

public/
└── h5p/
    └── (H5P-HTML-Dateien)
```

## 🎯 Verwendung

### Start der Entwicklungsumgebung

```bash
npm run dev
```

Die App läuft auf http://localhost:3000

### Registrierung

1. Öffnen Sie http://localhost:3000
2. Klicken Sie auf "Registrieren"
3. Geben Sie ein:
   - **Lernname**: Ihr Name oder Nickname
   - **Lerncode**: Ein eindeutiger Code (z.B. Matrikelnummer)
   - **Passwort**: Mindestens 6 Zeichen
4. Klicken Sie auf "Registrieren"

### Navigation

- **Dashboard**: Übersicht aller Lernsets und Fortschritt
- **Lernsets**: Klicken Sie auf ein Lernset, um es zu starten
- **H5P-Module**: Bearbeiten Sie die interaktiven Inhalte
- **Automatische Speicherung**: Ihr Fortschritt wird automatisch gespeichert
- **Badges**: Erhalten Sie Badges für abgeschlossene Module
- **Zertifikat**: Bei 50% Fortschritt verfügbar

## 📊 H5P-Integration erklärt

### Wie funktioniert die H5P-Integration?

1. **HTML-Einbettung**: H5P-Inhalte werden als iframes eingebettet
2. **xAPI-Events**: H5P sendet Events (completed, progressed, answered)
3. **Event-Listener**: Die App fängt diese Events ab
4. **Automatische Speicherung**: Punkte und Fortschritt werden in Firebase gespeichert

### Unterstützte H5P-Events

```javascript
// Completion Event
{
  type: 'completed',
  data: {
    score: 85,
    maxScore: 100,
    percentage: 85
  }
}

// Progress Event
{
  type: 'progress',
  data: {
    progress: 50
  }
}

// Scored Event
{
  type: 'scored',
  data: {
    score: 42,
    maxScore: 50,
    percentage: 84
  }
}
```

### H5P-Typen die funktionieren

- ✅ Interactive Video
- ✅ Quiz (Question Set)
- ✅ Course Presentation
- ✅ Dialog Cards
- ✅ Drag and Drop
- ✅ Fill in the Blanks
- ✅ Multiple Choice
- ✅ True/False Question
- ✅ Summary
- ✅ Timeline
- ✅ Und viele mehr...

## 🎨 Anpassungen

### Farben ändern

Das Design verwendet türkise Farben. Um diese zu ändern, ersetzen Sie in den Komponenten:

```javascript
// Von Türkis zu einer anderen Farbe:
from-teal-500 to-cyan-600  →  from-blue-500 to-indigo-600
text-teal-600             →  text-blue-600
border-teal-500           →  border-blue-500
```

### Module hinzufügen

1. **In `abstimmungModuleContent.ts`:**

```typescript
export const moduleData = {
  // ...bestehende Module
  neuesModul: {
    id: 'neuesModul',
    title: '6. Neues Modul',
    description: 'Beschreibung des neuen Moduls',
    estimatedTime: '15 Min',
    maxPoints: 100,
    type: 'h5p',
    h5pUrl: '/h5p/neues-modul.html'
  }
}

// Module zur Learning Area hinzufügen
export const learningAreas = {
  abstimmung2026: {
    // ...
    modules: ['grundlagen', 'vertiefung', 'umfrage', 'procontra', 'lernkontrolle', 'neuesModul']
  }
}
```

2. **H5P-Datei hinzufügen:**
   - Kopieren Sie `neues-modul.html` nach `/public/h5p/`

### Punktesystem anpassen

In `abstimmungModuleContent.ts` können Sie die `maxPoints` für jedes Modul ändern:

```typescript
grundlagen: {
  maxPoints: 150,  // Statt 100
  // ...
}
```

## 📈 Statistiken und Auswertung

### Verfügbare Statistiken

- **Gesamtfortschritt**: Prozentuale Angabe
- **Punkte**: Erreichte vs. Maximale Punkte
- **Abgeschlossene Module**: Anzahl
- **Durchschnittswerte**: Vergleich mit anderen Teilnehmern
- **Zufriedenheitsbewertung**: Nach Feedback
- **Beliebtestes Modul**: Community-Favorit
- **Weiterempfehlungsrate**: Prozentangabe

### Feedback-System

Nach Abschluss aller Module können Teilnehmer:
- Gesamtzufriedenheit bewerten (1-5 Sterne)
- Lieblingsmodul auswählen
- Weiterempfehlungsbereitschaft angeben

## 🔒 Sicherheit

### Produktions-Deployment

Vor dem Produktions-Deployment:

1. **Firestore-Regeln verschärfen:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Für Statistiken
      
      // Verhindere Manipulation
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.lernname == resource.data.lernname
        && request.resource.data.code == resource.data.code;
    }
  }
}
```

2. **Environment Variables sichern:**
   - Verwenden Sie echte Umgebungsvariablen
   - Fügen Sie `.env.local` zu `.gitignore` hinzu

3. **Authentication Rate Limiting:**
   - Aktivieren Sie in Firebase Console

## 🐛 Troubleshooting

### H5P-Events werden nicht erfasst

**Problem**: Punkte werden nicht automatisch gespeichert

**Lösung**:
1. Prüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Stellen Sie sicher, dass H5P xAPI-Events sendet
3. Prüfen Sie die iframe-Sandbox-Attribute:
   ```javascript
   sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
   ```

### Firebase-Verbindungsfehler

**Problem**: "Firebase: Error (auth/operation-not-allowed)"

**Lösung**:
1. Gehen Sie zu Firebase Console > Authentication
2. Aktivieren Sie "E-Mail/Passwort" als Anmeldemethode

### Module werden nicht angezeigt

**Problem**: Dashboard zeigt keine Module

**Lösung**:
1. Prüfen Sie, ob `moduleData` in `abstimmungModuleContent.ts` korrekt definiert ist
2. Prüfen Sie die Browser-Konsole auf Importfehler
3. Stellen Sie sicher, dass Firebase initialisiert ist

## 📝 Lizenz

Dieses Projekt ist für Bildungszwecke erstellt.

## 🤝 Unterstützung

Bei Fragen oder Problemen:
1. Prüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Prüfen Sie die Firebase-Konsole für Backend-Fehler
3. Stellen Sie sicher, dass alle H5P-Dateien korrekt im `/public/h5p/` Ordner liegen

## 🎓 Credits

Basierend auf dem Jahresrückblick-Dashboard-Konzept, angepasst für Abstimmungs-Lernumgebungen mit vollständiger H5P-Integration.
