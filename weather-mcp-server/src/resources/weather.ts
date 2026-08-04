import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WEATHER_CODES } from "../constants.js";

/**
 * Registra los resources relacionados con el tiempo.
 *
 * A diferencia de los tools (que EJECUTAN acciones con parametros),
 * los resources EXPONEN datos por URI que el LLM puede LEER.
 *
 *   tool     = funcion que el LLM invoca   (ej: weather_get_current)
 *   resource = archivo que el LLM lee      (ej: weather://codes)
 */
export function registerWeatherResources(server: McpServer): void {

  server.registerResource(
    "weather-codes",
    "weather://codes",
    {
      title: "Códigos meteorológicos WMO",
      description: `Tabla de referencia con los codigos oficiales de condiciones meteorologicas de la Organizacion Meteorologica Mundial (WMO), tal como los devuelve Open-Meteo.

Incluye descripciones de fenomenos como cielo despejado, lluvia, nieve, tormenta, niebla, etc.

Ejemplos:
  - Codigo 0  -> Cielo despejado
  - Codigo 61 -> Lluvia ligera
  - Codigo 95 -> Tormenta

Usalo cuando recibas un weather_code numerico de otro tool y necesites interpretarlo.`,
      mimeType: "text/markdown"
    },
    async (uri) => {
      const table = Object.entries(WEATHER_CODES)
        .map(([code, desc]) => `| ${code} | ${desc} |`)
        .join("\n");

      const markdown = `# Codigos meteorologicos WMO

Referencia oficial usada por Open-Meteo.

| Codigo | Descripcion |
|--------|-------------|
${table}

**Fuente**: [Open-Meteo Weather Codes](https://open-meteo.com/en/docs)`;

      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: markdown
        }]
      };
    }
  );
}