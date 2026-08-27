import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_jjWjZa4mZ',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '73h98h9oa7g80bqeii9sfhljad',
};

export const userPool = new CognitoUserPool(poolData);

/**
 * Derives application role strictly from Cognito group claims (cognito:groups).
 * Exact mapping:
 * - STUDENT -> STUDENT
 * - STAFF -> STAFF
 * - TECHNICIAN -> TECHNICIAN
 * - ADMIN -> ADMIN
 */
export function deriveRoleFromGroups(groups) {
  if (!groups) return 'STUDENT';
  const groupList = Array.isArray(groups) ? groups : [groups];

  if (groupList.includes('ADMIN')) return 'ADMIN';
  if (groupList.includes('TECHNICIAN')) return 'TECHNICIAN';
  if (groupList.includes('STAFF')) return 'STAFF';
  if (groupList.includes('STUDENT')) return 'STUDENT';

  return 'STUDENT';
}

/**
 * Builds user object from active Cognito session and user instance.
 */
export function buildUserFromSession(cognitoUser, session) {
  const idTokenPayload = session.getIdToken().decodePayload() || {};
  const accessTokenPayload = session.getAccessToken().decodePayload() || {};

  const groups = idTokenPayload['cognito:groups'] || accessTokenPayload['cognito:groups'] || [];
  const role = deriveRoleFromGroups(groups);

  const email = idTokenPayload.email || cognitoUser.getUsername();
  const name = idTokenPayload.name || (email ? email.split('@')[0] : 'Campus User');
  const id = idTokenPayload.sub || cognitoUser.getUsername();
  const sub = idTokenPayload.sub || id;

  return {
    id,
    sub,
    email,
    name,
    role,
    accessToken: session.getAccessToken().getJwtToken(),
    idToken: session.getIdToken().getJwtToken(),
  };
}

/**
 * Authenticates user with Cognito User Pool using email and password.
 * Supports NEW_PASSWORD_REQUIRED challenge for first-time login users.
 */
export function loginCognito(email, password) {
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: email,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        const user = buildUserFromSession(cognitoUser, session);
        resolve({ status: 'SUCCESS', user, session });
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        resolve({
          status: 'NEW_PASSWORD_REQUIRED',
          cognitoUser,
          userAttributes,
          requiredAttributes,
        });
      },
    });
  });
}

/**
 * Completes the NEW_PASSWORD_REQUIRED challenge for a user.
 */
export function completeNewPasswordChallenge(cognitoUser, newPassword, userAttributes = {}) {
  return new Promise((resolve, reject) => {
    // Remove non-editable system attributes if present
    const cleanAttributes = { ...userAttributes };
    delete cleanAttributes.email_verified;
    delete cleanAttributes.phone_number_verified;
    delete cleanAttributes.email;

    cognitoUser.completeNewPasswordChallenge(newPassword, cleanAttributes, {
      onSuccess: (session) => {
        const user = buildUserFromSession(cognitoUser, session);
        resolve({ status: 'SUCCESS', user, session });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Attempts to restore current Cognito user session from browser storage.
 * Leverages SDK automatic token refresh when available.
 */
export function getCurrentCognitoSession() {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      const user = buildUserFromSession(cognitoUser, session);
      resolve({ session, user });
    });
  });
}

/**
 * Signs out current Cognito user from local session storage.
 */
export function logoutCognito() {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
}

/**
 * Helper to obtain valid access token for API requests.
 */
export function getAccessToken() {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }
      resolve(session.getAccessToken().getJwtToken());
    });
  });
}
