import { z } from 'zod';

export const credentialSchema = z.object({
  tenantId: z.string().trim().min(1, 'Tenant ID is required'),
  clientId: z.string().trim().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  scope: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  authorityHost: z
    .string()
    .url('Authority host must be a valid https URL')
    .optional()
});

export type CredentialPayload = z.infer<typeof credentialSchema>;
