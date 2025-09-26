from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI


class AgentState(dict):
    user_id: str
    thread_id: str
    user_input: str
    memories: list
    docs: list
    response: str


class ManagerAgent:
    def __init__(self, llm_model="gpt-4o-mini"):
        # can be extended later to other agent types if we want
        self.agents = {"general_agent": self.general_agent}
        self.router = self.default_router
        self.llm = ChatOpenAI(model=llm_model)
        # TODO: vector DB here
        # Change this to prod DB later but it is local for now
        self.vectorstore = None
        # TODO: RAG store here
        # Currently unused because unimplemented
        self.rag_store = None
        self.graph = self.build_graph()
        # Replace with SQL or Redis or something later for multi-user support
        self.checkpointer = MemorySaver()

    # Decide agent for the task
    # Defaults to general
    def default_router(self, state: AgentState):
        return {"route": "general_agent"}

    def general_agent(self, state: AgentState):
        # TODO: insert prompt building and LLM call here
        context = "\n".join([m.page_content for m in state.get("memories", [])])
        refs = "\n".join([d.page_content for d in state.get("docs", [])])
        prompt = f"""
        You are a Vietnamese language tutor.
        User input: {state["user_input"]}

        Relevant user memories:
        {context}

        Relevant reference docs:
        {refs}

        Provide a clear answer with Vietnamese examples + English translation + grammar explanations if relevant.
        """
        resp = self.llm.invoke(prompt)
        return {"response": resp.content}

    # Incoming user message
    def handle_user_prompt(self, state: AgentState):
        return {"user_input": state["user_input"]}

    # TODO: query vectorstore for long-term memory filtered by user_id
    def retrieve_memories(self, state: AgentState):
        return {"memories": []}

    # TODO: query RAG docs for relevant knowledge
    def search_rag_documents(self, state: AgentState):
        return {"docs": []}

    # Decides what the agent will do with the message
    # Could decide to correct, quiz, or just pass through
    def planner(self, state: AgentState):
        return state

    # TODO: construct query for RAG based on user input
    def build_rag_query(self, state: AgentState):
        return state

    # Could be something like user's good at X or bad at X
    # TODO: extract new facts/errors and store in vector DB
    def update_memory(self, state: AgentState):
        return state

    def build_graph(self):
        graph = StateGraph(AgentState)

        # Nodes
        graph.add_node("input", self.handle_user_prompt)
        graph.add_node("memories", self.retrieve_memories)
        graph.add_node("docs", self.search_rag_documents)
        graph.add_node("planner", self.planner)
        graph.add_node("rag_query", self.build_rag_query)
        graph.add_node("router", self.router)
        graph.add_node("general_agent", self.general_agent)
        graph.add_node("memory_updater", self.update_memory)

        # Edges
        graph.add_edge("input", "memories")
        graph.add_edge("input", "rag_query")
        graph.add_edge("rag_query", "docs")
        graph.add_edge("memories", "planner")
        graph.add_edge("docs", "planner")
        graph.add_edge("planner", "router")
        # Route to agent (currently only general_agent)
        graph.add_edge("router", "general_agent")
        graph.add_edge("general_agent", "memory_updater")
        graph.add_edge("memory_updater", END)

        return graph

    # Main interface with the class
    def invoke(self, user_id, thread_id, user_input):
        state = AgentState(
            user_id=user_id,
            thread_id=thread_id,
            user_input=user_input,
            memories=[],
            docs=[],
            response="",
        )
        return self.graph.invoke(
            state, config={"configurable": {"thread_id": thread_id}}
        )


if __name__ == "__main__":
    agent = ManagerAgent()

    # Sample calling
    # result_a = agent.invoke(
    #     "u123", "u123-session1", "What’s the difference between hỏi and ngã?"
    # )
    # print(result_a["response"])
