import { Route, Router } from "./lib/router";

import "./layouts/main";
import "./pages/home";
import "./pages/other";
import "./pages/dynamic";

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
      {
        path: "dynamic",
        children: [
          {
            path: ":id",
            component: "dynamic-page",
          },
        ],
      },
    ],
    //
  },
];

export const router = new Router(routes);

// slots: {
//   navigation: {
//     default: '',
//     children: [{
//       path: ""
//     }]
//   }
// }
