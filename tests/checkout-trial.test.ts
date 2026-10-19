import { it, expect } from "vitest";
import { createExecutionContext } from "cloudflare:test";
import worker from "../worker/index";
import { authorizeCheckoutTrial, checkoutTrialSession } from "../worker/security";
import { acceptOrder, createQuote } from "../worker/orders";
import { customer, seed, testEnv } from "./helpers";

const code = "synthetic-trial-code-with-at-least-32-characters";
it("issues a short-lived private cookie, rejects missing/forged/expired sessions", async () => {
  const env = { ...testEnv(), CHECKOUT_TRIAL_ENABLED: "true", CHECKOUT_TRIAL_SECRET: code };
  const request = new Request("https://almira.test/api/checkout/trial");
  await expect(authorizeCheckoutTrial(request, env, "wrong")).rejects.toMatchObject({code:"trial_access_denied"});
  const response = await authorizeCheckoutTrial(request, env, code);
  const cookie = response.headers.get("Set-Cookie")!;
  expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict"); expect(cookie).not.toContain(code);
  expect(await checkoutTrialSession(new Request(request,{headers:{Cookie:cookie.split(";")[0]}}),env)).toBe(true);
  expect(await checkoutTrialSession(request,env)).toBe(false);
  expect(await checkoutTrialSession(new Request(request,{headers:{Cookie:"__Host-almira-trial=9999999999999.forged"}}),env)).toBe(false);
  expect(await checkoutTrialSession(new Request(request,{headers:{Cookie:cookie.split(";")[0]}}),env,Date.now()+3600001)).toBe(false);
});
it("does not grant anonymous or header-forged trial clients quote access", async () => {
  const env = { ...testEnv(), CHECKOUT_ENABLED:"false", CHECKOUT_TRIAL_ENABLED:"true", CHECKOUT_TRIAL_SECRET:code };
  const input = await seed(env);
  const req = new Request("https://almira.test/api/quote",{method:"POST",headers:{Origin:"https://almira.test","Content-Type":"application/json","X-Trial-Access":"true"},body:JSON.stringify(input)});
  expect((await worker.fetch(req,env,createExecutionContext())).status).toBe(503);
});
it("allows a signed trial session to quote while keeping public checkout disabled", async () => {
  const env = { ...testEnv(), CHECKOUT_ENABLED:"false", CHECKOUT_TRIAL_ENABLED:"true", CHECKOUT_TRIAL_SECRET:code };
  const input = await seed(env);
  const auth = await authorizeCheckoutTrial(new Request("https://almira.test/api/checkout/trial"),env,code);
  const cookie = auth.headers.get("Set-Cookie")!.split(";")[0];
  const request = new Request("https://almira.test/api/quote",{method:"POST",headers:{Cookie:cookie,Origin:"https://almira.test","Content-Type":"application/json"},body:JSON.stringify(input)});
  const response = await worker.fetch(request,env,createExecutionContext());
  expect(response.status).toBe(200);
  expect(await response.json()).toHaveProperty("quoteId");
});
it("atomically accepts only one distinct trial order and preserves replay", async () => {
  const env = { ...testEnv(), CHECKOUT_TRIAL_ENABLED:"true", CHECKOUT_TRIAL_SECRET:code };
  const quote = await createQuote(env,await seed(env));
  const payload = {quoteId:quote.quoteId,customer,paymentMethod:"bank"};
  const keys = Array.from({length:5},()=>crypto.randomUUID());
  const results = await Promise.allSettled(keys.map(key=>acceptOrder(env,payload,key)));
  expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
  expect(await env.DB.prepare("SELECT count(*) n FROM orders").first("n")).toBe(1);
  expect(await env.DB.prepare("SELECT count(*) n FROM outbox").first("n")).toBe(1);
  const index=results.findIndex(r=>r.status==="fulfilled");
  const saved=await acceptOrder(env,payload,keys[index]);
  expect(saved.websiteOrderId).toBe((results[index] as PromiseFulfilledResult<any>).value.websiteOrderId);
});
