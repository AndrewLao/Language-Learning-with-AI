import "./Write.css";
import { useState } from "react";
import RichTextEditor from "../Components/RichTextEditor";

// Example data
const writings = [
    { id: 1, title: "My First Essay", lastEdited: "2024-06-01" },
    { id: 2, title: "Travel Reflections", lastEdited: "2024-06-10" },
    { id: 3, title: "Language Learning Goals", lastEdited: "2024-06-15" },
    { id: 4, title: "A Day at the Beach", lastEdited: "2024-06-16" },
    { id: 5, title: "Favorite Books", lastEdited: "2024-06-17" },
];

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
    const [selectedId, setSelectedId] = useState(writings[0].id);
    const [expanded, setExpanded] = useState([]);
    const [showNewTooltip, setShowNewTooltip] = useState(false);
    const [showUploadTooltip, setShowUploadTooltip] = useState(false);


    const toggleExpand = (idx) => {
        setExpanded(expanded =>
            expanded.includes(idx)
                ? expanded.filter(i => i !== idx)
                : [...expanded, idx]
        );
    };

    return (
        <div className="write-editor-container">
            <aside className="writing-list">
                <div className="writing-list-header">
                    <h2>Documents</h2>
                    <div className="writing-list-actions">
                        <button
                            className="icon-btn"
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
                    </div>
                </div>
                {writings.map((w) => (
                    <div
                        key={w.id}
                        className={`writing-list-item${selectedId === w.id ? " selected" : ""}`}
                        onClick={() => setSelectedId(w.id)}
                    >
                        <span className="writing-title">{w.title}</span>
                        <span className="writing-date">{w.lastEdited}</span>
                    </div>
                ))}
            </aside>

            <main className="writing-editor">
                <div className="editor-placeholder">
                    <RichTextEditor />
                </div>
            </main>

            <aside className="writing-advice">
                <h3 style={{ color: "#fff" }}>Feedback</h3>
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
        </div>
    );
};

export default Write;