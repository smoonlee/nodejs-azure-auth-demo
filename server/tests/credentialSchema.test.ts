import { describe, expect, it } from 'vitest';
import { credentialSchema } from '../src/validators/credentialSchema';

describe('credentialSchema', () => {
  it('accepts valid payloads', () => {
    const result = credentialSchema.safeParse({
      tenantId: 'abc',
      clientId: 'def',
      clientSecret: 'secret',
      scope: 'https://management.azure.com/.default'
    });

    expect(result.success).toBe(true);
  });

  it('rejects missing values', () => {
    const result = credentialSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.error.formErrors.fieldErrors ?? {}).length).toBeGreaterThan(0);
    }
  });
});
