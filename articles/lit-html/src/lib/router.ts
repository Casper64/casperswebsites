import { LitElement } from "lit";

type ComponentTagName = keyof HTMLElementTagNameMap;

export type Route = {
  path: string;
  component?: ComponentTagName;
  children?: Route[];
};

type TransformedRoute = {
  path: string;
  component?: ComponentTagName;
};

type ParsedRoute = {
  path: string;
  parameter?: string;
  component?: ComponentTagName;
  root?: WeakRef<HTMLElement>;
};

/**
 * Trim the start and ending of `str` using the values for `start`
 * and `end` respectively
 */
const trim = (str: string, start: string, end: string) => {
  let result = str;
  if (result.startsWith(start)) result = result.slice(1);
  if (result.endsWith(end)) result = result.slice(0, -1);
  return result;
};

/**
 * Joins all the paths together to create a full path and removes any
 * double slashes from the path
 */
const getFullPath = (...routes: TransformedRoute[]): string =>
  routes
    // remove any leading and trailing slashes
    .map((route) => trim(route.path, "/", "/"))
    // filter out any empty strings
    .filter((path) => !!path.length)
    .join("/");

/**
 * Convert a nested array of routes into a flat map of all possible routes.
 * Separating normal routes from dynamic routes
 */
function transformRoutes(routes: Route[]): {
  normal: Map<string, TransformedRoute[]>;
  dynamic: Map<string, TransformedRoute[]>;
} {
  const normal = new Map<string, TransformedRoute[]>();
  const dynamic = new Map<string, TransformedRoute[]>();

  const transform = (routes: Route[], parents?: TransformedRoute[]) => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      // 1. get the full path of the route including any parents
      const fullPath = getFullPath(...(parents ?? []), route);
      // 2. create a new parent object
      const newParent: TransformedRoute = {
        path: getFullPath(route),
        component: route.component,
      };
      // 3. create array of all parents from highest to lowest (in the tree)
      const allParents = parents ? [...parents, newParent] : [newParent];
      // 4. check if the route is dynamic and add it to the correct map
      const isDynamic = fullPath.includes(":");
      if (isDynamic) dynamic.set(fullPath, allParents);
      else normal.set(fullPath, allParents);
      // 5. do the same for all the children of the current route
      if (route.children) {
        transform(route.children, allParents);
      }
    }
  };
  transform(routes);

  return { normal, dynamic };
}

/**
 * Matches the given path to a route and returns the parsed route with parameters
 * @returns the components that match the given path and undefined
 * if no match is found the function returns undefined
 */
function matchRoute(
  path: string,
  normalRoutes: Map<string, TransformedRoute[]>,
  dynamicRoutes: Map<string, TransformedRoute[]>
): ParsedRoute[] | undefined {
  // remove any leading and trailing slashes
  const normalisedPath = trim(path, "/", "/");

  const normalRoute = normalRoutes.get(normalisedPath);
  // return the normal route if it is found.
  // return a clone of the route so we don't accidently change the route in the map
  if (normalRoute) return structuredClone(normalRoute) as ParsedRoute[];

  // 1. split the current path into segments
  const pathSegments = normalisedPath.split("/");
  routeLoop: for (const [key, route] of dynamicRoutes.entries()) {
    const routeSegments = key.split("/");
    // 2. check if the number of segments are the same,
    // else the routes don't match
    if (routeSegments.length !== pathSegments.length) continue;
    // we will collect the parameters in this array
    const parameters: string[] = [];

    // 3. loop over all segments. Each segment must either be the same or dynamic
    for (let i = 0; i < routeSegments.length; i++) {
      const segment = routeSegments[i];
      // the value of the dynamic segment is equal to the path segment at the same index
      if (segment.startsWith(":")) parameters.push(pathSegments[i]);
      // check if the non-dynamic segments are the same,
      // else the routes don't match
      else if (segment !== pathSegments[i]) continue routeLoop;
    }

    // create a clone of the route so we don't accidently change the route in the map
    const routeWithParameters = structuredClone(route) as ParsedRoute[];

    // 4. add the parameters to each dynamic segment
    let paramIndex = 0;
    for (let i = 0; i < routeWithParameters.length; i++) {
      if (routeWithParameters[i].path.includes(":")) {
        // the parameters are stored in the same order as the segments
        routeWithParameters[i].parameter = parameters[paramIndex];
        paramIndex++;
      }
    }
    return routeWithParameters;
  }
}

const getDynamicParamName = (path: string): string | undefined =>
  path
    .split("/")
    .find((segment) => segment.startsWith(":"))
    ?.slice(1);

export class Router {
  private _rootElement?: HTMLElement;
  private _routes: Map<string, TransformedRoute[]>;
  private _dynamicRoutes: Map<string, TransformedRoute[]>;
  private _currentRoutes: ParsedRoute[] = [];
  private _renderPromise?: Promise<{
    applyChanges: (() => void) | undefined;
    parsedRoute: ParsedRoute[];
  }>;
  // allow the use of requestAnimationFrame to be disabled for testing purposes
  public useRequestAnimationFrame = true;

  public constructor(routes: Route[]) {
    const { normal, dynamic } = transformRoutes(routes);
    this._routes = normal;
    this._dynamicRoutes = dynamic;
  }

  /**
   * Set the routers mount point, performs an initial render and add necessary
   * event listeners. Remove the event listeners by calling {@link unmount}
   * @param rootElement the element to mount the router to
   */
  public async mount(rootElement: HTMLElement, bindListeners = true) {
    this._rootElement = rootElement;

    if (bindListeners) {
      document.addEventListener(
        "click",
        this._boundHandleClick,
        // listen to the event in the capture phase (before any other event
        // listener is executed)
        true
      );
      window.addEventListener("popstate", this._boundHandlePopState);
    }

    await this.render(bindListeners ? window.location.pathname : "/");
  }

  /** Click event handler that renders a new route if an anchor element was clicked */
  private _handleClick(event: MouseEvent) {
    // 1. get the clicked element using the code below instead of `event.target`,
    // because `event.target` doesn't propogate through the shadow DOM.
    const shadowRoot = event.composedPath().at(0);
    if (!shadowRoot) return;
    // 2. get the first clicked anchor element
    const element = (shadowRoot as HTMLElement).closest("a");
    // 2.1 check if the element is indeed an anchor element
    if (!element || !(element instanceof HTMLAnchorElement)) return;
    // 3. extract the href from the anchor element and create a URL object
    const link = element.href;
    const url = new URL(link);

    // 4. dont capture events that lead to an outside link
    if (!link || url.hostname !== window.location.hostname) return;
    // 5. prevent the navigation from happening
    event.preventDefault();
    // 6. render the new route
    this.render(url.pathname);
  }
  // store the bound function so we can remove it later
  private _boundHandleClick = this._handleClick.bind(this);

  /** Event handler for the windows 'popstate' event. */
  private _handlePopState(event: PopStateEvent) {
    event.preventDefault();
    this.render(window.location.pathname, false);
  }
  private _boundHandlePopState = this._handlePopState.bind(this);

  /** Removes all event listeners set in {@link mount} */
  public unmount() {
    document.removeEventListener("click", this._boundHandleClick, true);
    window.removeEventListener("popstate", this._boundHandlePopState);
  }

  /**
   * Render a path and its children to the DOM.
   */
  public async render(
    path: string,
    updateHistory = true
  ): Promise<ParsedRoute[] | undefined> {
    const renderPromise = new Promise<{
      applyChanges: (() => void) | undefined;
      parsedRoute: ParsedRoute[];
    }>((resolve, reject) => {
      // ensure that the user has called `mount` first.
      if (!this._rootElement) return reject(new Error("Call mount first"));

      const parsedRoute = matchRoute(path, this._routes, this._dynamicRoutes);
      if (!parsedRoute)
        return reject(new Error(`No route found for path: ${path}`));

      const applyChanges = this._traverseRoutes(
        this._rootElement!,
        parsedRoute,
        this._currentRoutes
      );

      resolve({ applyChanges, parsedRoute });
    });
    // store the render promise
    this._renderPromise = renderPromise;
    // await the promise
    const { applyChanges, parsedRoute } = await renderPromise;
    // check if the promise we started is the same as the one that resolved
    // if not that means render was called again before this one could be applied
    if (this._renderPromise !== renderPromise) return;

    this._currentRoutes = parsedRoute;

    if (!this.useRequestAnimationFrame) applyChanges?.();
    else if (applyChanges) window.requestAnimationFrame(applyChanges);

    if (updateHistory) {
      // update the browsers address bar
      window.history.pushState(null, "", path);
    }

    return parsedRoute;
  }

  /**
   * Traverses the route and its children to find the deepest node that needs
   * to be changed / rerendered. Then it rerenders the node and all its children
   */
  private _traverseRoutes(
    rootElement: HTMLElement,
    routes: ParsedRoute[],
    oldRoutes: ParsedRoute[] = []
  ): (() => void) | undefined {
    let root = rootElement;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      // get the counter part of the current route if it exists.
      const oldRoute = oldRoutes.at(i);
      // 1. check if the route has changed
      const pathChanged = oldRoute?.path !== route.path;
      // 2. check if any route paramer has changed
      const parametersChanged = route.parameter !== oldRoute?.parameter;

      const oldRootNode = oldRoute?.root?.deref();
      // 3. check if the node still exists in the DOM. If not it should be rerendered
      const isDisconnectedFromDOM = oldRoute?.root && !oldRootNode?.isConnected;

      if (pathChanged || parametersChanged || isDisconnectedFromDOM) {
        return () => {
          // remove the old root node and all its children
          oldRootNode?.remove();

          // create a document framgent so the DOM changes can be applied at once
          const rootFragment = document.createDocumentFragment();
          // collect the DOM changes in the document fragment before updating the DOM
          this._doRender(rootFragment, routes.slice(i));
          root.appendChild(rootFragment);
        };
      } else {
        // no changes need to be made to the DOM for this route
        const oldRootElement = oldRootNode;
        if (oldRootElement) {
          // use a weak ref so the element can be garbage collected when it's removed from the DOM
          // because it is no longer referenced anywhere.
          route.root = new WeakRef(oldRootElement);
          // set the root element to be the old root element
          root = oldRootElement;
        }
      }
    }
  }

  /**
   * Create elements for each route in `routes` and append to result
   * to the `rootElement`
   */
  private _doRender(
    rootElement: HTMLElement | DocumentFragment,
    routes: ParsedRoute[]
  ) {
    const parameters: Record<string, string> = {};
    let root = rootElement;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (!route.component) continue;
      // create a new instance of the element by its tag name
      const newElement = this._createElement(route, parameters);
      root.appendChild(newElement);
      // set the new root element to be the new element
      root = newElement;
    }
  }

  private _createElement(
    route: ParsedRoute,
    parameters: Record<string, string> = {}
  ): HTMLElement {
    // 0. ensure that a component is defined for this route
    if (!route.component) throw new Error("Component is missing");
    // 1. create the new element
    const element = document.createElement(route.component);
    // 2. TODO: create function that checks if the element is a `DynamicRoute`
    if (isDynamicRouteElement(element, route)) {
      // 3. TODO: create function that extracts the parameter name from the path
      const paramName = getDynamicParamName(route.path)!;
      // 4. mutate the `parameters` object by adding the parameter
      parameters[paramName] = route.parameter!;
      // 5. set the parameters on the element
      element.setParameters(parameters as InferRouteParameters<typeof element>);
    }
    // 6. set the root element of the ParsedRoute to be the new element
    // use a weak ref so the element can be garbage collected when it's removed from the DOM
    // because it is no longer referenced anywhere.
    route.root = new WeakRef(element);
    return element;
  }
}

// union containing all html elements including user defined elements
type AnyHTMLElement = HTMLElementTagNameMap[keyof HTMLElementTagNameMap];

/**
 * Returns true if `element` is a `DynamicRoute` element and casts the
 * `element` accordingly
 */
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

// declare a class for a dynamic route class
export declare class DynamicRouteInterface<T> {
  parameters?: T;
  setParameters(parameters: T): void;
}

// helper type that extracts the parameters type from a DynamicRoute class
type InferRouteParameters<T> = T extends DynamicRouteInterface<infer P>
  ? P
  : never;

// see https://lit.dev/docs/composition/mixins/#mixins-in-typescript
type Constructor<T = {}> = new (...args: any[]) => T;

export const DynamicRoute = <
  T extends Constructor<LitElement>,
  P extends string
>(
  superClass: T,
  fullPath: P
) => {
  // get the params object type from the path string
  type Params = RouteParameters<P>;
  // create a class which extends the super class and also
  // implements our interface using the params type.
  class DynamicRouteMixin
    extends superClass
    implements DynamicRouteInterface<Params>
  {
    parameters?: Params;

    public setParameters(parameters: Params) {
      this.parameters = parameters;
    }
  }
  // cast the class to the correct type
  return DynamicRouteMixin as Constructor<DynamicRouteInterface<Params>> & T;
};
