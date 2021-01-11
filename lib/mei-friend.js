'use babel';

import MeiFriendView from './mei-friend-view';
import { CompositeDisposable } from 'atom';
import * as Verovio from 'verovio';
// var Verovio = require('verovio');
var fs = require( 'fs' );

export default {

  modalPanel: null,
  subscriptions: null,
  vrvToolkit: null,
  meiFriendView: null,

  activate(state) {
    var vrvToolkit;

    verovio.module.onRuntimeInitialized = function () {
      this.vrvToolkit = new Verovio.toolkit();

      console.info('mei-friend.vrvToolkit: version:\n' + this.vrvToolkit.getVersion());
      console.info('mei-friend.vrvToolkit: options:\n' + JSON.stringify(this.vrvToolkit.getAvailableOptions(), null, 2));
    }

    this.meiFriendView = new MeiFriendView(state.meiFriendViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.meiFriendView.getElement(),
      visible: false
    });



    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mei-friend:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.meiFriendView.destroy();
  },

  serialize() {
    return {
      meiFriendViewState: this.meiFriendView.serialize()
    };
  },

  toggle() {
    console.log('MeiFriend was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
