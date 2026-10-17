"""Local storage for generated images and shared chains.

Replicate deletes prediction outputs after a short time and OpenRouter returns
images inline, so we keep our own copy. That also makes exports and share
links keep working.
"""

from __future__ import annotations

import json
import re
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from PIL import Image

_ID_RE = re.compile(r"^[a-f0-9]{32}$")


def valid_id(value: str) -> bool:
    return bool(_ID_RE.match(value or ""))


class Store:
    def __init__(self, root: Path):
        self.images = Path(root) / "images"
        self.chains = Path(root) / "chains"
        self.images.mkdir(parents=True, exist_ok=True)
        self.chains.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------ images
    def save_image(self, data: bytes, max_side: int = 1024) -> Tuple[str, Image.Image]:
        """Normalise any image to WEBP and store it. Returns (id, PIL image)."""
        img = Image.open(BytesIO(data))
        img.load()
        img = img.convert("RGB")
        if max(img.size) > max_side:
            img.thumbnail((max_side, max_side), Image.LANCZOS)
        image_id = uuid.uuid4().hex
        img.save(self.image_path(image_id), format="WEBP", quality=88)
        return image_id, img

    def image_path(self, image_id: str) -> Path:
        if not valid_id(image_id):
            raise ValueError("invalid image id")
        return self.images / f"{image_id}.webp"

    def load_image(self, image_id: str) -> Image.Image:
        path = self.image_path(image_id)
        if not path.exists():
            raise FileNotFoundError(image_id)
        return Image.open(path).convert("RGB")

    # ------------------------------------------------------------ chains
    def save_chain(self, chain: Dict[str, Any]) -> str:
        chain_id = uuid.uuid4().hex
        (self.chains / f"{chain_id}.json").write_text(json.dumps(chain))
        return chain_id

    def load_chain(self, chain_id: str) -> Optional[Dict[str, Any]]:
        if not valid_id(chain_id):
            return None
        path = self.chains / f"{chain_id}.json"
        return json.loads(path.read_text()) if path.exists() else None
