# ========== Imports ==========
import os

# ========== Helper ==========
def app_data_dir() -> str:
    """Return %APPDATA%\\AniPresence (e.g. C:\\Users\\User\\AppData\\Roaming\\AniPresence)
    Creates the folder if needed."""
    base = os.getenv("APPDATA")
    if base is None:
        raise RuntimeError("APPDATA environment variable not found")

    path = os.path.join(base, "AniPresence")
    os.makedirs(path, exist_ok=True)
    return path
