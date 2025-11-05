from rag_store_qdrant import query_qdrant, get_qdrant_client

coll_name = "vietnamese_store"
coll_name_test = "vietnamese_test_store"
results = query_qdrant(coll_name, "Vietnamese verbs modals", top_k=1)
for res in results:
    print(f"Score: {res.score}, Text: {res.payload.get('text')}")

print("\n--- Testing test store ---\n")
results = query_qdrant(coll_name_test, "Vietnamese pronouns test", top_k=1)
for res in results:
    print(f"Score: {res.score}, Text: {res.payload.get('text')}")

print("\n--- Testing scroll with filter ---\n")
client = get_qdrant_client()
from qdrant_client.http import models
results = client.scroll(
    collection_name="vietnamese_store_with_metadata_indexed",
    scroll_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="lesson_index",
                range=models.Range(lt=5)  # less than 5
            )
        ]
    ),
    limit=100,  # adjust this number as needed
    with_payload=True,  # include the payload in results
    with_vectors=False  # skip vectors unless you need them
)
# Print results to verify
if results[0]:  # if there are any results
    for point in results[0]:
        print(f"Lesson {point.payload['lesson_index']}: {point.payload['text'][:100]}...")

