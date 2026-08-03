import { z } from "zod";
import { ResponseFormat } from "../constants.js";

/**
 * Esquema para buscar ciudades por nombre.
 * Usa la API de Geocoding de Open-Meteo.
 */
export const SearchCitySchema = z.object({
  city: z.string()
    .min(1, "El nombre de la ciudad no puede estar vacio")
    .max(100, "El nombre de la ciudad es demasiado largo")
    .describe("Nombre de la ciudad a buscar (ejemplo: 'Madrid', 'Buenos Aires', 'New York')"),

  count: z.number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe("Numero maximo de resultados a devolver (1-10, default: 5)"),

  language: z.string()
    .length(2)
    .default("es")
    .describe("Codigo de idioma ISO 639-1 para los nombres (default: 'es')"),

  response_format: z.enum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de salida: 'markdown' para lectura humana o 'json' para procesamiento automatico")
}).strict();

export type SearchCityInput = z.infer<typeof SearchCitySchema>;

/**
 * Esquema para obtener el tiempo actual.
 * Requiere coordenadas (latitud y longitud).
 */
export const GetCurrentWeatherSchema = z.object({
  latitude: z.number()
    .min(-90)
    .max(90)
    .describe("Latitud de la ubicacion (-90 a 90). Usa weather_search_city para obtenerla."),

  longitude: z.number()
    .min(-180)
    .max(180)
    .describe("Longitud de la ubicacion (-180 a 180). Usa weather_search_city para obtenerla."),

  city_name: z.string()
    .optional()
    .describe("Nombre de la ciudad (opcional, solo para mostrar en la respuesta)"),

  response_format: z.enum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de salida: 'markdown' o 'json'")
}).strict();

export type GetCurrentWeatherInput = z.infer<typeof GetCurrentWeatherSchema>;

/**
 * Esquema para obtener la prevision de los proximos dias.
 */
export const GetForecastSchema = z.object({
  latitude: z.number()
    .min(-90)
    .max(90)
    .describe("Latitud de la ubicacion (-90 a 90). Usa weather_search_city para obtenerla."),

  longitude: z.number()
    .min(-180)
    .max(180)
    .describe("Longitud de la ubicacion (-180 a 180). Usa weather_search_city para obtenerla."),

  days: z.number()
    .int()
    .min(1)
    .max(16)
    .default(7)
    .describe("Numero de dias de prevision (1-16, default: 7)"),

  city_name: z.string()
    .optional()
    .describe("Nombre de la ciudad (opcional, solo para mostrar en la respuesta)"),

  response_format: z.enum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Formato de salida: 'markdown' o 'json'")
}).strict();

export type GetForecastInput = z.infer<typeof GetForecastSchema>;