"""Utility functions for token counting and text processing."""


def estimate_tokens(text: str) -> int:
    """
    Estimate the number of tokens in text.
    Rough approximation: 1 token ≈ 4 characters (OpenAI's rule of thumb).
    """
    return len(text) // 4


def count_messages_tokens(messages: list[dict]) -> int:
    """Count estimated tokens in a list of messages."""
    total_tokens = 0
    for message in messages:
        total_tokens += estimate_tokens(message.get("content", ""))
    return total_tokens


def truncate_context(context: str, max_tokens: int = 500) -> str:
    """
    Truncate context to fit within token limit.
    """
    words = context.split()
    token_count = 0
    truncated_words = []
    
    for word in words:
        word_tokens = estimate_tokens(word)
        if token_count + word_tokens > max_tokens:
            break
        truncated_words.append(word)
        token_count += word_tokens
    
    return " ".join(truncated_words)
