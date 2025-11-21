import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userPool from './CognitoConfigs';
import './Register.css';
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const checkPassword = (password) => {
    const missingCriteria = [];
    if (password.length < 8) missingCriteria.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) missingCriteria.push('an uppercase letter');
    if (!/[a-z]/.test(password)) missingCriteria.push('a lowercase letter');
    if (!/\d/.test(password)) missingCriteria.push('a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        missingCriteria.push('a special character');
    return missingCriteria;
};

const Register = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const formData = new FormData(e.target);
        const { email, password, passwordConfirmation } = Object.fromEntries(formData.entries());

        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }

        const missing = checkPassword(password);
        if (missing.length > 0) {
            setError(`Password must contain: ${missing.join(', ')}.`);
            return;
        }

        userPool.signUp(email, password, [{ Name: 'email', Value: email }], null, async (err, result) => {
            if (err) {
                console.error('Registration error:', err);
                if (err.code === 'UsernameExistsException') {
                    setError('This email is already registered.');
                } else {
                    setError(err.message || JSON.stringify(err));
                }
                return;
            }

            console.log("Cognito signup success:", result);

            const userId = result.userSub; 
            const emailAddr = result.user.getUsername();
            const username = emailAddr.split("@")[0];

            try {
                await axios.post(`${API_BASE}/users/profiles`, {
                    user_id: userId,
                    username: username,
                    email: emailAddr
                });

                setSuccess("Registration successful! Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);

            } catch (dbErr) {
                console.error("Backend profile creation failed:", dbErr);
                setError("Account created, but failed to create your user profile.");
            }
        });
    };


    const handleGoToRegister = () => {
        navigate('/login');
    };

    return (
        <div className='register-wrapper'>
            <form onSubmit={handleSubmit} className='register-form-wrapper'>
                <h1>Register</h1>

                <div>
                    <label>
                        <input type="email" name="email" placeholder="Email" required />
                    </label>
                </div>
                <div>
                    <label>
                        <input type="password" name="password" placeholder="Password" required />
                    </label>
                </div>
                <div>
                    <label>
                        <input type="password" name="passwordConfirmation" placeholder="Confirm Password" required />
                    </label>
                </div>
                <button type="submit">Register</button>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
                <button onClick={handleGoToRegister} className="register-button">
                    Login With Existing Account
                </button>
            </form>
        </div>
    );
};

export default Register;