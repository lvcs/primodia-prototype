export class UIController {
  constructor() {
    this.element = document.createElement('div');
    this._state = {};
  }
  
  get state() {
    return this._state;
  }
  
  set state(newState) {
    this._state = { ...this._state, ...newState };
    this.render();
  }

  initialize() {
    // To be implemented by subclasses
  }

  render() {
    // To be implemented by subclasses
  }
} 