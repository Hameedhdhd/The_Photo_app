import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// In-memory log storage
const logs = [];
const MAX_LOGS = 200;

// Capture timestamp and level
function addLog(level, ...args) {
  const timestamp = new Date().toISOString().substr(11, 12); // HH:MM:SS.mmm
  const message = args.map(a => {
    if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack}`;
    if (typeof a === 'object') {
      try { return JSON.stringify(a, null, 2); } catch { return String(a); }
    }
    return String(a);
  }).join(' ');

  logs.push({ timestamp, level, message });
  if (logs.length > MAX_LOGS) logs.shift();

  // Also call original console
  return message;
}

// Override console methods to capture logs
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  addLog('LOG', ...args);
  originalLog(...args);
};

console.error = (...args) => {
  addLog('ERR', ...args);
  originalError(...args);
};

console.warn = (...args) => {
  addLog('WRN', ...args);
  originalWarn(...args);
};

// Global error handler for uncaught errors
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    addLog('FATAL', `🔥 FATAL${isFatal ? '' : ''}: ${error.message}\n${error.stack}`);
    if (originalHandler) originalHandler(error, isFatal);
  });
}

export const DebugLogger = {
  getLogs: () => [...logs],
  
  getLogsAsText: () => {
    return logs.map(l => `[${l.timestamp}] ${l.level}: ${l.message}`).join('\n');
  },

  clearLogs: () => {
    logs.length = 0;
  },

  copyToClipboard: async () => {
    const text = DebugLogger.getLogsAsText();
    try {
      await Clipboard.setString(text);
      Alert.alert('📋 Copied!', `${logs.length} log entries copied to clipboard.\nPaste in any app or terminal.`);
      return true;
    } catch (e) {
      originalError('Failed to copy logs:', e);
      return false;
    }
  },

  // Manually add a log entry from app code
  log: (message) => addLog('APP', message),
  error: (message) => addLog('ERR', message),
};