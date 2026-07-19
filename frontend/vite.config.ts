import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Or your current react plugin import
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
