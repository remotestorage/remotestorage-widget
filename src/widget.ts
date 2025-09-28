import "./widget-component";
import type { RemoteStorageWidget } from "./widget-component";

interface WidgetOptions {
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

interface RemoteStorage {
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

/**
 * RemoteStorage connect widget
 * @constructor
 */
class Widget {
  private component: RemoteStorageWidget;
  private parentContainerEl: HTMLElement | null;

  constructor(remoteStorage: RemoteStorage, options: WidgetOptions = {}) {
    this.parentContainerEl = null;

    // Create and configure the vanilla web component
    this.component = document.createElement(
      "remotestorage-widget",
    ) as RemoteStorageWidget;
    this.component.setRemoteStorage(remoteStorage);
    this.component.setOptions(options);
  }

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
  attach(element?: string | HTMLElement): void {
    if (element instanceof HTMLElement) {
      this.parentContainerEl = element;
    } else if (typeof element === "string") {
      this.parentContainerEl = document.getElementById(element);
      if (!this.parentContainerEl) {
        throw new Error(
          `Failed to find target DOM element with id="${element}"`,
        );
      }
    } else if (element) {
      throw new Error(
        "Unknown element type. Expected instance of HTMLElement or type of string.",
      );
    } else {
      this.parentContainerEl = document.body;
    }

    this.parentContainerEl.appendChild(this.component);
  }

  /**
   * Toggle between the widget's open/close state.
   *
   * When then widget is open and in initial state, it will show the backend
   * chooser screen.
   */
  toggle(): void {
    this.component.toggle();
  }

  /**
   * Open the widget.
   */
  open(): void {
    this.component.open();
  }

  /**
   * Close the widget to only show the icon.
   *
   * If the ``leaveOpen`` config is true or there is no storage connected,
   * the widget will not close.
   */
  close(): void {
    this.component.close();
  }
}

export default Widget;
