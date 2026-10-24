#!/usr/bin/env bash
# 1) Ruolo IAM per Amplify ("compute role"): l'unico modo in cui l'app
#    ottiene il permesso di parlare con Aurora e Cognito. Niente chiavi AWS
#    da copiare nelle variabili d'ambiente.
# 2) Riepilogo delle variabili d'ambiente da mettere su Amplify.
source "$(dirname "$0")/lib.sh"
load
: "${DB_CLUSTER_ARN:?esegui prima 01-aurora.sh}"
: "${COGNITO_USER_POOL_ARN:?esegui prima 03-cognito.sh}"

ROLE="${APP_NAME}-amplify-compute"
POLICY="${APP_NAME}-app-access"

say "Policy $POLICY"
cat > "$OUT/policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DatabaseDataApi",
      "Effect": "Allow",
      "Action": ["rds-data:ExecuteStatement", "rds-data:BatchExecuteStatement"],
      "Resource": "${DB_CLUSTER_ARN}"
    },
    {
      "Sid": "DatabaseSecret",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "${DB_SECRET_ARN}"
    },
    {
      "Sid": "CognitoAdmin",
      "Effect": "Allow",
      "Action": ["cognito-idp:AdminCreateUser", "cognito-idp:AdminSetUserPassword", "cognito-idp:AdminDeleteUser"],
      "Resource": "${COGNITO_USER_POOL_ARN}"
    }
  ]
}
JSON
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY}"
if aws iam get-policy --policy-arn "$POLICY_ARN" >/dev/null 2>&1; then
  # Nuova versione della policy (max 5 versioni: si elimina la piu' vecchia non predefinita).
  OLD="$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" \
    --query 'Versions[?IsDefaultVersion==`false`]|[-1].VersionId' --output text)"
  [[ "$OLD" != "None" ]] && aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$OLD" || true
  aws iam create-policy-version --policy-arn "$POLICY_ARN" \
    --policy-document "file://$OUT/policy.json" --set-as-default >/dev/null
else
  aws iam create-policy --policy-name "$POLICY" \
    --policy-document "file://$OUT/policy.json" >/dev/null
fi

say "Ruolo $ROLE (fidato da Amplify)"
cat > "$OUT/trust.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "amplify.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
JSON
aws iam get-role --role-name "$ROLE" >/dev/null 2>&1 \
  || aws iam create-role --role-name "$ROLE" \
       --assume-role-policy-document "file://$OUT/trust.json" >/dev/null
aws iam attach-role-policy --role-name "$ROLE" --policy-arn "$POLICY_ARN"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE}"
save AMPLIFY_COMPUTE_ROLE_ARN "$ROLE_ARN"

say "Variabili d'ambiente per Amplify"
PARENT_SECRET="$(openssl rand -hex 32)"
cat > "$OUT/amplify-env.txt" <<ENV
COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
COGNITO_DOMAIN=${COGNITO_DOMAIN}
COGNITO_REGION=${COGNITO_REGION}
DB_CLUSTER_ARN=${DB_CLUSTER_ARN}
DB_SECRET_ARN=${DB_SECRET_ARN}
DB_NAME=${DB_NAME}
DB_REGION=${DB_REGION}
PARENT_GATE_SECRET=${PARENT_SECRET}
NEXT_PUBLIC_APP_URL=${APP_URL}
ENV
chmod 600 "$OUT/amplify-env.txt"
cat "$OUT/amplify-env.txt"
cat <<TXT

Ora, nella console di Amplify:
  1. App settings > Environment variables: incolla le righe qui sopra
     (piu' ANTHROPIC_API_KEY e le altre di .env.example che usi).
  2. App settings > IAM roles > Compute role: scegli "${ROLE}".
  3. Aggiungi lo snippet di amplify.yml descritto in infra/aws/README.md
     (le variabili devono arrivare anche al server a runtime).
  4. Rifai il deploy.
TXT
