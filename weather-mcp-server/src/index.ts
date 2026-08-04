import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { registerWeatherTools } from "./tools/weather.js";
import { registerWeatherResources } from "./resources/weather.js";

/**
 * Servidor MCP con dos modos de transporte seleccionables en runtime:
 *  - stdio: para clientes locales (Claude Desktop). El servidor es un subproceso.
 *  - http:  para clientes remotos. El servidor escucha en un puerto HTTP.
 *
 * La eleccion se hace con la variable de entorno TRANSPORT (default: "stdio").
 *
 * Observa: este es el UNICO archivo del proyecto que cambia si modificas el
 * transporte. Los tools, schemas y services permanecen identicos. Esa es la
 * promesa de la arquitectura en capas que definimos en el Paso 2.
 */

const server = new McpServer({
  name: "weather-mcp-server",
  version: "1.0.0"
});

// Unica linea que toca tools/. Anade mas tools aqui a medida que crezca el servidor.
registerWeatherTools(server);
registerWeatherResources(server); 

const transportType = process.env.TRANSPORT ?? "stdio";

async function main() {
  if (transportType === "stdio") {
    // ── Modo stdio ──────────────────────────────────────────────
    // Logs a stderr (console.error) para no contaminar stdout, que es
    // el canal del protocolo JSON-RPC. Un console.log aqui ROMPERIA el servidor.
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[weather-mcp] Servidor iniciado en modo stdio");

    // Cierre limpio con Ctrl+C
    process.on("SIGINT", async () => {
      console.error("[weather-mcp] Cerrando servidor (SIGINT)...");
      await server.close();
      process.exit(0);
    });
  } else if (transportType === "http") {
    // ── Modo HTTP ───────────────────────────────────────────────
    // Modo "stateless" (sin sesiones): cada request es independiente.
    // Es la opcion mas robusta para servidores remotos simples.
    const port = Number(process.env.PORT ?? 3000);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    const httpServer = createServer(async (req, res) => {
      try {
        // El transport sabe como responder a GET, POST y DELETE en /mcp
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error("[weather-mcp] Error procesando peticion:", error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain");
          res.end("Internal server error");
        }
      }
    });

    httpServer.listen(port, () => {
      console.error(`[weather-mcp] Servidor HTTP escuchando en http://localhost:${port}/mcp`);
    });
  } else {
    console.error(`[weather-mcp] Transporte desconocido: "${transportType}". Usa 'stdio' o 'http'.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[weather-mcp] Error fatal:", error);
  process.exit(1);
});