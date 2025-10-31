import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from qdrant_client.http.models import PointStruct

load_dotenv()
# Initialize Qdrant client for your cloud instance
client = QdrantClient(
    url=os.environ.get("QDRANT_URL_KEY") , 
    api_key=os.environ.get("QDRANT_API_KEY")      
)

# Initialize OpenAI embeddings
embeddings = OpenAIEmbeddings(model='text-embedding-ada-002', openai_api_key=os.environ.get("OPENAI_API_KEY"))

# Lesson plans, vietnamese_store
def upload_documents_to_qdrant(directory, coll_name):
    # Load PDF files from directory
    pdfs = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".pdf"):
                pdfs.append(os.path.join(root, file))

    # Load documents from all PDFs
    docs = []
    # Use a single lesson counter across all PDFs so lesson_index increments
    # globally instead of resetting for each PDF. If you prefer per-PDF
    # numbering, keep the counter inside the loop.
    lesson_counter = 1
    for pdf in pdfs:
        print(pdf)
        loader = PyMuPDFLoader(pdf)

        loaded_docs = loader.load()
        # Add a tag to each loaded document's metadata before chunking
        for doc in loaded_docs:
            if doc.metadata is None:
                doc.metadata = {}
            doc.metadata["lesson_index"] = lesson_counter
            print('test', lesson_counter, doc.metadata)
            lesson_counter += 1
        # extend with the modified loaded_docs (not a fresh loader.load() call)
        docs.extend(loaded_docs)

    print(f"Loaded {len(docs)} documents")

    # Chunk documents for manageable embedding units
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(docs)

    # Optionally check embedding size
    embedding_dimension = len(embeddings.embed_query(chunks[0].page_content))
    print(f"Embedding dimension: {embedding_dimension}")

    # Create Qdrant collection if not exists
    if not client.collection_exists(coll_name):
        client.create_collection(
            collection_name=coll_name,
            vectors_config=VectorParams(size=embedding_dimension, distance=Distance.COSINE)
        )

    # Prepare points as PointStruct instances with vector and payload
    points = [
        PointStruct(
            id=idx,
            vector=list(embeddings.embed_query(chunk.page_content)),
            payload={"text": chunk.page_content, "lesson_index": chunk.metadata.get("lesson_index")}
        )
        for idx, chunk in enumerate(chunks)
    ]

    # Upsert points into the Qdrant collection
    client.upsert(collection_name=coll_name, points=points)

    print(f"Upserted {len(points)} points to Qdrant")

# Example function to query the vector store by similarity
# vietnamese_store
def query_qdrant(coll_name, query_text, top_k=5):
    query_vector = list(embeddings.embed_query(query_text))
    search_result = client.search(
        collection_name=coll_name,
        query_vector=query_vector,
        limit=top_k
    )
    return search_result

upload_documents_to_qdrant("Lesson plans", "vietnamese_store_with_metadata")
# upload_documents_to_qdrant("Test plans", "vietnamese_test_store")
