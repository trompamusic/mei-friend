'use babel';

import $ from 'jquery';
import path from 'path';
import * as help from './help';
import * as speed from './speed';
import * as utils from './utils';
import * as dutils from './dom-utils';
import * as att from './attribute-classes';


export default class MeiFriendView {

  constructor(wk, currPage = 0) {
    this.currentPage = currPage;
    this.pageCount = 0;
    this.selectedElements = [];
    this.lastNoteId = '';
    this.notationNightMode = false;
    this.handleWorkerEvents = this.handleWorkerEvents.bind(this);
    this.vrvWorker = wk;
    this.vrvWorker.onmessage = this.handleWorkerEvents;
    console.info('MeiFriendView: vrvWorker ', this.vrvWorker);
    this.vrvWorker.postMessage({
      'cmd': 'getAvailableOptions',
      'msg': ''
    });
    this.vrvWorker.postMessage({
      'cmd': 'getVersion',
      'msg': ''
    });
    this.vrvVersion = '';
    this.updateNotation = true; // whether or not notation gets re-rendered after text changes
    this.speedMode = false; // speed mode (just feeds on page to Verovio to reduce drawing time)
    this.parser = new DOMParser();
    this.xmlDoc;
    this.encodingHasChanged = true; // to recalculate DOM or pageLists
    this.pageList = []; // list of range arrays [row1, col1, row2, col2, i] in textBuffer coordinates
    this.scoreDefList = []; // list of xmlNodes, one for each change, referenced by 5th element of pageList
    this.meiHeadRange = [];
    this.whichBreaks = ['sb', 'pb'];

    const initialScale = 55;

    this.createHTMLElements(initialScale);

    // Display Verovio version
    this.versionLabel.innerText = "Verovio: " + this.vrvVersion;

    // Create options object with default options
    this.vrvOptions = {
      adjustPageHeight: "true",
      breaks: "auto",
      scale: initialScale,
      pageWidth: 100, // has no effect if noLayout is enabled
      pageHeight: 100, // has no effect if noLayout is enabled
      pageMarginLeft: 25,
      pageMarginRight: 25,
      pageMarginBottom: 25,
      pageMarginTop: 25,
      spacingLinear: .2,
      spacingNonLinear: .5,
      minLastJustification: 0,
      clefChangeFactor: .83,
      topMarginArtic: 1.25,
      bottomMarginArtic: 1.25
    };

    // when highlight color is changed, add/update css in head of document
    // this.hlghtCtrl.addEventListener('change', () => {
    //   this.changeHighlightColor(this.hlghtCtrl.value)
    // });

    // observe active pane, display content accordingly
    this.subscriptions = atom.workspace.getCenter().observeActivePaneItem(item => {

      if (!atom.workspace.isTextEditor(item)) {
        this.verovioPanel.innerHTML =
          "<h2>Open an MEI file to see it rendered here as music notation.</h2>";
        this.hideByID(this.controlsForm.id);
        return;
      }

      let uri;
      try {
        uri = item.getPath();
        console.info('MFV uri.getPath: ', uri);
      } catch (e) {
        console.log(e);
        this.hideByID(this.controlsForm.id);
        console.info('No file path: ', uri);
        return;
      }

      let range = utils.hasTag(item, '<mei');
      // console.info('constructor: ', range);
      if (!range) { //ext !== ".mei") {
        this.verovioPanel.innerHTML =
          "<h2>Not an MEI encoding.</h2><p>Notation will only be rendered for files containing MEI markup.</p>";
        this.hideByID(this.controlsForm.id);
        return;
      }

      // ensure that form controls are enabled
      this.hideByID(this.controlsForm.id, false);

      // wait for #verovioPanel, then set Verovio options, load MEI data,
      // and do initial render
      this.waitForElement(`#${this.verovioPanel.id}`, () => {
        this.encodingHasChanged = true;
        console.info('MFV loading the first time: ', item);
        this.updateAll(item)
      });

      this.lastNoteId = utils.getElementIdAtCursor(item.getBuffer(),
        item.getCursorBufferPosition());
      console.info('MFV: lastNoteId from cursor position: ', this.lastNoteId);
      if (this.lastNoteId == null) {
        console.info('MFV: lastNoteId ', this.lastNoteId);
        // TODO find first // NOTE: ID in item
      }

      // Toolbar listeners

      // when zoom level is changed, update options and re-render notation
      this.waitForElement(`#${this.zoomCtrl.id}`, () => {
        $(`#${this.zoomCtrl.id}`).off('change').on('change', () => {
          this.updateLayout(item);
          this.setFocusToVerovioPane();
          // this.updateZoomSliderTooltip()
        });
      });

      // zoom -
      this.waitForElement(`#${this.decreaseBtn.id}`, () => {
        $(`#${this.decreaseBtn.id}`).off('click').on('click', () => {
          this.zoomCtrl.value = parseInt(this.zoomCtrl.value) - 1;
          this.updateLayout(item);
          this.setFocusToVerovioPane();
          // this.updateZoomSliderTooltip()
        });
      });

      // zoom +
      this.waitForElement(`#${this.increaseBtn.id}`, () => {
        $(`#${this.increaseBtn.id}`).off('click').on('click', () => {
          this.zoomCtrl.value = parseInt(this.zoomCtrl.value) + 1;
          this.updateLayout(item);
          this.setFocusToVerovioPane();
          // this.updateZoomSliderTooltip()
        });
      });

      // swap notation night mode
      this.waitForElement(`#${this.notationNightModeBtn.id}`, () => {
        $(`#${this.notationNightModeBtn.id}`).off('click').on('click', () => {
          this.swapNotationColors();
          this.setFocusToVerovioPane()
        });
      });

      // when page navigation buttons are clicked, change page displayed
      const handlePageNav = (e) => {
        this.updatePage(item, e.target.value, true);
        this.setFocusToVerovioPane();
      };

      this.waitForElement(`#${this.firstBtn.id}`, () => {
        $(`#${this.firstBtn.id}`).off('click').on('click', handlePageNav);
      });
      this.waitForElement(`#${this.prevBtn.id}`, () => {
        $(`#${this.prevBtn.id}`).off('click').on('click', handlePageNav);
      });
      this.waitForElement(`#${this.nextBtn.id}`, () => {
        $(`#${this.nextBtn.id}`).off('click').on('click', handlePageNav);
      });
      this.waitForElement(`#${this.lastBtn.id}`, () => {
        $(`#${this.lastBtn.id}`).off('click').on('click', handlePageNav);
      });
      this.waitForElement(`#${this.updateBtn.id}`, () => {
        $(`#${this.updateBtn.id}`).off('click').on('click', () => {
          this.updateNotationToTextposition(item)
        });
      });

      this.waitForElement(`#${this.breaksSelector.id}`, () => {
        $(`#${this.breaksSelector.id}`).off('change').on('change', () => {
          this.vrvOptions.breaks = this.breaksSelector.options[
            this.breaksSelector.selectedIndex].value;
          if (this.vrvOptions.breaks == 'line' ||
            this.vrvOptions.breaks == 'encoded') {
            this.speedCheckbox.disabled = false;
            this.speedMode = this.speedCheckbox.checked;
          } else {
            this.speedCheckbox.disabled = true;
            this.speedMode = false;
          }
          if (this.speedMode && this.vrvOptions.breaks == 'line') {
            this.vrvOptions.breaks = 'encoded';
          }
          this.encodingHasChanged = true;
          console.info('breaksSelector: ' + this.vrvOptions.breaks +
            ', speedMode: ' + this.speedMode);
          this.updateAll(item);
          this.setFocusToVerovioPane()
        });
      });

      this.waitForElement(`#${this.speedCheckbox.id}`, () => {
        $(`#${this.speedCheckbox.id}`).off('change').on('change', () => {
          this.speedMode = this.speedCheckbox.checked;
          this.encodingHasChanged = true;
          let breaks = this.breaksSelector.options[
            this.breaksSelector.selectedIndex].value;
          if (this.speedMode && breaks == 'line') {
            this.vrvOptions.breaks = 'encoded';
          } else {
            this.vrvOptions.breaks = breaks;
          }
          if (this.speedMode) {
            this.liveupdateCtrl.checked = true;
            this.hideByID(this.updateCtrls.id, true);
            // this.liveupdateCtrl.disabled = true;
          } else {
            this.hideByID(this.updateCtrls.id, false);
            // this.liveupdateCtrl.disabled = false;
          }
          console.info('speedModeCheckbox: ' + this.vrvOptions.breaks +
            ', speedMode: ' + this.speedMode);
          this.updateAll(item);
          this.setFocusToVerovioPane()
        });
      });

      // listen to update checkbox
      this.waitForElement(`#${this.liveupdateCtrl.id}`, () => {
        $(`#${this.liveupdateCtrl.id}`).off('change').on('change', () => {
          if (this.codeUpdateBtn.disabled) {
            this.codeUpdateBtn.disabled = false;
          } else {
            this.codeUpdateBtn.disabled = true;
            this.updateNotationToTextposition(item, false);
            this.updateAll(item);
          };
          this.setFocusToVerovioPane()
        });
      });

      // update code
      this.waitForElement(`#${this.codeUpdateBtn.id}`, () => {
        $(`#${this.codeUpdateBtn.id}`).off('click').on('click', () => {
          this.updateNotationToTextposition(item, false);
          this.updateAll(item);
          this.setFocusToVerovioPane()
        });
      });

      // font selector
      this.waitForElement(`#${this.fontSelector.id}`, () => {
        $(`#${this.fontSelector.id}`).off('change').on('change', () => {
          this.vrvOptions.font = this.fontSelector.options[
            this.fontSelector.selectedIndex].value;
          console.info('font selector: ', this.vrvOptions.font);
          this.updateLayout(item);
          this.setFocusToVerovioPane()
        });
      });

      // V button: re-run verovio to refactor MEI (including UUIDs)
      this.waitForElement(`#${this.verovioBtn.id}`, () => {
        $(`#${this.verovioBtn.id}`).off('click').on('click', (e) => {
          console.info('Redoing encoding through Verovio.');
          let opt = {
            removeIds: false
          };
          if (e.altKey) {
            opt = {
              removeIds: true
            };
          }
          this.loadVerovioData(item.getText());
          this.updateNotation = false;
          this.vrvWorker.postMessage({
            'cmd': 'getMEI',
            'msg': opt
          })
        });
      });

      // forwards ">" button: navigate to next note forwards
      this.waitForElement(`#${this.forwardsBtn.id}`, () => {
        $(`#${this.forwardsBtn.id}`).off('click').on('click', () => {
          this.navigate(item, 'note', 'forwards');
          this.setFocusToVerovioPane()
        });
      });

      // backwards "<" button: navigate to previous note backwards
      this.waitForElement(`#${this.backwardsBtn.id}`, () => {
        $(`#${this.backwardsBtn.id}`).off('click').on('click', () => {
          this.navigate(item, 'note', 'backwards');
          this.setFocusToVerovioPane()
        });
      });

      // upwards "^" button: navigate to next higher layer upwards
      this.waitForElement(`#${this.upwardsBtn.id}`, () => {
        $(`#${this.upwardsBtn.id}`).off('click').on('click', () => {
          this.navigate(item, 'layer', 'upwards');
          this.setFocusToVerovioPane()
        });
      });

      // downwards "v" button: navigate to next lower layer down
      this.waitForElement(`#${this.downwardsBtn.id}`, () => {
        $(`#${this.downwardsBtn.id}`).off('click').on('click', () => {
          // point = item.getCursorBufferPosition()
          // let range = utils.findElementBelow(item, 'measure', point);
          // console.info('DOWN: range', range);
          // item.setCursorBufferPosition(range[2], range[3]);
          // console.info('encoding: ', item.getTextInBufferRange(range));
          this.navigate(item, 'layer', 'downwards');
          this.setFocusToVerovioPane()
        });
      });

      // backwards "<" button: navigate to next note forwards
      this.waitForElement(`#${this.helpBtn.id}`, () => {
        $(`#${this.helpBtn.id}`).off('click').on('click', () => {
          this.toggleHelp()
        });
      });

      // when window is resized, if wrapping is enabled, reflow measures
      $(window).resize(() => {
        if (!this.verovioPanel.classList.contains('hidden')) {
          this.updateLayout(item);
          this.setFocusToVerovioPane()
        }
      });

      // Use a mutation observer to re-render notation when panes are
      // resized or shown/hidden
      const observer = new MutationObserver((m) => {
        console.log('MutationObserver: ', m);
        if (!this.verovioPanel.classList.contains('hidden')) {
          this.encodingHasChanged = true;
          if (item) {
            item.setTabLength(3);
            this.updateLayout(item);
          }
          this.setFocusToVerovioPane()
        }
      });

      const docks = $('.atom-dock-mask');
      for (let i = 0; i < docks.length; i++) {
        observer.observe(docks[i], {
          attributes: true,
          attributeFilter: ['style'],
          subtree: false
        });
      }

      // update when changes occur in MEI code
      item.onDidStopChanging(() => {
        if (this.liveupdateCtrl.checked && this.updateNotation) {
          this.encodingHasChanged = true;
          this.setNotationColors();
          this.updateAll(item);
        }
        if (!this.updateNotation) this.updateNotation = true;
      });

      // when cursor is moved, highlight notation that matches element at new
      // cursor position
      item.onDidChangeCursorPosition(() => {
        this.selectedElements = [];
        this.setNotationColors();
        this.updateHighlight(item);
      });
    });

  }

  // change options, load new data, render current page, add listeners, highlight
  updateAll(txtEdr, options = {}, setCursorToPageBeginning = false) {
    txtEdr.setTabLength(3);
    console.info('updateAll: tabLength: ' + txtEdr.getTabLength() + ', editor: ', txtEdr);
    this.showLoadingMessage();
    this.setVerovioOptions(options);
    if (this.speedMode) {
      this.loadXml(txtEdr);
      let mei = speed.getPageFromDom(this.xmlDoc, this.currentPage,
        this.whichBreaks);
      // console.info('updateAll(): ', mei);
      this.loadVerovioData(mei);
      this.showCurrentPage((this.currentPage <= 1) ? 1 : 2);
    } else {
      this.loadVerovioData(txtEdr.getText());
      this.showCurrentPage();
    }
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(txtEdr);
    this.addNotationEventListeners(txtEdr);
    this.setNotationColors();
    this.updateHighlight(txtEdr);
  }

  // add new data and render current page without changing options
  updateData(txtEdr, setCursorToPageBeginning = false) {
    this.showLoadingMessage();
    if (this.speedMode) {
      this.loadXml(txtEdr);
      let mei = speed.getPageFromDom(this.xmlDoc, this.currentPage,
        this.whichBreaks);
      // console.info('updateData(): ', mei);
      this.loadVerovioData(mei);
      this.showCurrentPage((this.currentPage <= 1) ? 1 : 2);
    } else {
      this.loadVerovioData(txtEdr.getText());
      this.showCurrentPage();
    }
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(txtEdr);
    this.addNotationEventListeners(txtEdr);
    this.setNotationColors();
    this.updateHighlight(txtEdr);
  }

  // go to new page without changing data or options
  updatePage(txtEdr, page, setCursorToPageBeginning = false) {
    this.changeCurrentPage(page);
    if (this.speedMode) {
      this.loadXml(txtEdr);
      let mei = speed.getPageFromDom(this.xmlDoc, this.currentPage,
        this.whichBreaks);
      // console.info('updatePage(): ', mei);
      this.loadVerovioData(mei);
      this.showCurrentPage((this.currentPage <= 1) ? 1 : 2);
    } else {
      this.showCurrentPage();
    }
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(txtEdr);
    this.addNotationEventListeners(txtEdr);
    this.setNotationColors();
    this.updateHighlight(txtEdr);
  }

  // update layout with no changes to data or page
  updateLayout(txtEdr, options = {}, setCursorToPageBeginning = false) {
    this.showLoadingMessage();
    this.setVerovioOptions(options);
    if (this.speedMode) {
      this.loadXml(txtEdr);
      let mei = speed.getPageFromDom(this.xmlDoc, this.currentPage,
        this.whichBreaks);
      // console.info('updateLayout(): ', mei);
      this.loadVerovioData(mei);
      page = (this.currentPage <= 1) ? 1 : 2;
      console.info('updateLayout() page: ' + page);
      this.showCurrentPage(page);
    } else {
      this.redoVerovioLayout();
      this.showCurrentPage();
    }
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(txtEdr);
    this.addNotationEventListeners(txtEdr);
    this.setNotationColors();
    this.updateHighlight(txtEdr);
  }

  loadXml(txtEdr, forceReload = false) {
    this.whichBreaks = ['sb', 'pb'];
    if ("encoded" == this.breaksSelector.options[
        this.breaksSelector.selectedIndex].value) {
      this.whichBreaks = ['pb'];
    }
    // console.info('loadXml whichBreaks: ', this.whichBreaks);
    // update DOM only if encoding has been edited or updated
    if (this.encodingHasChanged || forceReload) {
      this.xmlDoc = this.parser.parseFromString(txtEdr.getText(), "text/xml");
      let elements = this.xmlDoc.querySelectorAll("measure, sb, pb");
      // console.info('loadXml: breaks and measures: ', elements);
      // count pages
      this.pageCount = 1; // pages are one-based
      countBreaks = false;
      for (e of elements) {
        if (e.nodeName == 'measure') countBreaks = true; // skip trailing breaks
        if (countBreaks && this.whichBreaks.includes(e.nodeName))
          this.pageCount++;
      }
      if (this.currentPage > this.pageCount) this.currentPage = 1;
      console.info('loadXml reloaded: currentPage: ' + this.currentPage +
        ', pageCount: ' + this.pageCount);
      this.encodingHasChanged = false;
      // speed.getBreaksFromToolkit(this.vrvToolkit, txtEdr.getBuffer().getText());
    }
  }

  // https://gist.github.com/chrisjhoughton/7890303
  waitForElement(selector, callback) {
    if ($(selector).length > 0) {
      callback();
    } else {
      setTimeout(() => {
        this.waitForElement(selector, callback);
      }, 100);
    }
  }

  getContainerSize() { // use waitForElement to be sure item exists first
    let svgTarget = $(`#${this.verovioPanel.id}`);
    let result = {};

    if (svgTarget.length > 0) {
      result.pageWidth = svgTarget.width();
      result.pageHeight = svgTarget.height();
    } else {
      result = {
        pageWidth: 100,
        pageHeight: 100
      }
    }
    return result;
  }

  redoVerovioLayout() {
    // No data loaded
    if (this.pageCount === 0) {
      return;
    }
    this.vrvWorker.postMessage({
      'cmd': 'redoLayout',
      'msg': 'redoLayout'
    })
  }

  setVerovioOptions(newOptions = {}) {
    let dimensions = this.getContainerSize();

    // zoom controls
    this.vrvOptions.scale = parseInt(this.zoomCtrl.value);
    this.vrvOptions.footer = 'encoded';
    this.vrvOptions.header = 'encoded';

    // parsing breaks options from selector is done at selector callback
    // this.vrvOptions.breaks = this.breaksSelector.options[
    //    this.breaksSelector.selectedIndex].value;

    if (this.vrvOptions.breaks !== "none") {
      let width = Math.max(Math.round(dimensions.pageWidth *
        (100 / this.vrvOptions.scale)), 100);
      let height = Math.max(Math.round(dimensions.pageHeight *
        (100 / this.vrvOptions.scale)), 100);
      // console.info('vrvOptions width: ' + width + ', height: ' + height);
      this.vrvOptions.pageWidth = width;
      this.vrvOptions.pageHeight = height;
    }

    // overwrite existing options if new ones are passed in
    for (let key in newOptions) {
      this.vrvOptions[key] = newOptions[key];
    }

    this.vrvWorker.postMessage({
      'cmd': 'setOptions',
      'msg': this.vrvOptions
    });
  }

  loadVerovioData(data) {
    this.vrvWorker.postMessage({
      'cmd': 'loadData',
      'msg': data
    })
  }

  showCurrentPage(page = this.currentPage) {
    console.info('showCurrentPage(): ' + page + ', pageCount: ' + this.pageCount);
    // No data loaded
    if (this.pageCount === 0) {
      return;
    }
    if (!this.validateCurrentPage()) {
      page = 1;
    }
    this.vrvWorker.postMessage({
      'cmd': 'getPage',
      'msg': page
    });
  }

  validateCurrentPage() {
    return (this.currentPage > 0 && this.currentPage <= this.pageCount);
  }

  // set cursor to first note id in page, taking st/ly of id, if possible
  setCursorToPageBeginning(txtEdr) {
    let id = this.lastNoteId;
    let buffer = txtEdr.getBuffer();
    let stNo, lyNo;
    let rg;
    if (id == '') {
      id = document.querySelector('.note').getAttribute('id');
    } else {
      rg = utils.locateIdInBuffer(buffer, id);
      if (rg) {
        stNo = utils.getElementAttributeAbove(buffer, rg.start.row, 'staff')[0];
        lyNo = utils.getElementAttributeAbove(buffer, rg.start.row, 'layer')[0];
        let m = document.querySelector('.measure');
        console.info('setCursorToPgBg st/ly;m: ' + stNo + '/' + lyNo + '; ', m);
        if (m) {
          id = dutils.getFirstInMeasure(m, dutils.navElsSelector, stNo, lyNo);
        }
      }
    }
    rg = utils.locateIdInBuffer(buffer, id);
    if (rg) {
      txtEdr.setCursorBufferPosition([rg.start.row, rg.start.column]);
    }
    console.info('setCrsrToPgBeg(): lastNoteId: ' + this.lastNoteId +
      ', new id: ' + id);
    this.selectedElements[0] = id;
    this.lastNoteId = id;
    return id;
  }

  addNotationEventListeners(txtEdr) {
    let elements = $(`#${this.verovioPanel.id}`).find('g[id]');
    if (elements.length !== 0) {
      // TODO avoid jQuery: elements.addEventListener('mouseup', function)...
      elements.bind('mouseup', (el) => {
        this.handleClickOnNotation(el, txtEdr);
      });
    } else {
      setTimeout(() => {
        this.addNotationEventListeners(txtEdr);
      }, 50);
    }
  }

  handleClickOnNotation(e, txtEdr) {
    e.stopImmediatePropagation();
    console.info('click: ', e);
    let itemId = String(e.currentTarget.id);
    let el = document.querySelector('g#' + itemId);
    // TODO: remove jQuery...
    if (el.getAttribute('class') == 'note')
      console.info('CLICK note: x ', dutils.getX(el));
    else if (el.getAttribute('class') == 'chord')
      console.info('CLICK chord: x ', dutils.getX(el));
    let range;
    // take chord rather than note xml:id, when ALT is pressed
    chordId = utils.insideParent(itemId);
    if (e.altKey && chordId) itemId = chordId;
    // select tuplet when clicking on tupletNum
    if (e.currentTarget.getAttribute('class') == 'tupletNum')
      itemId = utils.insideParent(itemId, 'tuplet');

    if (((navigator.appVersion.indexOf("Mac") !== -1) && e.metaKey) || e.ctrlKey) {
      this.selectedElements.push(itemId);
      console.info('handleClickOnNotation() added: ' +
        this.selectedElements[this.selectedElements.length - 1] +
        ', size now: ' + this.selectedElements.length);
    } else {
      // set cursor position in buffer
      range = utils.locateIdInBuffer(txtEdr.getBuffer(), itemId);
      if (range) {
        txtEdr.setCursorBufferPosition([range.start.row, range.start.column]);
      }
      this.selectedElements = [];
      this.selectedElements.push(itemId);
      console.info('handleClickOnNotation() newly created: ' +
        this.selectedElements[this.selectedElements.length - 1] +
        ', size now: ' + this.selectedElements.length);
    }
    this.updateHighlight(txtEdr);
    this.setFocusToVerovioPane();
    // set lastNoteId to @startid or @staff of control element
    let startid = utils.getAttributeById(txtEdr.getBuffer(), itemId);
    if (startid && startid.startsWith('#')) startid = startid.split('#')[1];
    // console.info('startid: ', startid);
    // if (!startid) { // work around for tstamp/staff
    // TODO: find note corresponding to @staff/@tstamp
    // startid = utils.getAttributeById(txtEdr.getBuffer(), itemId, attribute = 'tstamp');
    // console.info('staff: ', startid);
    // }
    if (startid) this.lastNoteId = startid;
    else this.lastNoteId = itemId;

    // let elementName = 'undefined'; // retrieve element name
    // if (elementString != '') {
    //   elementName = elementString.match(/[\w.-]+/);
    // }
    // console.info('elementName: "' + elementName + '"');
    // if (elementName == 'undefined') return;

    // str = 'handleClickOnNotation() selected: ';
    // for (i of this.selectedElements) console.info(str += i + ', ');
    // console.info(str);
  }

  // highlight currently selected elements
  updateHighlight(txtEdr) {
    // clear existing highlighted classes
    let highlighted = document.querySelectorAll('g.highlighted');
    // console.info('updateHlt: highlighted: ', highlighted);
    if (highlighted) highlighted.forEach(e => {
      e.classList.remove('highlighted');
    })
    let ids = [];
    if (this.selectedElements.length > 0)
      this.selectedElements.forEach(item => ids.push(item));
    else ids.push(utils.getElementIdAtCursor(txtEdr.getBuffer(),
      txtEdr.getCursorBufferPosition()));
    // console.info('updateHlt ids: ', ids);
    for (id of ids) {
      if (id) {
        let el = document.querySelector('g#' + id)
        // console.info('updateHlt el: ', el);
        if (el) el.classList.add('highlighted');
      }
    }
  }

  setNotationColors() {
    if (this.notationNightMode) {
      $('g').addClass('inverted');
      $('#verovio-panel').addClass('inverted');
    } else {
      $('g.inverted').removeClass('inverted');
      $('#verovio-panel').removeClass('inverted');
    }
  }

  swapNotationColors() {
    if (this.notationNightMode) {
      this.notationNightMode = false;
    } else {
      this.notationNightMode = true;
    }
    console.info('swapNotationColors: ' + this.notationNightMode);
    this.setNotationColors();
  }

  toggleHelp() {
    if (this.helpPanel.classList.contains('hidden')) {
      this.hideByID(this.helpPanel.id, false);
      this.hideByID(this.verovioPanel.id);
      this.breaksSelector.disabled = true;
    } else {
      this.hideByID(this.helpPanel.id);
      this.hideByID(this.verovioPanel.id, false);
      this.breaksSelector.disabled = false;
    }
  }

  hideHelp() {
    if (this.verovioPanel.classList.contains('hidden')) {
      this.hideByID(this.helpPanel.id);
      this.hideByID(this.verovioPanel.id, false);
      this.breaksSelector.disabled = false;
    }
  }

  // set focus to verovioPane in order to ensure working key bindings
  setFocusToVerovioPane() {
    this.element.focus();
    // $(".mei-friend").attr('tabindex', '-1').focus();
  }

  updateZoomSliderTooltip() {
    atom.tooltips.add(this.zoomCtrl, {
      title: 'Scale: ' + this.zoomCtrl.value + "%"
    });
  }

  // navigate forwards/backwards/upwards/downwards in the DOM, as defined
  // by 'dir' an by 'incrementElementName'
  navigate(txtEdr, incElName = 'note', dir = 'forwards') {
    console.info('navigate(): lastNoteId: ', this.lastNoteId);
    let id = this.lastNoteId;
    if (id == '') { // empty note id
      this.setCursorToPageBeginning(txtEdr); // re-defines lastNotId
      id = this.lastNoteId;
    };
    let elsList = '.note, .rest, .mRest, .beatRpt, .halfmRpt, .mRpt';
    let buffer = txtEdr.getBuffer();
    let element = document.querySelector('g#' + id);
    if (!element) { // element off-screen
      this.setCursorToPageBeginning(txtEdr); // re-defines lastNotId
      id = this.lastNoteId;
      element = document.querySelector('g#' + id);
    }
    console.info('Navigate ' + dir + ' ' +
      incElName + '-wise for: ', element);
    let x = dutils.getX(element);
    let y = dutils.getY(element);
    let measure = element.closest('.measure');
    // in case no measure element is found
    if (!measure) {
      let firstNote = document.querySelector('.measure').querySelector('.note');
      if (firstNote) id = firstNote.getAttribute('id');
    } else {
      let layer = element.closest('.layer');
      let staff = element.closest('.staff');
      lyNo = layer.getAttribute('data-n');
      stNo = staff.getAttribute('data-n');

      // find elements starting from current note id, element- or measure-wise
      if (incElName == 'note' || incElName == 'measure') {
        id = dutils.getIdOfNextSvgElement(
          element, dir, elsList, incElName);
        // when no id on screen, turn page
        if (!id && dir == 'forwards') {
          this.updatePage(txtEdr, 'forwards');
          this.setFocusToVerovioPane();
          id = dutils.getFirstInMeasure(document.querySelector('.measure'),
            elsList, stNo, lyNo);
        } else if (!id && dir == 'backwards') {
          if (this.currentPage > 1) {
            this.updatePage(txtEdr, 'backwards');
            this.setFocusToVerovioPane();
          }
          let m = document.querySelectorAll('.measure'); // all measures of page
          if (m) {
            if (incElName == 'measure')
              id = dutils.getFirstInMeasure(m[m.length - 1], // use last one
                elsList, stNo, lyNo)
            else {
              id = dutils.getLastInMeasure(m[m.length - 1], // use last one
                elsList, stNo, lyNo)
            }
          }
        }
        if (id) { // if id within chord, find y-closest note to previous
          let ch = document.querySelector('g#' + id).closest('.chord');
          if (ch) {
            // console.info('back/forwards within a chord (y: ' + y + '), ', ch);
            let diff = Number.MAX_VALUE;
            ch.querySelectorAll('.note').forEach(item => {
              let newDiff = Math.abs(dutils.getY(item) - y);
              // console.info('note: diff: ' + newDiff, item);
              if (newDiff <= diff) {
                diff = newDiff;
                id = item.getAttribute('id');
              }
            });
          }
        }
      }

      // up/down in layers
      if (incElName == 'layer') {
        // console.info('navigate(u/d): x/y: ' + x + '/' + y + ', el: ', element);
        let els = Array.from(measure.querySelectorAll(elsList));
        els.sort(function(a, b) {
          if (Math.abs(dutils.getX(a) - x) > Math.abs(dutils.getX(b) - x))
            return 1;
          if (Math.abs(dutils.getX(a) - x) < Math.abs(dutils.getX(b) - x))
            return -1;
          if (dutils.getY(a) < dutils.getY(b))
            return (dir == 'upwards') ? 1 : -1;
          if (dutils.getY(a) > dutils.getY(b))
            return (dir == 'upwards') ? -1 : 1;
          return 0;
        });
        // console.info('els: ', els);
        let found = false;
        let xx, yy = 0;
        for (e of els) { // go thru all elements to find closest in x/y space
          if (found) {
            yy = dutils.getY(e);
            if (dir == 'upwards' && yy >= y) continue;
            if (dir == 'downwards' && yy <= y) continue;
            id = e.getAttribute('id');
            break;
          }
          if (e.getAttribute('id') === element.getAttribute('id')) found = true;
        }
      } // up/down in layers

      console.info('navigate() found this ID: ' + id);
    }

    // update cursor position in MEI file (buffer)
    let range;
    if (range = utils.locateIdInBuffer(buffer, id)) {
      txtEdr.setCursorBufferPosition([range.start.row, range.start.column]);
    }
    this.updateNotationToTextposition(txtEdr);
    //
    if (id) {
      this.selectedElements[0] = id;
      this.lastNoteId = id;
    }
  }

  // delete selected elements
  delete(txtEdr, id) {
    this.loadXml(txtEdr, true);
    let element = this.xmlDoc.querySelector("[*|id='" + id + "']");
    console.info('Deleting: ', element);
    if (!element) {
      console.info(id + ' not found for deletion.');
      return;
    }
    let selectedElements = [];
    let buffer = txtEdr.getBuffer();
    this.updateNotation = false;
    let checkPoint = buffer.createCheckpoint();
    if (att.modelControlEvents.concat(['accid', 'artic', 'clef', 'octave'])
      .includes(element.nodeName)) {
      if (element.nodeName == 'octave') { // reset notes inside octave range
        let dis_place = element.getAttribute('dis.place');
        let dis = element.getAttribute('dis');
        let id1 = speed.removeHashFromString(element.getAttribute('startid'));
        let id2 = speed.removeHashFromString(element.getAttribute('endid'));
        speed.findAndModifyOctaveElements(txtEdr, this.xmlDoc, id1, id2,
          dis_place, dis, false);
        speed.removeInBuffer(buffer, element);
        selectedElements.push(id2);
      } else {
        speed.removeInBuffer(buffer, element);
        selectedElements.push(utils.getElementIdAtCursor(buffer,
          txtEdr.getCursorBufferPosition()));
      }
    } else if (['beam'].includes(element.nodeName)) {
      let p1 = txtEdr.getCursorBufferPosition();
      let first = true;
      let childList = element.childNodes;
      for (let i = 0; i < childList.length; i++) {
        if (childList[i].nodeType === Node.TEXT_NODE) continue;
        if (first) {
          speed.replaceInTextEditor(txtEdr, element, false, childList[i]);
          first = false;
        } else {
          txtEdr.insertNewline();
          txtEdr.insertText(speed.xmlToString(childList[i]));
        }
        selectedElements.push(childList[i].getAttribute('xml:id'))
        element.parentNode.insertBefore(childList[i--], element);
      }
      let p2 = txtEdr.getCursorBufferPosition();
      txtEdr.setSelectedBufferRange([p1, p2]);
      txtEdr.autoIndentSelectedRows();
      txtEdr.setCursorBufferPosition(p2);
    } else {
      console.info('Element ' + id + ' not supported for deletion.');
      return;
    }
    element.remove();
    buffer.groupChangesSinceCheckpoint(checkPoint);
    this.selectedElements = selectedElements;
    this.lastNoteId = this.selectedElements[this.selectedElements.length - 1];
    // console.info('selectedElements: ');
    // for (e of this.selectedElements) console.info(', ' + e);
    this.speedMode ? this.updateLayout(txtEdr) : this.updateData(txtEdr);
    this.setFocusToVerovioPane();
  }


  // adds a control element to end of measure; either for one selected note (to the
  // next note in same staff and layer) or to two selected notes.
  addControlElement(txtEdr, elementName = 'slur', placementString = '',
    formString = '', useTstamps = false) {
    this.selectedElements =
      utils.sortElementsByScoreTime(this.selectedElements, this.vrvToolkit);
    if (this.speedMode) {
      this.addControlElementDom(txtEdr, elementName, placementString,
        formString, useTstamps);
      return;
    }
    if (this.selectedElements.length <= 2 && this.selectedElements.length > 0) {
      let buffer = txtEdr.getBuffer();
      let uuid = elementName + '-' + utils.generateUUID();
      let startId = this.selectedElements[0];
      let endId = '';

      //  validate selected element to be note or chord
      let range = utils.locateIdInBuffer(buffer, startId);
      startElementName = buffer.lineForRow(range.start.row).match(/(?:<)([a-zA-Z]+\b)/)[1];
      if (startElementName != 'note' && startElementName != 'chord' &&
        startElementName != 'mRest' && startElementName != 'multiRest') {
        console.info('addControlElement: Sel. start el. not note/chord, but ' +
          startElementName);
        return;
      }

      if (this.selectedElements.length == 1 &&
        (elementName == 'slur' || elementName == 'tie' ||
          elementName == 'hairpin' || elementName == 'gliss')) {
        // if one selected element, find a second automatically
        endId = utils.getIdOfNextElement(buffer, range.start.row, ['note'])[0];
      } else if (this.selectedElements.length >= 2) {
        endId = this.selectedElements[this.selectedElements.length - 1];
      }

      if (endId) {
        range = utils.locateIdInBuffer(buffer, endId);
        let endElementName = "";
        if (range)
          endElementName = buffer.lineForRow(range.start.row)
          .match(/(?:<)([a-z]+\b)/)[1];
        if (endElementName != 'note' && endElementName != 'chord' &&
          endElementName != 'rest') {
          console.info(
            'addControlElement: Selected end element not a note/chord, but ' +
            endElementName);
          return;
        }
      }

      // construct MEI code: start with element and xml:id
      insertString = '<' + elementName + ' xml:id="' + uuid + '" ';
      // with always two ids
      if (elementName == 'slur' || elementName == 'tie' ||
        elementName == 'hairpin' || elementName == 'gliss') {
        insertString += 'startid="#' + startId + '" endid="#' + endId + '" ';
      } else if (elementName == 'fermata' || elementName == 'dir' ||
        elementName == 'dynam' || elementName == 'tempo' ||
        elementName == 'pedal' || elementName == 'mordent' ||
        elementName == 'trill' || elementName == 'turn') { // only one id
        insertString += 'startid="#' + startId + '" ';
      }
      // possibly a second id, only if existing
      if (endId != '' && (elementName == 'dir' || elementName == 'dynam' ||
          elementName == 'mordent' || elementName == 'trill' ||
          elementName == 'turn')) {
        insertString += 'endid="#' + endId + '" ';
        if (elementName == 'trill') { // set extender attribute, if two notes selected for a trill
          insertString += 'extender="true" ';
        }
      }
      // add form
      if (formString != '' && (elementName == 'hairpin' ||
          elementName == 'fermata' || elementName == 'mordent' ||
          elementName == 'trill' || elementName == 'turn')) {
        insertString += 'form="' + formString + '" ';
      }
      // insert dir for pedal (and a default vgrp, even not yet MEI standard)
      if (elementName == 'pedal') {
        insertString += 'dir="' + placementString + '" vgrp="100" ';
        placementString = '';
      }
      // add placement/curvedir
      if (placementString != '') {
        if (elementName == 'slur' || elementName == 'tie' ||
          elementName == 'phrase') {
          insertString += 'curvedir="' + placementString + '" ';
        } else {
          insertString += 'place="' + placementString + '" ';
        }
      }
      if (elementName == 'arpeg') {
        insertString += 'plist="';
        for (e of this.selectedElements) {
          insertString += '#' + e + ' ';
        }
        insertString += '" ';
      }
      // close xml tags
      if (elementName == 'dir' || elementName == 'dynam' ||
        elementName == 'tempo') {
        insertString += '>' + formString + '</' + elementName + '>';
      } else {
        insertString += '/>';
      }

      // insert new code into MEI file
      pos = utils.moveCursorToEndOfMeasure(txtEdr); // !! resets selectedElements !!
      // utils.insertTabs(txtEdr, txtEdr.getTabLength());
      txtEdr.indentSelectedRows();
      txtEdr.insertText(insertString);
      txtEdr.insertNewline();
      txtEdr.autoIndentSelectedRows();
      // txtEdr.backspace();
      this.encodingHasChanged = true;

      // move cursor to newly created element
      range = utils.locateIdInBuffer(buffer, uuid);
      if (range) {
        if (elementName == 'dir' || elementName == 'dynam' || elementName == 'tempo') {
          let c = buffer.lineForRow(range.start.row).indexOf(formString);
          range.start.column = c;
          range.end.column = c + formString.length;
          txtEdr.setSelectedBufferRange(range);
        } else {
          txtEdr.setCursorBufferPosition([range.start.row, range.start.column]);
        }
      }
      console.info('addControlElement() added: "' + insertString + '"');
      this.lastNoteId = startId; // start moving cursor from starting note
      this.selectedElements = [];
      this.selectedElements.push(uuid);
    } else {
      console.info('addControlElement() nothing added. ' + this.selectedElements.length + ' selected elements.');
      return null;
    }
  }

  addControlElementDom(txtEdr, elementName, placementString, formString, useTstamps) {
    if (this.selectedElements.length < 1) return;
    this.selectedElements = speed.filterElements(this.selectedElements, this.xmlDoc);
    console.info('addControlElementDom() ', elementName, placementString, formString);
    let buffer = txtEdr.getBuffer();
    let startId = this.selectedElements[0];
    // find and validate startElement with @startId
    var startElement = this.xmlDoc.querySelector("[*|id='" + startId + "']");
    if (!startElement) return;
    if (!['note', 'chord', 'rest', 'mRest', 'multiRest'].includes(startElement.nodeName)) {
      console.info('addControlElementDom: New element not addable to start element ' +
        startElement.nodeName + '.');
      return;
    }
    // find and validate endElement
    let endId = '';
    let range = utils.locateIdInBuffer(buffer, startId);
    var endElement;
    if (this.selectedElements.length == 1 &&
      (['slur', 'tie', 'phrase', 'hairpin', 'gliss'].includes(elementName))) {
      // if one selected element, find a second automatically
      endId = utils.getIdOfNextElement(buffer, range.start.row, ['note'])[0];
    } else if (this.selectedElements.length >= 2) {
      endId = this.selectedElements[this.selectedElements.length - 1];
    }
    if (endId) {
      endElement = this.xmlDoc.querySelector("[*|id='" + endId + "']");
      if (!['note', 'chord', 'mRest', 'multiRest'].includes(endElement.nodeName)) {
        console.info('addControlElementDom: New element not addable to end element ' +
          endElement.nodeName);
        return;
      }
    }
    // create element to be inserted
    let newElement = this.xmlDoc.createElementNS(speed.meiNameSpace, elementName);
    let uuid = elementName + '-' + utils.generateUUID();
    newElement.setAttributeNS(speed.xmlNameSpace, 'xml:id', uuid);
    // elements with both startid and endid
    if (['slur', 'tie', 'phrase', 'hairpin', 'gliss'].includes(elementName)) {
      newElement.setAttribute('startid', '#' + startId);
      newElement.setAttribute('endid', '#' + endId);
    } else if ( // only a @startid
      ['fermata', 'dir', 'dynam', 'tempo', 'pedal', 'mordent', 'trill', 'turn'].includes(elementName)) {
      newElement.setAttribute('startid', '#' + startId);
    }
    // add an optional endid
    if (endId && ['dir', 'dynam', 'mordent', 'trill', 'turn'].includes(elementName)) {
      newElement.setAttribute('endid', '#' + endId);
      if (['trill'].includes(elementName)) { // @extender for endid
        newElement.setAttribute('extender', 'true');
      }
    }
    if (formString && ['hairpin', 'fermata', 'mordent', 'trill', 'turn'].includes(elementName)) {
      newElement.setAttribute('form', formString);
    }
    if (placementString && ['pedal'].includes(elementName)) {
      newElement.setAttribute('dir', placementString);
      newElement.setAttribute('vgrp', '100');
    }
    if (placementString) {
      if (['slur', 'tie', 'phrase'].includes(elementName)) {
        newElement.setAttribute('curvedir', placementString);
      } else {
        newElement.setAttribute('place', placementString);
      }
    }
    if (['arpeg'].includes(elementName)) {
      let plistString = '';
      for (e of this.selectedElements) {
        plistString += '#' + e + ' ';
      }
      newElement.setAttribute('plist', plistString);
    }
    if (formString && ['dir', 'dynam', 'tempo'].includes(elementName)) {
      newElement.appendChild(this.xmlDoc.createTextNode(formString));
    }
    // add new element to xmlDOM and to txtEdr at end of measure
    if (range) {
      this.updateNotation = false;
      range.start = utils.moveCursorToEndOfMeasure(txtEdr, range.start); // resets selectedElements!!
      txtEdr.indentSelectedRows();
      // utils.insertTabs(txtEdr, txtEdr.getTabLength());
      txtEdr.insertText(speed.xmlToString(newElement));
      txtEdr.insertNewline();
      txtEdr.autoIndentSelectedRows();
      // console.info('addControlElementDom() range', range, txtEdr.getCursorBufferPosition());
      txtEdr.setCursorBufferPosition([range.start[0], range.start[1] + 5]);
      // console.info('addControlElementDom() range', range, txtEdr.getCursorBufferPosition());
    }
    var measureId = startElement.closest('measure').getAttribute('xml:id');
    this.xmlDoc.querySelector(
      "[*|id='" + measureId + "']").appendChild(newElement); //.cloneNode(true));
    this.lastNoteId = startId;
    this.selectedElements = [];
    this.selectedElements.push(uuid);
    this.updateLayout(txtEdr);
    this.setFocusToVerovioPane();
  }

  // add beam, only speed mode
  addBeamElement(txtEdr, elementName = 'beam') {
    this.loadXml(txtEdr);
    this.selectedElements =
      speed.filterElements(this.selectedElements, this.xmlDoc);
    this.selectedElements =
      utils.sortElementsByScoreTime(this.selectedElements, this.vrvToolkit);
    if (this.selectedElements.length <= 1) return;
    // console.info('addBeamElement(' + elementName +
    //   '): selectedElements:', this.selectedElements);
    let id1 = this.selectedElements[0]; // xml:id string
    let parentId;
    if (parentId = utils.insideParent(id1, 'chord')) id1 = parentId;
    let id2 = this.selectedElements[this.selectedElements.length - 1];
    if (parentId = utils.insideParent(id2, 'chord')) id2 = parentId;
    let n1 = this.xmlDoc.querySelector("[*|id='" + id1 + "']");
    let n2 = this.xmlDoc.querySelector("[*|id='" + id2 + "']");
    let par1 = n1.parentNode;
    this.updateNotation = false;
    let buffer = txtEdr.getBuffer();
    let checkPoint = buffer.createCheckpoint();
    // console.info('n1:', p1.getAttribute('xml:id'));
    // console.info('n2:', n2.parentNode.getAttribute('xml:id'));
    // add beam element, if selected elements have same parent
    if (par1.getAttribute('xml:id') == n2.parentNode.getAttribute('xml:id')) {
      let beam = document.createElementNS(speed.meiNameSpace, elementName);
      let uuid = elementName + '-' + utils.generateUUID();
      beam.setAttributeNS(speed.xmlNameSpace, 'xml:id', uuid);
      par1.insertBefore(beam, n1);
      let nodeList = par1.childNodes;
      let insert = false;
      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].nodeType === Node.TEXT_NODE) continue;
        if (nodeList[i].getAttribute('xml:id') == id1) insert = true;
        if (nodeList[i].getAttribute('xml:id') == id2) {
          let n = nodeList[i].cloneNode(); // make a copy for replacement later
          beam.appendChild(nodeList[i--]);
          speed.replaceInTextEditor(txtEdr, n, true, beam);
          txtEdr.autoIndentSelectedRows();
          break;
        }
        if (insert) {
          speed.removeInBuffer(buffer, nodeList[i]);
          beam.appendChild(nodeList[i--]);
        }
      }
      buffer.groupChangesSinceCheckpoint(checkPoint);
      this.selectedElements = [];
      this.selectedElements.push(uuid);
      this.speedMode ? this.updateLayout(txtEdr) : this.updateData(txtEdr);
      this.setFocusToVerovioPane();
    } else {
      console.log('Cannot add ' + elementName +
        ' element, selected elements have different parents.');
    }
  }

  // add octave element and modify notes inside selected elements
  addOctaveElement(txtEdr, dis_place = 'above', dis = '8') {
    this.loadXml(txtEdr);
    if (this.selectedElements.length < 1) return;
    let buffer = txtEdr.getBuffer();
    console.info('addOctaveElement selectedElements:', this.selectedElements);
    let id1 = this.selectedElements[0]; // xml:id string
    let id2 = this.selectedElements[this.selectedElements.length - 1];
    let n1 = this.xmlDoc.querySelector("[*|id='" + id1 + "']");
    // add control like element <octave @startid @endid @dis @dis.place>
    let octave = this.xmlDoc.createElementNS(speed.meiNameSpace, "octave");
    let uuid = 'octave-' + utils.generateUUID();
    octave.setAttributeNS(speed.xmlNameSpace, 'xml:id', uuid);
    octave.setAttribute('startid', '#' + id1);
    octave.setAttribute('endid', '#' + id2);
    octave.setAttribute('dis', dis);
    octave.setAttribute('dis.place', dis_place);
    n1.closest('measure').appendChild(octave);
    // add it to the txtEdr
    this.updateNotation = false;
    let checkPoint = buffer.createCheckpoint();
    let range = utils.locateIdInBuffer(buffer, id1);
    if (range) {
      let begin = utils.moveCursorToEndOfMeasure(txtEdr, range.start); // resets selectedElements!!
      txtEdr.insertText(speed.xmlToString(octave));
      txtEdr.insertNewline();
      txtEdr.setSelectedBufferRange([begin, [begin[0] + 2, begin[1]]]);
      txtEdr.autoIndentSelectedRows();
      txtEdr.setCursorBufferPosition(begin);
    }
    // find plist and modify elements
    speed.findAndModifyOctaveElements(txtEdr, this.xmlDoc, id1, id2,
      dis_place, dis);
    buffer.groupChangesSinceCheckpoint(checkPoint);
    this.selectedElements = [];
    this.selectedElements.push(uuid);
    this.lastNoteId = id2;
    this.speedMode ? this.updateLayout(txtEdr) : this.updateData(txtEdr);
    this.setFocusToVerovioPane();
  }

  // Reverse or insert att:placement (artic, ...), att.curvature (slur, tie,
  // phrase) and TODO: att.stems (note, chord) of current element
  // (or its children, such as all notes/chords within a beam).
  // formerly: invertPlacementDom
  invertPlacement(txtEdr, modifier = false) {
    this.loadXml(txtEdr);
    let buffer = txtEdr.getBuffer();
    let ids = utils.sortElementsByScoreTime(this.selectedElements, this.vrvToolkit);
    ids = speed.filterElements(ids, this.xmlDoc);
    console.info('invertPlacement ids: ', ids);
    for (id of ids) {
      this.updateNotation = false; // no need to reload xmlDOM
      var el = this.xmlDoc.querySelector("[*|id='" + id + "']");
      let chordId = utils.insideParent(id);
      if (el && el.nodeName == 'note') {
        if (chordId) id = chordId;
        el = this.xmlDoc.querySelector("[*|id='" + id + "']");
      }
      if (!el) {
        console.info('invertPlacement(): element not found', id);
        continue;
      }
      let noteList, range;
      let attribute = '';
      let value = 'above';
      // placement above/below as in dir, dynam...
      if (att.attPlacement.includes(el.nodeName)) {
        attribute = 'place';
        if (el.hasAttribute(attribute) &&
          (att.dataPlacement.includes(value) && el.getAttribute(attribute) != 'below')) {
          value = 'below';
        }
        el.setAttribute(attribute, value);
        range = speed.replaceInTextEditor(txtEdr, el, true);
        txtEdr.autoIndentSelectedRows();
      } else if (att.attCurvature.includes(el.nodeName)) {
        attribute = 'curvedir';
        if (el.hasAttribute(attribute) && el.getAttribute(attribute) == 'above') {
          value = 'below';
        }
        el.setAttribute(attribute, value);
        range = speed.replaceInTextEditor(txtEdr, el, true);
        txtEdr.autoIndentSelectedRows();
      } else if (att.attStems.includes(el.nodeName)) {
        attribute = 'stem.dir', value = 'up';
        if (el.hasAttribute(attribute) && el.getAttribute(attribute) == value) {
          value = 'down';
        }
        el.setAttribute(attribute, value);
        range = speed.replaceInTextEditor(txtEdr, el, true);
        txtEdr.autoIndentSelectedRows();
        // invert @num.place within tuplet
      } else if (el.nodeName == 'tuplet') {
        attribute = 'num.place';
        value = 'above';
        if (el.hasAttribute(attribute) && el.getAttribute(attribute) == value) {
          value = 'below';
        }
        el.setAttribute(attribute, value);
        range = speed.replaceInTextEditor(txtEdr, el, true);
        txtEdr.autoIndentSelectedRows();
        // find all note/chord elements children and execute InvertingAction
      } else if (noteList = el.querySelectorAll("note, chord")) {
        // console.info('noteList: ', noteList);
        attribute = 'stem.dir', value = 'up';
        for (note of noteList) {
          if (note.parentNode.nodeName == 'chord') continue; // skip notes within chords
          if (note.hasAttribute(attribute) && note.getAttribute(attribute) == value) {
            value = 'down';
          }
          note.setAttribute(attribute, value);
          this.updateNotation = false; // no need to reload xmlDOM
          range = speed.replaceInTextEditor(txtEdr, note, true);
          txtEdr.autoIndentSelectedRows();
        }
      } else {
        console.info('invertPlacement(): ' + el.nodeName +
          ' contains no elements to invert.');
      }
      // console.info('TextCursor: ', txtEdr.getCursorBufferPosition());
      if (range) txtEdr.setCursorBufferPosition(range.end);
      this.selectedElements = ids;
      this.speedMode ? this.updateLayout(txtEdr) : this.updateData(txtEdr);
      this.setFocusToVerovioPane();
      this.encodingHasChanged = true;
    }
  }

  // toggle (switch on/off) artic to selected elements
  toggleArtic(txtEdr, artic = "stacc") {
    this.loadXml(txtEdr);
    let ids = speed.filterElements(this.selectedElements, this.xmlDoc);
    this.updateNotation = false;
    let i, range;
    for (i = 0; i < ids.length; i++) {
      let id = ids[i];
      // if an artic inside a note, look at note
      let parentId = utils.insideParent(id, 'note');
      if (parentId) id = parentId;
      // if note inside a chord, look at chord
      parentId = utils.insideParent(id, 'chord');
      if (parentId) id = parentId;
      let note = this.xmlDoc.querySelector("[*|id='" + id + "']");
      if (!note) continue;
      let uuid;
      if (['note', 'chord'].includes(note.nodeName)) {
        uuid = this.toggleArticForNote(note, artic);
        uuid ? ids[i] = uuid : ids[i] = id;
        range = speed.replaceInTextEditor(txtEdr, note, true);
        txtEdr.autoIndentSelectedRows();
      } else if (noteList = utils.findNotes(id)) {
        let noteId;
        for (noteId of noteList) {
          note = this.xmlDoc.querySelector("[*|id='" + noteId + "']");
          uuid = this.toggleArticForNote(note, artic);
          range = speed.replaceInTextEditor(txtEdr, note, true);
          txtEdr.autoIndentSelectedRows();
        }
      }
    }
    if (range) txtEdr.setCursorBufferPosition(range.end);
    this.selectedElements = ids;
    this.speedMode ? this.updateLayout(txtEdr) : this.updateData(txtEdr);
    this.setFocusToVerovioPane();
  }

  toggleArticForNote(note, artic) {
    // console.info('note: ', note);
    note = utils.attrAsElements(note);
    let articChildren;
    let add = false;
    let uuid;
    // check if articulations exist, as elements or attributes
    if (note.hasChildNodes() &&
      ((articChildren = note.querySelectorAll('artic')).length > 0)) {
      // console.info('toggleArtic check children: ', articChildren);
      for (articChild of articChildren) {
        let existingArtic = articChild.getAttribute('artic');
        if (existingArtic == artic) {
          articChild.remove();
          add = false;
        } else {
          add = true;
        }
      }
    } else {
      add = true;
    }
    if (add) { // add artic as element
      let articElement = document.createElementNS(speed.meiNameSpace, 'artic');
      uuid = 'artic-' + utils.generateUUID();
      articElement.setAttributeNS(speed.xmlNameSpace, 'xml:id', uuid);
      articElement.setAttribute('artic', artic);
      // let textNode = document.createTextNode('/n');
      // note.appendChild(textNode);
      note.appendChild(articElement);
    }
    // console.info('modified element: ', note);
    return uuid;
  }

  // shift element (rests, note) up/down by pitch name (1 or 7 steps)
  shiftPitch(txtEdr, deltaPitch) {
    this.loadXml(txtEdr);
    let ids = speed.filterElements(this.selectedElements, this.xmlDoc);
    this.updateNotation = false;
    let i;
    for (i = 0; i < ids.length; i++) {
      let id = ids[i];
      let el = this.xmlDoc.querySelector("[*|id='" + id + "']");
      if (!el) continue;
      if (['rest', 'mRest', 'multiRest'].includes(el.nodeName)) {
        let oloc = 4;
        let ploc = 'c';
        if (el.hasAttribute('oloc')) oloc = parseInt(el.getAttribute('oloc'));
        if (el.hasAttribute('ploc')) ploc = el.getAttribute('ploc');
        let pi = att.pnames.indexOf(ploc) + deltaPitch;
        if (pi > att.pnames.length - 1) {
          pi -= att.pnames.length;
          oloc++;
        } else if (pi < 0) {
          pi += att.pnames.length;
          oloc--;
        }
        el.setAttribute('ploc', att.pnames[pi]);
        el.setAttribute('oloc', oloc);
        range = speed.replaceInTextEditor(txtEdr, el); // , true);
        // txtEdr.autoIndentSelectedRows();
      } else if (['note'].includes(el.nodeName)) {
        let oct = 4;
        let pname = 'c';
        if (el.hasAttribute('oct')) oct = parseInt(el.getAttribute('oct'));
        if (el.hasAttribute('pname')) pname = el.getAttribute('pname');
        let pi = att.pnames.indexOf(pname) + deltaPitch;
        if (pi > att.pnames.length - 1) {
          pi -= att.pnames.length;
          oct++;
        } else if (pi < 0) {
          pi += att.pnames.length;
          oct--;
        }
        el.setAttribute('pname', att.pnames[pi]);
        el.setAttribute('oct', oct);
        range = speed.replaceInTextEditor(txtEdr, el); // , true);
        // txtEdr.autoIndentSelectedRows();
      }
    }
    this.selectedElements = ids;
    this.speedMode ? this.updateLayout(txtEdr) : this.updateData(txtEdr);
    this.setFocusToVerovioPane();
  }

  moveElementToNextStaff(txtEdr, upwards = true) {
    console.info('moveElementToNextStaff(' + (upwards ? 'up' : 'down') + ')');
    this.loadXml(txtEdr);
    let ids = speed.filterElements(this.selectedElements, this.xmlDoc);
    this.updateNotation = false;
    let i;
    let noteList;
    for (i = 0; i < ids.length; i++) {
      let id = ids[i];
      let el = this.xmlDoc.querySelector("[*|id='" + id + "']");
      if (!el) continue;
      if (['note', 'chord', 'rest', 'mRest', 'multiRest'].includes(el.nodeName)) {
        this.staffMover(txtEdr, el, upwards);
      } else if (noteList = utils.findNotes(id)) {
        let noteId;
        for (noteId of noteList) {
          console.info('moving: ' + noteId);
          let sel = this.xmlDoc.querySelector("[*|id='" + noteId + "']");
          this.staffMover(txtEdr, sel, upwards);
        }
      }
    }
    this.selectedElements = ids;
    this.speedMode ? this.updateLayout(txtEdr) : this.updateData(txtEdr);
    this.setFocusToVerovioPane();
  }

  staffMover(txtEdr, el, upwards) {
    let staff = el.closest('staff');
    let staffNo = -1;
    if (staff) staffNo = parseInt(staff.getAttribute('n'));
    // check existing staff attribute
    let staffNoAttr = -1;
    if (el.hasAttribute('staff')) {
      staffNoAttr = parseInt(el.getAttribute('staff'));
    }
    let newStaffNo = -1;
    if (upwards) {
      if (staffNoAttr > 0) newStaffNo = staffNoAttr - 1;
      else newStaffNo = staffNo - 1;
    } else { // downwards
      if (staffNoAttr > 0) newStaffNo = staffNoAttr + 1;
      else newStaffNo = staffNo + 1;
    }
    if (staffNo == newStaffNo) el.removeAttribute('staff');
    else el.setAttribute('staff', newStaffNo);
    speed.replaceInTextEditor(txtEdr, el);
  }

  cleanAccid(txtEdr) {
    this.loadXml(txtEdr, true);
    utils.cleanAccid(this.xmlDoc, txtEdr);
  }

  renumberMeasures(txtEdr, change) {
    this.loadXml(txtEdr, true);
    utils.renumberMeasures(this.xmlDoc, txtEdr, 1, change);
  }

  // WG: jump notation page to text cursor position
  updateNotationToTextposition(txtEdr, update = true) {
    var page;
    if (this.speedMode) {
      page = speed.getPageNumberAtCursor(txtEdr, this.whichBreaks);
    } else {
      let id = utils.getElementIdAtCursor(txtEdr.getBuffer(),
        txtEdr.getCursorBufferPosition());
      // console.info('updateNotationToTextposition() id: ', id);
      page = this.vrvToolkit.getPageWithElement(id);
    }
    if (page && page != this.currentPage) {
      console.info('updateNotationToTextposition(): new page: ' + page);
      this.changeCurrentPage(page);
      if (update) {
        this.updatePage(txtEdr, page);
        this.addNotationEventListeners(txtEdr);
      }
    }
  }

  changeHighlightColor(color) {
    this.customStyle.innerHTML = `.mei-friend #verovio-panel g.highlighted,
      .mei-friend #verovio-panel g.highlighted,
      .mei-friend #verovio-panel g.highlighted,
      .mei-friend #verovio-panel g.highlighted * {
        fill: ${color};
        color: ${color};
        stroke: ${color};
    }`;
  }

  // accepts number or string (first, last, forwards, backwards)
  changeCurrentPage(newPage) {
    let targetpage;
    if ($.isNumeric(newPage)) {
      targetpage = Math.abs(Math.round(newPage));
    } else {
      newPage = newPage.toLowerCase();
      if (newPage === 'first') {
        targetpage = 1
      } else if (newPage === 'last') {
        targetpage = this.pageCount
      } else if (newPage === 'forwards') {
        if (this.currentPage < this.pageCount) {
          targetpage = this.currentPage + 1;
        }
      } else if (newPage === 'backwards') {
        if (this.currentPage > 1) {
          targetpage = this.currentPage - 1;
        }
      } else {
        return;
      }
    }
    if (targetpage > 0 && targetpage <= this.pageCount) {
      this.currentPage = targetpage;
      this.updatePageNumDisplay();
    }
  }

  updatePageNumDisplay() {
    const label = document.getElementById("pagination-label");
    if (label) {
      label.innerHTML = `Page ${this.currentPage} of ${this.pageCount}`;
    }
  }

  showLoadingMessage() {
    this.verovioPanel.innerHTML = `<h2>If your notation fails to load, your markup may contain errors or it may be incompatible with <i>Verovio</i>.</h2>`;
  }

  createHTMLElements(scale) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('mei-friend');
    this.element.setAttribute('tabindex', '-1');


    // Create control form
    this.controlsForm = document.createElement('form');
    this.controlsForm.classList.add('block');
    this.controlsForm.id = 'verovio-controls-form';
    this.element.appendChild(this.controlsForm);

    // zoom controls
    // this.controlsForm.innerHTML += `
    //   <div id="zoom-ctrls" class="block">
    //     <label id="Scale">Scale:</label>
    //     <button id="decrease-scale-btn" class="btn icon icon-diff-removed inline-block-tight" type="range" min="20" max="200" value="50"></button>
    //     <input id="verovio-zoom" class="btn inline-block-tight"></button>
    //     <button id="increase-scale-btn" class="btn icon icon-diff-added inline-block-tight"></button>
    //   </div>
    // `;

    // Zoom controls
    this.zoomCtrls = document.createElement('div');
    this.zoomCtrls.id = 'zoom-ctrls';
    this.controlsForm.appendChild(this.zoomCtrls);

    // zoomLabel = document.createElement('label');
    // zoomLabel.innerText = 'Scale: ';
    // this.zoomCtrls.appendChild(zoomLabel);

    this.decreaseBtn = document.createElement('button');
    this.decreaseBtn.id = "decrease-scale-btn";
    this.decreaseBtn.classList.add('btn');
    this.decreaseBtn.classList.add('btn-sm');
    this.decreaseBtn.classList.add('icon');
    this.decreaseBtn.classList.add('icon-diff-removed');
    this.decreaseBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.decreaseBtn, {
      title: 'Decrease notation'
    });
    this.zoomCtrls.appendChild(this.decreaseBtn);
    // zoomLabel.setAttribute('for', this.decreaseBtn.id);

    this.zoomCtrl = document.createElement("input");
    this.zoomCtrl.id = 'verovio-zoom';
    this.zoomCtrl.classList.add('input-range');
    this.zoomCtrl.setAttribute('type', 'range');
    this.zoomCtrl.setAttribute('min', 20);
    this.zoomCtrl.setAttribute('max', 200);
    this.zoomCtrl.setAttribute('step', 1);
    this.zoomCtrl.setAttribute('value', `${scale}`);
    this.zoomCtrls.appendChild(this.zoomCtrl);
    atom.tooltips.add(this.zoomCtrl, {
      title: 'Scale notation'
    });

    this.increaseBtn = document.createElement('button');
    this.increaseBtn.id = "increase-scale-btn";
    this.increaseBtn.classList.add('btn');
    this.increaseBtn.classList.add('btn-sm');
    this.increaseBtn.classList.add('icon');
    this.increaseBtn.classList.add('icon-diff-added');
    this.increaseBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.increaseBtn, {
      title: 'Increase notation'
    });
    this.zoomCtrls.appendChild(this.increaseBtn);

    this.notationNightModeBtn = document.createElement('button');
    this.notationNightModeBtn.id = "notation-night-mode-btn";
    this.notationNightModeBtn.classList.add('btn');
    this.notationNightModeBtn.classList.add('btn-sm');
    this.notationNightModeBtn.classList.add('icon');
    this.notationNightModeBtn.classList.add('icon-ruby');
    this.notationNightModeBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.notationNightModeBtn, {
      title: 'Invert colors of notation'
    });
    this.zoomCtrls.appendChild(this.notationNightModeBtn);

    // Pagination, page navigation
    this.paginationCtrls = document.createElement('div');
    this.paginationCtrls.id = 'pagination-ctrls';
    this.controlsForm.appendChild(this.paginationCtrls);

    this.firstBtn = document.createElement('button');
    this.firstBtn.id = "first-page-btn";
    this.firstBtn.classList.add('icon');
    this.firstBtn.classList.add('btn');
    this.firstBtn.classList.add('btn-sm');
    this.firstBtn.classList.add('icon-jump-left');
    this.firstBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.firstBtn, {
      title: 'Jump to first page'
    });
    this.firstBtn.setAttribute('type', 'button');
    this.firstBtn.setAttribute('value', 'first');
    this.paginationCtrls.appendChild(this.firstBtn);

    this.prevBtn = document.createElement('button');
    this.prevBtn.id = "prev-page-btn";
    this.prevBtn.classList.add('icon');
    this.prevBtn.classList.add('btn');
    this.prevBtn.classList.add('btn-sm');
    this.prevBtn.classList.add('icon-chevron-left');
    this.prevBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.prevBtn, {
      title: 'Go to previous page'
    });
    this.prevBtn.setAttribute('type', 'button');
    this.prevBtn.setAttribute('value', 'backwards');
    this.paginationCtrls.appendChild(this.prevBtn);

    const paginationLabel = document.createElement('label');
    paginationLabel.id = 'pagination-label';
    paginationLabel.innerHTML = `Loading`;
    this.paginationCtrls.appendChild(paginationLabel);

    this.nextBtn = document.createElement('button');
    this.nextBtn.id = "next-page-btn";
    this.nextBtn.classList.add('btn');
    this.nextBtn.classList.add('btn-sm');
    this.nextBtn.classList.add('icon');
    this.nextBtn.classList.add('icon-chevron-right');
    this.nextBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.nextBtn, {
      title: 'Go to next page'
    });
    this.nextBtn.setAttribute('type', 'button');
    this.nextBtn.setAttribute('value', 'forwards');
    this.paginationCtrls.appendChild(this.nextBtn);

    this.lastBtn = document.createElement('button');
    this.lastBtn.id = "last-page-btn";
    this.lastBtn.classList.add('btn');
    this.lastBtn.classList.add('btn-sm');
    this.lastBtn.classList.add('icon');
    this.lastBtn.classList.add('icon-jump-right');
    this.lastBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.lastBtn, {
      title: 'Jump to last page'
    });
    this.lastBtn.setAttribute('type', 'button');
    this.lastBtn.setAttribute('value', 'last');
    this.paginationCtrls.appendChild(this.lastBtn);

    // WG: updates notation to cursor position in text
    this.updateBtn = document.createElement('button');
    this.updateBtn.id = "update-btn";
    this.updateBtn.classList.add('btn');
    this.updateBtn.classList.add('btn-sm');
    this.updateBtn.classList.add('icon');
    this.updateBtn.classList.add('icon-alignment-align'); // icon-alignment-aligned-to
    this.updateBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.updateBtn, {
      title: 'Flip page to encoding cursor position'
    });
    this.updateBtn.setAttribute('type', 'button');
    this.updateBtn.setAttribute('value', 'update');
    this.paginationCtrls.appendChild(this.updateBtn);


    // breaks selector
    this.breaksCtrls = document.createElement('div');
    this.breaksCtrls.id = 'breaks-ctrls';
    this.breaksCtrls.classList.add('block');
    this.controlsForm.appendChild(this.breaksCtrls);

    this.breaksSelector = document.createElement('select');
    this.breaksSelector.id = 'breaks-select';
    atom.tooltips.add(this.breaksSelector, {
      title: 'Define system/page breaks behavior of notation'
    });
    this.breaksSelector.classList.add('input-select');
    this.breaksCtrls.appendChild(this.breaksSelector);
    // see setBreaksLabels() called from handleWorkerEvents()
    this.speedCheckbox = document.createElement('input');
    this.speedCheckbox.id = "speed-checkbox";
    this.speedCheckbox.setAttribute('type', 'checkbox');
    this.speedCheckbox.setAttribute('checked', 'false');
    this.speedCheckbox.checked = false;
    this.speedCheckbox.disabled = true;
    atom.tooltips.add(this.speedCheckbox, {
      title: 'Speed mode (optimized notation rendering)'
    });
    this.breaksCtrls.appendChild(this.speedCheckbox);

    // MEI encoding update behavior
    this.updateCtrls = document.createElement('div');
    this.updateCtrls.id = 'update-ctrls';
    this.updateCtrls.classList.add('block');
    this.controlsForm.appendChild(this.updateCtrls);

    updateLabel = document.createElement('label');
    updateLabel.innerText = 'Update: ';
    this.updateCtrls.appendChild(updateLabel);
    atom.tooltips.add(updateLabel, {
      title: 'Update behavior of notation after changes in encoding'
    });

    this.liveupdateCtrl = document.createElement("input");
    this.liveupdateCtrl.id = 'live-update-checkbox';
    this.liveupdateCtrl.setAttribute('type', 'checkbox');
    this.liveupdateCtrl.setAttribute('checked', 'true');
    atom.tooltips.add(this.liveupdateCtrl, {
      title: 'Re-render notation automatically after each encoding change'
    });
    updateLabel.setAttribute('for', this.liveupdateCtrl.id);
    this.updateCtrls.appendChild(this.liveupdateCtrl);

    this.codeUpdateBtn = document.createElement('button');
    this.codeUpdateBtn.id = "code-update-btn";
    this.codeUpdateBtn.classList.add('btn');
    this.codeUpdateBtn.classList.add('btn-sm');
    this.codeUpdateBtn.classList.add('icon');
    this.codeUpdateBtn.classList.add('icon-file-symlink-file'); // icon-alignment-aligned-to
    this.codeUpdateBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.codeUpdateBtn, {
      title: 'Re-render encoding manually'
    });
    // this.codeUpdateBtn.innerHTML = 'Redo';
    this.codeUpdateBtn.setAttribute('type', 'button');
    this.codeUpdateBtn.setAttribute('value', 'codeUpdate');
    this.codeUpdateBtn.disabled = true;
    this.updateCtrls.appendChild(this.codeUpdateBtn);

    // font selector
    let fontList = ['Leipzig', 'Bravura', 'Gootville', 'Leland', 'Petaluma'];
    this.fontCtrls = document.createElement('div');
    this.fontCtrls.id = 'font-ctrls';
    this.fontCtrls.classList.add('block');
    this.controlsForm.appendChild(this.fontCtrls);

    this.fontSelector = document.createElement('select');
    this.fontSelector.id = 'font-select';
    atom.tooltips.add(this.fontSelector, {
      title: 'Select engraving font'
    });
    this.fontSelector.classList.add('input-select');
    this.fontCtrls.appendChild(this.fontSelector);
    for (f of fontList)
      this.fontSelector.add(new Option(f));

    // debug controls (for debugging code and testing new functionality)
    this.navigateCtrls = document.createElement('div');
    this.navigateCtrls.id = 'navigate-ctrls';
    this.navigateCtrls.classList.add('block');
    this.controlsForm.appendChild(this.navigateCtrls);

    // debugLabel = document.createElement('label');
    // debugLabel.innerText = 'Navigate: ';
    // this.navigateCtrls.appendChild(debugLabel);

    // this.debugBtn = document.createElement('button');
    // this.debugBtn.id = "debug-btn";
    // this.debugBtn.innerHTML = 'add slur';
    // this.debugBtn.setAttribute('type', 'button');
    // this.debugBtn.setAttribute('value', 'debug');
    // this.navigateCtrls.appendChild(this.debugBtn);
    //
    // this.xBtn = document.createElement('button');
    // this.xBtn.id = "x-btn";
    // this.xBtn.innerHTML = 'X';
    // this.xBtn.setAttribute('type', 'button');
    // this.xBtn.setAttribute('value', 'debug');
    // this.navigateCtrls.appendChild(this.xBtn);

    this.backwardsBtn = document.createElement('button');
    this.backwardsBtn.id = "backwards-btn";
    this.backwardsBtn.classList.add('btn');
    this.backwardsBtn.classList.add('btn-sm');
    this.backwardsBtn.classList.add('icon');
    this.backwardsBtn.classList.add('icon-arrow-left');
    this.backwardsBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.backwardsBtn, {
      title: 'Navigate to left'
    });
    this.navigateCtrls.appendChild(this.backwardsBtn);

    this.forwardsBtn = document.createElement('button');
    this.forwardsBtn.id = "forwards-btn";
    this.forwardsBtn.classList.add('btn');
    this.forwardsBtn.classList.add('btn-sm');
    this.forwardsBtn.classList.add('icon');
    this.forwardsBtn.classList.add('icon-arrow-right');
    this.forwardsBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.forwardsBtn, {
      title: 'Navigate to right'
    });
    this.navigateCtrls.appendChild(this.forwardsBtn);

    this.upwardsBtn = document.createElement('button');
    this.upwardsBtn.id = "upwards-btn";
    this.upwardsBtn.classList.add('btn');
    this.upwardsBtn.classList.add('btn-sm');
    this.upwardsBtn.classList.add('icon');
    this.upwardsBtn.classList.add('icon-arrow-up');
    this.upwardsBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.upwardsBtn, {
      title: 'Navigate to staffN higher layer'
    });
    this.navigateCtrls.appendChild(this.upwardsBtn);

    this.downwardsBtn = document.createElement('button');
    this.downwardsBtn.id = "downwards-btn";
    this.downwardsBtn.classList.add('btn');
    this.downwardsBtn.classList.add('btn-sm');
    this.downwardsBtn.classList.add('icon');
    this.downwardsBtn.classList.add('icon-arrow-down');
    this.downwardsBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.downwardsBtn, {
      title: 'Navigate to next lower layer'
    });
    this.navigateCtrls.appendChild(this.downwardsBtn);


    // Label for displaying Verovio version
    this.versionDiv = document.createElement('div');
    this.versionDiv.id = 'version-div';
    this.versionDiv.classList.add('block');
    this.controlsForm.appendChild(this.versionDiv);

    this.verovioBtn = document.createElement('button');
    this.verovioBtn.id = "verovio-btn";
    this.verovioBtn.classList.add('btn');
    this.verovioBtn.classList.add('btn-sm');
    this.verovioBtn.classList.add('icon');
    this.verovioBtn.classList.add('icon-repo-sync');
    this.verovioBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.verovioBtn, {
      title: 'Regenerate encoding through Verovio (Attention: non-standard encoding will be erased) (ALT: without xml:ids)'
    });
    this.versionDiv.appendChild(this.verovioBtn);

    this.versionLabel = document.createElement('label');
    this.versionLabel.innerText = 'Verovio: ';
    this.versionDiv.appendChild(this.versionLabel);

    this.helpBtn = document.createElement('button');
    this.helpBtn.id = "help-btn";
    this.helpBtn.classList.add('btn');
    this.helpBtn.classList.add('btn-sm');
    this.helpBtn.classList.add('icon');
    this.helpBtn.classList.add('icon-question');
    this.helpBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.helpBtn, {
      title: 'Show overview of keyboard shortcuts for inserting elements'
    });
    this.versionDiv.appendChild(this.helpBtn);

    this.helpPanel = document.createElement('atom-panel');
    this.helpPanel.id = "help-panel";
    this.helpPanel.classList.add('hidden');
    this.element.appendChild(this.helpPanel);
    this.helpPanel.innerHTML = help.helpText;

    // container for on-the-fly changes to CSS styles (to change highlight color)
    this.customStyle = document.createElement('style');
    this.customStyle.type = 'text/css';
    document.querySelector('head').appendChild(this.customStyle);

    // Create container element for Verovio SVG
    this.verovioPanel = document.createElement('div');
    this.verovioPanel.id = 'verovio-panel';
    // this.verovioPanel.classList.add('hidden');
    this.element.appendChild(this.verovioPanel);
  }

  setBreaksLabels() {
    // set options found in default options and replace with nicer texts
    var breaksOptions = {
      auto: 'Automatic',
      smart: 'Smart',
      line: 'System',
      encoded: 'System and page',
      none: 'None'
    };
    var breaks = utils.findKey('breaks', this.tkOptions);
    if (breaks) {
      for (index of breaks.values) {
        if (breaksOptions[index]) {
          this.breaksSelector[this.breaksSelector.options.length] =
            new Option(breaksOptions[index], index);
          if (index == breaks.default) {
            this.breaksSelector[this.breaksSelector.options.length - 1].selected = 'selected';
          }
        } else {
          this.breaksSelector[this.breaksSelector.options.length] =
            new Option(index, index);
        }
      }
    }
  }

  hideByID(id, hide = true) {
    this.waitForElement(`#${id}`, () => {
      const el = $(`#${id}`);
      if (hide) {
        el.addClass('hidden');
      } else {
        el.removeClass('hidden');
      }
    });
  }

  getTitle() {
    // Used by Atom for tab text
    return 'MEI Friend: Verovio engraving';
  }

  getDefaultLocation() {
    // This location will be used if the user hasn't overridden it by dragging the item elsewhere.
    // Valid values are "left", "right", "bottom", and "center" (the default).
    return 'bottom';
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ['bottom', 'left', 'right'];
  }

  getURI() {
    // Used by Atom to identify the view when toggling.
    return 'atom://mei-friend'
  }

  // Returns an object that can be retrieved when package is activated
  serialize() { // = freeze
    return {
      deserializer: 'mei-friend/MeiFriendView',
      currentPage: this.currentPage
    };
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
    this.subscriptions.dispose();
  }

  getElement() {
    return this.element;
  }

  handleWorkerEvents(e) {
    console.log('handleWorkerEvents(): ', e.data);
    switch (e.data.cmd) {
      case 'availableOptions':
        this.tkOptions = e.data.msg;
        this.setBreaksLabels();
        break;
      case 'version':
        this.vrvVersion = e.data.msg;
        this.versionLabel.innerText = "Verovio: " + this.vrvVersion;
        break;
      case 'optionsSet':
        console.log('options set: ' + e.data.msg);
        break;
      case 'pageCount':
        if (!this.speedMode) this.pageCount = e.data.msg;
        if (!this.validateCurrentPage()) { // if curr page num is invalid, reset
          this.currentPage = 1;
        }
        this.updatePageNumDisplay();
        break;
      case 'svg':
        this.verovioPanel.innerHTML = e.data.msg;
        this.updatePageNumDisplay();
        break;
      case 'mei':
        this.activeEditor.setText(e.data.msg);
        this.setFocusToVerovioPane();
        break;
    }
  } // handleWorkerEvents

}
