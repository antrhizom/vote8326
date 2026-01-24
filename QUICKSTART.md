# 🚀 Schnellstart-Anleitung

## In 5 Minuten zur fertigen Lernumgebung!

### Schritt 1: Projektstruktur erstellen

Erstellen Sie folgende Verzeichnisstruktur:

```
abstimmung-lernumgebung/
├── src/
│   ├── pages/
│   │   ├── index.tsx                    (← login-page.tsx kopieren)
│   │   ├── dashboard.tsx                (← abstimmung-dashboard.tsx kopieren)
│   │   └── modules/
│   │       └── [moduleId].tsx          (← module-page.tsx kopieren)
│   ├── lib/
│   │   ├── firebase.ts                  (← firebase.ts kopieren)
│   │   └── abstimmungModuleContent.ts  (← abstimmungModuleContent.ts kopieren)
│   └── styles/
│       └── globals.css                  (← globals.css kopieren)
├── public/
│   └── h5p/
│       └── 68fb34ef86d593ad28dc1d00.html  (← Ihre H5P-Datei)
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

### Schritt 2: Dateien kopieren

Kopieren Sie die bereitgestellten Dateien in die entsprechenden Verzeichnisse:

```bash
# Erstellen Sie die Verzeichnisse
mkdir -p src/pages/modules
mkdir -p src/lib
mkdir -p src/styles
mkdir -p public/h5p

# Kopieren Sie die Dateien
cp abstimmung-dashboard.tsx src/pages/dashboard.tsx
cp login-page.tsx src/pages/index.tsx
cp module-page.tsx src/pages/modules/[moduleId].tsx
cp firebase.ts src/lib/firebase.ts
cp abstimmungModuleContent.ts src/lib/abstimmungModuleContent.ts
cp globals.css src/styles/globals.css

# Kopieren Sie Ihre H5P-Datei
cp 68fb34ef86d593ad28dc1d00.html public/h5p/
```

### Schritt 3: Dependencies installieren

```bash
npm install
```

Dies installiert:
- Next.js (React Framework)
- Firebase (Backend & Auth)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- TypeScript

### Schritt 4: Firebase konfigurieren

1. **Firebase-Projekt erstellen:**
   ```
   → https://console.firebase.google.com
   → "Projekt hinzufügen" klicken
   → Projektnamen eingeben
   → Google Analytics (optional)
   ```

2. **Authentication aktivieren:**
   ```
   → Authentication
   → Sign-in method
   → E-Mail/Passwort aktivieren
   ```

3. **Firestore erstellen:**
   ```
   → Firestore Database
   → Datenbank erstellen
   → Standort wählen
   → "Im Testmodus starten"
   ```

4. **Web-App registrieren:**
   ```
   → Projekteinstellungen (⚙️)
   → Ihre Apps → Web (</>) klicken
   → App-Spitzname eingeben
   → Registrieren
   ```

5. **Config kopieren:**
   ```bash
   # .env.local erstellen
   cp .env.example .env.local
   
   # Firebase-Werte eintragen (aus Firebase Console kopieren)
   nano .env.local
   ```

### Schritt 5: Firestore-Regeln setzen

In Firebase Console:
```
→ Firestore Database
→ Regeln
```

Fügen Sie ein:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
  }
}
```

Klicken Sie auf "Veröffentlichen"

### Schritt 6: Starten!

```bash
npm run dev
```

Öffnen Sie: http://localhost:3000

### Schritt 7: Erste Registrierung

1. Klicken Sie auf "Registrieren"
2. Geben Sie ein:
   - **Lernname**: z.B. "Max Mustermann"
   - **Lerncode**: z.B. "12345"
   - **Passwort**: mind. 6 Zeichen
3. Klicken Sie auf "Registrieren"
4. Sie werden automatisch zum Dashboard weitergeleitet

## ✅ Fertig!

Sie haben jetzt eine voll funktionsfähige Lernumgebung mit:
- ✅ Benutzer-Login und -Registrierung
- ✅ Dashboard mit 5 Lernsets
- ✅ H5P-Integration
- ✅ Automatische Punkteerfassung
- ✅ Firebase-Speicherung
- ✅ Badge-System
- ✅ Statistiken

## 🎯 Nächste Schritte

### Weitere H5P-Module hinzufügen

Erstellen Sie weitere H5P-Dateien und fügen Sie sie hinzu:

```bash
# Dateien erstellen
public/h5p/grundlagen.html
public/h5p/vertiefung.html
public/h5p/procontra.html
public/h5p/lernkontrolle.html
```

Die URLs sind bereits in `abstimmungModuleContent.ts` konfiguriert!

### Design anpassen

Farben ändern in den Komponenten:
```
from-teal-500 to-cyan-600  →  from-blue-500 to-indigo-600
```

### Produktions-Deployment

```bash
# Build erstellen
npm run build

# Server starten
npm start

# Oder auf Vercel deployen:
vercel
```

## 🆘 Hilfe?

**H5P-Events werden nicht erfasst?**
- Prüfen Sie Browser-Konsole (F12)
- Stellen Sie sicher, dass H5P xAPI sendet

**Firebase-Fehler?**
- Prüfen Sie `.env.local` Werte
- Stellen Sie sicher, dass Authentication aktiviert ist

**Module werden nicht angezeigt?**
- Prüfen Sie Browser-Konsole
- Stellen Sie sicher, dass Firebase initialisiert ist

## 📚 Weitere Ressourcen

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [H5P.org](https://h5p.org)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Viel Erfolg mit Ihrer Abstimmungs-Lernumgebung! 🎓**
