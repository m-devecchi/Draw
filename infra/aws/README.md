# Infrastruttura AWS di Colora

Cosa crea questa cartella, con la AWS CLI:

| Risorsa | Costo indicativo |
| --- | --- |
| **Aurora PostgreSQL Serverless v2** con pausa automatica (0 ACU) | storage ~0,10 $/GB-mese + calcolo solo mentre è sveglio (~0,06 $/ora a 0,5 ACU) |
| **Data API** di Aurora | 0,35 $ ogni milione di richieste (a questa scala: centesimi) |
| **Secrets Manager** (password del DB, gestita da Aurora) | ~0,40 $/mese |
| **Cognito** (login) | gratis fino a 10.000 utenti attivi al mese |
| **IAM**, **Budgets** (avviso a 60% e previsione 100%) | gratis |
| **Amplify Hosting** (già attivo) | come ora |

Stima totale a poco traffico: **2-5 €/mese**, quasi tutto calcolo di Aurora e
dipende da quante ore al giorno il DB resta sveglio. I prezzi cambiano:
controlla [aws.amazon.com/rds/aurora/pricing](https://aws.amazon.com/rds/aurora/pricing/).
Il budget da 5 $ ti avvisa via email se ti avvicini al tetto.

> **Pausa automatica**: dopo `AURORA_PAUSE_SECONDS` (default 5 minuti) senza
> richieste il database si ferma. La prima richiesta dopo la pausa aspetta
> circa 15 secondi: l'app riprova da sola finché non si è svegliato
> (`src/lib/db/client.ts`). Per un'app usata a ore sparse è il compromesso
> giusto; se un giorno servisse sempre pronto, imposta `MinCapacity=0.5`
> (costo fisso ~40 $/mese).

## Prima di cominciare

- AWS CLI v2 configurata (`aws configure`) con un utente che può creare RDS,
  Cognito, IAM, Secrets Manager e Budgets.
- Node 22+ (serve a `02-schema.sh`) e `npm install` già fatto nella root.
- `cp infra/aws/config.env.example infra/aws/config.env` e compila: regione
  (la stessa di Amplify), `APP_URL`, un prefisso unico per il dominio Cognito,
  la tua email per il budget.

## Passi

```bash
cd infra/aws
./01-aurora.sh        # cluster + istanza + Data API (~10 minuti, quasi tutta attesa)
./02-schema.sh        # crea le tabelle da db/schema.sql (sveglia il DB: ~30 s)
./03-cognito.sh       # user pool, app client, dominio di accesso (+ Google/Apple se configurati)
./04-iam-budget.sh    # ruolo per Amplify, budget, elenco variabili d'ambiente
```

Tutti gli script si possono rilanciare: saltano ciò che esiste già. I valori
prodotti (ARN, id) finiscono in `infra/aws/.out/` (ignorata da git).

## Configurare Amplify

1. **Variabili d'ambiente** (Amplify → App settings → Environment variables):
   incolla il contenuto di `.out/amplify-env.txt`, più `ANTHROPIC_API_KEY` e
   le altre di `.env.example` che usi (Stripe, limiti).
2. **Compute role** (App settings → IAM roles): scegli
   `<APP_NAME>-amplify-compute`. È il ruolo che permette all'app di parlare
   con Aurora e di creare/eliminare utenti Cognito: nessuna chiave AWS nelle
   variabili.
3. **Variabili al server a runtime**: Amplify rende le variabili disponibili
   solo in fase di build; per il server (e il middleware) vanno scritte in
   `.env.production`. Nelle impostazioni di build (o in un `amplify.yml` alla
   radice) la fase `build` diventa:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - env | grep -E '^(COGNITO_|DB_|PARENT_GATE_SECRET|ANTHROPIC_API_KEY|GENERATION_|STRIPE_|FREE_DAILY_LIMIT|PREMIUM_DAILY_LIMIT|CACHE_HITS_FREE|NEXT_PUBLIC_)' >> .env.production
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

   Se hai già un `amplify.yml`, aggiungi solo la riga `env | grep ...`.
4. **Rifai il deploy.** Con `COGNITO_*` e `DB_*` presenti l'app esce dalla
   modalità demo e mostra il login.

## Login con Google / Apple

Compila `GOOGLE_*` (e/o `APPLE_*`) in `config.env` e rilancia
`./03-cognito.sh`. Nel pannello di Google/Apple aggiungi come URI di
reindirizzamento quello che lo script stampa
(`https://<dominio>.auth.<regione>.amazoncognito.com/oauth2/idpresponse`).

## Cose da sapere

- **Email di Cognito**: di serie Cognito manda al massimo ~50 email al giorno
  (codici di recupero password e cambio email). Per volumi veri collega
  Amazon SES allo user pool.
- **Recupero password e cambio email** funzionano con un **codice a cifre**
  ricevuto per email (non più un link): pagina `/login/reset`.
- **Account Google e account con password** con la stessa email sono, per
  Cognito, due utenti distinti (e quindi due profili). Unirli richiede una
  Lambda di *account linking*: non inclusa.
- **Sicurezza del database**: il cluster non è raggiungibile da Internet (il
  security group non ha regole in ingresso) e si usa solo via Data API con
  IAM. L'app usa le credenziali dell'utente amministratore del cluster
  (gestite da Secrets Manager); per un ambiente più rigido si può creare un
  utente SQL con soli permessi sulle tabelle dell'app.
- **Backup**: 1 giorno di retention (il minimo, incluso nel prezzo). Aumenta
  con `aws rds modify-db-cluster --backup-retention-period 7 ...`.
- **Cancellare tutto**: `deletion-protection` è attiva su cluster e user pool;
  va disattivata a mano prima di poterli eliminare.

## Provare in locale senza AWS

```bash
createdb colora && psql colora -f db/schema.sql
DATABASE_URL=postgres://localhost/colora npm run dev
```

Il livello dati si prova anche con i test: `createdb colora_test`, applica
`db/schema.sql` e lancia
`TEST_DATABASE_URL=postgres://localhost/colora_test npm test`.
