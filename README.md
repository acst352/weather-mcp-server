# weather-mcp-server
<!-- 
Si consultas el tiempo en Madrid estás ejecutando, no leyendo. Estas ejecutando una Tool.
Estás enviando información (parámetros) de qué quieres. 

Primitiva:
Tool es una acción
Resource es una cosa
Prompt es una plantilla

Transporte: stdio o HTTP

Estructura de carpetas

weather-mcp-server/
├── package.json
├── node_modules/
└── src/
    ├── tools/        # Implementaciones de herramientas
    ├── services/     # Clientes de API y utilidades compartidas
    └── schemas/      # Esquemas de validacion Zod


Notas interesantes:
En package.json la dependencia tsx sirve para ejecutar directamente archivos de TS y JS en Node.JS sin necesidad de compilar manualmente el código a JS primero.
Funciona solo en el entorno de desarrollo, reinicia automaticamente la app al detectar cambios


Comandos:
¿Quieres ver tu servidor funcionando con UI visual?
  → npx @modelcontextprotocol/inspector

¿Quieres conectar Claude Code / Claude Desktop?
  → Configuras el cliente (no lanzas nada a mano, el cliente lo hace)

¿Quieres depurar el protocolo JSON-RPC a bajo nivel?
  → curl -X POST (con el servidor HTTP en otra terminal)

¿Quieres ver los logs del servidor en tiempo real mientras lo prueba un cliente?
  → npx tsx src/index.ts (en una terminal) + cliente en otra
 -->