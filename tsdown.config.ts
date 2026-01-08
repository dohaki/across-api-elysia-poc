import { defineConfig } from "tsdown";

// Shared configuration
const sharedConfig = {
  format: "esm" as const,
  platform: "node" as const,
  shims: true, // Enable CJS shims (__dirname, __filename, require, module, etc.)
  noExternal: [
    // Bundle these packages to avoid ESM resolution issues
    /^@across-protocol\/sdk/,
    /^@across-protocol\/contracts/,
    /^ethers/,
    /^@ethersproject\//,
    /^@eth-optimism\//,
  ],
  plugins: [
    {
      name: "fix-cjs-module-check",
      transform(code: string) {
        // Replace CJS module detection pattern that doesn't work in ESM
        // The pattern `require.main === module` should always be false in ESM bundle
        if (code.includes("require.main === module")) {
          return {
            code: code.replace(/require\.main === module/g, "false"),
            map: null,
          };
        }
        return null;
      },
    },
  ],
};

export default defineConfig([
  // Vercel serverless build - single file with all deps inlined
  {
    ...sharedConfig,
    entry: ["./src/index.ts"],
    outDir: "dist-vercel",
    // Inline everything for Vercel serverless
    outputOptions: {
      inlineDynamicImports: true,
    },
  },
  // Node.js standalone server build
  {
    ...sharedConfig,
    entry: ["./src/adapters/node.ts"],
    outDir: "dist-node",
  },
]);
