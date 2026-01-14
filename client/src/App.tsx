import { useEffect, useMemo, useState } from 'react';
import { CredentialForm } from './components/CredentialForm';
import { ResponseConsole } from './components/ResponseConsole';
import { runAuthCheck } from './lib/api';
import type {
  ApiResponse,
  CredentialInputs,
  SubmissionStatus,
  TerminalEntry
} from './types';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const stored = window.localStorage.getItem('azauth-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const devPrefills: Partial<CredentialInputs> = import.meta.env.DEV
  ? {
      tenantId: import.meta.env.VITE_DEV_TENANT_ID ?? '',
      clientId: import.meta.env.VITE_DEV_CLIENT_ID ?? '',
      clientSecret: import.meta.env.VITE_DEV_CLIENT_SECRET ?? '',
      scope: import.meta.env.VITE_DEV_SCOPE ?? undefined,
      authorityHost: import.meta.env.VITE_DEV_AUTHORITY_HOST ?? undefined
    }
  : {};

const defaultFormValues: CredentialInputs = {
  tenantId: devPrefills.tenantId ?? '',
  clientId: devPrefills.clientId ?? '',
  clientSecret: devPrefills.clientSecret ?? '',
  scope: devPrefills.scope ?? 'https://management.azure.com/.default',
  authorityHost: devPrefills.authorityHost ?? 'https://login.microsoftonline.com'
};

type FieldErrors = Partial<Record<keyof CredentialInputs, string>>;

const validate = (values: CredentialInputs): FieldErrors => {
  const errors: FieldErrors = {};

  if (!values.tenantId.trim()) {
    errors.tenantId = 'Required';
  }
  if (!values.clientId.trim()) {
    errors.clientId = 'Required';
  }
  if (!values.clientSecret.trim()) {
    errors.clientSecret = 'Required';
  }
  if (values.authorityHost && !values.authorityHost.startsWith('https://')) {
    errors.authorityHost = 'Use an https:// authority host URL.';
  }

  return errors;
};

const createLogEntry = (message: string, variant: TerminalEntry['variant'] = 'info'): TerminalEntry => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  timestamp: new Date().toISOString(),
  message,
  variant
});

function App() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [formValues, setFormValues] = useState<CredentialInputs>(defaultFormValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [response, setResponse] = useState<ApiResponse>();
  const [terminalLogs, setTerminalLogs] = useState<TerminalEntry[]>([
    createLogEntry('Ready to validate Azure credentials.')
  ]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const isSubmitting = status === 'loading';

  const addLog = (entry: TerminalEntry) => {
    setTerminalLogs((prev) => [...prev.slice(-9), entry]);
  };

  const handleChange = (field: keyof CredentialInputs, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReset = () => {
    setFormValues(defaultFormValues);
    setFieldErrors({});
    setResponse(undefined);
    setStatus('idle');
    addLog(createLogEntry('Form reset to defaults.'));
  };

  const handleSubmit = async () => {
    const validationErrors = validate(formValues);
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      addLog(createLogEntry('Please resolve validation errors before submitting.', 'error'));
      return;
    }

    abortController?.abort();
    const controller = new AbortController();
    setAbortController(controller);

    setStatus('loading');
    setResponse(undefined);
    addLog(createLogEntry('Submitting credentials to backend...'));

    try {
      const { body, ok } = await runAuthCheck(formValues, controller.signal);
      setResponse(body);

      if (!ok && body.status === 'validation_error') {
        const errors: FieldErrors = {};
        Object.entries(body.fieldErrors).forEach(([key, messages]) => {
          errors[key as keyof CredentialInputs] = messages[0];
        });
        setFieldErrors(errors);
        setStatus('error');
        addLog(createLogEntry('Server validation failed. Check highlighted fields.', 'error'));
        return;
      }

      if (!ok && body.status !== 'success') {
        setStatus('error');
        const errorMessage =
          'message' in body && typeof body.message === 'string'
            ? body.message
            : 'Authentication failed.';
        addLog(createLogEntry(errorMessage, 'error'));
        return;
      }

      setStatus('success');
      addLog(createLogEntry('Azure issued a token. Authentication succeeded.', 'success'));
      if (body.status === 'success' && body.result.subscriptions?.length) {
        addLog(
          createLogEntry(
            `Accessible subscriptions: ${body.result.subscriptions
              .map((sub) => sub.displayName)
              .join(', ')}`,
            'success'
          )
        );
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setStatus('idle');
        addLog(createLogEntry('Authentication run cancelled.', 'info'));
        return;
      }
      setStatus('error');
      addLog(
        createLogEntry(
          error instanceof Error ? error.message : 'Unexpected error occurred while calling the API.',
          'error'
        )
      );
    } finally {
      setAbortController(null);
    }
  };

  useEffect(() => {
    return () => {
      abortController?.abort();
    };
  }, [abortController]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('azauth-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const helperCards = useMemo(
    () => [
      {
        title: 'Use least privilege',
        body: 'Limit the service principal scope to the subscription or resource group under review.'
      },
      {
        title: 'Rotate secrets frequently',
        body: 'Store production secrets in Azure Key Vault. This tool is for temporary validation only.'
      },
      {
        title: 'Sovereign clouds',
        body: 'Override the authority host for Azure US Gov, China, or other sovereign clouds.'
      }
    ],
    []
  );

  const shellPalette =
    theme === 'dark'
      ? 'bg-slate-950 text-slate-100'
      : 'bg-slate-50 text-slate-900';

  return (
    <div className={`min-h-screen px-4 py-10 transition-colors duration-300 ${shellPalette}`}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-100">
              MVP 1.0
            </p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">AzAuth 1.0</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 lg:max-w-3xl">
              Provide customer-supplied service principal credentials to verify Azure AD authentication.
              Nothing is persisted; results are streamed directly to the terminal feed.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? 'Light mode ☀️' : 'Dark mode 🌙'}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-slate-800 dark:bg-slate-900/50">
            <CredentialForm
              values={formValues}
              errors={fieldErrors}
              isSubmitting={isSubmitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {helperCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-800 shadow-sm transition dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{card.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{card.body}</p>
                </div>
              ))}
            </div>
          </div>

          <ResponseConsole status={status} response={response} logs={terminalLogs} theme={theme} />
        </div>
      </div>
    </div>
  );
}

export default App;
