import type { RequestHandler } from 'express';
import { credentialSchema } from '../validators/credentialSchema';
import { testServicePrincipalAuth } from '../services/azureAuthenticator';

export const runAuthCheck: RequestHandler = async (req, res, next) => {
  const parseResult = credentialSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.flatten();
    return res.status(400).json({
      status: 'validation_error',
      fieldErrors: errors.fieldErrors
    });
  }

  try {
    const result = await testServicePrincipalAuth(parseResult.data);
    return res.json({
      status: 'success',
      message: 'Authentication succeeded',
      result
    });
  } catch (error: any) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      return res.status(error.statusCode).json({
        status: 'auth_failed',
        message: error.message ?? 'Azure rejected the supplied credentials.'
      });
    }

    if (error?.code === 'ENOTFOUND') {
      return res.status(504).json({
        status: 'network_error',
        message: 'Unable to reach Azure. Check network or authority host.'
      });
    }

    return next(error);
  }
};
