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

function init() {
  scorm.init();
}

function set(param, value) {
  scorm.set(param, value);
}

function get(param) {
  scorm.get(param);
}

function end() {
  scorm.quit();
}

window.onload = function () {
  init();
};

window.onunload = function () {
  end();
};

var onCompleted = function (result) {
  if (!result.score) {
    return;
  }

  var scorePercent = Math.round(result.score.scaled * 100);

  // PostMessage an Parent-Fenster senden
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'H5P_COMPLETED',
      score: scorePercent,
      maxScore: 100,
      success: result.success || (scorePercent >= 50)
    }, '*');
  }

  var masteryScore;
  if (scorm.version == '2004') {
    masteryScore = scorm.get('cmi.scaled_passing_score');
  } else if (scorm.version == '1.2') {
    masteryScore = scorm.get('cmi.student_data.mastery_score') / 100;
  }

  scorm.set('cmi.core.score.raw', result.score.scaled * 100);
  scorm.set('cmi.core.score.min', '0');
  scorm.set('cmi.core.score.max', '100');
  scorm.set('cmi.core.score.scaled', result.score.scaled * 100);

  if (masteryScore === undefined) {
    scorm.status('set', 'completed');
  } else {
    var passed = result.score.scaled >= masteryScore;
    if (scorm.version == '2004') {
      scorm.status('set', 'completed');
      if (passed) {
        scorm.set('cmi.success_status', 'passed');
      } else {
        scorm.set('cmi.success_status', 'failed');
      }
    } else if (scorm.version == '1.2') {
      if (passed) {
        scorm.status('set', 'passed');
      } else {
        scorm.status('set', 'failed');
      }
    }
  }
};

// Warten bis H5P geladen ist
var waitForH5P = setInterval(function() {
  if (typeof H5P !== 'undefined' && H5P.externalDispatcher) {
    clearInterval(waitForH5P);

    H5P.externalDispatcher.on('xAPI', function (event) {
      var statement = event.data.statement;

      // Auf "answered" oder "completed" Verben reagieren
      if (statement.verb && statement.verb.id) {
        var verb = statement.verb.id;

        if (verb.indexOf('answered') !== -1 || verb.indexOf('completed') !== -1) {
          if (statement.result) {
            onCompleted(statement.result);
          }
        }
      }
    });
  }
}, 100);
