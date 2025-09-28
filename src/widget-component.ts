import circleOpenSvg from "./assets/circle-open.svg";
import widgetCss from "./assets/styles.css";
import widgetHtml from "./assets/widget.html";

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

interface SyncMessage {
		completed?: boolean;
}

interface ErrorMessage {
		name: string;

	message: string;

	code?: string;
}

export class RemoteStorageWidget extends HTMLElement {
	private rs!: RemoteStorage;
	private leaveOpen = false;
	private autoCloseAfter = 1500;
	private skipInitial = false;
	private logging = false;
	private modalBackdrop: boolean | "onlySmallScreens" = "onlySmallScreens";

	private active = false;
	private online = false;
	private closed = false;
	private state = "";
	private syncInProgress = false;
	private shouldCloseWhenSyncDone = false;
	private lastSynced: Date | null = null;
	private lastSyncedUpdateLoop: unknown;

	constructor() {
		super();
		this.setupShadowDOM();
	}

	private setupShadowDOM() {
		// Create shadow root
		const shadow = this.attachShadow({ mode: 'open' });

		// Create template with styles and HTML
		const template = document.createElement('template');
		template.innerHTML = `
			<style>
				${widgetCss}
			</style>
			${widgetHtml}
		`;

		// Clone template content into shadow DOM
		shadow.appendChild(template.content.cloneNode(true));
	}

	// Public API methods
	setRemoteStorage(rs: RemoteStorage) {
		this.rs = rs;
		this.setupHandlers();
		this.setInitialState();
		this.setModalClass();
	}

	setOptions(options: {
		leaveOpen?: boolean;
		autoCloseAfter?: number;
		skipInitial?: boolean;
		logging?: boolean;
		modalBackdrop?: boolean | "onlySmallScreens";
	}) {
		this.leaveOpen = options.leaveOpen || false;
		this.autoCloseAfter = options.autoCloseAfter || 1500;
		this.skipInitial = options.skipInitial || false;
		this.logging = options.logging || false;

		if ("modalBackdrop" in options) {
			if (
				typeof options.modalBackdrop !== "boolean" &&
				options.modalBackdrop !== "onlySmallScreens"
			) {
				throw 'options.modalBackdrop has to be true/false or "onlySmallScreens"';
			}
			this.modalBackdrop = options.modalBackdrop!;
		} else {
			this.modalBackdrop = "onlySmallScreens";
		}
	}

	log(...msg: unknown[]): void {
		if (this.logging) {
			console.debug("[RS-WIDGET] ", ...msg);
		}
	}

	eventHandler(event: string, msg?: SyncMessage | ErrorMessage): void {
		this.log("EVENT: ", event);
		switch (event) {
			case "ready":
				this.setState(this.state);
				break;
			case "sync-started":
				this.handleSyncStarted();
				break;
			case "sync-req-done":
				this.handleSyncStarted();
				break;
			case "sync-done": {
				if (this.online && !msg?.completed) return;
				this.syncInProgress = false;
				const rsSyncButton = this.shadowRoot?.querySelector('.rs-sync') as HTMLElement;
				if (rsSyncButton) {
					rsSyncButton.classList.remove("rs-rotate");
				}
				this.updateLastSyncedStatus();
				if (!this.closed && this.shouldCloseWhenSyncDone) {
					setTimeout(this.close.bind(this), this.autoCloseAfter);
				}
				break;
			}
			case "disconnected":
				this.active = false;
				this.setOnline();
				this.setBackendClass(undefined);
				this.open();
				this.setInitialState();
				break;
			case "connected": {
				this.active = true;
				this.online = true;
				if (this.rs.hasFeature("Sync")) {
					this.shouldCloseWhenSyncDone = true;
					this.rs.on("sync-req-done", (msg) =>
						this.eventHandler("sync-req-done", msg),
					);
					this.rs.on("sync-done", (msg) => this.eventHandler("sync-done", msg));
				} else {
					const syncButton = this.shadowRoot?.querySelector('.rs-sync') as HTMLElement;
					if (syncButton) {
						syncButton.classList.add("rs-hidden");
					}
					setTimeout(this.close.bind(this), this.autoCloseAfter);
				}
				const connectedUser = this.rs.remote.userAddress;
				const rsConnectedUser = this.shadowRoot?.querySelector('.rs-connected-text h1.rs-user') as HTMLElement;
				if (rsConnectedUser) {
					rsConnectedUser.innerHTML = connectedUser;
				}
				this.setBackendClass(this.rs.backend);
				const rsConnectedLabel = this.shadowRoot?.querySelector('.rs-box-connected .rs-sub-headline') as HTMLElement;
				if (rsConnectedLabel) {
					rsConnectedLabel.textContent = "Connected";
				}
				this.setState("connected");
				break;
			}
			case "network-offline":
				this.setOffline();
				break;
			case "network-online":
				this.setOnline();
				break;
			case "error":
				this.setBackendClass(this.rs.backend);
				if (msg?.name === "DiscoveryError") {
					this.handleDiscoveryError(msg);
				} else if (msg?.name === "SyncError") {
					this.handleSyncError(msg);
				} else if (msg?.name === "Unauthorized") {
					this.handleUnauthorized(msg);
				} else {
					console.debug(`Encountered unhandled error: "${msg}"`);
				}
				break;
		}
	}

	setState(state: string): void {
		if (!state) return;
		this.log("Setting state ", state);

		const lastSelected = this.shadowRoot?.querySelector(
			".rs-box.rs-selected",
		);
		if (lastSelected) {
			lastSelected.classList.remove("rs-selected");
			lastSelected.setAttribute("aria-hidden", "true");
		}

		const toSelect = this.shadowRoot?.querySelector(
			`.rs-box.rs-box-${state}`,
		);
		if (toSelect) {
			toSelect.classList.add("rs-selected");
			toSelect.setAttribute("aria-hidden", "false");
		}

		const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
		if (rsWidget) {
			const currentStateClass =
				rsWidget.className.match(/rs-state-\S+/g)?.[0];
			if (currentStateClass) {
				rsWidget.classList.remove(currentStateClass);
			}
			rsWidget.classList.add(`rs-state-${state || this.state}`);
		}

		this.state = state;
	}

	setInitialState(): void {
		if (this.skipInitial) {
			this.showChooseOrSignIn();
		} else {
			this.setState("initial");
		}
	}

	setModalClass(): void {
		if (this.modalBackdrop) {
			if (this.modalBackdrop === "onlySmallScreens" && !this.isSmallScreen()) {
				return;
			}
			const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
			if (rsWidget) {
				rsWidget.classList.add("rs-modal");
			}
		}
	}

	setupHandlers(): void {
		this.rs.on("connected", () => this.eventHandler("connected"));
		this.rs.on("ready", () => this.eventHandler("ready"));
		this.rs.on("disconnected", () => this.eventHandler("disconnected"));
		this.rs.on("network-online", () => this.eventHandler("network-online"));
		this.rs.on("network-offline", () => this.eventHandler("network-offline"));
		this.rs.on("error", (error) => this.eventHandler("error", error));

		this.setEventListeners();
		this.setClickHandlers();
	}

	setEventListeners(): void {
		const rsSignInForm = this.shadowRoot?.querySelector('.rs-sign-in-form') as HTMLFormElement;
		if (rsSignInForm) {
			rsSignInForm.addEventListener("submit", (e) => {
				e.preventDefault();
				const rsAddressInput = this.shadowRoot?.querySelector('input[name=rs-user-address]') as HTMLInputElement;
				const userAddress = rsAddressInput.value;
				this.disableConnectButton();
				this.rs.connect(userAddress);
			});
		}
	}

	showChooseOrSignIn(): void {
		const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
		const rsBackdrop = this.shadowRoot?.querySelector('.remotestorage-widget-modal-backdrop') as HTMLElement;

		if (rsWidget?.classList.contains("rs-modal")) {
			if (rsBackdrop) {
				rsBackdrop.style.display = "block";
				rsBackdrop.classList.add("visible");
			}
		}
		if (this.rs.apiKeys && Object.keys(this.rs.apiKeys).length > 0) {
			this.setState("choose");
		} else {
			this.setState("sign-in");
		}
	}

	setClickHandlers(): void {
		const rsInitial = this.shadowRoot?.querySelector('.rs-box-initial') as HTMLElement;
		if (rsInitial) {
			rsInitial.addEventListener("click", () => this.showChooseOrSignIn());
		}

		const rsChooseRemoteStorageButton = this.shadowRoot?.querySelector('button.rs-choose-rs') as HTMLButtonElement;
		if (rsChooseRemoteStorageButton) {
			rsChooseRemoteStorageButton.addEventListener("click", () => {
				this.setState("sign-in");
				const rsAddressInput = this.shadowRoot?.querySelector('input[name=rs-user-address]') as HTMLInputElement;
				if (rsAddressInput) {
					rsAddressInput.focus();
				}
			});
		}

		const rsChooseDropboxButton = this.shadowRoot?.querySelector('button.rs-choose-dropbox') as HTMLButtonElement;
		if (rsChooseDropboxButton) {
			rsChooseDropboxButton.addEventListener("click", () =>
				this.rs.dropbox?.connect(),
			);
		}

		const rsChooseGoogleDriveButton = this.shadowRoot?.querySelector('button.rs-choose-googledrive') as HTMLButtonElement;
		if (rsChooseGoogleDriveButton) {
			rsChooseGoogleDriveButton.addEventListener("click", () =>
				this.rs.googledrive?.connect(),
			);
		}

		const rsDisconnectButtons = this.shadowRoot?.querySelectorAll('.rs-disconnect') as NodeListOf<HTMLButtonElement>;
		for (const button of rsDisconnectButtons) {
			button.addEventListener("click", () => this.rs.disconnect());
		}

		const rsErrorReconnectLink = this.shadowRoot?.querySelector('.rs-box-error a.rs-reconnect') as HTMLAnchorElement;
		if (rsErrorReconnectLink) {
			rsErrorReconnectLink.addEventListener("click", () =>
				this.rs.reconnect(),
			);
		}

		if (this.rs.hasFeature("Sync")) {
			const rsSyncButton = this.shadowRoot?.querySelector('.rs-sync') as HTMLButtonElement;
			if (rsSyncButton) {
				rsSyncButton.addEventListener("click", () => {
					if (rsSyncButton.classList.contains("rs-rotate")) {
						this.rs.stopSync();
						rsSyncButton.classList.remove("rs-rotate");
					} else {
						const rsConnectedLabel = this.shadowRoot?.querySelector('.rs-box-connected .rs-sub-headline') as HTMLElement;
						if (rsConnectedLabel) {
							rsConnectedLabel.textContent = "Synchronizing";
						}
						this.rs.startSync();
						rsSyncButton.classList.add("rs-rotate");
					}
				});
			}
		}

		document.addEventListener("click", () => this.close());
		const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
		if (rsWidget) {
			rsWidget.addEventListener("click", (e) => e.stopPropagation());
		}

		const rsLogo = this.shadowRoot?.querySelector('.rs-widget-icon') as HTMLElement;
		if (rsLogo) {
			rsLogo.addEventListener("click", () => this.toggle());
		}
	}

	toggle(): void {
		if (this.closed) {
			this.open();
		} else {
			if (this.state === "initial") {
				this.showChooseOrSignIn();
			} else {
				this.close();
			}
		}
	}

	open(): void {
		this.closed = false;
		const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
		if (rsWidget) {
			rsWidget.classList.remove("rs-closed");
		}
		this.shouldCloseWhenSyncDone = false;

		const selected = this.shadowRoot?.querySelector(
			".rs-box.rs-selected",
		);
		if (selected) {
			selected.setAttribute("aria-hidden", "false");
		}
	}

	close(): void {
		if (this.state === "error") {
			return;
		}

		const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
		if (!this.leaveOpen && this.active) {
			this.closed = true;
			if (rsWidget) {
				rsWidget.classList.add("rs-closed");
			}
			const selected = this.shadowRoot?.querySelector(
				".rs-box.rs-selected",
			);
			if (selected) {
				selected.setAttribute("aria-hidden", "true");
			}
		} else if (this.active) {
			this.setState("connected");
		} else {
			this.setInitialState();
		}

		if (rsWidget?.classList.contains("rs-modal")) {
			const rsBackdrop = this.shadowRoot?.querySelector('.remotestorage-widget-modal-backdrop') as HTMLElement;
			if (rsBackdrop) {
				rsBackdrop.classList.remove("visible");
				setTimeout(() => {
					rsBackdrop.style.display = "none";
				}, 300);
			}
		}
	}

	disableConnectButton() {
		const rsConnectButton = this.shadowRoot?.querySelector('.rs-connect') as HTMLButtonElement;
		if (rsConnectButton) {
			rsConnectButton.disabled = true;
			rsConnectButton.classList.add("rs-connecting");
			const circleSpinner = circleOpenSvg;
			rsConnectButton.innerHTML = `Connecting ${circleSpinner}`;
		}
	}

	enableConnectButton() {
		const rsConnectButton = this.shadowRoot?.querySelector('.rs-connect') as HTMLButtonElement;
		if (rsConnectButton) {
			rsConnectButton.disabled = false;
			rsConnectButton.textContent = "Connect";
			rsConnectButton.classList.remove("rs-connecting");
		}
	}

	setOffline() {
		if (this.online) {
			const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
			if (rsWidget) {
				rsWidget.classList.add("rs-offline");
			}
			const rsConnectedLabel = this.shadowRoot?.querySelector('.rs-box-connected .rs-sub-headline') as HTMLElement;
			if (rsConnectedLabel) {
				rsConnectedLabel.textContent = "Offline";
			}
			this.online = false;
		}
	}

	setOnline() {
		if (!this.online) {
			const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
			if (rsWidget) {
				rsWidget.classList.remove("rs-offline");
			}
			if (this.active) {
				const rsConnectedLabel = this.shadowRoot?.querySelector('.rs-box-connected .rs-sub-headline') as HTMLElement;
				if (rsConnectedLabel) {
					rsConnectedLabel.textContent = "Connected";
				}
			}
		}
		this.online = true;
	}

	setBackendClass(backend?: string) {
		const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
		if (rsWidget) {
			rsWidget.classList.remove("rs-backend-remotestorage");
			rsWidget.classList.remove("rs-backend-dropbox");
			rsWidget.classList.remove("rs-backend-googledrive");

			if (backend) {
				rsWidget.classList.add(`rs-backend-${backend}`);
			}
		}
	}

	showErrorBox(errorMsg: string) {
		const rsErrorBox = this.shadowRoot?.querySelector('.rs-box-error .rs-error-message') as HTMLElement;
		if (rsErrorBox) {
			rsErrorBox.innerHTML = errorMsg;
		}
		this.setState("error");
	}

	hideErrorBox() {
		const rsErrorBox = this.shadowRoot?.querySelector('.rs-box-error .rs-error-message') as HTMLElement;
		if (rsErrorBox) {
			rsErrorBox.innerHTML = "";
		}
		this.close();
	}

	handleSyncStarted() {
		this.syncInProgress = true;
		const rsSyncButton = this.shadowRoot?.querySelector('.rs-sync') as HTMLElement;
		if (rsSyncButton) {
			rsSyncButton.classList.add("rs-rotate");
		}
		setTimeout(() => {
			if (!this.syncInProgress) return;
			const rsConnectedLabel = this.shadowRoot?.querySelector('.rs-box-connected .rs-sub-headline') as HTMLElement;
			if (rsConnectedLabel) {
				rsConnectedLabel.textContent = "Synchronizing";
			}
		}, 1000);
	}

	handleDiscoveryError(error: ErrorMessage) {
		const msgContainer = this.shadowRoot?.querySelector(".rs-sign-in-error") as HTMLElement;
		if (msgContainer) {
			msgContainer.innerHTML = error.message;
			msgContainer.classList.remove("rs-hidden");
			msgContainer.classList.add("rs-visible");
		}
		this.enableConnectButton();
	}

	handleSyncError(error: ErrorMessage) {
		this.setOffline();
	}

	handleUnauthorized(error: ErrorMessage) {
		if (error.code && error.code === "access_denied") {
			this.rs.disconnect();
		} else {
			this.open();
			this.showErrorBox(`${error.message} `);
			const rsErrorBox = this.shadowRoot?.querySelector('.rs-box-error .rs-error-message') as HTMLElement;
			const rsErrorReconnectLink = this.shadowRoot?.querySelector('.rs-box-error a.rs-reconnect') as HTMLAnchorElement;
			if (rsErrorBox && rsErrorReconnectLink) {
				rsErrorBox.appendChild(rsErrorReconnectLink);
				rsErrorReconnectLink.classList.remove("rs-hidden");
			}
		}
	}

	updateLastSyncedStatus() {
		const now = new Date();
		if (this.online) {
			this.lastSynced = now;
			const rsConnectedLabel = this.shadowRoot?.querySelector('.rs-box-connected .rs-sub-headline') as HTMLElement;
			if (rsConnectedLabel) {
				rsConnectedLabel.textContent = "Synced";
			}
		} else {
			const rsWidget = this.shadowRoot?.querySelector('.rs-widget') as HTMLElement;
			if (!rsWidget?.classList.contains("rs-state-unauthorized")) {
				const rsConnectedLabel = this.shadowRoot?.querySelector('.rs-box-connected .rs-sub-headline') as HTMLElement;
				if (rsConnectedLabel) {
					rsConnectedLabel.textContent = "Offline";
				}
			}
		}
	}

	isSmallScreen() {
		return window.innerWidth < 421;
	}
}

// Register the custom element
customElements.define('remotestorage-widget', RemoteStorageWidget);
