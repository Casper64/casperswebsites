import { html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { router } from "../routes";

@customElement("main-layout")
export class MainLayout extends LitElement {
  protected render(): TemplateResult {
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
            router.render("/other");
          }}
        >
          Other
        </button>
        <button
          @click=${() => {
            router.render("/error");
          }}
        >
          Not found
        </button>
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
