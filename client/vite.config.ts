import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const workspaceRoot = process.cwd();
const realWorkspaceRoot = fs.realpathSync(workspaceRoot);
const needsSymlinkRewrite = workspaceRoot !== realWorkspaceRoot;
const normalizedRealRoot = realWorkspaceRoot.replace(/\\/g, '/').toLowerCase();

const debugSymlink = process.env.DEBUG_SYMLINK === '1';

if (debugSymlink) {
  console.log('[symlink] workspaceRoot', workspaceRoot);
  console.log('[symlink] realWorkspaceRoot', realWorkspaceRoot);
  console.log('[symlink] needsRewrite', needsSymlinkRewrite);
}

const symlinkRewritePlugin = (): Plugin => ({
  name: 'workspace-symlink-rewrite',
  enforce: 'pre',
  load(id: string) {
    if (!needsSymlinkRewrite) return null;
    const normalizedId = id.startsWith('file://') ? fileURLToPath(id) : id;
    if (!path.isAbsolute(normalizedId)) return null;
    const normalizedForCompare = normalizedId.replace(/\\/g, '/').toLowerCase();
    if (!normalizedForCompare.startsWith(normalizedRealRoot)) return null;

    const candidate = path.join(workspaceRoot, path.relative(realWorkspaceRoot, normalizedId));
    if (fs.existsSync(candidate)) {
      if (debugSymlink) {
        console.log(`[symlink] redirecting ${normalizedId} -> ${candidate}`);
      }
      return fs.readFileSync(candidate, 'utf8');
    }
    return null;
  }
});

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [symlinkRewritePlugin(), react()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
