from dotenv import load_dotenv
from fastapi import APIRouter
import json
from langgraph.graph import StateGraph, END, START
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from api.miscellanous import save_chat_turn_sync
from services.rag_store_qdrant import get_qdrant_client, query_qdrant
from models.userschema import SimpleMessageGet, SimpleMessageResponse
import os
from pymongo import MongoClient
from qdrant_client.http.models import PointStruct
import uuid
import time
from pydantic import BaseModel
from typing import Optional

load_dotenv()

router = APIRouter()

# In-memory store for active conversations
# Format: {chat_id: {"user_id": str, "questions": [str], "current_question_index": int, "answers": [str], "score": int, "total_questions": int}}
conversation_store = {}


class QuestionPayload(BaseModel):
    input_string: str
    user_id: Optional[str] = "343"


class AnswerPayload(BaseModel):
    chat_id: str
    answer: str


class QuestionResponse(BaseModel):
    result: str
    question_number: int
    total_questions: int


class AnswerResponse(BaseModel):
    result: str
    is_correct: bool
    score: int
    next_question: Optional[str] = None
    finished: bool = False


class ScoreResponse(BaseModel):
    chat_id: str
    score: int
    total_questions: int
    percentage: float


class AgentState(dict):
    user_id: str
    chat_id: str
    user_input: str
    memories: list
    history: list
    docs: list
    response: str


class ManagerAgent:
    def __init__(self, llm_model="gpt-4o"):
        self.agents = {"general_agent": self.general_agent}
        self.router = self.default_router
        self.llm = ChatOpenAI(model=llm_model)
        
        self.mongo_client = MongoClient(os.environ.get("ATLAS_URI"))
        
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key=os.environ.get("OPENAI_API_KEY"),
        )

        self.graph = self.build_graph()
        self.app = self.graph.compile()

    def default_router(self, state: AgentState):
        return {"route": "general_agent"}

    def general_agent(self, state: AgentState):
        context = "\n".join([m.page_content for m in state.get("memories", [])])
        refs = state.get("docs", [])
        refs_text = "\n".join(refs) if isinstance(refs, list) else str(refs)
        
        prompt = f"""
You are a Vietnamese language tutor AI. Your task is to ask the user ONE yes/no question based on the context provided.

Context about Vietnamese language:
{refs_text}

The user's input was: {state.get("user_input", "")}

Generate exactly ONE clear yes/no question to test the user's understanding. 
The question should be educational and help the user learn Vietnamese.
Make it specific and answerable with yes or no.

Respond with ONLY the question, nothing else.
"""
        resp = self.llm.invoke(prompt)
        return {"response": resp.content}

    def handle_user_prompt(self, state: AgentState):
        return {"user_input": state["user_input"]}

    def retrieve_memories(self, state: AgentState):
        return {"memories": []}

    def search_rag_documents(self, state: AgentState):
        query_text = state.get("user_input", "")
        
        if not query_text.strip():
            return {"docs": ["No query provided"]}
        
        try:
            search_result = query_qdrant('vietnamese_test_store', query_text, top_k=5)
            docs = [hit.payload.get("text", "") for hit in search_result]
        except Exception as e:
            print(f"RAG search error: {e}")
            docs = ["Could not retrieve documents"]
        
        return {"docs": docs}

    def planner(self, state: AgentState):
        return {}

    def merge_docs(self, state: AgentState, **kwargs):
        combined = state.get("memories", []) + state.get("docs", [])
        return {"docs": combined}

    def build_graph(self):
        graph = StateGraph(AgentState)

        graph.add_node("input", self.handle_user_prompt)
        graph.add_node("memories", self.retrieve_memories)
        graph.add_node("rag_docs", self.search_rag_documents)
        graph.add_node("planner", self.planner)
        graph.add_node("router", self.router)
        graph.add_node("general_agent", self.general_agent)
        graph.add_node("merge_docs", self.merge_docs)

        graph.add_edge(START, "input")
        graph.add_edge("input", "memories")
        graph.add_edge("memories", "rag_docs")
        graph.add_edge("rag_docs", "merge_docs")
        graph.add_edge("merge_docs", "planner")
        graph.add_edge("planner", "router")
        graph.add_edge("router", "general_agent")
        graph.add_edge("general_agent", END)

        return graph

    def invoke(self, user_id, chat_id, user_input):
        state = AgentState(
            user_id=user_id,
            chat_id=chat_id,
            user_input=user_input,
            memories=[],
            docs=[],
            response="",
        )
        return self.app.invoke(state, config={"configurable": {"chat_id": chat_id}})


@router.post("/start-quiz", response_model=QuestionResponse)
def start_quiz(payload: QuestionPayload):
    """
    Start a new quiz session.
    
    Request body:
    {
        "input_string": "Topic to learn about, e.g., 'Vietnamese tones'",
        "user_id": "343"  # optional
    }
    
    Response:
    {
        "result": "First yes/no question here",
        "question_number": 1,
        "total_questions": 3
    }
    """
    chat_id = str(uuid.uuid4())
    user_id = payload.user_id or "343"
    
    # Initialize conversation
    conversation_store[chat_id] = {
        "user_id": user_id,
        "questions": [],
        "current_question_index": 0,
        "answers": [],
        "score": 0,
        "total_questions": 3
    }
    
    # Generate first question
    agent = ManagerAgent()
    state = agent.invoke(user_id, chat_id, payload.input_string)
    question = state.get("response", "No question generated").strip()
    
    # Store question
    conversation_store[chat_id]["questions"].append(question)
    
    return QuestionResponse(
        result=f"Question 1 of 3:\n\n{question}\n\nPlease answer 'yes' or 'no'.",
        question_number=1,
        total_questions=3
    )


@router.post("/answer-question", response_model=AnswerResponse)
def answer_question(payload: AnswerPayload):
    """
    Submit an answer to the current question.
    
    Request body:
    {
        "chat_id": "uuid-from-start-quiz",
        "answer": "yes"  # or "no"
    }
    
    Response includes:
    - result: Evaluation of the answer and next question (if available)
    - is_correct: Whether the answer was correct
    - score: Current score
    - next_question: The next question (if quiz not finished)
    - finished: Whether the quiz is complete
    """
    chat_id = payload.chat_id
    answer = payload.answer.strip().lower()
    
    # Validate conversation exists
    if chat_id not in conversation_store:
        return AnswerResponse(
            result="No active quiz found. Please start a new quiz with /start-quiz",
            is_correct=False,
            score=0,
            finished=True
        )
    
    conv = conversation_store[chat_id]
    current_index = conv["current_question_index"]
    
    # Validate answer format
    if answer not in ["yes", "no"]:
        return AnswerResponse(
            result="Invalid answer. Please answer 'yes' or 'no'.",
            is_correct=False,
            score=conv["score"],
            finished=False
        )
    
    # Store answer
    conv["answers"].append(answer)
    
    # Evaluate answer (simplified: random correctness for demo)
    # In production, you'd have a proper evaluation mechanism
    agent = ManagerAgent()
    current_question = conv["questions"][current_index]
    
    evaluation_prompt = f"""
You are evaluating a user's answer to a Vietnamese learning question.

Question: {current_question}
User's answer: {answer}

Determine if the answer is reasonable/correct for this question.
Respond in JSON format:
{{
    "is_correct": true/false,
    "explanation": "Brief explanation of why this is correct or incorrect"
}}
"""
    
    try:
        eval_resp = agent.llm.invoke(evaluation_prompt)
        eval_text = eval_resp.content.strip()
        
        # Try to parse JSON response
        eval_data = json.loads(eval_text)
        is_correct = eval_data.get("is_correct", False)
        explanation = eval_data.get("explanation", "")
    except Exception as e:
        print(f"Evaluation error: {e}")
        is_correct = False
        explanation = "Could not evaluate answer"
    
    if is_correct:
        conv["score"] += 1
    
    # Check if quiz is finished
    current_index += 1
    finished = current_index >= conv["total_questions"]
    
    result_message = f"{explanation}\n\n"
    
    if finished:
        percentage = (conv["score"] / conv["total_questions"]) * 100
        result_message += f"Quiz completed!\n\nFinal Score: {conv['score']}/{conv['total_questions']} ({percentage:.0f}%)"
        return AnswerResponse(
            result=result_message,
            is_correct=is_correct,
            score=conv["score"],
            finished=True
        )
    
    # Generate next question
    conv["current_question_index"] = current_index
    next_topic = "Continue learning Vietnamese"
    state = agent.invoke(conv["user_id"], chat_id, next_topic)
    next_question = state.get("response", "No question generated").strip()
    conv["questions"].append(next_question)
    
    question_num = current_index + 1
    result_message += f"\n\nQuestion {question_num} of {conv['total_questions']}:\n\n{next_question}\n\nPlease answer 'yes' or 'no'."
    
    return AnswerResponse(
        result=result_message,
        is_correct=is_correct,
        score=conv["score"],
        next_question=next_question,
        finished=False
    )


@router.get("/quiz-score/{chat_id}", response_model=ScoreResponse)
def get_quiz_score(chat_id: str):
    """
    Get the current score for a quiz session.
    """
    if chat_id not in conversation_store:
        return ScoreResponse(chat_id=chat_id, score=0, total_questions=0, percentage=0.0)
    
    conv = conversation_store[chat_id]
    percentage = (conv["score"] / conv["total_questions"]) * 100 if conv["total_questions"] > 0 else 0
    
    return ScoreResponse(
        chat_id=chat_id,
        score=conv["score"],
        total_questions=conv["total_questions"],
        percentage=percentage
    )


@router.delete("/quiz/{chat_id}")
def end_quiz(chat_id: str):
    """
    End a quiz session and clean up state.
    """
    if chat_id in conversation_store:
        conv = conversation_store.pop(chat_id)
        percentage = (conv["score"] / conv["total_questions"]) * 100
        return {
            "message": "Quiz ended",
            "final_score": conv["score"],
            "total_questions": conv["total_questions"],
            "percentage": percentage
        }
    return {"message": "Quiz session not found"}
