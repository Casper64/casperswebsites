import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { router } from "../routes";

@customElement("main-layout")
export class MainLayout extends LitElement {
  @state()
  private _i = 0;

  protected render(): TemplateResult {
    console.log("rerneder main!");
    return html`<nav>
        <!-- <a href="/">Home</a> -->
        <!-- <a href="/about">About</a> -->
        <button
          @click=${() => {
            router.render("/");
          }}
        >
          Home
        </button>
        <button
          @click=${() => {
            console.log("render other");
            router.render(`/other-${this._i}`);
          }}
        >
          Other
        </button>
      </nav>
      <main>
        <slot></slot>
      </main>
      <footer>
        <my-counter></my-counter>
      </footer> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "main-layout": MainLayout;
  }
}
