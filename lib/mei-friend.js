'use babel';

import $ from 'jquery';
import path from 'path';
import fs from 'fs';
import * as utils from './utils';
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
    Verovio.module.onRuntimeInitialized = this.verovioLoad;
  },

  activateSubscriptions(vrvToolkit) {
    this.vrvToolkit = vrvToolkit;

    this.subscriptions = new CompositeDisposable();

    // Observe the active editor
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
      this.activeEditor = editor;
      if (editor) {
        this.activeEditor.setTabLength(3);
      }
    }));

    // create MeiFriendView
    this.meiFriendView = new MeiFriendView(vrvToolkit);

    // add opener with view to subscriptions list
    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri === 'atom://mei-friend') {
        return this.meiFriendView;
      }
    }));

    // add commands to package
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mei-friend:toggle': () => this.toggle(),
      'mei-friend:convertToMEI': () => this.convertToMEI(),
      'mei-friend:toggleHelp': () => this.meiFriendView.toggleHelp(),
      'mei-friend:hideHelp': () => this.meiFriendView.hideHelp(),
      'mei-friend:invertPlacement': () => this.meiFriendView.invertPlacement(this.activeEditor),
      'mei-friend:betweenPlacement': () => this.meiFriendView.invertPlacement(this.activeEditor, true),
      'mei-friend:nightMode': () => this.meiFriendView.swapNotationColors(),
      'mei-friend:nextNote': () => this.meiFriendView.navigate(this.activeEditor, 'note', 'forwards'),
      'mei-friend:previousNote': () => this.meiFriendView.navigate(this.activeEditor, 'note', 'backwards'),
      'mei-friend:nextMeasure': () => this.meiFriendView.navigate(this.activeEditor, 'measure', 'forwards'),
      'mei-friend:previousMeasure': () => this.meiFriendView.navigate(this.activeEditor, 'measure', 'backwards'),
      'mei-friend:nextPage': () => this.meiFriendView.updatePage(this.activeEditor, 'next', true),
      'mei-friend:previousPage': () => {
        let el = $('g#' + this.meiFriendView.lastNoteId);
        if (el.parents('.page-margin').find('.note').index(el) > 0) {
          this.meiFriendView.setCursorToPageBeginning(this.activeEditor);
        } else {
          this.meiFriendView.updatePage(this.activeEditor, 'prev', true);
        }
      },
      'mei-friend:layerUp': () => this.meiFriendView.navigate(this.activeEditor, 'layer', 'upwards'),
      'mei-friend:layerDown': () => this.meiFriendView.navigate(this.activeEditor, 'layer', 'downwards'),
      'mei-friend:addSlur': () => this.meiFriendView.addControlElement(this.activeEditor, 'slur', ''),
      'mei-friend:addSlurBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'slur', 'below'),
      'mei-friend:addSlurTstamp': () => this.meiFriendView.addControlElement(this.activeEditor, 'slur', '', '', true),
      'mei-friend:addTie': () => this.meiFriendView.addControlElement(this.activeEditor, 'tie', ''),
      'mei-friend:addTieBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'tie', 'below'),
      'mei-friend:addCresHairpin': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', '', 'cres'),
      'mei-friend:addDimHairpin': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', '', 'dim'),
      'mei-friend:addCresHairpinBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', 'below', 'cres'),
      'mei-friend:addDimHairpinBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', 'below', 'dim'),
      'mei-friend:addFermata': () => this.meiFriendView.addControlElement(this.activeEditor, 'fermata', 'above', 'norm'),
      'mei-friend:addFermataBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'fermata', 'below', 'inv'),
      'mei-friend:addDirective': () => this.meiFriendView.addControlElement(this.activeEditor, 'dir', 'above', 'dolce'),
      'mei-friend:addDirectiveBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'dir', 'below', 'dolce'),
      'mei-friend:addDynamics': () => this.meiFriendView.addControlElement(this.activeEditor, 'dynam', 'above', 'mf'),
      'mei-friend:addDnamicsBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'dynam', 'below', 'mf'),
      'mei-friend:addTempo': () => this.meiFriendView.addControlElement(this.activeEditor, 'tempo', 'above', 'Allegro'),
      'mei-friend:addTempoTstamp': () => this.meiFriendView.addControlElement(this.activeEditor, 'tempo', 'above', 'Allegro', true),
      'mei-friend:addArpeggio': () => this.meiFriendView.addControlElement(this.activeEditor, 'arpeg'),
      'mei-friend:addGlissando': () => this.meiFriendView.addControlElement(this.activeEditor, 'gliss'),
      'mei-friend:addPedalDown': () => this.meiFriendView.addControlElement(this.activeEditor, 'pedal', 'down'),
      'mei-friend:addPedalUp': () => this.meiFriendView.addControlElement(this.activeEditor, 'pedal', 'up'),
      'mei-friend:addMordentAbove': () => this.meiFriendView.addControlElement(this.activeEditor, 'mordent', 'above', 'lower'),
      'mei-friend:addMordentBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'mordent', 'below', 'lower'),
      'mei-friend:addMordentAboveUpper': () => this.meiFriendView.addControlElement(this.activeEditor, 'mordent', 'above', 'upper'),
      'mei-friend:addMordentBelowUpper': () => this.meiFriendView.addControlElement(this.activeEditor, 'mordent', 'below', 'upper'),
      'mei-friend:addTrillAbove': () => this.meiFriendView.addControlElement(this.activeEditor, 'trill', 'above'),
      'mei-friend:addTrillBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'trill', 'below'),
      'mei-friend:addTurnAbove': () => this.meiFriendView.addControlElement(this.activeEditor, 'turn', 'above', 'upper'),
      'mei-friend:addTurnBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'turn', 'below', 'upper'),
      'mei-friend:addTurnAboveLower': () => this.meiFriendView.addControlElement(this.activeEditor, 'turn', 'above', 'lower'),
      'mei-friend:addTurnBelowLower': () => this.meiFriendView.addControlElement(this.activeEditor, 'turn', 'below', 'lower'),
      'mei-friend:toggleStacc': () => this.meiFriendView.toggleArtic(this.activeEditor, 'stacc'),
      'mei-friend:toggleAccent': () => this.meiFriendView.toggleArtic(this.activeEditor, 'acc'),
      'mei-friend:toggleTenuto': () => this.meiFriendView.toggleArtic(this.activeEditor, 'ten'),
      'mei-friend:toggleMarcato': () => this.meiFriendView.toggleArtic(this.activeEditor, 'marc'),
      'mei-friend:toggleStacciss': () => this.meiFriendView.toggleArtic(this.activeEditor, 'stacciss'),
      'mei-friend:cleanAccid': () => this.meiFriendView.cleanAccid(this.activeEditor),
      'mei-friend:renumberMeasuresTest': () => this.meiFriendView.renumberMeasures(this.activeEditor),
      'mei-friend:renumberMeasures': () => this.meiFriendView.renumberMeasures(this.activeEditor, true),
      'mei-friend:delete': () => this.meiFriendView.delete(this.activeEditor, this.meiFriendView.selectedElements[0]),
      'mei-friend:shiftPitchNameUp': () => this.meiFriendView.shiftPitch(this.activeEditor, 1),
      'mei-friend:shiftPitchNameDown': () => this.meiFriendView.shiftPitch(this.activeEditor, -1),
      'mei-friend:shiftOctaveUp': () => this.meiFriendView.shiftPitch(this.activeEditor, 7),
      'mei-friend:shiftOctaveDown': () => this.meiFriendView.shiftPitch(this.activeEditor, -7),
      'mei-friend:moveElementStaffDown': () => this.meiFriendView.moveElementToNextStaff(this.activeEditor, false),
      'mei-friend:moveElementStaffUp': () => this.meiFriendView.moveElementToNextStaff(this.activeEditor, true)
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
    this.activeEditor = null;
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
    // const fullPath = this.activeEditor.getPath()
    const xmlFile = path.parse(this.activeEditor.getPath());
    // const ext = path.extname(fullPath);

    if (xmlFile.ext === ".mei" || utils.hasTag(this.activeEditor, '<mei')) {
      atom.notifications.addError('Already an MEI file', {
        description: 'Aborting conversion',
        dismissable: true,
      });
      return;
    }

    if (xmlFile.ext === ".musicxml" || xmlFile.ext === ".xml" ||
      utils.hasTag(this.activeEditor, '<score-partwise')) {
      this.meiFriendView.vrvToolkit.loadData(this.activeEditor.getText());
      const log = this.meiFriendView.vrvToolkit.getLog();
      if (log === '') { // success
        let newPath = this.resolveNewFileName(
          xmlFile.dir + path.sep + xmlFile.name, '.mei');
        const mei = this.meiFriendView.vrvToolkit.getMEI({
          scoreBased: true,
          pageNo: 0
        }); // page 1, scoreBased
        atom.workspace.open(newPath)
          .then((textEditor) => {
            textEditor.setText(mei)
          });
        // this.meiFriendView.updateAll(this.activeEditor);
      } else { // error
        atom.notifications.addError('Error converting to MEI', {
          description: 'Please ensure that your MusicXML is valid and try again.',
          dismissable: true,
        });
      }
    }
  }

};
