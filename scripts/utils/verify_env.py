import os
from dotenv import load_dotenv

# Path to backend/.env
env_path = 'backend/.env'

if os.path.exists(env_path):
    print(f"Reading: {env_path}")
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line:
                key, val = line.split('=', 1)
                # Show only URL and first/last 4 chars of keys
                if 'URL' in key:
                    print(f"{key.strip()}: {val.strip()}")
                elif 'KEY' in key:
                    clean_val = val.strip()
                    if len(clean_val) > 8:
                        print(f"{key.strip()}: {clean_val[:4]}...{clean_val[-4:]}")
                    else:
                        print(f"{key.strip()}: [Too Short]")
else:
    print(f"File not found: {env_path}")
