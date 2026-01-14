import type { ApiResponse, SubmissionStatus, TerminalEntry } from '../types';

type Theme = 'light' | 'dark';

const statusPalette: Record<Theme, Record<SubmissionStatus, string>> = {
  light: {
    idle: 'text-slate-500',
    loading: 'text-amber-500',
    success: 'text-emerald-600',
    error: 'text-red-600'
  },
  dark: {
    idle: 'text-slate-300',
    loading: 'text-yellow-300',
    success: 'text-emerald-300',
    error: 'text-red-300'
  }
};

type ResponseConsoleProps = {
  status: SubmissionStatus;
  response?: ApiResponse;
  logs: TerminalEntry[];
  theme: Theme;
};

const formatJson = (payload: unknown) => {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return 'Unable to format response.';
  }
};

const logColor = (theme: Theme, variant: TerminalEntry['variant']) => {
  if (variant === 'error') {
    return theme === 'dark' ? 'text-red-300' : 'text-red-600';
  }
  if (variant === 'success') {
    return theme === 'dark' ? 'text-emerald-300' : 'text-emerald-600';
  }
  return theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
};

export const ResponseConsole = ({ status, response, logs, theme }: ResponseConsoleProps) => {
  const subscriptions =
    response?.status === 'success' ? response.result.subscriptions ?? [] : [];

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-900 shadow-2xl transition dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100">
      <div className="flex items-center justify-between pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Terminal feed</p>
          <p className={`text-lg font-semibold ${statusPalette[theme][status]}`}>{status.toUpperCase()}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Azure Auth Probe
        </span>
      </div>

      <div
        className={`flex-1 space-y-5 overflow-y-auto rounded-2xl p-4 font-mono text-xs shadow-inner ${theme === 'dark' ? 'bg-slate-950/60 text-emerald-200' : 'bg-slate-100 text-emerald-700'}`}
      >
        {logs.map((log) => (
          <div key={log.id} className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500">
              {log.timestamp}
            </p>
            <p className={logColor(theme, log.variant)}>{log.message}</p>
          </div>
        ))}
        {!logs.length && (
          <p className="text-slate-500 dark:text-slate-400">No activity yet.</p>
        )}
      </div>

      {subscriptions.length > 0 && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-900/10">
          <p className="mb-3 text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-200">
            Accessible subscriptions
          </p>
          <ul className="space-y-2 text-[13px]">
            {subscriptions.map((sub) => (
              <li
                key={sub.subscriptionId}
                className="rounded-xl bg-emerald-100/80 p-3 dark:bg-emerald-950/40"
              >
                <p className="font-semibold text-emerald-800 dark:text-white">{sub.displayName}</p>
                <p className="text-emerald-700 dark:text-emerald-200">{sub.subscriptionId}</p>
                {sub.state && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-300/80">State: {sub.state}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            API response
          </p>
          <pre className="max-h-64 overflow-auto rounded-xl bg-slate-900/90 p-4 text-[11px] leading-relaxed text-emerald-200 dark:bg-black/60">
            {formatJson(response)}
          </pre>
        </div>
      )}
    </div>
  );
};
