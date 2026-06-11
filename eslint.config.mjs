import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";

const eslintConfig = defineConfig([
  nextPlugin.configs["core-web-vitals"],
  globalIgnores([".next/**", "node_modules/**", "coverage/**"]),
  {
    rules: {
      // Mídia dos criativos vem de hosts arbitrários do pipeline; <img>/<video>
      // simples é intencional nesses pontos.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
