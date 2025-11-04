-- Group 19 Database Setup Script
-- CIS 550 Project - Music Discovery & Playlist Generator

-- INSTRUCTIONS:
-- 1. Download the original datasets:
--    - Spotify: https://www.kaggle.com/datasets/zaheenhamidani/ultimate-spotify-tracks-db
--    - Billboard: https://www.opendatabay.com/data/consumer/18d0d9c9-c6f8-40b2-bd88-693fd5786ffd
-- 2. Place SpotifyFeatures.csv and charts.csv in the same directory as clean_data.py
-- 3. Run: python3 clean_data.py
--    This will create a cleaned_data/ folder with 10 CSV files
-- 4. Create database: CREATE DATABASE your_db_name;
-- 5. Connect: \c your_db_name
-- 6. Run schema: \i schema.sql
-- 7. Run this file from the directory containing cleaned_data/: \i setup.sql

-- LOAD DATA
-- Note: Run this script from the directory that contains the cleaned_data/ folder
-- The \COPY commands use relative paths

\COPY artists(artist_id, artist_name, normalized_artist_name) 
FROM 'cleaned_data/artists.csv' 
WITH (FORMAT csv, HEADER true);

\COPY tracks(spotify_id, track_name, normalized_track_name, artist_id, popularity, duration_ms, explicit) 
FROM 'cleaned_data/tracks.csv' 
WITH (FORMAT csv, HEADER true);

\COPY audio_features(spotify_id, tempo, danceability, energy, loudness, valence, acousticness, speechiness, instrumentalness, liveness) 
FROM 'cleaned_data/audio_features.csv' 
WITH (FORMAT csv, HEADER true);

\COPY genres(genre_id, genre_name) 
FROM 'cleaned_data/genres.csv' 
WITH (FORMAT csv, HEADER true);

\COPY track_genres(track_genre_id, spotify_id, genre_id) 
FROM 'cleaned_data/track_genres.csv' 
WITH (FORMAT csv, HEADER true);

\COPY billboard_charts(chart_id, chart_date, chart_rank, song_title, artist_name, last_week, peak_rank, weeks_on_board) 
FROM 'cleaned_data/billboard_charts.csv' 
WITH (FORMAT csv, HEADER true);

\COPY song_join(join_id, spotify_id, chart_id, clean_song_title, clean_artist_name) 
FROM 'cleaned_data/song_join.csv' 
WITH (FORMAT csv, HEADER true);

\COPY users(user_id, username, email) 
FROM 'cleaned_data/users.csv' 
WITH (FORMAT csv, HEADER true);

\COPY playlists(playlist_id, user_id, name, created_at) 
FROM 'cleaned_data/playlists.csv' 
WITH (FORMAT csv, HEADER true);

\COPY playlist_tracks(playlist_track_id, playlist_id, spotify_id, position, added_at) 
FROM 'cleaned_data/playlist_tracks.csv' 
WITH (FORMAT csv, HEADER true);

-- UPDATE SEQUENCES

SELECT setval('artists_artist_id_seq', (SELECT MAX(artist_id) FROM artists));
SELECT setval('genres_genre_id_seq', (SELECT MAX(genre_id) FROM genres));
SELECT setval('track_genres_track_genre_id_seq', (SELECT MAX(track_genre_id) FROM track_genres));
SELECT setval('billboard_charts_chart_id_seq', (SELECT MAX(chart_id) FROM billboard_charts));
SELECT setval('song_join_join_id_seq', (SELECT MAX(join_id) FROM song_join));

-- VERIFY DATA LOADED

SELECT 'artists' AS table_name, COUNT(*) FROM artists
UNION ALL SELECT 'tracks', COUNT(*) FROM tracks
UNION ALL SELECT 'audio_features', COUNT(*) FROM audio_features
UNION ALL SELECT 'genres', COUNT(*) FROM genres
UNION ALL SELECT 'track_genres', COUNT(*) FROM track_genres
UNION ALL SELECT 'billboard_charts', COUNT(*) FROM billboard_charts
UNION ALL SELECT 'song_join', COUNT(*) FROM song_join
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'playlists', COUNT(*) FROM playlists
UNION ALL SELECT 'playlist_tracks', COUNT(*) FROM playlist_tracks;
