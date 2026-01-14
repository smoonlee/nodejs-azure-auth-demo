import type { ApiResponse, CredentialInputs } from '../types';

export type ApiResult = {
  ok: boolean;
  status: number;
  body: ApiResponse;
};

export const runAuthCheck = async (
  payload: CredentialInputs,
  signal?: AbortSignal
): Promise<ApiResult> => {
  const response = await fetch('/api/auth/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });

  let body: ApiResponse;
  try {
    body = (await response.json()) as ApiResponse;
  } catch {
    body = {
      status: 'error',
      message: 'Received empty response from the API.'
    };
  }

  return { ok: response.ok, status: response.status, body };
};
