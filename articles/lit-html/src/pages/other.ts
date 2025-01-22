import { LitElement, TemplateResult, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("other-page")
export class OtherPage extends LitElement {
  protected render(): TemplateResult {
    return html`<h1>Other page</h1>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "other-page": OtherPage;
  }
}
