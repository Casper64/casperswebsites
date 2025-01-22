import { html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("main-layout")
export class MainLayout extends LitElement {
  protected render(): TemplateResult {
    return html`<nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
      <main>
        <slot></slot>
      </main>
      <footer></footer> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "main-layout": MainLayout;
  }
}
