'use babel';

import $ from 'jquery';
import path from 'path';
import Help from './help';

export default class MeiFriendView {

  constructor(vt) {
    this.currentPage = 0;
    this.pageCount = 0;
    this.selectedElements = [];
    this.lastNoteId = '';
    this.notationNightMode = false;
    this.vrvToolkit = vt;
    this.tkOptions = this.vrvToolkit.getAvailableOptions();

    const initialScale = 45;

    this.createHTMLElements(initialScale);

    // Display Verovio version
    versionLabel.innerText = "Verovio: " + this.vrvToolkit.getVersion();

    // Create options object with default options
    this.vrvOptions = {
      adjustPageHeight: "true",
      breaks: "auto",
      scale: initialScale,
      pageWidth: 100, // has no effect if noLayout is enabled
      pageHeight: 100, // has no effect if noLayout is enabled
      pageMarginLeft: 25,
      pageMarginRight: 0,
      pageMarginBottom: 0,
      pageMarginTop: 0,
      spacingLinear: .2,
      spacingNonLinear: .5
    };

    // when highlight color is changed, add/update css in head of document
    // this.hlghtCtrl.addEventListener('change', () => {
    //   this.changeHighlightColor(this.hlghtCtrl.value)
    // });

    //new KeyBindings(this);

    // observe active pane, display content accordingly
    this.subscriptions = atom.workspace.getCenter().observeActivePaneItem(item => {
      if (!atom.workspace.isTextEditor(item)) {
        this.verovioPanel.innerHTML = "<h2>Open an MEI file to see it rendered here as music notation.</h2>";
        this.hideByID(this.controlsForm.id);
        return;
      }

      let uri;
      try {
        uri = item.getPath();
      } catch (e) {
        console.log(e);
        this.hideByID(this.controlsForm.id);
        return;
      }

      const ext = path.extname(uri);

      if (ext !== ".mei") {
        this.verovioPanel.innerHTML = "<h2>This is not an MEI file. Notation will only be rendered for files ending in .mei that contain valid MEI markup.</h2>";
        this.hideByID(this.controlsForm.id);
        return;
      }

      // ensure that form controls are enabled
      this.hideByID(this.controlsForm.id, false);

      // if file is large (contains many <staff> elements), turn pagination on and hide checkbox
      // that would allow it to be disabled
      this.forcePagination(item.getText());

      // wait for #verovioPanel, then set Verovio options, load MEI data, and do initial render
      this.waitForElement(`#${this.verovioPanel.id}`, () => {
        this.updateAll(item)
      });

      this.lastNoteId = this.getIdOfItemAtCursor(item.getBuffer(), item.getCursorBufferPosition());
      if (this.lastNoteId == null) {
        // TODO find first // NOTE: ID in item
      }

      // Toolbar listeners

      // when zoom level is changed, update options and re-render notation
      this.waitForElement(`#${this.zoomCtrl.id}`, () => {
        $(`#${this.zoomCtrl.id}`).off('change').on('change', () => {
          this.updateAll(item);
          this.setFocusToVerovioPane()
        });
      });

      // zoom -
      this.waitForElement(`#${this.decreaseBtn.id}`, () => {
        $(`#${this.decreaseBtn.id}`).off('click').on('click', () => {
          this.zoomCtrl.value = parseInt(this.zoomCtrl.value) - 1;
          this.updateAll(item);
          this.setFocusToVerovioPane()
        });
      });

      // zoom +
      this.waitForElement(`#${this.increaseBtn.id}`, () => {
        $(`#${this.increaseBtn.id}`).off('click').on('click', () => {
          this.zoomCtrl.value = parseInt(this.zoomCtrl.value) + 1;
          this.updateAll(item);
          this.setFocusToVerovioPane()
        });
      });

      // swap notation night mode
      this.waitForElement(`#${this.notationNightModeBtn.id}`, () => {
        $(`#${this.notationNightModeBtn.id}`).off('click').on('click', () => {
          this.swapNotationColors();
          this.setFocusToVerovioPane()
        });
      });

      // when pagination is enabled or disabled, update options and re-render notation
      this.waitForElement(`#${this.layoutCtrl.id}`, () => {
        $(`#${this.layoutCtrl.id}`).off('change').on('change', () => {
          this.currentPage = 1; // if pagination is toggled, always reset to 1
          const paginated = this.layoutCtrl.checked ? 0 : 1;
          if (paginated === 0) {
            // show pagination controls
            // this.hideByID(this.paginationCtrls.id, false);
          } else {
            // hide pagination controls
            this.hideByID(this.paginationCtrls.id);
          }
          this.updateAll(item);
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
          this.setVerovioOptions({});
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
          };
          this.setFocusToVerovioPane()
        });
      });

      // update code
      this.waitForElement(`#${this.codeUpdateBtn.id}`, () => {
        $(`#${this.codeUpdateBtn.id}`).off('click').on('click', () => {
          this.updateNotationToTextposition(item);
          this.updateAll(item);
          this.setFocusToVerovioPane()
        });
      });

      // debug button
      // this.waitForElement(`#${this.debugBtn.id}`, () => {
      //   $(`#${this.debugBtn.id}`).off('click').on('click', () => {
      //     this.addControlElement(item);
      //     this.updateAll(item);
      //     this.setFocusToVerovioPane()
      //   });
      // });

      // x button TODO reversePlacement
      // this.waitForElement(`#${this.xBtn.id}`, () => {
      //   $(`#${this.xBtn.id}`).off('click').on('click', () => {
      //     //this.addControlElement(item);
      //     //this.updateAll(item);
      //     //this.setFocusToVerovioPane()
      //   });
      // });

      // V button: re-run verovio to refactor MEI (including UUIDs)
      this.waitForElement(`#${this.verovioBtn.id}`, () => {
        $(`#${this.verovioBtn.id}`).off('click').on('click', () => {
          this.loadVerovioData(item.getText());
          item.setText(this.vrvToolkit.getMEI(0, 1));
          this.setFocusToVerovioPane()
        });
      });

      // forwards ">" button: navigate to next note forwards
      this.waitForElement(`#${this.forwardsBtn.id}`, () => {
        $(`#${this.forwardsBtn.id}`).off('click').on('click', () => {
          this.navigate(item, 'note', 'forwards');
          this.setFocusToVerovioPane()
        });
      });

      // backwards "<" button: navigate to next note forwards
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

      // downwards "<" button: navigate to next lower layer down
      this.waitForElement(`#${this.downwardsBtn.id}`, () => {
        $(`#${this.downwardsBtn.id}`).off('click').on('click', () => {
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
        if (this.layoutCtrl.checked) {
          this.updateLayout(item);
          this.setFocusToVerovioPane()
        }
      });

      // Use a mutation observer to re-render notation when panes are resized or shown/hidden
      const observer = new MutationObserver((m) => {
        if (this.layoutCtrl.checked) {
          // console.log(m);
          this.updateLayout(item);
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
        if (this.liveupdateCtrl.checked) {
          this.forcePagination(item.getText());
          this.setNotationColors();
          this.updateData(item);
        }
      });

      // when cursor is moved, highlight notation that matches element at new cursor position
      item.onDidChangeCursorPosition(() => {
        this.selectedElements = [];
        this.setNotationColors();
        this.updateHighlight(item);
      });
    });

  }

  // change options, load new data, render current page, add listeners, highlight
  updateAll(textEditor, options = {}, setCursorToPageBeginning = false) {
    this.showLoadingMessage();
    this.setVerovioOptions(options);
    this.loadVerovioData(textEditor.getText());
    this.showCurrentPage();
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(textEditor);
    this.addNotationEventListeners(textEditor);
    this.setNotationColors();
    this.updateHighlight(textEditor);
  }

  // add new data and render current page without changing options
  updateData(textEditor, setCursorToPageBeginning = false) {
    this.showLoadingMessage();
    this.loadVerovioData(textEditor.getText());
    this.showCurrentPage();
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(textEditor);
    this.addNotationEventListeners(textEditor);
    this.setNotationColors();
    this.updateHighlight(textEditor);
  }

  // go to new page without changing data or options
  updatePage(textEditor, page, setCursorToPageBeginning = false) {
    this.changeCurrentPage(page);
    this.showCurrentPage();
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(textEditor);
    this.addNotationEventListeners(textEditor);
    this.setNotationColors();
    this.updateHighlight(textEditor);
  }

  // update layout with no changes to data or page
  updateLayout(textEditor, options = {}, setCursorToPageBeginning = false) {
    this.showLoadingMessage();
    this.setVerovioOptions(options);
    this.redoVerovioLayout();
    this.showCurrentPage();
    if (setCursorToPageBeginning) this.setCursorToPageBeginning(textEditor);
    this.addNotationEventListeners(textEditor);
    this.setNotationColors();
    this.updateHighlight(textEditor);
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
    this.vrvToolkit.redoLayout();
    this.pageCount = this.vrvToolkit.getPageCount();
  }

  setVerovioOptions(newOptions = {}) {
    let dimensions = this.getContainerSize();

    // zoom controls
    this.vrvOptions.scale = parseInt(this.zoomCtrl.value);

    // parse breaks options from selector
    this.vrvOptions.breaks = this.breaksSelector.options[this.breaksSelector.selectedIndex].value;

    if (this.vrvOptions.breaks !== "none") {
      this.vrvOptions.pageWidth = Math.max(Math.round(dimensions.pageWidth * (100 / this.vrvOptions.scale)), 100);
      this.vrvOptions.pageHeight = Math.max(Math.round(dimensions.pageHeight * (100 / this.vrvOptions.scale)), 100);
    }

    // overwrite existing options if new ones are passed in
    for (let key in newOptions) {
      this.vrvOptions[key] = newOptions[key];
    }

    this.vrvToolkit.setOptions(this.vrvOptions);
  }

  loadVerovioData(data) {
    this.pageCount = 0;
    try {
      this.vrvToolkit.loadData(data);
      this.vrvToolkit.renderToMIDI();
      this.pageCount = this.vrvToolkit.getPageCount();
    } catch (e) {
      console.log(e);
      return;
    }

    if (!this.validateCurrentPage()) {
      // if current page number is not valid, reset to 1
      this.currentPage = 1;
    }
  }

  showCurrentPage() {
    // No data loaded
    if (this.pageCount === 0) {
      return;
    }

    if (!this.validateCurrentPage()) {
      this.currentPage = 1;
    }

    try {
      this.verovioPanel.innerHTML = this.vrvToolkit.renderToSVG(this.currentPage, {});
    } catch (e) {
      console.log(e);
      return;
    }

    this.updatePageNumDisplay();
  }

  validateCurrentPage() {
    return (this.currentPage > 0 && this.currentPage <= this.pageCount);
  }

  setCursorToPageBeginning(textEditor) {
    // TODO: read selectedElements[0] and find right staff/layer...
    // set cursor to first note id in page
    let id = $('.note').first().attr('id');
    let range = this.locateIdInBuffer(textEditor.getBuffer(), id);
    if (range) {
      textEditor.setCursorBufferPosition([range.start.row, range.start.column]);
    }
    console.info('setCursorToPageBeginning(): lastNoteId: ' + this.lastNoteId + ', new id: ' + id);
    this.selectedElements[0] = id;
    this.lastNoteId = id;
  }

  addNotationEventListeners(textEditor) {
    let elements = $(`#${this.verovioPanel.id}`).find('g[id]');
    if (elements.length !== 0) {
      elements.bind('mouseup', (el) => {
        this.handleClickOnNotation(el, textEditor);
      });
    } else {
      setTimeout(() => {
        this.addNotationEventListeners(textEditor);
      }, 50);
    }
  }

  // find item by id in buffer
  locateIdInBuffer(buffer, itemId) {
    const searchString = new RegExp(`(?:xml:id="${itemId}")`);
    let range;
    buffer.scan(searchString, (obj) => {
      range = obj.range;
      obj.stop();
    });
    return range;
  }

  handleClickOnNotation(e, textEditor) {
    e.stopImmediatePropagation();
    // console.info(JSON.stringify(e));

    let itemId = String(e.currentTarget.id);
    console.info('handleClickOnNotation() id: ' + itemId);

    if (e.shiftKey) {
      this.selectedElements.push(itemId);
      console.info('handleClickOnNotation() added: ' + this.selectedElements[this.selectedElements.length - 1] + ', size now: ' + this.selectedElements.length);
    } else {
      // set cursor position in buffer
      let range = this.locateIdInBuffer(textEditor.getBuffer(), itemId);
      if (range) {
        textEditor.setCursorBufferPosition([range.start.row, range.start.column]);
      }
      this.selectedElements = [];
      this.selectedElements.push(itemId);
      console.info('handleClickOnNotation() newly created: ' + this.selectedElements[this.selectedElements.length - 1] + ', size now: ' + this.selectedElements.length);
    }
    this.updateHighlight(textEditor);
    this.setFocusToVerovioPane();
    this.lastNoteId = itemId;
  }

  updateHighlight(textEditor) {
    // clear existing highlighted classes
    let highlighted = $('g.highlighted');
    if (highlighted) highlighted.removeClass('highlighted');
    let id;
    if (this.selectedElements.length > 1) {
      for (id of this.selectedElements) {
        $('g#' + id).addClass('highlighted');
      }
    } else {
      id = this.getIdOfItemAtCursor(textEditor.getBuffer(), textEditor.getCursorBufferPosition());
      // if matching g element found, add highlighted class
      if (id) {
        $('g#' + id).addClass('highlighted');
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
    } else {
      this.hideByID(this.helpPanel.id);
      this.hideByID(this.verovioPanel.id, false);
    }
  }

  hideHelp() {
    if (this.verovioPanel.classList.contains('hidden')) {
      this.hideByID(this.helpPanel.id);
      this.hideByID(this.verovioPanel.id, false);
    }
  }

  // set focus to verovioPane in order to ensure working key bindings
  setFocusToVerovioPane() {
    $(".mei-friend").attr('tabindex', '-1').focus();
  }

  /* navigate forwards/backwards/upwards/downwards in the DOM, as defined
  / by `direction`
  */
  navigate(textEditor, elementName = 'note', direction = 'forwards') {
    if (this.lastNoteId == '') {
      this.setCursorToPageBeginning(textEditor);
    }
    let id = this.lastNoteId;
    let buffer = textEditor.getBuffer();
    let elementsList = '.note, .rest, .mRest';

    let element = $('g#' + id);
    let measure = element.parents('.measure');
    // in case no measure element is found
    if (typeof $(measure).attr('id') === 'undefined') {
      id = $(element).parents('.mei-friend').find('.measure').first().find('.note').first().attr('id');
    } else {
      let staff = element.parents('.staff');
      let layer = element.parents('.layer');
      let staffN = measure.find('.staff').index(staff);
      let layerN = staff.find('.layer').index(layer);
      let noteN = staff.find(elementsList).index(element);
      console.info('\n\nnavigate("' + elementName + '", "' + direction + '").');
      console.info('measure: ' + $(measure).attr('id'));
      console.info('  id: ' + id + ', staffN:' + staffN + '; layerN:' + layerN + ', noteInStaff:' + noteN);

      let row = this.locateIdInBuffer(buffer, id).start.row;
      const numberLikeString = /(?:n=)(?:['"])(\d+?)(?:['"])/;
      let startLayerN = parseInt(this.getParentElementAttribute(buffer, row, 'layer', numberLikeString));
      let startStaffN = parseInt(this.getParentElementAttribute(buffer, row, 'staff', numberLikeString));
      let chordId = $('g#' + id).parents('.chord').attr('id');
      console.info('navigate() cont.: chordId: ' + chordId);
      let i = 0;
      // find elements starting from current note id
      if (elementName == 'note') {
        let tmpId = chordId; // find next note ID in another chord
        do {
          tmp = this.getIdOfNextElement(buffer, row, 'noteOrRest', direction);
          if (tmp[0] === '') break;
          id = tmp[0];
          row = parseInt(tmp[1]);
          tmpId = $('g#' + id).parents('.chord').attr('id');
          console.info('navigate(note) cont.: tmpId: ' + tmpId + ', id: ' + id + ', row: ' + row);
          if (i++ > 20) return;
        } while (tmpId == chordId && typeof tmpId !== 'undefined')
      }

      // up/down in layers
      if (elementName == 'layer') {
        let startTime = this.vrvToolkit.getTimeForElement(id);
        console.info('navigate(layer): startTime: ' + startTime);
        let layers = measure.find('.layer');
        let n = layers.index(layer);
        console.info('layer n: ' + n + ' in ' + layers.length + ' layers.');
        let notes;
        if (direction == 'downwards') {
          notes = layers.slice(++n).first().find(elementsList);
        } else if (direction == 'upwards') {
          notes = layers.slice(Math.max(0, --n)).first().find(elementsList);
        }
        console.info('notes: ' + notes + ', length: ' + notes.length);
        let prevDiff = Number.MAX_VALUE;
        for (let note of notes) {
          console.info('note: ' + note);
          let t = this.vrvToolkit.getTimeForElement($(note).attr('id'));
          if (Math.abs(startTime - t) <= prevDiff) {
            prevDiff = Math.abs(startTime - t);
            id = $(note).attr('id');
          } else {
            break;
          }
        }
        console.info('layer n: ' + n);
      }

      // measure-wise left/right
      if (elementName == 'measure' && direction == 'forwards') { // || typeof id === 'undefined') {
        id = $('g#' + id).parents('.measure').nextAll('.measure').first().find('.staff').slice(staffN).find(elementsList).first().attr('id');
        if (typeof id === 'undefined') {
          id = element.parents('.system').nextAll('.system').first().find('.measure').first().find('.staff').slice(staffN).find(elementsList).first().attr('id');
        }
        if (typeof id === 'undefined' && this.currentPage < this.pageCount) {
          this.changeCurrentPage('next');
          this.showCurrentPage();
          this.addNotationEventListeners(textEditor);
          this.updateHighlight(textEditor);
          this.setFocusToVerovioPane();
          id = $('.staff').slice(staffN).find(elementsList).first().attr('id');
        }
      } else if (elementName == 'measure' && direction == 'backwards') {
        if (noteN > 0) { // if not first note in staff, go to first note in staff
          id = $('g#' + id).parents('.measure').find('.staff').slice(staffN).find(elementsList).first().attr('id');
        } else {
          id = $('g#' + id).parents('.measure').prevAll('.measure').first().find('.staff').slice(staffN).find(elementsList).first().attr('id');
        }
        if (typeof id === 'undefined') {
          id = element.parents('.system').prevAll('.system').first().find('.measure').last().find('.staff').slice(staffN).find(elementsList).first().attr('id');
        }
        if (typeof id === 'undefined' && this.currentPage > 1) {
          this.changeCurrentPage('prev');
          this.showCurrentPage();
          this.addNotationEventListeners(textEditor);
          this.updateHighlight(textEditor);
          this.setFocusToVerovioPane();
          id = $('.measure').last().find('.staff').slice(staffN).find(elementsList).first().attr('id');
        }
      }
      console.info('navigate() found this ID: ' + id);
    }
    // update cursor position in MEI file (buffer)
    if (range = this.locateIdInBuffer(buffer, id)) {
      textEditor.setCursorBufferPosition([range.start.row, range.start.column]);
    }
    this.updateNotationToTextposition(textEditor);
    //
    if (id) {
      this.selectedElements[0] = id;
      this.lastNoteId = id;
    }
  }

  delete(textEditor, id) {
    // TODO validate id
    //console.info('tk.EditInfo(): ' + JSON.stringify(this.vrvToolkit.editInfo()));
    console.info('delete() id: ' + id + '\n' + JSON.stringify(this.vrvToolkit.getElementAttr(id)));

    editorAction = {
      action: 'delete',
      param: {
        elementId: id
      }
    };
    console.info('editorAction: ' + JSON.stringify(editorAction));
    try {
      var res = this.vrvToolkit.edit(editorAction);
    } catch (exception) {
      console.error(exception);
    }
    this.showCurrentPage();
    this.addNotationEventListeners(textEditor);
    this.updateHighlight(textEditor);
    console.info(id + ' deleted.');
    //console.info('tk.EditInfo(): ' + JSON.stringify(this.vrvToolkit.editInfo()));
  }


  // rename to addReferencedElements
  // addControlElement??
  // addTimePointingElements

  // adds a slur element to end of measure; either for one selected note (to the
  // next note in same staff and layer) or to two selected notes.
  addControlElement(textEditor, elementName = 'slur', placementString = '', formString = '') {
    if (this.selectedElements.length <= 2 && this.selectedElements.length > 0) {
      uuid = elementName + '-' + this.generateUUID();
      let startId = '';
      let endId = '';
      startId = this.selectedElements[0];
      // TODO check if selected elements are notes, chords

      if (this.selectedElements.length == 1 && (elementName == 'slur' || elementName == 'tie' || elementName == 'hairpin' || elementName == 'gliss')) {
        // if one selected element, find a second automatically
        range = this.locateIdInBuffer(textEditor.getBuffer(), startId);
        endId = this.getIdOfNextElement(textEditor.getBuffer(), range.start.row, 'note')[0];
      } else if (this.selectedElements.length >= 2) {
        endId = this.selectedElements[this.selectedElements.length - 1];
      }

      // construct MEI code: start with element and xml:id
      insertString = '<' + elementName + ' xml:id="' + uuid + '" ';
      // with always two ids
      if (elementName == 'slur' || elementName == 'tie' || elementName == 'hairpin' || elementName == 'gliss') {
        insertString += 'startid="#' + startId + '" endid="#' + endId + '" ';
      } else if (elementName == 'fermata' || elementName == 'dir' || elementName == 'dynam' || elementName == 'tempo' || elementName == 'pedal') { // only one id
        insertString += 'startid="#' + startId + '" ';
      }
      // possibly a second id, only if existing
      if (endId != '' && (elementName == 'dir' || elementName == 'dynam')) {
        insertString += 'endid="#' + endId + '" ';
      }
      // add form
      if (elementName == 'hairpin' || elementName == 'fermata') {
        insertString += 'form="' + formString + '" ';
      }
      // insert direction for pedal (and a default vgrp, even not yet MEI standard)
      if (elementName == 'pedal') {
        insertString += 'dir="' + placementString + '" vgrp="100" ';
        placementString = '';
      }
      // add placement/curvedir
      if (placementString != '') {
        if (elementName == 'slur' || elementName == 'tie' || elementName == 'phrase') {
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
      if (elementName == 'dir' || elementName == 'dynam' || elementName == 'tempo') {
        insertString += '>' + formString + '</' + elementName + '>';
      } else {
        insertString += '/>';
      }

      pos = this.moveCursorToEndOfMeasure(textEditor); // !! resets selectedElements !!
      this.insertTabs(textEditor, 1);
      textEditor.insertText(insertString);
      textEditor.insertNewline();
      // editorAction = {
      //   action: 'insert',
      //   param: {
      //     elementType: elementName,
      //     startid: startId,
      //     endid: endId
      //   }
      // };
      // console.info('editorAction: ' + JSON.stringify(editorAction, null, 2));
      // try {
      //   var res = this.vrvToolkit.edit(editorAction);
      //   this.vrvToolkit.redoLayout();
      // } catch (exception) {
      //   console.error(exception);
      // }
      // console.log('vrvToolkit.getLog(): \n' + this.vrvToolkit.getLog() + '\n res: ' + res);
      // textEditor.setText(this.vrvToolkit.getMEI());
      // move cursor to newly created element
      let range = this.locateIdInBuffer(textEditor.getBuffer(), uuid);
      if (range) {
        if (elementName == 'dir' || elementName == 'dynam' || elementName == 'tempo') {
          let c = textEditor.getBuffer().lineForRow(range.start.row).indexOf(formString);
          range.start.column = c;
          range.end.column = c + formString.length;
          textEditor.setSelectedBufferRange(range);
        } else {
          textEditor.setCursorBufferPosition([range.start.row, range.start.column]);
        }
        console.info('addControlElement() added: "' + insertString + '"');
        this.lastNoteId = startId; // start moving cursor from starting note
      }
    } else {
      console.info('addControlElement() nothing added. ' + this.selectedElements.length + ' selected elements.');
      return null;
    }
  }



  // TODO reverse or instert att:placement (artic, ...), att.curvature (slur, tie,
  // phrase) and att.stems (note, chord) of current element (or its children,
  // such as all notes/chords within a beam).
  invertPlacement(id) {
    let attr = this.vrvToolkit.getElementAttr(id);
    console.info('reversePlacement: ' + JSON.stringify(attr));
    direction = 'above';
    if (attr.hasOwnProperty('curvedir') && attr.curvedir == 'above') {
      direction = 'below';
    }

    // assume a selected slur for now...
    // <slur xml:id="slur-0000000045564668" startid="#n1673" endid="#n1675" />
    editorAction = {
      action: 'set',
      param: {
        elementId: id,
        attrType: "curvedir",
        attrValue: direction
      }
    };
    console.info('editorAction: ' + JSON.stringify(editorAction));
    try {
      this.vrvToolkit.edit(editorAction);
    } catch (exception) {
      console.error(exception);
    }
    console.log('vrvToolkit.getLog(): \n' + this.vrvToolkit.getLog());
  }

  // add n tabs to current cursor position in textEditor
  insertTabs(textEditor, n) {
    for (let i = 0; i < n; i++) {
      textEditor.insertText('\t');
    }
  }

  // creates a random ID value in Verovio style
  generateUUID() {
    let tmp = Math.round((Math.random() * 32768) * (Math.random() * 32768)).toString();
    uuid = '';
    for (let i = 0; i < 16 - tmp.length; i++) {
      uuid += '0';
    }
    return uuid + tmp;
  }

  // WG: jump notation page to text cursor position
  updateNotationToTextposition(textEditor) {
    let id = this.getIdOfItemAtCursor(textEditor.getBuffer(), textEditor.getCursorBufferPosition());
    var idPage = this.vrvToolkit.getPageWithElement(id);
    if (idPage != this.currentPage) {
      console.info('updateNotationToTextposition(): ' + id + ', new page: ' + idPage);
      this.changeCurrentPage(idPage);
      this.showCurrentPage();
      this.setNotationColors();
      this.updateHighlight(textEditor);
      this.addNotationEventListeners(textEditor);
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

  changeCurrentPage(newPage) { // accepts number or string (first, last, next, prev)
    let targetpage;
    if ($.isNumeric(newPage)) {
      targetpage = Math.abs(Math.round(newPage));
    } else {
      newPage = newPage.toLowerCase();
      if (newPage === 'first') {
        targetpage = 1
      } else if (newPage === 'last') {
        targetpage = this.pageCount
      } else if (newPage === 'next') {
        if (this.currentPage < this.pageCount) {
          targetpage = this.currentPage + 1;
        }
      } else if (newPage === 'prev') {
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

  // scans through text from cursorPosition to find next element elementName
  // (e.g. 'note'), also matching staff and layer
  getIdOfNextElement(text, rw, elementName = 'noteOrRest', direction = 'forwards') {
    const xmlIdString = /(?:xml:id=)(?:['"])(\S+?)(?:['"])/;
    const numberLikeString = /(?:n=)(?:['"])(\d+?)(?:['"])/;
    let row = rw;
    let line;
    let startLayerN = parseInt(this.getParentElementAttribute(text, row, 'layer', numberLikeString));
    let startStaffN = parseInt(this.getParentElementAttribute(text, row, 'staff', numberLikeString));
    console.info('getIdOfNextElement("' + elementName + '", "' + direction + '").');

    if (elementName == 'noteOrRest') {
      if (direction == 'forwards') {
        while (line = text.lineForRow(++row)) {
          if ((line.includes('<note') || line.includes('<rest') || line.includes('<mRest')) &&
            (startStaffN == parseInt(this.getParentElementAttribute(text, row, 'staff', numberLikeString))) &&
            (startLayerN == parseInt(this.getParentElementAttribute(text, row, 'layer', numberLikeString)))) { // && (startLayerN == layerN)
            break;
          }
        }
      } else if (direction == 'backwards') {
        while (line = text.lineForRow(--row)) {
          if ((line.includes('<note') || line.includes('<rest') || line.includes('<mRest')) &&
            (startStaffN == parseInt(this.getParentElementAttribute(text, row, 'staff', numberLikeString))) &&
            (startLayerN == parseInt(this.getParentElementAttribute(text, row, 'layer', numberLikeString)))) { // && (startLayerN == layerN)
            break;
          }
        }
      }
    } else {
      if (direction == 'forwards') {
        while (line = text.lineForRow(++row)) {
          if (line.includes('<' + elementName) &&
            (startStaffN == parseInt(this.getParentElementAttribute(text, row, 'staff', numberLikeString))) &&
            (startLayerN == parseInt(this.getParentElementAttribute(text, row, 'layer', numberLikeString)))) { // && (startLayerN == layerN)
            break;
          }
        }
      } else if (direction == 'backwards') {
        while (line = text.lineForRow(--row)) {
          if (line.includes('<' + elementName) &&
            (startStaffN == parseInt(this.getParentElementAttribute(text, row, 'staff', numberLikeString))) &&
            (startLayerN == parseInt(this.getParentElementAttribute(text, row, 'layer', numberLikeString)))) { // && (startLayerN == layerN)
            break;
          }
        }
      }
    }
    if (typeof line === 'undefined') return ['', row.toString()];
    console.info('  line: ' + line);
    let uuid = line.match(xmlIdString);
    if (uuid) {
      //versionLabel.innerText =  uuid + ', OrigStaff=' + startStaffN + '; OrigLayer=' + startLayerN;
      return [uuid[1], row.toString()];
    } else {
      return ['', row.toString()];
    }
  }

  // look for elementname ('staff') upwards in the xml hierarchy and return
  // attribute value (searchString defaults to the "numberLike" attribute 'n=').
  getParentElementAttribute(text, row, elementName = 'staff', searchString = /(?:n=)(?:['"])(\d+?)(?:['"])/) {
    while (line = text.lineForRow(--row)) {
      if (line.includes('<' + elementName)) {
        return line.match(searchString)[1];
      }
    }
    return null;
  }

  getIdOfItemAtCursor(text, cursorPosition) {
    let result;
    let tag;
    let row = cursorPosition.row;
    let column = cursorPosition.column;
    const closingTagRe = /(?:<[/])(\S+?)(?:[>])/;
    const xmlIdString = /(?:xml:id=)(?:['"])(\S+?)(?:['"])/;

    // get line from current cursor position
    let line = text.lineForRow(row);

    // check if cursor is on a closing tag by stepping backwards through the characters
    for (let j = column; j > 0; j--) {
      if (line[j] === "/" && line[j - 1] === "<") {
        // if closing tag is found, find the name of the tag with regex
        tag = line.slice(j - 1).match(closingTagRe);
        if (tag && Array.isArray(tag)) {
          tag = tag[1];
          break;
        }
      }
    }

    // if closing tag identified, find opening tag and set row number accordingly
    if (tag) {
      for (let k = row - 1; k >= 0; k--) {
        if (text.lineForRow(k).includes(`<${tag}`)) {
          row = k;
          break;
        }
      }
    }

    // search for xml:id in row
    result = text.lineForRow(row).match(xmlIdString);

    // if one is found, return it
    if (result !== null) {
      return result[1];
    }

    // if no id is found, look in parent staff and measure to find one
    let outsideParentStaff = false;

    for (let m = row; m >= 0; m--) {
      line = text.lineForRow(m);

      if (line.includes('<music')) {
        break;
      }

      if (line.includes('</staff')) {
        outsideParentStaff = true;
        continue;
      }

      if (line.includes('<measure') || (line.includes('<staff') && !outsideParentStaff)) {

        result = line.match(xmlIdString);
        if (result !== null) {
          return result[1];
        }

        // if this line is parent <measure>, stop looking
        if (line.includes('<measure')) {
          break;
        }
      }
    }

    // if no xml:id is found, return null
    return null;
  }

  moveCursorToEndOfMeasure(textEditor) {
    let cursorPosition = textEditor.getCursorBufferPosition();
    let text = textEditor.getBuffer();
    const measureEnd = '</measure';
    for (let row = cursorPosition.row; row < textEditor.getLastBufferRow(); row++) {
      line = text.lineForRow(row);
      if (line.includes(measureEnd)) {
        let column = line.indexOf(measureEnd);
        textEditor.setCursorBufferPosition([row, column]);
        return [row, column];
      }
    }
    return null;
  }

  forcePagination(data) {
    // force pagination for files with more than 100 <staff> elements
    const re = /(?:<staff)(?:\s|>)/g;
    const count = (data.match(re) || []).length;

    if (count > 100 && false) { // deactivate pagination permanently
      this.layoutCtrl.checked = true;
      this.hideByID(this.paginationToggle.id); // hide toggle
      this.hideByID(this.paginationCtrls.id, false); // make sure page navigation is showed
    } else {
      this.hideByID(this.paginationToggle.id, false);
    }
  }

  showLoadingMessage() {
    this.verovioPanel.innerHTML = `<h2>If your notation fails to load, your markup may contain errors or it may be incompatible with <i>Verovio</i>.</h2>`;
  }

  createHTMLElements(scale) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('mei-friend');

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

    zoomLabel = document.createElement('label');
    zoomLabel.innerText = 'Scale: ';
    this.zoomCtrls.appendChild(zoomLabel);

    this.decreaseBtn = document.createElement('button');
    this.decreaseBtn.id = "decrease-scale-btn";
    this.decreaseBtn.classList.add('btn');
    this.decreaseBtn.classList.add('btn-nm');
    this.decreaseBtn.classList.add('icon');
    this.decreaseBtn.classList.add('icon-diff-removed');
    this.decreaseBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.decreaseBtn, {
      title: 'Decrease notation'
    });
    // this.decreaseBtn.innerHTML = '<span class="icon icon-diff-removed"></span>';
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
    this.increaseBtn.classList.add('btn-nm');
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
    this.notationNightModeBtn.classList.add('btn-nm');
    this.notationNightModeBtn.classList.add('icon');
    this.notationNightModeBtn.classList.add('icon-ruby');
    this.notationNightModeBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.notationNightModeBtn, {
      title: 'Invert colors of notation'
    });
    this.zoomCtrls.appendChild(this.notationNightModeBtn);


    // Layout (horizontal scroll or vertical with wrapping) controls
    this.paginationToggle = document.createElement('div');
    this.paginationToggle.id = 'pagination-toggle';
    this.paginationToggle.classList.add('block');
    this.controlsForm.appendChild(this.paginationToggle);

    const layoutLabel = document.createElement('label');
    layoutLabel.innerText = 'Paginate:';
    this.paginationToggle.appendChild(layoutLabel);
    this.layoutCtrl = document.createElement("input");
    this.layoutCtrl.id = 'verovio-layout-wrap';
    this.layoutCtrl.setAttribute('type', 'checkbox');
    this.layoutCtrl.setAttribute('checked', 'true');
    layoutLabel.setAttribute('for', this.layoutCtrl.id);
    this.paginationToggle.appendChild(this.layoutCtrl);

    // Pagination
    this.paginationCtrls = document.createElement('div');
    this.paginationCtrls.id = 'pagination-ctrls';
    this.controlsForm.appendChild(this.paginationCtrls);

    this.firstBtn = document.createElement('button');
    this.firstBtn.id = "first-page-btn";
    this.firstBtn.classList.add('icon');
    this.firstBtn.classList.add('btn');
    this.firstBtn.classList.add('btn-nm');
    this.firstBtn.classList.add('icon-jump-left');
    this.firstBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.firstBtn, {
      title: 'Jump to first page'
    });
    // this.firstBtn.innerHTML = '|<';
    this.firstBtn.setAttribute('type', 'button');
    this.firstBtn.setAttribute('value', 'first');
    this.paginationCtrls.appendChild(this.firstBtn);

    this.prevBtn = document.createElement('button');
    this.prevBtn.id = "prev-page-btn";
    this.prevBtn.classList.add('icon');
    this.prevBtn.classList.add('btn');
    this.prevBtn.classList.add('btn-nm');
    this.prevBtn.classList.add('icon-chevron-left');
    this.prevBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.prevBtn, {
      title: 'Go to previous page'
    });
    // this.prevBtn.innerHTML = '<'; // <span class="icon icon-chevron-left"></span>
    this.prevBtn.setAttribute('type', 'button');
    this.prevBtn.setAttribute('value', 'prev');
    this.paginationCtrls.appendChild(this.prevBtn);

    const paginationLabel = document.createElement('label');
    paginationLabel.id = 'pagination-label';
    paginationLabel.innerHTML = `Loading`;
    this.paginationCtrls.appendChild(paginationLabel);

    this.nextBtn = document.createElement('button');
    this.nextBtn.id = "next-page-btn";
    this.nextBtn.classList.add('btn');
    this.nextBtn.classList.add('btn-nm');
    this.nextBtn.classList.add('icon');
    this.nextBtn.classList.add('icon-chevron-right');
    this.nextBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.nextBtn, {
      title: 'Go to next page'
    });
    // this.nextBtn.innerHTML = '>'; // <span class="icon icon-chevron-right"></span>
    this.nextBtn.setAttribute('type', 'button');
    this.nextBtn.setAttribute('value', 'next');
    this.paginationCtrls.appendChild(this.nextBtn);

    this.lastBtn = document.createElement('button');
    this.lastBtn.id = "last-page-btn";
    this.lastBtn.classList.add('btn');
    this.lastBtn.classList.add('btn-nm');
    this.lastBtn.classList.add('icon');
    this.lastBtn.classList.add('icon-jump-right');
    this.lastBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.lastBtn, {
      title: 'Jump to last page'
    });
    // this.lastBtn.innerHTML = '>|'; // <span class="icon icon-jump-right"></span>
    this.lastBtn.setAttribute('type', 'button');
    this.lastBtn.setAttribute('value', 'last');
    this.paginationCtrls.appendChild(this.lastBtn);

    // WG: updates notation to cursor position in text
    this.updateBtn = document.createElement('button');
    this.updateBtn.id = "update-btn";
    this.updateBtn.classList.add('btn');
    this.updateBtn.classList.add('btn-nm');
    this.updateBtn.classList.add('icon');
    this.updateBtn.classList.add('icon-alignment-aligned-to');
    this.updateBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.updateBtn, {
      title: 'Update notation to encoding cursor position'
    });
    // this.updateBtn.innerHTML = 'To code cursor';
    this.updateBtn.setAttribute('type', 'button');
    this.updateBtn.setAttribute('value', 'update');
    this.paginationCtrls.appendChild(this.updateBtn);


    // breaks selector
    this.breaksCtrls = document.createElement('div');
    this.breaksCtrls.id = 'breaks-ctrls';
    this.breaksCtrls.classList.add('block');
    this.controlsForm.appendChild(this.breaksCtrls);

    breaksLabel = document.createElement('label');
    breaksLabel.innerText = 'Breaks: ';
    this.breaksCtrls.appendChild(breaksLabel);

    this.breaksSelector = document.createElement('select');
    this.breaksSelector.id = 'breaks-select';
    atom.tooltips.add(this.breaksSelector, {
      title: 'Set breaks behavior of notation'
    });
    this.breaksSelector.classList.add('input-select');
    this.breaksCtrls.appendChild(this.breaksSelector);
    var breaksOptions = {
      auto: 'Automatic',
      line: 'System',
      encoded: 'System and page',
      none: 'None'
    };
    // console.info('tkOptions: ' + JSON.stringify(this.tkOptions.groups.1-general.options.breaks.values));
    for (index in breaksOptions) {
      this.breaksSelector[this.breaksSelector.options.length] = new Option(breaksOptions[index], index);
    }
    // for (index in this.tkOptions.breaks) {
    //   this.breaksSelector[this.breaksSelector.options.length] = new Option(index, index);
    // }


    // MEI encoding update behavior
    this.updateCtrls = document.createElement('div');
    this.updateCtrls.id = 'update-ctrls';
    this.updateCtrls.classList.add('block');
    this.controlsForm.appendChild(this.updateCtrls);

    updateLabel = document.createElement('label');
    updateLabel.innerText = 'Update live: ';
    this.updateCtrls.appendChild(updateLabel);
    atom.tooltips.add(this.updateCtrls, {
      title: 'Update behavior of notation after encoding changes'
    });

    this.liveupdateCtrl = document.createElement("input");
    this.liveupdateCtrl.id = 'live-update-checkbox';
    this.liveupdateCtrl.setAttribute('type', 'checkbox');
    this.liveupdateCtrl.setAttribute('checked', 'true');
    atom.tooltips.add(this.liveupdateCtrl, {
      title: 'Re-render notation after each encoding change'
    });
    updateLabel.setAttribute('for', this.liveupdateCtrl.id);
    this.updateCtrls.appendChild(this.liveupdateCtrl);

    this.codeUpdateBtn = document.createElement('button');
    this.codeUpdateBtn.id = "code-update-btn";
    this.codeUpdateBtn.classList.add('btn');
    this.codeUpdateBtn.classList.add('btn-nm');
    this.codeUpdateBtn.classList.add('icon');
    this.codeUpdateBtn.classList.add('icon-alignment-aligned-to');
    this.codeUpdateBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.codeUpdateBtn, {
      title: 'Re-render encoding'
    });
    // this.codeUpdateBtn.innerHTML = 'Redo';
    this.codeUpdateBtn.setAttribute('type', 'button');
    this.codeUpdateBtn.setAttribute('value', 'codeUpdate');
    this.codeUpdateBtn.disabled = true;
    this.updateCtrls.appendChild(this.codeUpdateBtn);


    // debug controls (for debugging code and testing new functionality)
    this.navigateCtrls = document.createElement('div');
    this.navigateCtrls.id = 'navigate-ctrls';
    this.navigateCtrls.classList.add('block');
    this.controlsForm.appendChild(this.navigateCtrls);

    debugLabel = document.createElement('label');
    debugLabel.innerText = 'Navigate: ';
    this.navigateCtrls.appendChild(debugLabel);

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
    this.backwardsBtn.classList.add('btn-nm');
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
    this.forwardsBtn.classList.add('btn-nm');
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
    this.upwardsBtn.classList.add('btn-nm');
    this.upwardsBtn.classList.add('icon');
    this.upwardsBtn.classList.add('icon-arrow-up');
    this.upwardsBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.upwardsBtn, {
      title: 'Navigate to next higher layer'
    });
    this.navigateCtrls.appendChild(this.upwardsBtn);

    this.downwardsBtn = document.createElement('button');
    this.downwardsBtn.id = "downwards-btn";
    this.downwardsBtn.classList.add('btn');
    this.downwardsBtn.classList.add('btn-nm');
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
    this.verovioBtn.classList.add('btn-nm');
    this.verovioBtn.classList.add('icon');
    this.verovioBtn.classList.add('icon-repo-sync');
    this.verovioBtn.classList.add('inline-block-tight');
    atom.tooltips.add(this.verovioBtn, {
      title: 'Regenerate encoding through Verovio (Attention: non-standard encoding will be erased)'
    });
    this.versionDiv.appendChild(this.verovioBtn);

    versionLabel = document.createElement('label');
    versionLabel.innerText = 'Verovio: ';
    this.versionDiv.appendChild(versionLabel);

    this.helpBtn = document.createElement('button');
    this.helpBtn.id = "help-btn";
    this.helpBtn.classList.add('btn');
    this.helpBtn.classList.add('btn-nm');
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
    // this.helpPanel.innerHTML = Help.getHelp();
    this.helpPanel.innerHTML = `
      <div class='text-info block'>
        <table>
        <h3 class='text-highlight'>Navigation</h3>
        <tr>
          <td><span class="keyIcon">&rarr;</span></td>
          <td>Select next note, rest, or mRest</td>
        </tr>
        <tr>
          <td><span class="keyIcon">&larr;</span></td>
          <td>Select previous note, rest, or mRest</td>
        </tr>
        <tr>
          <td><span class="keyIcon">&#8984;</span><span class="keyIcon">&rarr;</span></td>
          <td>Select note, rest, mRest in next measure</td>
        </tr>
        <tr>
          <td><span class="keyIcon">&#8984;</span><span class="keyIcon">&larr;</span></td>
          <td>Selected note, rest, mRest in previous measure </td>
        </tr>
        <tr>
          <td><span class="keyIcon">&#8963;</span><span class="keyIcon">&#8984;</span><span class="keyIcon">&rarr;</span></td>
          <td>Select note, rest, mRest in next page</td>
        </tr>
        <tr>
          <td><span class="keyIcon">&#8963;</span><span class="keyIcon">&#8984;</span><span class="keyIcon">&larr;</span></td>
          <td>Selected note, rest, mRest in previous page</td>
        </tr>
        <tr>
          <td><span class="keyIcon">&uarr;</span></td>
          <td>Select note, rest, or mRest one layer up</td>
        </tr>
        <tr>
          <td><span class="keyIcon">&darr;</span></td>
          <td>Select note, rest, or mRest one layer down</td>
        </tr>
        </table>
        <table>
        <h3 class='text-highlight'>Selection</h3>
        <tr>
          <td><span class="keyIcon">&#8679</span><span class="keyIcon">click</span></td>
          <td>Select multiple notes by mouse click</td>
        </tr>
        </table>
      </div>

      <div class='text-info block'>
        <h3 class="text-highlight">Editing functions</h3>
          <p>Key bindings insert elements above selected note by default and below when pressing
            the <span class="keyIcon">CTRL&nbsp;&#8963;</span> key additionally.
            The elements are inserted using @startid and @endid attributes.
            <!--To insert elements with @tstamp and @tstamp2 attributes,
            use the <span class="keyIcon">ALT &#8997;</span> key additionally.-->
          </p>
        <table>
          <tr>
            <td><span class="keyIcon">&#8679;</span><span class="keyIcon">T</span></td>
            <td>Insert tempo above selected note(s)</td>
          </tr>
          <tr>
            <td><span class="keyIcon">F</span></td>
            <td>Insert fermata above selected note</td>
          </tr>
          <tr>
            <td><span class="keyIcon">I</span></td>
            <td>Insert directive above selected note(s)</td>
          </tr>
          <tr>
            <td><span class="keyIcon">D</span></td>
            <td>Insert dynamics above selected note, with extender if two notes selected</td>
          </tr>
            </table>
      </div>
      <div class='text-info block'>
          <table>
            <tr>
              <td><span class="keyIcon">S</span></td>
              <td>Insert <strong>slur</strong> starting/ending on selected notes</td>
            </tr>
            <tr>
              <td><span class="keyIcon">T</span></td>
              <td>Insert tie starting/ending on selected notes</td>
            </tr>
            <tr>
              <td><span class="keyIcon">H</span></td>
              <td>Insert crescendo hairpin starting/ending above selected notes</td>
            </tr>
            <tr>
              <td><span class="keyIcon">&#8984;</span><span class="keyIcon">H</span></td>
              <td>Insert diminuendo hairpin starting/ending above selected notes</td>
            </tr>
          </table>
        </div>
                <div class='text-info block'>
          <table>
          <h5>TODO: Ornaments: N turn, M mordents, L trill</h5>
            <tr>
              <td><span class="keyIcon">A</span></td>
              <td>Insert arpeggio for selected note(s)</td>
            </tr>
            <tr>
              <td><span class="keyIcon">G</span></td>
              <td>Insert glissando starting at first, ending at last selected note</td>
            </tr>
            <tr>
              <td><span class="keyIcon">P</span></td>
              <td>Insert pedal down for selected note(s)</td>
            </tr>
            <tr>
              <td><span class="keyIcon">&#8963;</span><span class="keyIcon">P</span></td>
              <td>Insert pedal up for selected note(s)</td>
            </tr>
          </table>

      </div>
    `;

    // $("#help-panel").load('help.html .text-info');
    // var ajax = new XMLHttpRequest();
    // ajax.open("GET", "help.html", false);
    // ajax.send();
    // this.helpPanel.innerHTML = ajax.responseText;

    // container for on-the-fly changes to CSS styles (to change highlight color)
    this.customStyle = document.createElement('style');
    this.customStyle.type = 'text/css';
    $("head")[0].appendChild(this.customStyle);

    // Create container element for Verovio SVG
    this.verovioPanel = document.createElement('div');
    this.verovioPanel.id = 'verovio-panel';
    // this.verovioPanel.classList.add('hidden');
    this.element.appendChild(this.verovioPanel);

    // var script=document.createElement( 'script' );
    // script.src="https://verovio.org/javascript/develop/verovio-toolkit-wasm.js";
    // document.body.appendChild(script);
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
    return 'Verovio MEI Engraving';
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
  serialize() {
    return {
      deserializer: 'mei-friend/MeiFriendView',
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
}
