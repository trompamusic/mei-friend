var Verovio = require('verovio');
// speed worker

// see also:
// https://github.com/DDMAL/Neon/pull/426/commits/f52981ad0927644927e5249f9fbe4ab6e9413f86
// https: //github.com/DDMAL/Neon/blob/master/src/workers/VerovioWorker.js

var wrkToolkit;
function loadVerovio() {
  /* create the worker toolkit instance */
  return new Verovio.toolkit();
}

self.addEventListener('message', function(e) {
  console.info("Worker e: ", e);
  var data = e.data;
  switch (data.cmd) {
    case 'loadVerovio':
      console.info('Worker started to load Verovio (' + data.msg + ')');
      loadVerovio().bind(this);
      Verovio.module.onRuntimeInitialized = loadVerovio();
      result = {
        'msg': 'WORKER LOADED VEROVIO: ' + wrkToolkit.getVersion(),
        'cmd': 'vrvLoaded',
        'str': wrkToolkit.getVersion()
      };
      break;
    case 'setOptions':
      wrkToolkit.setOptions(data.msg);
      result = {
        'msg': 'Worker options set successfully.',
        'cmd': 'optionsSet',
        'str': 'true'
      };
      break;
    case 'loadData':
      wrkToolkit.loadData(data.msg);
      result = {
        'msg': 'Worker loaded data: ' + wrkToolkit.getPageCount() + ' pages.',
        'cmd': 'pageCount',
        'str': wrkToolkit.getPageCount()
      };
      /* render the fist page as SVG */
      // svg = vrvToolkit.renderToSVG(1, {});
      //   /* save the SVG into a file */
      // fs.writeFileSync("hello.svg", svg);
      break;
    case 'getPage':
      let svg = wrkToolkit.renderToSVG(data.msg);
      result = {
        'msg': 'Here is the current SVG.',
        'cmd': 'svg',
        'str': svg
      };
    case 'stop':
      result = {
        'msg': 'Worker stopped: ' + data.msg + '.',
        'cmd': 'stopped',
        'str': data.msg
      };
      self.close(); // Terminates the worker.
      break;
    default:
      result = {
        'msg': 'Unknown command: ' + data.msg,
        'cmd': data.msg
      };
  };
  self.postMessage(result);
}, false);

// self.addEventListener('message', function(e) {
//   self.postMessage(e.data);
// }, false);
