import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const TEAMS = {
  Jailbirds: {
    players: { Bernie: 0, Josh: 8, Cramer: 12, Marshall: 18, Michael: 18, Rij: 18, Jake: 19 },
  },
  Zookeepers: {
    players: { Kaelan: 6, Zach: 8, Howie: 12, Ziv: 14, Spencer: 14, Wolf: 15, Larry: 19 },
  },
};

const PLAYER_TEAM = Object.fromEntries(
  Object.entries(TEAMS).flatMap(([teamName, team]) =>
    Object.keys(team.players).map((player) => [player, teamName])
  )
);

const COURSE = {
  front: {
    label: "Front Nine",
    holes: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    par: [4, 3, 5, 3, 4, 5, 4, 4, 3],
    strokeIndex: [9, 17, 3, 13, 1, 5, 7, 15, 11],
  },
  back: {
    label: "Back Nine",
    holes: [10, 11, 12, 13, 14, 15, 16, 17, 18],
    par: [5, 4, 3, 4, 3, 5, 4, 4, 3],
    strokeIndex: [4, 12, 8, 2, 18, 6, 14, 10, 16],
  },
};

const SESSIONS = [
  {
    id: "sat-am",
    label: "Session 1",
    shortLabel: "S1",
    format: "Best Ball",
    allowance: "bestBall",
    nine: "front",
    matches: [
      { tee: 1, a: ["Josh", "Rij"], b: ["Spencer", "Howie"], playerStrokeOverride: { Josh: 0, Rij: 5, Spencer: 3, Howie: 2 } },
      { tee: 2, a: ["Cramer", "Michael"], b: ["Larry", "Wolf"], playerStrokeOverride: { Cramer: 0, Michael: 3, Larry: 4, Wolf: 2 } },
      { tee: 3, a: ["Marshall", "Jake"], b: ["Zach", "Kaelan"], playerStrokeOverride: { Marshall: 5, Jake: 6, Zach: 1, Kaelan: 0 } },
      { tee: 4, a: ["Bernie"], b: ["Ziv"], twosome: true, playerStrokeOverride: { Bernie: 0, Ziv: 7 } },
    ],
  },
  {
    id: "sat-pm",
    label: "Session 2",
    shortLabel: "S2",
    format: "Pinehurst Alt Shot",
    allowance: "altShot",
    nine: "back",
    matches: [
      { tee: 1, a: ["Michael"], b: ["Spencer"], twosome: true, strokeOverride: { a: 2, b: 0 } },
      { tee: 2, a: ["Rij", "Jake"], b: ["Howie", "Wolf"], strokeOverride: { a: 1, b: 0 } },
      { tee: 3, a: ["Cramer", "Marshall"], b: ["Zach", "Ziv"], strokeOverride: { a: 1, b: 0 } },
      { tee: 4, a: ["Josh", "Bernie"], b: ["Kaelan", "Larry"], strokeOverride: { a: 0, b: 2 } },
    ],
  },
  {
    id: "sun-am",
    label: "Session 3",
    shortLabel: "S3",
    format: "Scramble",
    allowance: "scramble",
    nine: "front",
    matches: [
      { tee: 1, a: ["Cramer", "Jake"], b: ["Howie", "Larry"], strokeOverride: { a: 0, b: 0 } },
      { tee: 2, a: ["Bernie", "Marshall"], b: ["Spencer", "Wolf"], strokeOverride: { a: 0, b: 1 } },
      { tee: 3, a: ["Michael", "Rij"], b: ["Kaelan", "Ziv"], strokeOverride: { a: 1, b: 0 } },
      { tee: 4, a: ["Josh"], b: ["Zach"], twosome: true, strokeOverride: { a: 0, b: 0 } },
    ],
  },
  {
    id: "sun-pm",
    label: "Session 4",
    shortLabel: "S4",
    format: "Singles",
    allowance: "singles",
    nine: "back",
    matches: [
      { tee: 1, a: ["Jake"], b: ["Wolf"], twosome: true, strokeOverride: { a: 2, b: 0 } },
      { tee: 2, a: ["Cramer"], b: ["Howie"], twosome: true, strokeOverride: { a: 0, b: 0 } },
      { tee: 3, a: ["Bernie"], b: ["Ziv"], twosome: true, strokeOverride: { a: 0, b: 7 } },
      { tee: 4, a: ["Rij"], b: ["Kaelan"], twosome: true, strokeOverride: { a: 6, b: 0 } },
      { tee: 5, a: ["Marshall"], b: ["Larry"], twosome: true, strokeOverride: { a: 0, b: 1 } },
      { tee: 6, a: ["Josh", "Michael"], b: ["Zach", "Spencer"], strokeOverride: { a: 1, b: 0 } },
    ],
  },
].map((session) => ({
  ...session,
  matches: session.matches.map((match, idx) => ({ ...match, id: `${session.id}-${idx + 1}` })),
}));

const MATCHES = SESSIONS.flatMap((session) => session.matches.map((match) => ({ ...match, session })));
const STORAGE_KEY = "qlc-live-scoring-fallback-v2";
const FORFEIT = "X";

function playerHandicap(player) {
  return TEAMS[PLAYER_TEAM[player]]?.players[player] ?? 0;
}

function sideLabel(players) {
  return players.join(" & ");
}

function sideTeamInitial(match, side) {
  const players = side === "A" ? match.a : match.b;
  return PLAYER_TEAM[players[0]] === "Jailbirds" ? "J" : "Z";
}

function holeResultLabel(match, result) {
  if (result === "A" || result === "B") return sideTeamInitial(match, result);
  if (result === "HALVE") return "½";
  return "—";
}

function isBestBall(session) {
  return session.allowance === "bestBall";
}

function sideSlotCount(session, players) {
  return isBestBall(session) ? players.length : 1;
}

function slotLabel(session, players, slotIdx) {
  return isBestBall(session) ? players[slotIdx] : sideLabel(players);
}

function normalizeScoreValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (String(value).trim().toUpperCase() === FORFEIT) return FORFEIT;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function blankScores(slotCount) {
  if (slotCount === 1) return Array(9).fill(null);
  return Array.from({ length: slotCount }, () => Array(9).fill(null));
}

function normalizeSideScores(scores, slotCount) {
  if (slotCount === 1) {
    const source = Array.isArray(scores?.[0]) ? scores[0] : scores;
    return Array.from({ length: 9 }, (_, i) => normalizeScoreValue(source?.[i]));
  }

  return Array.from({ length: slotCount }, (_, slotIdx) => {
    const source = Array.isArray(scores?.[slotIdx]) ? scores[slotIdx] : slotIdx === 0 ? scores : [];
    return Array.from({ length: 9 }, (_, i) => normalizeScoreValue(source?.[i]));
  });
}

function getScore(scores, slotCount, slotIdx, holeIdx) {
  const raw = slotCount === 1 ? scores?.[holeIdx] : scores?.[slotIdx]?.[holeIdx];
  return normalizeScoreValue(raw);
}

function setScore(scores, slotCount, slotIdx, holeIdx, value) {
  if (slotCount === 1) {
    const next = [...scores];
    next[holeIdx] = value;
    return next;
  }

  const next = Array.from({ length: slotCount }, (_, idx) =>
    Array.isArray(scores?.[idx]) ? [...scores[idx]] : Array(9).fill(null)
  );
  next[slotIdx][holeIdx] = value;
  return next;
}

function rawSideAllowance(players, session, match) {
  if (match.twosome || players.length === 1) return playerHandicap(players[0]);
  const h = players.map(playerHandicap).sort((a, b) => a - b);
  if (session.allowance === "bestBall") return Math.max(...h);
  if (session.allowance === "altShot") return 0.6 * h[0] + 0.4 * h[1];
  if (session.allowance === "scramble") return 0.35 * h[0] + 0.15 * h[1];
  return Math.max(...h);
}

function nineHoleAllowance(fullAllowance) {
  return Math.round(fullAllowance / 2);
}

function calculatedMatchStrokes(session, match) {
  if (match.strokeOverride) return match.strokeOverride;
  const rawA = rawSideAllowance(match.a, session, match);
  const rawB = rawSideAllowance(match.b, session, match);
  let a = nineHoleAllowance(rawA);
  let b = nineHoleAllowance(rawB);
  const low = Math.min(a, b);
  a -= low;
  b -= low;
  if (match.specialStrokeToA) a += match.specialStrokeToA;
  if (match.specialStrokeToB) b += match.specialStrokeToB;
  return { a, b };
}

function calculatedPlayerStrokes(session, match) {
  if (!isBestBall(session)) return null;
  if (match.playerStrokeOverride) return match.playerStrokeOverride;
  const allPlayers = [...match.a, ...match.b];
  const byPlayer = Object.fromEntries(allPlayers.map((player) => [player, nineHoleAllowance(playerHandicap(player))]));
  const low = Math.min(...Object.values(byPlayer));
  return Object.fromEntries(allPlayers.map((player) => [player, byPlayer[player] - low]));
}

function matchStrokes(session, match, row) {
  if (isBestBall(session)) {
    return {
      a: match.a.map((player) => ({ player, strokes: calculatedPlayerStrokes(session, match)[player] })),
      b: match.b.map((player) => ({ player, strokes: calculatedPlayerStrokes(session, match)[player] })),
      manual: false,
    };
  }

  const calculated = calculatedMatchStrokes(session, match);
  const hasManualA = row?.manual_a !== null && row?.manual_a !== undefined && row?.manual_a !== "";
  const hasManualB = row?.manual_b !== null && row?.manual_b !== undefined && row?.manual_b !== "";
  return {
    a: hasManualA ? Number(row.manual_a) : calculated.a,
    b: hasManualB ? Number(row.manual_b) : calculated.b,
    manual: hasManualA || hasManualB,
  };
}

function strokeMap(strokes, course) {
  const map = Array(9).fill(0);
  const sortedNine = course.strokeIndex.map((idx, holeIdx) => ({ idx, holeIdx })).sort((x, y) => x.idx - y.idx);
  for (let s = 1; s <= strokes; s++) {
    const targetRank = ((s - 1) % 9) + 1;
    map[sortedNine[targetRank - 1].holeIdx] += 1;
  }
  return map;
}

function blankRow(match) {
  const session = match.session;
  return {
    match_id: match.id,
    gross_a: blankScores(sideSlotCount(session, match.a)),
    gross_b: blankScores(sideSlotCount(session, match.b)),
    manual_a: null,
    manual_b: null,
    updated_at: new Date().toISOString(),
  };
}

function blankRowsById() {
  return Object.fromEntries(MATCHES.map((m) => [m.id, blankRow(m)]));
}

function normalizeRows(rows) {
  const byId = blankRowsById();
  for (const row of rows || []) {
    const match = MATCHES.find((m) => m.id === row.match_id);
    if (!match) continue;
    const session = match.session;
    byId[row.match_id] = {
      ...blankRow(match),
      ...row,
      gross_a: normalizeSideScores(row.gross_a, sideSlotCount(session, match.a)),
      gross_b: normalizeSideScores(row.gross_b, sideSlotCount(session, match.b)),
    };
  }
  return byId;
}

function loadLocalRows() {
  try {
    const savedRows = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return savedRows ? normalizeRows(Object.values(savedRows)) : blankRowsById();
  } catch {
    return blankRowsById();
  }
}

function saveLocalRows(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function computeMatch(session, match, row) {
  const course = COURSE[session.nine];
  const strokes = matchStrokes(session, match, row);
  const aSlotCount = sideSlotCount(session, match.a);
  const bSlotCount = sideSlotCount(session, match.b);
  const aMaps = isBestBall(session)
    ? strokes.a.map(({ strokes: playerStrokes }) => strokeMap(playerStrokes, course))
    : [strokeMap(strokes.a, course)];
  const bMaps = isBestBall(session)
    ? strokes.b.map(({ strokes: playerStrokes }) => strokeMap(playerStrokes, course))
    : [strokeMap(strokes.b, course)];
  let holesWonA = 0;
  let holesWonB = 0;
  let completed = 0;
  const holeResults = [];

  function sideNet(scores, maps, slotCount, holeIdx) {
    const values = Array.from({ length: slotCount }, (_, slotIdx) => getScore(scores, slotCount, slotIdx, holeIdx));
    if (values.some((value) => value === null)) return { known: false, forfeited: false, net: null };
    const nets = values
      .map((value, slotIdx) => (value === FORFEIT ? null : value - maps[slotIdx][holeIdx]))
      .filter((value) => value !== null);
    return { known: true, forfeited: nets.length === 0, net: nets.length ? Math.min(...nets) : null };
  }

  for (let i = 0; i < 9; i++) {
    const aNet = sideNet(row.gross_a, aMaps, aSlotCount, i);
    const bNet = sideNet(row.gross_b, bMaps, bSlotCount, i);
    if (!aNet.known || !bNet.known) {
      holeResults.push(null);
      continue;
    }
    completed++;

    if (aNet.forfeited && bNet.forfeited) {
      holeResults.push("HALVE");
    } else if (aNet.forfeited) {
      holesWonB++;
      holeResults.push("B");
    } else if (bNet.forfeited) {
      holesWonA++;
      holeResults.push("A");
    } else if (aNet.net < bNet.net) {
      holesWonA++;
      holeResults.push("A");
    } else if (bNet.net < aNet.net) {
      holesWonB++;
      holeResults.push("B");
    } else {
      holeResults.push("HALVE");
    }
  }

  const diff = holesWonA - holesWonB;
  const remaining = 9 - completed;
  let status = "Not started";
  let compact = "—";
  let pointsA = 0;
  let pointsB = 0;

  if (completed > 0) {
    if (Math.abs(diff) > remaining) {
      const winner = diff > 0 ? "A" : "B";
      compact = `${Math.abs(diff)} & ${remaining}`;
      status = `${winner === "A" ? sideLabel(match.a) : sideLabel(match.b)} wins ${compact}`;
      pointsA = diff > 0 ? 1 : 0;
      pointsB = diff > 0 ? 0 : 1;
    } else if (completed === 9) {
      if (diff === 0) {
        status = "Halved";
        compact = "½";
        pointsA = 0.5;
        pointsB = 0.5;
      } else {
        const winner = diff > 0 ? "A" : "B";
        compact = "1 UP";
        status = `${winner === "A" ? sideLabel(match.a) : sideLabel(match.b)} wins 1 UP`;
        pointsA = diff > 0 ? 1 : 0;
        pointsB = diff > 0 ? 0 : 1;
      }
    } else if (diff === 0) {
      status = `All square thru ${completed}`;
      compact = `AS thru ${completed}`;
    } else {
      compact = `${Math.abs(diff)} UP thru ${completed}`;
      status = `${diff > 0 ? sideLabel(match.a) : sideLabel(match.b)} ${compact}`;
    }
  }

  return { status, compact, pointsA, pointsB, completed, diff, holeResults, aMaps, bMaps, aMap: aMaps[0], bMap: bMaps[0] };
}

function useScores() {
  const [rows, setRows] = useState(() => loadLocalRows());
  const rowsRef = useRef(rows);
  const [syncStatus, setSyncStatus] = useState(supabase ? "connecting" : "local");

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    async function load() {
      const { data, error } = await supabase.from("match_scores").select("*");
      if (error) {
        console.error(error);
        setSyncStatus("error");
        return;
      }

      const existingIds = new Set((data || []).map((r) => r.match_id));
      const missing = MATCHES.filter((m) => !existingIds.has(m.id)).map((m) => blankRow(m));

      if (missing.length) {
        await supabase.from("match_scores").upsert(missing);
      }

      const { data: refreshed } = await supabase.from("match_scores").select("*");
      if (active) {
        const nextRows = normalizeRows(refreshed || data || []);
        rowsRef.current = nextRows;
        setRows(nextRows);
        setSyncStatus("live");
      }
    }

    load();

    const channel = supabase
      .channel("qlc-match-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_scores" }, (payload) => {
        const row = payload.new;
        if (!row?.match_id) return;
        setRows((prev) => {
          const nextRows = { ...prev, [row.match_id]: normalizeRows([row])[row.match_id] };
          rowsRef.current = nextRows;
          return nextRows;
        });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setSyncStatus("live");
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateRow(matchId, patch) {
    const currentRows = rowsRef.current;
    const currentRow = currentRows[matchId];
    const resolvedPatch = typeof patch === "function" ? patch(currentRow) : patch;
    const nextRow = { ...currentRow, ...resolvedPatch, updated_at: new Date().toISOString() };
    const nextRows = { ...currentRows, [matchId]: nextRow };
    rowsRef.current = nextRows;
    setRows(nextRows);

    if (!supabase) {
      saveLocalRows(nextRows);
      return;
    }

    const { error } = await supabase.from("match_scores").upsert(nextRow);
    if (error) {
      console.error(error);
      setSyncStatus("error");
    }
  }

  return { rows, updateRow, syncStatus };
}

function getInitialRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [view, matchId] = hash.split("/");
  if (view === "score" && matchId) return { view: "score", matchId };
  if (view === "score") return { view: "score", matchId: MATCHES[0].id };
  if (view === "admin") return { view: "admin", matchId: null };
  return { view: "board", matchId: null };
}

function setHash(view, matchId) {
  window.location.hash = view === "score" && matchId ? `/score/${matchId}` : `/${view}`;
}

function Header({ route, setRoute, syncStatus }) {
  function nav(view) {
    const next = { view, matchId: view === "score" ? route.matchId || MATCHES[0].id : null };
    setRoute(next);
    setHash(next.view, next.matchId);
  }

  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">QLC Live Scoring</div>
        <div className="brand">The QLC</div>
      </div>
      <div className="nav">
        <button className={route.view === "board" ? "active" : ""} onClick={() => nav("board")}>Board</button>
        <button className={route.view === "score" ? "active" : ""} onClick={() => nav("score")}>Score</button>
        <button className={route.view === "admin" ? "active" : ""} onClick={() => nav("admin")}>Admin</button>
      </div>
      <div className={`sync ${syncStatus}`}>{syncStatus === "live" ? "Live" : syncStatus === "local" ? "Local" : syncStatus}</div>
    </header>
  );
}

function addSidePointsToTeams(match, pointsA, pointsB, totals) {
  const aTeam = PLAYER_TEAM[match.a[0]];
  if (aTeam === "Jailbirds") {
    totals.jailbirds += pointsA;
    totals.zookeepers += pointsB;
  } else {
    totals.jailbirds += pointsB;
    totals.zookeepers += pointsA;
  }
}

function projectedSidePoints(result) {
  const decided = result.pointsA + result.pointsB > 0;
  if (decided) return { pointsA: result.pointsA, pointsB: result.pointsB, counted: true, active: false };
  if (result.completed === 0) return { pointsA: 0, pointsB: 0, counted: false, active: false };
  if (result.diff > 0) return { pointsA: 1, pointsB: 0, counted: true, active: true };
  if (result.diff < 0) return { pointsA: 0, pointsB: 1, counted: true, active: true };
  return { pointsA: 0.5, pointsB: 0.5, counted: true, active: true };
}

function scoreTotals(rows) {
  const actual = { jailbirds: 0, zookeepers: 0 };
  const projected = { jailbirds: 0, zookeepers: 0 };
  let decided = 0;
  let projectedCount = 0;
  let active = 0;

  SESSIONS.forEach((session) => {
    session.matches.forEach((match) => {
      const result = computeMatch(session, match, rows[match.id]);
      addSidePointsToTeams(match, result.pointsA, result.pointsB, actual);
      decided += result.pointsA + result.pointsB;

      const projection = projectedSidePoints(result);
      addSidePointsToTeams(match, projection.pointsA, projection.pointsB, projected);
      if (projection.counted) projectedCount += projection.pointsA + projection.pointsB;
      if (projection.active) active++;
    });
  });

  return { actual, projected, decided, projectedCount, active };
}

function OverallScore({ rows }) {
  const totals = useMemo(() => scoreTotals(rows), [rows]);

  return (
    <section className="scoreHero">
      <div className="scoreTitle">
        <span>Overall Score</span>
        <span>{totals.decided}/{MATCHES.length} pts decided</span>
      </div>
      <div className="scoreBoxes">
        <div className="scoreBox">
          <div>Jailbirds</div>
          <strong>{totals.actual.jailbirds}</strong>
        </div>
        <div className="scoreBox">
          <div>Zookeepers</div>
          <strong>{totals.actual.zookeepers}</strong>
        </div>
      </div>
      <div className="projectionPanel">
        <div className="scoreTitle projectionTitle">
          <span>Projected</span>
          <span>{totals.active ? `${totals.active} active` : "No active matches"}</span>
        </div>
        <div className="projectionBoxes">
          <div>
            <span>Jailbirds</span>
            <strong>{totals.projected.jailbirds}</strong>
          </div>
          <div>
            <span>Zookeepers</span>
            <strong>{totals.projected.zookeepers}</strong>
          </div>
        </div>
        <small>{totals.projectedCount}/{MATCHES.length} pts projected from decided and active matches</small>
      </div>
    </section>
  );
}

function Board({ rows }) {
  return (
    <main className="page">
      <OverallScore rows={rows} />
      <div className="sessionGrid">
        {SESSIONS.map((session) => (
          <section className="card" key={session.id}>
            <div className="cardHeader">
              <div>
                <h2>{session.label}</h2>
                <p>{session.format} · {COURSE[session.nine].label}</p>
              </div>
              <span className="badge">{session.shortLabel}</span>
            </div>
            <div className="matchList">
              {session.matches.map((match) => {
                const result = computeMatch(session, match, rows[match.id]);
                const strokes = matchStrokes(session, match, rows[match.id]);
                return (
                  <div className="matchCard" key={match.id}>
                    <div>
                      <small>Tee {match.tee}</small>
                      <strong>{sideLabel(match.a)}</strong>
                      <strong className="mutedText">{sideLabel(match.b)}</strong>
                    </div>
                    <div className="right">
                      <strong>{result.compact}</strong>
                      <small>thru {result.completed}</small>
                    </div>
                    <div className="meta">Strokes: {strokesText(session, match, strokes)}{strokes.manual ? " · manual" : ""}</div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function MatchSelect({ value, onChange }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {MATCHES.map(({ session, ...match }) => (
        <option key={match.id} value={match.id}>
          {session.shortLabel} · Tee {match.tee} · {sideLabel(match.a)} vs {sideLabel(match.b)}
        </option>
      ))}
    </select>
  );
}

function ScoreButton({ value, current, onClick }) {
  return (
    <button className={`scoreButton ${String(value) === String(current ?? "") ? "selected" : ""}`} onClick={onClick}>
      {value}
    </button>
  );
}

function scoreOptions(par) {
  return [Math.max(1, par - 2), par - 1, par, par + 1, par + 2, par + 3, par + 4, FORFEIT]
    .filter((v, i, arr) => v === FORFEIT || (v > 0 && arr.indexOf(v) === i));
}

function strokesText(session, match, strokes) {
  if (isBestBall(session)) {
    return [...strokes.a, ...strokes.b].map(({ player, strokes: playerStrokes }) => `${player} ${playerStrokes}`).join(", ");
  }
  return `${sideLabel(match.a)} ${strokes.a}, ${sideLabel(match.b)} ${strokes.b}`;
}

function Score({ rows, updateRow, route, setRoute }) {
  const selectedMatchId = route.matchId || MATCHES[0].id;
  const found = MATCHES.find((m) => m.id === selectedMatchId) || MATCHES[0];
  const session = found.session;
  const match = found;
  const row = rows[match.id];
  const [holeIdx, setHoleIdx] = useState(0);

  useEffect(() => setHoleIdx(0), [selectedMatchId]);

  const course = COURSE[session.nine];
  const result = computeMatch(session, match, row);
  const strokes = matchStrokes(session, match, row);
  const hole = course.holes[holeIdx];
  const par = course.par[holeIdx];
  const options = scoreOptions(par);
  const aSlotCount = sideSlotCount(session, match.a);
  const bSlotCount = sideSlotCount(session, match.b);

  function selectMatch(matchId) {
    const next = { view: "score", matchId };
    setRoute(next);
    setHash(next.view, next.matchId);
  }

  function setGross(side, slotIdx, value) {
    const key = side === "a" ? "gross_a" : "gross_b";
    const slotCount = side === "a" ? aSlotCount : bSlotCount;
    updateRow(match.id, (currentRow) => ({
      [key]: setScore(currentRow[key], slotCount, slotIdx, holeIdx, value),
    }));
  }

  function clearHole() {
    updateRow(match.id, (currentRow) => {
      let grossA = currentRow.gross_a;
      let grossB = currentRow.gross_b;
      for (let slotIdx = 0; slotIdx < aSlotCount; slotIdx++) {
        grossA = setScore(grossA, aSlotCount, slotIdx, holeIdx, null);
      }
      for (let slotIdx = 0; slotIdx < bSlotCount; slotIdx++) {
        grossB = setScore(grossB, bSlotCount, slotIdx, holeIdx, null);
      }
      return { gross_a: grossA, gross_b: grossB };
    });
  }

  return (
    <main className="page narrow">
      <section className="card">
        <div className="eyebrow">Mobile score entry</div>
        <MatchSelect value={selectedMatchId} onChange={selectMatch} />
        <div className="matchSummary">
          <small>{session.label} · {session.format} · {course.label}</small>
          <h2>{sideLabel(match.a)} vs {sideLabel(match.b)}</h2>
          <p>{result.status}</p>
          <small>Net strokes: {strokesText(session, match, strokes)}</small>
        </div>
      </section>

      <section className="card holeCard">
        <div className="holeNav">
          <button disabled={holeIdx === 0} onClick={() => setHoleIdx(holeIdx - 1)}>‹</button>
          <div>
            <small>Hole</small>
            <strong>{hole}</strong>
            <small>Par {par} · SI {course.strokeIndex[holeIdx]}</small>
          </div>
          <button disabled={holeIdx === 8} onClick={() => setHoleIdx(holeIdx + 1)}>›</button>
        </div>

        {Array.from({ length: aSlotCount }, (_, slotIdx) => (
          <SideScorer
            key={`a-${slotIdx}`}
            label={slotLabel(session, match.a, slotIdx)}
            side={sideLabel(match.a)}
            stroke={result.aMaps[slotIdx][holeIdx] > 0}
            current={getScore(row.gross_a, aSlotCount, slotIdx, holeIdx)}
            options={options}
            onSelect={(n) => setGross("a", slotIdx, n)}
          />
        ))}
        {Array.from({ length: bSlotCount }, (_, slotIdx) => (
          <SideScorer
            key={`b-${slotIdx}`}
            label={slotLabel(session, match.b, slotIdx)}
            side={sideLabel(match.b)}
            stroke={result.bMaps[slotIdx][holeIdx] > 0}
            current={getScore(row.gross_b, bSlotCount, slotIdx, holeIdx)}
            options={options}
            onSelect={(n) => setGross("b", slotIdx, n)}
          />
        ))}

        <div className="twoButtons">
          <button className="secondary" onClick={clearHole}>Clear Hole</button>
          <button disabled={holeIdx === 8} onClick={() => setHoleIdx(Math.min(8, holeIdx + 1))}>Next Hole</button>
        </div>
      </section>

      <section className="card">
        <h3>Quick scorecard</h3>
        <div className="holeGrid">
          {course.holes.map((h, i) => (
            <button key={h} className={i === holeIdx ? "selected" : ""} onClick={() => setHoleIdx(i)}>
              <strong>{h}</strong>
              <span className={`holeResult ${result.holeResults[i] || "empty"}`}>
                {holeResultLabel(match, result.holeResults[i])}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function SideScorer({ label, side, stroke, current, options, onSelect }) {
  return (
    <div className={`sideScorer ${stroke ? "hasStroke" : ""}`}>
      <div className="sideScorerTop">
        <div>
          <h3>{label}</h3>
          <small>{side !== label ? `${side} · ` : ""}{stroke ? "Stroke on this hole" : "No stroke on this hole"}</small>
        </div>
        {stroke && <span className="strokeBadge">Stroke</span>}
        <strong>{current ?? "—"}</strong>
      </div>
      <div className="scoreGrid">
        {options.map((n) => (
          <ScoreButton key={n} value={n} current={current} onClick={() => onSelect(n)} />
        ))}
      </div>
    </div>
  );
}

function Admin({ rows, updateRow }) {
  function updateManual(matchId, side, raw) {
    const value = raw === "" ? null : Number(raw.replace(/[^0-9]/g, "").slice(0, 2));
    updateRow(matchId, { [side]: value });
  }

  function updateGross(matchId, key, holeIdx, raw) {
    updateGrossSlot(matchId, key, 0, holeIdx, raw);
  }

  function updateGrossSlot(matchId, key, slotIdx, holeIdx, raw) {
    const match = MATCHES.find((m) => m.id === matchId);
    const slotCount = key === "gross_a" ? sideSlotCount(match.session, match.a) : sideSlotCount(match.session, match.b);
    const cleaned = raw.trim().toUpperCase() === FORFEIT ? FORFEIT : raw === "" ? null : Number(raw.replace(/[^0-9]/g, "").slice(0, 2));
    updateRow(matchId, (currentRow) => ({
      [key]: setScore(currentRow[key], slotCount, slotIdx, holeIdx, normalizeScoreValue(cleaned)),
    }));
  }

  return (
    <main className="page">
      <section className="card">
        <h2>Commissioner Admin</h2>
        <p className="mutedText">Use this to correct scores and override match strokes.</p>
      </section>

      <div className="sessionGrid">
        {SESSIONS.map((session) => (
          <section className="card" key={session.id}>
            <div className="cardHeader">
              <div>
                <h2>{session.shortLabel}</h2>
                <p>{session.format} · {COURSE[session.nine].label}</p>
              </div>
            </div>
            {session.matches.map((match) => {
              const row = rows[match.id];
              const result = computeMatch(session, match, row);
              const calculated = calculatedMatchStrokes(session, match);
              const strokes = matchStrokes(session, match, row);
              const course = COURSE[session.nine];
              const aSlotCount = sideSlotCount(session, match.a);
              const bSlotCount = sideSlotCount(session, match.b);
              return (
                <div className="adminMatch" key={match.id}>
                  <strong>{sideLabel(match.a)} vs {sideLabel(match.b)}</strong>
                  <small>{result.status}</small>
                  {isBestBall(session) ? (
                    <div className="meta adminStrokeMeta">Player strokes: {strokesText(session, match, strokes)}</div>
                  ) : (
                    <div className="manualGrid">
                      <label>
                        {sideLabel(match.a)} strokes
                        <input value={row.manual_a ?? ""} placeholder={String(calculated.a)} onChange={(e) => updateManual(match.id, "manual_a", e.target.value)} />
                      </label>
                      <label>
                        {sideLabel(match.b)} strokes
                        <input value={row.manual_b ?? ""} placeholder={String(calculated.b)} onChange={(e) => updateManual(match.id, "manual_b", e.target.value)} />
                      </label>
                    </div>
                  )}
                  <div className="adminTableWrap">
                    <table className="adminTable">
                      <thead>
                        <tr>
                          <th>Side</th>
                          {course.holes.map((h) => <th key={h}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: aSlotCount }, (_, slotIdx) => (
                          <tr key={`a-${slotIdx}`}>
                            <td>{slotLabel(session, match.a, slotIdx)}</td>
                            {course.holes.map((h, i) => (
                              <td key={h}>
                                <input
                                  value={getScore(row.gross_a, aSlotCount, slotIdx, i) ?? ""}
                                  onChange={(e) => updateGrossSlot(match.id, "gross_a", slotIdx, i, e.target.value)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                        {Array.from({ length: bSlotCount }, (_, slotIdx) => (
                          <tr key={`b-${slotIdx}`}>
                            <td>{slotLabel(session, match.b, slotIdx)}</td>
                            {course.holes.map((h, i) => (
                              <td key={h}>
                                <input
                                  value={getScore(row.gross_b, bSlotCount, slotIdx, i) ?? ""}
                                  onChange={(e) => updateGrossSlot(match.id, "gross_b", slotIdx, i, e.target.value)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </main>
  );
}

function App() {
  const { rows, updateRow, syncStatus } = useScores();
  const [route, setRoute] = useState(getInitialRoute);

  useEffect(() => {
    const onHash = () => setRoute(getInitialRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <Header route={route} setRoute={setRoute} syncStatus={syncStatus} />
      {route.view === "score" && <Score rows={rows} updateRow={updateRow} route={route} setRoute={setRoute} />}
      {route.view === "admin" && <Admin rows={rows} updateRow={updateRow} />}
      {route.view === "board" && <Board rows={rows} />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
