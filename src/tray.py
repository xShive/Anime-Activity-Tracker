import pystray
from PIL import Image

def create_tray():
    image = Image.open("assets/icon.ico")
    
    menu = pystray.Menu(
        pystray.MenuItem("Anime Activity Tracker", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", lambda: icon.stop())
    )
    
    icon = pystray.Icon("AnimeTracker", image, "Anime Activity Tracker", menu)
    icon.run()