import { ClientSecretCredential } from '@azure/identity';
import type { CredentialPayload } from '../validators/credentialSchema';
import { config } from '../config';
import { logger } from '../logger';

type SubscriptionSummary = {
  subscriptionId: string;
  displayName: string;
  state?: string;
};

export type AuthCheckResult = {
  scope: string;
  expiresOn?: string;
  durationMs: number;
  subscriptions?: SubscriptionSummary[];
};

const MANAGEMENT_SCOPE_PREFIX = 'https://management.azure.com';
const SUBSCRIPTION_ENDPOINT = `${MANAGEMENT_SCOPE_PREFIX}/subscriptions?api-version=2020-01-01`;

const shouldFetchSubscriptions = (scope: string) =>
  scope.trim().toLowerCase().startsWith(MANAGEMENT_SCOPE_PREFIX);

const fetchSubscriptions = async (accessToken: string, scope: string) => {
  if (!accessToken || !shouldFetchSubscriptions(scope)) {
    return [];
  }

  try {
    const response = await fetch(SUBSCRIPTION_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      logger.warn(
        {
          status: response.status,
          statusText: response.statusText
        },
        'Failed to list subscriptions'
      );
      return [];
    }

    const body = (await response.json()) as {
      value?: Array<{ subscriptionId: string; displayName: string; state?: string }>;
    };

    return (body.value ?? []).slice(0, 5).map((item) => ({
      subscriptionId: item.subscriptionId,
      displayName: item.displayName,
      state: item.state
    }));
  } catch (error) {
    logger.warn(
      {
        err: error instanceof Error ? error.message : error
      },
      'Unexpected error fetching subscriptions'
    );
    return [];
  }
};

export const testServicePrincipalAuth = async (
  payload: CredentialPayload
): Promise<AuthCheckResult> => {
  const scope = payload.scope && payload.scope.length > 0 ? payload.scope : config.defaultScope;

  const credential = new ClientSecretCredential(
    payload.tenantId,
    payload.clientId,
    payload.clientSecret,
    payload.authorityHost ? { authorityHost: payload.authorityHost } : undefined
  );

  const startedAt = Date.now();
  try {
    const token = await credential.getToken(scope);
    const durationMs = Date.now() - startedAt;

    logger.info(
      {
        tenantId: payload.tenantId,
        clientId: payload.clientId,
        scope
      },
      'Successfully acquired Azure token'
    );

    const subscriptions = await fetchSubscriptions(token.token, scope);

    return {
      scope,
      expiresOn: token?.expiresOnTimestamp
        ? new Date(token.expiresOnTimestamp).toISOString()
        : undefined,
      durationMs,
      subscriptions: subscriptions.length ? subscriptions : undefined
    };
  } catch (error) {
    logger.warn(
      {
        tenantId: payload.tenantId,
        clientId: payload.clientId,
        scope,
        err: error
      },
      'Azure authentication failed'
    );
    throw error;
  }
};
