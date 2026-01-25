#!/bin/bash

# 🚀 Abstimmungs-Lernumgebung - Setup Script
# Dieses Script richtet das Projekt komplett ein

echo "================================================"
echo "🚀 Abstimmungs-Lernumgebung Setup"
echo "================================================"
echo ""

# Schritt 1: Alte Dateien löschen
echo "📝 Schritt 1: Lösche alte Dateien..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json
echo "✅ Alte Dateien gelöscht"
echo ""

# Schritt 2: Dependencies installieren
echo "📦 Schritt 2: Installiere Dependencies..."
npm install
echo "✅ Dependencies installiert"
echo ""

# Schritt 3: Firebase-Konfiguration prüfen
echo "🔥 Schritt 3: Prüfe Firebase-Konfiguration..."
if [ ! -f .env.local ]; then
    echo "⚠️  WARNUNG: .env.local nicht gefunden!"
    echo "   Bitte erstellen Sie die Datei .env.local mit Ihren Firebase-Credentials"
    echo "   Kopieren Sie .env.example und füllen Sie die Werte aus"
    echo ""
else
    echo "✅ .env.local gefunden"
    echo ""
fi

# Schritt 4: Build-Test
echo "🔨 Schritt 4: Teste Build-Prozess..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build erfolgreich"
    echo ""
else
    echo "❌ Build fehlgeschlagen"
    echo "   Bitte prüfen Sie die Fehler oben"
    exit 1
fi

# Schritt 5: Fertig
echo "================================================"
echo "✅ Setup abgeschlossen!"
echo "================================================"
echo ""
echo "🚀 Starten Sie den Dev-Server mit:"
echo "   npm run dev"
echo ""
echo "Dann öffnen Sie: http://localhost:3000"
echo ""
echo "Bei Problemen:"
echo "1. Prüfen Sie die .env.local Datei"
echo "2. Lesen Sie FEHLERBEHEBUNG-STYLING.md"
echo "3. Leeren Sie den Browser-Cache (Cmd+Shift+R)"
echo ""
