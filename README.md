#Group19 Database Setup

This repository contains everything you need to recreate the Group19 PostgreSQL database for our class project.

##Project Structure

group19-database/
├── data/ (local)
│ ├── SpotifyFeatures.csv
│ └── charts.csv
├── db/
│ └── schema.sql
└── setup.sql # main setup script for building the DB
└── milestone3_queries.txt
└── .gitignore


used the following:
- PostgreSQL 18
- psql command line tool
- DataGrip
- Git

##Data Files
- SpotifyFeatures.csv https://drive.google.com/file/d/1jaEM2tlgIitOx3DQfiBOQPCR2km8tfHu/view?usp=sharing
- Charts.csv https://drive.google.com/file/d/1qusG-TZ_Zv07CkdGo3s-GasQTlxqRgoK/view?usp=sharing

##Setup
Run the setup script from the project root:
psql -U postgres -h localhost -d postgres -f setup.sql  

This will:
- Create user 'group19_user' (password: 'tsaa-gr19-cis5500')
- Create database 'group19_db'
- Load tables 'spotify_features' and 'charts'

##Verification
Expected results after setup:
- spotify_features → 232,725 rows  
- charts → 330,087 rows  
- charts.date range → 1958-08-04 to 2021-11-06  

##Credentials
Database: group19_db  
User: group19_user  
Password: tsaa-gr19-cis5500  

##Notes
- Do not upload /data to GitHub (already ignored)  
- Ensure CSVs are UTF-8 encoded before loading  