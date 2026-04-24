from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import pandas as pd
import sys
import os
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

from src.data_loader import load_data
from src.preprocessing import clean_data, vectorize_descriptions
from src.recommendation import filter_packages, recommend_packages, get_user_query
from src.location_utils import estimate_min_viable_budget, get_closest_location

import requests
import json

def get_db_connection():
    conn = sqlite3.connect('users.db', timeout=20)
    conn.row_factory = sqlite3.Row
    return conn

app = Flask(__name__)
app.secret_key = 'super_secret_travel_key' # Added for session management

OPENROUTER_API_KEY = ""
DEFAULT_AI_MODEL = "google/gemini-2.0-flash-001"

def init_db():
    """Initialize the database and ensure all columns exist."""
    conn = sqlite3.connect('users.db') # Temporary for init
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            bio TEXT,
            first_name TEXT,
            last_name TEXT,
            travel_style TEXT,
            current_location TEXT
        )
    ''')
    
    # Check for columns added in later versions to prevent migration errors
    c.execute('PRAGMA table_info(users)')
    cols = [r[1] for r in c.fetchall()]
    migration_columns = [
        ('bio', 'TEXT'),
        ('first_name', 'TEXT'),
        ('last_name', 'TEXT'),
        ('travel_style', 'TEXT'),
        ('current_location', 'TEXT')
    ]
    for col_name, col_type in migration_columns:
        if col_name not in cols:
            c.execute(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}')
            
    conn.commit()
    conn.close()

init_db()

def get_visitor_location():
    """Try to get location based on IP, or return a default."""
    try:
        # Using a free ip-api (no key required for basic use)
        response = requests.get('http://ip-api.com/json', timeout=2)
        if response.status_code == 200:
            data = response.json()
            if data.get('city'):
                return f"{data.get('city')}, {data.get('country')}"
            elif data.get('regionName'):
                 return f"{data.get('regionName')}, {data.get('country')}"
    except:
        pass
    return "San Francisco, USA" # Robust fallback

@app.context_processor
def inject_user():
    user = None
    location = "Detecting..."
    if 'user_id' in session:
        conn = get_db_connection()
        try:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],))
            user = c.fetchone()
            if user:
                location = user['current_location']
        finally:
            conn.close()
    
    # If not logged in or location not set in DB
    if not location or location == "Detecting...":
        # Check if we have it in session to avoid repeat API calls
        if 'guest_location' in session:
            location = session['guest_location']
        else:
            location = get_visitor_location()
            session['guest_location'] = location

    return dict(current_user=user, current_location=location)

# Load data once at startup
try:
    print("Loading data...")
    df = load_data('data/travel_packages.csv')
    df_clean = clean_data(df)
    vectorizer, tfidf_matrix = vectorize_descriptions(df_clean)
    print("Data loaded and processed successfully.")
except Exception as e:
    print(f"Error loading data: {e}")
    df_clean = None
    vectorizer = None
    tfidf_matrix = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/explore')
def explore():
    return render_template('explore.html')

@app.route('/saved-trips')
def saved_trips():
    return render_template('saved_trips.html')

@app.route('/activities')
def activities():
    return render_template('activities.html')


@app.route('/api/recommend', methods=['POST'])
def recommend():
    if df_clean is None:
        return jsonify({'error': 'Data model not loaded.'}), 500

    data = request.get_json(silent=True) or {}
    budget = data.get('budget', 250000)
    dest = data.get('destination', '')
    days = data.get('duration', 7)
    interests = data.get('interests', '')
    top_n = data.get('top_n', 5)

    if not dest:
        return jsonify({'error': 'Destination is required'}), 400

    try:
        # Origin Detection (where is the user starting from?)
        lat = data.get('lat')
        lon = data.get('lon')
        
        if lat and lon:
            origin = get_closest_location(lat, lon)
        else:
            origin = session.get('guest_location', 'India')
            if current_user:
                origin = current_user['current_location'] or origin
            
        min_budget, distance = estimate_min_viable_budget(origin, dest, days)
        
        # Reality check: If budget is less than 60% of minimum required, it's likely impossible
        if budget < min_budget * 0.6:
            msg = f"A {days}-day trip to {dest.capitalize()} from {origin} typically requires at least ₹{int(min_budget):,}. Your budget of ₹{int(budget):,} is too low for a realistic package. Try a local destination or increase your budget."
            return jsonify({'error': 'Impossible Budget', 'message': msg, 'min_required': int(min_budget)}), 200

        # Filter
        filtered_df = filter_packages(df_clean, budget, dest, days)
        
        if filtered_df.empty:
            # Call OpenRouter API as a fallback
            ai_results = get_ai_recommendations(dest, days, budget, interests, origin)
            if ai_results:
                return jsonify(ai_results)
            return jsonify([])
        
        # Recommend
        query = get_user_query(budget, dest, days, interests)
        recs = recommend_packages(filtered_df, vectorizer, tfidf_matrix, query, top_n)
        
        # Convert to list of dicts
        results = recs.to_dict(orient='records')
        for r in results:
            r['origin'] = origin
            r['distance_km'] = int(distance)
            
        return jsonify(results)

    except Exception as e:
        print(f"Error in recommendation: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/featured')
def featured():
    if df_clean is None:
        return jsonify([])
    
    # Get 6 random but 'good' packages (e.g. at least 5 days)
    featured_df = df_clean[df_clean['Duration'] >= 5].sample(n=6)
    
    # Add a dummy similarity score for consistent UI
    results = featured_df.to_dict(orient='records')
    for r in results:
        r['Similarity Score'] = 0.95
        
    return jsonify(results)

def get_ai_recommendations(destination, duration, budget, interests, origin="India"):
    """Fallback to OpenRouter API if no packages found in dataset."""
    try:
        print(f"Calling OpenRouter for {destination} fallback (Origin: {origin})...")
        prompt = f"""
        The user is planning a trip from {origin} to {destination} for {duration} days.
        Their budget is ₹{budget}.
        
        CRITICAL REALITY CHECK: 
        - If {budget} is physically impossible for this trip (e.g. ₹2000 for France), do NOT make up fake prices. 
        - Instead, return an empty array [] if the budget is clearly too low to cover basic flights and stay.
        
        If the budget is realistic, generate 5 travel package suggestions.
        The response MUST be a pure JSON array (no markdown code blocks) containing objects with exactly these keys:
        'Package Name', 'Destination', 'Duration', 'Price', 'Package Description'.
        - 'Price' MUST be the total price for {duration} days including ESTIMATED travel from {origin}.
        - 'Package Description' must start with 'Experience a {destination} trip.'
        - Do not include any text other than the JSON array.
        """
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000", # Optional for OpenRouter
            "X-Title": "Travel Buddy App"
        }
        
        payload = {
            "model": DEFAULT_AI_MODEL, 
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "response_format": { "type": "json_object" } # Some models support this
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        
        content = response.json()['choices'][0]['message']['content']
        # Handle some models that insist on wrapping in markdown blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        ai_data = json.loads(content)
        
        # OpenRouter response might be wrapped in a key if using json_object
        if isinstance(ai_data, dict):
            # Try to find a list within the dict
            for key in ai_data:
                if isinstance(ai_data[key], list):
                    ai_data = ai_data[key]
                    break
                    
        if not isinstance(ai_data, list):
            return None
            
        # Add similarity score for frontend consistency
        for item in ai_data:
            item['Similarity Score'] = 0.95
            
        return ai_data
        
    except Exception as e:
        print(f"OpenRouter Fail: {e}")
        return None

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Validation
        if not username or not email or not password:
            flash('All fields are required.', 'error')
            return redirect(url_for('signup'))
            
        hashed_password = generate_password_hash(password)
        
        conn = get_db_connection()
        try:
            c = conn.cursor()
            c.execute('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                      (username, email, hashed_password))
            conn.commit()
            flash('Account created successfully! Please log in.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username or email already exists.', 'error')
            return redirect(url_for('signup'))
        except Exception as e:
            flash(f'An error occurred: {str(e)}', 'error')
            return redirect(url_for('signup'))
        finally:
            conn.close()
            
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        conn = get_db_connection()
        try:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = c.fetchone()
            
            if user and check_password_hash(user['password_hash'], password):
                session['user_id'] = user['id']
                flash('Logged in successfully!', 'success')
                return redirect(url_for('home'))
            else:
                flash('Invalid email or password.', 'error')
        finally:
            conn.close()
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Logged out successfully.', 'success')
    return redirect(url_for('home'))

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'user_id' not in session:
        flash('Please log in to view your profile.', 'error')
        return redirect(url_for('login'))
        
    conn = get_db_connection()
    user = None
    try:
        c = conn.cursor()
        
        if request.method == 'POST':
            bio = request.form.get('bio')
            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            travel_style = request.form.get('travel_style')
            current_location = request.form.get('current_location')
            
            c.execute('''
                UPDATE users 
                SET bio = ?, first_name = ?, last_name = ?, travel_style = ?, current_location = ?
                WHERE id = ?
            ''', (bio, first_name, last_name, travel_style, current_location, session['user_id']))
            conn.commit()
            flash('Profile updated successfully!', 'success')
            
        c.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],))
        user = c.fetchone()
    finally:
        conn.close()
    
    return render_template('profile.html', user=user)
    
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get('messages', [])
    
    if not messages:
        return jsonify({'error': 'No messages provided'}), 400
        
    try:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "X-Title": "Travel Buddy AI Agent"
        }
        
        # System prompt to define the agent's behavior
        system_msg = {
            "role": "system",
            "content": "You are 'Travel Buddy AI', a professional travel consultant. Your goal is to help users plan trips by providing structured, helpful information. When discussing costs, use the currency of the destination (e.g. USD for USA, Euro for Europe) or any currency explicitly requested by the user. For Indian destinations, continue using Indian Rupee (₹). Be concise, friendly, and use formatting like bullet points."
        }
        
        full_messages = [system_msg] + messages
        
        payload = {
            "model": DEFAULT_AI_MODEL,
            "messages": full_messages
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        
        ai_response = response.json()['choices'][0]['message']['content']
        return jsonify({'content': ai_response})
        
    except Exception as e:
        print(f"Chat API Error: {e}")
        return jsonify({'error': str(e)}), 500

def call_openrouter_simple(prompt):
    """Helper for simple AI prompts returning JSON objects."""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Travel Buddy App"
    }
    payload = {
        "model": DEFAULT_AI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"}
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        content = response.json()['choices'][0]['message']['content']
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        return json.loads(content)
    except Exception as e:
        print(f"AI Simple Fail: {e}")
        return None

@app.route('/api/activities-search')
def activities_search():
    dest = request.args.get('dest', '').strip()
    lat = request.args.get('lat', '').strip()
    lon = request.args.get('lon', '').strip()
    
    if lat and lon:
        location_query = f"coordinates {lat}, {lon}"
    elif dest:
        location_query = dest
    else:
        return jsonify([])
    
    prompt = f"Provide a list of 8 very famous tourist attractions and things to do near {location_query}. Return as a JSON object with key 'activities' pointing to an array. Each activity must have 'name', 'description', 'location', 'lat', 'lon', 'distance_from_landmark' (e.g., '2km from city center'), and 'image_tags' (3 comma-separated keywords for image search, e.g., 'temple, ancient, architecture'). Ensure 'lat' and 'lon' are accurate numbers."
    
    results = call_openrouter_simple(prompt)
    if results and 'activities' in results:
        results = results['activities']
    else:
        results = []
        
    return jsonify(results)

@app.route('/api/generate_itinerary', methods=['POST'])
def generate_itinerary():
    data = request.get_json(silent=True) or {}
    dest = data.get('destination', '')
    days = data.get('days', 3)
    user_loc = data.get('current_location', 'your location')
    
    prompt = f"""
    Generate a highly realistic and practical day-wise travel itinerary for a {days}-day trip to {dest}.
    The traveler is starting from '{user_loc}'.
    Day 1 must include transit (flight/train) from '{user_loc}' to {dest}, arriving at the airport/station, and checking into a hotel (mention a realistic price range in ₹). 
    Subsequent days should include realistic activities starting from the hotel (e.g., trekking, sightseeing, local food). 
    Return a strictly formatted JSON object with a single key 'itinerary' pointing to an array of objects.
    Each object in the array must have two keys: 'day' (e.g. 'Day 1') and 'description' (a 2-3 sentence engaging description of the activities for that day).
    Ensure the JSON format is perfect.
    """
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Travel Buddy App"
    }
    payload = {
        "model": DEFAULT_AI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=40)
        response.raise_for_status()
        content = response.json()['choices'][0]['message']['content']
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        results = json.loads(content)
        if results and 'itinerary' in results:
            return jsonify(results['itinerary'])
    except Exception as e:
        print(f"Itinerary Gen Error: {e}")
        
    return jsonify({'error': 'Failed to generate itinerary'}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Dummy endpoint to handle legacy ML requests from the front-end."""
    return jsonify({"status": "success", "prediction": "legacy_handled"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

