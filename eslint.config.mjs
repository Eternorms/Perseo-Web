import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "next-env.d.ts"]),
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Mídia dos criativos vem de hosts arbitrários do pipeline; <img>/<video>
      // simples é intencional nesses pontos.
      "@next/next/no-img-element": "off",
      // _prev/_formData em assinaturas de server action
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
