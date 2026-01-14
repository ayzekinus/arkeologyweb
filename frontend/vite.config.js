import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  /**
   * Build-time constants.
   * Some code paths reference keys as bare identifiers (e.g. SERAMIK, GENEL),
   * which causes `ReferenceError: <NAME> is not defined` at runtime.
   * Vite's `define` replaces these identifiers at build time.
   */
  define: {
    // Form keys
    SIKKE: JSON.stringify("SIKKE"),
    SERAMIK: JSON.stringify("SERAMIK"),
    MEZAR: JSON.stringify("MEZAR"),
    FIGURIN: JSON.stringify("FIGURIN"),
    TERRACOTTA: JSON.stringify("TERRACOTTA"),
    CAM_METAL: JSON.stringify("CAM_METAL"),

    // Material group keys (used in mapping logic)
    GENEL: JSON.stringify("GENEL"),
  },

  server: {
    host: true,
  },
});
