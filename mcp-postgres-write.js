#!/usr/bin/env node

/**
 * 🔧 MCP PostgreSQL Server con ESCRITURA HABILITADA
 *
 * Este servidor MCP personalizado permite:
 * - SELECT (lectura)
 * - INSERT, UPDATE, DELETE (escritura)
 * - Transacciones
 *
 * USO: Configura en .mcp.json
 * ⚠️ ADVERTENCIA: Permite modificar la base de datos
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

// Crear servidor MCP
const server = new Server(
  {
    name: "postgres-movicar-write",
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
        name: "execute_sql",
        description: "Execute any SQL query (SELECT, INSERT, UPDATE, DELETE, etc.). Returns rows for SELECT, affected rows for INSERT/UPDATE/DELETE.",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "SQL query to execute",
            },
            params: {
              type: "array",
              description: "Optional array of parameters for prepared statements ($1, $2, etc.)",
              items: {
                type: ["string", "number", "boolean", "null"]
              }
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "execute_transaction",
        description: "Execute multiple SQL queries in a transaction. All queries succeed or all fail atomically.",
        inputSchema: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sql: {
                    type: "string",
                    description: "SQL query"
                  },
                  params: {
                    type: "array",
                    description: "Optional parameters"
                  }
                },
                required: ["sql"]
              },
              description: "Array of SQL queries to execute in transaction",
            },
          },
          required: ["queries"],
        },
      },
      {
        name: "insert_with_return",
        description: "Insert a row and return the inserted data (useful for auto-generated IDs)",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name"
            },
            data: {
              type: "object",
              description: "Object with column names and values to insert"
            },
            returning: {
              type: "array",
              description: "Columns to return (default: ['*'])",
              items: { type: "string" }
            }
          },
          required: ["table", "data"]
        }
      },
      {
        name: "update_with_return",
        description: "Update rows and return the updated data",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name"
            },
            data: {
              type: "object",
              description: "Object with column names and new values"
            },
            where: {
              type: "object",
              description: "Object with conditions for WHERE clause"
            },
            returning: {
              type: "array",
              description: "Columns to return (default: ['*'])",
              items: { type: "string" }
            }
          },
          required: ["table", "data", "where"]
        }
      },
      {
        name: "delete_with_return",
        description: "Delete rows and return the deleted data",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Table name"
            },
            where: {
              type: "object",
              description: "Object with conditions for WHERE clause"
            },
            returning: {
              type: "array",
              description: "Columns to return (default: ['*'])",
              items: { type: "string" }
            }
          },
          required: ["table", "where"]
        }
      }
    ],
  };
});

// Función auxiliar para construir query INSERT
function buildInsertQuery(table, data, returning = ['*']) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING ${returning.join(', ')}
  `;

  return { sql, params: values };
}

// Función auxiliar para construir query UPDATE
function buildUpdateQuery(table, data, where, returning = ['*']) {
  const dataColumns = Object.keys(data);
  const whereColumns = Object.keys(where);

  const setClause = dataColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');

  const whereClause = whereColumns.map((col, i) =>
    `${col} = $${dataColumns.length + i + 1}`
  ).join(' AND ');

  const sql = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING ${returning.join(', ')}
  `;

  const params = [...Object.values(data), ...Object.values(where)];

  return { sql, params };
}

// Función auxiliar para construir query DELETE
function buildDeleteQuery(table, where, returning = ['*']) {
  const whereColumns = Object.keys(where);

  const whereClause = whereColumns.map((col, i) => `${col} = $${i + 1}`).join(' AND ');

  const sql = `
    DELETE FROM ${table}
    WHERE ${whereClause}
    RETURNING ${returning.join(', ')}
  `;

  const params = Object.values(where);

  return { sql, params };
}

// Validar nombre de tabla
function isValidTableName(table) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table);
}

// Handler para ejecutar tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "execute_sql") {
      const { sql, params = [] } = args;

      console.error(`🔍 Ejecutando SQL: ${sql.substring(0, 100)}...`);

      const result = await pool.query(sql, params);

      // Para SELECT retorna rows, para INSERT/UPDATE/DELETE retorna affectedRows
      const response = {
        rows: result.rows || [],
        rowCount: result.rowCount || 0,
        command: result.command,
        fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID }))
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }

    if (name === "execute_transaction") {
      const { queries } = args;

      console.error(`🔄 Ejecutando transacción con ${queries.length} queries`);

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const results = [];
        for (const query of queries) {
          const sql = typeof query === 'string' ? query : query.sql;
          const params = typeof query === 'string' ? [] : (query.params || []);

          console.error(`  - ${sql.substring(0, 80)}...`);
          const result = await client.query(sql, params);

          results.push({
            rowCount: result.rowCount || 0,
            command: result.command,
            rows: result.rows || [],
          });
        }

        await client.query('COMMIT');
        console.error("✅ Transacción completada exitosamente");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, results }, null, 2),
            },
          ],
        };
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error en transacción, rollback ejecutado: ${error.message}`);
        throw error;
      } finally {
        client.release();
      }
    }

    if (name === "insert_with_return") {
      const { table, data, returning = ['*'] } = args;

      if (!isValidTableName(table)) {
        return {
          content: [{ type: "text", text: "❌ ERROR: Nombre de tabla inválido" }],
          isError: true,
        };
      }

      console.error(`➕ Insertando en ${table}`);

      const { sql, params } = buildInsertQuery(table, data, returning);
      const result = await pool.query(sql, params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              inserted: result.rows[0],
              rowCount: result.rowCount
            }, null, 2),
          },
        ],
      };
    }

    if (name === "update_with_return") {
      const { table, data, where, returning = ['*'] } = args;

      if (!isValidTableName(table)) {
        return {
          content: [{ type: "text", text: "❌ ERROR: Nombre de tabla inválido" }],
          isError: true,
        };
      }

      console.error(`✏️ Actualizando ${table}`);

      const { sql, params } = buildUpdateQuery(table, data, where, returning);
      const result = await pool.query(sql, params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              updated: result.rows,
              rowCount: result.rowCount
            }, null, 2),
          },
        ],
      };
    }

    if (name === "delete_with_return") {
      const { table, where, returning = ['*'] } = args;

      if (!isValidTableName(table)) {
        return {
          content: [{ type: "text", text: "❌ ERROR: Nombre de tabla inválido" }],
          isError: true,
        };
      }

      console.error(`🗑️ Eliminando de ${table}`);

      const { sql, params } = buildDeleteQuery(table, where, returning);
      const result = await pool.query(sql, params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              deleted: result.rows,
              rowCount: result.rowCount
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
  console.error("🚀 Iniciando MCP PostgreSQL Server (con escritura habilitada)");
  console.error(`📊 Conectado a PostgreSQL: movicar_db`);
  console.error("⚠️  ADVERTENCIA: Este servidor puede modificar la base de datos");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("✅ Servidor MCP listo");
}

main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
