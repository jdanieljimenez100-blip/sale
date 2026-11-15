import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test";
process.env.DEMO_ACCESS_TOKEN = "token-de-prueba";
process.env.PEY_MODE = "mock";

const { normalizarNumRef } = await import("../lib/pey/num-ref");
const { createMockPeyClient } = await import("../lib/pey/mock");

void test("numRef deja solo dígitos (máx. 7), como exige pey", () => {
  assert.equal(normalizarNumRef("Mesa 12"), "12");
  assert.equal(normalizarNumRef("123456789"), "3456789");
  assert.equal(normalizarNumRef("a3f9-c01b"), "3901");
  assert.equal(normalizarNumRef("Terraza"), undefined);
  assert.equal(normalizarNumRef(undefined), undefined);
});

function webhookMock(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/webhooks/pey", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({
      amount: 0.01,
      apiKeyId: "mock",
      codiQrId: "mock_qr",
      concept: "Mesa 1",
      datePaid: 1_790_724_818,
      transactionId: "mock_tx",
      type: "codi.qr.payment_received",
    }),
  });
}

void test("webhook mock sin token de demo se rechaza", async () => {
  const pey = createMockPeyClient();
  await assert.rejects(pey.verificarWebhook(webhookMock({})));
  await assert.rejects(
    pey.verificarWebhook(webhookMock({ "x-demo-token": "otro" })),
  );
});

void test("webhook mock con token de demo se acepta", async () => {
  const pey = createMockPeyClient();
  const result = await pey.verificarWebhook(
    webhookMock({ "x-demo-token": "token-de-prueba" }),
  );
  assert.equal(result.payload.codiQrId, "mock_qr");
});
