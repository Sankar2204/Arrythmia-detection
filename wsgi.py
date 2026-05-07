import sys
import os

# Add the backend directory to the path so it can find src imports if necessary 
# though app.py does this too, it's good practice.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app import app

if __name__ == "__main__":
    app.run()
