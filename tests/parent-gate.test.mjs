// Verifica del cancello parentale: PIN, sfida di matematica e
// resistenza alla contraffazione del cookie di sblocco.
// Esecuzione: npm test
import { createHmac } from "crypto";
process.env.PARENT_GATE_SECRET = "segreto-di-prova";

const m = await import("../src/lib/parent-gate-tokens.ts");
let failures = 0;
const ok = (n, c) => {
  if (!c) failures += 1;
  console.log(`${c ? "✓" : "✗ FALLITO"}  ${n}`);
};
process.on("exit", () => {
  if (failures > 0) {
    console.error(`\n${failures} controlli falliti`);
    process.exitCode = 1;
  } else {
    console.log("\nTutti i controlli superati");
  }
});

// PIN
const h = m.hashPin("4821");
ok("PIN corretto accettato", m.verifyPin("4821", h));
ok("PIN sbagliato rifiutato", !m.verifyPin("1111", h));
ok("PIN senza hash rifiutato", !m.verifyPin("4821", null));
ok("hash non contiene il PIN in chiaro", !h.includes("4821"));

// Sfida matematica
const c = m.createMathChallenge();
ok("risposta giusta accettata", m.verifyMathChallenge(c.a * c.b, c.token));
ok("risposta sbagliata rifiutata", !m.verifyMathChallenge(c.a * c.b + 1, c.token));
ok("token manomesso rifiutato", !m.verifyMathChallenge(c.a * c.b, c.token.replace(/.$/, "0")));
ok("la risposta non e' nel token", !c.token.includes(String(c.a * c.b)));

// Token di sblocco: la firma deve reggere alla contraffazione
const USER = "utente-123";
const t = m.createUnlockToken(USER);
const sign = (p) => createHmac("sha256", process.env.PARENT_GATE_SECRET).update(p).digest("hex");
const check = (token, userId) => m.isTokenValid(token, userId);
ok("token valido riconosciuto", check(t.value, USER));
ok("cookie inventato dal browser rifiutato", !check(`${Date.now() + 999999}.abc123`, USER));
ok("token di un altro utente rifiutato", !check(t.value, "altro-utente"));
ok("token scaduto rifiutato", !check(`${Date.now() - 1000}.${sign(`${USER}.${Date.now() - 1000}`)}`, USER));
ok("firma con segreto diverso rifiutata", !check(`${Date.now() + 60000}.${createHmac("sha256", "altro-segreto").update(`${USER}.${Date.now() + 60000}`).digest("hex")}`, USER));
