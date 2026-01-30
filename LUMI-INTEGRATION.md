# ✅ Lumi H5P ist bereits eingebettet!

## 🎉 Was bereits funktioniert:

Der Lumi iframe ist **bereits eingebettet** in der Pro & Contra Seite!

```
Ihr Lumi Content: UZmjXP
URL: https://app.lumi.education/api/v1/run/UZmjXP/embed
```

---

## 📊 Wie die Datenerfassung funktioniert:

### Automatische Punkteerfassung:

1. **User bearbeitet H5P-Aufgabe** in Lumi iframe
2. **Lumi sendet xAPI-Event** via `postMessage`
3. **Ihr Code fängt das Event ab:**
   ```javascript
   window.addEventListener('message', (event) => {
     if (event.origin === 'https://app.lumi.education') {
       // xAPI Statement wird verarbeitet
       const score = event.data.statement.result.score.raw
       const maxScore = event.data.statement.result.score.max
       // → Punkte werden berechnet und gespeichert
     }
   })
   ```
4. **Punkte werden in Firebase gespeichert**
5. **Dashboard wird aktualisiert**

---

## 🔍 Was erfasst wird:

### xAPI Events die gesendet werden:

- ✅ `completed` - Wenn Aufgabe abgeschlossen
- ✅ `answered` - Bei jeder Antwort
- ✅ `score.raw` - Erreichte Punkte
- ✅ `score.max` - Maximale Punkte

### Was in Firebase gespeichert wird:

```javascript
{
  procontra: {
    completed: true,          // ✅ Modul abgeschlossen
    score: 85,                // ✅ Erreichte Punkte (normalisiert auf 100)
    progress: 100,            // ✅ 50% Video + 50% H5P
    videoWatched: true,       // ✅ Video angeschaut
    lastUpdated: "2026-01-29T..."
  }
}
```

---

## 🎯 Testing - So prüfen Sie, ob es funktioniert:

### Schritt 1: Browser-Konsole öffnen

1. Öffnen Sie die Pro & Contra Seite
2. Drücken Sie **F12** (Entwicklertools)
3. Gehen Sie zum **Console**-Tab

### Schritt 2: H5P-Aufgabe bearbeiten

Wenn Sie die Aufgabe bearbeiten, sollten Sie sehen:

```
H5P xAPI Event received: http://adlnet.gov/expapi/verbs/answered
Score received: 85 / 100 → 85
```

### Schritt 3: Nach Abschluss

Nach dem Abschließen der Aufgabe:

```
H5P xAPI Event received: http://adlnet.gov/expapi/verbs/completed
Score received: 90 / 100 → 90
✅ Module completed!
```

---

## 🔧 Wie es technisch funktioniert:

### 1. Lumi Resizer Script

Das Script wird automatisch geladen in `_app.tsx`:

```typescript
useEffect(() => {
  const script = document.createElement('script')
  script.src = 'https://app.lumi.education/api/v1/h5p/core/js/h5p-resizer.js'
  document.body.appendChild(script)
}, [])
```

**Zweck:** Passt die iframe-Höhe automatisch an den Inhalt an.

### 2. xAPI Event Listener

In `procontra.tsx`:

```typescript
useEffect(() => {
  const handleH5PEvent = (event: MessageEvent) => {
    // Nur Events von Lumi akzeptieren
    if (event.origin !== 'https://app.lumi.education') return
    
    if (event.data && event.data.statement) {
      const statement = event.data.statement
      
      // Score extrahieren
      const score = statement.result?.score?.raw || 0
      const maxScore = statement.result?.score?.max || 100
      
      // Normalisieren auf 100
      const normalizedScore = Math.round((score / maxScore) * 100)
      
      // Speichern
      setH5pScore(normalizedScore)
      setH5pCompleted(true)
      saveProgress(normalizedScore, videoWatched, true)
    }
  }
  
  window.addEventListener('message', handleH5PEvent)
}, [])
```

### 3. Security Check

```typescript
if (event.origin !== 'https://app.lumi.education') return
```

**Wichtig:** Nur Events von Lumi werden akzeptiert, um XSS-Angriffe zu verhindern!

---

## 📈 Punkteberechnung:

### Beispiel 1: H5P gibt 17/20 Punkte

```
raw = 17
max = 20
normalized = (17 / 20) * 100 = 85 Punkte ✅
```

### Beispiel 2: H5P gibt 45/50 Punkte

```
raw = 45
max = 50  
normalized = (45 / 50) * 100 = 90 Punkte ✅
```

### Beispiel 3: H5P gibt direkt 100/100

```
raw = 100
max = 100
normalized = 100 Punkte ✅
```

**Alle Scores werden auf 100 normalisiert!**

---

## ✅ Was automatisch passiert:

1. ✅ **Video-Tracking:** Nach 30 Sekunden wird Video als "angeschaut" markiert
2. ✅ **H5P-Tracking:** Sobald completed-Event kommt → Punkte gespeichert
3. ✅ **Fortschritt:** 50% Video + 50% H5P = 100% Modul
4. ✅ **Badge:** Bei Abschluss wird automatisch Badge erstellt
5. ✅ **Dashboard:** Zeigt aktualisierte Punkte und Fortschritt
6. ✅ **Gesamtfortschritt:** Wird für alle Module berechnet

---

## 🚀 Fertig zum Testen!

### So testen Sie:

```bash
# 1. Projekt starten
npm run dev

# 2. Browser öffnen
http://localhost:3000

# 3. Anmelden

# 4. "3. Pro- und Contra" klicken

# 5. Video schauen (mind. 30 Sek)

# 6. H5P-Aufgabe bearbeiten

# 7. Prüfen:
- Browser-Konsole (F12) → Sehen Sie xAPI Events?
- Nach Abschluss → Zeigt es Punkte an?
- Dashboard → Wird Fortschritt angezeigt?
```

---

## 🆘 Troubleshooting

### Problem: Keine xAPI Events in der Konsole

**Mögliche Ursachen:**

1. **Lumi iframe nicht geladen**
   - Prüfen Sie Network-Tab (F12)
   - Ist `https://app.lumi.education/...` geladen?

2. **CORS-Problem**
   - Lumi sollte CORS erlauben
   - Normalerweise kein Problem bei Lumi

3. **Event-Listener nicht registriert**
   - Prüfen Sie, ob die Seite geladen ist
   - F5 drücken zum Neu-Laden

### Problem: Punkte werden nicht gespeichert

**Lösung:**

1. **Firebase-Verbindung prüfen:**
   ```bash
   # Ist .env.local korrekt?
   cat .env.local
   ```

2. **Browser-Konsole prüfen:**
   - Gibt es Firebase-Fehler?
   - Sind Sie angemeldet?

3. **Firestore-Regeln prüfen:**
   - Erlauben die Regeln Schreibzugriff?

### Problem: Video wird nicht als "angeschaut" markiert

**Info:** 
- Es gibt einen 30-Sekunden-Timer
- Das ist eine Vereinfachung
- In Production sollten Sie echtes Video-Tracking implementieren

---

## 💡 Tipps

1. **Testing:** Öffnen Sie immer die Browser-Konsole (F12) beim Testen
2. **Lumi Content:** Sie können jederzeit neuen Content auf Lumi erstellen
3. **Embed Code ändern:** Einfach die src im iframe ändern
4. **Offline:** Lumi embed benötigt Internetverbindung (anders als lokale HTML)

---

## 🎓 Nächste Schritte

### Für die anderen Module:

Sie können das gleiche System für andere Module verwenden:

1. **Lumi Content erstellen**
2. **Embed Code kopieren**  
3. **iframe in Modul-Seite einbauen**
4. **xAPI Events werden automatisch erfasst!**

Das gleiche Event-Listening funktioniert für **alle** Module! ✅

---

**Alles ist bereit zum Testen! 🚀**

Öffnen Sie die Browser-Konsole und schauen Sie zu, wie die xAPI-Events reinkommen! 📊
