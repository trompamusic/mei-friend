var Verovio = require('verovio');
// speed worker

// see also:
// https://github.com/DDMAL/Neon/pull/426/commits/f52981ad0927644927e5249f9fbe4ab6e9413f86
// https: //github.com/DDMAL/Neon/blob/master/src/workers/VerovioWorker.js

var wrkToolkit;
loadVerovio = function() {
  /* create the worker toolkit instance */
  wrkToolkit = new Verovio.toolkit();
  result = {
    'cmd': 'vrvLoaded',
    'msg': wrkToolkit.getVersion()
  };
  postMessage(result);
}
loadVerovio.bind(this);

onmessage = function(e) {
  var data = e.data;
  console.info("Worker received: ", data.cmd);
  let result = '';
  switch (data.cmd) {
    case 'loadVerovio':
      Verovio.module.onRuntimeInitialized = loadVerovio;
      break;
    case 'getAvailableOptions':
      result = {
        'cmd': 'availableOptions',
        'msg': wrkToolkit.getAvailableOptions()
      };
      break;
    case 'getVersion':
      result = {
        'cmd': 'version',
        'msg': wrkToolkit.getVersion()
      };
      break;
    case 'setOptions':
      wrkToolkit.setOptions(data.msg);
      result = {
        'cmd': 'optionsSet',
        'msg': true
      };
      break;
    case 'loadData':
      try {
        wrkToolkit.loadData(data.msg);
        result = {
          'cmd': 'pageCount',
          'msg': wrkToolkit.getPageCount()
        };
      } catch (e) {
        console.log(e);
        return;
      }
      break;
    case 'redoLayout':
      try {
        wrkToolkit.redoLayout();
        result = {
          'cmd': 'pageCount',
          'msg': wrkToolkit.getPageCount()
        };
      } catch (e) {
        console.log(e);
        return;
      }
      break;
    case 'getPage':
      try {
        result = {
          'cmd': 'svg',
          'msg': wrkToolkit.renderToSVG(data.msg)
        };
      } catch (e) {
        console.log(e);
        return;
      }
      break;
    case 'getMEI':
      try {
        result = {
          'cmd': 'mei',
          'msg': wrkToolkit.getMEI(data.msg)
        };
      } catch (e) {
        console.log(e);
        return;
      }
      break;
    case 'getTimeForElement':
      try {
        result = {
          'cmd': 'timeForElement',
          'msg': wrkToolkit.getTimeForElement(data.msg)
        };
      } catch (e) {
        console.log(e);
        return;
      }
      break;
    case 'getElementAttr':
      try {
        result = {
          'cmd': 'elementAttr',
          'msg': wrkToolkit.getElementAttr(data.msg)
        };
      } catch (e) {
        console.log(e);
        return;
      }
      break;
    case 'stop':
      result = {
        'cmd': 'stopped',
        'msg': 'Worker stopped: ' + data.msg + '.'
      };
      close(); // Terminates the worker.
      break;
    default:
      result = {
        'cmd': data.msg,
        'msg': 'Unknown command: ' + data.msg
      };
  };
  if (result) postMessage(result);
}

// self.addEventListener('message', function(e) {
//   self.postMessage(e.data);
// }, false);
