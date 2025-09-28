# main.py
from fastapi import FastAPI
from pymongo import MongoClient
from gridfs import GridFS
from api import agents, rag, users

app = FastAPI(title="LangTutor API")

client = MongoClient("ATLAS_URI")
db = client["language_app"]
fs = GridFS(db)

app.state.db = db
app.state.fs = fs

# Register routers
app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(rag.router, prefix="/rag", tags=["RAG"])
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def health_check():
    return {"status": "up"}

@app.on_event("shutdown")
def close_db():
    client.close()