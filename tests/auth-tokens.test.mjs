// Verifica dei token Cognito: quelli buoni passano, tutti gli altri no.
// Le chiavi pubbliche (JWKS) di Cognito sono servite da un finto fetch.
import assert from "node:assert/strict";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

process.env.COGNITO_USER_POOL_ID = "eu-west-1_TESTPOOL";
process.env.COGNITO_CLIENT_ID = "client-di-prova";
const ISS = "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_TESTPOOL";

const { publicKey, privateKey } = await generateKeyPair("RS256");
const other = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url) === `${ISS}/.well-known/jwks.json`) {
    return new Response(JSON.stringify({ keys: [jwk] }), {
      headers: { "content-type": "application/json" },
    });
  }
  return realFetch(url, init);
};

const { verifyIdToken } = await import("../src/lib/auth/tokens.ts");

const make = ({ key = privateKey, iss = ISS, aud = "client-di-prova", use = "id", exp = "1h", sub = "uuid-1", email = "a@b.it" } = {}) =>
  new SignJWT({ token_use: use, email })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setSubject(sub).setIssuer(iss).setAudience(aud)
    .setIssuedAt().setExpirationTime(exp)
    .sign(key);

assert.deepEqual(await verifyIdToken(await make()), { id: "uuid-1", email: "a@b.it" });
assert.equal(await verifyIdToken(await make({ key: other.privateKey })), null, "firma di un altro");
assert.equal(await verifyIdToken(await make({ iss: "https://evil.example/pool" })), null, "emittente sbagliato");
assert.equal(await verifyIdToken(await make({ aud: "altra-app" })), null, "destinatario sbagliato");
assert.equal(await verifyIdToken(await make({ use: "access" })), null, "access token al posto dell'id token");
assert.equal(await verifyIdToken(await make({ exp: Math.floor(Date.now() / 1000) - 10 })), null, "scaduto");
assert.equal(await verifyIdToken("non.un.token"), null);
assert.equal(await verifyIdToken(""), null);

console.log("✓ token Cognito: 8 controlli");
