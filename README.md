# 🖍️ Colora

Disegni da colorare per bambini generati da un prompt: l'app crea un disegno
con **sole linee nere** e i bambini riempiono le aree toccandole, scegliendo il
colore da una palette. Un solo codice per **web, iOS e Android** (PWA +
Capacitor), con **login**, **quota gratuita di 2 disegni al giorno** e
**pagamenti Stripe predisposti** per lo sblocco Premium.

## Architettura

| Livello | Scelta | Note |
| --- | --- | --- |
| Frontend + API | **Next.js 15** (App Router, TypeScript, Tailwind 4) | Un solo deployment serve web, PWA e app native |
| Mobile | **PWA** installabile + **Capacitor** | Il wrapper nativo carica l'app pubblicata (`CAP_SERVER_URL`) |
| Auth + DB | **Supabase** (Postgres + RLS) | Profili, disegni, eventi di generazione |
| Generazione | **Provider intercambiabili** (`src/lib/generation/`) | `claude-svg` attivo; `raster` pronto da implementare |
| Pagamenti | **Stripe** (predisposto) | Endpoint attivi solo quando le chiavi sono configurate |

### Come funziona la generazione

Il provider di default (`claude-svg`) chiede all'API Claude un **SVG
vettoriale**: contorni neri spessi e ogni area chiusa con `fill="#FFFFFF"`.
Il client indicizza le forme colorabili e al tocco applica il colore alla
regione — riempimento sempre perfetto, nessun algoritmo di flood fill
necessario, linee nitide a ogni zoom. L'SVG viene **sanificato lato server**
prima di essere salvato e servito.

L'interfaccia `GenerationProvider` (`src/lib/generation/types.ts`) permette di
aggiungere un provider di immagini raster (Gemini, DALL·E, ...) implementando
`src/lib/generation/raster.ts` e impostando `GENERATION_PROVIDER=raster`: la
UI di coloritura ha già il **flood fill su canvas** per le immagini raster.

### Quote e piani

- Ogni generazione registra un evento in `public.generations` (scritto solo
  dal server con service role): è la fonte di verità della quota.
- Piano `free`: `FREE_DAILY_LIMIT` (default **2**) disegni al giorno, reset a
  mezzanotte UTC. Piano `premium`: `PREMIUM_DAILY_LIMIT` (default 50, come
  protezione anti-abuso).
- Il piano dell'utente vive in `public.profiles.plan` e può essere modificato
  **solo dal server** (un trigger blocca l'auto-promozione via RLS).
- Il webhook Stripe aggiorna il piano su `checkout.session.completed`,
  `customer.subscription.updated` e `customer.subscription.deleted`.

## 🚀 Avvio rapido (PoC)

Senza alcuna configurazione (`npm install && npm run dev`) l'app parte in
modalità demo con **4 disegni di esempio precaricati**: la coloritura si
prova subito, senza nessuna chiave.

Per generare disegni nuovi da un prompt serve solo una API key Anthropic —
niente Supabase, niente Stripe:

```bash
npm install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
npm run dev
```

Apri http://localhost:3000: l'app parte in **modalità demo** (nessun login,
disegni salvati sul dispositivo, limite `DEMO_DAILY_LIMIT` per IP, default
10/giorno). La stessa codebase è già quella di arrivo: quando configurerai le
variabili Supabase, login/quota/persistenza si attivano da soli, e con le
chiavi Stripe anche il Premium. Nessuna migrazione di codice tra PoC e
prodotto.

## Setup completo (login, quote, Premium)

### 1. Dipendenze

```bash
npm install
```

### 2. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Esegui la migrazione `supabase/migrations/0001_init.sql` (SQL Editor del
   dashboard, oppure `supabase db push` con la CLI).
3. In **Authentication → Providers** abilita Email (ed eventualmente
   Google/Apple: il callback è già pronto su `/auth/callback`).

### 3. Variabili d'ambiente

```bash
cp .env.example .env.local
```

Compila almeno le variabili Supabase e `ANTHROPIC_API_KEY`
([console.anthropic.com](https://console.anthropic.com)). Stripe è opzionale:
senza chiavi il pulsante "Passa a Premium" mostra che i pagamenti non sono
attivi.

### 4. Avvio

```bash
npm run dev        # sviluppo su http://localhost:3000
npm run build      # build di produzione
npm run typecheck  # controllo TypeScript
```

## Stripe (quando vorrai attivare i pagamenti)

1. Crea un prodotto con prezzo ricorrente e copia il `price_...` in
   `STRIPE_PRICE_ID`.
2. Imposta `STRIPE_SECRET_KEY` e crea un webhook verso
   `https://tuodominio/api/billing/webhook` con gli eventi
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`; copia il segreto in
   `STRIPE_WEBHOOK_SECRET`.
3. Fine: il pulsante Premium apre Stripe Checkout e il webhook aggiorna il
   piano. Per la distribuzione negli store andranno aggiunti gli acquisti
   in-app (Apple/Google richiedono IAP per i contenuti digitali): la logica a
   piani in `profiles.plan` resta la stessa.

## iOS e Android (Capacitor)

L'app è una PWA installabile dal browser ("Aggiungi a schermata Home"). Per
pubblicare negli store, il wrapper Capacitor carica l'app pubblicata:

```bash
npm install @capacitor/core @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
CAP_SERVER_URL=https://tuodominio npx cap sync
npm run cap:ios      # apre Xcode
npm run cap:android  # apre Android Studio
```

Per gli store servono anche icone PNG native (i sorgenti SVG sono in
`public/icons/`).

## Struttura del progetto

```
src/
  app/
    page.tsx                 # home: prompt + quota + galleria
    login/page.tsx           # accesso / registrazione
    color/[id]/page.tsx      # pagina di coloritura
    auth/                    # callback conferma email/OAuth, signout
    api/
      generate/route.ts      # genera disegno (controllo quota server-side)
      quota/route.ts         # stato quota
      drawings/[id]/route.ts # salvataggio colori / cancellazione
      billing/               # Stripe checkout + webhook
  components/
    coloring/                # workspace, palette, SVG tap-to-fill, flood fill
  lib/
    generation/              # astrazione provider + claude-svg + sanificazione
    supabase/                # client browser/server/admin
    quota.ts                 # calcolo quota giornaliera
    stripe.ts                # init Stripe (opzionale)
  middleware.ts              # refresh sessione + protezione rotte
supabase/migrations/         # schema Postgres + RLS
capacitor.config.ts          # wrapper nativo iOS/Android
public/                      # manifest PWA, service worker, icone
```

## Sicurezza

- **RLS ovunque**: ogni utente vede solo i propri dati; disegni e generazioni
  vengono creati solo dal server.
- **SVG sanificato** lato server (niente script, event handler, riferimenti
  esterni) prima del salvataggio e del rendering inline.
- **Chiavi solo server**: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e
  `STRIPE_SECRET_KEY` non raggiungono mai il client.
- Header di sicurezza HTTP in `next.config.ts`; webhook Stripe verificato con
  firma.
