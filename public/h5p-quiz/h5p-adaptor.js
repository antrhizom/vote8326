// Mock SCORM API für lokale Nutzung ohne LMS
var pipwerks = pipwerks || {};
pipwerks.SCORM = {
  version: '1.2',
  init: function() { return true; },
  quit: function() { return true; },
  set: function(param, value) { return true; },
  get: function(param) { return ''; },
  status: function(action, value) { return true; },
  save: function() { return true; }
};

var scorm = pipwerks.SCORM;
var lastSentScore = null; // Speichert letzten Score um Duplikate zu vermeiden

function init() {
  scorm.init();
}

window.onload = function () {
  init();
};

window.onunload = function () {
  scorm.quit();
};

// Funktion um Ergebnis an Parent zu senden
var sendResultToParent = function(scorePercent, maxScore) {
  // Nur senden wenn sich Score geändert hat
  if (lastSentScore === scorePercent) {
    console.log('Gleicher Score wie zuvor, überspringe...');
    return;
  }

  if (window.parent && window.parent !== window) {
    lastSentScore = scorePercent;
    window.parent.postMessage({
      type: 'H5P_COMPLETED',
      score: scorePercent,
      maxScore: maxScore || 100,
      success: scorePercent >= 50
    }, '*');
    console.log('H5P Result gesendet:', scorePercent, '%');
  }
};

var onCompleted = function (result) {
  var scorePercent = 0;

  // Verschiedene Score-Formate unterstützen
  if (result.score) {
    if (typeof result.score.scaled === 'number') {
      scorePercent = Math.round(result.score.scaled * 100);
    } else if (typeof result.score.raw === 'number' && typeof result.score.max === 'number' && result.score.max > 0) {
      scorePercent = Math.round((result.score.raw / result.score.max) * 100);
    }
  }

  sendResultToParent(scorePercent, 100);

  scorm.set('cmi.core.score.raw', scorePercent);
  scorm.set('cmi.core.score.min', '0');
  scorm.set('cmi.core.score.max', '100');
  scorm.status('set', 'completed');
};

// Reset-Funktion für Wiederholen
var resetScore = function() {
  lastSentScore = null;
  console.log('Score zurückgesetzt für neuen Versuch');
};

// Warten bis H5P geladen ist
var waitForH5P = setInterval(function() {
  if (typeof H5P !== 'undefined' && H5P.externalDispatcher) {
    clearInterval(waitForH5P);
    console.log('H5P externalDispatcher gefunden');

    H5P.externalDispatcher.on('xAPI', function (event) {
      var statement = event.data.statement;
      var verb = statement.verb?.id || '';

      console.log('xAPI Event:', verb, statement.result);

      // Bei "answered" Event - Ergebnis senden
      if (verb.indexOf('answered') !== -1 && statement.result) {
        console.log('H5P answered Event mit Result:', statement.result);
        onCompleted(statement.result);
      }

      // Bei Retry/Reset - Score zurücksetzen
      if (verb.indexOf('attempted') !== -1 || verb.indexOf('initialized') !== -1) {
        resetScore();
      }
    });
  }
}, 100);

// Fallback: Direkt auf H5P Instanzen hören
var waitForH5PInstances = setInterval(function() {
  if (typeof H5P !== 'undefined' && H5P.instances && H5P.instances.length > 0) {
    clearInterval(waitForH5PInstances);
    console.log('H5P Instances gefunden:', H5P.instances.length);

    H5P.instances.forEach(function(instance, index) {
      if (instance.on) {
        instance.on('xAPI', function(event) {
          var statement = event.data.statement;
          var verb = statement.verb?.id || '';

          if (verb.indexOf('answered') !== -1 && statement.result) {
            console.log('H5P Instance', index, 'answered:', statement.result);
            onCompleted(statement.result);
          }

          // Bei Retry - Score zurücksetzen
          if (verb.indexOf('attempted') !== -1 || verb.indexOf('initialized') !== -1) {
            resetScore();
          }
        });
      }

      // Retry-Button abfangen
      if (instance.resetTask) {
        var originalReset = instance.resetTask;
        instance.resetTask = function() {
          console.log('H5P resetTask aufgerufen');
          resetScore();
          return originalReset.apply(this, arguments);
        };
      }
    });
  }
}, 200);
