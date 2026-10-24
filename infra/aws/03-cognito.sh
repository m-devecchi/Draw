#!/usr/bin/env bash
# Crea lo user pool Cognito (login, registrazione, recupero password) con
# l'app client e il dominio di accesso per Google/Apple.
source "$(dirname "$0")/lib.sh"
load

POOL_NAME="$APP_NAME"
DOMAIN_HOST="${COGNITO_DOMAIN_PREFIX}.auth.${AWS_REGION}.amazoncognito.com"

say "Creo lo user pool"
POOL_ID="${COGNITO_USER_POOL_ID:-}"
if [[ -z "$POOL_ID" ]]; then
  POOL_ID="$(aws cognito-idp create-user-pool \
    --pool-name "$POOL_NAME" \
    --username-attributes email \
    --auto-verified-attributes email \
    --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=false,RequireLowercase=false,RequireNumbers=false,RequireSymbols=false}' \
    --account-recovery-setting 'RecoveryMechanisms=[{Priority=1,Name=verified_email}]' \
    --user-attribute-update-settings 'AttributesRequireVerificationBeforeUpdate=email' \
    --mfa-configuration OFF \
    --admin-create-user-config 'AllowAdminCreateUserOnly=false' \
    --deletion-protection ACTIVE \
    --query UserPool.Id --output text)"
fi
save COGNITO_USER_POOL_ID "$POOL_ID"
POOL_ARN="arn:aws:cognito-idp:${AWS_REGION}:${ACCOUNT_ID}:userpool/${POOL_ID}"
save COGNITO_USER_POOL_ARN "$POOL_ARN"

say "Dominio di accesso: $DOMAIN_HOST"
if ! aws cognito-idp describe-user-pool --user-pool-id "$POOL_ID" \
     --query UserPool.Domain --output text | grep -q "$COGNITO_DOMAIN_PREFIX"; then
  aws cognito-idp create-user-pool-domain --domain "$COGNITO_DOMAIN_PREFIX" \
    --user-pool-id "$POOL_ID" >/dev/null
fi

PROVIDERS=("COGNITO")

if [[ -n "${GOOGLE_CLIENT_ID:-}" && -n "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  say "Provider Google"
  aws cognito-idp describe-identity-provider --user-pool-id "$POOL_ID" --provider-name Google >/dev/null 2>&1 \
    || aws cognito-idp create-identity-provider --user-pool-id "$POOL_ID" \
      --provider-name Google --provider-type Google \
      --provider-details "client_id=${GOOGLE_CLIENT_ID},client_secret=${GOOGLE_CLIENT_SECRET},authorize_scopes=openid email profile" \
      --attribute-mapping email=email,username=sub >/dev/null
  PROVIDERS+=("Google")
fi

if [[ -n "${APPLE_SERVICES_ID:-}" && -n "${APPLE_PRIVATE_KEY_FILE:-}" ]]; then
  say "Provider Apple"
  aws cognito-idp describe-identity-provider --user-pool-id "$POOL_ID" --provider-name SignInWithApple >/dev/null 2>&1 \
    || aws cognito-idp create-identity-provider --user-pool-id "$POOL_ID" \
      --provider-name SignInWithApple --provider-type SignInWithApple \
      --provider-details "client_id=${APPLE_SERVICES_ID},team_id=${APPLE_TEAM_ID},key_id=${APPLE_KEY_ID},private_key=$(cat "$APPLE_PRIVATE_KEY_FILE"),authorize_scopes=email name" \
      --attribute-mapping email=email >/dev/null
  PROVIDERS+=("SignInWithApple")
fi

say "App client (senza secret: gira solo lato server, i token restano nei cookie httpOnly)"
CLIENT_ID="${COGNITO_CLIENT_ID:-}"
CLIENT_ARGS=(
  --user-pool-id "$POOL_ID"
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
  --prevent-user-existence-errors ENABLED
  --supported-identity-providers "${PROVIDERS[@]}"
  --callback-urls "${APP_URL}/auth/callback" "http://localhost:3000/auth/callback"
  --logout-urls "${APP_URL}/login" "http://localhost:3000/login"
  --allowed-o-auth-flows code
  --allowed-o-auth-scopes openid email profile
  --allowed-o-auth-flows-user-pool-client
  --access-token-validity 60 --id-token-validity 60 --refresh-token-validity 30
  --token-validity-units AccessToken=minutes,IdToken=minutes,RefreshToken=days
)
if [[ -z "$CLIENT_ID" ]]; then
  CLIENT_ID="$(aws cognito-idp create-user-pool-client --client-name "${APP_NAME}-web" \
    --no-generate-secret "${CLIENT_ARGS[@]}" --query UserPoolClient.ClientId --output text)"
else
  aws cognito-idp update-user-pool-client --client-id "$CLIENT_ID" "${CLIENT_ARGS[@]}" >/dev/null
fi
save COGNITO_CLIENT_ID "$CLIENT_ID"
save COGNITO_DOMAIN "$DOMAIN_HOST"
save COGNITO_REGION "$AWS_REGION"

say "Fatto"
echo "COGNITO_USER_POOL_ID=$POOL_ID"
echo "COGNITO_CLIENT_ID=$CLIENT_ID"
echo "COGNITO_DOMAIN=$DOMAIN_HOST"
if [[ ${#PROVIDERS[@]} -gt 1 ]]; then
  echo "Nel pannello di Google/Apple, come URI di reindirizzamento autorizzato usa:"
  echo "  https://${DOMAIN_HOST}/oauth2/idpresponse"
fi
echo "Prossimo passo: ./04-iam-budget.sh"
