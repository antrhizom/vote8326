# 📄 H5P-Datei einbetten: aussagenProBargeld.h5p

## ✅ Was Sie haben:
- `aussagenProBargeld.h5p` - Eine H5P Summary-Aufgabe

## 🎯 Was Sie tun müssen:

### Schritt 1: H5P in HTML konvertieren

H5P-Dateien (.h5p) müssen als HTML exportiert werden, um sie in die Website einzubetten.

**Option A: Über h5p.org (empfohlen)**

1. Gehen Sie zu: https://h5p.org
2. Registrieren Sie sich kostenlos (falls noch nicht geschehen)
3. Klicken Sie auf "Create new content" oder "Content" → "Add new"
4. Wählen Sie "Upload" und laden Sie `aussagenProBargeld.h5p` hoch
5. Nach dem Upload, klicken Sie auf "Reuse"
6. Wählen Sie "Download as .h5p file" ODER "Get embed code"
7. Wenn Sie embed code wählen, kopieren Sie den gesamten HTML-Code

**Option B: Mit H5P Standalone Player**

1. Laden Sie den H5P Standalone Player herunter:
   https://github.com/tunapanda/h5p-standalone
2. Folgen Sie den Anweisungen zum Erstellen einer HTML-Datei

### Schritt 2: HTML-Datei erstellen

Speichern Sie den HTML-Code als: **`aussagenProBargeld.html`**

### Schritt 3: Datei ins Projekt kopieren

Kopieren Sie die HTML-Datei nach:
```
public/h5p/aussagenProBargeld.html
```

Ihre Struktur sollte so aussehen:
```
public/
└── h5p/
    ├── 68fb34ef86d593ad28dc1d00.html  ← (bereits vorhanden)
    └── aussagenProBargeld.html         ← (neu hinzufügen)
```

### Schritt 4: Code anpassen

Öffnen Sie: `src/pages/custom-modules/procontra.tsx`

Suchen Sie nach:
```tsx
<div className="border-2 border-dashed border-teal-300 rounded-lg p-8 bg-teal-50 text-center">
```

Ersetzen Sie diesen gesamten `<div>` Block mit:
```tsx
<iframe
  ref={h5pRef}
  src="/h5p/aussagenProBargeld.html"
  className="w-full border-2 border-gray-200 rounded-lg"
  style={{ minHeight: '500px', height: '600px' }}
  title="H5P Aufgabe - Aussagen zur Bargeld-Initiative"
  allow="autoplay; fullscreen"
  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
/>
```

### Schritt 5: Server neu starten

```bash
# Ctrl+C zum Stoppen
npm run dev
```

### Schritt 6: Testen!

1. Gehen Sie zu: http://localhost:3000
2. Melden Sie sich an
3. Klicken Sie auf "3. Pro- und Contra"
4. Das Video und die H5P-Aufgabe sollten jetzt funktionieren!

---

## 📤 Für GitHub

**Datei:** `aussagenProBargeld.html` (NICHT die .h5p Datei!)

**Wo hochladen:**
```
Ihr-Repository/
└── public/
    └── h5p/
        └── aussagenProBargeld.html
```

**Speichertitel für GitHub:**
- Dateiname: `aussagenProBargeld.html`
- Commit message: "Add H5P task for Pro-Contra module"

---

## ⚠️ Wichtig:

### ✅ Was Sie auf GitHub hochladen:
- `aussagenProBargeld.html` (die konvertierte HTML-Datei)

### ❌ Was Sie NICHT hochladen:
- `aussagenProBargeld.h5p` (die Original-H5P-Datei)

**Warum?**
- Die .h5p Datei funktioniert nicht direkt im Browser
- Sie muss erst als HTML exportiert werden
- Die HTML-Version enthält alles Notwendige

---

## 🔧 Troubleshooting

### Problem: H5P wird nicht angezeigt

1. Prüfen Sie, ob die Datei in `public/h5p/` liegt:
   ```bash
   ls public/h5p/
   ```
   Sie sollten sehen: `aussagenProBargeld.html`

2. Prüfen Sie den Dateinamen im Code (muss exakt übereinstimmen!)

3. Server neu starten: `npm run dev`

4. Browser-Cache leeren: Ctrl+Shift+R

### Problem: Punkte werden nicht gespeichert

1. Öffnen Sie Browser-Konsole (F12)
2. Schauen Sie, ob Fehler angezeigt werden
3. H5P Summary sendet automatisch xAPI-Events - das sollte funktionieren!

---

## 💡 Alternative: Direktes Einbetten ohne Konvertierung

Falls die Konvertierung Probleme macht, können Sie auch:

1. Die H5P-Datei auf einen H5P-Server hochladen (z.B. h5p.org)
2. Den Embed-Code von dort verwenden
3. Dann im iframe direkt die externe URL einbetten

**Beispiel:**
```tsx
<iframe
  src="https://h5p.org/h5p/embed/IHRE_CONTENT_ID"
  ...
/>
```

Aber: Die lokale Variante ist besser, da sie offline funktioniert!

---

## ✅ Zusammenfassung

1. **Konvertieren**: `aussagenProBargeld.h5p` → `aussagenProBargeld.html`
2. **Kopieren**: Nach `public/h5p/aussagenProBargeld.html`
3. **Code anpassen**: iframe src auf `/h5p/aussagenProBargeld.html` setzen
4. **GitHub**: Nur die `.html` Datei hochladen
5. **Testen**: npm run dev → Browser öffnen

**Speichertitel für GitHub:** `aussagenProBargeld.html`

---

Viel Erfolg! 🚀
