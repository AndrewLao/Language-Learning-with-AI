import "./Profile.css";
import { useState } from "react";

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

const defaultPrefs = [
    "Movies",
    "Books",
    "Games",
    "Music",
    "Anime",
    "Fitness",
    "Travel",
    "Cooking",
    "Technology",
    "Art",
    "Outdoors",
    "Pets",
    "Podcasts",
    "Photography"
];

const Profile = () => {
    /* ===================== SETTINGS STATE ===================== */
    const [profile, setProfile] = useState({
        picture: "https://ui-avatars.com/api/?name=User&background=213547&color=fff",
        name: "John Doe",
        email: "example@email.com",
    });

    const [editing, setEditing] = useState(null); // name | email | password | picture
    const [form, setForm] = useState({});
    const [emailConfirm, setEmailConfirm] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [passwordErrors, setPasswordErrors] = useState([]);

    /* ===================== PREFERENCES STATE ===================== */
    const [selectedPrefs, setSelectedPrefs] = useState([]);
    const [prefDraft, setPrefDraft] = useState([]);
    const [editingPrefs, setEditingPrefs] = useState(false);

    /* ===================== SETTINGS HANDLERS ===================== */
    const startEdit = (field) => {
        setEditing(field);
        setForm({ ...profile });
        setEmailConfirm("");
        setPasswordConfirm("");
        setPasswordErrors([]);
    };

    const handleSaveChanges = () => {
        if (editing === "email") {
            if (form.email !== emailConfirm) {
                alert("Emails do not match.");
                return;
            }
        }

        if (editing === "password") {
            if (form.password !== passwordConfirm) {
                alert("Passwords do not match.");
                return;
            }
            const errors = checkPassword(form.password);
            if (errors.length > 0) {
                setPasswordErrors(errors);
                return;
            }
        }

        if (editing === "picture") {
            setProfile({ ...profile, picture: form.picture });
        } else if (editing === "name") {
            setProfile({ ...profile, name: form.name });
        } else if (editing === "email") {
            setProfile({ ...profile, email: form.email });
        } else if (editing === "password") {
            alert("Password successfully changed! (Not actually saved — backend needed)");
        }

        setEditing(null);
    };

    const cancelEdit = () => {
        setEditing(null);
        setPasswordErrors([]);
    };

    /* ===================== PREFERENCE HANDLERS ===================== */
    const togglePref = (pref) => {
        if (prefDraft.includes(pref)) {
            setPrefDraft(prefDraft.filter((p) => p !== pref));
        } else {
            setPrefDraft([...prefDraft, pref]);
        }
    };

    const savePrefs = () => {
        setSelectedPrefs(prefDraft);
        setEditingPrefs(false);
    };

    const cancelPrefs = () => {
        setPrefDraft(selectedPrefs);
        setEditingPrefs(false);
    };

    return (
        <div className="profile-page">

            {/* LEFT: SETTINGS CARD */}
            <div className="settings-card">
                <h1>Settings</h1>

                {/* PROFILE PICTURE */}
                <div className="setting-row">
                    <img src={profile.picture} className="profile-pic" />
                    {editing === "picture" ? (
                        <div className="edit-block">
                            <input
                                type="text"
                                placeholder="Image URL"
                                value={form.picture}
                                onChange={(e) => setForm({ ...form, picture: e.target.value })}
                            />
                            <div className="btn-row">
                                <button onClick={handleSaveChanges}>Save</button>
                                <button onClick={cancelEdit}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => startEdit("picture")}>Change</button>
                    )}
                </div>

                {/* NAME */}
                <h2>Name</h2>
                <div className="setting-row">
                    {editing === "name" ? (
                        <div className="edit-block">
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <div className="btn-row">
                                <button onClick={handleSaveChanges}>Save</button>
                                <button onClick={cancelEdit}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span>{profile.name}</span>
                            <button onClick={() => startEdit("name")}>Edit</button>
                        </>
                    )}
                </div>

                {/* EMAIL */}
                <h2>Email</h2>
                <div className="setting-row">
                    {editing === "email" ? (
                        <div className="edit-block">
                            <input
                                type="email"
                                placeholder="New email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            <input
                                type="email"
                                placeholder="Confirm new email"
                                value={emailConfirm}
                                onChange={(e) => setEmailConfirm(e.target.value)}
                            />
                            <div className="btn-row">
                                <button onClick={handleSaveChanges}>Save</button>
                                <button onClick={cancelEdit}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span>{profile.email}</span>
                            <button onClick={() => startEdit("email")}>Edit</button>
                        </>
                    )}
                </div>

                {/* PASSWORD */}
                <h2>Password</h2>
                <div className="setting-row">
                    {editing === "password" ? (
                        <div className="edit-block">
                            <input
                                type="password"
                                placeholder="New password"
                                value={form.password || ""}
                                onChange={(e) => {
                                    const pwd = e.target.value;
                                    setForm({ ...form, password: pwd });
                                    setPasswordErrors(checkPassword(pwd));
                                }}
                            />
                            <input
                                type="password"
                                placeholder="Confirm password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                            />

                            {passwordErrors.length > 0 && (
                                <ul className="password-errors">
                                    {passwordErrors.map((err, i) => (
                                        <li key={i}>Missing: {err}</li>
                                    ))}
                                </ul>
                            )}

                            <div className="btn-row">
                                <button onClick={handleSaveChanges}>Save</button>
                                <button onClick={cancelEdit}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span>********</span>
                            <button onClick={() => startEdit("password")}>Edit</button>
                        </>
                    )}
                </div>
            </div>

            {/* RIGHT: PREFERENCES CARD */}
            <div className="preferences-card">
                <h1>Preferences</h1>

                {!editingPrefs ? (
                    <>
                        <div className="pref-grid-display">
                            {defaultPrefs.map((pref) => (
                                <div key={pref} className="pref-display-item">
                                    {selectedPrefs.includes(pref) ? (
                                        <span className="pref-selected">✔ {pref}</span>
                                    ) : (
                                        <span className="pref-unselected">{pref}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setEditingPrefs(true)}>
                            Edit Preferences
                        </button>
                    </>
                ) : (
                    <>
                        <div className="pref-checkbox-grid">
                            {defaultPrefs.map((p) => (
                                <label key={p} className="pref-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={prefDraft.includes(p)}
                                        onChange={() => togglePref(p)}
                                    />
                                    {p}
                                </label>
                            ))}
                        </div>

                        <div className="btn-row">
                            <button onClick={savePrefs}>Confirm</button>
                            <button onClick={cancelPrefs}>Cancel</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Profile;
