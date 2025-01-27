import { Route, Router } from "./lib/router";

import "./layouts/main";
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
