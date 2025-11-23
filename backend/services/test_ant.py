import os
from anthropic import Anthropic
from dotenv import load_dotenv
# Option 1: Set your API key as an environment variable before running the script
# export ANTHROPIC_API_KEY="your_claude_api_key_here"
load_dotenv()
# Get the API key from environment variable
api_key = os.getenv("ANTHROPIC_API_KEY")

# Initialize the Claude client
client = Anthropic(api_key=api_key)

# Example: sending a simple message to Claude
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Can you describe LLMs to me?"},
    ],
)

print(response.content[0].text)

def call_claude(context, message):
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system = context,
        messages=[
            {"role": "user", "content": message},
        ],
    )
    return response.content[0].text