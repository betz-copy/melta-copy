// tsup.config.ts

import { resolve } from 'path';
import { defineConfig } from 'tsup';

var __injected_dirname__ = '/home/shay/Desktop/Melta/melta/packages/permission';
var tsup_config_default = defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: {
        resolve: true,
        entry: './src/index.ts',
    },
    outDir: 'dist',
    target: 'esnext',
    splitting: false,
    clean: true,
    shims: true,
    external: [/^@packages\//],
    esbuildOptions(options) {
        options.alias = {
            '@packages': resolve(__injected_dirname__, '..'),
        };
    },
});
export { tsup_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUvc2hheS9EZXNrdG9wL01lbHRhL21lbHRhL3BhY2thZ2VzL3Blcm1pc3Npb24vdHN1cC5jb25maWcudHNcIjtjb25zdCBfX2luamVjdGVkX2Rpcm5hbWVfXyA9IFwiL2hvbWUvc2hheS9EZXNrdG9wL01lbHRhL21lbHRhL3BhY2thZ2VzL3Blcm1pc3Npb25cIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvc2hheS9EZXNrdG9wL01lbHRhL21lbHRhL3BhY2thZ2VzL3Blcm1pc3Npb24vdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd0c3VwJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgZW50cnk6IFsnc3JjL2luZGV4LnRzJ10sXG4gIGZvcm1hdDogWydjanMnLCAnZXNtJ10sXG4gIGR0czoge1xuICAgIHJlc29sdmU6IHRydWUsXG4gICAgZW50cnk6ICcuL3NyYy9pbmRleC50cycsXG4gIH0sXG4gIG91dERpcjogJ2Rpc3QnLFxuICB0YXJnZXQ6ICdlc25leHQnLFxuICBzcGxpdHRpbmc6IGZhbHNlLFxuICBjbGVhbjogdHJ1ZSxcbiAgc2hpbXM6IHRydWUsXG4gIGV4dGVybmFsOiBbL15AcGFja2FnZXNcXC8vXSxcbiAgZXNidWlsZE9wdGlvbnMob3B0aW9ucykge1xuICAgIG9wdGlvbnMuYWxpYXMgPSB7XG4gICAgICAnQHBhY2thZ2VzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuLicpLFxuICAgIH07XG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1MsU0FBUyxvQkFBb0I7QUFDalUsU0FBUyxlQUFlO0FBRDBFLElBQU0sdUJBQXVCO0FBRy9ILElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU8sQ0FBQyxjQUFjO0FBQUEsRUFDdEIsUUFBUSxDQUFDLE9BQU8sS0FBSztBQUFBLEVBQ3JCLEtBQUs7QUFBQSxJQUNILFNBQVM7QUFBQSxJQUNULE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixXQUFXO0FBQUEsRUFDWCxPQUFPO0FBQUEsRUFDUCxPQUFPO0FBQUEsRUFDUCxVQUFVLENBQUMsY0FBYztBQUFBLEVBQ3pCLGVBQWUsU0FBUztBQUN0QixZQUFRLFFBQVE7QUFBQSxNQUNkLGFBQWEsUUFBUSxzQkFBVyxJQUFJO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
