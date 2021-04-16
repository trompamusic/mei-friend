var Verovio = require('verovio');
// speed worker

// see also:
// https://github.com/DDMAL/Neon/pull/426/commits/f52981ad0927644927e5249f9fbe4ab6e9413f86

var wrkToolkit;

self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'loadVerovio':
      self.postMessage('WORKER STARTED TO wrkVEROVIO: ' + data.msg);
      Verovio.module.onRuntimeInitialized = function() {
        /* create the worker toolkit instance */
        wrkToolkit = new Verovio.toolkit();
        self.postMessage('WORKER LOADED VEROVIO: ', wrkToolkit.getVersion());
      }
      break;
    case 'loadData':
      wrkToolkit.loadData(data.msg);
      self.postMessage('WORKER LOADED DATA: ' + wrkToolkit.getPageCount() + ' pages.');
      /* render the fist page as SVG */
      // svg = vrvToolkit.renderToSVG(1, {});
      //   /* save the SVG into a file */
      // fs.writeFileSync("hello.svg", svg);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg + '.');
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);

// self.addEventListener('message', function(e) {
//   self.postMessage(e.data);
// }, false);
