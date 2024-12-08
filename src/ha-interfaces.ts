export interface HomeAssistant {
  callWS<T>(msg: Record<string, any>): Promise<T>;
}

export interface LovelaceCardConfig {
  type: string;
  [key: string]: any;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceCardConfig): void;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
}

interface CustomCardHelpers {
  createCardElement(config: LovelaceCardConfig): LovelaceCard;
}

export const loadCardHelpers: () => Promise<CustomCardHelpers> = (window as any).loadCardHelpers;

interface CustomCardEntry {
  type: string;
  name?: string;
  description?: string;
  preview?: boolean;
  documentationURL?: string;
}

export const registerCustomCard = (card: CustomCardEntry) => {
  const win = window as unknown as { customCards?: CustomCardEntry[] };
  const customCards = win.customCards || (win.customCards = []);
  customCards.push(card);
};
