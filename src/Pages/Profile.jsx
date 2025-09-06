import "./Profile.css"
import { useState } from "react";

const initialProfile = {
    profilePicture: "https://ui-avatars.com/api/?name=User&background=213547&color=fff",
    name: "John Doe",
    email: "johndoe@email.com",
    password: "********"
};

const Profile = () => {
    const [profile, setProfile] = useState(initialProfile);
    const [editField, setEditField] = useState(null);
    const [form, setForm] = useState(profile);
    const [confirm, setConfirm] = useState({ email: "", password: "" });
    const [error, setError] = useState({ email: "", password: "" });

    const handleEdit = (field) => {
        setEditField(field);
        setForm(profile);
        setConfirm({ email: "", password: "" });
        setError({ email: "", password: "" });
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleConfirmChange = (e) => {
        setConfirm({ ...confirm, [e.target.name]: e.target.value });
    };

    const handleSave = (field) => {
        if (field === "email" && form.email !== confirm.email) {
            setError({ ...error, email: "Emails do not match." });
            return;
        }
        if (field === "password" && form.password !== confirm.password) {
            setError({ ...error, password: "Passwords do not match." });
            return;
        }
        setProfile({ ...profile, [field]: form[field] });
        setEditField(null);
        setError({ email: "", password: "" });
    };

    const handleCancel = () => {
        setEditField(null);
        setConfirm({ email: "", password: "" });
    };

    const handleDeleteAccount = () => {
        alert("Account deletion not implemented.");
    };

    return (
        <div className="profile-container">
            <div className="profile-content">
                <h1>Settings</h1>
                <div className="profile-row">
                    <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="profile-picture"
                    />
                    {editField === "profilePicture" ? (
                        <>
                            <input
                                type="text"
                                name="profilePicture"
                                value={form.profilePicture}
                                onChange={handleChange}
                                className="profile-input"
                            />
                            <button className="profile-btn" onClick={() => handleSave("profilePicture")}>Save</button>
                            <button className="profile-btn" onClick={handleCancel}>Cancel</button>
                        </>
                    ) : (
                        <button className="profile-btn" onClick={() => handleEdit("profilePicture")}>Change Picture</button>
                    )}
                </div>
                <div className="profile-row">
                    <label className="profile-label">Name:</label>
                    {editField === "name" ? (
                        <>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="profile-input"
                            />
                            <button className="profile-btn" onClick={() => handleSave("name")}>Save</button>
                            <button className="profile-btn" onClick={handleCancel}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <span style={{ flex: 1 }}>{profile.name}</span>
                            <button className="profile-btn" onClick={() => handleEdit("name")}>Edit</button>
                        </>
                    )}
                </div>
                <div className="profile-row">
                    <label className="profile-label">Email:</label>
                    {editField === "email" ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5em" }}>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className="profile-input"
                                placeholder="New email"
                            />
                            <input
                                type="email"
                                name="email"
                                value={confirm.email}
                                onChange={handleConfirmChange}
                                className="profile-input"
                                placeholder="Confirm new email"
                            />
                            {error.email && (
                                <span className="profile-error">{error.email}</span>
                            )}
                            <div style={{ display: "flex", gap: "0.5em", marginTop: "0.5em" }}>
                                <button className="profile-btn" onClick={() => handleSave("email")}>Save</button>
                                <button className="profile-btn" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span style={{ flex: 1 }}>{profile.email}</span>
                            <button className="profile-btn" onClick={() => handleEdit("email")}>Edit</button>
                        </>
                    )}
                </div>
                <div className="profile-row">
                    <label className="profile-label">Password:</label>
                    {editField === "password" ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5em" }}>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className="profile-input"
                                placeholder="New password"
                            />
                            <input
                                type="password"
                                name="password"
                                value={confirm.password}
                                onChange={handleConfirmChange}
                                className="profile-input"
                                placeholder="Confirm new password"
                            />
                            {error.password && (
                                <span className="profile-error">{error.password}</span>
                            )}
                            <div style={{ display: "flex", gap: "0.5em", marginTop: "0.5em" }}>
                                <button className="profile-btn" onClick={() => handleSave("password")}>Save</button>
                                <button className="profile-btn" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span style={{ flex: 1 }}>{profile.password}</span>
                            <button className="profile-btn" onClick={() => handleEdit("password")}>Edit</button>
                        </>
                    )}
                </div>
                <button
                    className="profile-btn delete"
                    onClick={handleDeleteAccount}
                >
                    Delete Account
                </button>
            </div>
        </div>
    );
};

export default Profile;