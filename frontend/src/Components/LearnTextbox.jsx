import './LearnTextbox.css';
import { useState, useRef, useEffect } from 'react';

const LearnTextbox = ({ onSend, loading }) => {
    const [input, setInput] = useState("");
    const textareaRef = useRef(null);

    // Auto-resize handler
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";   // reset height so shrink works too
        textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
        // 160px ≈ 8em → your current max-height
    }, [input]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        if (input.trim() === "") return;

        onSend(input);
        setInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            const textarea = e.target;
            if (
                textarea.selectionStart === textarea.value.length &&
                textarea.selectionEnd === textarea.value.length
            ) {
                e.preventDefault();
                handleSubmit(e);
            }
        }
    };

    return (
        <form className="textbox-container" onSubmit={handleSubmit}>
            <div className="textbox-wrapper">
                <textarea
                    ref={textareaRef}
                    className="textbox-input"
                    placeholder={loading ? "Agent is thinking..." : "Enter text..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />

                <button
                    type="submit"
                    className="send-button"
                    disabled={loading || input.trim() === ""}
                >
                    ➤
                </button>
            </div>
        </form>
    );
};

export default LearnTextbox;
