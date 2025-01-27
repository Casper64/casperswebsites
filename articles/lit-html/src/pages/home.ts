import { LitElement, TemplateResult, html } from "lit";
import { customElement } from "lit/decorators.js";
import "../components/counter";

@customElement("home-page")
export class HomePage extends LitElement {
  protected render(): TemplateResult {
    return html`
      <h1>Home page</h1>
      <my-counter></my-counter>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "home-page": HomePage;
  }
}
