import { HomeAssistant } from "./ha-interfaces";

interface HassioAddonDetails {
  ingress_url: string | null;
}

export const fetchHassioAddonInfo = async (
  hass: HomeAssistant,
  slug: string
): Promise<HassioAddonDetails | null> => {
  let addon: HassioAddonDetails | null = null;
  try {
    addon = await hass.callWS({
      type: "supervisor/api",
      endpoint: `/addons/${slug}/info`,
      method: "get",
    });
  } catch (err) {}
  return addon;
};

export const createHassioSession = async (hass: HomeAssistant): Promise<string> => {
  const resp: { session: string } = await hass.callWS({
    type: "supervisor/api",
    endpoint: "/ingress/session",
    method: "post",
  });
  const session = resp.session;
  document.cookie = `ingress_session=${session};path=/api/hassio_ingress/;SameSite=Strict${
    location.protocol === "https:" ? ";Secure" : ""
  }`;
  return session;
};

export const validateHassioSession = async (hass: HomeAssistant, session: string) => {
  await hass.callWS({
    type: "supervisor/api",
    endpoint: "/ingress/validate_session",
    method: "post",
    data: { session },
  });
};
