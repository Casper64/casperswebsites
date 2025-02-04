import { LitElement } from "lit";
import { router } from "../routes";

// see https://lit.dev/docs/composition/mixins/#mixins-in-typescript
type Constructor<T = {}> = new (...args: any[]) => T;

const Authenticated = (superClass: Constructor<LitElement>) =>
  class extends superClass {
    async connectedCallback(): Promise<void> {
      // fetch some user api
      const result = await fetch("/api/user");
      const user = await result.json();
      // if the user is not logged in, redirect to the login page
      if (!user) {
        router.render("/login");
      } else {
        // if the user is logged in, call the super method
        super.connectedCallback();
      }
    }
  };

export default Authenticated;
