import axios from "axios";
import "./Write.css";
import { useState, useEffect, useRef } from "react";
import RichTextEditor from "../Components/RichTextEditor"

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const userId = localStorage.getItem('cognitoSub') || 'test_user';


const Write = () => {
    // General utilities
    const [expanded, setExpanded] = useState([]);
    const [showNewTooltip, setShowNewTooltip] = useState(false);
    const [showUploadTooltip, setShowUploadTooltip] = useState(false);

    // Document list management
    const [documents, setDocuments] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const fileInputRef = useRef(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [viewMode, setViewMode] = useState("editor");

    // Delete Modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Getting editor text
    const [editorText, setEditorText] = useState({ html: "", text: "" });

    // Feedback
    const [aiFeedback, setAiFeedback] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackCache, setFeedbackCache] = useState({});
    const [currentFeedback, setCurrentFeedback] = useState(null);

    // Submit modal
    const [showNameModal, setShowNameModal] = useState(false);
    const [newDocName, setNewDocName] = useState("");

    const hasRealText = editorText.text.trim().length > 0;

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
                    setViewMode("pdf");
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


    const handleGetFeedback = async () => {
        if (!selectedId) return;

        try {
            setFeedbackLoading(true);

            const resp = await axios.post(`${API_BASE}/writing/invoke-agent-writing`, {
                user_id: userId,
                chat_id: "writing",
                doc_id: selectedId
            });

            const feedbackArray = Array.isArray(resp.data) ? resp.data : [];

            setCurrentFeedback(feedbackArray);
            setAiFeedback(feedbackArray);

            setFeedbackCache(prev => ({
                ...prev,
                [selectedId]: feedbackArray
            }));

        } catch (err) {
            console.error("Feedback error:", err);
        } finally {
            setFeedbackLoading(false);
        }
    };


    const submitText = async () => {
        if (!newDocName.trim()) {
            alert("Please enter a valid document name.");
            return;
        }
        if (!hasRealText) {
            alert("Document is empty — please write something first.");
            return;
        }

        try {
            const fileName = newDocName.trim();

            const resp = await axios.post(
                `${API_BASE}/users/upload-text/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`,
                { text: editorText.text },
                { headers: { "Content-Type": "application/json" } }
            );

            // Refresh docs
            const listResp = await axios.get(
                `${API_BASE}/users/documents/${encodeURIComponent(userId)}`,
                { headers: { 'Content-Type': 'application/json' } }
            );

            const docs = listResp.data.documents;
            setDocuments(docs);

            // Select the new doc
            const newDoc = docs.find(d => d.doc_id === resp.data.doc_id);
            if (newDoc) {
                setSelectedId(newDoc.doc_id);
                setViewMode("pdf");
            }

            // Reset modal + editor + feedback
            setShowNameModal(false);
            setNewDocName("");
            setEditorText({ html: "", text: "" });
            setCurrentFeedback(null);
            setAiFeedback([]);
            setExpanded([]);

            alert("Document submitted successfully!");

        } catch (err) {
            console.error("Failed to submit text document:", err);
            alert("Submission failed.");
        }
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
                                if (selectedId && currentFeedback) {
                                    setFeedbackCache(prev => ({
                                        ...prev,
                                        [selectedId]: currentFeedback
                                    }));
                                }

                                setSelectedId(null);
                                setPdfUrl(null);

                                setViewMode("editor");

                                setCurrentFeedback(null);
                                setAiFeedback([]);
                                setExpanded([]);
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
                        onClick={() => {
                            if (selectedId && currentFeedback) {
                                setFeedbackCache(prev => ({
                                    ...prev,
                                    [selectedId]: currentFeedback
                                }));
                            }

                            setSelectedId(doc.doc_id);
                            setViewMode("pdf");

                            const cached = feedbackCache[doc.doc_id];
                            setCurrentFeedback(cached || null);
                            setAiFeedback(cached || []);
                        }}
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
                    <RichTextEditor onChange={(val) => setEditorText(val)} />
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
                <div className="feedback-header-row">
                    <h2 style={{ color: "#fff" }}>Feedback</h2>
                    {selectedId && (
                        <button
                            className="get-feedback-btn"
                            onClick={handleGetFeedback}
                            disabled={feedbackLoading}
                        >
                            {feedbackLoading ? "Loading..." : "Get Feedback"}
                        </button>
                    )}

                </div>
                <div className="advice-placeholder">
                    {aiFeedback.map((fb, idx) => (
                        <div key={idx} className="feedback-entry">
                            <button
                                className="feedback-title"
                                onClick={() => toggleExpand(idx)}
                                aria-expanded={expanded.includes(idx)}
                            >
                                {fb.category_label || fb.title}
                                <span className={`feedback-arrow${expanded.includes(idx) ? " expanded" : ""}`}>
                                    ▶
                                </span>
                            </button>
                            {expanded.includes(idx) && (
                                <div className="feedback-details">
                                    {fb.suggestion || fb.details}
                                </div>
                            )}
                        </div>
                    ))}
                    {viewMode === "editor" && hasRealText && (
                        <button
                            className="submit-doc-btn"
                            onClick={() => setShowNameModal(true)}
                        >
                            Submit Document
                        </button>
                    )}
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
            {showNameModal && (
                <div className="modal-overlay">
                    <div className="modal-card submit-doc-modal">
                        <h3>Name Your Document</h3>

                        <input
                            type="text"
                            className="modal-input large-input"
                            placeholder="Enter document name..."
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            autoFocus
                        />

                        <div className="modal-buttons">
                            <button
                                className="modal-submit-green"
                                disabled={newDocName.trim() === ""}
                                onClick={submitText}
                            >
                                Submit
                            </button>

                            <button
                                className="modal-cancel"
                                onClick={() => {
                                    setShowNameModal(false);
                                    setNewDocName("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Write;