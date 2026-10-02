import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boardPath = path.resolve(__dirname, '../docs/board.json');

interface Task {
  id: string;
  title: string;
  domain: string;
  status: 'pending' | 'in_progress' | 'testing' | 'done' | 'backlog' | 'blocked';
  priority: string;
  spec_reference: string;
  dependencies: string[];
  acceptance_criteria: string[];
  files_to_touch: string[];
  completed_at: string | null;
}

interface BoardData {
  version: string;
  project: string;
  last_updated: string;
  active_sprint: string;
  summary: {
    total: number;
    done: number;
    in_progress: number;
    pending: number;
    backlog: number;
  };
  tasks: Task[];
}

function renderBoard() {
  if (!fs.existsSync(boardPath)) {
    console.error(`\x1b[31mError: No se encontró el tablero en ${boardPath}\x1b[0m`);
    process.exit(1);
  }

  const raw = fs.readFileSync(boardPath, 'utf-8');
  const board: BoardData = JSON.parse(raw);

  const { total, done, in_progress, pending, backlog } = board.summary;
  const percent = total > 0 ? ((done / total) * 100).toFixed(1) : '0';

  const barWidth = 30;
  const filledWidth = Math.round((done / total) * barWidth);
  const progressBar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);

  console.log('\n\x1b[1m\x1b[36m============================================================\x1b[0m');
  console.log(`\x1b[1m\x1b[35m  AGYKE AGENT BOARD\x1b[0m \x1b[90m(v${board.version})\x1b[0m`);
  console.log(`\x1b[33m  Sprint Activo:\x1b[0m ${board.active_sprint}`);
  console.log(`\x1b[90m  Última Actualización:\x1b[0m ${new Date(board.last_updated).toLocaleString('es-AR')}`);
  console.log('\x1b[1m\x1b[36m============================================================\x1b[0m\n');

  console.log(`\x1b[1mProgreso General:\x1b[0m [ \x1b[32m${progressBar}\x1b[0m ] \x1b[1m\x1b[32m${percent}%\x1b[0m`);
  console.log(
    `Total: \x1b[1m${total}\x1b[0m | ` +
    `Completadas: \x1b[32m${done}\x1b[0m | ` +
    `En Progreso: \x1b[33m${in_progress}\x1b[0m | ` +
    `Pendientes: \x1b[34m${pending}\x1b[0m | ` +
    `Backlog: \x1b[90m${backlog}\x1b[0m\n`
  );

  // Tareas en progreso
  const inProgressTasks = board.tasks.filter((t) => t.status === 'in_progress');
  if (inProgressTasks.length > 0) {
    console.log('\x1b[1m\x1b[33m▶ EN PROGRESO:\x1b[0m');
    for (const t of inProgressTasks) {
      console.log(`  \x1b[33m● [${t.id}]\x1b[0m ${t.title} \x1b[90m(${t.domain})\x1b[0m`);
    }
    console.log('');
  }

  // Tareas pendientes agrupadas por dominio
  const pendingTasks = board.tasks.filter((t) => t.status === 'pending');
  if (pendingTasks.length > 0) {
    console.log('\x1b[1m\x1b[34m▶ TAREAS PENDIENTES (POR DOMINIO):\x1b[0m');
    const byDomain: Record<string, Task[]> = {};
    for (const t of pendingTasks) {
      if (!byDomain[t.domain]) byDomain[t.domain] = [];
      byDomain[t.domain].push(t);
    }

    for (const [domain, tasks] of Object.entries(byDomain)) {
      console.log(`  \x1b[1m\x1b[37m[${domain.toUpperCase()}]\x1b[0m`);
      for (const t of tasks) {
        const prioColor = t.priority === 'p0' ? '\x1b[31m' : t.priority === 'p1' ? '\x1b[33m' : '\x1b[90m';
        console.log(`    - \x1b[36m${t.id}\x1b[0m (${prioColor}${t.priority}\x1b[0m): ${t.title}`);
      }
    }
    console.log('');
  }

  // Tareas en backlog
  const backlogTasks = board.tasks.filter((t) => t.status === 'backlog');
  if (backlogTasks.length > 0) {
    console.log(`\x1b[90m▶ BACKLOG ARQUITECTURAL (${backlogTasks.length} tareas pospuestas):\x1b[0m`);
    for (const t of backlogTasks) {
      console.log(`  \x1b[90m- [${t.id}] ${t.title} (${t.domain})\x1b[0m`);
    }
    console.log('');
  }

  console.log('\x1b[36m============================================================\x1b[0m\n');
}

renderBoard();
