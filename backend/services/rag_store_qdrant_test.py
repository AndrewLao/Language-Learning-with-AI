from rag_store_qdrant import query_qdrant

results = query_qdrant("Vietnamese verbs modals", top_k=1)
for res in results:
    print(f"Score: {res.score}, Text: {res.payload.get('text')}")