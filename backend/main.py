from dotenv import load_dotenv
import uvicorn
import os
from fastapi import FastAPI
from pymongo import MongoClient
from gridfs import GridFS
from contextlib import asynccontextmanager
# from api import agents, rag, users
from api import users, agents, testingAgent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # client = MongoClient("ATLAS_URI")
    load_dotenv()  # loads .env in working directory or parent dirs
    ATLAS_URI = os.environ.get("ATLAS_URI", "mongodb://localhost:27017")
    print("Connecting to MongoDB at:", ATLAS_URI)
    client = MongoClient(ATLAS_URI)
    db = client["language_app"]
    fs = GridFS(db)

    app.state.db = db
    app.state.fs = fs

    try:
        yield
    finally:
        client.close()

app = FastAPI(title="LangTutor API" , lifespan=lifespan)

# Register routers
# app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(agents.router, prefix="/agent", tags=["Agent"])
app.include_router(testingAgent.router, prefix="/test", tags=["Testing"])

@app.get("/")
def health_check():
    return {"status": "up"}

def main():
    HOST = os.getenv("HOST")
    PORT = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")

if __name__ == "__main__":
    main()