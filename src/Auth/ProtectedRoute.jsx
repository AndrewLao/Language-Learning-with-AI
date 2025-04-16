import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtVerify, importJWK } from 'jose';

const REGION = import.meta.env.VITE_USER_POOL_REGION;
const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID;
const COGNITO_ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS_URL = `${COGNITO_ISSUER}/.well-known/jwks.json`;

const getJWK = async (kid) => {
    const res = await fetch(JWKS_URL);
    const jwks = await res.json();
    const jwk = jwks.keys.find(key => key.kid === kid);
    if (!jwk) {
        throw new Error('Unable to find matching JWK');
    }
    return jwk;
};

const verifyToken = async (token) => {
    // jwtVerify extracts header for key ID (kid)
    await jwtVerify(token, async (header) => {
        const jwk = await getJWK(header.kid);
        return importJWK(jwk, header.alg);
    }, {
        issuer: COGNITO_ISSUER,
    });
};

const ProtectedRoute = ({ children }) => {
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('idToken');
        if (!token) {
            setIsValid(false);
            return;
        }
        verifyToken(token)
            .then(() => setIsValid(true))
            .catch((err) => {
                console.error('Token verification failed:', err);
                setIsValid(false);
            });
    }, []);

    if (isValid === null) {
        return <div>Loading...</div>;
    }

    if (!isValid) {
        localStorage.removeItem('idToken');
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;