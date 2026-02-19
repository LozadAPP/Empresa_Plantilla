#!/usr/bin/env node

/**
 * 🔒 MCP PostgreSQL Server SOLO LECTURA
 *
 * Este servidor MCP personalizado permite:
 * - SELECT (lectura) únicamente
 * - SHOW, \\d (metadatos de PostgreSQL)
 *
 * NO permite INSERT, UPDATE, DELETE
 *
 * USO: Configura en .mcp.json
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pkg from 'pg';
const { Pool } = pkg;

// Obtener connection string del argumento
const connectionString = process.argv[2];

if (!connectionString) {
  console.error("❌ ERROR: Se requiere DATABASE_URL como argumento");
  process.exit(1);
}

// Pool de conexiones PostgreSQL
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Validar que la query sea solo lectura
const isReadOnlyQuery = (sql) => {
  const normalized = sql.trim().toUpperCase();
  const allowedPrefixes = ['SELECT', 'SHOW', 'EXPLAIN', 'ANALYZE'];
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE'];

  // Verificar que comience con comando permitido
  const startsWithAllowed = allowedPrefixes.some(prefix => normalized.startsWith(prefix));

  // Verificar que no contenga comandos prohibidos
  const containsForbidden = forbidden.some(cmd => normalized.includes(cmd));

  return startsWithAllowed && !containsForbidden;
};

// Crear servidor MCP
const server = new Server(
  {
    name: "postgres-movicar-readonly",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: Listar herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "Execute a SELECT query (read-only). Returns rows from the PostgreSQL database.",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "SQL SELECT query",
            },
            params: {
              type: "array",
              description: "Query parameters using $1, $2, etc. (optional)",
              items: {
                type: ["string", "number", "boolean", "null"]
              }
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the current schema (public by default)",
        inputSchema: {
          type: "object",
          properties: {
            schema: {
              type: "string",
              description: "Schema name (default: public)",
              default: "public"
            }
          },
        },
      },
      {
        name: "describe_table",
        description: "Get table structure (columns, types, constraints)",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name",
            },
            schema: {
              type: "string",
              description: "Schema name (default: public)",
              default: "public"
            }
          },
          required: ["table"],
        },
      },
      {
        name: "get_schema_info",
        description: "Get complete database schema information (tables, relationships, indexes)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handler para ejecutar tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "query") {
      const { sql, params = [] } = args;

      // Validar que sea solo lectura
      if (!isReadOnlyQuery(sql)) {
        return {
          content: [
            {
              type: "text",
              text: "❌ ERROR: Solo se permiten queries de lectura (SELECT, SHOW, EXPLAIN, ANALYZE)",
            },
          ],
          isError: true,
        };
      }

      console.error(`🔍 Ejecutando query: ${sql.substring(0, 100)}...`);

      const result = await pool.query(sql, params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              rows: result.rows,
              rowCount: result.rowCount,
              command: result.command
            }, null, 2),
          },
        ],
      };
    }

    if (name === "list_tables") {
      const { schema = 'public' } = args;

      console.error(`📋 Listando tablas del schema: ${schema}`);

      const result = await pool.query(`
        SELECT
          table_name,
          table_type,
          is_insertable_into
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name
      `, [schema]);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    }

    if (name === "describe_table") {
      const { table, schema = 'public' } = args;

      // Validar nombre de tabla (evitar inyección SQL)
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        return {
          content: [
            {
              type: "text",
              text: "❌ ERROR: Nombre de tabla inválido",
            },
          ],
          isError: true,
        };
      }

      console.error(`📊 Describiendo tabla: ${schema}.${table}`);

      const result = await pool.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, table]);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    }

    if (name === "get_schema_info") {
      console.error("📊 Obteniendo información del schema completo...");

      const tablesResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const relationshipsResult = await pool.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      `);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              tables: tablesResult.rows,
              relationships: relationshipsResult.rows
            }, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    console.error(`❌ Error ejecutando ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: `❌ ERROR: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Manejar cierre limpio
process.on("SIGINT", async () => {
  console.error("🛑 Cerrando servidor MCP...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("🛑 Cerrando servidor MCP...");
  await pool.end();
  process.exit(0);
});

// Iniciar servidor
async function main() {
  console.error("🚀 Iniciando MCP PostgreSQL Server (SOLO LECTURA)");
  console.error(`📊 Conectado a PostgreSQL: movicar_db`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("✅ Servidor MCP listo (read-only)");
}

main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
