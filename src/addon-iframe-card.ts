import {
  LovelaceCardConfig,
  LovelaceCard,
  LovelaceCardEditor,
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

interface HuiIframeCardClass extends CustomElementConstructor {
  getConfigElement(): Promise<LovelaceCardEditor>;
  getStubConfig(): IframeCardConfig;
}

let HuiIframeCard: HuiIframeCardClass;
(async () => {
  let card = customElements.get(BASE_IFRAME_CARD);
  if (card === undefined) {
    (await loadCardHelpers()).createCardElement({ type: BASE_IFRAME_TYPE });
    await customElements.whenDefined(BASE_IFRAME_CARD);
    card = customElements.get(BASE_IFRAME_CARD);
  }
  HuiIframeCard = card as HuiIframeCardClass;
})();

class AddonIframeCard extends HTMLElement implements LovelaceCard {
  private _data?: {
    hass?: HomeAssistant;
    layout?: string;
    isPanel?: boolean;
  } = {};
  private _iframe?: LovelaceCard;
  private _config?: IframeCardConfig;
  private _isIngress?: boolean;
  private _disconnected? = true;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return await HuiIframeCard.getConfigElement();
  }

  public static getStubConfig(): IframeCardConfig {
    const config = HuiIframeCard.getStubConfig();
    config.type = ADDON_IFRAME_TYPE;
    return config;
  }

  public connectedCallback() {
    delete this._disconnected;
    if (this._isIngress) {
      ingressSession.init(this.hass!);
    }
  }

  public disconnectedCallback() {
    this._disconnected = true;
    if (this._isIngress) {
      ingressSession.fini();
    }
  }

  set hass(hass: HomeAssistant) {
    if (this._iframe) {
      this._iframe.hass = hass;
    } else {
      this._data!.hass = hass;
      if (this._config && this._config.type !== BASE_IFRAME_TYPE) {
        this._setConfig(hass, this._config);
      }
    }
  }

  get hass(): HomeAssistant | undefined {
    return this._iframe ? this._iframe.hass : this._data!.hass;
  }

  set layout(layout: string) {
    if (this._iframe) {
      this._iframe.layout = layout;
    } else {
      this._data!.layout = layout;
    }
  }

  get layout(): string | undefined {
    return this._iframe ? this._iframe.layout : this._data!.layout;
  }

  set isPanel(isPanel: boolean) {
    if (this._iframe) {
      this._iframe.isPanel = isPanel;
    } else {
      this._data!.isPanel = isPanel;
    }
  }

  get isPanel(): boolean | undefined {
    return this._iframe ? this._iframe.isPanel : this._data!.isPanel;
  }

  public getCardSize(): number | Promise<number> {
    return this._iframe ? this._iframe.getCardSize() : 5;
  }

  public setConfig(config: IframeCardConfig) {
    if (!config.url) {
      throw new Error("URL required");
    }
    const hass = this.hass;
    if (!hass) {
      this._config = config;
    } else {
      this._setConfig(hass, config);
    }
  }

  private async _setConfig(hass: HomeAssistant, config: IframeCardConfig) {
    // update config
    config = (() => {
      const { type, ...extra } = config;
      if (!this._config || this._config.type !== BASE_IFRAME_TYPE) {
        this._config = <IframeCardConfig>{ type: BASE_IFRAME_TYPE };
      }
      return Object.assign(this._config, extra);
    })();
    // get addon slug and real url
    const isIngress = await this._fixConfig(hass, config);
    if (isIngress && !(await ingressSession.init(hass))) {
      throw new Error(`Unable to create an Ingress session`);
    }
    if (this._isIngress) {
      ingressSession.fini();
      delete this._isIngress;
    }
    if (isIngress) {
      this._isIngress = true;
      if (this._disconnected) {
        ingressSession.fini();
      }
    }
    // update iframe card
    await this._updateIframe(config);
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

  private async _updateIframe(config: IframeCardConfig) {
    let iframe = this._iframe;
    if (iframe) {
      iframe.setConfig(config);
    } else {
      this._iframe = (await loadCardHelpers()).createCardElement(config);
      iframe = Object.assign(this._iframe, this._data);
      delete this._data;
      this.appendChild(iframe);
    }
  }
}

customElements.define(ADDON_IFRAME_CARD, AddonIframeCard);
registerCustomCard({
  type: ADDON_IFRAME_CARD,
  name: "Ingress webpage",
  description: "Webpage card with addon ingress support.",
  documentationURL: "https://github.com/lovelylain/ha-addon-iframe-card",
});
