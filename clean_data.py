import pandas as pd
import numpy as np
import re
from datetime import datetime

# Load data
print("Loading datasets")
spotify = pd.read_csv('SpotifyFeatures.csv')
billboard = pd.read_csv('charts.csv')

def normalize_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower().strip()
    text = re.sub(r'\([^)]*\)', '', text)
    text = re.sub(r'\b(feat|ft|featuring)\.?\b.*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Clean Spotify 
print("Cleaning Spotify data")
spotify = spotify.dropna(subset=['track_id', 'track_name', 'artist_name'])  # Remove rows with missing essential fields
spotify = spotify.drop_duplicates(subset=['track_id'])
spotify['normalized_track_name'] = spotify['track_name'].apply(normalize_text)
spotify['normalized_artist_name'] = spotify['artist_name'].apply(normalize_text)
spotify['popularity'] = spotify['popularity'].fillna(0).astype(int)
spotify['duration_ms'] = spotify['duration_ms'].fillna(0).astype(int)
spotify['explicit'] = False

# Fill numeric audio feature NaNs with 0
audio_cols = ['tempo', 'danceability', 'energy', 'loudness', 'valence', 
              'acousticness', 'speechiness', 'instrumentalness', 'liveness']
for col in audio_cols:
    spotify[col] = spotify[col].fillna(0)

# Clean Billboard
print("Cleaning Billboard data...")
billboard = billboard.rename(columns={
    'date': 'chart_date',
    'rank': 'chart_rank',
    'last-week': 'last_week',
    'peak-rank': 'peak_rank',
    'weeks-on-board': 'weeks_on_board'
})
billboard['chart_date'] = pd.to_datetime(billboard['chart_date'], errors='coerce')
billboard = billboard.dropna(subset=['chart_date'])  # Remove rows with invalid dates
billboard['normalized_song'] = billboard['song'].apply(normalize_text)
billboard['normalized_artist'] = billboard['artist'].apply(normalize_text)
billboard['last_week'] = pd.to_numeric(billboard['last_week'], errors='coerce').fillna(0).astype(int)
billboard['peak_rank'] = pd.to_numeric(billboard['peak_rank'], errors='coerce').fillna(0).astype(int)
billboard['weeks_on_board'] = pd.to_numeric(billboard['weeks_on_board'], errors='coerce').fillna(0).astype(int)
billboard['chart_rank'] = pd.to_numeric(billboard['chart_rank'], errors='coerce').fillna(0).astype(int)

# Create output directory
import os
os.makedirs('cleaned_data', exist_ok=True)

# Artists
print("Creating Artists table...")
artists = spotify[['artist_name', 'normalized_artist_name']].drop_duplicates()
artists = artists.reset_index(drop=True)
artists['artist_id'] = artists.index + 1
artists = artists[['artist_id', 'artist_name', 'normalized_artist_name']]
artists.to_csv('cleaned_data/artists.csv', index=False)

# Tracks (with artist_id)
print("Creating Tracks table...")
spotify_with_id = spotify.merge(artists[['artist_name', 'artist_id']], on='artist_name', how='left')
tracks = spotify_with_id[['track_id', 'track_name', 'normalized_track_name', 
                           'artist_id', 'popularity', 'duration_ms', 'explicit']].copy()
tracks = tracks.rename(columns={'track_id': 'spotify_id'})
tracks.to_csv('cleaned_data/tracks.csv', index=False)

# Get valid spotify_ids for foreign key references
valid_spotify_ids = set(tracks['spotify_id'].values)

# Audio Features (only for valid spotify_ids)
print("Creating Audio_Features table...")
audio_features = spotify_with_id[['track_id'] + audio_cols].copy()
audio_features = audio_features.rename(columns={'track_id': 'spotify_id'})
audio_features = audio_features[audio_features['spotify_id'].isin(valid_spotify_ids)]  # Only valid IDs
audio_features.to_csv('cleaned_data/audio_features.csv', index=False)

# Genres
print("Creating Genres table...")
genres = pd.DataFrame({
    'genre_id': range(1, len(spotify['genre'].dropna().unique()) + 1),
    'genre_name': spotify['genre'].dropna().unique()
})
genres.to_csv('cleaned_data/genres.csv', index=False)

# Track Genres (only for valid spotify_ids)
print("Creating Track_Genres table...")
genre_lookup = dict(zip(genres['genre_name'], genres['genre_id']))
track_genres_list = []
for idx, row in spotify_with_id.iterrows():
    if pd.notna(row['genre']) and row['track_id'] in valid_spotify_ids:
        track_genres_list.append({
            'track_genre_id': len(track_genres_list) + 1,
            'spotify_id': row['track_id'],
            'genre_id': genre_lookup[row['genre']]
        })
track_genres = pd.DataFrame(track_genres_list)
track_genres.to_csv('cleaned_data/track_genres.csv', index=False)

# Billboard Charts
print("Creating Billboard_Charts table...")
billboard_charts = billboard[['chart_date', 'chart_rank', 'song', 'artist', 
                               'last_week', 'peak_rank', 'weeks_on_board']].copy()
billboard_charts = billboard_charts.rename(columns={'song': 'song_title', 'artist': 'artist_name'})
billboard_charts.insert(0, 'chart_id', range(1, len(billboard_charts) + 1))
billboard_charts.to_csv('cleaned_data/billboard_charts.csv', index=False)

# Song Join 
print("Creating Song_Join table...")
billboard['chart_id'] = range(1, len(billboard) + 1)

song_join = billboard[['chart_id', 'normalized_song', 'normalized_artist']].merge(
    spotify_with_id[['track_id', 'normalized_track_name', 'normalized_artist_name']],
    left_on=['normalized_song', 'normalized_artist'],
    right_on=['normalized_track_name', 'normalized_artist_name'],
    how='inner'
)

# Filter to only valid spotify_ids
song_join = song_join[song_join['track_id'].isin(valid_spotify_ids)]

song_join = song_join[['chart_id', 'track_id', 'normalized_song', 'normalized_artist']].rename(columns={
    'track_id': 'spotify_id',
    'normalized_song': 'clean_song_title',
    'normalized_artist': 'clean_artist_name'
})
song_join.insert(0, 'join_id', range(1, len(song_join) + 1))
song_join = song_join[['join_id', 'spotify_id', 'chart_id', 'clean_song_title', 'clean_artist_name']]
song_join.to_csv('cleaned_data/song_join.csv', index=False)

# Empty tables for users/playlists
print("Creating empty tables...")
pd.DataFrame(columns=['user_id', 'username', 'email']).to_csv('cleaned_data/users.csv', index=False)
pd.DataFrame(columns=['playlist_id', 'user_id', 'name', 'created_at']).to_csv('cleaned_data/playlists.csv', index=False)
pd.DataFrame(columns=['playlist_track_id', 'playlist_id', 'spotify_id', 'position', 'added_at']).to_csv('cleaned_data/playlist_tracks.csv', index=False)

print(f"\nDone!")
print(f"Created {len(artists)} artists")
print(f"Created {len(tracks)} tracks") 
print(f"Created {len(audio_features)} audio features")
print(f"Created {len(genres)} genres")
print(f"Created {len(track_genres)} track-genre links")
print(f"Created {len(billboard_charts)} billboard entries")
print(f"Created {len(song_join)} Spotify-Billboard matches")