from pathlib import Path

from fastmcp import FastMCP


mcp = FastMCP("lorem-ipsum-server")

LOREM_FILE = Path(__file__).resolve().parent / "lorem-ipsum.md"


def _get_words(word_count: int = 30) -> str:
    if not LOREM_FILE.exists():
        raise FileNotFoundError(f"lorem-ipsum.md not found at {LOREM_FILE}")

    text = LOREM_FILE.read_text(encoding="utf-8")
    lines = [line for line in text.splitlines() if not line.strip().startswith("#")]
    content = " ".join(lines)

    words = content.split()
    word_count = max(1, min(word_count, len(words)))
    return " ".join(words[:word_count])


@mcp.resource("lorem://words")
def lorem_default() -> str:
    """Return the first 30 words from lorem ipsum."""
    return _get_words(30)


@mcp.resource("lorem://words/{word_count}")
def lorem_words(word_count: int) -> str:
    """Return the first word_count words from lorem ipsum."""
    return _get_words(word_count)


@mcp.tool()
def read(word_count: int = 30) -> str:
    """
    Read words from the lorem ipsum resource.

    Args:
        word_count: Number of words to return.

    Returns:
        First word_count words from lorem-ipsum.md.
    """
    return _get_words(word_count)


if __name__ == "__main__":
    mcp.run()
