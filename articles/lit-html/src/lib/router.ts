export type Route = {
  path: string;
  component: keyof HTMLElementTagNameMap;
  children?: Route[];
};

type TransformedRoute = {
  path: string;
  component: keyof HTMLElementTagNameMap;
  children?: Map<string, TransformedRoute>;
};

type ParsedRoute = {
  path: string;
  parameter?: string;
  component: keyof HTMLElementTagNameMap;
  root?: WeakRef<HTMLElement>;
  child?: ParsedRoute;
};

function parseRoute(
  path: string,
  routes: Map<string, TransformedRoute>
): ParsedRoute | undefined {
  // get all segments between "/" in the `path` and remove any empty string
  const segments = path.split("/").filter((segment) => !!segment.length);

  /** Recursively match a route segment against a subset of routes */
  const matchSegment = (
    innerSegments: string[],
    childRoutes?: Map<string, TransformedRoute>
  ): ParsedRoute | undefined => {
    // base case when there are no child routes
    if (!childRoutes || !childRoutes.size) {
      // check if there are still any segments left. If that is the case
      // the DFS could not resolve all segments meaning a proper match is not found
      if (innerSegments.length) throw new Error("404");
      return;
    }

    const segment = innerSegments.at(0);
    if (segment) {
      for (const [key, route] of childRoutes.entries()) {
        const isNormalRoute = segment === key;
        const isDynamic = segment && key.startsWith(":");

        if (isNormalRoute || isDynamic) {
          return {
            path: route.path,
            component: route.component,
            parameter: isDynamic ? segment : undefined,
            // recursively get children and remove the first segment
            child: matchSegment(innerSegments.slice(1), route.children),
          };
        }
      }
    }

    // no matching routes found. Render the "default" path if it exists
    const defaultRoute = childRoutes.get("");
    if (defaultRoute === undefined) {
      // there is no matching route. But the route has children. That means
      // that the end of DFS is not reached, meaning the route does not exist.
      throw new Error("404");
    }

    return {
      path: defaultRoute.path,
      component: defaultRoute.component,
      // recursively get children
      child: matchSegment(innerSegments, defaultRoute.children),
    };
  };

  return matchSegment(segments, routes);
}

export class Router {
  private _routes: Map<string, TransformedRoute>;
  private _rootElement?: HTMLElement;
  private _currentRoute?: ParsedRoute;

  constructor(routes: Route[]) {
    // recursively convert the array into an object to make it faster to lookup
    // routes in `parseRoute`
    const transform = (routes: Route[]): Map<string, TransformedRoute> => {
      const routeMap = new Map<string, TransformedRoute>();
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        routeMap.set(route.path, {
          ...route,
          children: route.children ? transform(route.children) : undefined,
        });
      }

      return routeMap;
    };

    this._routes = transform(routes);
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
     * - set the root node to be the deepest node that has to be changed
     * - match sub routes and create children for the root node
     * - insert the new root node in the correct place in the DOM
     */

    // TODO: make sure this method isn't executed simultaneously
    console.time("matching");
    const parsedRoute = parseRoute(path, this._routes);
    if (!parsedRoute) {
      // no matching routes found!
      throw new Error(`No matching routes for path "${path}"`);
    }
    console.timeEnd("matching");

    console.time("render");
    this._traverseRoutes(this._rootElement, parsedRoute, this._currentRoute);
    console.timeEnd("render");

    this._currentRoute = parsedRoute;
  }

  /**
   * Traverses the route and its children to find the deepest node that needs
   * to be changed / rerendered. Then it rerenders the node and all its children
   */
  private _traverseRoutes(
    rootElement: HTMLElement,
    route: ParsedRoute,
    oldRoute?: ParsedRoute
  ) {
    let removeOldNode = true;

    const shouldBeChanged = oldRoute?.path !== route.path;
    const parametersChanged = route.parameter !== oldRoute?.parameter;
    // check if the node still exists in the DOM. If not it should be rerendered
    const oldRootNode = oldRoute?.root?.deref();
    const isDisconnectedFromDOM = oldRoute?.root && !oldRootNode?.isConnected;

    if (shouldBeChanged || parametersChanged || isDisconnectedFromDOM) {
      // create a document framgent so the DOM changes can be applied at once
      const rootFragment = document.createDocumentFragment();
      this._doRender(rootFragment, route);
      rootElement.appendChild(rootFragment);
    } else {
      // old root is the same, so it should not be removed
      removeOldNode = false;

      // set the root element to be the old root element
      const oldRootElement = oldRootNode!!;
      route.root = new WeakRef(oldRootElement);

      // if the route has a child we should check if any of its children have changed
      if (route.child) {
        this._traverseRoutes(oldRootElement, route.child, oldRoute?.child);
      }
    }

    if (removeOldNode) {
      // remove the old node from the DOM
      oldRootNode?.remove();
    }
  }

  /** Render a `route` and its children then append it to the `rootElement` */
  private _doRender(
    rootElement: HTMLElement | DocumentFragment,
    route: ParsedRoute
  ) {
    const newElement = this._createElement(route);
    // if the route has a child we need to rerender all children below it
    if (route.child) this._doRender(newElement, route.child);

    rootElement.appendChild(newElement);
  }

  private _createElement(route: ParsedRoute): HTMLElement {
    const element = document.createElement(route.component);
    // TODO: set parameters on created class
    // element.parameters = { other: route.parameter };

    // use a weak ref so the element can be garbage collected when it's removed from the DOM
    // because it is no longer referenced anywhere.
    route.root = new WeakRef(element);
    return element;
  }
}
