import { Route, Router } from "./lib/router";

import "./layouts/main";
import "./pages/home";
import "./pages/other";
import "./pages/dynamic";

const routes: Route[] = [
  // We have defined 1 root route with an empty path attribute
  // This means that this route is always rendered and serves as a layout.
  {
    path: "",
    component: "main-layout",
    children: [
      // Matches "/" and renders the home-page component
      {
        path: "/",
        component: "home-page",
      },
      // Matches "/other" and renders the other-page component
      {
        path: "/other",
        component: "other-page",
      },
      // This route has no component and can be used to define nested routes
      {
        // This route is a dynamic route that will match any segment that follows after "dynamic/"
        path: "/dynamic/:id",
        component: "dynamic-page",
      },
    ],
  },
];

export const router = new Router(routes);
