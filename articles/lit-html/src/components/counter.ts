import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { CounterController } from "../controllers/counterController";

@customElement("my-counter")
export class MyCounter extends LitElement {
  private _counter = new CounterController(this);

  render() {
    return html`<div>
      <p>Current: ${this._counter.value}</p>
      <button @click=${() => this._counter.increment()}>Click me</button>
    </div>`;
  }
}

// use this typescript feature to get autocomplete for this component while coding html
declare global {
  interface HTMLElementTagNameMap {
    "my-counter": MyCounter;
  }
}
