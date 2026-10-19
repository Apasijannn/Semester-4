"""Konfigurasi aplikasi — dibaca dari environment / file .env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Gemini API (free tier)
    gemini_api_key: str
    gemini_model: str = "gemini-3.5-flash"
    # PRD §8.1: temperature rendah (0-0.3) untuk stabilitas format JSON
    gemini_temperature: float = 0.1

    # Supabase — service role key hanya untuk backend (bypass RLS)
    supabase_url: str
    supabase_service_role_key: str

    # Zona waktu acuan untuk menghitung waktu relatif ("besok", "nanti sore")
    app_timezone: str = "Asia/Jakarta"

    # Mode personal (single-user): UUID pemilik di auth.users. Dipakai sebagai
    # fallback ketika request tidak menyertakan user_id, sehingga frontend
    # tidak perlu mengirim identitas sama sekali.
    default_user_id: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
