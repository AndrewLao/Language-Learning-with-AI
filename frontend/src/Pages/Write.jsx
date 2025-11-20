import axios from "axios";
import "./Write.css";
import { useState, useEffect, useRef } from "react";
import RichTextEditor from "../Components/RichTextEditor"

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const userId = localStorage.getItem('cognitoSub') || 'test_user';

const sampleFeedback = [
    {
        title: "Grammar Suggestion",
        details: "Consider revising the sentence: 'He go to school every day.' to 'He goes to school every day.'"
    },
    {
        title: "Vocabulary Enhancement",
        details: "Try using 'astonished' instead of 'surprised' for a stronger impact in your third paragraph."
    },
    {
        title: "Sentence Structure",
        details: "Your second sentence is a run-on. Break it into two shorter sentences for clarity."
    },
    {
        title: "Spelling Correction",
        details: "Check the spelling of 'definately' in the last section. It should be 'definitely'."
    }
];

const Write = () => {
    const [expanded, setExpanded] = useState([]);
    const [showNewTooltip, setShowNewTooltip] = useState(false);
    const [showUploadTooltip, setShowUploadTooltip] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const fileInputRef = useRef(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [viewMode, setViewMode] = useState("editor");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const toggleExpand = (idx) => {
        setExpanded(expanded =>
            expanded.includes(idx)
                ? expanded.filter(i => i !== idx)
                : [...expanded, idx]
        );
    };

    useEffect(() => {
        async function fetchDocuments() {
            try {
                const resp = await axios.get(
                    `${API_BASE}/users/documents/${encodeURIComponent(userId)}`,
                    { headers: { 'Content-Type': 'application/json' } }
                );

                setDocuments(resp.data.documents);

                if (resp.data.documents.length > 0) {
                    setSelectedId(resp.data.documents[0].doc_id);
                }
            } catch (err) {
                console.error("Failed to load documents:", err);
            }
        }

        fetchDocuments();
    }, []);

    useEffect(() => {
        async function fetchPdf() {
            if (!selectedId) return;
            try {
                const resp = await axios.get(
                    `${API_BASE}/users/documents/${encodeURIComponent(userId)}/${encodeURIComponent(selectedId)}`,
                    { responseType: "blob" }
                );
                const url = URL.createObjectURL(resp.data);
                setPdfUrl(url);
            } catch (err) {
                console.error("Failed to fetch document:", err);
            }
        }
        fetchPdf();
    }, [selectedId]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            alert("Only PDF files are allowed.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            await axios.post(
                `${API_BASE}/users/upload/${encodeURIComponent(userId)}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            const resp = await axios.get(
                `${API_BASE}/users/documents/${encodeURIComponent(userId)}`,
                { headers: { 'Content-Type': 'application/json' } }
            );

            setDocuments(resp.data.documents);
        } catch (err) {
            console.error("File upload failed:", err);
            alert("Upload failed");
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(
                `${API_BASE}/users/documents/${encodeURIComponent(userId)}/${encodeURIComponent(deleteTarget)}`,
                { headers: { "Content-Type": "application/json" } }
            );

            const resp = await axios.get(
                `${API_BASE}/users/documents/${encodeURIComponent(userId)}`,
                { headers: { 'Content-Type': 'application/json' } }
            );

            setDocuments(resp.data.documents);

            if (selectedId === deleteTarget) {
                setSelectedId(null);
                setPdfUrl(null);
            }

        } catch (err) {
            console.error("Failed to delete:", err);
            alert("Failed to delete document.");
        }

        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
    };


    return (
        <div className="write-editor-container">
            <aside className="writing-list">
                <div className="writing-list-header">
                    <h2>Documents</h2>
                    <div className="writing-list-actions">
                        <button
                            className="icon-btn"
                            onClick={() => {
                                setSelectedId(null);
                                setPdfUrl(null);
                                setViewMode("editor");
                            }}
                            onMouseEnter={() => setShowNewTooltip(true)}
                            onMouseLeave={() => setShowNewTooltip(false)}
                            aria-label="Create"
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182l-11.25 11.25a2 2 0 0 1-.708.445l-4 1.333a.5.5 0 0 1-.632-.632l1.333-4a2 2 0 0 1 .445-.708l11.25-11.25z"></path>
                            </svg>
                            {showNewTooltip && (
                                <span className="icon-tooltip">Create</span>
                            )}
                        </button>
                        <button
                            className="icon-btn"
                            onClick={() => fileInputRef.current.click()}
                            onMouseEnter={() => setShowUploadTooltip(true)}
                            onMouseLeave={() => setShowUploadTooltip(false)}
                            aria-label="Upload"
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {showUploadTooltip && (
                                <span className="icon-tooltip">Upload</span>
                            )}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="application/pdf"
                            style={{ display: "none" }}
                            onChange={handleUpload}
                        />
                    </div>
                </div>
                {documents.map((doc) => (
                    <div
                        key={doc.doc_id}
                        className={`writing-list-item${selectedId === doc.doc_id ? " selected" : ""}`}
                        onClick={() => setSelectedId(doc.doc_id)}
                        style={{ position: "relative" }}
                    >
                        <span className="writing-title">{doc.file_name}</span>

                        <div className="writing-meta">
                            <span className="writing-date">
                                {new Date(doc.created_at).toLocaleDateString()}
                            </span>

                            <button
                                className="delete-doc-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(doc.doc_id);
                                    setShowDeleteModal(true);
                                }}                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </aside>

            <main className="writing-editor">
                {viewMode === "editor" ? (
                    <RichTextEditor />
                ) : (
                    pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            style={{ width: "100%", height: "100%", border: "none" }}
                        />
                    ) : (
                        <div className="editor-placeholder">Loading document...</div>
                    )
                )}
            </main>

            <aside className="writing-advice">
                <h2 style={{ color: "#fff" }}>Feedback</h2>
                <div className="advice-placeholder">
                    {sampleFeedback.map((fb, idx) => (
                        <div
                            key={idx}
                            className="feedback-entry"
                        >
                            <button
                                className="feedback-title"
                                onClick={() => toggleExpand(idx)}
                                aria-expanded={expanded.includes(idx)}
                            >
                                {fb.title}
                                <span
                                    className={`feedback-arrow${expanded.includes(idx) ? " expanded" : ""}`}
                                >
                                    ▶
                                </span>
                            </button>
                            {expanded.includes(idx) && (
                                <div className="feedback-details">
                                    {fb.details}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>
            {showDeleteModal && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <h3>Delete Document?</h3>
                        <p>This action cannot be undone.</p>

                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={cancelDelete}>
                                Cancel
                            </button>
                            <button className="modal-btn confirm" onClick={confirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Write;