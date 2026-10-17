"""How far has the whisper drifted? Cheap word-level bookkeeping, no extra API calls."""

from __future__ import annotations

import re
from typing import Dict, Iterable, List

STOPWORDS = set(
    """a an the and or but if then so of to in on at by for with without from into onto over under
    above below between through across about as is are was were be been being am do does did done
    have has had having it its it's this that these those there here their they them he she him her
    his hers we us our you your i me my mine what which who whom whose when where why how all any
    both each few more most other some such no nor not only own same than too very can will just
    should could would might must may also like one ones up down out off again further once while
    seem seems seemed look looks looking see seen sees image picture scene appear appears appearing
    almost nearly perhaps maybe quite rather really something someone thing things way ah oh
    yes yet still even ever every much many lots lot whole own""".split()
)
_WORD = re.compile(r"[a-zA-Z][a-zA-Z'-]+")


def stem(word: str) -> str:
    w = word.lower().strip("'-")
    for suffix in ("ingly", "edly", "ing", "ies", "es", "ed", "ly", "s"):
        if len(w) > len(suffix) + 3 and w.endswith(suffix):
            w = w[: -len(suffix)] + ("y" if suffix == "ies" else "")
            break
    return w


def content_words(text: str) -> Dict[str, str]:
    """Map stem -> first surface form, for content words only."""
    out: Dict[str, str] = {}
    for m in _WORD.finditer(text or ""):
        surface = m.group(0).lower().strip("'-")
        if surface in STOPWORDS or len(surface) < 3:
            continue
        out.setdefault(stem(surface), surface)
    return out


def _surfaces(words: Dict[str, str], keys: Iterable[str], limit: int) -> List[str]:
    return [words[k] for k in keys][:limit]


def analyse(origin: str, previous: str, description: str, limit: int = 12) -> Dict:
    """Compare a new description with the original prompt and the previous whisper.

    - survival: share of the original prompt's content words still present
    - new_words: words in this whisper that weren't in the previous one
    - lost_words: words from the previous whisper that disappeared
    """
    o, p, d = content_words(origin), content_words(previous), content_words(description)
    kept = [k for k in o if k in d]
    survival = len(kept) / len(o) if o else 1.0
    return {
        "survival": round(survival, 3),
        "origin_words": [{"word": o[k], "kept": k in d} for k in o],
        "new_words": _surfaces(d, (k for k in d if k not in p), limit) if previous else [],
        "lost_words": _surfaces(p, (k for k in p if k not in d), limit) if previous else [],
    }
