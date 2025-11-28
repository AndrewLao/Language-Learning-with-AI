import "./Quiz.css";
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;
const API_INVOKE_AGENT_TEST = `${API_BASE}/test/invoke-agent-test`;
const API_QUIZ_SUBMIT = `${API_BASE}/users/quiz/submit`;
const API_QUIZ_HISTORY = `${API_BASE}/users/quiz`;

const builtInQuizzes = [
    { id: 1, title: "AI Generated Quiz" },

];

const Quiz = () => {
    const userId = localStorage.getItem("cognitoSub") || "test_user";

    // Mode tracking
    const [mode, setMode] = useState("menu"); // menu | active | review

    // Built-in quizzes
    const [selectedId, setSelectedId] = useState(builtInQuizzes[0].id);

    // Generated quiz state
    const [questions, setQuestions] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showExplanation, setShowExplanation] = useState(false);
    const [quizComplete, setQuizComplete] = useState(false);
    const [score, setScore] = useState(0);

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Past quizzes
    const [pastQuizzes, setPastQuizzes] = useState([]);
    const [loadingPast, setLoadingPast] = useState(false);

    // Currently selected past quiz
    const [reviewQuiz, setReviewQuiz] = useState(null);

    // ------------------------------------------
    // Load past quizzes from backend
    // ------------------------------------------
    const loadPastQuizzes = async () => {
        setLoadingPast(true);
        try {
            const res = await axios.get(`${API_QUIZ_HISTORY}/${userId}`);
            setPastQuizzes(res.data);
        } catch (err) {
            console.error("Failed to load past quizzes", err);
        }
        setLoadingPast(false);
    };

    useEffect(() => {
        loadPastQuizzes();
    }, []);

    // ------------------------------------------
    // Start a new generated quiz
    // ------------------------------------------
    const loadQuiz = async () => {
        setMode("active");
        setLoading(true);
        setError(null);

        setQuestions(null);
        setCurrentIndex(0);
        setScore(0);
        setShowExplanation(false);
        setQuizComplete(false);
        setSaveSuccess(false);

        try {
            const res = await axios.post(API_INVOKE_AGENT_TEST, {
                input_string: "Generate quiz questions",
                user_id: userId,
                chat_id: "quiz-session"
            });

            if (!Array.isArray(res.data)) throw new Error("Invalid LLM JSON.");

            const normalized = res.data.map((q, idx) => ({
                id: idx + 1,
                question: q.question || "",
                answer: q.answer?.toLowerCase() === "yes" ? "yes" : "no",
                explanation: q.explanation || "No explanation provided.",
                user_answer: null
            }));

            setQuestions(normalized);
        } catch (err) {
            console.log(err);
            setError("Failed to load quiz questions.");
        }

        setLoading(false);
    };

    const saveQuizResult = async () => {
        if (!questions) return;

        setSaving(true);

        const payload = {
            user_id: userId,
            quiz_id: `quiz-${Date.now()}`,
            score,
            total_questions: questions.length,
            questions: questions.map((q) => ({
                question: q.question,
                correct_answer: q.answer,
                user_answer: q.user_answer || "no-response",
                explanation: q.explanation,
                is_correct: q.user_answer === q.answer
            }))
        };

        try {
            const res = await axios.post(API_QUIZ_SUBMIT, payload);
            if (res.data?.success) {
                setSaveSuccess(true);
                loadPastQuizzes();
            }
        } catch (err) {
            console.error("Quiz save error:", err);
        }

        setSaving(false);
    };

    const handleAnswer = (answer) => {
        setQuestions(prev => {
            const updated = [...prev];
            updated[currentIndex] = {
                ...updated[currentIndex],
                user_answer: answer
            };
            return updated;
        });

        if (answer === questions[currentIndex].answer) {
            setScore(prev => prev + 1);
        }

        setShowExplanation(true);
    };

    const nextQuestion = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowExplanation(false);
        } else {
            setQuizComplete(true);
            await saveQuizResult();
        }
    };

    const selectPastQuiz = (quiz) => {
        setMode("review");
        setReviewQuiz(quiz);
    };

    const handleQuizSelect = (id) => {
        setMode("menu");
        setSelectedId(id);
        setQuestions(null);
        setReviewQuiz(null);
    };

    return (
        <div className="quiz-container">

            {/* SIDEBAR */}
            <aside className="quiz-list">
                <div className="quiz-list-header">
                    <h2>Quizzes</h2>
                </div>

                {builtInQuizzes.map((q) => (
                    <div
                        key={q.id}
                        className={`quiz-list-item${selectedId === q.id && mode !== "review" ? " selected" : ""}`}
                        onClick={() => handleQuizSelect(q.id)}
                    >
                        <span className="quiz-title">{q.title}</span>
                    </div>
                ))}

                <div className="quiz-divider"></div>

                <h4 style={{ margin: "0.5em 0" }}>Past Results</h4>
                {loadingPast ? (
                    <p>Loading…</p>
                ) : pastQuizzes.length === 0 ? (
                    <p>No past quizzes</p>
                ) : (
                    pastQuizzes.map((quiz, idx) => {
                        const date = new Date(quiz.timestamp);
                        const formatted = date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        });

                        return (
                            <div
                                key={idx}
                                className="quiz-list-item"
                                onClick={() => selectPastQuiz(quiz)}
                            >
                                <span className="quiz-title">
                                    {formatted} — {quiz.score}/{quiz.total_questions}
                                </span>
                            </div>
                        );
                    })
                )}
            </aside>

            <div className="quiz-content">

                {mode === "review" && reviewQuiz && (
                    <div className="quiz-card">
                        <h2>Past Quiz Review</h2>
                        <p className="quiz-score">
                            Score: {reviewQuiz.score} / {reviewQuiz.total_questions}
                        </p>

                        {reviewQuiz.questions.map((q, idx) => (
                            <div key={idx} className="quiz-review-item">
                                <h3>Question {idx + 1}</h3>
                                <p className="quiz-question-text">{q.question}</p>

                                <p className="quiz-review-answer">
                                    <strong>Your Answer:</strong> {q.user_answer}
                                </p>

                                <p className="quiz-review-answer">
                                    <strong>Correct Answer:</strong> {q.correct_answer}
                                </p>

                                <p className={q.is_correct ? "quiz-correct" : "quiz-incorrect"}>
                                    {q.is_correct ? "✔ Correct" : "✘ Incorrect"}
                                </p>

                                <div className="quiz-explanation-box">
                                    {q.explanation}
                                </div>

                                <hr />
                            </div>
                        ))}
                    </div>
                )}

                {mode === "menu" && (
                    <div className="quiz-card">
                        <h3>Start: {builtInQuizzes.find(q => q.id === selectedId)?.title}</h3>
                        <button className="quiz-btn yes" onClick={loadQuiz}>
                            Start Quiz
                        </button>
                    </div>
                )}

                {mode === "active" && (
                    <>
                        {loading && (
                            <div className="quiz-loading-screen">
                                <div className="quiz-spinner"></div>
                                <p>Generating Quiz...</p>
                            </div>
                        )}

                        {error && (
                            <div className="quiz-card">
                                <p className="error-text">{error}</p>
                                <button className="quiz-btn yes" onClick={loadQuiz}>Try Again</button>
                            </div>
                        )}

                        {questions && !loading && !error && (
                            <>
                                {!quizComplete && (
                                    <div className="quiz-progress">
                                        <div
                                            className="quiz-progress-fill"
                                            style={{
                                                width: `${((currentIndex + 1) / questions.length) * 100}%`
                                            }}
                                        >
                                            <span className="quiz-progress-text">
                                                {currentIndex + 1} / {questions.length}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="quiz-card">
                                    {quizComplete ? (
                                        <>
                                            <h2 className="quiz-complete-title">Quiz Complete!</h2>
                                            <p className="quiz-score">Score: {score} / {questions.length}</p>

                                            {saving && <p>Saving quiz…</p>}
                                            {saveSuccess && <p style={{ color: "#4ade80" }}>✔ Saved!</p>}

                                            <button className="quiz-btn yes" onClick={() => loadQuiz()}>
                                                New Quiz
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="quiz-question-number">
                                                Question {currentIndex + 1}
                                            </h3>

                                            <p className="quiz-question-text">
                                                {questions[currentIndex].question}
                                            </p>

                                            {!showExplanation ? (
                                                <div className="quiz-buttons">
                                                    <button className="quiz-btn yes"
                                                        onClick={() => handleAnswer("yes")}>
                                                        Yes
                                                    </button>

                                                    <button className="quiz-btn no"
                                                        onClick={() => handleAnswer("no")}>
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="quiz-explanation">
                                                        <h4>AI Explanation</h4>
                                                        <div className="quiz-explanation-box">
                                                            {questions[currentIndex].explanation}
                                                        </div>
                                                    </div>

                                                    <button className="quiz-btn yes" onClick={nextQuestion}>
                                                        Next
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Quiz;
