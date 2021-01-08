'use babel';

export default class MeiFriendView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('mei-friend');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'The MeiFriend package is Alive! This message is just to test it.';
    message.classList.add('message');
    this.element.appendChild(message);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
