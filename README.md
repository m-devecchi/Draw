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
2. Esegui **in ordine** le migrazioni in `supabase/migrations/`
   (`0001_init.sql`, poi `0002_kids.sql` per i profili bambino) nel SQL
   Editor del dashboard, oppure `supabase db push` con la CLI.
3. In **Authentication → Providers** abilita Email (ed eventualmente
   Google/Apple: il callback è già pronto su `/auth/callback`).

#### Login con Google / Apple

I pulsanti nella pagina di login funzionano appena abiliti i provider su
Supabase (**Authentication → Providers**):

- **Google**: crea le credenziali OAuth su
  [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
  (tipo "Web application"), aggiungi come redirect URI quello mostrato da
  Supabase (`https://<ref>.supabase.co/auth/v1/callback`) e incolla Client ID
  e Secret su Supabase.
- **Apple**: richiede l'account Apple Developer (99 $/anno); su Supabase
  trovi la guida per Service ID, chiave e team. Nota per gli store: se
  pubblichi l'app su App Store con altri login social, "Sign in with Apple"
  è obbligatorio (linee guida Apple 4.8).

Finché un provider non è configurato, il pulsante mostra un messaggio di
non disponibilità: nessun errore, nessuna configurazione richiesta.

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

## ☁️ Deploy su Vercel + Supabase (produzione)

### 1. Supabase (≈5 minuti)

1. Vai su [supabase.com](https://supabase.com) → **New project** (regione:
   `eu-central-1` Francoforte, la più vicina all'Italia).
2. Quando il progetto è pronto: **SQL Editor** → incolla tutto il contenuto di
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) →
   **Run**.
3. **Project Settings → API**: copia `Project URL`, `anon public` e
   `service_role` (serviranno su Vercel).

### 2. Vercel (≈5 minuti)

1. Vai su [vercel.com/new](https://vercel.com/new) → **Import Git
   Repository** → seleziona `m-devecchi/Draw` (autorizza GitHub se
   richiesto). Framework: Next.js, rilevato automaticamente — non toccare
   nulla.
2. In **Environment Variables** aggiungi:

   | Nome | Valore |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | la tua key da [console.anthropic.com](https://console.anthropic.com) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `Project URL` di Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chiave `anon public` |
   | `SUPABASE_SERVICE_ROLE_KEY` | chiave `service_role` |
   | `NEXT_PUBLIC_APP_URL` | l'URL di produzione, es. `https://colora.vercel.app` (puoi aggiungerlo dopo il primo deploy) |

3. **Deploy**. Con le variabili Supabase presenti l'app parte direttamente in
   modalità completa (login + quota 2/giorno); senza, parte in modalità demo.

### 3. Collega l'auth di Supabase all'URL di produzione

In Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://<il-tuo-progetto>.vercel.app`
- **Redirect URLs**: aggiungi `https://<il-tuo-progetto>.vercel.app/auth/callback`

Senza questo passaggio i link di conferma email puntano a `localhost`.

### Aggiornamenti

Ogni `git push` sul branch di default fa partire un nuovo deploy automatico.

## 🎉 Esperienza di coloritura

- **Nove effetti di riempimento**: tinta piatta 🎨, sfumatura 🌈, pois ✨,
  righe 🦓, cuori 💗, stelline ⭐, quadretti 🏁, bollicine 🫧 e coriandoli 🎊,
  scelti da un cassetto sopra la palette. Il colore resta salvato come
  esadecimale e l'effetto è un suffisso (`#ff5c5c:gradient`), così i
  disegni colorati prima continuano a funzionare.
- **Mano libera** ✏️: si disegna col dito sopra il disegno; i tratti sono
  salvati come percorsi SVG nelle coordinate del disegno, quindi restano
  al loro posto a ogni zoom e su ogni schermo. Annulla torna indietro di
  un gesto qualunque esso sia, colore o tratto.
- **Versioni per età**, scelte **a ogni creazione** insieme al prompt
  («Chi colora questo disegno?»): **2-3 anni** otto colori grandi e nessun
  effetto; **4-6 anni** palette completa, sei effetti e mano libera;
  **7+** tutto. L'età viene salvata **col disegno**, così riaprendolo si
  ritrovano gli strumenti giusti anche se sullo stesso telefono disegnano
  più fratelli. L'ultima scelta resta preselezionata per comodità.
- **Idee illustrate** in home: dodici pulsanti con disegno e parola, per
  chi non sa ancora leggere; la quota del giorno è mostrata a matite.

- **Zoom a due dita** e trascinamento per i dettagli piccoli, con doppio
  tocco (o il pulsante 🔍) per tornare alla vista intera. Un tocco fermo
  colora, una trascinata sposta soltanto: le due cose non si confondono.
- **Suoni** generati al volo con la Web Audio API — nessun file audio da
  scaricare. Ogni area colorata suona una nota di una scala pentatonica
  (allegra in qualsiasi ordine), la gomma una nota più bassa, il disegno
  completo un arpeggio. Si silenziano col pulsante 🔊 (scelta ricordata).
  Su iPhone l'audio viene messo in categoria `playback`
  (`navigator.audioSession`), altrimenti **il tasto silenzioso laterale
  zittirebbe l'app** pur funzionando tutto.
- **Coriandoli** quando tutte le aree sono colorate, una volta sola per
  disegno completato.

## 🔒 Area genitori (parental control)

L'app è pensata perché finisca in mano al bambino: disegnare e colorare
sono libere, tutto il resto è protetto.

Dietro il **cancello parentale** stanno impostazioni account, cambio email e
password, pagamenti ed eliminazione dell'account. Per entrare:

- se il genitore ha impostato un **PIN** (4-8 cifre), serve quello;
- altrimenti si risponde a una **moltiplicazione** — il ripiego standard
  richiesto dagli store, che un bambino piccolo non supera.

Lo sblocco dura 15 minuti e vive in un cookie `httpOnly` **firmato dal
server**: un cookie inventato dal browser non supera la verifica della
firma. Il PIN è salvato solo come hash scrypt, modificabile unicamente dal
server (un trigger sul database blocca la scrittura dal client), e dopo 5
tentativi sbagliati si aspetta 5 minuti.

Il PIN si imposta in **Area genitori → PIN genitore**. Il segreto di firma
si configura con `PARENT_GATE_SECRET` (senza, si usa la service role key).

Verifica: `npm test`

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
