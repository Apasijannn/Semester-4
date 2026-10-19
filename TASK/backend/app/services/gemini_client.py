"""Klien Gemini tunggal, dipakai bersama oleh Prompt A dan Prompt B."""

from functools import lru_cache

from google import genai

from app.config import get_settings


@lru_cache
def get_client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)
