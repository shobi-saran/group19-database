-- ======================================================
-- Group19 Database Setup Script
--   psql -U postgres -f setup.sql
-- ======================================================

-- reate user and database
CREATE ROLE group19_user WITH LOGIN PASSWORD 'tsaa-gr19-cis5500';
CREATE DATABASE group19_db OWNER group19_user;

--Connect to the new database
\c group19_db

--Create tables
CREATE TABLE spotify_features (
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

CREATE TABLE charts (
  date            date,
  chart_rank      integer,
  song            text,
  artist          text,
  last_week       integer,
  peak_rank       integer,
  weeks_on_board  integer
);

-- Import CSV data
\COPY spotify_features(genre,artist_name,track_name,track_id,popularity,acousticness,danceability,duration_ms,energy,instrumentalness,key,liveness,loudness,mode,speechiness,tempo,time_signature,valence)
FROM 'C:/Users/jothi/OneDrive/Desktop/cis550/group19-database/data/SpotifyFeatures.csv'
WITH (FORMAT csv, HEADER true);

\COPY charts(date,chart_rank,song,artist,last_week,peak_rank,weeks_on_board)
FROM 'C:/Users/jothi/OneDrive/Desktop/cis550/group19-database/data/charts.csv'
WITH (FORMAT csv, HEADER true);

\dt

