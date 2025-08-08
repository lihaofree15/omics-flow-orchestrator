import type { UserConfig } from 'vite';
import frontendConfig from './apps/frontend/vite.config';

// Re-export frontend Vite config so Lovable can detect Vite at repo root
export default frontendConfig as UserConfig;
