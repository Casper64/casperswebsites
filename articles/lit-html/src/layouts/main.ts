import { html, LitElement, TemplateResult } from "lit";
import { customElement, query } from "lit/decorators.js";
import { router } from "../routes";

@customElement("main-layout")
export class MainLayout extends LitElement {
  @query("input#dynamic-nav")
  private _dynamicNavInput?: HTMLInputElement;

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
      <header>
        <input type="text" placeholder="Dynamic part" id="dynamic-nav" />
        <button
          @click=${() => {
            if (!this._dynamicNavInput?.value) return;

            router.render(`/dynamic/${this._dynamicNavInput.value}`);
          }}
        >
          Go to dynamic
        </button>
      </header>
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
