/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_DEV_TENANT_ID?: string;
  readonly VITE_DEV_CLIENT_ID?: string;
  readonly VITE_DEV_CLIENT_SECRET?: string;
  readonly VITE_DEV_SCOPE?: string;
  readonly VITE_DEV_AUTHORITY_HOST?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
