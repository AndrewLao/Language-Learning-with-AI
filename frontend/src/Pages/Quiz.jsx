import "./Quiz.css";
import { useState } from "react";

// Yes/No questions with explanations
const exampleQuestions = [
    {
        id: 1,
        question: "Is 'xin chào' a common greeting in Vietnamese?",
        answer: "yes",
        explanation:
            "Xin chào is a widely used, polite greeting appropriate in formal and informal situations. Shorter forms like 'chào' exist, but 'xin chào' is the neutral option.",
    },
    {
        id: 2,
        question: "Does changing the tone of a Vietnamese word change its meaning?",
        answer: "yes",
        explanation:
            "Vietnamese is tonal. Changing the tone changes the meaning completely. Words like 'ma', 'mà', and 'má' are distinct despite similar letters.",
    },
    {
        id: 3,
        question: "Is Vietnamese written with the Latin alphabet?",
        answer: "yes",
        explanation:
            "Yes. Modern Vietnamese uses quốc ngữ, a Latin-based alphabet with tone marks.",
    },
    {
        id: 4,
        question: "Is 'cảm ơn' used to say thank you?",
        answer: "yes",
        explanation:
            "'Cảm ơn' means 'thank you'. Adding pronouns like 'anh/chị/em' can make it more polite.",
    },
    {
        id: 5,
        question: "Does the Northern dialect have six tones?",
        answer: "yes",
        explanation:
            "Northern Vietnamese has six tones. Southern dialects usually have five.",
    },
];

const quizzes = [
    { id: 1, title: "Vocabulary Basics", lastTaken: "2025-01-11" },
    { id: 2, title: "Tone Test", lastTaken: "2025-01-20" },
    { id: 3, title: "AI-generated Quiz", lastTaken: "2025-02-01" },
];

const Quiz = () => {
    const [selectedId, setSelectedId] = useState(quizzes[0].id);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [quizComplete, setQuizComplete] = useState(false);
    const [score, setScore] = useState(0);

    const totalQuestions = exampleQuestions.length;
    const current = exampleQuestions[currentIndex];

    const handleAnswer = (answer) => {
        // Score if correct
        if (answer === current.answer) {
            setScore((prev) => prev + 1);
        }
        setShowExplanation(true);
    };

    const nextQuestion = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowExplanation(false);
        } else {
            setQuizComplete(true);
        }
    };

    const restartQuiz = () => {
        setCurrentIndex(0);
        setShowExplanation(false);
        setQuizComplete(false);
        setScore(0);
    };

    return (
        <div className="quiz-container">

            {/* SIDEBAR */}
            <aside className="quiz-list">
                <div className="quiz-list-header">
                    <h2>Quizzes</h2>
                </div>
                {quizzes.map((q) => (
                    <div
                        key={q.id}
                        className={`quiz-list-item${selectedId === q.id ? " selected" : ""}`}
                        onClick={() => {
                            setSelectedId(q.id);
                            restartQuiz();
                        }}
                    >
                        <span className="quiz-title">{q.title}</span>
                    </div>
                ))}
            </aside>

            {/* MAIN CONTENT */}
            <div className="quiz-content">

                {/* PROGRESS BAR (hidden after completion) */}
                {!quizComplete && (
                    <div className="quiz-progress">
                        <div
                            className="quiz-progress-fill"
                            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                        >
                            <span className="quiz-progress-text">
                                {currentIndex + 1} / {totalQuestions}
                            </span>
                        </div>
                    </div>
                )}

                {/* QUIZ COMPLETE CARD */}
                {quizComplete ? (
                    <div className="quiz-card">
                        <h2 className="quiz-complete-title">Quiz Complete!</h2>
                        <p className="quiz-score">Score: {score} / {totalQuestions}</p>

                        <button className="quiz-btn yes" onClick={restartQuiz}>
                            Restart Quiz
                        </button>
                    </div>
                ) : (
                    <div className="quiz-card">
                        <h3 className="quiz-question-number">Question {currentIndex + 1}</h3>

                        <p className="quiz-question-text">{current.question}</p>

                        {/* Explanation after answering */}
                        {!showExplanation ? (
                            <div className="quiz-buttons">
                                <button className="quiz-btn yes" onClick={() => handleAnswer("yes")}>
                                    Yes
                                </button>
                                <button className="quiz-btn no" onClick={() => handleAnswer("no")}>
                                    No
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="quiz-explanation">
                                    <h4>AI Explanation</h4>
                                    <div className="quiz-explanation-box">
                                        {current.explanation}
                                    </div>
                                </div>

                                <div className="quiz-buttons">
                                    <button className="quiz-btn yes" onClick={nextQuestion}>
                                        Next
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Quiz;
