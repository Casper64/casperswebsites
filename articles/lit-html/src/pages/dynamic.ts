import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { DynamicRoute } from "../lib/router";

@customElement("dynamic-page")
export class DynamicPage extends DynamicRoute(LitElement, "/dynamic/:id") {
  protected render() {
    return html`<h1>Dynamic page ${this.parameters?.id}</h1>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dynamic-page": DynamicPage;
  }
}
