import React, { useEffect, useState } from "react";
import CONFIG from "./config";

const BACKEND = CONFIG.BACKEND_URL;

function App() {
  const [activeTab, setActiveTab] = useState("genre");
  const [genres, setGenres] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [globalError, setGlobalError] = useState("");

  // Load genres + DB status on load
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/genres`);
        if (!res.ok) throw new Error("Failed to load genres");
        const data = await res.json();
        setGenres(data);
      } catch (err) {
        console.error(err);
        setGlobalError("Could not load genres from backend");
      }
    };

    const pingDb = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/test-db`);
        const data = await res.json();
        setDbStatus(data);
      } catch (err) {
        console.error(err);
        setDbStatus(null);
      }
    };

    loadGenres();
    pingDb();
  }, []);

  return (
    <div
      style={{
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1>Music Discovery Dashboard</h1>
        <p>
          Backend: <code>{BACKEND}/api/…</code>
        </p>
        {dbStatus && (
          <p style={{ fontSize: "0.9rem" }}>
            DB status: <strong>{dbStatus.status}</strong> —{" "}
            {dbStatus.message} ({dbStatus.total_tracks} tracks)
          </p>
        )}
        {globalError && (
          <p style={{ color: "red", fontSize: "0.9rem" }}>{globalError}</p>
        )}
      </header>

      {/* Simple tab bar */}
      <nav style={{ marginBottom: "1rem" }}>
        {[
          ["genre", "Playlists by Genre"],
          ["artist", "Artist-Based"],
          ["charts", "Chart Hits & Hidden Gems"],
          ["mood", "Workout / Happy / Decade"],
          ["mix", "Mix & Stats"],
          ["discover", "Search & Similar Artists"],
          ["user", "Users & Saved Playlists"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              marginRight: "0.5rem",
              padding: "0.4rem 0.8rem",
              borderRadius: 4,
              border: activeTab === key ? "2px solid black" : "1px solid #ccc",
              background: activeTab === key ? "#eee" : "white",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Tabs */}
      {activeTab === "genre" && <GenrePlaylistPanel genres={genres} />}
      {activeTab === "artist" && <ArtistPanels />}
      {activeTab === "charts" && <ChartsPanels genres={genres} />}
      {activeTab === "mood" && <MoodPanels />}
      {activeTab === "mix" && <MixAndStatsPanel genres={genres} />}
      {activeTab === "discover" && <DiscoveryPanel />}
      {activeTab === "user" && <UserPanel />}
    </div>
  );
}

//helper

function PlaylistTable({ rows, extraCols = [] }) {
  if (!rows.length) return null;
  const sample = rows[0];

  // basic columns that many routes share
  const hasGenre = "genre_name" in sample;
  const hasTempo = "tempo" in sample;
  const hasEnergy = "energy" in sample;
  const hasDance = "danceability" in sample;
  const hasPopularity = "popularity" in sample;

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "0.75rem",
        fontSize: "0.9rem",
      }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: "left" }}>Track</th>
          <th style={{ textAlign: "left" }}>Artist</th>
          {hasGenre && <th style={{ textAlign: "left" }}>Genre</th>}
          {hasTempo && <th style={{ textAlign: "right" }}>Tempo</th>}
          {hasEnergy && <th style={{ textAlign: "right" }}>Energy</th>}
          {hasDance && <th style={{ textAlign: "right" }}>Danceability</th>}
          {hasPopularity && <th style={{ textAlign: "right" }}>Popularity</th>}
          {extraCols.map((c) => (
            <th key={c.key} style={{ textAlign: c.align || "left" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td style={{ padding: "0.2rem 0.4rem" }}>{r.track_name}</td>
            <td style={{ padding: "0.2rem 0.4rem" }}>{r.artist_name}</td>
            {hasGenre && (
              <td style={{ padding: "0.2rem 0.4rem" }}>{r.genre_name}</td>
            )}
            {hasTempo && (
              <td
                style={{
                  padding: "0.2rem 0.4rem",
                  textAlign: "right",
                }}
              >
                {r.tempo}
              </td>
            )}
            {hasEnergy && (
              <td
                style={{
                  padding: "0.2rem 0.4rem",
                  textAlign: "right",
                }}
              >
                {Number(r.energy).toFixed(2)}
              </td>
            )}
            {hasDance && (
              <td
                style={{
                  padding: "0.2rem 0.4rem",
                  textAlign: "right",
                }}
              >
                {Number(r.danceability).toFixed(2)}
              </td>
            )}
            {hasPopularity && (
              <td
                style={{
                  padding: "0.2rem 0.4rem",
                  textAlign: "right",
                }}
              >
                {r.popularity}
              </td>
            )}
            {extraCols.map((c) => (
              <td
                key={c.key}
                style={{
                  padding: "0.2rem 0.4rem",
                  textAlign: c.align || "left",
                }}
              >
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

//Genre playlist (Route 2 + 11)

function GenrePlaylistPanel({ genres }) {
  const [selectedGenre, setSelectedGenre] = useState("");
  const [tempoMin, setTempoMin] = useState(120);
  const [tempoMax, setTempoMax] = useState(140);
  const [playlist, setPlaylist] = useState([]);
  const [error, setError] = useState("");

  const fetchPlaylist = async () => {
    if (!selectedGenre) {
      setError("Pick a genre first.");
      return;
    }
    setError("");
    setPlaylist([]);
    try {
      const params = new URLSearchParams({
        genre: selectedGenre,
        tempo_min: tempoMin,
        tempo_max: tempoMax,
        limit: 25,
      });
      const res = await fetch(`${BACKEND}/api/playlist/genre?${params}`);
      if (!res.ok) throw new Error("Failed to load playlist");
      const data = await res.json();
      setPlaylist(data);
    } catch (err) {
      console.error(err);
      setError("Error fetching playlist.");
    }
  };

  return (
    <section>
      <h2>Playlist by Genre & Tempo (Route 2)</h2>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          <option value="">Select a genre</option>
          {genres.map((g) => (
            <option key={g.genre_id} value={g.genre_name}>
              {g.genre_name}
            </option>
          ))}
        </select>
        <label>
          Tempo {tempoMin}–{tempoMax}
        </label>
        <input
          type="number"
          value={tempoMin}
          onChange={(e) => setTempoMin(Number(e.target.value))}
          style={{ width: 70 }}
        />
        <input
          type="number"
          value={tempoMax}
          onChange={(e) => setTempoMax(Number(e.target.value))}
          style={{ width: 70 }}
        />
        <button onClick={fetchPlaylist}>Generate</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <PlaylistTable rows={playlist} />
    </section>
  );
}

//Artist-based playlist (Route 1)

function ArtistPanels() {
  const [artistName, setArtistName] = useState("");
  const [limit, setLimit] = useState(20);
  const [playlist, setPlaylist] = useState([]);
  const [error, setError] = useState("");

  const fetchArtistPlaylist = async () => {
    if (!artistName.trim()) {
      setError("Enter an artist name.");
      return;
    }
    setError("");
    setPlaylist([]);
    try {
      const params = new URLSearchParams({ limit });
      const url = `${BACKEND}/api/playlist/artist/${encodeURIComponent(
        artistName
      )}?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load playlist");
      const data = await res.json();
      setPlaylist(data);
    } catch (err) {
      console.error(err);
      setError("Error fetching playlist.");
    }
  };

  return (
    <section>
      <h2>Similar Songs from Favorite Artist (Route 1)</h2>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input
          placeholder="Favorite artist (exact name)"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
        />
        <label>
          Limit:{" "}
          <input
            type="number"
            value={limit}
            min={1}
            max={50}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <button onClick={fetchArtistPlaylist}>Generate</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <PlaylistTable rows={playlist} />
    </section>
  );
}

//Chart hits + hidden gems (Routes 3 & 4)

function ChartsPanels({ genres }) {
  const [genre, setGenre] = useState("");
  const [maxRank, setMaxRank] = useState(50);
  const [chartHits, setChartHits] = useState([]);
  const [minPopularity, setMinPopularity] = useState(60);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [error, setError] = useState("");

  const loadChartHits = async () => {
    if (!genre) {
      setError("Select a genre first.");
      return;
    }
    setError("");
    try {
      const params = new URLSearchParams({
        genre,
        max_rank: maxRank,
        limit: 30,
      });
      const res = await fetch(`${BACKEND}/api/playlist/chart-hits?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChartHits(data);
    } catch (e) {
      console.error(e);
      setError("Error loading chart hits.");
    }
  };

  const loadHiddenGems = async () => {
    if (!genre) {
      setError("Select a genre first.");
      return;
    }
    setError("");
    try {
      const params = new URLSearchParams({
        genre,
        min_popularity: minPopularity,
        limit: 25,
      });
      const res = await fetch(`${BACKEND}/api/playlist/hidden-gems?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHiddenGems(data);
    } catch (e) {
      console.error(e);
      setError("Error loading hidden gems.");
    }
  };

  return (
    <section>
      <h2>Chart Hits & Hidden Gems (Routes 3 & 4)</h2>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">Select genre</option>
          {genres.map((g) => (
            <option key={g.genre_id} value={g.genre_name}>
              {g.genre_name}
            </option>
          ))}
        </select>
        <label>
          Max chart rank:{" "}
          <input
            type="number"
            value={maxRank}
            onChange={(e) => setMaxRank(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <button onClick={loadChartHits}>Load Chart Hits</button>
        <label>
          Hidden gems min popularity:{" "}
          <input
            type="number"
            value={minPopularity}
            onChange={(e) => setMinPopularity(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <button onClick={loadHiddenGems}>Load Hidden Gems</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {chartHits.length > 0 && (
        <>
          <h3 style={{ marginTop: "1rem" }}>Chart Hits</h3>
          <PlaylistTable
            rows={chartHits}
            extraCols={[
              { key: "best_chart_position", label: "Best Rank", align: "right" },
              { key: "weeks_on_chart", label: "Weeks", align: "right" },
            ]}
          />
        </>
      )}

      {hiddenGems.length > 0 && (
        <>
          <h3 style={{ marginTop: "1rem" }}>Hidden Gems</h3>
          <PlaylistTable rows={hiddenGems} />
        </>
      )}
    </section>
  );
}

//Workout (Routes 5, 6, 7)

function MoodPanels() {
  // Workout
  const [workout, setWorkout] = useState([]);
  const [minEnergy, setMinEnergy] = useState(0.75);
  const [minDance, setMinDance] = useState(0.65);

  // Happy
  const [happy, setHappy] = useState([]);
  const [minValence, setMinValence] = useState(0.7);

  // Decade
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(1999);
  const [decade, setDecade] = useState([]);

  const loadWorkout = async () => {
    const params = new URLSearchParams({
      min_energy: minEnergy,
      min_danceability: minDance,
      tempo_min: 130,
      tempo_max: 180,
      limit: 30,
    });
    const res = await fetch(`${BACKEND}/api/playlist/workout?${params}`);
    const data = await res.json();
    setWorkout(data);
  };

  const loadHappy = async () => {
    const params = new URLSearchParams({
      min_valence: minValence,
      min_energy: 0.6,
      limit: 25,
    });
    const res = await fetch(`${BACKEND}/api/playlist/mood/happy?${params}`);
    const data = await res.json();
    setHappy(data);
  };

  const loadDecade = async () => {
    if (!startYear || !endYear) return;
    const params = new URLSearchParams({
      start_year: startYear,
      end_year: endYear,
      min_energy: 0.5,
      max_energy: 0.8,
      limit: 30,
    });
    const res = await fetch(`${BACKEND}/api/playlist/decade?${params}`);
    const data = await res.json();
    setDecade(data);
  };

  return (
    <section>
      <h2>Workout / Happy / Decade (Routes 5, 6, 7)</h2>

      {/* Workout */}
      <div style={{ marginBottom: "1rem" }}>
        <h3>Workout Playlist (Route 5)</h3>
        <label>
          Min energy:{" "}
          <input
            type="number"
            step="0.05"
            value={minEnergy}
            onChange={(e) => setMinEnergy(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>{" "}
        <label>
          Min danceability:{" "}
          <input
            type="number"
            step="0.05"
            value={minDance}
            onChange={(e) => setMinDance(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>{" "}
        <button onClick={loadWorkout}>Generate workout playlist</button>
        <PlaylistTable rows={workout} />
      </div>

      {/* Happy */}
      <div style={{ marginBottom: "1rem" }}>
        <h3>Happy Mood Playlist (Route 6)</h3>
        <label>
          Min valence:{" "}
          <input
            type="number"
            step="0.05"
            value={minValence}
            onChange={(e) => setMinValence(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>{" "}
        <button onClick={loadHappy}>Generate happy playlist</button>
        <PlaylistTable rows={happy} />
      </div>

      {/* Decade */}
      <div>
        <h3>Decade Throwback (Route 7)</h3>
        <label>
          Start year:{" "}
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </label>{" "}
        <label>
          End year:{" "}
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </label>{" "}
        <button onClick={loadDecade}>Generate throwback</button>
        <PlaylistTable
          rows={decade}
          extraCols={[
            { key: "year", label: "Year", align: "right" },
            { key: "best_rank", label: "Best Rank", align: "right" },
          ]}
        />
      </div>
    </section>
  );
}

//Mix playlist + stats (Routes 8 & 10)

function MixAndStatsPanel({ genres }) {
  // mix
  const [genre, setGenre] = useState("");
  const [maxChartRank, setMaxChartRank] = useState(30);
  const [minPopularity, setMinPopularity] = useState(55);
  const [hitsLimit, setHitsLimit] = useState(15);
  const [gemsLimit, setGemsLimit] = useState(15);
  const [mixRows, setMixRows] = useState([]);

  // stats
  const [statsIds, setStatsIds] = useState("");
  const [statsResult, setStatsResult] = useState(null);

  const loadMix = async () => {
    if (!genre) return;
    const params = new URLSearchParams({
      genre,
      max_chart_rank: maxChartRank,
      min_popularity: minPopularity,
      hits_limit: hitsLimit,
      gems_limit: gemsLimit,
    });
    const res = await fetch(`${BACKEND}/api/playlist/mix?${params}`);
    const data = await res.json();
    setMixRows(data);
  };

  const loadStats = async () => {
    if (!statsIds.trim()) return;
    const params = new URLSearchParams({
      spotify_ids: statsIds.trim(),
    });
    const res = await fetch(`${BACKEND}/api/playlist/stats?${params}`);
    const data = await res.json();
    setStatsResult(data);
  };

  return (
    <section>
      <h2>Mix Playlist & Stats (Routes 8 & 10)</h2>

      <h3>Chart Hits + Hidden Gems Mix (Route 8)</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">Select genre</option>
          {genres.map((g) => (
            <option key={g.genre_id} value={g.genre_name}>
              {g.genre_name}
            </option>
          ))}
        </select>
        <label>
          Max chart rank:{" "}
          <input
            type="number"
            value={maxChartRank}
            onChange={(e) => setMaxChartRank(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <label>
          Min popularity:{" "}
          <input
            type="number"
            value={minPopularity}
            onChange={(e) => setMinPopularity(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>
        <label>
          Hits:{" "}
          <input
            type="number"
            value={hitsLimit}
            onChange={(e) => setHitsLimit(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <label>
          Gems:{" "}
          <input
            type="number"
            value={gemsLimit}
            onChange={(e) => setGemsLimit(Number(e.target.value))}
            style={{ width: 60 }}
          />
        </label>
        <button onClick={loadMix}>Generate mix</button>
      </div>
      <PlaylistTable
        rows={mixRows}
        extraCols={[
          { key: "track_type", label: "Type" },
          { key: "popularity", label: "Popularity", align: "right" },
        ]}
      />

      <h3 style={{ marginTop: "1.5rem" }}>Playlist Stats (Route 10)</h3>
      <p style={{ fontSize: "0.85rem" }}>
        Enter a comma-separated list of Spotify IDs
        (e.g. <code>3n3Ppam7vgaVa1iaRUc9Lp,0eGsygTp906u18L0Oimnem</code>).
        You can grab IDs from the Mix or Track Search tables.
      </p>
      <textarea
        rows={2}
        style={{ width: "100%" }}
        value={statsIds}
        onChange={(e) => setStatsIds(e.target.value)}
      />
      <button onClick={loadStats} style={{ marginTop: "0.5rem" }}>
        Get stats
      </button>
      {statsResult && (
        <pre style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
{JSON.stringify(statsResult, null, 2)}
        </pre>
      )}
    </section>
  );
}

//Discovery: artists, tracks, similar artists (Routes 9, 12, 18)

function DiscoveryPanel() {
  // artist search
  const [artistQuery, setArtistQuery] = useState("");
  const [artists, setArtists] = useState([]);

  // similar artists
  const [similarBase, setSimilarBase] = useState("");
  const [similarParams, setSimilarParams] = useState({
    tempo_range: 25,
    feature_range: 0.25,
    min_tracks: 5,
    limit: 10,
  });
  const [similarResults, setSimilarResults] = useState([]);

  // track search
  const [trackQuery, setTrackQuery] = useState("");
  const [tracks, setTracks] = useState([]);

  const searchArtists = async () => {
    const params = new URLSearchParams({ search: artistQuery });
    const res = await fetch(`${BACKEND}/api/artists?${params}`);
    const data = await res.json();
    setArtists(data);
  };

  const searchTracks = async () => {
    const params = new URLSearchParams({
      query: trackQuery,
      limit: 20,
    });
    const res = await fetch(`${BACKEND}/api/search/tracks?${params}`);
    const data = await res.json();
    setTracks(data);
  };

  const loadSimilar = async () => {
    if (!similarBase.trim()) return;
    const params = new URLSearchParams(similarParams);
    const url = `${BACKEND}/api/artists/similar/${encodeURIComponent(
      similarBase
    )}?${params}`;
    const res = await fetch(url);
    const data = await res.json();
    setSimilarResults(data);
  };

  return (
    <section>
      <h2>Discovery Tools (Routes 9, 12, 18)</h2>

      {/* Artist search */}
      <div style={{ marginBottom: "1rem" }}>
        <h3>Search Artists (Route 12)</h3>
        <input
          placeholder="Artist name contains…"
          value={artistQuery}
          onChange={(e) => setArtistQuery(e.target.value)}
        />{" "}
        <button onClick={searchArtists}>Search</button>
        {artists.length > 0 && (
          <ul style={{ marginTop: "0.5rem", maxHeight: 150, overflowY: "auto" }}>
            {artists.map((a) => (
              <li key={a.artist_id}>
                {a.artist_name} <small>(id {a.artist_id})</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Similar artists */}
      <div style={{ marginBottom: "1rem" }}>
        <h3>Similar Artists (Route 9)</h3>
        <input
          placeholder="Base artist (exact name)"
          value={similarBase}
          onChange={(e) => setSimilarBase(e.target.value)}
        />{" "}
        <label>
          Tempo range:{" "}
          <input
            type="number"
            value={similarParams.tempo_range}
            onChange={(e) =>
              setSimilarParams((p) => ({
                ...p,
                tempo_range: Number(e.target.value),
              }))
            }
            style={{ width: 60 }}
          />
        </label>{" "}
        <label>
          Feature range:{" "}
          <input
            type="number"
            step="0.05"
            value={similarParams.feature_range}
            onChange={(e) =>
              setSimilarParams((p) => ({
                ...p,
                feature_range: Number(e.target.value),
              }))
            }
            style={{ width: 60 }}
          />
        </label>{" "}
        <button onClick={loadSimilar}>Find similar</button>

        {similarResults.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Artist</th>
                <th style={{ textAlign: "right" }}>Tracks</th>
                <th style={{ textAlign: "right" }}>Avg Popularity</th>
                <th style={{ textAlign: "right" }}>Avg Tempo</th>
                <th style={{ textAlign: "right" }}>Avg Energy</th>
              </tr>
            </thead>
            <tbody>
              {similarResults.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "0.2rem 0.4rem" }}>{r.artist_name}</td>
                  <td
                    style={{ padding: "0.2rem 0.4rem", textAlign: "right" }}
                  >
                    {r.track_count}
                  </td>
                  <td
                    style={{ padding: "0.2rem 0.4rem", textAlign: "right" }}
                  >
                    {Number(r.avg_popularity).toFixed(2)}
                  </td>
                  <td
                    style={{ padding: "0.2rem 0.4rem", textAlign: "right" }}
                  >
                    {Number(r.avg_tempo).toFixed(2)}
                  </td>
                  <td
                    style={{ padding: "0.2rem 0.4rem", textAlign: "right" }}
                  >
                    {Number(r.avg_energy).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Track search */}
      <div>
        <h3>Search Tracks (Route 18)</h3>
        <input
          placeholder="Track name contains…"
          value={trackQuery}
          onChange={(e) => setTrackQuery(e.target.value)}
        />{" "}
        <button onClick={searchTracks}>Search tracks</button>
        {tracks.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Track</th>
                <th style={{ textAlign: "left" }}>Artist</th>
                <th style={{ textAlign: "right" }}>Popularity</th>
                <th style={{ textAlign: "left" }}>Album</th>
                <th style={{ textAlign: "left" }}>Spotify ID</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "0.2rem 0.4rem" }}>{t.track_name}</td>
                  <td style={{ padding: "0.2rem 0.4rem" }}>{t.artist_name}</td>
                  <td
                    style={{ padding: "0.2rem 0.4rem", textAlign: "right" }}
                  >
                    {t.popularity}
                  </td>
                  <td style={{ padding: "0.2rem 0.4rem" }}>{t.album_name}</td>
                  <td style={{ padding: "0.2rem 0.4rem" }}>{t.spotify_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

//Users & saved playlists (Routes 13–17)

function UserPanel() {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [saveName, setSaveName] = useState("");
  const [saveSpotifyIds, setSaveSpotifyIds] = useState("");
  const [playlistToDelete, setPlaylistToDelete] = useState("");
  const [message, setMessage] = useState("");

  const createOrUpdateUser = async () => {
    setMessage("");
    const body = {
      username,
      email,
    };
    if (userId) body.user_id = Number(userId);
    const res = await fetch(`${BACKEND}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.user_id) {
      setUserId(String(data.user_id));
      setMessage(data.message);
    } else {
      setMessage("Error creating/updating user");
    }
  };

  const loadUser = async () => {
    if (!userId) return;
    const res = await fetch(`${BACKEND}/api/user/${userId}`);
    const data = await res.json();
    setUserInfo(data);
  };

  const loadUserPlaylists = async () => {
    if (!userId) return;
    const res = await fetch(`${BACKEND}/api/user/${userId}/playlists`);
    const data = await res.json();
    setPlaylists(data);
  };

  const savePlaylist = async () => {
    if (!userId || !saveName || !saveSpotifyIds.trim()) return;
    const idsList = saveSpotifyIds.split(",").map((s) => s.trim());
    const body = {
      user_id: Number(userId),
      playlist_name: saveName,
      spotify_ids: idsList,
    };
    const res = await fetch(`${BACKEND}/api/playlist/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMessage(data.message || "Saved playlist.");
  };

  const deletePlaylist = async () => {
    if (!playlistToDelete) return;
    const res = await fetch(
      `${BACKEND}/api/playlist/${playlistToDelete}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    setMessage(data.message || "Deleted playlist.");
  };

  return (
    <section>
      <h2>Users & Saved Playlists (Routes 13–17)</h2>

      <h3>Create / Update User (Route 14)</h3>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <label>
          User ID (optional):{" "}
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: 80 }}
          />
        </label>
        <label>
          Username:{" "}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Email:{" "}
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button onClick={createOrUpdateUser}>Save user</button>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Load User & Playlists (Routes 13 & 16)</h3>
      <button onClick={loadUser}>Load user info</button>{" "}
      <button onClick={loadUserPlaylists}>Load user playlists</button>
      {userInfo && (
        <pre style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
{JSON.stringify(userInfo, null, 2)}
        </pre>
      )}
      {playlists.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Playlist ID</th>
              <th style={{ textAlign: "left" }}>Name</th>
              <th style={{ textAlign: "left" }}>Created</th>
              <th style={{ textAlign: "right" }}>Tracks</th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((p) => (
              <tr key={p.playlist_id}>
                <td style={{ padding: "0.2rem 0.4rem" }}>{p.playlist_id}</td>
                <td style={{ padding: "0.2rem 0.4rem" }}>{p.name}</td>
                <td style={{ padding: "0.2rem 0.4rem" }}>{p.created_at}</td>
                <td
                  style={{ padding: "0.2rem 0.4rem", textAlign: "right" }}
                >
                  {p.track_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: "1rem" }}>Save Playlist (Route 15)</h3>
      <p style={{ fontSize: "0.85rem" }}>
        Provide a playlist name and a comma-separated list of Spotify IDs
        (you can copy IDs from the Mix or Track Search tabs).
      </p>
      <label>
        Playlist name:{" "}
        <input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
      </label>
      <br />
      <textarea
        rows={2}
        style={{ width: "100%", marginTop: "0.25rem" }}
        value={saveSpotifyIds}
        onChange={(e) => setSaveSpotifyIds(e.target.value)}
      />
      <button onClick={savePlaylist} style={{ marginTop: "0.5rem" }}>
        Save playlist for user {userId || "(set user id first)"}
      </button>

      <h3 style={{ marginTop: "1rem" }}>Delete Playlist (Route 17)</h3>
      <label>
        Playlist ID to delete:{" "}
        <input
          value={playlistToDelete}
          onChange={(e) => setPlaylistToDelete(e.target.value)}
          style={{ width: 100 }}
        />
      </label>{" "}
      <button onClick={deletePlaylist}>Delete</button>

      {message && (
        <p style={{ marginTop: "0.5rem", color: "green" }}>{message}</p>
      )}
    </section>
  );
}

export default App;