export type CredentialInputs = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  authorityHost?: string;
};

export type ApiSuccessResponse = {
  status: 'success';
  message: string;
  result: {
    scope: string;
    expiresOn?: string;
    durationMs: number;
    subscriptions?: Array<{
      subscriptionId: string;
      displayName: string;
      state?: string;
    }>;
  };
};

export type ApiValidationError = {
  status: 'validation_error';
  fieldErrors: Record<string, string[]>;
};

export type ApiGenericError = {
  status: 'auth_failed' | 'network_error' | 'error';
  message: string;
};

export type ApiResponse = ApiSuccessResponse | ApiValidationError | ApiGenericError;

export type TerminalEntry = {
  id: string;
  timestamp: string;
  message: string;
  variant?: 'info' | 'success' | 'error';
};

export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';
