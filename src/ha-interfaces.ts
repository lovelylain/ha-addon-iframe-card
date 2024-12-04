export interface LovelaceCardConfig {
  type: string;
  [key: string]: any;
}

export interface HomeAssistant {
  callWS<T>(msg: Record<string, any>): Promise<T>;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  layout?: string;
  getCardSize(): number | Promise<number>;
  setConfig(config: LovelaceCardConfig): void;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
}

interface CustomCardHelpers {
  createCardElement(config: LovelaceCardConfig): LovelaceCard;
}

export const loadCardHelpers: () => Promise<CustomCardHelpers> = (window as any).loadCardHelpers;
