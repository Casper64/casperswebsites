export type Route = {
  path: string;
  component: keyof HTMLElementTagNameMap;
  children?: Route[];
};

// export function createRouter<const T extends Route[]>(routes: T) {
//   class View extends LitElement {
//     connectedCallback(): void {
//       super.connectedCallback();
//       console.log(this, this.tagName);
//     }
//   }

//   return { View };
// }

type TransformedRoute = {
  path: string;
  component: keyof HTMLElementTagNameMap;
  children: Record<string, TransformedRoute>;
};

class Router {
  private _routes: Record<string, TransformedRoute>;
  private _rawPath: string[] = [];

  constructor(routes: Route[]) {
    // recursively convert the array into an object
    const transform = (routes?: Route[]): Record<string, TransformedRoute> => {
      if (!routes) return {};

      const entries = routes.map((route) => [
        route.path,
        {
          ...route,
          children: transform(route.children),
        },
      ]);

      return Object.fromEntries(entries);
    };

    this._routes = transform(routes);
    console.log(this._routes);
  }

  public mount(root: HTMLElement) {
    const rootRoute = this._routes[""];
    if (!rootRoute) throw new Error("No route route is defined!");

    // const el = document.createElement(rootRoute.component);
    // root.appendChild(el);
    this._renderRoute(root, rootRoute, []);
  }

  private _renderRoute(
    root: HTMLElement,
    route: TransformedRoute,
    currentParts: string[]
  ) {
    const rootEl = document.createElement(route.component) as HTMLElement;
    root.appendChild(rootEl);

    const routePart = currentParts.shift();
    const matchingChild = route.children[routePart ?? ""];
    if (!matchingChild) return;

    const child = this._renderRoute(rootEl, matchingChild, currentParts);
    if (child) {
      rootEl.appendChild(child);
    }

    return rootEl;
  }
}

export function createRouter(root: HTMLElement, routes: Route[]) {
  const router = new Router(routes);
  router.mount(root);
}
