import {
  LovelaceCardConfig,
  LovelaceCard,
  loadCardHelpers,
  HomeAssistant,
  registerCustomCard,
} from "./ha-interfaces";
import { fetchHassioAddonInfo, ingressSession } from "./hassio-ingress";

const BASE_IFRAME_CARD = "hui-iframe-card";
const BASE_IFRAME_TYPE = "iframe";
const ADDON_IFRAME_CARD = "addon-iframe-card";
const ADDON_IFRAME_TYPE = `custom:${ADDON_IFRAME_CARD}`;

interface IframeCardConfig extends LovelaceCardConfig {
  url: string;
}

interface HuiIframeCard extends LovelaceCard {
  connectedCallback(): void;
  disconnectedCallback(): void;
}

interface HuiIframeCardClass extends HuiIframeCard {
  new (): HuiIframeCard;
  prototype: HuiIframeCard;
  getStubConfig(): IframeCardConfig;
}

(async () => {
  let card = customElements.get(BASE_IFRAME_CARD);
  if (card === undefined) {
    (await loadCardHelpers()).createCardElement({ type: BASE_IFRAME_TYPE });
    await customElements.whenDefined(BASE_IFRAME_CARD);
    card = customElements.get(BASE_IFRAME_CARD);
  }
  const HuiIframeCard = card as HuiIframeCardClass;

  class AddonIframeCard extends HuiIframeCard {
    private readonly _data: {
      config?: IframeCardConfig;
      isIngress?: boolean;
      disconnected?: boolean;
    } = { disconnected: true };

    public static getStubConfig(): IframeCardConfig {
      const config = super.getStubConfig();
      config.type = ADDON_IFRAME_TYPE;
      return config;
    }

    public connectedCallback() {
      delete this._data.disconnected;
      if (this._data.isIngress) {
        ingressSession.init(this.hass!);
      }
      super.connectedCallback();
    }

    public disconnectedCallback() {
      super.disconnectedCallback();
      this._data.disconnected = true;
      if (this._data.isIngress) {
        ingressSession.fini();
      }
    }

    set hass(hass: HomeAssistant) {
      super.hass = hass;
      if (this._data.config && this._data.config.type !== BASE_IFRAME_TYPE) {
        this._setConfig(hass, this._data.config);
      }
    }

    get hass(): HomeAssistant | undefined {
      return super.hass;
    }

    public setConfig(config: IframeCardConfig) {
      if (!config.url) {
        throw new Error("URL required");
      }
      const hass = this.hass;
      if (!hass) {
        this._data.config = config;
      } else {
        this._setConfig(hass, config);
      }
    }

    private async _setConfig(hass: HomeAssistant, config: IframeCardConfig) {
      // update config
      config = (() => {
        const { type, ...extra } = config;
        if (!this._data.config || this._data.config.type !== BASE_IFRAME_TYPE) {
          this._data.config = <IframeCardConfig>{ type: BASE_IFRAME_TYPE };
        }
        return Object.assign(this._data.config, extra);
      })();
      // get addon slug and real url
      const isIngress = await this._fixConfig(hass, config);
      if (isIngress && !(await ingressSession.init(hass))) {
        throw new Error(`Unable to create an Ingress session`);
      }
      if (this._data.isIngress) {
        ingressSession.fini();
        delete this._data.isIngress;
      }
      if (isIngress) {
        this._data.isIngress = true;
        if (this._data.disconnected) {
          ingressSession.fini();
        }
      }
      // workaround for app issue: https://github.com/home-assistant/iOS/issues/2102
      await this._fixAppShow(hass, config.url);
      // update iframe card
      super.setConfig(config);
    }

    private async _fixConfig(hass: HomeAssistant, config: IframeCardConfig): Promise<boolean> {
      if (/^((\w+:)?\/\/[^/]+)?\/api\/hassio_ingress\/[^/]+/.test(config.url)) {
        // All ingresses share the same session, so treat the url as ingress if it match
        return true;
      }
      const match = config.url.match(/^([\w-]+)(?:$|\/)(.*)/);
      if (!match) return false;
      const [, slug, url] = match;
      const addon = await fetchHassioAddonInfo(hass, slug);
      if (!addon) {
        throw new Error(`Unable to fetch add-on info of '${slug}'`);
      }
      if (!addon.ingress_url) {
        throw new Error(`Add-on '${slug}' does not support Ingress`);
      }
      config.url = `${addon.ingress_url.replace(/\/+$/, "")}/${url}`;
      return true;
    }

    private async _fixAppShow(hass: HomeAssistant, path: string) {
      try {
        if (!(window as any).externalApp && !(window as any).webkit) return;
        if (!path.startsWith("/api/ingress/")) return;
        const response = await fetch(path);
        if (!response.ok || !response.redirected) return;
        const url = new URL(response.url);
        if (url.origin !== location.origin || !url.searchParams.has("replace")) return;
        const ppr = document.createElement("partial-panel-resolver") as any;
        ppr.hass = hass;
        ppr.route = { prefix: "", path: url.pathname };
        const root = this.shadowRoot || this;
        root.appendChild(ppr);
        await new Promise((r) => setTimeout(r, 1000));
        root.removeChild(ppr);
      } catch (e) {}
    }
  }

  customElements.define(ADDON_IFRAME_CARD, AddonIframeCard);
  registerCustomCard({
    type: ADDON_IFRAME_CARD,
    name: "Ingress webpage",
    description: "Webpage card with addon ingress support.",
    documentationURL: "https://github.com/lovelylain/ha-addon-iframe-card",
  });
})();
