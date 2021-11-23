'use babel';

import $ from 'jquery';
import path from 'path';
import fs from 'fs';
import * as utils from './utils';
import * as dutils from './dom-utils';
import * as Verovio from 'verovio';
import MeiFriendView from './mei-friend-view';
import {
  CompositeDisposable,
  Disposable
} from 'atom';

export default {

  subscriptions: null,
  activeEditor: null,
  meiFriendView: null,
  vrvToolkit: null,
  verovioLoad: function() {
    console.info('Starting to load Verovio...');
    vrvToolkit = new Verovio.toolkit();
    console.info('mei-friend.vrvToolkit: version: ' + vrvToolkit.getVersion());
    this.activateSubscriptions(vrvToolkit);
  },

  activate(state) {
    require('atom-package-deps').install('mei-friend')
      .then(function() {
        console.log('All dependencies installed.')
      });
    console.info('Activating MEI-friend: ', state);
    this.verovioLoad = this.verovioLoad.bind(this);
    this.activateSubscriptions = this.activateSubscriptions.bind(this);
    console.info('loader and activater bound.');
    Verovio.module.onRuntimeInitialized = this.verovioLoad;
  },

  activateSubscriptions(vrvToolkit) {
    this.vrvToolkit = vrvToolkit;

    this.subscriptions = new CompositeDisposable();

    // Observe the active editor
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
      this.editor = editor;
      if (editor) {
        this.editor.setTabLength(3);
      }
    }));

    // create MeiFriendView
    this.mFV = new MeiFriendView(vrvToolkit);

    // add opener with view to subscriptions list
    let opener = atom.workspace.addOpener(uri => {
      if (uri === 'atom://mei-friend') {
        return this.mFV;
      }
    });
    this.subscriptions.add(opener);

    // add commands to package
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mei-friend:toggle': () => this.toggle(),
      'mei-friend:convertToMEI': () => this.convertToMEI(),
      'mei-friend:zoomIn': () => this.mFV.zoom(this.editor, +1),
      'mei-friend:zoomOut': () => this.mFV.zoom(this.editor, -1),
      'mei-friend:zoom50': () => this.mFV.zoom(this.editor, 50),
      'mei-friend:zoom100': () => this.mFV.zoom(this.editor, 100),
      'mei-friend:toggleHelp': () => this.mFV.toggleHelp(),
      'mei-friend:hideHelp': () => this.mFV.hideHelp(),
      'mei-friend:invertPlacement': () => this.mFV.invertPlacement(this.editor),
      'mei-friend:betweenPlacement': () => this.mFV.invertPlacement(this.editor, true),
      'mei-friend:nightMode': () => this.mFV.swapNotationColors(),
      'mei-friend:nextNote': () => this.mFV.navigate(this.editor, 'note', 'forwards'),
      'mei-friend:previousNote': () => this.mFV.navigate(this.editor, 'note', 'backwards'),
      'mei-friend:nextMeasure': () => this.mFV.navigate(this.editor, 'measure', 'forwards'),
      'mei-friend:previousMeasure': () => this.mFV.navigate(this.editor, 'measure', 'backwards'),
      'mei-friend:nextPage': () => this.mFV.updatePage(this.editor, 'forwards', true),
      'mei-friend:previousPage': () => {
        if (dutils.isFirstElementOnPage(this.mFV.lastNoteId)) // turn page
          this.mFV.updatePage(this.editor, 'backwards', true);
        else // just to beginning of page
          this.mFV.setCursorToPageBeginning(this.editor);
      },
      'mei-friend:layerUp': () => this.mFV.navigate(this.editor, 'layer', 'upwards'),
      'mei-friend:layerDown': () => this.mFV.navigate(this.editor, 'layer', 'downwards'),
      'mei-friend:addSlur': () => this.mFV.addControlElement(this.editor, 'slur', ''),
      'mei-friend:addSlurBelow': () => this.mFV.addControlElement(this.editor, 'slur', 'below'),
      'mei-friend:addSlurTstamp': () => this.mFV.addControlElement(this.editor, 'slur', '', '', true),
      'mei-friend:addTie': () => this.mFV.addControlElement(this.editor, 'tie', ''),
      'mei-friend:addTieBelow': () => this.mFV.addControlElement(this.editor, 'tie', 'below'),
      'mei-friend:addCresHairpin': () => this.mFV.addControlElement(this.editor, 'hairpin', '', 'cres'),
      'mei-friend:addDimHairpin': () => this.mFV.addControlElement(this.editor, 'hairpin', '', 'dim'),
      'mei-friend:addCresHairpinBelow': () => this.mFV.addControlElement(this.editor, 'hairpin', 'below', 'cres'),
      'mei-friend:addDimHairpinBelow': () => this.mFV.addControlElement(this.editor, 'hairpin', 'below', 'dim'),
      'mei-friend:addFermata': () => this.mFV.addControlElement(this.editor, 'fermata', 'above', 'norm'),
      'mei-friend:addFermataBelow': () => this.mFV.addControlElement(this.editor, 'fermata', 'below', 'inv'),
      'mei-friend:addDirective': () => this.mFV.addControlElement(this.editor, 'dir', 'above', 'dolce'),
      'mei-friend:addDirectiveBelow': () => this.mFV.addControlElement(this.editor, 'dir', 'below', 'dolce'),
      'mei-friend:addDynamics': () => this.mFV.addControlElement(this.editor, 'dynam', 'above', 'mf'),
      'mei-friend:addDnamicsBelow': () => this.mFV.addControlElement(this.editor, 'dynam', 'below', 'mf'),
      'mei-friend:addTempo': () => this.mFV.addControlElement(this.editor, 'tempo', 'above', 'Allegro'),
      'mei-friend:addTempoTstamp': () => this.mFV.addControlElement(this.editor, 'tempo', 'above', 'Allegro', true),
      'mei-friend:addArpeggio': () => this.mFV.addControlElement(this.editor, 'arpeg'),
      'mei-friend:addGlissando': () => this.mFV.addControlElement(this.editor, 'gliss'),
      'mei-friend:addPedalDown': () => this.mFV.addControlElement(this.editor, 'pedal', 'down'),
      'mei-friend:addPedalUp': () => this.mFV.addControlElement(this.editor, 'pedal', 'up'),
      'mei-friend:addMordentAbove': () => this.mFV.addControlElement(this.editor, 'mordent', 'above', 'lower'),
      'mei-friend:addMordentBelow': () => this.mFV.addControlElement(this.editor, 'mordent', 'below', 'lower'),
      'mei-friend:addMordentAboveUpper': () => this.mFV.addControlElement(this.editor, 'mordent', 'above', 'upper'),
      'mei-friend:addMordentBelowUpper': () => this.mFV.addControlElement(this.editor, 'mordent', 'below', 'upper'),
      'mei-friend:addTrillAbove': () => this.mFV.addControlElement(this.editor, 'trill', 'above'),
      'mei-friend:addTrillBelow': () => this.mFV.addControlElement(this.editor, 'trill', 'below'),
      'mei-friend:addTurnAbove': () => this.mFV.addControlElement(this.editor, 'turn', 'above', 'upper'),
      'mei-friend:addTurnBelow': () => this.mFV.addControlElement(this.editor, 'turn', 'below', 'upper'),
      'mei-friend:addTurnAboveLower': () => this.mFV.addControlElement(this.editor, 'turn', 'above', 'lower'),
      'mei-friend:addTurnBelowLower': () => this.mFV.addControlElement(this.editor, 'turn', 'below', 'lower'),
      'mei-friend:toggleStacc': () => this.mFV.toggleArtic(this.editor, 'stacc'),
      'mei-friend:toggleAccent': () => this.mFV.toggleArtic(this.editor, 'acc'),
      'mei-friend:toggleTenuto': () => this.mFV.toggleArtic(this.editor, 'ten'),
      'mei-friend:toggleMarcato': () => this.mFV.toggleArtic(this.editor, 'marc'),
      'mei-friend:toggleStacciss': () => this.mFV.toggleArtic(this.editor, 'stacciss'),
      'mei-friend:cleanAccid': () => this.mFV.cleanAccid(this.editor),
      'mei-friend:renumberMeasuresTest': () => this.mFV.renumberMeasures(this.editor),
      'mei-friend:renumberMeasures': () => this.mFV.renumberMeasures(this.editor, true),
      'mei-friend:delete': () => this.mFV.delete(this.editor, this.mFV.selectedElements[0]),
      'mei-friend:shiftPitchNameUp': () => this.mFV.shiftPitch(this.editor, 1),
      'mei-friend:shiftPitchNameDown': () => this.mFV.shiftPitch(this.editor, -1),
      'mei-friend:shiftOctaveUp': () => this.mFV.shiftPitch(this.editor, 7),
      'mei-friend:shiftOctaveDown': () => this.mFV.shiftPitch(this.editor, -7),
      'mei-friend:moveElementStaffDown': () => this.mFV.moveElementToNextStaff(this.editor, false),
      'mei-friend:moveElementStaffUp': () => this.mFV.moveElementToNextStaff(this.editor, true),
      'mei-friend:addBeam': () => this.mFV.addBeamElement(this.editor, 'beam'),
      'mei-friend:addOctave8Above': () => this.mFV.addOctaveElement(this.editor, 'above', 8),
      'mei-friend:addOctave8Below': () => this.mFV.addOctaveElement(this.editor, 'below', 8),
      'mei-friend:addOctave15Above': () => this.mFV.addOctaveElement(this.editor, 'above', 15),
      'mei-friend:addOctave15Below': () => this.mFV.addOctaveElement(this.editor, 'below', 15)
    }));

    // Destroy any meiFriendViews when the package is deactivated.
    this.subscriptions.add(new Disposable(() => {
      atom.workspace.getPaneItems().forEach(item => {
        if (item instanceof meiFriendView) {
          item.destroy();
        }
      });
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.editor = null;
    this.vrvToolkit = null;
  },

  toggle() {
    atom.workspace.toggle('atom://mei-friend');
  },

  // restore from serialized (frozen) state
  deserializeMeiFriendView({
    vrvToolkit
  }) {
    return null; // new MeiFriendView(vrvToolkit); // null
  },

  resolveNewFileName(pathAndName, extensionWithDot) {
    let fullPath = pathAndName + extensionWithDot;
    let i = 1;
    while (fs.existsSync(fullPath)) {
      fullPath = pathAndName + "_" + (i++) + extensionWithDot;
    }
    return fullPath;
  },

  convertToMEI() {
    // const fullPath = this.editor.getPath()
    const xmlFile = path.parse(this.editor.getPath());
    // const ext = path.extname(fullPath);

    if (xmlFile.ext === ".mei" || utils.hasTag(this.editor, '<mei')) {
      atom.notifications.addError('Already an MEI file', {
        description: 'Aborting conversion',
        dismissable: true,
      });
      return;
    }

    if (xmlFile.ext === ".musicxml" || xmlFile.ext === ".xml" ||
      utils.hasTag(this.editor, '<score-partwise')) {
      this.mFV.vrvToolkit.loadData(this.editor.getText());
      const log = this.mFV.vrvToolkit.getLog();
      if (log === '') { // success
        let newPath = this.resolveNewFileName(
          xmlFile.dir + path.sep + xmlFile.name, '.mei');
        const mei = this.mFV.vrvToolkit.getMEI({
          scoreBased: true,
          pageNo: 0
        }); // page 1, scoreBased
        atom.workspace.open(newPath)
          .then((textEditor) => {
            textEditor.setText(mei)
          });
        // this.mFV.updateAll(this.editor);
      } else { // error
        atom.notifications.addError('Error converting to MEI', {
          description: 'Please ensure that your MusicXML is valid & try again.',
          dismissable: true,
        });
      }
    }
  }

};
