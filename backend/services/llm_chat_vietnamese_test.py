from rag_store_qdrant import query_qdrant
from llm_chat import chat_with_llm_and_context, clear_session_history

coll_name_test = "vietnamese_test_store"
results = query_qdrant(coll_name_test, "Vietnamese pronouns test", top_k=1)
text = ""
for res in results:
    text = text + res.payload.get('text')

prompt = "Based on the context ask me three yes/no questions one at a time " \
        "Before show me the next question, tell me whether or not I was correct on previous question " \
        "After that show me the score."
print(chat_with_llm_and_context("test_session", prompt, text))
print("---")
print(chat_with_llm_and_context("test_session", "yes", text))
print("---")
print(chat_with_llm_and_context("test_session", "yes", text ))
print("---")
print(chat_with_llm_and_context("test_session", "no", text))
print("---")
clear_session_history("test_session")    