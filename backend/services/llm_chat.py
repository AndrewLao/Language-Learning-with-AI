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
# from mistralai import Mistral
from langchain_mistralai.chat_models import ChatMistralAI
import os
from ClaudeChatModel import ClaudeChatModel
load_dotenv()

llm_mistral = ChatMistralAI(api_key=os.environ.get("MISTRAL_API_KEY"), model="open-mistral-nemo-2407")
llm_claude = ClaudeChatModel(api_key=os.getenv("ANTHROPIC_API_KEY"))

llm = ChatOpenAI(
    model="gpt-4o",
    api_key=os.environ.get("OPENAI_API_KEY"),
)

# run by python manage.py runserver
system = SystemMessagePromptTemplate.from_template("You are helpful assistant ")
system_with_context = SystemMessagePromptTemplate.from_template(
    "You are helpful assistant. Use this context to answer questions: {context}"
)
human = HumanMessagePromptTemplate.from_template("{input}")

messages = [system, MessagesPlaceholder(variable_name="history"), human]
messages_with_context = [system_with_context, MessagesPlaceholder(variable_name="history"), human]

prompt = ChatPromptTemplate(messages)
prompt_with_context = ChatPromptTemplate(messages_with_context)

chain = prompt | llm | StrOutputParser()
chain_with_context = prompt_with_context | llm | StrOutputParser()
chain_with_context_mistral = prompt_with_context | llm_mistral | StrOutputParser()
chain_with_context_claude= prompt | llm_claude | StrOutputParser()

def get_session_history(session_id):
    return SQLChatMessageHistory(session_id, connection="sqlite:///chat_history.db")

runnable_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

runnable_with_history_with_context = RunnableWithMessageHistory(
    chain_with_context,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

runnable_with_history_with_context_mistral = RunnableWithMessageHistory(
    chain_with_context_mistral,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

runnable_with_history_with_context_claude = RunnableWithMessageHistory(
    chain_with_context_claude,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)

def chat_with_llm(session_id, input):
    output = runnable_with_history.invoke(
        {"input": input}, config={"configurable": {"session_id": session_id}}
    )
    return output

def chat_with_llm_and_context(session_id, input, context_str):
    output = runnable_with_history_with_context.invoke(
        {"input": input, "context": context_str},
        config={"configurable": {"session_id": session_id}},
    )
    return output

def chat_with_llm_and_context_mistral(session_id, input, context_str):
    output = runnable_with_history_with_context_mistral.invoke(
        {"input": input, "context": context_str},
        config={"configurable": {"session_id": session_id}},
    )
    return output

def chat_with_llm_and_context_claude(session_id, input, context_str):
    output = runnable_with_history_with_context_claude.invoke(
        {"input": input, "context": context_str},
        config={"configurable": {"session_id": session_id}},
    )
    return output

def clear_session_history(session_id):
    get_session_history(session_id).clear()
