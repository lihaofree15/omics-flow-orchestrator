import type { UserConfig } from 'vite';
import frontendConfig from './apps/frontend/vite.config';

// Root Vite config delegates to frontend but enforces port 8080 for Lovable
const config: UserConfig = {
  ...(frontendConfig as UserConfig),
  server: {
    ...((frontendConfig as any).server || {}),
    port: 8080,
  },
};

export default config;
