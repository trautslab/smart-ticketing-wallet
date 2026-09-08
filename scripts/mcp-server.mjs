#!/usr/bin/env node
/**
 * 🔌 MCP Server Template (Model Context Protocol)
 * Servidor MCP ejecutable sobre stdio (JSON-RPC 2.0).
 */

import { createInterface } from 'node:readline';

const TOOLS = [
  {
    name: 'ping',
    description: 'Verifica la conectividad del servidor MCP',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'run_eval_harness',
    description: 'Ejecuta el evaluador determinista de tareas',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID de la tarea a evaluar' }
      }
    }
  }
];

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    if (req.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } }) + '\n');
    } else if (req.method === 'tools/call') {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: JSON.stringify({ status: 'success', tool: req.params.name }) }] }
        }) + '\n'
      );
    } else {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: req.id,
          result: { capabilities: { tools: {} }, serverInfo: { name: 'mcp-server-template', version: '1.0.0' } }
        }) + '\n'
      );
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32603, message: err.message } }) + '\n');
  }
});
