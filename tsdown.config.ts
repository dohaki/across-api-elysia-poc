import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/adapters/node.ts"],
  format: "esm",
  platform: "node",
  shims: true, // Enable CJS shims (__dirname, __filename, require, module, etc.)
  outDir: "dist",
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
      transform(code, id) {
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
});
