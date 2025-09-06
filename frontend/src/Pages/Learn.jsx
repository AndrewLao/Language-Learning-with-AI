import "./Learn.css"
import LearnTextBox from "../Components/LearnTextbox";
import TextDisplay from "../Components/TextDisplay";
import AssistantList from "../Components/AssistantList";
import { useState } from "react";


// Temporary messages for testing
const test_messages = [
    { role: 'user', content: 'Can you explain how binary search works?' },
    { role: 'assistant', content: 'Sure! Binary search is an efficient algorithm for finding an item from a sorted list of items...' },
    { role: 'user', content: 'Got it. Can you show an example?' },
    { role: 'assistant', content: 'Of course! Here’s a simple binary search in JavaScript: ...' },
];

// Temp assistants
const assistants = [
    { name: "Grammar Bot" },
    { name: "Vocabulary Coach" },
    { name: "Pronunciation Helper" },
    { name: "Conversation Partner" },
    { name: "Writing Tutor" },
    { name: "Reading Comprehension" },
    { name: "Listening Practice" },
    { name: "Idioms Expert" },
    { name: "Slang Specialist" },
    { name: "Translation Assistant" },
    { name: "Spelling Checker" },
]

const Learn = () => {
    const [messages, setMessages] = useState(test_messages);
    const [selectedAssistant, setSelectedAssistant] = useState(assistants[0].name);

    const handleSend = (text) => {
        if (text.trim() === "") return;
        setMessages([...messages, { role: "user", content: text }]);
    };

    return (
        <div className="learn-container">
            <div className="learn-content">
                <AssistantList
                    assistants={assistants}
                    selectedAssistant={selectedAssistant}
                    setSelectedAssistant={setSelectedAssistant}
                />
                {/* right of textbox can be explanations */}
                <div className="conversation-container">
                    <TextDisplay
                        messages={messages}
                        assistantName={selectedAssistant}
                    />
                    <LearnTextBox onSend={handleSend} />
                </div>
            </div>
        </div>
    )
};

export default Learn;