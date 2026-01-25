# 🎬 Videos und H5P einbetten - Pro & Contra Modul

## ✅ Neue Struktur implementiert!

Das **Pro & Contra** Modul hat jetzt eine spezielle Struktur:

```
1. Einführungstext mit Aufgabenstellung
2. Video 1 → H5P Aufgabe 1
3. Video 2 → H5P Aufgabe 2  
4. Video 3 → H5P Aufgabe 3
```

Alle H5P-Ergebnisse werden **automatisch erfasst und gespeichert**! ✅

---

## 📹 Videos einbetten

### Option 1: YouTube Video

Öffnen Sie: `src/pages/procontra.tsx`

Suchen Sie nach:
```tsx
{/* Video Placeholder 1 */}
<div className="aspect-video bg-gray-900 ...">
```

Ersetzen Sie den kompletten `<div>` mit:
```tsx
<iframe 
  className="w-full aspect-video"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="PRO Argument"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>
```

**VIDEO_ID finden:**
- YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- VIDEO_ID ist: `dQw4w9WgXcQ`

### Option 2: SRF Video

```tsx
<iframe 
  className="w-full aspect-video"
  src="https://www.srf.ch/play/embed?urn=urn:srf:video:YOUR_URN"
  title="SRF Beitrag"
  frameBorder="0"
  allowFullScreen
></iframe>
```

**SRF URN finden:**
1. Gehen Sie zum SRF Video
2. Klicken Sie auf "Teilen"
3. Wählen Sie "Einbetten"
4. Kopieren Sie die URN aus dem Code

---

## 🎯 H5P Aufgaben einbetten

### Schritt 1: H5P-Dateien erstellen

1. Erstellen Sie auf https://h5p.org drei Aufgaben:
   - `procontra-aufgabe1.html` (für Video 1)
   - `procontra-aufgabe2.html` (für Video 2)
   - `procontra-aufgabe3.html` (für Video 3)

2. Exportieren Sie als HTML

3. Kopieren Sie in `public/h5p/`:
```
public/h5p/
├── procontra-aufgabe1.html
├── procontra-aufgabe2.html
└── procontra-aufgabe3.html
```

### Schritt 2: Code anpassen

Öffnen Sie: `src/pages/procontra.tsx`

**Für Aufgabe 1**, suchen Sie:
```tsx
{/* H5P Placeholder 1 */}
<div className="border-2 border-dashed ...">
```

Ersetzen Sie den kompletten Platzhalter-`<div>` mit:
```tsx
<iframe
  ref={h5pRef1}
  src="/h5p/procontra-aufgabe1.html"
  className="w-full border-2 border-gray-200 rounded-lg"
  style={{ minHeight: '400px', height: '500px' }}
  title="H5P Aufgabe 1"
  allow="autoplay; fullscreen"
  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
/>
```

**Wiederholen Sie für Aufgabe 2 und 3:**
- `h5pRef2` und `/h5p/procontra-aufgabe2.html`
- `h5pRef3` und `/h5p/procontra-aufgabe3.html`

---

## 🔥 Automatische Punkteerfassung

Die H5P-Ergebnisse werden **automatisch** erfasst:

1. **User bearbeitet H5P-Aufgabe** → H5P sendet xAPI-Event
2. **Code fängt Event ab** → Extrahiert Punkte
3. **Punkte werden gespeichert** → Firebase wird aktualisiert
4. **Dashboard wird aktualisiert** → User sieht Fortschritt

**Das passiert AUTOMATISCH!** Sie müssen nichts weiter tun! ✅

---

## 📊 Punkteverteilung

Jede H5P-Aufgabe:
- **Max. 100 Punkte**
- Total: **300 Punkte** für Pro & Contra Modul

Die Punkte werden basierend auf dem H5P-Score berechnet:
```
H5P Score: 85/100 → Gespeichert: 85 Punkte
H5P Score: 42/50  → Gespeichert: 84 Punkte (skaliert auf 100)
```

---

## 🎨 Layout anpassen

### Video-Größe ändern:

```tsx
<iframe 
  className="w-full aspect-video"  // ← 16:9 Format
  // oder:
  className="w-full h-96"           // ← Feste Höhe
/>
```

### H5P-Höhe ändern:

```tsx
<iframe
  style={{ minHeight: '400px', height: '600px' }}  // ← Höhe anpassen
/>
```

---

## ✅ Vollständiges Beispiel

So sieht eine Sektion mit echten Videos und H5P aus:

```tsx
{/* VIDEO */}
<div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
  <iframe 
    className="w-full aspect-video"
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
    title="PRO Argument"
    frameBorder="0"
    allowFullScreen
  />
  <div className="p-4 bg-gray-50">
    <p className="text-sm text-gray-600">
      📺 Schauen Sie sich das Video aufmerksam an
    </p>
  </div>
</div>

{/* H5P AUFGABE */}
<div className="bg-white rounded-xl shadow-md p-6">
  <div className="flex items-center gap-3 mb-4">
    <FileQuestion className="h-6 w-6 text-teal-600" />
    <h3 className="text-xl font-bold text-gray-900">Aufgabe 1</h3>
    {h5pScores[0].completed && (
      <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
        ✓ {h5pScores[0].score} Punkte
      </span>
    )}
  </div>
  
  <iframe
    ref={h5pRef1}
    src="/h5p/procontra-aufgabe1.html"
    className="w-full border-2 border-gray-200 rounded-lg"
    style={{ minHeight: '400px' }}
    title="H5P Aufgabe 1"
    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
  />
</div>
```

---

## 🚀 Deployment

Nach dem Einbetten:

```bash
# Server neu starten
npm run dev

# Im Browser testen
http://localhost:3000
→ Dashboard öffnen
→ "4. Pro- und Contra" klicken
→ Videos schauen und Aufgaben bearbeiten!
```

---

## 🆘 Troubleshooting

### Problem: Video wird nicht angezeigt

**Lösung:**
- YouTube: Prüfen Sie, ob das Video "einbettbar" ist (nicht alle Videos erlauben das)
- SRF: Prüfen Sie die URN
- Prüfen Sie die Browser-Konsole (F12) auf Fehler

### Problem: H5P wird nicht geladen

**Lösung:**
1. Prüfen Sie, ob die Datei in `public/h5p/` liegt
2. Prüfen Sie den Dateinamen (muss exakt übereinstimmen)
3. Server neu starten

### Problem: Punkte werden nicht gespeichert

**Lösung:**
1. Öffnen Sie Browser-Konsole (F12)
2. Schauen Sie, ob xAPI-Events gesendet werden
3. Prüfen Sie, ob H5P-Content-Type xAPI unterstützt
4. Die meisten H5P-Typen unterstützen xAPI automatisch!

---

## 💡 Tipps

1. **Testen Sie mit einem Video zuerst**, bevor Sie alle drei einbetten
2. **H5P-Typen mit xAPI:** Quiz, Multiple Choice, Drag & Drop funktionieren am besten
3. **Video-Länge:** 3-5 Minuten pro Video ist optimal
4. **Aufgaben-Schwierigkeit:** Steigern Sie von Aufgabe 1 zu 3

---

**Viel Erfolg beim Einbetten! 🎬📚**
