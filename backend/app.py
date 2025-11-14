# app.py
# Main Flask application for Music Discovery API

from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_CONFIG, SERVER_HOST, SERVER_PORT

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow frontend to connect

# Database connection function
def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            port=DB_CONFIG['port']
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# Test route to check if server is running
@app.route('/')
def home():
    """Basic route to test if the server is running"""
    return jsonify({
        'message': 'Music Discovery API is running!',
        'status': 'success'
    })

# Test route to check database connection
@app.route('/api/test-db')
def test_db():
    """Test if database connection works"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({
            'status': 'error',
            'message': 'Could not connect to database'
        }), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM tracks')
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful!',
            'total_tracks': count
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database query error: {str(e)}'
        }), 500

# Route 1: Generate Playlist Based on Favorite Artist
@app.route('/api/playlist/artist/<artist_name>')
def playlist_by_artist(artist_name):
    """
    Generate a playlist of similar songs based on favorite artist
    """
    # Get optional limit parameter (default to 20)
    limit = request.args.get('limit', default=20, type=int)
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # SQL query from Milestone 3, now with parameters
        query = """
        WITH favorite_artist_profile AS (
            SELECT 
                AVG(af.tempo) AS avg_tempo,
                AVG(af.danceability) AS avg_danceability,
                AVG(af.energy) AS avg_energy,
                AVG(af.valence) AS avg_valence
            FROM tracks t
            JOIN artists a ON t.artist_id = a.artist_id
            JOIN audio_features af ON t.spotify_id = af.spotify_id
            WHERE a.artist_name = %s
        )
        SELECT 
            t.track_name,
            a.artist_name,
            g.genre_name,
            af.tempo,
            af.danceability,
            af.energy,
            t.popularity
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        JOIN audio_features af ON t.spotify_id = af.spotify_id
        LEFT JOIN track_genres tg ON t.spotify_id = tg.spotify_id
        LEFT JOIN genres g ON tg.genre_id = g.genre_id
        CROSS JOIN favorite_artist_profile fap
        WHERE a.artist_name != %s
            AND af.tempo BETWEEN fap.avg_tempo - 20 AND fap.avg_tempo + 20
            AND af.danceability BETWEEN fap.avg_danceability - 0.2 AND fap.avg_danceability + 0.2
            AND af.energy BETWEEN fap.avg_energy - 0.2 AND fap.avg_energy + 0.2
        ORDER BY t.popularity DESC
        LIMIT %s;
        """
        
        # Execute query with parameters
        cursor.execute(query, (artist_name, artist_name, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Return results as JSON
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route 2: Generate Playlist by Genre and Tempo Range
@app.route('/api/playlist/genre')
def playlist_by_genre():
    """
    Generate a playlist based on genre and tempo range
    """
    # Get query parameters
    genre = request.args.get('genre', type=str)
    tempo_min = request.args.get('tempo_min', default=120, type=int)
    tempo_max = request.args.get('tempo_max', default=140, type=int)
    limit = request.args.get('limit', default=25, type=int)
    
    # Validate required parameter
    if not genre:
        return jsonify({'error': 'genre parameter is required'}), 400
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            t.track_name,
            a.artist_name,
            g.genre_name,
            af.tempo,
            af.energy,
            af.danceability,
            t.popularity
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        JOIN audio_features af ON t.spotify_id = af.spotify_id
        JOIN track_genres tg ON t.spotify_id = tg.spotify_id
        JOIN genres g ON tg.genre_id = g.genre_id
        WHERE g.genre_name = %s
            AND af.tempo BETWEEN %s AND %s
        ORDER BY t.popularity DESC
        LIMIT %s;
        """
        
        cursor.execute(query, (genre, tempo_min, tempo_max, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route 3: Chart Hits Playlist for Selected Genre
@app.route('/api/playlist/chart-hits')
def playlist_chart_hits():
    """
    Generate a playlist of Billboard chart hits from a specific genre
    """
    genre = request.args.get('genre', type=str)
    max_rank = request.args.get('max_rank', default=50, type=int)
    limit = request.args.get('limit', default=30, type=int)
    
    if not genre:
        return jsonify({'error': 'genre parameter is required'}), 400
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            t.track_name,
            a.artist_name,
            g.genre_name,
            MIN(bc.chart_rank) AS best_chart_position,
            MAX(bc.weeks_on_board) AS weeks_on_chart,
            t.popularity
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        JOIN track_genres tg ON t.spotify_id = tg.spotify_id
        JOIN genres g ON tg.genre_id = g.genre_id
        JOIN song_join sj ON t.spotify_id = sj.spotify_id
        JOIN billboard_charts bc ON sj.chart_id = bc.chart_id
        WHERE g.genre_name = %s
            AND bc.chart_rank <= %s
        GROUP BY t.track_name, a.artist_name, g.genre_name, t.popularity
        ORDER BY best_chart_position ASC
        LIMIT %s;
        """
        
        cursor.execute(query, (genre, max_rank, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 4: Hidden Gems Playlist by Genre
@app.route('/api/playlist/hidden-gems')
def playlist_hidden_gems():
    """
    Discover highly popular Spotify tracks that never appeared on Billboard charts
    """
    genre = request.args.get('genre', type=str)
    min_popularity = request.args.get('min_popularity', default=50, type=int)
    limit = request.args.get('limit', default=25, type=int)
    
    if not genre:
        return jsonify({'error': 'genre parameter is required'}), 400
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            t.track_name,
            a.artist_name,
            g.genre_name,
            t.popularity,
            af.tempo,
            af.danceability,
            af.energy
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        JOIN audio_features af ON t.spotify_id = af.spotify_id
        JOIN track_genres tg ON t.spotify_id = tg.spotify_id
        JOIN genres g ON tg.genre_id = g.genre_id
        WHERE g.genre_name = %s
            AND t.popularity > %s
            AND NOT EXISTS (
                SELECT 1 
                FROM song_join sj 
                WHERE sj.spotify_id = t.spotify_id
            )
        ORDER BY t.popularity DESC
        LIMIT %s;
        """
        
        cursor.execute(query, (genre, min_popularity, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 5: Workout Playlist Generator
@app.route('/api/playlist/workout')
def playlist_workout():
    """
    Build a high-energy workout playlist
    """
    min_energy = request.args.get('min_energy', default=0.75, type=float)
    min_danceability = request.args.get('min_danceability', default=0.65, type=float)
    tempo_min = request.args.get('tempo_min', default=130, type=int)
    tempo_max = request.args.get('tempo_max', default=180, type=int)
    limit = request.args.get('limit', default=30, type=int)
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            t.track_name,
            a.artist_name,
            af.tempo,
            af.energy,
            af.danceability,
            t.popularity
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        JOIN audio_features af ON t.spotify_id = af.spotify_id
        WHERE af.energy > %s
            AND af.danceability > %s
            AND af.tempo BETWEEN %s AND %s
        ORDER BY af.energy DESC, t.popularity DESC
        LIMIT %s;
        """
        
        cursor.execute(query, (min_energy, min_danceability, tempo_min, tempo_max, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 6: Mood-Based Playlist - Happy Songs
@app.route('/api/playlist/mood/happy')
def playlist_happy():
    """
    Create an upbeat, positive playlist with high valence scores
    """
    min_valence = request.args.get('min_valence', default=0.7, type=float)
    min_energy = request.args.get('min_energy', default=0.6, type=float)
    limit = request.args.get('limit', default=25, type=int)
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            t.track_name,
            a.artist_name,
            g.genre_name,
            af.valence,
            af.energy,
            t.popularity
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        JOIN audio_features af ON t.spotify_id = af.spotify_id
        LEFT JOIN track_genres tg ON t.spotify_id = tg.spotify_id
        LEFT JOIN genres g ON tg.genre_id = g.genre_id
        WHERE af.valence > %s
            AND af.energy > %s
        ORDER BY af.valence DESC, t.popularity DESC
        LIMIT %s;
        """
        
        cursor.execute(query, (min_valence, min_energy, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 7: Decade Throwback Playlist
@app.route('/api/playlist/decade')
def playlist_decade():
    """
    Create a nostalgic playlist from a specific decade
    """
    start_year = request.args.get('start_year', type=int)
    end_year = request.args.get('end_year', type=int)
    min_energy = request.args.get('min_energy', default=0.5, type=float)
    max_energy = request.args.get('max_energy', default=0.8, type=float)
    limit = request.args.get('limit', default=30, type=int)
    
    if not start_year or not end_year:
        return jsonify({'error': 'start_year and end_year parameters are required'}), 400
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        WITH decade_songs AS (
            SELECT 
                t.track_name,
                a.artist_name,
                af.tempo,
                af.energy,
                af.danceability,
                bc.chart_date,
                MIN(bc.chart_rank) AS best_rank
            FROM tracks t
            JOIN artists a ON t.artist_id = a.artist_id
            JOIN audio_features af ON t.spotify_id = af.spotify_id
            JOIN song_join sj ON t.spotify_id = sj.spotify_id
            JOIN billboard_charts bc ON sj.chart_id = bc.chart_id
            WHERE EXTRACT(YEAR FROM bc.chart_date) BETWEEN %s AND %s
                AND af.energy BETWEEN %s AND %s
            GROUP BY t.track_name, a.artist_name, af.tempo, af.energy, af.danceability, bc.chart_date
        )
        SELECT 
            track_name,
            artist_name,
            tempo,
            energy,
            danceability,
            EXTRACT(YEAR FROM chart_date) AS year,
            best_rank
        FROM decade_songs
        ORDER BY best_rank ASC
        LIMIT %s;
        """
        
        cursor.execute(query, (start_year, end_year, min_energy, max_energy, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 8: Mix Playlist - Chart Hits and Hidden Gems
@app.route('/api/playlist/mix')
def playlist_mix():
    """
    Create a balanced playlist mixing chart hits with hidden gems
    """
    genre = request.args.get('genre', type=str)
    max_chart_rank = request.args.get('max_chart_rank', default=30, type=int)
    min_popularity = request.args.get('min_popularity', default=55, type=int)
    hits_limit = request.args.get('hits_limit', default=15, type=int)
    gems_limit = request.args.get('gems_limit', default=15, type=int)
    
    if not genre:
        return jsonify({'error': 'genre parameter is required'}), 400
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        WITH chart_hits AS (
            SELECT DISTINCT
                t.spotify_id,
                t.track_name,
                a.artist_name,
                g.genre_name,
                'Chart Hit' AS track_type,
                t.popularity
            FROM tracks t
            JOIN artists a ON t.artist_id = a.artist_id
            JOIN track_genres tg ON t.spotify_id = tg.spotify_id
            JOIN genres g ON tg.genre_id = g.genre_id
            JOIN song_join sj ON t.spotify_id = sj.spotify_id
            JOIN billboard_charts bc ON sj.chart_id = bc.chart_id
            WHERE g.genre_name = %s AND bc.chart_rank <= %s
            ORDER BY t.popularity DESC
            LIMIT %s
        ),
        hidden_gems AS (
            SELECT DISTINCT
                t.spotify_id,
                t.track_name,
                a.artist_name,
                g.genre_name,
                'Hidden Gem' AS track_type,
                t.popularity
            FROM tracks t
            JOIN artists a ON t.artist_id = a.artist_id
            JOIN track_genres tg ON t.spotify_id = tg.spotify_id
            JOIN genres g ON tg.genre_id = g.genre_id
            WHERE g.genre_name = %s
                AND t.popularity > %s
                AND NOT EXISTS (
                    SELECT 1 FROM song_join sj WHERE sj.spotify_id = t.spotify_id
                )
            ORDER BY t.popularity DESC
            LIMIT %s
        )
        SELECT spotify_id, track_name, artist_name, genre_name, track_type, popularity 
        FROM chart_hits
        UNION ALL
        SELECT spotify_id, track_name, artist_name, genre_name, track_type, popularity 
        FROM hidden_gems
        ORDER BY track_type, popularity DESC;
        """
        
        cursor.execute(query, (genre, max_chart_rank, hits_limit, genre, min_popularity, gems_limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 9: Similar Artists Recommendation
@app.route('/api/artists/similar/<artist_name>')
def similar_artists(artist_name):
    """
    Recommend similar artists based on audio profile comparison
    """
    tempo_range = request.args.get('tempo_range', default=25, type=int)
    feature_range = request.args.get('feature_range', default=0.25, type=float)
    min_tracks = request.args.get('min_tracks', default=5, type=int)
    limit = request.args.get('limit', default=10, type=int)
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        WITH artist_profile AS (
            SELECT 
                a.artist_id,
                AVG(af.tempo) AS avg_tempo,
                AVG(af.energy) AS avg_energy,
                AVG(af.danceability) AS avg_danceability,
                AVG(af.valence) AS avg_valence
            FROM artists a
            JOIN tracks t ON a.artist_id = t.artist_id
            JOIN audio_features af ON t.spotify_id = af.spotify_id
            GROUP BY a.artist_id
        ),
        target_artist AS (
            SELECT * FROM artist_profile ap
            JOIN artists a ON ap.artist_id = a.artist_id
            WHERE a.artist_name = %s
        )
        SELECT 
            a.artist_name,
            COUNT(t.spotify_id) AS track_count,
            ROUND(AVG(t.popularity)::numeric, 2) AS avg_popularity,
            ROUND(ap.avg_tempo::numeric, 2) AS avg_tempo,
            ROUND(ap.avg_energy::numeric, 2) AS avg_energy
        FROM artist_profile ap
        JOIN artists a ON ap.artist_id = a.artist_id
        JOIN tracks t ON a.artist_id = t.artist_id
        CROSS JOIN target_artist ta
        WHERE a.artist_name != %s
            AND ap.avg_tempo BETWEEN ta.avg_tempo - %s AND ta.avg_tempo + %s
            AND ap.avg_energy BETWEEN ta.avg_energy - %s AND ta.avg_energy + %s
            AND ap.avg_danceability BETWEEN ta.avg_danceability - %s AND ta.avg_danceability + %s
        GROUP BY a.artist_name, ap.avg_tempo, ap.avg_energy
        HAVING COUNT(t.spotify_id) >= %s
        ORDER BY avg_popularity DESC
        LIMIT %s;
        """
        
        cursor.execute(query, (artist_name, artist_name, tempo_range, tempo_range, 
                              feature_range, feature_range, feature_range, feature_range,
                              min_tracks, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 10: Playlist Statistics Summary
@app.route('/api/playlist/stats')
def playlist_stats():
    """
    Provide summary statistics for a playlist
    """
    spotify_ids = request.args.get('spotify_ids', type=str)
    
    if not spotify_ids:
        return jsonify({'error': 'spotify_ids parameter is required'}), 400
    
    # Convert comma-separated string to list
    ids_list = spotify_ids.split(',')
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create placeholder string for IN clause
        placeholders = ','.join(['%s'] * len(ids_list))
        
        query = f"""
        SELECT 
            COUNT(*) AS total_tracks,
            COUNT(DISTINCT a.artist_name) AS unique_artists,
            ROUND(AVG(af.tempo)::numeric, 2) AS avg_tempo,
            ROUND(AVG(af.energy)::numeric, 2) AS avg_energy,
            ROUND(AVG(af.danceability)::numeric, 2) AS avg_danceability,
            ROUND(AVG(af.valence)::numeric, 2) AS avg_valence,
            ROUND((AVG(t.duration_ms) / 60000.0)::numeric, 2) AS avg_duration_minutes
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        JOIN audio_features af ON t.spotify_id = af.spotify_id
        WHERE t.spotify_id IN ({placeholders});
        """
        
        cursor.execute(query, ids_list)
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#Tested 10 routes so far
#Following are auxillary routes - yet to be finalised/verified

# Route 11: Get All Genres
@app.route('/api/genres')
def get_genres():
    """
    Return a list of all available genres
    """
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT genre_id, genre_name 
        FROM genres 
        ORDER BY genre_name;
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 12: Get All Artists
@app.route('/api/artists')
def get_artists():
    """
    Return a list of all artists, optionally filtered by search term
    """
    search = request.args.get('search', type=str)
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if search:
            query = """
            SELECT artist_id, artist_name 
            FROM artists 
            WHERE artist_name ILIKE %s
            ORDER BY artist_name
            LIMIT 50;
            """
            cursor.execute(query, (f'%{search}%',))
        else:
            query = """
            SELECT artist_id, artist_name 
            FROM artists 
            ORDER BY artist_name
            LIMIT 100;
            """
            cursor.execute(query)
        
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 13: Get User Profile
@app.route('/api/user/<int:user_id>')
def get_user(user_id):
    """
    Retrieve user profile information
    """
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT user_id, username, email 
        FROM users 
        WHERE user_id = %s;
        """
        
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            return jsonify(result)
        else:
            return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 14: Create/Update User
@app.route('/api/user', methods=['POST'])
def create_or_update_user():
    """
    Create a new user or update existing user
    """
    data = request.get_json()
    
    if not data or 'username' not in data or 'email' not in data:
        return jsonify({'error': 'username and email are required'}), 400
    
    user_id = data.get('user_id')
    username = data.get('username')
    email = data.get('email')
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if user_id:
            # Update existing user
            query = """
            UPDATE users 
            SET username = %s, email = %s 
            WHERE user_id = %s
            RETURNING user_id;
            """
            cursor.execute(query, (username, email, user_id))
        else:
            # Create new user
            query = """
            INSERT INTO users (username, email) 
            VALUES (%s, %s) 
            RETURNING user_id;
            """
            cursor.execute(query, (username, email))
        
        result = cursor.fetchone()
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'user_id': result['user_id'],
            'message': 'User updated' if user_id else 'User created'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 15: Save Playlist
@app.route('/api/playlist/save', methods=['POST'])
def save_playlist():
    """
    Save a generated playlist to user's account
    """
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'playlist_name' not in data or 'spotify_ids' not in data:
        return jsonify({'error': 'user_id, playlist_name, and spotify_ids are required'}), 400
    
    user_id = data.get('user_id')
    playlist_name = data.get('playlist_name')
    spotify_ids = data.get('spotify_ids')
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Insert playlist
        query = """
        INSERT INTO playlists (user_id, name, created_at) 
        VALUES (%s, %s, NOW()) 
        RETURNING playlist_id;
        """
        cursor.execute(query, (user_id, playlist_name))
        result = cursor.fetchone()
        playlist_id = result['playlist_id']
        
        # Insert tracks
        for position, spotify_id in enumerate(spotify_ids, start=1):
            query = """
            INSERT INTO playlist_tracks (playlist_id, spotify_id, position, added_at) 
            VALUES (%s, %s, %s, NOW());
            """
            cursor.execute(query, (playlist_id, spotify_id, position))
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'playlist_id': playlist_id,
            'message': 'Playlist saved successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 16: Get User's Saved Playlists
@app.route('/api/user/<int:user_id>/playlists')
def get_user_playlists(user_id):
    """
    Retrieve all playlists saved by a user
    """
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            p.playlist_id, 
            p.name, 
            p.created_at, 
            COUNT(pt.spotify_id) AS track_count
        FROM playlists p
        LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
        WHERE p.user_id = %s
        GROUP BY p.playlist_id, p.name, p.created_at
        ORDER BY p.created_at DESC;
        """
        
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 17: Delete Playlist
@app.route('/api/playlist/<int:playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    """
    Delete a saved playlist
    """
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Delete tracks first (foreign key constraint)
        query = "DELETE FROM playlist_tracks WHERE playlist_id = %s;"
        cursor.execute(query, (playlist_id,))
        
        # Delete playlist
        query = "DELETE FROM playlists WHERE playlist_id = %s;"
        cursor.execute(query, (playlist_id,))
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Playlist deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route 18: Search Tracks
@app.route('/api/search/tracks')
def search_tracks():
    """
    Search for tracks by name
    """
    query_param = request.args.get('query', type=str)
    limit = request.args.get('limit', default=20, type=int)
    
    if not query_param:
        return jsonify({'error': 'query parameter is required'}), 400
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT 
            t.track_name, 
            t.spotify_id, 
            a.artist_name, 
            t.popularity, 
            t.album_name
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        WHERE t.track_name ILIKE %s
        ORDER BY t.popularity DESC
        LIMIT %s;
        """
        
        cursor.execute(query, (f'%{query_param}%', limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the server
if __name__ == '__main__':
    print(f"Starting server on {SERVER_HOST}:{SERVER_PORT}")
    app.run(host=SERVER_HOST, port=SERVER_PORT, debug=True)
