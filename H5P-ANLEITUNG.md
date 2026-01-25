# 📚 H5P-Module hinzufügen

## ✅ Aktueller Stand:

**Funktioniert bereits:**
- ✅ Modul 3: "Umfrage Lernset" (`68fb34ef86d593ad28dc1d00.html`)

**Noch ohne H5P-Inhalte:**
- ⏳ Modul 1: "Grundlagen: Info Bund und Medien"
- ⏳ Modul 2: "Vertiefung interaktiv"
- ⏳ Modul 4: "Pro- und Contra"
- ⏳ Modul 5: "Lernkontrolle"

---

## 🎯 So fügen Sie weitere H5P-Module hinzu:

### Schritt 1: H5P-Datei vorbereiten

1. **Erstellen Sie Ihr H5P-Modul** auf https://h5p.org oder einer H5P-Plattform
2. **Exportieren Sie es als HTML-Datei**
3. **Benennen Sie die Datei** passend:
   - `grundlagen.html` für Modul 1
   - `vertiefung.html` für Modul 2
   - `procontra.html` für Modul 4
   - `lernkontrolle.html` für Modul 5

### Schritt 2: Datei in das Projekt kopieren

Kopieren Sie die HTML-Datei nach:
```
public/h5p/
```

Beispiel:
```
public/
└── h5p/
    ├── 68fb34ef86d593ad28dc1d00.html  ✅ (bereits da)
    ├── grundlagen.html                 ⏳ (hinzufügen)
    ├── vertiefung.html                 ⏳ (hinzufügen)
    ├── procontra.html                  ⏳ (hinzufügen)
    └── lernkontrolle.html              ⏳ (hinzufügen)
```

### Schritt 3: Server neu starten

```bash
# Ctrl+C zum Stoppen
npm run dev
```

### Schritt 4: Testen!

Gehen Sie zum Dashboard und klicken Sie auf das jeweilige Modul.

---

## 📋 Dateinamen-Referenz

Die Dateinamen sind in `src/lib/abstimmungModuleContent.ts` definiert:

```typescript
grundlagen: {
  h5pUrl: '/h5p/grundlagen.html'  // ← Dateiname hier!
}

vertiefung: {
  h5pUrl: '/h5p/vertiefung.html'
}

umfrage: {
  h5pUrl: '/h5p/68fb34ef86d593ad28dc1d00.html'  // ✅ Funktioniert!
}

procontra: {
  h5pUrl: '/h5p/procontra.html'
}

lernkontrolle: {
  h5pUrl: '/h5p/lernkontrolle.html'
}
```

---

## 💡 Platzhalter-Nachricht

Wenn ein Modul keine H5P-Datei hat, sehen Benutzer:

```
┌─────────────────────────────────────┐
│  🔔  H5P-Inhalte folgen bald        │
│                                      │
│  Dieses Modul ist in Vorbereitung.  │
│  Die interaktiven H5P-Inhalte       │
│  werden in Kürze verfügbar sein.    │
│                                      │
│  💡 Tipp: Das Modul "3. Umfrage     │
│  Lernset" ist bereits verfügbar!    │
└─────────────────────────────────────┘
```

---

## 🎨 H5P-Typen die funktionieren:

Alle H5P-Content-Typen mit **xAPI-Support** funktionieren:

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
- ✅ Single Choice Set
- ✅ Mark the Words

---

## 🔧 Troubleshooting

### Problem: H5P-Datei wird nicht geladen

**Lösung:**
1. Prüfen Sie, ob die Datei in `public/h5p/` liegt
2. Prüfen Sie den Dateinamen (exakt wie in `abstimmungModuleContent.ts`)
3. Server neu starten: `npm run dev`
4. Browser-Cache leeren: Ctrl+Shift+R

### Problem: H5P funktioniert, aber Punkte werden nicht gespeichert

**Lösung:**
- Stellen Sie sicher, dass Ihr H5P-Modul **xAPI-Events** sendet
- Öffnen Sie die Browser-Konsole (F12) und prüfen Sie auf Fehler
- Die meisten H5P-Content-Typen senden automatisch xAPI-Events

---

## 🚀 Empfehlung für Sie:

1. **Testen Sie zuerst Modul 3** (Umfrage) - funktioniert bereits! ✅
2. **Erstellen Sie nach und nach** die anderen H5P-Module
3. **Kopieren Sie die Dateien** in `public/h5p/`
4. **Fertig!**

---

## 📞 Weitere Hilfe

Bei Fragen zu H5P:
- H5P.org: https://h5p.org/content-types-and-applications
- H5P Tutorial: https://h5p.org/documentation

Bei technischen Problemen:
- Prüfen Sie die Browser-Konsole (F12)
- Prüfen Sie das Terminal wo `npm run dev` läuft
