import {
  LovelaceCardConfig,
  LovelaceCard,
  LovelaceCardEditor,
  loadCardHelpers,
  HomeAssistant,
  registerCustomCard,
} from "./ha-interfaces";
import { createHassioSession, fetchHassioAddonInfo, validateHassioSession } from "./hassio-ingress";

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
  private _hass?: HomeAssistant;
  private _layout?: string;
  private _iframe?: LovelaceCard;
  private _config?: IframeCardConfig;
  private _sessionKeepAlive?: number;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return await HuiIframeCard.getConfigElement();
  }

  public static getStubConfig(): IframeCardConfig {
    const config = HuiIframeCard.getStubConfig();
    config.type = ADDON_IFRAME_TYPE;
    return config;
  }

  public disconnectedCallback() {
    if (this._sessionKeepAlive) {
      clearInterval(this._sessionKeepAlive);
    }
  }

  set hass(hass: HomeAssistant) {
    if (this._iframe) {
      this._iframe.hass = hass;
    } else {
      this._hass = hass;
      if (this._config && this._config.type !== BASE_IFRAME_TYPE) {
        this._setConfig(hass, this._config);
      }
    }
  }

  get hass(): HomeAssistant | undefined {
    return this._iframe ? this._iframe.hass : this._hass;
  }

  set layout(layout: string) {
    if (this._iframe) {
      this._iframe.layout = layout;
    } else {
      this._layout = layout;
    }
  }

  get layout(): string | undefined {
    return this._iframe ? this._iframe.layout : this._layout;
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
    const slug = await this._fixConfig(hass, config);
    if (slug) {
      // addon ingress
      if (this._sessionKeepAlive === undefined) {
        let session: string;
        try {
          session = await createHassioSession(hass);
        } catch (err) {
          throw new Error(`Unable to create an Ingress session`);
        }
        this._sessionKeepAlive = window.setInterval(async () => {
          const hass = this.hass as HomeAssistant;
          try {
            await validateHassioSession(hass, session);
          } catch (err: any) {
            session = await createHassioSession(hass);
          }
        }, 60000);
      }
    } else {
      // not addon ingress
      if (this._sessionKeepAlive) {
        clearInterval(this._sessionKeepAlive);
      }
    }
    // update iframe card
    await this._updateIframe(config);
  }

  private async _fixConfig(hass: HomeAssistant, config: IframeCardConfig): Promise<string> {
    const match = config.url.match(/^([\w-]+)(?:$|\/)(.*)/);
    if (!match) return "";
    const [, slug, url] = match;
    const addon = await fetchHassioAddonInfo(hass, slug);
    if (!addon) {
      throw new Error(`Unable to fetch add-on info of '${slug}'`);
    }
    if (!addon.ingress_url) {
      throw new Error(`Add-on '${slug}' does not support Ingress`);
    }
    config.url = `${addon.ingress_url.replace(/\/+$/, "")}/${url}`;
    return slug;
  }

  private async _updateIframe(config: IframeCardConfig) {
    let iframe = this._iframe;
    if (iframe) {
      iframe.setConfig(config);
    } else {
      this._iframe = (await loadCardHelpers()).createCardElement(config);
      iframe = this._iframe;
      this.appendChild(iframe);
      if (this._layout !== undefined) {
        iframe.layout = this._layout;
        delete this._layout;
      }
      if (this._hass) {
        iframe.hass = this._hass;
        delete this._hass;
      }
    }
  }
}

customElements.define(ADDON_IFRAME_CARD, AddonIframeCard);
registerCustomCard({
  type: ADDON_IFRAME_CARD,
  name: "Webpage ingress",
  description: "Webpage card with addon ingress support.",
  documentationURL: "https://github.com/lovelylain/ha-addon-iframe-card",
});
