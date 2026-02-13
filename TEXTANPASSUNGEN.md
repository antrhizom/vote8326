# Textanpassungen - Übersicht der Dateien

Dieses Dokument zeigt, wo Textinhalte der einzelnen Module angepasst werden können.

---

## Projektstruktur

```
src/pages/
├── dashboard.tsx                    → Dashboard (Hauptübersicht)
├── custom-modules/
│   ├── ausgangslage.tsx            → Modul 1: Ausgangslage
│   ├── grundlagen.tsx              → Modul 2: Grundlagen
│   ├── procontra.tsx               → Modul 3: Pro & Contra
│   ├── vertiefung.tsx              → Modul 4: Vertiefung
│   └── spielerisch.tsx             → Modul 5: Spielerisch lernen
├── components/
│   ├── MillionenSpiel.tsx          → Quiz-Fragen Millionenspiel
│   └── Lernkontrolle.tsx           → Quiz-Fragen Lernkontrolle
```

---

## 1. Dashboard
**Datei:** `src/pages/dashboard.tsx`

| Zeile ca. | Inhalt |
|-----------|--------|
| 947-953 | `MODULE_DURATIONS` - Zeitangaben pro Modul |
| 955-961 | `MODULE_GOALS` - Lernziele pro Modul |
| 26-50 | `TUTORIAL_STEPS` - Dashboard-Tutorial Texte |

---

## 2. Modul 1: Ausgangslage
**Datei:** `src/pages/custom-modules/ausgangslage.tsx`

| Zeile ca. | Inhalt |
|-----------|--------|
| 12-62 | `TUTORIAL_STEPS` - Tutorial-Schritte |
| 102-140 | `getReadingTargets()` - Lesehilfe-Texte |
| 750-780 | Intro-Text auf Übersichtsseite |
| 800-850 | Info-Boxen (Gegenvorschlag, Wer profitiert) |
| 1035-1045 | Umfrage-Aufgabentext |
| 1130-1140 | Ergebnisse-Aufgabentext |
| 1200-1400 | Referendum-Kapitel (Karten, Timeline, Quiz) |
| 1500-1700 | Video-Kapitel (Flipcards, Quiz) |

---

## 3. Modul 2: Grundlagen
**Datei:** `src/pages/custom-modules/grundlagen.tsx`

| Zeile ca. | Inhalt |
|-----------|--------|
| 19-22 | `SRF_EMBED_URLS` - Audio-URLs |
| 25-32 | `RENDEZVOUS_SEQUENCE` - Reihenfolge Rendez-vous |
| 35-43 | `ECHO_SEQUENCE` - Reihenfolge Echo der Zeit |
| 88-107 | `getReadingTargets()` - Lesehilfe-Texte |

---

## 4. Modul 3: Pro & Contra
**Datei:** `src/pages/custom-modules/procontra.tsx`

| Zeile ca. | Inhalt |
|-----------|--------|
| 20-180 | `SECTIONS[0]` - Bundesrat-Sektion (Video, Slides, Quiz) |
| 182-232 | `SECTIONS[1]` - Befürworter*innen (Timeline, Argumente, Quiz) |
| 235-330 | `SECTIONS[2]` - Gegner*innen (Zitate, Flipcards, Quiz) |
| 330-450 | `SECTIONS[3]` - Kantone/Städte (Karten, Zuordnung) |
| 1215-1230 | `getReadingTargets()` - Lesehilfe-Texte |
| 1465-1480 | Intro-Text auf Übersichtsseite |

---

## 5. Modul 4: Vertiefung
**Datei:** `src/pages/custom-modules/vertiefung.tsx`

| Zeile ca. | Inhalt |
|-----------|--------|
| 19-90 | `TIMELINE_EVENTS` - Historische Ereignisse |
| 93-117 | `HISTORY_QUIZ` - Quiz Geschichte |
| 120-149 | `STEUERZIELE` - Steuer-Werkzeugkasten |
| 152-159 | `PARTY_POSITIONS` - Parteien-Positionen |
| 162-203 | `NEWSPAPER_ARTICLES` - Zeitungsartikel |
| 206-251 | `STEUERZIELE_QUIZ` - Quiz Steuerziele |
| 290-309 | `getReadingTargets()` - Lesehilfe-Texte |
| 715-735 | Intro-Text auf Übersichtsseite |
| 815-845 | Hinweis-Boxen (Paywall, Vorlesen) |

---

## 6. Modul 5: Spielerisch lernen
**Datei:** `src/pages/custom-modules/spielerisch.tsx`

| Zeile ca. | Inhalt |
|-----------|--------|
| 42-46 | `READING_TARGETS` - Lesehilfe-Texte |
| 449-465 | Intro-Text (Quiz-Beschreibung) |

### Quiz-Fragen:
**Datei:** `src/components/MillionenSpiel.tsx`
- Alle Fragen und Antworten des Millionenspiels

**Datei:** `src/components/Lernkontrolle.tsx`
- Alle Fragen, Antworten und Erklärungen der Lernkontrolle

---

## Allgemeine Hinweise

### Gendergerechte Sprache
- Geschlechtsneutrale Begriffe bevorzugen (z.B. "Teilnehmende", "Lernende")
- Bei Doppelformen Sternchen verwenden (z.B. "Befürworter*innen")

### Lesehilfe-Texte
Jedes Modul hat eine `getReadingTargets()` Funktion mit:
- `id` - HTML-Element-ID
- `label` - Kurzer Titel (mit Emoji)
- `description` - Kurzbeschreibung

### Info-Boxen Farben
- Grün (`emerald`) - Aufgaben/Ziele
- Gelb (`amber`) - Hinweise/Tipps
- Blau (`blue`) - Zusatzinfos
- Lila (`purple`) - Highlights

---

*Letzte Aktualisierung: Februar 2026*
