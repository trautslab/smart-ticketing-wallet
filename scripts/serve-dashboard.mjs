#!/usr/bin/env node
/**
 * 📡 ShopFast & TrautsLab Mission Control Telemetry Server
 * Servidor HTTP con soporte para Server-Sent Events (SSE) en tiempo real.
 * Transmite cambios en .agents/telemetry/events.jsonl a los navegadores conectados.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'node:fs';
import { resolve } from 'node:path';

const PORT = process.env.PORT || 3333;
const htmlPath = resolve(process.cwd(), 'observability', 'index.html');
const eventsPath = resolve(process.cwd(), '.agents', 'telemetry', 'events.jsonl');

// Clientes SSE conectados
const sseClients = new Set();

function readAllEvents() {
  if (!existsSync(eventsPath)) {
    return [];
  }
  const content = readFileSync(eventsPath, 'utf-8').trim();
  if (!content) return [];

  return content
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l, idx) => {
      try {
        const parsed = JSON.parse(l);
        return { id: idx, ...parsed };
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

// Observar el archivo events.jsonl para emitir eventos SSE en tiempo real
if (existsSync(eventsPath)) {
  watchFile(eventsPath, { interval: 250 }, () => {
    const events = readAllEvents();
    const payload = `data: ${JSON.stringify(events)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch (_) {
        sseClients.delete(client);
      }
    }
  });
}

const server = createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Ruta principal HTML
  if (req.url === '/' || req.url === '/index.html') {
    if (!existsSync(htmlPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Dashboard HTML no encontrado');
    }
    const html = readFileSync(htmlPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // API REST: Obtener todos los eventos
  if (req.url === '/api/telemetry') {
    const events = readAllEvents();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(events));
  }

  // API SSE: Stream en tiempo real (Server-Sent Events)
  if (req.url === '/api/telemetry/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    // Enviar estado inicial inmediatamente
    const initialEvents = readAllEvents();
    res.write(`data: ${JSON.stringify(initialEvents)}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

import { exec } from 'node:child_process';

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n⚡ [TrautsLab Mission Control] Servidor de Telemetría Real-Time SSE activo:`);
  console.log(`   👉 Dashboard: ${url}`);
  console.log(`   👉 SSE Stream: ${url}/api/telemetry/stream\n`);

  // Auto-abrir navegador en SO soportados si se pasa --open o por defecto si no es headless
  const shouldOpen = process.argv.includes('--open') || !process.env.CI;
  if (shouldOpen) {
    const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${startCmd} ${url}`, () => {});
  }
});

process.on('SIGINT', () => {
  unwatchFile(eventsPath);
  process.exit(0);
});
