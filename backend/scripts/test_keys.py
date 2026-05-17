import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.append(str(Path.cwd()))

# Force load from specific path
env_path = Path.cwd() / ".env"
print(f"Loading env from: {env_path}")
load_dotenv(dotenv_path=env_path)

def check_keys():
    print("--- Environment Check ---")
    print(f"GEMINI_API_KEY: {'[SET]' if os.getenv('GEMINI_API_KEY') else '[MISSING]'}")
    print(f"DEEPSEEK_API_KEY: {'[SET]' if os.getenv('DEEPSEEK_API_KEY') else '[MISSING]'}")
    print(f"SUPABASE_URL: {'[SET]' if os.getenv('SUPABASE_URL') else '[MISSING]'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {'[SET]' if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else '[MISSING]'}")
    
    # Try initializing clients
    print("\n--- Initializing Clients ---")
    
    # 1. Gemini
    try:
        import google.generativeai as genai
        key = os.getenv("GEMINI_API_KEY")
        if key:
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            print("✅ Gemini SDK: Initialized")
        else:
             print("❌ Gemini SDK: Key missing")
    except Exception as e:
        print(f"❌ Gemini SDK: Failed - {e}")
        
    # 2. Supabase
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if url and key:
            client = create_client(url, key)
            # Simple test query
            client.table("items").select("count").limit(1).execute()
            print("✅ Supabase: Connection Successful")
        else:
            print(f"❌ Supabase: URL or Key missing (URL: {'SET' if url else 'MISSING'}, KEY: {'SET' if key else 'MISSING'})")
    except Exception as e:
        print(f"❌ Supabase: Failed - {e}")

    # 3. Deepseek (simple HTTP check)
    try:
        import httpx
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if api_key:
            response = httpx.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": "deepseek-chat", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 1},
                timeout=5.0
            )
            if response.status_code == 200:
                print("✅ Deepseek: API Key Valid")
            elif response.status_code == 401:
                print(f"❌ Deepseek: API Key Invalid (401 Unauthorized)")
            else:
                print(f"❌ Deepseek: API Key error (Status {response.status_code})")
        else:
            print("❌ Deepseek: API Key missing")
    except Exception as e:
        print(f"❌ Deepseek: Check failed - {e}")

if __name__ == "__main__":
    check_keys()
