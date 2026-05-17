import os
import google.generativeai as genai
from dotenv import load_dotenv

# Use absolute path to be sure
env_path = os.path.join(os.getcwd(), ".env")
load_dotenv(env_path)

def list_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY is not set in environment!")
        return
        
    print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")
    genai.configure(api_key=api_key)
    
    print("--- Available Models ---")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Name: {m.name}")
                # print(f"Display Name: {m.display_name}")
                # print("-" * 20)
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_models()
