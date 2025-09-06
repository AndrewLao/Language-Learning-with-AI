import React from 'react';
import './AssistantList.css';

const AssistantList = ({ assistants, selectedAssistant, setSelectedAssistant }) => {
    return (
        <div className="assistant-list">
            <h2>Assistant List</h2>
            {assistants.map((assistant, idx) => (
                <div
                    className={`assistant-item${selectedAssistant === assistant.name ? " selected" : ""}`}
                    key={idx}
                    onClick={() => setSelectedAssistant(assistant.name)}
                >
                    {assistant.name}
                </div>
            ))}
        </div>
    );
};

export default AssistantList;