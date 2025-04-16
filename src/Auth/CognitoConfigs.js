// src/cognito.js
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: import.meta.env.VITE_USER_POOL_ID, // Replace with your User Pool ID
    ClientId: import.meta.env.VITE_CLIENT_ID, // Replace with your App Client ID
};

const userPool = new CognitoUserPool(poolData);

export default userPool;
