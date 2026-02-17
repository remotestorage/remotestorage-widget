export interface WidgetOptions {
  /** Keep the widget open when user clicks outside of it */
  leaveOpen?: boolean;
  /** Timeout after which the widget closes automatically (in milliseconds). The widget only closes when a storage is connected. */
  autoCloseAfter?: number;
  /** Don't show the initial connect hint, but show sign-in screen directly instead */
  skipInitial?: boolean;
  /** Enable logging for debugging purposes */
  logging?: boolean;
  /** Show a dark, transparent backdrop when opening the widget for connecting an account. `true` shows backdrop everywhere, `false` turns it off everywhere. Default is to only show it on small screens. */
  modalBackdrop?: boolean | "onlySmallScreens";
}

export interface RemoteStorage {
  apiKeys: Record<string, unknown>;
  backend: string;
  remote: {
    userAddress: string;
  };
  on(event: string, handler: (...args: unknown[]) => void): void;
  connect(userAddress: string): void;
  disconnect(): void;
  reconnect(): void;
  startSync(): void;
  stopSync(): void;
  hasFeature(feature: string): boolean;
  dropbox?: {
    connect(): void;
  };
  googledrive?: {
    connect(): void;
  };
}

export class RemoteStorageWidget extends HTMLElement {
  setRemoteStorage(rs: RemoteStorage): void;
  setOptions(options: WidgetOptions): void;
  toggle(): void;
  open(): void;
  close(): void;
}

/**
 * RemoteStorage connect widget
 */
export default class Widget {
  constructor(remoteStorage: RemoteStorage, options?: WidgetOptions);

  /**
   * Append widget to the DOM.
   *
   * If a parentElement is specified, the widget will be appended to that
   * element, otherwise it will be appended to the document's body. The parent
   * element can be given either as a simple element ID or as a valid HTML
   * element.
   *
   * @throws {Error} If the element is not found or is of an unknown type.
   */
  attach(element?: string | HTMLElement): void;

  /**
   * Toggle between the widget's open/close state.
   *
   * When then widget is open and in initial state, it will show the backend
   * chooser screen.
   */
  toggle(): void;

  /**
   * Open the widget.
   */
  open(): void;

  /**
   * Close the widget to only show the icon.
   *
   * If the ``leaveOpen`` config is true or there is no storage connected,
   * the widget will not close.
   */
  close(): void;
}