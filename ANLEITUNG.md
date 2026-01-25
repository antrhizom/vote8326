# 🚀 Abstimmungs-Lernumgebung - EINFACHE ANLEITUNG

## 📦 Schritt 1: ZIP herunterladen und entpacken

Entpacken Sie das ZIP in einen Ordner.

## 🔥 Schritt 2: Firebase einrichten (EINMALIG)

### A) Firebase-Projekt erstellen:
1. Gehen Sie zu: https://console.firebase.google.com
2. Klicken Sie: "Projekt hinzufügen"
3. Name: "Abstimmung Lernumgebung"
4. Google Analytics: NEIN (ausschalten)
5. "Projekt erstellen" klicken

### B) Authentication aktivieren:
1. Im linken Menü: "Authentication"
2. "Get started" klicken
3. **"Anonymous"** wählen und aktivieren (Schalter auf AN) ✅
4. "Speichern"

**WICHTIG:** Wir verwenden Anonymous Auth, NICHT Email/Password!

### C) Firestore erstellen:
1. Im linken Menü: "Firestore Database"
2. "Datenbank erstellen"
3. "Im Testmodus starten" wählen
4. Standort: "eur3 (Europe)" wählen
5. "Aktivieren"

### D) Firebase-Config holen:
1. Oben links: Zahnrad-Symbol ⚙️ → "Projekteinstellungen"
2. Runterscrollen zu "Ihre Apps"
3. Klicken Sie auf: </> (Web-Symbol)
4. App-Spitzname: "Abstimmung Web"
5. "App registrieren" (KEIN Firebase Hosting!)
6. **WICHTIG:** Kopieren Sie diese Werte:

```
apiKey: "AIza..."
authDomain: "..."
projectId: "..."
storageBucket: "..."
messagingSenderId: "..."
appId: "..."
```

### E) .env.local Datei erstellen:
1. Öffnen Sie den Projekt-Ordner
2. Erstellen Sie eine neue Datei: `.env.local`
3. Fügen Sie ein (mit IHREN Werten von oben):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ihr-projekt.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ihr-projekt-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ihr-projekt.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:...
```

4. **Speichern Sie die Datei!**

## 💻 Schritt 3: Projekt starten

### Windows (PowerShell):
```powershell
cd C:\Pfad\zum\abstimmung-neu
npm install
npm run dev
```

### Mac/Linux (Terminal):
```bash
cd /pfad/zum/abstimmung-neu
npm install
npm run dev
```

Warten Sie, bis Sie sehen:
```
✓ Ready in 2.3s
- Local: http://localhost:3000
```

## 🌐 Schritt 4: Im Browser öffnen

1. Öffnen Sie Browser
2. Gehen Sie zu: **http://localhost:3000**
3. Drücken Sie: **Ctrl+Shift+R** (Hard Refresh!)

## ✅ Fertig!

Sie sollten jetzt die Login-Seite mit türkisem Design sehen!

---

## 📤 Auf GitHub hochladen

### Methode: Drag & Drop (EINFACHSTE!)

1. **GitHub.com öffnen** → Anmelden
2. **"New repository"** klicken
3. **Name:** abstimmung-lernumgebung
4. **Private** wählen
5. **NICHTS ankreuzen!**
6. **"Create repository"** klicken
7. Auf der nächsten Seite:
   - **"uploading an existing file"** klicken
   - **ALLE Dateien** aus dem entpackten Ordner reinziehen
   - **WICHTIG:** `.env.local` NICHT hochladen! (wird automatisch ignoriert)
   - **"Commit changes"** klicken

**Fertig!** 🎉

---

## 🆘 Bei Problemen

### Problem: "Cannot find module '@/styles/globals.css'"
**Lösung:** Prüfen Sie, ob die Datei `src/styles/globals.css` existiert

### Problem: "Firebase Error: invalid-api-key"
**Lösung:** 
1. Prüfen Sie, ob `.env.local` existiert
2. Prüfen Sie, ob die Firebase-Keys richtig sind (keine Leerzeichen!)
3. Server neu starten: Ctrl+C, dann `npm run dev`

### Problem: Kein Design (nur Text)
**Lösung:**
1. `npm install` ausführen
2. Server neu starten
3. Im Browser: Ctrl+Shift+R drücken

---

## 📞 Wichtige Befehle

```bash
npm install          # Dependencies installieren
npm run dev          # Dev-Server starten
npm run build        # Production-Build erstellen
```

**Server stoppen:** Ctrl+C im Terminal

---

## 🎓 5 Lernsets sind vorbereitet:

1. Grundlagen: Info Bund und Medien
2. Vertiefung interaktiv
3. Umfrage Lernset (Ihre H5P-Datei!)
4. Pro- und Contra
5. Lernkontrolle

Weitere H5P-Dateien können Sie in `public/h5p/` hinzufügen!

---

**Viel Erfolg! 🚀**
