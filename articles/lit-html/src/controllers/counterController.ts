import { ReactiveController, ReactiveControllerHost } from "lit";

export class CounterController implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _counter: number = 0;

  public get value() {
    return this._counter;
  }

  public constructor(host: ReactiveControllerHost) {
    host.addController(this);
    this._host = host;
  }

  public increment() {
    this._counter++;
    // trigger an update in the host component
    this._host.requestUpdate();
  }

  // need to implement this method to comply with the `ReactiveController` interface
  // even though we don't need it in this case.
  hostConnected(): void {}
}
