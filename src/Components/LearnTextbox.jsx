import './LearnTextbox.css';
import { useState } from 'react';

const LearnTextbox = ({ onSend }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() === "") return;
        onSend(input);
        setInput("");
    };


    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            const textarea = e.target;
            if (textarea.selectionStart === textarea.value.length && textarea.selectionEnd === textarea.value.length) {
                e.preventDefault();
                handleSubmit(e);
            }
        }
    };

    return (
        <form className="textbox-container" onSubmit={handleSubmit}>
            <textarea
                className="textbox-input"
                placeholder="Enter text..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
            />
        </form>
    );
};

export default LearnTextbox;