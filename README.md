# Group 19 - Music Discovery Database

CIS 5500 Database Systems Project

## Team Members
- Anugna Addula (anugna@seas.upenn.edu)
- Tommer (tommer@seas.upenn.edu)
- Aiswarya Jothish (aiswarya@seas.upenn.edu)
- Shobikha Saravanan (shobikha@seas.upenn.edu)

## Project Overview

Our application will help users discover music and create custom playlists. For milestone 3, we focus on playlist generation based on user-selected preferences like favorite artists, genres, and audio features. We combine Spotify audio features with Billboard chart history to recommend songs that match user-selected criteria like genre, tempo, energy level, and favorite artists. 

## Database

Our database contains:
- 176,773 tracks from Spotify with audio features (cleaned from original 232,725 tracks)
- 330,087 Billboard chart entries from 1958-2021
- 138,639 matched songs between both datasets
- 14,564 unique artists
- 27 genres

The database uses 10 normalized tables to store tracks, artists, audio features, genres, Billboard chart data, and user playlists.

## Data Sources

Download these datasets to recreate the database:

1. Spotify Tracks - https://www.kaggle.com/datasets/zaheenhamidani/ultimate-spotify-tracks-db
   - Save as SpotifyFeatures.csv

2. Billboard Charts - https://www.opendatabay.com/data/consumer/18d0d9c9-c6f8-40b2-bd88-693fd5786ffd
   - Save as charts.csv

Or access them here: 
* SpotifyFeatures.csv https://drive.google.com/file/d/1jaEM2tlgIitOx3DQfiBOQPCR2km8tfHu/view?usp=sharing
* Charts.csv https://drive.google.com/file/d/1qusG-TZ_Zv07CkdGo3s-GasQTlxqRgoK/view?usp=sharing


## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- PostgreSQL 12 or higher
- pandas library

### Steps

1. Clone this repository
2. Download the two datasets and place them in the project folder
3. Run the data cleaning script:

   python3 clean_data.py

   This creates a cleaned_data/ folder with 10 CSV files.

4. Create and connect to your PostgreSQL database:

   psql -U postgres
   CREATE DATABASE your_database_name;
   \c your_database_name

5. Create the database schema:

   \i schema.sql

6. Load the cleaned data:

   \i setup.sql

The setup script will display row counts to verify everything loaded correctly.

## Database Schema

Our schema includes:
- artists - Artist information
- tracks - Song metadata
- audio_features - Tempo, energy, danceability, etc.
- genres - Music genres
- track_genres - Track-genre relationships
- billboard_charts - Weekly chart data
- song_join - Links between Spotify and Billboard
- users - User accounts (for future features)
- playlists - User-created playlists (for future features)
- playlist_tracks - Songs in playlists (for future features)

## Data Cleaning

The clean_data.py script:
- Removes duplicate tracks
- Normalizes song and artist names for matching
- Handles missing values
- Creates normalized lookup tables
- Matches Spotify songs with Billboard chart entries

## Technologies

- PostgreSQL - Database
- Python with pandas - Data cleaning
- Flask - Backend API 
- HTML/CSS/JavaScript - Frontend 

## AWS RDS

Our production database is hosted on AWS RDS:
- Endpoint: group19-db.cwd78xnahkgd.us-east-1.rds.amazonaws.com
- Database: group19-db

## Files

- clean_data.py - Python script for data cleaning and preprocessing
- schema.sql - Database table definitions and indexes
- setup.sql - Data loading script with instructions
- README.md - This file
