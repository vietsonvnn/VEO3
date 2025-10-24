
import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel } from '../services/loggerService';
import { DocumentTextIcon, ArrowDownTrayIcon, TrashIcon } from './icons';

const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'info':
        return 'bg-blue-900/20 border-blue-700 text-blue-400';
      case 'success':
        return 'bg-green-900/20 border-green-700 text-green-400';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-400';
      case 'error':
        return 'bg-red-900/20 border-red-700 text-red-400';
      default:
        return 'bg-gray-900/20 border-gray-700 text-gray-400';
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
      second: '2-digit',
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-purple-400" />
            Generation Logs
          </h2>
          <p className="text-gray-400 mt-1">Real-time logs of all generation steps</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleClear}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-red-600/20 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Total: {logs.length} entries</span>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-900/20 border border-blue-700 text-blue-400 rounded">
              ℹ️ Info
            </span>
            <span className="px-2 py-1 bg-green-900/20 border border-green-700 text-green-400 rounded">
              ✅ Success
            </span>
            <span className="px-2 py-1 bg-yellow-900/20 border border-yellow-700 text-yellow-400 rounded">
              ⚠️ Warning
            </span>
            <span className="px-2 py-1 bg-red-900/20 border border-red-700 text-red-400 rounded">
              ❌ Error
            </span>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No logs yet. Start generating videos to see logs here.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border ${getLevelColor(log.level)} transition hover:opacity-80`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{getLevelIcon(log.level)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-gray-500">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="text-xs font-semibold uppercase">
                        {log.level}
                      </span>
                    </div>
                    <p className="text-sm break-words">{log.message}</p>
                    {log.details && (
                      <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto">
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
    </div>
  );
};

export default LogsTab;
