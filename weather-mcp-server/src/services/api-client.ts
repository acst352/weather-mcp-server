import axios, { AxiosError } from "axios";
import { GEOCODING_API_URL, WEATHER_API_URL } from "../constants.js";
import type {
  GeocodingResponse,
  ForecastResponse
} from "../types.js";

// API key opcional para el tier comercial de Open-Meteo
const API_KEY = process.env.OPEN_METEO_API_KEY ?? "";

/**
 * Realiza una peticion HTTP generica.
 * Centraliza timeout, headers comunes y la API key opcional.
 */
async function makeRequest<T>(
  baseUrl: string,
  endpoint: string,
  params: Record<string, unknown>
): Promise<T> {
  // Anadir API key si esta configurada (tier comercial)
  const queryParams = API_KEY
    ? { ...params, apikey: API_KEY }
    : params;

  const response = await axios({
    method: "GET",
    url: `${baseUrl}/${endpoint}`,
    params: queryParams,
    timeout: 30_000,
    headers: {
      "Accept": "application/json"
    }
  });

  return response.data as T;
}

// ─── Funciones especificas de Open-Meteo ───────────────────────────

/**
 * Busca ciudades por nombre usando la API de Geocoding.
 * Devuelve hasta `count` resultados con coordenadas, pais y zona horaria.
 */
export async function searchCity(
  name: string,
  count: number = 5,
  language: string = "es"
): Promise<GeocodingResponse> {
  return makeRequest<GeocodingResponse>(
    GEOCODING_API_URL,
    "search",
    { name, count, language, format: "json" }
  );
}

/**
 * Obtiene el tiempo actual para unas coordenadas.
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<ForecastResponse> {
  return makeRequest<ForecastResponse>(
    WEATHER_API_URL,
    "forecast",
    {
      latitude,
      longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m",
        "wind_direction_10m",
        "precipitation",
        "cloud_cover",
        "is_day"
      ].join(","),
      timezone: "auto"
    }
  );
}

/**
 * Obtiene la prevision diaria para los proximos N dias.
 */
export async function getDailyForecast(
  latitude: number,
  longitude: number,
  forecastDays: number = 7
): Promise<ForecastResponse> {
  return makeRequest<ForecastResponse>(
    WEATHER_API_URL,
    "forecast",
    {
      latitude,
      longitude,
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max",
        "sunrise",
        "sunset"
      ].join(","),
      forecast_days: forecastDays,
      timezone: "auto"
    }
  );
}

// ─── Manejo de errores ─────────────────────────────────────────────

/**
 * Convierte errores de la API en mensajes accionables para el agente.
 * Cada mensaje sugiere una accion concreta que el LLM puede tomar.
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 400:
          return "Error: Solicitud invalida. Verifica que los parametros sean correctos (coordenadas validas, nombre de ciudad no vacio).";
        case 404:
          return "Error: Endpoint no encontrado. Verifica la URL de la API.";
        case 429:
          return "Error: Limite de peticiones excedido. Open-Meteo permite ~10.000 peticiones/dia en el tier gratuito. Espera unos segundos antes de reintentar.";
        default:
          return `Error: La API respondio con codigo ${axiosError.response.status}. Intenta de nuevo en unos segundos.`;
      }
    }

    if (axiosError.code === "ECONNABORTED") {
      return "Error: Timeout - la peticion tardo mas de 30 segundos. Intenta de nuevo.";
    }

    if (axiosError.code === "ECONNREFUSED") {
      return "Error: No se pudo conectar con Open-Meteo. Verifica tu conexion a internet.";
    }
  }

  return `Error inesperado: ${error instanceof Error ? error.message : String(error)}`;
}