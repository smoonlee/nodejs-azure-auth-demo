import { useId } from 'react';
import type { CredentialInputs } from '../types';

type FieldErrors = Partial<Record<keyof CredentialInputs, string>>;

type CredentialFormProps = {
  values: CredentialInputs;
  errors: FieldErrors;
  isSubmitting: boolean;
  onChange: (field: keyof CredentialInputs, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
};

const fieldConfig: Array<{
  name: keyof CredentialInputs;
  label: string;
  placeholder: string;
  type?: 'text' | 'password';
  helper?: string;
  required?: boolean;
}> = [
  {
    name: 'tenantId',
    label: 'Tenant ID',
    placeholder: '00000000-0000-0000-0000-000000000000',
    helper: 'Also called Directory (tenant) ID in Azure AD.',
    required: true
  },
  {
    name: 'clientId',
    label: 'Client ID',
    placeholder: 'Application (client) ID',
    required: true
  },
  {
    name: 'clientSecret',
    label: 'Client Secret',
    placeholder: 'Paste the secret value (not ID)',
    type: 'password',
    helper: 'Secret is only held in-memory for this verification call.',
    required: true
  },
  {
    name: 'scope',
    label: 'Scope',
    placeholder: 'https://management.azure.com/.default',
    helper: 'Defaults to Azure Resource Manager if left empty.'
  },
  {
    name: 'authorityHost',
    label: 'Authority Host (optional)',
    placeholder: 'https://login.microsoftonline.com',
    helper: 'Override if you use a sovereign cloud endpoint.'
  }
];

export const CredentialForm = ({
  values,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onReset
}: CredentialFormProps) => {
  const formId = useId();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <form
      id={`auth-form-${formId}`}
      className="space-y-6"
      onSubmit={handleSubmit}
      onReset={handleReset}
      autoComplete="off"
    >
      <div className="space-y-2">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Provide temporary service principal credentials. They are sent securely to the backend API
          and never persisted.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tip: use a least-privileged test principal scoped to the subscription or resource group the
          customer provided.
        </p>
      </div>

      {fieldConfig.map((field) => {
        const inputId = `${formId}-${field.name}`;
        const fieldType = field.type ?? 'text';

        return (
          <div key={field.name} className="space-y-1">
            <label
              htmlFor={inputId}
              className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              <span>{field.label}</span>
              {field.required && (
                <span className="text-xs font-normal text-red-500 dark:text-red-300">Required</span>
              )}
            </label>
            <input
              id={inputId}
              name={field.name}
              type={fieldType}
              value={values[field.name] ?? ''}
              placeholder={field.placeholder}
              className={`w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-inner transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-100 ${errors[field.name] ? 'border-red-500 dark:border-red-400' : ''}`}
              onChange={(event) => onChange(field.name, event.target.value)}
              disabled={isSubmitting}
            />
            {field.helper && <p className="text-xs text-slate-500 dark:text-slate-400">{field.helper}</p>}
            {errors[field.name] && (
              <p className="text-xs text-red-500 dark:text-red-300">{errors[field.name]}</p>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Authenticating...' : 'Run authentication test'}
        </button>
        <button
          type="reset"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          disabled={isSubmitting}
        >
          Clear
        </button>
      </div>
    </form>
  );
};
