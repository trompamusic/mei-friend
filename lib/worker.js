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
  console.info("Worker: ", e);
  var data = e.data;
  let result = '';
  switch (data.cmd) {
    case 'loadVerovio':
      console.info('Worker started to load Verovio ("' + data.cmd + '")');
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
      wrkToolkit.loadData(data.msg);
      result = {
        'cmd': 'pageCount',
        'msg': wrkToolkit.getPageCount()
      };
      /* render the fist page as SVG */
      // svg = vrvToolkit.renderToSVG(1, {});
      //   /* save the SVG into a file */
      // fs.writeFileSync("hello.svg", svg);
      break;
    case 'getPage':
      let svg = wrkToolkit.renderToSVG(data.msg);
      result = {
        'cmd': 'svg',
        'msg': svg
      };
    case 'stop':
      result = {
        'cmd': 'stopped',
        'msg': 'Worker stopped: ' + data.msg + '.'
      };
      self.close(); // Terminates the worker.
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
