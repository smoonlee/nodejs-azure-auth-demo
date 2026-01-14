import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: parseNumber(process.env.PORT, 4000),
  defaultScope: process.env.DEFAULT_SCOPE ?? 'https://management.azure.com/.default',
  corsOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
};
