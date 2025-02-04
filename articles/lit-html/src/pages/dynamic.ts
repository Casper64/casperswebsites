import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { DynamicRoute } from "../lib/router";

@customElement("dynamic-page")
export class DynamicPage extends DynamicRoute(LitElement, "/dynamic/:id") {
  public connectedCallback(): void {
    // until we make a call super, our element will never be rendered
    super.connectedCallback();
    console.log("Got id: ", this.parameters!.id);
  }

  protected render() {
    // we have access to the parameters and they are typed!
    return html`<h1>Dynamic page ${this.parameters?.id}</h1>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dynamic-page": DynamicPage;
  }
}
