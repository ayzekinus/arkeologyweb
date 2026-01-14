import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  /**
   * Build-time constants.
   * Some code paths reference form keys as bare identifiers (e.g. SERAMIK),
   * which causes `ReferenceError: SERAMIK is not defined` at runtime.
   * Vite's `define` replaces these identifiers at build time.
   */
  define: {
    SIKKE: JSON.stringify("SIKKE"),
    SERAMIK: JSON.stringify("SERAMIK"),
    MEZAR: JSON.stringify("MEZAR"),
    FIGURIN: JSON.stringify("FIGURIN"),
    TERRACOTTA: JSON.stringify("TERRACOTTA"),
    CAM_METAL: JSON.stringify("CAM_METAL"),
  },

  server: {
    host: true,
  },
});
