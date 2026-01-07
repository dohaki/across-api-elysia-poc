/**
 * PoC Validation Script
 * Validates all Phase 0 compatibility requirements
 */

interface ValidationResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

async function validate() {
  console.log("🧪 Running Phase 0 Validation Tests\n");
  console.log("=" .repeat(60));

  // 1. Check SDK import
  try {
    const { constants, utils } = await import("@across-protocol/sdk");
    results.push({
      name: "SDK Import",
      status: "PASS",
      message: "@across-protocol/sdk imports successfully",
      details: {
        constantsAvailable: typeof constants !== "undefined",
        utilsAvailable: typeof utils !== "undefined",
      },
    });
  } catch (error) {
    results.push({
      name: "SDK Import",
      status: "FAIL",
      message: `Failed to import @across-protocol/sdk: ${error}`,
    });
  }

  // 2. Check contracts import
  try {
    const contracts = await import("@across-protocol/contracts");
    results.push({
      name: "Contracts Import",
      status: "PASS",
      message: "@across-protocol/contracts imports successfully",
    });
  } catch (error) {
    results.push({
      name: "Contracts Import",
      status: "FAIL",
      message: `Failed to import @across-protocol/contracts: ${error}`,
    });
  }

  // 3. Check ElysiaJS
  try {
    const { Elysia } = await import("elysia");
    const app = new Elysia();
    results.push({
      name: "ElysiaJS",
      status: "PASS",
      message: "ElysiaJS instantiates successfully",
    });
  } catch (error) {
    results.push({
      name: "ElysiaJS",
      status: "FAIL",
      message: `Failed to create ElysiaJS app: ${error}`,
    });
  }

  // 4. Check Cache Provider
  try {
    const { MemoryCacheProvider } = await import("../src/shared/cache/memory");
    const cache = new MemoryCacheProvider();
    await cache.set("test", "value", 10);
    const value = await cache.get("test");
    results.push({
      name: "Cache Provider",
      status: value === "value" ? "PASS" : "FAIL",
      message: value === "value"
        ? "Cache provider works correctly"
        : "Cache provider returned unexpected value",
    });
  } catch (error) {
    results.push({
      name: "Cache Provider",
      status: "FAIL",
      message: `Cache provider error: ${error}`,
    });
  }

  // 5. Check OpenTelemetry
  try {
    const { trace } = await import("@opentelemetry/api");
    const tracer = trace.getTracer("test");
    results.push({
      name: "OpenTelemetry",
      status: "PASS",
      message: "OpenTelemetry API available",
    });
  } catch (error) {
    results.push({
      name: "OpenTelemetry",
      status: "FAIL",
      message: `OpenTelemetry error: ${error}`,
    });
  }

  // 6. Check TypeBox
  try {
    const { t } = await import("elysia");
    const schema = t.Object({
      test: t.String(),
    });
    results.push({
      name: "TypeBox Validation",
      status: "PASS",
      message: "TypeBox schema creation works",
    });
  } catch (error) {
    results.push({
      name: "TypeBox Validation",
      status: "FAIL",
      message: `TypeBox error: ${error}`,
    });
  }

  // 7. Check Swagger Plugin
  try {
    const { swagger } = await import("@elysiajs/swagger");
    results.push({
      name: "Swagger Plugin",
      status: "PASS",
      message: "@elysiajs/swagger available",
    });
  } catch (error) {
    results.push({
      name: "Swagger Plugin",
      status: "FAIL",
      message: `Swagger plugin error: ${error}`,
    });
  }

  // 8. Check Eden Client
  try {
    const { treaty } = await import("@elysiajs/eden");
    results.push({
      name: "Eden Client",
      status: "PASS",
      message: "Eden treaty client available",
    });
  } catch (error) {
    results.push({
      name: "Eden Client",
      status: "FAIL",
      message: `Eden client error: ${error}`,
    });
  }

  // 9. Check Cron Plugin
  try {
    const { cron } = await import("@elysiajs/cron");
    results.push({
      name: "Cron Plugin",
      status: "PASS",
      message: "@elysiajs/cron available",
    });
  } catch (error) {
    results.push({
      name: "Cron Plugin",
      status: "FAIL",
      message: `Cron plugin error: ${error}`,
    });
  }

  // 10. Check Upstash Redis
  try {
    const { Redis } = await import("@upstash/redis");
    results.push({
      name: "Upstash Redis",
      status: "PASS",
      message: "@upstash/redis available",
    });
  } catch (error) {
    results.push({
      name: "Upstash Redis",
      status: "FAIL",
      message: `Upstash Redis error: ${error}`,
    });
  }

  // Print results
  console.log("\n📋 Validation Results:\n");

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach((result) => {
    const icon =
      result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️";
    console.log(`${icon} ${result.name}: ${result.message}`);

    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }

    if (result.status === "PASS") passCount++;
    else if (result.status === "FAIL") failCount++;
    else warnCount++;
  });

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings\n`);

  if (failCount === 0) {
    console.log("🎉 All validations passed! ElysiaJS is ready for migration.\n");
    process.exit(0);
  } else {
    console.log("❌ Some validations failed. Review the errors above.\n");
    process.exit(1);
  }
}

validate().catch((error) => {
  console.error("Validation script error:", error);
  process.exit(1);
});
