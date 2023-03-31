/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_STORAGE_SAS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
