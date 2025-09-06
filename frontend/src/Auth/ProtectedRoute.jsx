import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('idToken');
        if (!token) {
            setIsValid(false);
            return;
        }

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);

            if (payload.exp && payload.exp * 1000 < Date.now()) {
                console.warn("Token expired");
                setIsValid(false);
            } else {
                setIsValid(true);
            }
        } catch (err) {
            console.error("Failed to parse token:", err);
            setIsValid(false);
        }
    }, []);

    if (isValid === null) return <div>Loading...</div>;
    if (!isValid) {
        localStorage.removeItem('idToken');
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
