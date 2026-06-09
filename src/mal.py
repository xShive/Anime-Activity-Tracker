# ========== Imports ==========
import requests
import logging

# ========== Logging ==========
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Store MAL links to prevent spamming the API lol
mal_url_cache = {} 

def get_mal_url(title: str) -> str:
    """Convert anime's title to their corresponding MAL-URL

    Args:
        title (str): The title of the anime

    Returns:
        str: The corresponding MAL-URL
    """
    if title in mal_url_cache:
        return mal_url_cache[title]

    try:
        response = requests.get("https://api.jikan.moe/v4/anime",
                                params={
                                    "q": title,
                                    "limit": 1
                                    },
                                timeout=10
                            )

        response.raise_for_status()

        data = response.json()
        if data.get("data"):
            mal_url = data["data"][0]["url"]
            mal_url_cache[title] = mal_url
            return mal_url

    except Exception as e:
        logger.error(f"Failed to fetch MAL link: {e}")

    fallback_url = f"https://myanimelist.net/anime.php?q={title}"
    mal_url_cache[title] = fallback_url
    return fallback_url