from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

print("Calling OpenAI...")

response = client.responses.create(
    model="gpt-4.1-mini",
    input="Say hello in one sentence."
)

print(response.output_text)