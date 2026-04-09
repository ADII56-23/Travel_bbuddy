from dotenv import load_dotenv

load_dotenv()

# ... existing code ...

app.secret_key = os.getenv('APP_SECRET_KEY', 'dev_key_change_in_production')

# ... existing code ...

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')