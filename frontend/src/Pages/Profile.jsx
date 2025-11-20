import "./Profile.css";
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const userId = localStorage.getItem('cognitoSub') || 'test_user';

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
    const [profile, setProfile] = useState({
        picture: "https://ui-avatars.com/api/?name=User&background=213547&color=fff",
        name: "John Doe",
        email: "example@email.com",
    });

    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    // const [emailConfirm, setEmailConfirm] = useState("");

    const [selectedPrefs, setSelectedPrefs] = useState([]);
    const [prefDraft, setPrefDraft] = useState([]);
    const [editingPrefs, setEditingPrefs] = useState(false);

    // Load Settings Data
    useEffect(() => {
        async function fetchProfile() {
            try {
                const resp = await axios.get(
                    `${API_BASE}/users/profiles/${encodeURIComponent(userId)}`,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                setProfile({
                    picture: "https://ui-avatars.com/api/?name=User&background=213547&color=fff",
                    name: resp.data.username,
                    email: resp.data.email
                });

                if (resp.data.preferences) {
                    setSelectedPrefs(resp.data.preferences);
                    setPrefDraft(resp.data.preferences);
                }
            } catch (err) {
                console.error(err);
            }
        }
        fetchProfile();
    }, []);

    const startEdit = (field) => {
        setEditing(field);
        setForm({ ...profile });
        // setEmailConfirm("");
    };

    const handleSaveChanges = async () => {
        if (!profile) return;

        const payload = {};
        if (editing === "name") payload.username = form.name;

        try {
            const resp = await axios.patch(
                `${API_BASE}/users/profiles/${encodeURIComponent(userId)}`,
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            setProfile(resp.data);
            setEditing(null);
            window.location.reload();
        } catch (err) {
            console.error("Profile update failed:", err);
            alert("Failed to update profile");
        }
    };

    const cancelEdit = () => {
        setEditing(null);
    };

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

            <div className="settings-card">
                <h1>User Profile</h1>

                {/* <div className="setting-row">
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
                </div> */}

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

                <h2>Email</h2>
                <div className="setting-row">
                    <span>{profile.email}</span>
                </div>
                {/* <h2>Email</h2>
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
                </div> */}
            </div>

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
