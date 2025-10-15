from langchain_openai import ChatOpenAI
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_core.prompts import (
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    ChatPromptTemplate
)
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o",
    api_key=os.environ.get("OPENAI_API_KEY"),
)

system = SystemMessagePromptTemplate.from_template(
    "You are helpful assistant. Use this context to answer questions: {context}"
)
human = HumanMessagePromptTemplate.from_template("{input}")

messages = [system, MessagesPlaceholder(variable_name="history"), human]
prompt = ChatPromptTemplate(messages)
chain = prompt | llm | StrOutputParser()

def get_session_history(session_id):
    return SQLChatMessageHistory(session_id, connection="sqlite:///chat_history.db")

runnable_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

def chat_with_llm(session_id, input, context_str=""):
    output = runnable_with_history.invoke(
        {"input": input, "context": context_str},
        config={"configurable": {"session_id": session_id}},
    )
    return output

# Example usage
context_str = "Vietnamese has six tones which influence meaning."
print(chat_with_llm("test_session", "Explain the tones in Vietnamese.", context_str))
