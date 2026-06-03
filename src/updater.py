import requests

CURRENT_VERSION = "v1.3.0"

# https://docs.github.com/en/rest/releases/releases?apiVersion=2026-03-10
def check_for_updates():
    try:
        response = requests.get(
            f"https://api.github.com/repos/xShive/AniPresence/releases/latest",
            headers={"accept": "application/vnd.github+json"},
            timeout=10
        )

        response.raise_for_status()

        data = response.json()
        if data.get("tag_name"):
            latest_version = data["tag_name"].strip()

            if latest_version != CURRENT_VERSION:
                download_url = data.get("html_url")     # html_url is the link for humans

                if data.get("assets")


    except Exception as e:
        print(f"Failed to check for updates: {e}")