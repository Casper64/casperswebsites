import { createRouter, Route } from "./lib/router";
import "./pages/home";
import "./pages/other";

const routes: Route[] = [
  {
    path: "",
    component: "main-layout",
    children: [
      {
        path: "",
        component: "home-page",
      },
      {
        path: "other",
        component: "other-page",
      },
    ],
  },
];

createRouter(document.getElementById("app")!, routes);
