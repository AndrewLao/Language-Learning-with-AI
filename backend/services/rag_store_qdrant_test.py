from rag_store_qdrant import query_qdrant

coll_name = "vietnamese_store"
coll_name_test = "vietnamese_test_store"
results = query_qdrant(coll_name, "Vietnamese verbs modals", top_k=1)
for res in results:
    print(f"Score: {res.score}, Text: {res.payload.get('text')}")

print("\n--- Testing test store ---\n")
results = query_qdrant(coll_name_test, "Vietnamese pronouns test", top_k=1)
for res in results:
    print(f"Score: {res.score}, Text: {res.payload.get('text')}")