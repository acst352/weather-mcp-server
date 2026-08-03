// URLs base de las APIs de Open-Meteo
// Si se configura OPEN_METEO_API_KEY, se usan los dominios comerciales (customer-*)
const USE_COMMERCIAL = Boolean(process.env.OPEN_METEO_API_KEY);

export const GEOCODING_API_URL = USE_COMMERCIAL
  ? "https://customer-geocoding-api.open-meteo.com/v1"
  : "https://geocoding-api.open-meteo.com/v1";

export const WEATHER_API_URL = USE_COMMERCIAL
  ? "https://customer-api.open-meteo.com/v1"
  : "https://api.open-meteo.com/v1";

// Limite maximo de caracteres en las respuestas
// Previene respuestas que saturen el contexto del LLM
export const CHARACTER_LIMIT = 25_000;

// Formatos de respuesta soportados
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

// Codigos WMO de condiciones meteorologicas
// https://open-meteo.com/en/docs -> Weather code
export const WEATHER_CODES: Record<number, string> = {
  0: "Cielo despejado",
  1: "Principalmente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granizo fino",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso"
};