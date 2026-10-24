#!/usr/bin/env bash
# Crea Aurora PostgreSQL Serverless v2 che va in pausa da solo, con la
# Data API abilitata (l'app lo raggiunge via HTTPS firmato IAM: nessuna VPC
# da configurare per Amplify e nessuna porta aperta su Internet).
source "$(dirname "$0")/lib.sh"
load

CLUSTER="${APP_NAME}"
INSTANCE="${APP_NAME}-1"
DB_NAME="${APP_NAME}"

say "Controllo la versione di Aurora ($AURORA_ENGINE_VERSION)"
if ! aws rds describe-db-engine-versions --engine aurora-postgresql \
     --engine-version "$AURORA_ENGINE_VERSION" --query 'DBEngineVersions[0].EngineVersion' \
     --output text 2>/dev/null | grep -q "$AURORA_ENGINE_VERSION"; then
  echo "Versione $AURORA_ENGINE_VERSION non disponibile in $AWS_REGION. Versioni:" >&2
  aws rds describe-db-engine-versions --engine aurora-postgresql \
    --query 'DBEngineVersions[].EngineVersion' --output text >&2
  exit 1
fi

say "Rete: uso la VPC predefinita"
VPC_ID="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
if [[ "$VPC_ID" == "None" ]]; then
  echo "Nessuna VPC predefinita in $AWS_REGION: creala con 'aws ec2 create-default-vpc'." >&2
  exit 1
fi
SUBNETS="$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" Name=default-for-az,Values=true \
  --query 'Subnets[].SubnetId' --output text)"

if ! aws rds describe-db-subnet-groups --db-subnet-group-name "$APP_NAME" >/dev/null 2>&1; then
  # shellcheck disable=SC2086
  aws rds create-db-subnet-group --db-subnet-group-name "$APP_NAME" \
    --db-subnet-group-description "$APP_NAME" --subnet-ids $SUBNETS >/dev/null
fi

# Gruppo di sicurezza SENZA regole in ingresso: il database non e' raggiungibile
# da nessuna rete. Si accede solo dalla Data API.
SG_ID="$(aws ec2 describe-security-groups --filters Name=group-name,Values="${APP_NAME}-db" Name=vpc-id,Values="$VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text)"
if [[ "$SG_ID" == "None" ]]; then
  SG_ID="$(aws ec2 create-security-group --group-name "${APP_NAME}-db" \
    --description "$APP_NAME Aurora (nessun accesso diretto)" --vpc-id "$VPC_ID" \
    --query GroupId --output text)"
fi

say "Creo il cluster $CLUSTER (pausa automatica dopo ${AURORA_PAUSE_SECONDS}s, max ${AURORA_MAX_ACU} ACU)"
if aws rds describe-db-clusters --db-cluster-identifier "$CLUSTER" >/dev/null 2>&1; then
  echo "Il cluster esiste gia': salto la creazione."
else
  aws rds create-db-cluster \
    --db-cluster-identifier "$CLUSTER" \
    --engine aurora-postgresql --engine-version "$AURORA_ENGINE_VERSION" \
    --database-name "$DB_NAME" \
    --master-username "${APP_NAME}_admin" --manage-master-user-password \
    --serverless-v2-scaling-configuration \
      "MinCapacity=0,MaxCapacity=${AURORA_MAX_ACU},SecondsUntilAutoPause=${AURORA_PAUSE_SECONDS}" \
    --db-subnet-group-name "$APP_NAME" --vpc-security-group-ids "$SG_ID" \
    --storage-encrypted --backup-retention-period 1 \
    --deletion-protection >/dev/null
fi

if ! aws rds describe-db-instances --db-instance-identifier "$INSTANCE" >/dev/null 2>&1; then
  say "Creo l'istanza serverless $INSTANCE"
  aws rds create-db-instance \
    --db-instance-identifier "$INSTANCE" --db-cluster-identifier "$CLUSTER" \
    --engine aurora-postgresql --db-instance-class db.serverless \
    --no-publicly-accessible >/dev/null
fi

say "Attendo che l'istanza sia disponibile (qualche minuto)"
aws rds wait db-instance-available --db-instance-identifier "$INSTANCE"

say "Abilito la Data API"
CLUSTER_ARN="$(aws rds describe-db-clusters --db-cluster-identifier "$CLUSTER" \
  --query 'DBClusters[0].DBClusterArn' --output text)"
aws rds enable-http-endpoint --resource-arn "$CLUSTER_ARN" >/dev/null

SECRET_ARN="$(aws rds describe-db-clusters --db-cluster-identifier "$CLUSTER" \
  --query 'DBClusters[0].MasterUserSecret.SecretArn' --output text)"

save DB_CLUSTER_ARN "$CLUSTER_ARN"
save DB_SECRET_ARN "$SECRET_ARN"
save DB_NAME "$DB_NAME"
save DB_REGION "$AWS_REGION"

say "Fatto"
echo "DB_CLUSTER_ARN=$CLUSTER_ARN"
echo "DB_SECRET_ARN=$SECRET_ARN"
echo "Prossimo passo: ./02-schema.sh"
