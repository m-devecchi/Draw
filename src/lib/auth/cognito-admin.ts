import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { poolId, region } from "./cognito";

// Operazioni da amministratore: servono credenziali IAM (il ruolo di
// calcolo di Amplify). Solo lato server, mai nel middleware.

let client: CognitoIdentityProviderClient | null = null;
function getClient() {
  client ??= new CognitoIdentityProviderClient({ region: region() });
  return client;
}

/**
 * Crea l'utente gia' confermato (niente email di conferma) con la password
 * scelta. Lancia UsernameExistsException se l'email e' gia' registrata.
 */
export async function createConfirmedUser(email: string, password: string) {
  await getClient().send(
    new AdminCreateUserCommand({
      UserPoolId: poolId(),
      Username: email,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
    })
  );
  await getClient().send(
    new AdminSetUserPasswordCommand({
      UserPoolId: poolId(),
      Username: email,
      Password: password,
      Permanent: true,
    })
  );
}

/** Elimina l'utente da Cognito (il "sub" vale come username). */
export async function deleteCognitoUser(sub: string) {
  await getClient().send(
    new AdminDeleteUserCommand({ UserPoolId: poolId(), Username: sub })
  );
}
