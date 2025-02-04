// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { DynamicRoute, Route, Router } from "../src/lib/router";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

const routes: Route[] = [
  {
    path: "",
    component: "main",
    children: [
      {
        path: "",
        component: "article",
      },
    ],
  },
  {
    path: "div",
    component: "div",
    children: [
      {
        path: "span",
        component: "span",
      },
      {
        path: "p",
        component: "p",
      },
    ],
  },
  {
    path: "span",
    component: "span",
  },
  {
    path: "p",
    component: "p",
  },
  {
    path: "default",
    component: "div",
    children: [
      {
        path: "",
        component: "div",
        children: [
          {
            path: "span",
            component: "span",
          },
        ],
      },
    ],
  },
  {
    path: "dynamic",
    children: [
      {
        path: ":id",
        // @ts-ignore we don't want to declare this element globally in typescript
        component: "test-dynamic-route",
      },
    ],
  },
];

@customElement("test-dynamic-route")
class TestDynamicRoute extends DynamicRoute(LitElement, "/dynamic/:id") {
  protected render() {
    return html`<p>${this.parameters?.id}</p>`;
  }
}

describe("Router init", () => {
  const router = new Router(routes);
  router.useRequestAnimationFrame = false;

  it("Throws render error when root is not mounted", async () => {
    await expect(() => router.render("/")).rejects.toThrow("Call mount first");
  });

  it("Renders when root is mounted", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    await router.mount(root, false);

    expect(() => router.render("/")).not.toThrow();
  });
});

describe("Render route DOM", async () => {
  const router = new Router(routes);
  router.useRequestAnimationFrame = false;

  const root = document.createElement("div");
  document.body.appendChild(root);
  await router.mount(root, false);

  it("Can render the default route", async () => {
    await router.render("/");
    expect(root.innerHTML).toBe("<main><article></article></main>");
  });

  it("Can render a different root route", async () => {
    await router.render("/span");
    expect(root.innerHTML).toBe("<span></span>");
  });

  it("Can render a child route", async () => {
    await router.render("/div/span");
    expect(root.innerHTML).toBe("<div><span></span></div>");
  });

  it("Can render a default route with children", async () => {
    await router.render("/default/span");
    expect(root.innerHTML).toBe("<div><div><span></span></div></div>");
  });

  it("Renders the latest result when render is called multiple times", async () => {
    router.render("/span");
    router.render("/p");
    // use reflection to await the internal promise
    await Reflect.get(router, "_renderPromise");

    expect(root.innerHTML).toBe("<p></p>");
  });

  it("Has no domchanges when render is called multiple times with the same path", async () => {
    // reset the root
    await router.render("/");

    await router.render("/p");
    const { applyChanges: changes1 } = await Reflect.get(
      router,
      "_renderPromise"
    );
    expect(changes1).toBeDefined();
    expect(root.innerHTML).toBe("<p></p>");

    await router.render("/p");
    window.requestAnimationFrame(() => expect(root.innerHTML).toBe("<p></p>"));

    const { applyChanges: changes2 } = await Reflect.get(
      router,
      "_renderPromise"
    );
    expect(changes2).toBeUndefined();
  });

  it("Can render a dynamic route without a parent component", async () => {
    await router.render("/dynamic/456");

    expect(root.innerHTML).toBe("<test-dynamic-route></test-dynamic-route>");

    const shadowRootHtml = root.firstElementChild?.shadowRoot?.innerHTML;
    expect(shadowRootHtml).toContain("456</p>");
  });
});
