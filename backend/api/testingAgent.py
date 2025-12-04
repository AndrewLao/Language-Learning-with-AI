from dotenv import load_dotenv
from fastapi import APIRouter
from langgraph.graph import StateGraph, END, START
from langchain_openai import ChatOpenAI
from services.rag_store_qdrant import query_qdrant
from models.userschema import  SimpleMessageResponse
import os
from pymongo import MongoClient
import time
import json

load_dotenv()

router = APIRouter()

# Simple in-memory conversation store to track per-chat quiz state
# Format: { chat_id: {"questions_asked": int, "answers_given": int, "score": int, "last_question": str, "finished": bool} }
conversation_store = {}

class AgentState(dict):
    user_id: str
    chat_id: str
    user_input: str
    memories: list
    docs: list
    response: str
    question: str

class ManagerAgent:
    def __init__(self, llm_model="gpt-5"):
        self.agents = {"general_agent": self.general_agent}
        self.llm = ChatOpenAI(model=llm_model)
        self.mongo_client = MongoClient(os.environ.get("ATLAS_URI"))

        self.graph = self.build_graph()
        self.app = self.graph.compile()

    def general_agent(self, state: AgentState):
        print("Time general agent:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        refs = state.get("docs", [])
        print("Test refsdew:", state.get("docs"))
        prompt = f"""
        Based on the context ask three yes/no questions about the topics." \
        You are provided a context. The context will be a curated quiz.
        Base two questions off the context and generate 1 new question not in the context to test understanding. \
        Explain why the answer is yes or no to help understanding. \
        Return in JSON format with question, answer (yes or no), explanation as properties\
        Context: {refs}
        """
        chat_id = state.get("chat_id")

        # Ensure a conversation record exists
        conv = conversation_store.setdefault(chat_id, {"questions_asked": 0, "answers_given": 0, "score": 0, "last_question": None, "finished": False})

        resp = self.llm.invoke(prompt)
        question_text = resp.content.strip()

        # Store the generated question and increment count
        conv["questions_asked"] = conv.get("questions_asked", 0) + 1
        conv["last_question"] = question_text

        return {"response": question_text, "question": question_text}

    # Aux step to filter incoming text
    def handle_user_prompt(self, state: AgentState):
        print("Time user prompt:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {"user_input": state["user_input"]}

    def retrieve_memories(self, state: AgentState):
        print("Time retrieve memories:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {"memories": []}

    def search_rag_documents(self, state: AgentState):
        print("Time search rag:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        query_text = state.get("user_input", "")

        try:
            search_result = query_qdrant('vietnamese_test_store', query_text, top_k=1)
            docs = [hit.payload.get("text", "") for hit in search_result]
            print("RAG Docs:", docs)
        except Exception as e:
            print(f"RAG search error: {e}")
            docs = ["Could not retrieve documents. Error: " + str(e)]
        
        return {"docs": docs}

    def planner(self, state: AgentState):
        return {}

    # Required because of graph layout
    # Handles updating both memories and rag document outputs
    def merge_docs(self, state: AgentState, **kwargs):
        print("Time merge docs:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        combined = state.get("memories", []) + state.get("docs", [])
        return {"docs": combined}

    def update_memory(self, state: AgentState):
        print("Time update memory:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {}

    def build_graph(self):
        graph = StateGraph(AgentState)

        graph.add_node("input", self.handle_user_prompt)
        graph.add_node("memories", self.retrieve_memories)
        graph.add_node("rag_docs", self.search_rag_documents)
        graph.add_node("planner", self.planner)
        graph.add_node("general_agent", self.general_agent)
        graph.add_node("merge_docs", self.merge_docs)

        graph.add_edge(START, "input")
        graph.add_edge("input", "memories")
        graph.add_edge("memories", "rag_docs")
        graph.add_edge("rag_docs", "merge_docs")
        graph.add_edge("merge_docs", "planner")
        graph.add_edge("planner", "general_agent")
        graph.add_edge("general_agent", END)

        return graph

    # Executes the agent pipeline
    def invoke(self, user_id, chat_id, user_input):
        state = AgentState(
            user_id=user_id,
            chat_id=chat_id,
            user_input=user_input,
            memories=[],
            docs=[],
            response=""
        )
        return self.app.invoke(state, config={"configurable": {"chat_id": chat_id}})


@router.post("/invoke-agent-test")
def invoke_agent(payload: dict):
    """

    For asking a question:
    {
        "input_string": "Topic to learn about",
        "user_id": "optional-user-id",
        "chat_id": "optional-chat-id"
    }
    """
    agent = ManagerAgent()

    chat_id = payload.get("chat_id")
    user_id = payload.get("user_id")

    # Use `input_string` as the single input field for both asking and answering
    input_string = payload.get("input_string", "")

    state = agent.invoke(user_id, chat_id, input_string)
   
    response_text = (
        state.get("response")
        if isinstance(state, dict)
        else getattr(state, "response", "")
    )
    return json.loads(response_text)
