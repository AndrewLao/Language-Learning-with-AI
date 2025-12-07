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
        name: ".....",
        email: ".....",
    });

    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    // const [emailConfirm, setEmailConfirm] = useState("");

    const [selectedPrefs, setSelectedPrefs] = useState([]);
    const [prefDraft, setPrefDraft] = useState([]);
    const [editingPrefs, setEditingPrefs] = useState(false);
    const [streak, setStreak] = useState(0);


    // Load Settings Data
    useEffect(() => {
        async function fetchData() {
            try {
                const profileResp = await axios.get(
                    `${API_BASE}/users/profiles/${encodeURIComponent(userId)}`
                );

                setProfile({
                    name: profileResp.data.username,
                    email: profileResp.data.email
                });

                setStreak(profileResp.data.score_streak);

                const prefResp = await axios.get(
                    `${API_BASE}/users/preferences/${encodeURIComponent(userId)}`
                );

                // Normalize lowercase backend → Capitalized UI
                const prefs = (prefResp.data.preferences || []).map(p =>
                    p.charAt(0).toUpperCase() + p.slice(1)
                );

                setSelectedPrefs(prefs);
                setPrefDraft(prefs);

            } catch (err) {
                console.error("Failed to load profile or preferences", err);
            }
        }

        fetchData();
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
            await axios.patch(
                `${API_BASE}/users/profiles/${encodeURIComponent(userId)}`,
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            const refreshed = await axios.get(
                `${API_BASE}/users/profiles/${encodeURIComponent(userId)}`,
                { headers: { 'Content-Type': 'application/json' } }
            );

            setProfile({
                name: refreshed.data.username,
                email: refreshed.data.email
            });
            setEditing(null);
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

    const savePrefs = async () => {
        try {
            // Send to backend API
            await axios.patch(
                `${API_BASE}/users/preferences/${encodeURIComponent(userId)}`,
                { preferences: prefDraft.map(p => p.toLowerCase()) }
            );

            setSelectedPrefs(prefDraft);
            setEditingPrefs(false);

        } catch (err) {
            console.error("Failed to update preferences:", err);
            alert("Could not save preferences");
        }
    };

    const cancelPrefs = () => {
        setPrefDraft(selectedPrefs);
        setEditingPrefs(false);
    };

    return (
        <div className="profile-page">

            <div className="settings-card">
                <h1>User Profile</h1>

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
                <h2>Daily Streak</h2>
                <div className="setting-row">
                    <span style={{fontSize: '2em'}}>{streak} 🔥</span>
                </div>
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
