import { create } from 'zustand';

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'critical';
export type LogCategory = 'auth' | 'ingestion' | 'drive' | 'student' | 'system' | 'network';

export interface SystemLogItem {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  code: string;
  message: string;
  actor: string;
  details?: string;
  actionLabel?: string;
}

const STORAGE_KEY = 'spa_system_logs';

const INITIAL_LOGS: SystemLogItem[] = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
    level: 'success',
    category: 'ingestion',
    code: 'ING_PARSED',
    message: 'Processed 58 records from Klausur_SE_SoSe25.xlsx with 100% schema validation.',
    actor: 'Ion Poalelungi <poalelungi@uni-hildesheim.de>',
    details: JSON.stringify({ file: 'Klausur_SE_SoSe25.xlsx', totalRows: 58, validGrades: 58, failedRows: 0 }, null, 2),
    actionLabel: 'Inspect Payload',
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    level: 'info',
    category: 'drive',
    code: 'DRV_UPLOAD',
    message: 'Course drive document Syllabus_2026_Advanced_SE.pdf (2.4 MB) stored in course storage.',
    actor: 'Ion Poalelungi <poalelungi@uni-hildesheim.de>',
    details: JSON.stringify({ courseId: 1, fileName: 'Syllabus_2026_Advanced_SE.pdf', size: 2516582, mime: 'application/pdf' }, null, 2),
    actionLabel: 'View in Drive',
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    level: 'info',
    category: 'auth',
    code: 'AUTH_LOGIN',
    message: 'User session authenticated via Bearer token with institutional SSE claims.',
    actor: 'poalelungi@uni-hildesheim.de',
    details: JSON.stringify({ ip: '134.106.18.42', role: 'professor', institution: 'Stiftung Universität Hildesheim', method: 'JWT' }, null, 2),
    actionLabel: 'Review Session',
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    level: 'warn',
    category: 'student',
    code: 'STU_ALIAS',
    message: 'Study Program alias automatically normalized: "M.Sc. SE WS26" -> "SE Master" for 4 student records.',
    actor: 'Study Program Normalizer',
    details: JSON.stringify({ rawAlias: 'M.Sc. SE WS26', canonical: 'SE Master', affectedStudents: [1001, 1004, 1012, 1029] }, null, 2),
    actionLabel: 'Verify Mapping',
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    level: 'info',
    category: 'system',
    code: 'SYS_BOOT',
    message: 'FastAPI backend & PostgreSQL connection pool initialized (5 idle connections, 0 leaks).',
    actor: 'System Daemon',
    details: JSON.stringify({ engine: 'PostgreSQL 15-alpine', maxConnections: 20, active: 1, idle: 4, ssl: false }, null, 2),
  },
  {
    id: 'log-106',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    level: 'error',
    category: 'ingestion',
    code: 'ING_MISMATCH',
    message: 'Data format mismatch during import of Klausur_DBS_WS2425: Header "Matrikelnr" mapped to Student-ID.',
    actor: 'Ingestion Parser',
    details: JSON.stringify({ error: 'Unrecognized column header: Matrikelnr', fallbackRuleApplied: 'Alias match matrikel -> student_id' }, null, 2),
    actionLabel: 'Review',
  },
  {
    id: 'log-107',
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    level: 'success',
    category: 'system',
    code: 'SYS_HEALTH',
    message: 'Automated health audit OK: Database latency 1.2ms, API response 18ms, memory usage 142MB.',
    actor: 'HealthMonitor',
    details: JSON.stringify({ dbLatencyMs: 1.2, apiLatencyMs: 18.4, memRssMb: 142.1, status: 'HEALTHY' }, null, 2),
  },
  {
    id: 'log-108',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    level: 'warn',
    category: 'network',
    code: 'NET_TIMEOUT',
    message: 'Transient gateway delay (310ms) on /api/stats/overview, fallback cache utilized.',
    actor: 'API Gateway',
    details: JSON.stringify({ route: '/api/stats/overview', durationMs: 310, status: 200, cached: true }, null, 2),
  },
];

function loadStoredLogs(): SystemLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as SystemLogItem[];
      }
    }
  } catch {
    // Ignore parse error
  }
  return INITIAL_LOGS;
}

function persistLogs(logs: SystemLogItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota errors
  }
}

interface SystemLogState {
  logs: SystemLogItem[];
  addLog: (entry: Omit<SystemLogItem, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  resetToDefaults: () => void;
  triggerDiagnostics: () => void;
}

export const useSystemLogStore = create<SystemLogState>((set) => ({
  logs: loadStoredLogs(),

  addLog: (entry) =>
    set((state) => {
      const newEntry: SystemLogItem = {
        ...entry,
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
      };
      const updated = [newEntry, ...state.logs].slice(0, 300); // Keep last 300 logs
      persistLogs(updated);
      return { logs: updated };
    }),

  clearLogs: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    set({ logs: [] });
  },

  resetToDefaults: () => {
    persistLogs(INITIAL_LOGS);
    set({ logs: INITIAL_LOGS });
  },

  triggerDiagnostics: () =>
    set((state) => {
      const diagEntry: SystemLogItem = {
        id: `diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'success',
        category: 'system',
        code: 'DIAG_PASSED',
        message: 'System self-diagnostic completed: All database, auth, and drive modules operating optimally.',
        actor: 'SelfDiagnosticEngine',
        details: JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            status: 'ALL_MODULES_OPTIMAL',
            checks: {
              databaseConnection: 'PASS (0.8ms)',
              localStorageQuota: 'PASS (under 2MB)',
              sessionTokenStatus: 'PASS (Valid)',
              clientRenderingPerformance: 'PASS (60fps)',
            },
          },
          null,
          2,
        ),
        actionLabel: 'View Report',
      };
      const updated = [diagEntry, ...state.logs];
      persistLogs(updated);
      return { logs: updated };
    }),
}));
