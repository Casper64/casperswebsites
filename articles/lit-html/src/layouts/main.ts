import { html, LitElement, TemplateResult } from "lit";
import { customElement, query } from "lit/decorators.js";
import { router } from "../routes";

@customElement("main-layout")
export class MainLayout extends LitElement {
  @query("input#dynamic-nav")
  private _dynamicNavInput?: HTMLInputElement;

  protected render(): TemplateResult {
    return html`<nav>
        <a href="/">Home</a>
        <a href="/other">Other</a>
        <a href="/not-found">Not found</a>
        <a target="_blank" href="https://google.com">Google</a>
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
