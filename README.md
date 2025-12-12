# Language Learning with AI
A language Learning chat-based application built using AI agents for long-term memory.

# Dependencies
Tested on Python 3.11.6 but other versions of Python should work
`npm install` in the frontend folder
`pip install -r requirements.txt` in the backend folder

# Run instructions in dev mode:
`npm run dev` in the frontend folder
`python ./main.py` in the backend folder

Project requires that MongoDB and Qdrant DB instances be set up

# Environment variables:
For Backend components. Make a `.env` in the backend folder.
```
OPENAI_API_KEY=APIKEY
QDRANT_API_KEY=APIKEY
QDRANT_URL_KEY=URL(Called key but is actually URL)
ATLAS_URI=URL to Mongo
```
For the UI. Make another `.env` in the frontend folder.
```
VITE_USER_POOL_ID=Cognito User Pool
VITE_CLIENT_ID=Cognito Client ID
VITE_USER_POOL_REGION=us-east-1
VITE_API_URL="http://localhost:8000"
```


