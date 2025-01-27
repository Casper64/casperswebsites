export type Route = {
  path: string;
  component: keyof HTMLElementTagNameMap;
  children?: Route[];
};

type TransformedRoute = {
  path: string;
  component: keyof HTMLElementTagNameMap;
  children: Record<string, TransformedRoute>;
};

type ParsedRoute = {
  path: string;
  parameter?: string;
  component: keyof HTMLElementTagNameMap;
  root?: HTMLElement;
  children: Record<string, ParsedRoute>;
};

function parseRoute(
  path: string,
  routes: Record<string, TransformedRoute>
): Record<string, ParsedRoute> {
  // get all segments between "/" in the `path` and remove any empty string
  const segments = path.split("/").filter((segment) => !!segment.length);

  /** Recursively match a route segment against a subset of routes */
  const matchSegment = (
    innerSegments: string[],
    childRoutes: Record<string, TransformedRoute>,
    parentPath = ""
  ) => {
    // base case when there are no child routes
    if (!Object.keys(childRoutes).length) {
      // check if there are still any segments left. If that is the case
      // the DFS could not resolve all segments meaning a proper match is not found
      if (innerSegments.length) throw new Error("404");

      return {};
    }

    const segment = innerSegments.shift();
    const matchingRoutes = {} as Record<string, ParsedRoute>;

    if (segment) {
      const routeKeys = Object.keys(childRoutes);

      for (let i = 0; i < routeKeys.length; i++) {
        const key = routeKeys[i];

        const isNormalRoute = segment === key;
        const isDynamic = segment && key.startsWith(":");

        if (isNormalRoute || isDynamic) {
          const route = childRoutes[key];
          const newPath = `${parentPath}/${route.path}`;
          // recursively get children
          const children = matchSegment(
            [...innerSegments],
            route.children,
            newPath
          );

          matchingRoutes[key] = {
            path: newPath,
            component: route.component,
            parameter: isDynamic ? segment : undefined,
            children,
          };
        }
      }
    }
    // if there is no segment left OR no route was found. Check if a default route
    // exists and then render that route
    if (!segment || !Object.keys(matchingRoutes).length) {
      // no matching routes found. Render the "default" path if it exists
      const defaultRoute = childRoutes[""];
      if (defaultRoute === undefined) {
        // there is matching route. But the route has children. That means
        // that the end of DFS is not reached, meaning the route does not exist.
        throw new Error("404");
      }
      //
      const nextSegments = segment
        ? [segment, ...innerSegments]
        : innerSegments;

      // recursively get children
      const children = matchSegment(
        nextSegments,
        defaultRoute.children,
        parentPath
      );
      matchingRoutes[""] = {
        path: parentPath,
        component: defaultRoute.component,
        children,
      };
    }

    return matchingRoutes;
  };

  return matchSegment(segments, routes);
}

export class Router {
  private _routes: Record<string, TransformedRoute>;
  private _rootElement?: HTMLElement;
  private _currentRoutes: Record<string, ParsedRoute> = {};
  private _DOMNodes = new WeakSet<HTMLElement>();

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

  public mount(rootElement: HTMLElement) {
    this._rootElement = rootElement;
    this.render("/");
  }

  public render(path: string) {
    if (!this._rootElement) throw new Error("Call mount first");
    console.log("RENDER", path);
    /**
     * render steps:
     * - validate the new route (does it exist?)
     * - set the root node(s) to be the deepest node that has to be changed
     * - match sub routes and create children for the root node
     * - insert the new root node in the correct place in the DOM
     */

    // TODO: make sure this method isn't executed simultaneously
    console.time("render");
    const parsedRoutes = parseRoute(path, this._routes);
    if (!Object.keys(parsedRoutes).length) {
      // no matching routes found!
      throw new Error(`No matching routes for path "${path}"`);
    }

    this._traverseRoutes(this._rootElement, parsedRoutes, this._currentRoutes);
    this._currentRoutes = parsedRoutes;
    console.timeEnd("render");
  }

  /** Traverse the a `routes` node and render the result to the DOM */
  private _traverseRoutes(
    rootElement: HTMLElement,
    routes: Record<string, ParsedRoute>,
    currentRoutes: Record<string, ParsedRoute>
  ) {
    const entries = Object.entries(routes);
    for (let i = 0; i < entries.length; i++) {
      const [key, route] = entries[i];

      const oldRoute = currentRoutes[key];
      const shouldBeChanged =
        oldRoute === undefined || oldRoute.parameter !== route.parameter;

      if (shouldBeChanged) {
        const newElement = this._createElement(route);
        route.root = newElement;
        // recursively attach children
        this._traverseRoutes(
          newElement,
          route.children,
          oldRoute?.children ?? {}
        );

        if (oldRoute?.root && this._DOMNodes.has(oldRoute.root)) {
          // remove the old node from the DOM
          oldRoute.root.remove();
        }

        rootElement.appendChild(newElement);
      } else {
        // route should stay the same. Make sure that the route is still present in the DOM.
        // else rerender it.
        route.root = oldRoute.root!;
        // recursively attach children
        this._traverseRoutes(
          oldRoute.root!,
          route.children,
          oldRoute?.children ?? {}
        );
      }
      // remove old route from the object
      if (oldRoute) delete currentRoutes[key];
    }

    // all entries that are left in the currentRoutes object don't exist in the
    // new matched route: they can all be removed from the DOM
    const leftOverEntries = Object.entries(currentRoutes);
    for (let i = 0; i < leftOverEntries.length; i++) {
      const [_key, route] = leftOverEntries[i];
      route?.root?.remove();
    }
  }

  private _createElement(route: ParsedRoute): HTMLElement {
    const element = document.createElement(route.component);
    // element.parameters = { other: route.parameter };
    this._DOMNodes.add(element);
    route.root = element;
    return element;
  }
}
