// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Route, Router } from "../src/lib/router";

const childRoutes: Route[] = [
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

describe("Parse child routes", () => {
  const router = new Router(childRoutes);

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

  it("Layout route as a child", async () => {
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

    const route2 = await router.render("/default");
    expect(route2).toMatchObject({
      path: "default",
      component: "div",
      child: {
        path: "",
        component: "div",
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

  it("Can match a dynamic route", async () => {
    const route = await router.render("/dynamic/123");
    expect(route).toMatchObject({
      path: "dynamic",
      child: {
        path: ":id",
        parameter: "123",
        component: "test-dynamic-route",
      },
    });
  });
});

const fullRoutes: Route[] = [
  {
    path: "",
    children: [
      {
        path: "/child",
        children: [
          {
            path: "/subchild",
          },
        ],
      },
      {
        path: "/other",
      },
      {
        path: "/sub/route",
      },
    ],
  },
  {
    path: "/test",
    children: [
      {
        path: "/hmm/test",
      },
    ],
  },
  {
    path: "/dynamic/:id",
    children: [
      {
        path: "/sub",
      },
    ],
  },
];

describe("Parse full routes", () => {
  const router = new Router(fullRoutes);

  const root = document.createElement("div");
  document.body.appendChild(root);

  router.mount(root);

  it("Can match a full route", async () => {
    const route = await router.render("/test/hmm/test");
    expect(route).toMatchObject({
      path: "test",
      child: {
        path: "hmm/test",
      },
    });
  });

  it("Can match a full route child of a layout", async () => {
    const route = await router.render("/sub/route");
    expect(route).toMatchObject({
      path: "",
      child: {
        path: "sub/route",
      },
    });
  });

  it("Can match a dynamic full route", async () => {
    const route = await router.render("/dynamic/123");
    expect(route).toMatchObject({
      path: "dynamic/:id",
      parameter: "123",
    });
  });

  it("Can match a full dynamic route with child", async () => {
    const route = await router.render("/dynamic/123/sub");
    expect(route).toMatchObject({
      path: "dynamic/:id",
      parameter: "123",
      child: {
        path: "sub",
      },
    });
  });
});
