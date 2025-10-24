
import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel } from '../services/loggerService';
import { DocumentTextIcon, ArrowDownTrayIcon, TrashIcon } from './icons';

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getLevelIcon = (level: LogLevel): string => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '•';
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExport = () => {
    const logData = logger.export();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veo-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all logs?')) {
      logger.clear();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg hover:bg-gray-700 transition"
        >
          <DocumentTextIcon className="w-5 h-5 text-purple-400" />
          <span className="text-sm">Logs ({logs.length})</span>
          {logs.length > 0 && logs[logs.length - 1].level === 'error' && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      ) : (
        <div className="w-96 max-h-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Generation Logs</h3>
              <span className="text-xs text-gray-500">({logs.length})</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="p-1 hover:bg-gray-700 rounded transition"
                title="Export logs"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-700 rounded transition"
                title="Clear logs"
              >
                <TrashIcon className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-700 rounded transition"
              >
                <span className="text-gray-400">✕</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-900/50">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No logs yet</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="text-xs p-2 bg-gray-800/50 rounded border border-gray-700/50 hover:border-gray-600 transition"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base">{getLevelIcon(log.level)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                        <span className={`font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 break-words">{log.message}</p>
                      {log.details && (
                        <pre className="mt-1 text-gray-500 text-xs overflow-x-auto">
                          {typeof log.details === 'string'
                            ? log.details
                            : JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
