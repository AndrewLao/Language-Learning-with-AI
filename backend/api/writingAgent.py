from dotenv import load_dotenv
from fastapi import APIRouter
from langgraph.graph import StateGraph, END, START
from langchain_openai import ChatOpenAI
import os
from pymongo import MongoClient
import time
import json

load_dotenv()

router = APIRouter()

class AgentState(dict):
    user_id: str
    chat_id: str
    user_input: str
    memories: list
    docs: list
    response: str

class ManagerAgent:
    def __init__(self, llm_model="gpt-5"):
        self.agents = {"general_agent": self.general_agent}
        self.llm = ChatOpenAI(model=llm_model)
        self.mongo_client = MongoClient(os.environ.get("ATLAS_URI"))

        self.graph = self.build_graph()
        self.app = self.graph.compile()

    def general_agent(self, state: AgentState):
        print("Time general agent:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        written_text = state.get("user_input", "")
        prompt = f"""
        Read this text in Vietnamese and tell me how to improve it " \
        "Respond in English with json format with (category to improve name [spelling, grammar, etc]): suggestion"\
        "Limit each suggestion to maximum 25 words and limit for 5 categories"\
        The text: {written_text }
        """
        
        resp = self.llm.invoke(prompt)
        print("Generated response:", resp.content.strip())

        return {"response": resp.content}

    # Aux step to filter incoming text
    def handle_user_prompt(self, state: AgentState):
        print("Time user prompt:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {"user_input": state["user_input"]}

    def retrieve_memories(self, state: AgentState):
        print("Time retrieve memories:", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        return {"memories": []}

    def search_rag_documents(self, state: AgentState):
        return {}

    def planner(self, state: AgentState):
        # Another prompt goes here if we decide that there is a specialized case
        # Planner should not re-write the entire state; return only modified keys (none)
        return {}

    # Required because of graph layout
    # Handles updating both memories and rag document outputs
    def merge_docs(self, state: AgentState, **kwargs):
        return {}

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


@router.post("/invoke-agent-writing")
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
        state.get("response", "{}").strip()
    )
    print("Final response text:", response_text)
    return json.loads(response_text)
