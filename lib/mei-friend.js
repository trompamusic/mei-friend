'use babel';

import $ from 'jquery';
//import * as Verovio from 'verovio';
var Verovio = require('verovio');
//import Verovio from "http://www.verovio.org/javascript/latest/verovio-toolkit.js"
import path from 'path';
import fs from 'fs';

import MeiFriendView from './mei-friend-view';

import {
  CompositeDisposable,
  Disposable
} from 'atom';

export default {

  subscriptions: null,
  activeEditor: null,
  meiFriendView: null,
  verovioLoad: function() {
    vrvToolkit = new Verovio.toolkit();
    console.info('mei-friend.vrvToolkit: version: ' + vrvToolkit.getVersion());
    // console.info('mei-friend.vrvToolkit: options:\n' + JSON.stringify(vrvToolkit.getAvailableOptions()));
    this.activateSubscriptions(vrvToolkit);
  },

  activate(state) {
    require('atom-package-deps').install('mei-friend')
      .then(function() {
        console.log('All dependencies installed, good to go.')
      });

    this.verovioLoad = this.verovioLoad.bind(this);
    // this.activateSubscriptions = this.activateSubscriptions.bind(this);
    Verovio.module.onRuntimeInitialized = this.verovioLoad;
  },

  activateSubscriptions(vrvToolkit) {
    this.meiFriendView = new MeiFriendView(vrvToolkit);

    this.subscriptions = new CompositeDisposable();

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
      'mei-friend:invertPlacement': () => this.meiFriendView.invertPlacement(this.meiFriendView.selectedElements[0]),
      'mei-friend:nightMode': () => this.meiFriendView.swapNotationColors(),
      'mei-friend:nextNote': () => this.meiFriendView.navigate(this.activeEditor, 'note', 'forwards'),
      'mei-friend:previousNote': () => this.meiFriendView.navigate(this.activeEditor, 'note', 'backwards'),
      'mei-friend:nextMeasure': () => this.meiFriendView.navigate(this.activeEditor, 'measure', 'forwards'),
      'mei-friend:previousMeasure': () => this.meiFriendView.navigate(this.activeEditor, 'measure', 'backwards'),
      'mei-friend:nextPage': () => this.meiFriendView.updatePage(this.activeEditor, 'next', true),
      'mei-friend:previousPage': () => {
        el = $('g#' + this.meiFriendView.lastNoteId);
        let notesOnPanel = el.parents('.page-margin').find('.note').index(el);
        console.info('previousPage(): ' + this.meiFriendView.lastNoteId + ', el: ' + el + ', notesOnPanel: ' + notesOnPanel);
        if (notesOnPanel > 0) {
          this.meiFriendView.setCursorToPageBeginning(this.activeEditor);
        } else {
          this.meiFriendView.updatePage(this.activeEditor, 'prev', true);
        }
      },
      'mei-friend:layerUp': () => this.meiFriendView.navigate(this.activeEditor, 'layer', 'upwards'),
      'mei-friend:layerDown': () => this.meiFriendView.navigate(this.activeEditor, 'layer', 'downwards'),
      'mei-friend:addSlur': () => this.meiFriendView.addControlElement(this.activeEditor, 'slur', 'above'),
      'mei-friend:addTie': () => this.meiFriendView.addControlElement(this.activeEditor, 'tie', 'above'),
      'mei-friend:addSlurBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'slur', 'below'),
      'mei-friend:addTieBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'tie', 'below'),
      'mei-friend:addCresHairpin': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', 'above', 'cres'),
      'mei-friend:addDimHairpin': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', 'above', 'dim'),
      'mei-friend:addCresHairpinBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', 'below', 'cres'),
      'mei-friend:addDimHairpinBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'hairpin', 'below', 'dim'),
      'mei-friend:addFermata': () => this.meiFriendView.addControlElement(this.activeEditor, 'fermata', 'above', 'normal'),
      'mei-friend:addFermataBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'fermata', 'below', 'inv'),
      'mei-friend:addDirective': () => this.meiFriendView.addControlElement(this.activeEditor, 'dir', 'above', 'dolce'),
      'mei-friend:addDirectiveBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'dir', 'below', 'dolce'),
      'mei-friend:addDynamics': () => this.meiFriendView.addControlElement(this.activeEditor, 'dynam', 'above', 'mf'),
      'mei-friend:addDnamicsBelow': () => this.meiFriendView.addControlElement(this.activeEditor, 'dynam', 'below', 'mf'),
      'mei-friend:addTempo': () => this.meiFriendView.addControlElement(this.activeEditor, 'tempo', 'above', 'Allegro'),
      'mei-friend:delete': () => this.meiFriendView.delete(this.activeEditor, this.meiFriendView.selectedElements[0])
    }));

    // Observe the active editor
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(editor => {
      this.activeEditor = editor;
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

  deserializemeiFriendView(serialized) {
    return new meiFriendView();
  },

  resolveNewFileName(path, extensionWithDot) {
    let fullPath = `${path}/untitled${extensionWithDot}`;
    let i = 0;

    while (fs.existsSync(fullPath)) {
      i += 1;
      fullPath = `${path}/untitled${i}${extensionWithDot}`;
    }

    return fullPath;
  },

  convertToMEI() {
    const fullPath = this.activeEditor.getPath()
    const ext = path.extname(fullPath);

    if (ext === ".mei") {
      atom.notifications.addError('Already an MEI file', {
        description: 'Aborting conversion',
        dismissable: true,
      });
      return;
    }

    if (ext === ".musicxml" || ext === ".xml") {
      this.vrvToolkit.loadData(this.activeEditor.getText());
      const log = this.vrvToolkit.getLog();

      if (log === '') { // success
        let newPath = this.resolveNewFileName(path.dirname(fullPath), '.mei');

        const mei = this.vrvToolkit.getMEI(1, 1); // page 1, scoreBased

        atom.workspace.open(newPath)
          .then((textEditor) => {
            textEditor.setText(mei)
          });

      } else { // error
        atom.notifications.addError('Error converting to MEI', {
          description: 'Please ensure that your MusicXML is valid and try again.',
          dismissable: true,
        });
      }
    }
  }


};
