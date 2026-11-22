from langchain_openai import ChatOpenAI

from app.core.config import settings


llm = ChatOpenAI(
    model=settings.MODEL_NAME,
    temperature=settings.TEMPERATURE,
    api_key=settings.OPENAI_API_KEY
)