import pystray
from PIL import Image
from updater import check_for_updates

def create_tray():
    image = Image.open("assets/icon.ico")
    
    menu = pystray.Menu(
        pystray.MenuItem("AniPresence", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", lambda: icon.stop())
    )
    
    icon = pystray.Icon("AniPresence", image, "AniPresence", menu)
    icon.run()