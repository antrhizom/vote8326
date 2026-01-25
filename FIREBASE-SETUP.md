# 🔥 Firebase Setup - AKTUALISIERT (nur Code, kein Passwort!)

## Wichtige Änderung:
Das System verwendet jetzt **Anonymous Authentication** mit Code-basiertem Login!
**KEIN Email/Passwort mehr nötig!**

## Firebase einrichten:

### 1. Projekt erstellen:
1. https://console.firebase.google.com
2. "Projekt hinzufügen"
3. Name: "Abstimmung Lernumgebung"
4. Google Analytics: NEIN
5. "Projekt erstellen"

### 2. Authentication aktivieren:
1. Im linken Menü: **"Authentication"**
2. **"Get started"** klicken
3. **"Anonymous"** wählen und aktivieren ✅
4. ~~"Email/Password" - NICHT MEHR NÖTIG!~~
5. "Speichern"

### 3. Firestore erstellen:
1. Im linken Menü: "Firestore Database"
2. "Datenbank erstellen"
3. **"Im Testmodus starten"** wählen
4. Standort: "eur3 (Europe)"
5. "Aktivieren"

### 4. Firestore-Regeln setzen:
1. In Firestore → "Regeln"
2. Ersetzen Sie die Regeln mit:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Jeder authentifizierte Benutzer kann seinen eigenen Eintrag lesen/schreiben
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Alle authentifizierten Benutzer können alle User-Dokumente lesen (für Statistiken)
      allow read: if request.auth != null;
    }
  }
}
```

3. "Veröffentlichen" klicken

### 5. Firebase-Config holen:
1. Zahnrad-Symbol ⚙️ → "Projekteinstellungen"
2. Runterscrollen zu "Ihre Apps"
3. Klicken Sie auf: </> (Web-Symbol)
4. App-Spitzname: "Abstimmung Web"
5. "App registrieren"
6. Kopieren Sie die Config-Werte

### 6. .env.local erstellen:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ihr-projekt.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ihr-projekt-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ihr-projekt.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:...
```

## ✅ So funktioniert es jetzt:

### Registrierung:
1. User klickt "Registrieren"
2. System generiert 6-stelligen Code (z.B. "742851")
3. User notiert sich den Code
4. User gibt Lernname ein
5. System erstellt Account mit **Anonymous Auth**
6. Fertig! Kein Passwort nötig!

### Login:
1. User gibt 6-stelligen Code ein
2. System findet User in Firestore (via Code-Suche)
3. System meldet User mit **Anonymous Auth** an
4. Fertig!

## 🔐 Sicherheit:

- Jeder User hat einen eindeutigen 6-stelligen Code
- Codes werden in Firestore gespeichert
- Firebase Anonymous Auth für Authentifizierung
- Firestore-Regeln schützen User-Daten

## 📝 Vorteile:

✅ Kein Passwort vergessen!
✅ Einfacher für Schüler/Studenten
✅ Schnellere Registrierung
✅ Codes können leicht weitergegeben werden (z.B. im Klassenzimmer)
