import { LitElement, TemplateResult, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("app-root")
export class AppRoot extends LitElement {
  protected render(): TemplateResult {
    return html`<p>Hello world!</p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": AppRoot;
  }
}
