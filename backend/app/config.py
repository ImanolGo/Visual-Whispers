"""Settings, read once from the environment (and .env)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# .env can live next to the backend or at the repo root
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    return default if v is None else v.strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class Settings:
    openrouter_api_key: str = ""
    describe_model: str = "anthropic/claude-haiku-5.5"
    describe_max_tokens: int = 1200
    image_provider: str = "auto"  # auto | replicate | openrouter | mock
    replicate_api_token: str = ""
    replicate_model: str = "black-forest-labs/flux-schnell"
    openrouter_image_model: str = "black-forest-labs/flux.2-klein-4b"
    mock: bool = False
    data_dir: Path = Path("data")
    static_dir: Path = Path("static")
    cors_origins: List[str] = field(default_factory=lambda: ["http://localhost:3000"])
    request_timeout: float = 120.0

    @classmethod
    def from_env(cls) -> "Settings":
        origins = [o.strip() for o in os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_URL", "")).split(",")]
        return cls(
            openrouter_api_key=os.getenv("OPENROUTER_API_KEY", "").strip(),
            describe_model=os.getenv("DESCRIBE_MODEL", cls.describe_model),
            describe_max_tokens=int(os.getenv("DESCRIBE_MAX_TOKENS", cls.describe_max_tokens)),
            image_provider=os.getenv("IMAGE_PROVIDER", cls.image_provider).strip().lower(),
            replicate_api_token=os.getenv("REPLICATE_API_TOKEN", "").strip(),
            replicate_model=os.getenv("REPLICATE_MODEL", cls.replicate_model),
            openrouter_image_model=os.getenv("OPENROUTER_IMAGE_MODEL", cls.openrouter_image_model),
            mock=_bool("MOCK_PROVIDERS"),
            data_dir=Path(os.getenv("DATA_DIR", "data")),
            static_dir=Path(os.getenv("STATIC_DIR", "static")),
            cors_origins=sorted({o for o in origins if o} | {"http://localhost:3000"}),
        )

    @property
    def resolved_image_provider(self) -> str:
        if self.mock:
            return "mock"
        if self.image_provider != "auto":
            return self.image_provider
        return "replicate" if self.replicate_api_token else "openrouter"
