// src/Login.jsx
import React, { useState } from 'react';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { useNavigate } from 'react-router-dom';
import userPool from './CognitoConfigs'; // Import your configured user pool
import "./Login.css";

const Login = () => {
    const [error, setError] = useState('');
    const [tokens, setTokens] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData(e.target);
        const { username, password } = Object.fromEntries(formData.entries());

        // Create an AuthenticationDetails object with the entered credentials
        const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
        });

        // Create a CognitoUser using the configured user pool
        const user = new CognitoUser({
            Username: username,
            Pool: userPool,
        });

        // Cognito Login logic
        user.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                console.log('Authentication successful!', result);
                const idToken = result.getIdToken().getJwtToken();
                const accessToken = result.getAccessToken().getJwtToken();
                const refreshToken = result.getRefreshToken().getToken();
                // Saving tokens in localstorage and in a useState for prop passing
                setTokens({ idToken, accessToken, refreshToken });
                localStorage.setItem('idToken', idToken);
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                // Redirect to dashboard
                navigate('/dashboard');
            },
            onFailure: (err) => {
                console.error('Authentication failed:', err);
                setError(err.message || JSON.stringify(err));
            },
            // Required portion for cognito api but effectively dead code since it's unused
            newPasswordRequired: (userAttributes, requiredAttributes) => {
                console.log('New password required', userAttributes, requiredAttributes);
                setError("New password required. Please reset your password.");
            }
        });
    };

    const handleGoToRegister = () => {
        navigate('/register');
    };

    return (
        <div className='login-wrapper'>
            <form onSubmit={handleSubmit} className='login-form-wrapper'>
                <h1>Login</h1>
                {error && <p className="error">{error}</p>}
                <label>
                    <input type="email" name="username" placeholder="Email" required />
                </label>
                <label>
                    <input type="password" name="password" placeholder="Password" required />
                </label>
                <button type="submit">Login</button>
                {tokens && (
                    <div className="token-output">
                        Login Successful
                    </div>
                )}

                <button onClick={handleGoToRegister} className="register-button">
                    Register New Account
                </button>
            </form>

        </div>
    );
};

export default Login;
