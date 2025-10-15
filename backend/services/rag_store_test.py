

from rag_store import get_vector_store

vector_store = get_vector_store()
question = "Pronouns in Vietnamese"
docs = vector_store.search(query=question, k=1, search_type="similarity")
print(question)
for doc in docs:
    print(doc.page_content)

print("---")
question = "Advanced Pronouns in Vietnamese"
docs = vector_store.search(query=question, k=1, search_type="similarity")
print(question)
for doc in docs:
    print(doc.page_content)
