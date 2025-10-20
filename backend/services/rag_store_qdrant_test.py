from rag_store_qdrant import query_qdrant
from rag_store_test_qdrant import query_test_qdrant

results = query_qdrant("Vietnamese verbs modals", top_k=1)
for res in results:
    print(f"Score: {res.score}, Text: {res.payload.get('text')}")
print("-----")
results = query_test_qdrant("Vietnamese pronouns test", top_k=1)
for res in results:
    print(f"Score: {res.score}, Text: {res.payload.get('text')}")