# auth docs: https://myanimelist.net/apiconfig/references/authorization

# ========== Imports ==========
import os, json, secrets, webbrowser, requests, logging
from paths import app_data_dir
from typing import Any, Optional

# ========== Logging ==========
logger = logging.getLogger(__name__)

# ========== Constants & Code setup ==========
CLIENT_ID = "02232d5ee959c84e51196e9f1968b041"
REDIRECT_URI = "http://127.0.0.1:5001/mal/callback"     # MAL sends the browser here after login
TOKEN_FILE = os.path.join(app_data_dir(), "mal_tokens.json")

_code_verifier = None   # random secret, remembered between start_login and handle_callback

# ========== Functions ==========
def start_login() -> bool:
    """Open MAL's login page in the user's browser to begin logging in.

    Returns:
        bool: True if the browser was opened, False on failure.
    """
    global _code_verifier
    _code_verifier = secrets.token_urlsafe(64)      # the random secret (PKCE verifier)
    url = (
        "https://myanimelist.net/v1/oauth2/authorize"
        "?response_type=code"               # ask MAL for a temporary code, which we trade for the token
        f"&client_id={CLIENT_ID}"
        f"&code_challenge={_code_verifier}"
        "&code_challenge_method=plain"      # no hashing; the challenge equals the verifier
        f"&redirect_uri={REDIRECT_URI}"
    )
    try:
        webbrowser.open(url)
        return True
    except Exception as e:
        logger.error(f"Could not open the MAL login page: {e}")
        return False


# MAL sends us a new code in the redirect which is used here to request the token and save it
def handle_callback(code: str) -> bool:
    """Trade MAL's authorization code for the access + refresh tokens and save
    them to the appdata token file.

    Args:
        code (str): the authorization code MAL returns after a successful login.

    Returns:
        bool: True if tokens were fetched and saved, False on failure.
    """
    try:
        response = requests.post(
            "https://myanimelist.net/v1/oauth2/token",
            data={
                "client_id": CLIENT_ID,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
                "code_verifier": _code_verifier,
            },
            timeout=10,
        )
        response.raise_for_status()
        with open(TOKEN_FILE, "w") as f:
            json.dump(response.json(), f)
        logger.info(f"MAL login successful; tokens saved to {app_data_dir}.")
        return True
    except Exception as e:
        logger.error(f"Failed to exchange code for MAL tokens: {e}")
        return False


def get_my_info() -> Optional[dict[str, Any]]:
    """Fetch the logged-in user's MAL profile (name, picture, etc.) using the
    saved access token.

    Returns:
        Optional[dict[str, Any]]: the profile data, or None if it failed
    """
    try:
        with open(TOKEN_FILE) as f:
            tokens = json.load(f)

        response = requests.get(
            "https://api.myanimelist.net/v2/users/@me",
            headers={"Authorization": "Bearer " + tokens["access_token"]},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Could not fetch MAL user info: {e}")
        return None
    
def logout() -> None:
    """Disconnect from MAL by deleting the saved tokens."""
    try:
        os.remove(TOKEN_FILE)
        logger.info("MAL disconnected; tokens removed.")

    except FileNotFoundError:
        logger.warning("Unable to logout; can't find tokens.")
        pass