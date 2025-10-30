// Simple pretty-printer para logs JSON estilo pino (usado por Next.js)
// No requiere dependencias externas

import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

const LEVEL_COLORS = {
  10: '\x1b[90m', // trace -> gray
  20: '\x1b[90m', // debug -> gray
  30: '\x1b[32m', // info -> green
  40: '\x1b[33m', // warn -> yellow
  50: '\x1b[31m', // error -> red
  60: '\x1b[41m\x1b[37m', // fatal -> white on red
};

const RESET = '\x1b[0m';

function formatTime(ts) {
  try {
    const d = new Date(Number(ts));
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch {
    return String(ts);
  }
}

function levelLabel(level) {
  const map = { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' };
  return map[level] ?? String(level);
}

rl.on('line', (line) => {
  if (!line) {
    return;
  }
  try {
    const obj = JSON.parse(line);
    const level = obj.level ?? 30;
    const color = LEVEL_COLORS[level] ?? '';
    const ts = formatTime(obj.time ?? Date.now());
    const name = obj.name ? `[${obj.name}]` : '';
    const msg = obj.msg ?? '';
    const details = [];
    if (obj.req?.method && obj.req?.url) {
      details.push(`${obj.req.method} ${obj.req.url}`);
    }
    if (obj.res?.statusCode) {
      details.push(`status=${obj.res.statusCode}`);
    }
    const extras = details.length ? ` ${details.join(' ')}` : '';
    const lineOut = `${color}${ts} ${levelLabel(level).toUpperCase()}${RESET} ${name} ${msg}${extras}`.trim();
    process.stdout.write(lineOut + '\n');
  } catch {
    // Si no es JSON, imprimir tal cual
    process.stdout.write(line + '\n');
  }
});

rl.on('close', () => {
  // no-op
});


