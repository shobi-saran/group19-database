import React, { useEffect, useState } from "react";
import CONFIG from "./config";

const BACKEND = CONFIG.BACKEND_URL;

function App() {
  const [activeTab, setActiveTab] = useState("genre");
  const [genres, setGenres] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [globalError, setGlobalError] = useState("");

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
        minHeight: "100vh",
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 1100,
        margin: "0 auto",
        backgroundColor: "#020617",
        color: "#e5e7eb",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>SoundScape</h1>
        <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "#9ca3af" }}>
          Backend: <code>{BACKEND}/api/…</code>
        </p>
        {dbStatus && (
          <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.3rem" }}>
            DB status: <strong>{dbStatus.status}</strong> — {dbStatus.message}{" "}
            {typeof dbStatus.total_tracks === "number" && (
              <>({dbStatus.total_tracks} tracks)</>
            )}
          </p>
        )}
        {globalError && (
          <p style={{ color: "#f97373", fontSize: "0.9rem", marginTop: "0.3rem" }}>
            {globalError}
          </p>
        )}
      </header>

      <nav style={{ marginBottom: "1rem" }}>
        {[
          ["genre", "Playlists by Genre"],
          ["artist", "Artist-Based"],
          ["charts", "Chart Hits & Hidden Gems"],
          ["mood", "Workout / Happy / Throwback"],
          ["discover", "Search & Similar Artists"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              marginRight: "0.5rem",
              padding: "0.45rem 0.9rem",
              borderRadius: 999,
              border: activeTab === key ? "1px solid #4f46e5" : "1px solid #1f2937",
              background: activeTab === key ? "#111827" : "#020617",
              color: "#e5e7eb",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "genre" && <GenrePlaylistPanel genres={genres} />}
      {activeTab === "artist" && <ArtistPanels />}
      {activeTab === "charts" && <ChartsPanels genres={genres} />}
      {activeTab === "mood" && <MoodPanels />}
      {activeTab === "discover" && <DiscoveryPanel />}
    </div>
  );
}

// helper

function PlaylistTable({ rows, extraCols = [] }) {
  if (!rows.length) return null;
  const sample = rows[0];

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
          <th style={{ textAlign: "left", padding: "0.3rem 0.4rem", borderBottom: "1px solid #1f2937" }}>Track</th>
          <th style={{ textAlign: "left", padding: "0.3rem 0.4rem", borderBottom: "1px solid #1f2937" }}>Artist</th>
          {hasGenre && (
            <th
              style={{
                textAlign: "left",
                padding: "0.3rem 0.4rem",
                borderBottom: "1px solid #1f2937",
              }}
            >
              Genre
            </th>
          )}
          {hasTempo && (
            <th
              style={{
                textAlign: "right",
                padding: "0.3rem 0.4rem",
                borderBottom: "1px solid #1f2937",
              }}
            >
              Tempo
            </th>
          )}
          {hasEnergy && (
            <th
              style={{
                textAlign: "right",
                padding: "0.3rem 0.4rem",
                borderBottom: "1px solid #1f2937",
              }}
            >
              Energy
            </th>
          )}
          {hasDance && (
            <th
              style={{
                textAlign: "right",
                padding: "0.3rem 0.4rem",
                borderBottom: "1px solid #1f2937",
              }}
            >
              Danceability
            </th>
          )}
          {hasPopularity && (
            <th
              style={{
                textAlign: "right",
                padding: "0.3rem 0.4rem",
                borderBottom: "1px solid #1f2937",
              }}
            >
              Popularity
            </th>
          )}
          {extraCols.map((c) => (
            <th
              key={c.key}
              style={{
                textAlign: c.align || "left",
                padding: "0.3rem 0.4rem",
                borderBottom: "1px solid #1f2937",
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td style={{ padding: "0.25rem 0.4rem", borderBottom: "1px solid #0f172a" }}>
              {r.track_name}
            </td>
            <td style={{ padding: "0.25rem 0.4rem", borderBottom: "1px solid #0f172a" }}>
              {r.artist_name}
            </td>
            {hasGenre && (
              <td style={{ padding: "0.25rem 0.4rem", borderBottom: "1px solid #0f172a" }}>
                {r.genre_name}
              </td>
            )}
            {hasTempo && (
              <td
                style={{
                  padding: "0.25rem 0.4rem",
                  textAlign: "right",
                  borderBottom: "1px solid #0f172a",
                }}
              >
                {r.tempo}
              </td>
            )}
            {hasEnergy && (
              <td
                style={{
                  padding: "0.25rem 0.4rem",
                  textAlign: "right",
                  borderBottom: "1px solid #0f172a",
                }}
              >
                {Number(r.energy).toFixed(2)}
              </td>
            )}
            {hasDance && (
              <td
                style={{
                  padding: "0.25rem 0.4rem",
                  textAlign: "right",
                  borderBottom: "1px solid #0f172a",
                }}
              >
                {Number(r.danceability).toFixed(2)}
              </td>
            )}
            {hasPopularity && (
              <td
                style={{
                  padding: "0.25rem 0.4rem",
                  textAlign: "right",
                  borderBottom: "1px solid #0f172a",
                }}
              >
                {r.popularity}
              </td>
            )}
            {extraCols.map((c) => (
              <td
                key={c.key}
                style={{
                  padding: "0.25rem 0.4rem",
                  textAlign: c.align || "left",
                  borderBottom: "1px solid #0f172a",
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

// Genre playlist (Route 2 + 11)

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

  const handleMinChange = (e) => {
    const value = Number(e.target.value);
    if (value <= tempoMax) {
      setTempoMin(value);
    } else {
      setTempoMin(tempoMax);
    }
  };

  const handleMaxChange = (e) => {
    const value = Number(e.target.value);
    if (value >= tempoMin) {
      setTempoMax(value);
    } else {
      setTempoMax(tempoMin);
    }
  };

  return (
    <section
      style={{
        backgroundColor: "#020617",
        borderRadius: 16,
        padding: "1.1rem 1.1rem 1.3rem",
        border: "1px solid #111827",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "0.4rem", fontSize: "1.2rem" }}>
        Playlist by Genre & Tempo
      </h2>
      <p style={{ marginTop: 0, marginBottom: "0.8rem", fontSize: "0.85rem", color: "#9ca3af" }}>
        Choose a genre and adjust the tempo range to generate a focused playlist.
      </p>
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
          style={{
            backgroundColor: "#020617",
            color: "#e5e7eb",
            borderRadius: 12,
            padding: "0.45rem 0.9rem",
            border: "1px solid #1f2937",
            minWidth: 220,
          }}
        >
          <option value="">Select a genre</option>
          {genres.map((g) => (
            <option key={g.genre_id} value={g.genre_name}>
              {g.genre_name}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Tempo {tempoMin}–{tempoMax}
          </span>
          <div
            style={{
              position: "relative",
              width: 260,
              height: 24,
              marginTop: "0.25rem",
            }}
          >
            <input
              type="range"
              min={60}
              max={220}
              value={tempoMin}
              onChange={handleMinChange}
              className="tempo-range tempo-range-min"
            />
            <input
              type="range"
              min={60}
              max={220}
              value={tempoMax}
              onChange={handleMaxChange}
              className="tempo-range tempo-range-max"
            />
          </div>
        </div>

        <button
          onClick={fetchPlaylist}
          style={{
            padding: "0.5rem 1.1rem",
            borderRadius: 12,
            border: "1px solid #4f46e5",
            backgroundColor: "#4f46e5",
            color: "#f9fafb",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Generate
        </button>
      </div>
      {error && (
        <p style={{ color: "#f97373", marginTop: "0.6rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
      <PlaylistTable rows={playlist} />
    </section>
  );
}

// Artist-based playlist (Route 1)

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
    <section
      style={{
        backgroundColor: "#020617",
        borderRadius: 16,
        padding: "1.1rem 1.1rem 1.3rem",
        border: "1px solid #111827",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "0.4rem", fontSize: "1.2rem" }}>
        Songs That Match This Artist&apos;s Sound
      </h2>
      <p style={{ marginTop: 0, marginBottom: "0.8rem", fontSize: "0.85rem", color: "#9ca3af" }}>
        Uses the artist&apos;s audio profile to find similar tracks by other artists, not the
        artist&apos;s own songs.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Favorite artist (exact name)"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          style={{
            backgroundColor: "#020617",
            color: "#e5e7eb",
            borderRadius: 10,
            padding: "0.45rem 0.7rem",
            border: "1px solid #1f2937",
            minWidth: 260,
          }}
        />
        <label style={{ fontSize: "0.9rem" }}>
          Limit:{" "}
          <input
            type="number"
            value={limit}
            min={1}
            max={50}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{
              width: 60,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
            }}
          />
        </label>
        <button
          onClick={fetchArtistPlaylist}
          style={{
            padding: "0.5rem 1.1rem",
            borderRadius: 12,
            border: "1px solid #4f46e5",
            backgroundColor: "#4f46e5",
            color: "#f9fafb",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Generate
        </button>
      </div>
      {error && (
        <p style={{ color: "#f97373", marginTop: "0.6rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
      <PlaylistTable rows={playlist} />
    </section>
  );
}

// Chart hits + hidden gems (Routes 3 & 4)

function ChartsPanels({ genres }) {
  const [genre, setGenre] = useState("");
  const maxRank = 1; // locked to #1
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
    <section
      style={{
        backgroundColor: "#020617",
        borderRadius: 16,
        padding: "1.1rem 1.1rem 1.3rem",
        border: "1px solid #111827",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "0.4rem", fontSize: "1.2rem" }}>
        Chart Hits & Hidden Gems
      </h2>
      <p style={{ marginTop: 0, marginBottom: "0.8rem", fontSize: "0.85rem", color: "#9ca3af" }}>
        Compare #1 chart hits with highly popular tracks that never made the charts.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{
            backgroundColor: "#020617",
            color: "#e5e7eb",
            borderRadius: 12,
            padding: "0.45rem 0.9rem",
            border: "1px solid #1f2937",
            minWidth: 220,
          }}
        >
          <option value="">Select genre</option>
          {genres.map((g) => (
            <option key={g.genre_id} value={g.genre_name}>
              {g.genre_name}
            </option>
          ))}
        </select>
        <label style={{ fontSize: "0.9rem" }}>
          Max chart rank:{" "}
          <input
            type="number"
            value={maxRank}
            readOnly
            disabled
            style={{
              width: 70,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
              cursor: "not-allowed",
            }}
          />
        </label>
        <button
          onClick={loadChartHits}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #4f46e5",
            backgroundColor: "#4f46e5",
            color: "#f9fafb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Load Chart Hits
        </button>
        <label style={{ fontSize: "0.9rem" }}>
          Hidden gems min popularity:{" "}
          <input
            type="number"
            value={minPopularity}
            onChange={(e) => setMinPopularity(Number(e.target.value))}
            style={{
              width: 70,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
            }}
          />
        </label>
        <button
          onClick={loadHiddenGems}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #4b5563",
            backgroundColor: "#111827",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Load Hidden Gems
        </button>
      </div>
      {error && (
        <p style={{ color: "#f97373", marginTop: "0.6rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {chartHits.length > 0 && (
        <>
          <h3 style={{ marginTop: "1rem", marginBottom: "0.3rem", fontSize: "1rem" }}>
            Chart Hits
          </h3>
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
          <h3 style={{ marginTop: "1rem", marginBottom: "0.3rem", fontSize: "1rem" }}>
            Hidden Gems
          </h3>
          <PlaylistTable rows={hiddenGems} />
        </>
      )}
    </section>
  );
}

// Workout (Routes 5, 6, 7)

function MoodPanels() {
  const [workout, setWorkout] = useState([]);
  const [minEnergy, setMinEnergy] = useState(0.75);
  const [minDance, setMinDance] = useState(0.65);

  const [happy, setHappy] = useState([]);
  const [minValence, setMinValence] = useState(0.7);

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
    <section
      style={{
        backgroundColor: "#020617",
        borderRadius: 16,
        padding: "1.1rem 1.1rem 1.3rem",
        border: "1px solid #111827",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "0.4rem", fontSize: "1.2rem" }}>
        Workout / Happy / Throwback
      </h2>

      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.3rem", fontSize: "1rem" }}>Workout Playlist</h3>
        <label style={{ fontSize: "0.9rem" }}>
          Min energy:{" "}
          <input
            type="number"
            step="0.05"
            value={minEnergy}
            onChange={(e) => setMinEnergy(Number(e.target.value))}
            style={{
              width: 70,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
            }}
          />
        </label>{" "}
        <label style={{ fontSize: "0.9rem" }}>
          Min danceability:{" "}
          <input
            type="number"
            step="0.05"
            value={minDance}
            onChange={(e) => setMinDance(Number(e.target.value))}
            style={{
              width: 70,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
            }}
          />
        </label>{" "}
        <button
          onClick={loadWorkout}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #4f46e5",
            backgroundColor: "#4f46e5",
            color: "#f9fafb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Generate workout playlist
        </button>
        <PlaylistTable rows={workout} />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.3rem", fontSize: "1rem" }}>Happy Mood Playlist</h3>
        <label style={{ fontSize: "0.9rem" }}>
          Min valence:{" "}
          <input
            type="number"
            step="0.05"
            value={minValence}
            onChange={(e) => setMinValence(Number(e.target.value))}
            style={{
              width: 70,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
            }}
          />
        </label>{" "}
        <button
          onClick={loadHappy}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #4b5563",
            backgroundColor: "#111827",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Generate happy playlist
        </button>
        <PlaylistTable rows={happy} />
      </div>

      <div>
        <h3 style={{ marginBottom: "0.3rem", fontSize: "1rem" }}>Throwback Playlist</h3>
        <label style={{ fontSize: "0.9rem" }}>
          Start year:{" "}
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            style={{
              width: 80,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
            }}
          />
        </label>{" "}
        <label style={{ fontSize: "0.9rem" }}>
          End year:{" "}
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
            style={{
              width: 80,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "0.2rem 0.4rem",
              border: "1px solid #1f2937",
            }}
          />
        </label>{" "}
        <button
          onClick={loadDecade}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #4b5563",
            backgroundColor: "#111827",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Generate throwback playlist
        </button>
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

// Discovery: artists & similar artists (Routes 9, 12)

function DiscoveryPanel() {
  const [artistQuery, setArtistQuery] = useState("");
  const [artists, setArtists] = useState([]);

  const [similarBase, setSimilarBase] = useState("");
  const [similarParams] = useState({
    min_tracks: 5,
    limit: 10,
  });
  const [similarResults, setSimilarResults] = useState([]);

  const searchArtists = async () => {
    const params = new URLSearchParams({ search: artistQuery });
    const res = await fetch(`${BACKEND}/api/artists?${params}`);
    const data = await res.json();
    setArtists(data);
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
    <section
      style={{
        backgroundColor: "#020617",
        borderRadius: 16,
        padding: "1.1rem 1.1rem 1.3rem",
        border: "1px solid #111827",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "0.4rem", fontSize: "1.2rem" }}>
        Discovery Tools
      </h2>

      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.3rem", fontSize: "1rem" }}>Search Artists</h3>
        <input
          placeholder="Artist name contains…"
          value={artistQuery}
          onChange={(e) => setArtistQuery(e.target.value)}
          style={{
            backgroundColor: "#020617",
            color: "#e5e7eb",
            borderRadius: 10,
            padding: "0.45rem 0.7rem",
            border: "1px solid #1f2937",
            minWidth: 260,
          }}
        />{" "}
        <button
          onClick={searchArtists}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #4b5563",
            backgroundColor: "#111827",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Search
        </button>
        {artists.length > 0 && (
          <ul
            style={{
              marginTop: "0.5rem",
              maxHeight: 150,
              overflowY: "auto",
              paddingLeft: "1.1rem",
              fontSize: "0.9rem",
            }}
          >
            {artists.map((a) => (
              <li key={a.artist_id}>
                {a.artist_name}{" "}
                <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                  (id {a.artist_id})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: "0.3rem", fontSize: "1rem" }}>Similar Artists</h3>
        <input
          placeholder="Base artist (exact name)"
          value={similarBase}
          onChange={(e) => setSimilarBase(e.target.value)}
          style={{
            backgroundColor: "#020617",
            color: "#e5e7eb",
            borderRadius: 10,
            padding: "0.45rem 0.7rem",
            border: "1px solid #1f2937",
            minWidth: 260,
          }}
        />{" "}
        <button
          onClick={loadSimilar}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #4f46e5",
            backgroundColor: "#4f46e5",
            color: "#f9fafb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Find similar
        </button>

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
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.3rem 0.4rem",
                    borderBottom: "1px solid #1f2937",
                  }}
                >
                  Artist
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "0.3rem 0.4rem",
                    borderBottom: "1px solid #1f2937",
                  }}
                >
                  Tracks
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "0.3rem 0.4rem",
                    borderBottom: "1px solid #1f2937",
                  }}
                >
                  Avg Popularity
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "0.3rem 0.4rem",
                    borderBottom: "1px solid #1f2937",
                  }}
                >
                  Avg Tempo
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "0.3rem 0.4rem",
                    borderBottom: "1px solid #1f2937",
                  }}
                >
                  Avg Energy
                </th>
              </tr>
            </thead>
            <tbody>
              {similarResults.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "0.25rem 0.4rem", borderBottom: "1px solid #0f172a" }}>
                    {r.artist_name}
                  </td>
                  <td
                    style={{
                      padding: "0.25rem 0.4rem",
                      textAlign: "right",
                      borderBottom: "1px solid #0f172a",
                    }}
                  >
                    {r.track_count}
                  </td>
                  <td
                    style={{
                      padding: "0.25rem 0.4rem",
                      textAlign: "right",
                      borderBottom: "1px solid #0f172a",
                    }}
                  >
                    {Number(r.avg_popularity).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "0.25rem 0.4rem",
                      textAlign: "right",
                      borderBottom: "1px solid #0f172a",
                    }}
                  >
                    {Number(r.avg_tempo).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "0.25rem 0.4rem",
                      textAlign: "right",
                      borderBottom: "1px solid #0f172a",
                    }}
                  >
                    {Number(r.avg_energy).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default App;