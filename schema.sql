-- Group 19 Database Schema

DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS song_join CASCADE;
DROP TABLE IF EXISTS billboard_charts CASCADE;
DROP TABLE IF EXISTS track_genres CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS audio_features CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS artists CASCADE;

-- Artists table
CREATE TABLE artists (
    artist_id SERIAL PRIMARY KEY,
    artist_name TEXT NOT NULL,
    normalized_artist_name TEXT
);

-- Tracks table
CREATE TABLE tracks (
    spotify_id TEXT PRIMARY KEY,
    track_name TEXT NOT NULL,
    normalized_track_name TEXT,
    artist_id INT REFERENCES artists(artist_id) ON DELETE CASCADE,
    popularity INT,
    duration_ms INT,
    explicit BOOLEAN
);

-- Audio features for each track
CREATE TABLE audio_features (
    spotify_id TEXT PRIMARY KEY REFERENCES tracks(spotify_id) ON DELETE CASCADE,
    tempo REAL,
    danceability REAL,
    energy REAL,
    loudness REAL,
    valence REAL,
    acousticness REAL,
    speechiness REAL,
    instrumentalness REAL,
    liveness REAL
);

-- Genres
CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    genre_name TEXT UNIQUE NOT NULL
);

-- Track-Genre relationships
CREATE TABLE track_genres (
    track_genre_id SERIAL PRIMARY KEY,
    spotify_id TEXT REFERENCES tracks(spotify_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(genre_id) ON DELETE CASCADE,
    UNIQUE(spotify_id, genre_id)
);

-- Billboard chart data
CREATE TABLE billboard_charts (
    chart_id SERIAL PRIMARY KEY,
    chart_date DATE NOT NULL,
    chart_rank INT,
    song_title TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    last_week INT,
    peak_rank INT,
    weeks_on_board INT
);

-- Links Spotify tracks with Billboard entries
CREATE TABLE song_join (
    join_id SERIAL PRIMARY KEY,
    spotify_id TEXT REFERENCES tracks(spotify_id) ON DELETE CASCADE,
    chart_id INT REFERENCES billboard_charts(chart_id) ON DELETE CASCADE,
    clean_song_title TEXT,
    clean_artist_name TEXT,
    UNIQUE(spotify_id, chart_id)
);

-- User accounts
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE
);

-- User playlists
CREATE TABLE playlists (
    playlist_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracks in playlists
CREATE TABLE playlist_tracks (
    playlist_track_id SERIAL PRIMARY KEY,
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    spotify_id TEXT REFERENCES tracks(spotify_id) ON DELETE CASCADE,
    position INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, spotify_id)
);

-- Indexes
CREATE INDEX idx_artists_name ON artists(artist_name);
CREATE INDEX idx_tracks_artist ON tracks(artist_id);
CREATE INDEX idx_tracks_popularity ON tracks(popularity);
CREATE INDEX idx_audio_tempo ON audio_features(tempo);
CREATE INDEX idx_audio_danceability ON audio_features(danceability);
CREATE INDEX idx_billboard_date ON billboard_charts(chart_date);
CREATE INDEX idx_billboard_rank ON billboard_charts(chart_rank);
CREATE INDEX idx_song_join_spotify ON song_join(spotify_id);
--
CREATE INDEX idx_audio_energy ON audio_features(energy);
CREATE INDEX idx_song_join_chart ON song_join(chart_id);
CREATE INDEX idx_track_genres_spotify ON track_genres(spotify_id);
CREATE INDEX idx_track_genres_genre ON track_genres(genre_id);