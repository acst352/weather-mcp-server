import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  searchCity,
  getCurrentWeather,
  getDailyForecast,
  handleApiError
} from "../services/api-client.js";
import { CHARACTER_LIMIT, ResponseFormat, WEATHER_CODES } from "../constants.js";
import {
  SearchCitySchema,
  GetCurrentWeatherSchema,
  GetForecastSchema,
  type SearchCityInput,
  type GetCurrentWeatherInput,
  type GetForecastInput
} from "../schemas/weather.js";

/**
 * Helper: adapta datos tipados al tipo Record<string, unknown> que espera el SDK
 * para el campo structuredContent.
 *
 * Por que existe: TypeScript no permite asignar interfaces especificas
 * (como GeocodingResponse o ForecastResponse) directamente a Record<string, unknown>
 * aunque sean estructuralmente compatibles, porque les falta el index signature
 * explícito. Esta función es el "puente" tipado en ese punto de fricción.
 */
function toStructuredContent<T extends object>(data: T): Record<string, unknown> {
  return data as Record<string, unknown>;
}

/**
 * Traduce un weather code WMO a texto legible.
 */
function describeWeatherCode(code: number): string {
  return WEATHER_CODES[code] ?? `Codigo desconocido (${code})`;
}

/**
 * Traduce grados de direccion del viento a punto cardinal.
 */
function windDirection(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                       "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Trunca un texto si excede CHARACTER_LIMIT.
 */
function truncate(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.substring(0, CHARACTER_LIMIT) + "\n\n[Respuesta truncada por limite de caracteres]";
}

/**
 * Registra todos los tools relacionados con el tiempo en el servidor MCP.
 */
export function registerWeatherTools(server: McpServer): void {

  // ─── TOOL 1: Buscar ciudades por nombre ──────────────────────────

  server.registerTool(
    "weather_search_city",
    {
      title: "Buscar Ciudad",
      description: `Busca ciudades por nombre y devuelve sus coordenadas geograficas.

IMPORTANTE: Usa este tool PRIMERO para obtener latitud y longitud antes de consultar el tiempo.

Args:
  - city (string): Nombre de la ciudad (ejemplo: "Madrid", "Buenos Aires")
  - count (number): Maximo de resultados, 1-10 (default: 5)
  - language (string): Codigo ISO del idioma, 2 caracteres (default: "es")
  - response_format ('markdown' | 'json'): Formato de salida (default: 'markdown')

Returns:
  Lista de ciudades con nombre, pais, coordenadas, zona horaria y poblacion.

Examples:
  - "Busca Madrid" -> city="Madrid"
  - "Busca Paris y dame solo 3 resultados" -> city="Paris", count=3`,
      inputSchema: SearchCitySchema.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true
      }
    },
    async (params: SearchCityInput) => {
      try {
        const data = await searchCity(params.city, params.count, params.language);

        if (!data.results || data.results.length === 0) {
          const msg = `No se encontraron ciudades para "${params.city}".`;
          return {
            content: [{ type: "text" as const, text: msg }],
            structuredContent: toStructuredContent(data)
          };
        }

        // Formato JSON
        if (params.response_format === ResponseFormat.JSON) {
          const json = JSON.stringify(data, null, 2);
          return {
            content: [{ type: "text" as const, text: truncate(json) }],
            structuredContent: toStructuredContent(data)
          };
        }

        // Formato Markdown (default)
        let md = `# Resultados para "${params.city}"\n\n`;
        md += `| # | Ciudad | País | Lat | Lon | Población |\n`;
        md += `|---|--------|------|-----|-----|-----------|\n`;
        data.results.forEach((r, i) => {
          const region = r.admin1 ? ` (${r.admin1})` : '';
          const pop = r.population?.toLocaleString() ?? '-';
          md += `| ${i + 1} | ${r.name}${region} | ${r.country} | ${r.latitude} | ${r.longitude} | ${pop} |\n`;
        });
        md += `\n**Sugerencia**: Para consultar el tiempo, usa \`weather_get_current\` o \`weather_get_forecast\` con las coordenadas de la ciudad elegida.`;

        return {
          content: [{ type: "text" as const, text: truncate(md) }],
          structuredContent: toStructuredContent(data)
        };
      } catch (error) {
        const msg = handleApiError(error);
        return {
          content: [{ type: "text" as const, text: msg }],
          isError: true
        };
      }
    }
  );

  // ─── TOOL 2: Tiempo actual ───────────────────────────────────────

  server.registerTool(
    "weather_get_current",
    {
      title: "Tiempo Actual",
      description: `Obtiene las condiciones meteorologicas actuales para una ubicacion (latitud/longitud).

Args:
  - latitude (number): Latitud (-90 a 90)
  - longitude (number): Longitud (-180 a 180)
  - city_name (string, opcional): Nombre a mostrar en la respuesta
  - response_format ('markdown' | 'json'): Formato de salida (default: 'markdown')

Returns:
  Temperatura, humedad, sensacion termica, viento, precipitacion y codigo de condiciones.

Prerequisito: Usa \`weather_search_city\` primero para obtener las coordenadas.

Examples:
  - "Tiempo en Madrid" -> latitude=40.4168, longitude=-3.7038, city_name="Madrid"`,
      inputSchema: GetCurrentWeatherSchema.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true
      }
    },
    async (params: GetCurrentWeatherInput) => {
      try {
        const data = await getCurrentWeather(params.latitude, params.longitude);

        if (!data.current) {
          const msg = `No se pudo obtener el tiempo actual para (${params.latitude}, ${params.longitude}).`;
          return {
            content: [{ type: "text" as const, text: msg }],
            isError: true
          };
        }

        const c = data.current;
        const location = params.city_name
          ? `${params.city_name} (${params.latitude}, ${params.longitude})`
          : `(${params.latitude}, ${params.longitude})`;

        if (params.response_format === ResponseFormat.JSON) {
          const json = JSON.stringify(data, null, 2);
          return {
            content: [{ type: "text" as const, text: truncate(json) }],
            structuredContent: toStructuredContent(data)
          };
        }

        const md = `# Tiempo actual en ${location}

**Condiciones**: ${describeWeatherCode(c.weather_code)} ${c.is_day ? '☀️' : '🌙'}
**Temperatura**: ${c.temperature_2m}°C (sensacion ${c.apparent_temperature}°C)
**Humedad**: ${c.relative_humidity_2m}%
**Viento**: ${c.wind_speed_10m} km/h ${windDirection(c.wind_direction_10m)}
**Precipitacion**: ${c.precipitation} mm
**Nubes**: ${c.cloud_cover}%
**Hora local**: ${c.time}`;

        return {
          content: [{ type: "text" as const, text: truncate(md) }],
          structuredContent: toStructuredContent(data)
        };
      } catch (error) {
        const msg = handleApiError(error);
        return {
          content: [{ type: "text" as const, text: msg }],
          isError: true
        };
      }
    }
  );

  // ─── TOOL 3: Prevision diaria ────────────────────────────────────

  server.registerTool(
    "weather_get_forecast",
    {
      title: "Prevision Diaria",
      description: `Obtiene la prevision meteorologica para los proximos N dias (1-16) en una ubicacion.

Args:
  - latitude (number): Latitud (-90 a 90)
  - longitude (number): Longitud (-180 a 180)
  - days (number): Numero de dias (1-16, default: 7)
  - city_name (string, opcional): Nombre a mostrar
  - response_format ('markdown' | 'json'): Formato de salida (default: 'markdown')

Returns:
  Por cada dia: condiciones, max/min temperatura, precipitacion, viento, amanecer/atardecer.

Prerequisito: Usa \`weather_search_city\` primero para obtener las coordenadas.

Examples:
  - "Prevision de 5 dias en Barcelona" -> latitude=41.39, longitude=2.17, days=5, city_name="Barcelona"`,
      inputSchema: GetForecastSchema.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true
      }
    },
    async (params: GetForecastInput) => {
      try {
        const data = await getDailyForecast(params.latitude, params.longitude, params.days);

        if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
          const msg = `No se pudo obtener la prevision para (${params.latitude}, ${params.longitude}).`;
          return {
            content: [{ type: "text" as const, text: msg }],
            isError: true
          };
        }

        const d = data.daily;
        const location = params.city_name
          ? `${params.city_name} (${params.latitude}, ${params.longitude})`
          : `(${params.latitude}, ${params.longitude})`;

        if (params.response_format === ResponseFormat.JSON) {
          const json = JSON.stringify(data, null, 2);
          return {
            content: [{ type: "text" as const, text: truncate(json) }],
            structuredContent: toStructuredContent(data)
          };
        }

        let md = `# Prevision de ${params.days} dias en ${location}\n\n`;
        md += `| Día | Condiciones | Máx | Mín | Lluvia | Viento max | Amanece | Anoche |\n`;
        md += `|-----|-------------|-----|-----|--------|------------|---------|--------|\n`;
        d.time.forEach((date, i) => {
          const code = d.weather_code[i];
          md += `| ${date} | ${describeWeatherCode(code)} | ${d.temperature_2m_max[i]}°C | ${d.temperature_2m_min[i]}°C | ${d.precipitation_sum[i]} mm | ${d.wind_speed_10m_max[i]} km/h | ${d.sunrise[i].split('T')[1]} | ${d.sunset[i].split('T')[1]} |\n`;
        });

        return {
          content: [{ type: "text" as const, text: truncate(md) }],
          structuredContent: toStructuredContent(data)
        };
      } catch (error) {
        const msg = handleApiError(error);
        return {
          content: [{ type: "text" as const, text: msg }],
          isError: true
        };
      }
    }
  );
}