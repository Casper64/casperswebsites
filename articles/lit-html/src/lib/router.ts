import { LitElement } from "lit";

export type Route = {
  path: string;
  component?: keyof HTMLElementTagNameMap;
  children?: Route[];
};

type TransformedRoute = {
  path: string;
  component?: keyof HTMLElementTagNameMap;
  parents?: TransformedRoute[];
};

type ParsedRoute = {
  path: string;
  parameter?: string;
  component?: keyof HTMLElementTagNameMap;
  root?: WeakRef<HTMLElement>;
  child?: ParsedRoute;
};

const getFullPath = (...routes: TransformedRoute[]): string =>
  routes
    .map((route) =>
      route.path.startsWith("/") ? route.path.slice(1) : route.path
    )
    .filter((path) => !!path.length)
    .join("/");

function transformRoutes(routes: Route[]): {
  normal: Map<string, TransformedRoute>;
  dynamic: Map<string, TransformedRoute>;
} {
  const normal = new Map<string, TransformedRoute>();
  const dynamic = new Map<string, TransformedRoute>();

  const transform = (routes: Route[], parents?: TransformedRoute[]) => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      const fullPath = getFullPath(...(parents ?? []), route);
      const isDynamic = fullPath.includes(":");

      const parent: TransformedRoute = {
        path: getFullPath(route),
        component: route.component,
        parents,
      };
      if (isDynamic) dynamic.set(fullPath, parent);
      else normal.set(fullPath, parent);

      if (route.children) {
        transform(route.children, parents ? [parent, ...parents] : [parent]);
      }
    }
  };
  transform(routes);

  return {
    normal,
    dynamic,
  };
}

function parseRoutes(
  transformed: Map<string, TransformedRoute>
): Map<string, ParsedRoute> {
  const parsedRoutes = new Map<string, ParsedRoute>();
  for (const [path, route] of transformed.entries()) {
    if (route.parents) {
      let child: ParsedRoute = {
        path: route.path,
        component: route.component,
      };

      for (let i = 0; i < route.parents.length; i++) {
        const parent = route.parents[i];
        child = {
          path: parent.path,
          component: parent.component,
          child,
        };
      }

      parsedRoutes.set(path, child);
    } else {
      parsedRoutes.set(path, {
        path: route.path,
        component: route.component,
      });
    }
  }

  return parsedRoutes;
}

const between = (str: string, start: string, end: string) => {
  let result = str;
  if (result.startsWith(start)) result = result.slice(1);
  if (result.endsWith(end)) result = result.slice(0, -1);
  return result;
};

function matchRoute(
  path: string,
  normalRoutes: Map<string, ParsedRoute>,
  dynamicRoutes: Map<string, ParsedRoute>
): ParsedRoute | undefined {
  // remove the first '/' if it exists
  let normalisedPath = between(path, "/", "/");

  const normalRoute = normalRoutes.get(normalisedPath);
  // return a clone of the object so we don't accidentally mutate the original
  if (normalRoute) return structuredClone(normalRoute);

  const pathSegments = normalisedPath.split("/");

  routeLoop: for (const [key, route] of dynamicRoutes.entries()) {
    const routeSegments = key.split("/");
    // can never be a match
    if (routeSegments.length !== pathSegments.length) continue;

    const parameterEntries: [string, string][] = [];

    for (let i = 0; i < routeSegments.length; i++) {
      const segment = routeSegments[i];
      // check if the segment is dynamic
      if (segment.startsWith(":")) {
        parameterEntries.push([segment.slice(1), pathSegments[i]]);
      }
      // not a match if a non-dynamic segment does not match the segment in the path
      else if (segment !== pathSegments[i]) continue routeLoop;
    }

    let child = route as ParsedRoute | undefined;
    // attach paramters to child routes
    while (child) {
      if (child.path.includes(":")) {
        // parameters are stored in order
        child.parameter = parameterEntries.shift()![1];
      }

      child = child.child;
    }

    return structuredClone(route);
  }
}

const getDynamicSegment = (path: string): string | undefined =>
  path
    .split("/")
    .find((segment) => segment.startsWith(":"))
    ?.slice(1);

export class Router {
  private _routes: Map<string, ParsedRoute>;
  private _dynamicRoutes: Map<string, ParsedRoute>;
  private _rootElement?: HTMLElement;
  private _currentRoute?: ParsedRoute;
  private _DOMChanges?: Promise<[ParsedRoute, (() => void) | undefined]>;

  public constructor(routes: Route[]) {
    const { normal, dynamic } = transformRoutes(routes);

    this._routes = parseRoutes(normal);
    this._dynamicRoutes = parseRoutes(dynamic);
  }

  /**
   * Set the routers mount point and perform an initial render.
   * @param rootElement the element to mount the router to
   */
  public mount(rootElement: HTMLElement) {
    this._rootElement = rootElement;
    this.render("/");
  }

  /**
   * Render a path and its children to the DOM.
   */
  public async render(path: string) {
    const renderPromise = new Promise<[ParsedRoute, (() => void) | undefined]>(
      (resolve, reject) => {
        if (!this._rootElement) reject(new Error("Call mount first"));

        const parsedRoute = matchRoute(path, this._routes, this._dynamicRoutes);
        if (!parsedRoute) {
          // no matching routes found!
          throw new Error(`No matching routes for path "${path}"`);
        }
        const result = this._traverseRoutes(
          this._rootElement!,
          parsedRoute,
          this._currentRoute
        );
        resolve([parsedRoute, result]);
      }
    );
    // keep track of the promise
    this._DOMChanges = renderPromise;
    const result = await renderPromise;
    // check if the promise we started is the same as the one that resolved
    // if not that means render was called again before the previous render was done
    // we can ignore the result in that case
    if (this._DOMChanges !== renderPromise) return;

    const [parsedRoute, applyChanges] = result;
    this._currentRoute = parsedRoute;

    applyChanges?.();
    return parsedRoute;
  }

  /**
   * Traverses the route and its children to find the deepest node that needs
   * to be changed / rerendered. Then it rerenders the node and all its children
   */
  private _traverseRoutes(
    rootElement: HTMLElement,
    route: ParsedRoute,
    oldRoute?: ParsedRoute
  ): (() => void) | undefined {
    const shouldBeChanged = oldRoute?.path !== route.path;
    const parametersChanged = route.parameter !== oldRoute?.parameter;
    // check if the node still exists in the DOM. If not it should be rerendered
    const oldRootNode = oldRoute?.root?.deref();
    const isDisconnectedFromDOM = oldRoute?.root && !oldRootNode?.isConnected;

    if (shouldBeChanged || parametersChanged || isDisconnectedFromDOM) {
      return () => {
        // remove the old root node and all its children
        oldRootNode?.remove();

        // create a document framgent so the DOM changes can be applied at once
        const rootFragment = document.createDocumentFragment();
        this._doRender(rootFragment, route);
        rootElement.appendChild(rootFragment);
      };
    } else {
      // old root is the same, so it should not be removed

      // set the root element to be the old root element
      const oldRootElement = oldRootNode;
      if (oldRootElement) {
        route.root = new WeakRef(oldRootElement);
      }

      // if the route has a child we should check if any of its children have changed
      if (route.child) {
        return this._traverseRoutes(
          oldRootElement ?? rootElement,
          route.child,
          oldRoute?.child
        );
      }
    }

    // no changes need to be made
  }

  /** Render a `route` and its children then append it to the `rootElement` */
  private _doRender(
    rootElement: HTMLElement | DocumentFragment,
    route: ParsedRoute,
    parameters: Record<string, string> = {}
  ) {
    if (route.component) {
      const newElement = this._createElement(route, parameters);
      // if the route has a child we need to rerender all children below it
      if (route.child) this._doRender(newElement, route.child, parameters);

      rootElement.appendChild(newElement);
    } else if (route.child) {
      this._doRender(rootElement, route.child, parameters);
    }
  }

  private _createElement(
    route: ParsedRoute,
    parameters: Record<string, string> = {}
  ): HTMLElement {
    if (!route.component) throw new Error("Component is missing");

    const element = document.createElement(route.component);

    if (isDynamicRouteElement(element, route)) {
      // remove the ":" from the parameter name
      const paramName = getDynamicSegment(route.path)!;
      parameters[paramName] = route.parameter!;
      // set the parameters on the element
      element.setParameters(parameters as unknown as any);
    }

    // use a weak ref so the element can be garbage collected when it's removed from the DOM
    // because it is no longer referenced anywhere.
    route.root = new WeakRef(element);
    return element;
  }
}

// union containing all html elements including user defined elements
type AnyHTMLElement = HTMLElementTagNameMap[keyof HTMLElementTagNameMap];

function isDynamicRouteElement(
  element: AnyHTMLElement | DynamicRouteInterface<any>,
  route: ParsedRoute
): element is DynamicRouteInterface<any> {
  return route.parameter !== undefined && "setParameters" in element;
}

type RouteParameters<T extends string> =
  // recursive case
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParameters<Rest>]: string }
    : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {}; // base case when there are no parameters left

export declare class DynamicRouteInterface<T> {
  parameters?: T;
  setParameters(parameters: T): void;
}

// see https://lit.dev/docs/composition/mixins/#mixins-in-typescript
type Constructor<T = {}> = new (...args: any[]) => T;
export const DynamicRoute = <
  T extends Constructor<LitElement>,
  P extends string
>(
  superClass: T,
  fullPath: P
) => {
  type Params = RouteParameters<P>;

  class DynamicRouteMixin
    extends superClass
    implements DynamicRouteInterface<Params>
  {
    parameters?: Params;

    public setParameters(parameters: Params) {
      this.parameters = parameters;
    }
  }

  return DynamicRouteMixin as Constructor<DynamicRouteInterface<Params>> & T;
};
