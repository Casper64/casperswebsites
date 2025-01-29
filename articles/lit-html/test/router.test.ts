// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Route, Router } from "../src/lib/router";

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
];

describe("Router init", () => {
  const router = new Router(routes);

  it("Throws render error when root is not mounted", () => {
    expect(() => router.render("/")).rejects.toThrow("Call mount first");
  });

  it("Renders when root is mounted", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    router.mount(root);

    expect(() => router.render("/")).not.toThrow();
  });
});

describe("Parse route", () => {
  const router = new Router(routes);

  const root = document.createElement("div");
  document.body.appendChild(root);

  router.mount(root);

  it("Can match the Layout route", async () => {
    const route = await router.render("/");
    expect(route).toMatchObject({
      path: "",
      component: "main",
      child: {
        path: "",
        component: "article",
      },
    });
  });

  it("Layout route with children must match children", async () => {
    // /default exists, but it has a default child ("") which has a child
    // meaning that child must be matched
    await expect(() => router.render("/default")).rejects.toThrow("404");

    const route = await router.render("/default/span");
    expect(route).toMatchObject({
      path: "default",
      component: "div",
      child: {
        path: "",
        component: "div",
        child: {
          path: "span",
          component: "span",
        },
      },
    });
  });

  it("Can match a different root route", async () => {
    const route = await router.render("/span");
    expect(route).toMatchObject({
      path: "span",
      component: "span",
    });
  });

  it("Can match a child route", async () => {
    const route = await router.render("/div/span");
    expect(route).toMatchObject({
      path: "div",
      component: "div",
      child: {
        path: "span",
        component: "span",
      },
    });
  });
});

describe("Render route DOM", () => {
  const router = new Router(routes);

  const root = document.createElement("div");
  document.body.appendChild(root);
  router.mount(root);

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
    await Reflect.get(router, "_DOMChanges");

    expect(root.innerHTML).toBe("<p></p>");
  });

  it("Has no domchanges when render is called multiple times with the same path", async () => {
    // reset the root
    await router.render("/");

    await router.render("/p");
    const [_1, changes1] = await Reflect.get(router, "_DOMChanges");
    expect(changes1).toBeDefined();
    expect(root.innerHTML).toBe("<p></p>");

    await router.render("/p");
    expect(root.innerHTML).toBe("<p></p>");

    const [_2, changes2] = await Reflect.get(router, "_DOMChanges");
    expect(changes2).toBeUndefined;
  });
});
