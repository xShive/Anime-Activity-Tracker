# ========== Imports ==========
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logging.basicConfig(    
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(),
            RotatingFileHandler("anipresence.log",)
        ]
    )