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

load_dotenv()

router = APIRouter()

# Simple in-memory conversation store to track per-chat quiz state
# Format: { chat_id: {"questions_asked": int, "answers_given": int, "score": int, "last_question": str, "finished": bool} }
conversation_store = {}
# Total number of questions per quiz
TOTAL_QUESTIONS = 3

def reset_conversation(chat_id: str):
    """Reset conversation_store entry for chat_id back to initial questioning state."""
    conversation_store[chat_id] = {"questions_asked": 0, "answers_given": 0, "score": 0, "last_question": None, "finished": False}

class AgentState(dict):
    user_id: str
    chat_id: str
    user_input: str
    memories: list
    docs: list
    response: str
    question: str
    mode: str  # "question" or "answer"
    user_answer: str  # For answer mode


class ManagerAgent:
    def __init__(self, llm_model="gpt-5"):
        self.agents = {"general_agent": self.general_agent}
        self.router = self.default_router
        self.llm = ChatOpenAI(model=llm_model)
        #self.db_client = get_qdrant_client()
        
        self.mongo_client = MongoClient(os.environ.get("ATLAS_URI"))
        
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key=os.environ.get("OPENAI_API_KEY"),
        )

        self.graph = self.build_graph()
        self.app = self.graph.compile()

    # Decide agent for the task
    # Another prompt has to go here if there are multiple agents for a task
    # Defaults to general
    def default_router(self, state: AgentState):
        print("Time default router:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {"route": "general_agent"}

    def mode_router(self, state: AgentState):
        """Route to different nodes based on mode (question or answer)"""
        print("Mode router - mode:", state.get("mode"))
        if state.get("mode") == "answer":
            return {}  # Will be handled by conditional edge
        return {}  # Will be handled by conditional edge

    def general_agent(self, state: AgentState):
        print("Time general agent:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        context = "\n".join([m.page_content for m in state.get("memories", [])])
        refs = state.get("docs", [])
        print("Test refsdew:", state.get("docs"))
        prompt = f"""
         Based on the context ask me three yes/no questions one at a time " \
        "Before show me the next question, tell me whether or not I was correct on previous question " \
        "After that show me the score.
        Context: {refs}
        """
        chat_id = state.get("chat_id")

        # Ensure a conversation record exists
        conv = conversation_store.setdefault(chat_id, {"questions_asked": 0, "answers_given": 0, "score": 0, "last_question": None, "finished": False})

        # If the quiz is already finished, return a final message
        if conv.get("finished") or conv.get("questions_asked", 0) >= TOTAL_QUESTIONS:
            conv["finished"] = True
            final_msg = f"Quiz finished. Final score: {conv.get('score',0)}/{TOTAL_QUESTIONS}"
            # reset conversation state back to initial questioning mode
            reset_conversation(chat_id)
            return {"response": final_msg, "question": ""}

        resp = self.llm.invoke(prompt)
        question_text = resp.content.strip()

        # Store the generated question and increment count
        conv["questions_asked"] = conv.get("questions_asked", 0) + 1
        conv["last_question"] = question_text

        return {"response": question_text, "question": question_text}

    def answer_evaluator(self, state: AgentState):
        """Evaluate user's answer to the question"""
        print("Time answer evaluator:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        user_answer = state.get("user_answer", "")
        chat_id = state.get("chat_id")

        # Get or create conversation record
        conv = conversation_store.setdefault(chat_id, {"questions_asked": 0, "answers_given": 0, "score": 0, "last_question": None, "finished": False})

        if conv.get("finished"):
            return {"response": f"Quiz already finished. Final score: {conv.get('score',0)}/{TOTAL_QUESTIONS}", "question": ""}

        # Evaluate the answer using LLM (expecting JSON with is_correct and explanation)
        evaluation_prompt = f"""
You are evaluating a yes/no answer for a question.

Question: {conv.get('last_question')}
User answer: {user_answer}

Respond in JSON with keys: is_correct (true/false) and said whether the answer is correct or no).
Example: {{"is_correct": true, "explanation": "Because..."}}
"""

        try:
            eval_resp = self.llm.invoke(evaluation_prompt)
            eval_text = eval_resp.content.strip()
            eval_data = json.loads(eval_text)
            is_correct = bool(eval_data.get("is_correct", False))
            explanation = eval_data.get("explanation", "")
        except Exception as e:
            # If parsing failed, fall back to simple heuristic: accept "yes"/"no" neutrally
            print(f"Evaluation parse error: {e}")
            is_correct = False
            explanation = "Could not parse evaluation from LLM."

        # Update conversation counters and score
        conv["answers_given"] = conv.get("answers_given", 0) + 1
        if is_correct:
            conv["score"] = conv.get("score", 0) + 1

        # If reached TOTAL_QUESTIONS, finish the quiz and return final summary
        if conv["answers_given"] >= TOTAL_QUESTIONS:
            conv["finished"] = True
            final_msg = f"{explanation}\n\nQuiz completed. Final score: {conv.get('score')}/{TOTAL_QUESTIONS}"
            # reset conversation state back to initial questioning mode
            reset_conversation(chat_id)
            return {"response": final_msg, "question": ""}

        # Otherwise generate the next question
        next_prompt = f"Generate one clear yes/no question to continue the quiz based on context."
        next_resp = self.llm.invoke(next_prompt)
        next_question = next_resp.content.strip()

        conv["questions_asked"] = conv.get("questions_asked", 0) + 1
        conv["last_question"] = next_question

        return {"response": f"{explanation}\n\nNext question: {next_question}", "question": next_question}

    # Aux step to filter incoming text
    def handle_user_prompt(self, state: AgentState):
        print("Time user prompt:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {"user_input": state["user_input"]}

    # Incomplete state for now until user memories updates are done
    # TODO Complete Function and Finish Short Term memory retrieval
    # TODO Make prompt to get memory if necessary to not use user input
    def retrieve_memories(self, state: AgentState):
        print("Time retrieve memories:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {"memories": []}

    def search_rag_documents(self, state: AgentState):
        print("Time search rag:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        query_text = state.get("user_input", "")

        try:
            # Add timeout and error handling
            search_result = query_qdrant('vietnamese_test_store', query_text, top_k=5)
            docs = [hit.payload.get("text", "") for hit in search_result]
            print("RAG Docs:", docs)
        except Exception as e:
            print(f"RAG search error: {e}")
            docs = ["Could not retrieve documents. Error: " + str(e)]
        
        return {"docs": docs}


    # Decides what the agent will do with the message
    # Probably not needed but I'll keep it here for now 
    def planner(self, state: AgentState):
        # Another prompt goes here if we decide that there is a specialized case
        # Planner should not re-write the entire state; return only modified keys (none)
        return {}

    # Required because of graph layout
    # Handles updating both memories and rag document outputs
    def merge_docs(self, state: AgentState, **kwargs):
        print("Time merge docs:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        combined = state.get("memories", []) + state.get("docs", [])
        return {"docs": combined}

    # Incomplete State 
    # TODO Finish short term memory and add mongo
    # TODO Test memory functions
    def update_memory(self, state: AgentState):
        print("Time update memory:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {}

    def build_graph(self):
        graph = StateGraph(AgentState)

        graph.add_node("input", self.handle_user_prompt)
        graph.add_node("memories", self.retrieve_memories)
        graph.add_node("rag_docs", self.search_rag_documents)
        graph.add_node("planner", self.planner)
        graph.add_node("mode_router", self.mode_router)
        graph.add_node("general_agent", self.general_agent)
        graph.add_node("answer_evaluator", self.answer_evaluator)
        # graph.add_node("memory_updater", self.update_memory)
        graph.add_node("merge_docs", self.merge_docs)

        graph.add_edge(START, "input")
        graph.add_edge("input", "memories")
        # graph.add_edge("memories", "merge_docs")
        graph.add_edge("memories", "rag_docs")
        graph.add_edge("rag_docs", "merge_docs")
        graph.add_edge("merge_docs", "planner")
        graph.add_edge("planner", "mode_router")
        
        # Conditional edges from mode_router
        graph.add_conditional_edges(
            "mode_router",
            self._route_by_mode,
            {
                "question": "general_agent",
                "answer": "answer_evaluator"
            }
        )
        
        graph.add_edge("general_agent", END)
        graph.add_edge("answer_evaluator", END)
        # graph.add_edge("general_agent", "memory_updater")
        # graph.add_edge("memory_updater", END)

        return graph

    def _route_by_mode(self, state: AgentState):
        """Conditional routing based on mode"""
        mode = state.get("mode", "question")
        print(f"Routing by mode: {mode}")
        return mode

    # Executes the agent pipeline
    def invoke(self, user_id, chat_id, user_input, mode="question", user_answer=""):
        state = AgentState(
            user_id=user_id,
            chat_id=chat_id,
            user_input=user_input,
            memories=[],
            docs=[],
            response="",
            mode=mode,
            user_answer=user_answer,
        )
        return self.app.invoke(state, config={"configurable": {"chat_id": chat_id}})


@router.post("/invoke-agent-test", response_model=SimpleMessageResponse)
def invoke_agent(payload: dict):
    """
    Combined endpoint for both asking and answering questions.
    
    For asking a question:
    {
        "input_string": "Topic to learn about",
        "mode": "question"  # optional, defaults to "question"
    }
    
    For answering a question:
    {
        "answer": "yes",
        "mode": "answer",
        "chat_id": "optional-chat-id"
    }
    """
    agent = ManagerAgent()
    mode = payload.get("mode", "question")
    chat_id = payload.get("chat_id", "2a8bf31a-4307-4f16-b382-7a6a6057915b")
    user_id = payload.get("user_id", "343")
    
    if mode == "question":
        input_string = payload.get("input_string", "")
        state = agent.invoke(user_id, chat_id, input_string, mode="question")
    elif mode == "answer":
        user_answer = payload.get("answer", "")
        state = agent.invoke(user_id, chat_id, "", mode="answer", user_answer=user_answer)
    else:
        return {"result": "Invalid mode. Use 'question' or 'answer'"}
    
    response_text = (
        state.get("response")
        if isinstance(state, dict)
        else getattr(state, "response", "")
    )
    return {"result": response_text}
