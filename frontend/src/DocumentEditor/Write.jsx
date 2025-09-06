import "./Write.css";
import { useState } from "react";

// Example data
const writings = [
    { id: 1, title: "My First Essay", lastEdited: "2024-06-01" },
    { id: 2, title: "Travel Reflections", lastEdited: "2024-06-10" },
    { id: 3, title: "Language Learning Goals", lastEdited: "2024-06-15" },
    { id: 4, title: "A Day at the Beach", lastEdited: "2024-06-16" },
    { id: 5, title: "Favorite Books", lastEdited: "2024-06-17" },
    { id: 6, title: "Learning Spanish", lastEdited: "2024-06-18" },
    { id: 7, title: "My Hometown", lastEdited: "2024-06-19" },
    { id: 8, title: "Dream Vacation", lastEdited: "2024-06-20" },
    { id: 9, title: "Childhood Memories", lastEdited: "2024-06-21" },
    { id: 10, title: "A Memorable Meal", lastEdited: "2024-06-22" },
    { id: 11, title: "Daily Routine", lastEdited: "2024-06-23" },
    { id: 12, title: "Learning from Mistakes", lastEdited: "2024-06-24" },
    { id: 13, title: "Favorite Movie", lastEdited: "2024-06-25" },
    { id: 14, title: "Weekend Activities", lastEdited: "2024-06-26" },
    { id: 15, title: "My Pet", lastEdited: "2024-06-27" },
    { id: 16, title: "A Difficult Decision", lastEdited: "2024-06-28" },
    { id: 17, title: "Best Friend", lastEdited: "2024-06-29" },
    { id: 18, title: "Learning English", lastEdited: "2024-06-30" },
    { id: 19, title: "Favorite Sport", lastEdited: "2024-07-01" },
    { id: 20, title: "A Funny Story", lastEdited: "2024-07-02" },
    { id: 21, title: "My Family", lastEdited: "2024-07-03" },
    { id: 22, title: "A New Hobby", lastEdited: "2024-07-04" },
    { id: 23, title: "Overcoming Fear", lastEdited: "2024-07-05" },
    { id: 24, title: "Favorite Food", lastEdited: "2024-07-06" },
    { id: 25, title: "A Special Gift", lastEdited: "2024-07-07" },
    { id: 26, title: "Learning to Cook", lastEdited: "2024-07-08" },
    { id: 27, title: "A Rainy Day", lastEdited: "2024-07-09" },
    { id: 28, title: "My Favorite Place", lastEdited: "2024-07-10" },
    { id: 29, title: "A Lesson Learned", lastEdited: "2024-07-11" },
    { id: 30, title: "Future Plans", lastEdited: "2024-07-12" },
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
    },
    {
        title: "Punctuation Advice",
        details: "Add a comma after introductory phrases, such as in 'After dinner we went for a walk.' → 'After dinner, we went for a walk.'"
    },
    {
        title: "Word Choice",
        details: "Consider replacing 'nice' with a more descriptive adjective like 'pleasant' or 'enjoyable' in your conclusion."
    },
    {
        title: "Tense Consistency",
        details: "Maintain the same tense throughout your story. You switched from past to present tense in the second paragraph."
    },
    {
        title: "Clarity Improvement",
        details: "The phrase 'it was big' is vague. Specify what 'it' refers to for better clarity."
    },
    {
        title: "Paragraph Structure",
        details: "Start a new paragraph when you introduce a new idea or topic to improve readability."
    },
    {
        title: "Pronoun Reference",
        details: "Make sure pronouns clearly refer to the correct noun. In 'When Anna met Maria, she was happy,' clarify who 'she' refers to."
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

            {/* Center: Editor */}
            <main className="writing-editor">
                <div className="editor-placeholder">
                    {/* Replace this with your custom editor implementation */}
                    <h3>Text Editor Area</h3>
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