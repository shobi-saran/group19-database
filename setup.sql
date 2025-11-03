-- ======================================================
-- Group19 Database Setup Script
--   Run from the REPO ROOT:
--   psql -U postgres -h localhost -d postgres -f setup.sql
-- ======================================================

-- Create user and database (safe to re-run if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'group19_user') THEN
    CREATE ROLE group19_user WITH LOGIN PASSWORD 'tsaa-gr19-cis5500';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'group19_db') THEN
    CREATE DATABASE group19_db OWNER group19_user;
  END IF;
END $$;

\c group19_db

-- Tables
CREATE TABLE IF NOT EXISTS spotify_features (
  genre            text,
  artist_name      text,
  track_name       text,
  track_id         text,
  popularity       integer,
  acousticness     double precision,
  danceability     double precision,
  duration_ms      integer,
  energy           double precision,
  instrumentalness double precision,
  key              text,
  liveness         double precision,
  loudness         double precision,
  mode             text,
  speechiness      double precision,
  tempo            double precision,
  time_signature   text,
  valence          double precision
);

CREATE TABLE IF NOT EXISTS charts (
  date            date,
  chart_rank      integer,
  song            text,
  artist          text,
  last_week       integer,
  peak_rank       integer,
  weeks_on_board  integer
);

-- Data loads (relative to repo root). Expect CSVs in ./data/
-- Use \COPY (client-side) so no server file permissions needed.
\COPY spotify_features(
  genre,artist_name,track_name,track_id,popularity,
  acousticness,danceability,duration_ms,energy,
  instrumentalness,key,liveness,loudness,mode,
  speechiness,tempo,time_signature,valence
) FROM 'data/SpotifyFeatures.csv' WITH (FORMAT csv, HEADER true);

\COPY charts(
  date,chart_rank,song,artist,last_week,peak_rank,weeks_on_board
) FROM 'data/charts.csv' WITH (FORMAT csv, HEADER true);

\dt