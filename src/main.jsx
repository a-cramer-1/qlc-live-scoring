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

const PLAYER_HEADSHOTS = Object.fromEntries(
  Object.keys(PLAYER_TEAM).map((player) => [player, `/assets/winners/singles/${player.toLowerCase()}.png`])
);

const TIE_HEADSHOT = "/assets/qlc-white.png";

const WINNER_PAIR_HEADSHOTS = {
  "Bernie|Josh": "/assets/winners/pairs/josh-bernie.png",
  "Bernie|Marshall": "/assets/winners/pairs/bernie-marshall.png",
  "Cramer|Jake": "/assets/winners/pairs/cramer-jake.png",
  "Cramer|Marshall": "/assets/winners/pairs/cramer-marshall.png",
  "Cramer|Michael": "/assets/winners/pairs/cramer-michael.png",
  "Howie|Larry": "/assets/winners/pairs/howie-larry.png",
  "Howie|Spencer": "/assets/winners/pairs/spencer-howie.png",
  "Howie|Wolf": "/assets/winners/pairs/howie-wolf.png",
  "Jake|Marshall": "/assets/winners/pairs/marshall-jake.png",
  "Jake|Rij": "/assets/winners/pairs/rij-jake.png",
  "Josh|Michael": "/assets/winners/pairs/josh-michael.png",
  "Josh|Rij": "/assets/winners/pairs/josh-rij.png",
  "Kaelan|Larry": "/assets/winners/pairs/kaelan-larry.png",
  "Kaelan|Zach": "/assets/winners/pairs/zach-kaelan.png",
  "Kaelan|Ziv": "/assets/winners/pairs/kaelan-ziv.png",
  "Larry|Wolf": "/assets/winners/pairs/larry-wolf.png",
  "Michael|Rij": "/assets/winners/pairs/michael-rij.png",
  "Spencer|Wolf": "/assets/winners/pairs/spencer-wolf.png",
  "Spencer|Zach": "/assets/winners/pairs/zach-spencer.png",
  "Zach|Ziv": "/assets/winners/pairs/zach-ziv.png",
};

function playerImageKey(players) {
  return [...players].sort((a, b) => a.localeCompare(b)).join("|");
}

function winnerImageForPlayers(players) {
  if (!players?.length) return "";
  if (players.length === 1) return PLAYER_HEADSHOTS[players[0]] || "";
  return WINNER_PAIR_HEADSHOTS[playerImageKey(players)] || "";
}

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
      { tee: 3, a: ["Marshall", "Jake"], b: ["Zach", "Kaelan"], playerStrokeOverride: { Marshall: 6, Jake: 7, Zach: 1, Kaelan: 0 } },
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
      { tee: 2, a: ["Rij", "Jake"], b: ["Howie", "Wolf"], strokeOverride: { a: 2, b: 0 } },
      { tee: 3, a: ["Cramer", "Marshall"], b: ["Zach", "Ziv"], strokeOverride: { a: 2, b: 0 } },
      { tee: 4, a: ["Josh", "Bernie"], b: ["Kaelan", "Larry"], strokeOverride: { a: 0, b: 4 } },
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
      { tee: 2, a: ["Bernie", "Marshall"], b: ["Spencer", "Wolf"], strokeOverride: { a: 0, b: 2 } },
      { tee: 3, a: ["Michael", "Rij"], b: ["Kaelan", "Ziv"], strokeOverride: { a: 2, b: 0 } },
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
      { tee: 5, a: ["Marshall"], b: ["Larry"], twosome: true, strokeOverride: { a: 0, b: 0 } },
      { tee: 6, a: ["Josh", "Michael"], b: ["Zach", "Spencer"], strokeOverride: { a: 1, b: 0 } },
    ],
  },
].map((session) => ({
  ...session,
  matches: session.matches.map((match, idx) => ({ ...match, id: `${session.id}-${idx + 1}` })),
}));

const MATCHES = SESSIONS.flatMap((session) => session.matches.map((match) => ({ ...match, session })));
const STORAGE_KEY = "qlc-live-scoring-fallback-v2";
const SETTINGS_STORAGE_KEY = "qlc-live-scoring-settings-v1";
const SETTINGS_MATCH_ID = "__app_settings__";
const ADMIN_AUTH_KEY = "qlc-admin-auth";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "qlc2026";
const FORFEIT = "X";
const SCORE_REFRESH_MS = 15000;
const SETTINGS_REFRESH_MS = 10000;
const DEFAULT_SETTINGS = {
  visibleSessionIds: ["sat-am", "sat-pm"],
  sessionOrder: ["sat-am", "sat-pm", "sun-am", "sun-pm"],
  lockedSessionIds: [],
};

function playerHandicap(player) {
  return TEAMS[PLAYER_TEAM[player]]?.players[player] ?? 0;
}

function sideLabel(players) {
  return players.join(" & ");
}

function teamKey(teamName) {
  return teamName === "Jailbirds" ? "jailbirds" : "zookeepers";
}

function sideTeamName(match, side) {
  const players = side === "A" ? match.a : match.b;
  return PLAYER_TEAM[players[0]];
}

function sideTeamInitial(match, side) {
  return sideTeamName(match, side) === "Jailbirds" ? "J" : "Z";
}

function holeResultLabel(match, result) {
  if (result === "A" || result === "B") return sideTeamInitial(match, result);
  if (result === "HALVE") return "½";
  return "—";
}

function resultTeamName(match, result) {
  if (result !== "A" && result !== "B") return null;
  return sideTeamName(match, result);
}

function resultTeamClass(match, result) {
  const teamName = resultTeamName(match, result);
  return teamName ? `team-${teamKey(teamName)}` : "";
}

function sideTeamClass(match, side) {
  return `team-${teamKey(sideTeamName(match, side))}`;
}

function sideNameClass(match, result, side) {
  const winner = winningSide(result);
  const lost = result.pointsA + result.pointsB > 0 && winner && winner !== side;
  return ["sideName", sideTeamClass(match, side), lost ? "lost" : ""].filter(Boolean).join(" ");
}

function leadingTeamClass(match, result) {
  if (result.diff > 0) return `leading-${teamKey(sideTeamName(match, "A"))}`;
  if (result.diff < 0) return `leading-${teamKey(sideTeamName(match, "B"))}`;
  if (result.completed > 0) return "leading-tied";
  return "";
}

function segmentIsFinal(result) {
  return result.pointsA + result.pointsB > 0 || (result.completed === result.totalHoles && result.completed > 0);
}

function winningSide(result) {
  if (result.pointsA > result.pointsB) return "A";
  if (result.pointsB > result.pointsA) return "B";
  return null;
}

function holeResultClasses(match, result) {
  return ["holeResult", result || "empty", resultTeamClass(match, result)].filter(Boolean).join(" ");
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
    const next = Array.isArray(scores) ? [...scores] : Array(9).fill(null);
    next[holeIdx] = value;
    return next;
  }

  const next = Array.from({ length: slotCount }, (_, idx) =>
    Array.isArray(scores?.[idx]) ? [...scores[idx]] : Array(9).fill(null)
  );
  next[slotIdx][holeIdx] = value;
  return next;
}

function sideHasSubmittedHoleScore(scores, slotCount, holeIdx) {
  return Array.from({ length: slotCount }, (_, slotIdx) => getScore(scores, slotCount, slotIdx, holeIdx))
    .some((score) => score !== null);
}

function sideHasMissingHoleScore(scores, slotCount, holeIdx) {
  return Array.from({ length: slotCount }, (_, slotIdx) => getScore(scores, slotCount, slotIdx, holeIdx))
    .some((score) => score === null);
}

function fillMissingSideScores(scores, slotCount, holeIdx) {
  let next = normalizeSideScores(scores, slotCount);
  for (let slotIdx = 0; slotIdx < slotCount; slotIdx++) {
    if (getScore(next, slotCount, slotIdx, holeIdx) === null) {
      next = setScore(next, slotCount, slotIdx, holeIdx, FORFEIT);
    }
  }
  return next;
}

function bestBallHoleNeedsAutoForfeit(row, session, match, holeIdx) {
  if (!isBestBall(session)) return false;
  const aSlotCount = sideSlotCount(session, match.a);
  const bSlotCount = sideSlotCount(session, match.b);
  const aStarted = sideHasSubmittedHoleScore(row.gross_a, aSlotCount, holeIdx);
  const bStarted = sideHasSubmittedHoleScore(row.gross_b, bSlotCount, holeIdx);
  if (!aStarted || !bStarted) return false;

  return sideHasMissingHoleScore(row.gross_a, aSlotCount, holeIdx)
    || sideHasMissingHoleScore(row.gross_b, bSlotCount, holeIdx);
}

function bestBallAutoForfeitPatch(row, session, match, holeIdx) {
  const aSlotCount = sideSlotCount(session, match.a);
  const bSlotCount = sideSlotCount(session, match.b);
  return {
    gross_a: fillMissingSideScores(row.gross_a, aSlotCount, holeIdx),
    gross_b: fillMissingSideScores(row.gross_b, bSlotCount, holeIdx),
  };
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
    const calculated = calculatedPlayerStrokes(session, match);
    const manualPlayerStrokes = row?.manual_player_strokes || {};
    const hasManual = Object.values(manualPlayerStrokes).some((value) => value !== null && value !== undefined && value !== "");
    return {
      a: match.a.map((player) => ({
        player,
        strokes: manualPlayerStrokes[player] !== null && manualPlayerStrokes[player] !== undefined && manualPlayerStrokes[player] !== ""
          ? Number(manualPlayerStrokes[player])
          : calculated[player],
      })),
      b: match.b.map((player) => ({
        player,
        strokes: manualPlayerStrokes[player] !== null && manualPlayerStrokes[player] !== undefined && manualPlayerStrokes[player] !== ""
          ? Number(manualPlayerStrokes[player])
          : calculated[player],
      })),
      manual: hasManual,
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

function sideHoleState(scores, maps, slotCount, holeIdx) {
  const slots = Array.from({ length: slotCount }, (_, slotIdx) => {
    const score = getScore(scores, slotCount, slotIdx, holeIdx);
    return {
      score,
      known: score !== null,
      forfeited: score === FORFEIT,
      net: score === null || score === FORFEIT ? null : score - maps[slotIdx][holeIdx],
    };
  });

  if (slots.some((slot) => !slot.known)) return { known: false, forfeited: false, net: null, slots };

  const playableNets = slots.map((slot) => slot.net).filter((net) => net !== null);
  return {
    known: true,
    forfeited: playableNets.length === 0,
    net: playableNets.length ? Math.min(...playableNets) : null,
    slots,
  };
}

function blankRow(match) {
  const session = match.session;
  return {
    match_id: match.id,
    gross_a: blankScores(sideSlotCount(session, match.a)),
    gross_b: blankScores(sideSlotCount(session, match.b)),
    manual_a: null,
    manual_b: null,
    manual_player_strokes: null,
    updated_at: new Date().toISOString(),
  };
}

function blankRowsById() {
  return Object.fromEntries(MATCHES.map((m) => [m.id, blankRow(m)]));
}

function rowForSave(row) {
  const next = { ...row };
  if (next.manual_player_strokes == null) {
    delete next.manual_player_strokes;
  }
  return next;
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

function normalizeSettings(settings) {
  const sessionIds = SESSIONS.map((session) => session.id);
  const visible = Array.isArray(settings?.visibleSessionIds)
    ? settings.visibleSessionIds.filter((id) => sessionIds.includes(id))
    : DEFAULT_SETTINGS.visibleSessionIds;
  const ordered = Array.isArray(settings?.sessionOrder)
    ? settings.sessionOrder.filter((id) => sessionIds.includes(id))
    : DEFAULT_SETTINGS.sessionOrder;
  const locked = Array.isArray(settings?.lockedSessionIds)
    ? settings.lockedSessionIds.filter((id) => sessionIds.includes(id))
    : DEFAULT_SETTINGS.lockedSessionIds;

  return {
    visibleSessionIds: visible.length ? visible : DEFAULT_SETTINGS.visibleSessionIds,
    sessionOrder: [...ordered, ...sessionIds.filter((id) => !ordered.includes(id))],
    lockedSessionIds: locked,
  };
}

function loadLocalSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
    return normalizeSettings(saved);
  } catch {
    return normalizeSettings(DEFAULT_SETTINGS);
  }
}

function saveLocalSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function settingsFallbackRow(settings) {
  return {
    match_id: SETTINGS_MATCH_ID,
    gross_a: normalizeSettings(settings),
    gross_b: [],
    updated_at: new Date().toISOString(),
  };
}

function settingsFromFallbackRow(row) {
  if (row?.match_id !== SETTINGS_MATCH_ID || !row.gross_a || Array.isArray(row.gross_a)) return null;
  return normalizeSettings(row.gross_a);
}

function orderedSessions(settings, options = {}) {
  const normalized = normalizeSettings(settings);
  const visibleSet = new Set(normalized.visibleSessionIds);
  const byId = Object.fromEntries(SESSIONS.map((session) => [session.id, session]));
  return normalized.sessionOrder
    .map((id) => byId[id])
    .filter(Boolean)
    .filter((session) => options.includeHidden || visibleSet.has(session.id));
}

function visibleMatches(settings) {
  return orderedSessions(settings).flatMap((session) => session.matches.map((match) => ({ ...match, session })));
}

function isSessionLocked(settings, sessionId) {
  return normalizeSettings(settings).lockedSessionIds.includes(sessionId);
}

function summarizeMatchSegment(match, holeResults, startIdx, endIdx, pointsValue, options = {}) {
  const totalHoles = endIdx - startIdx + 1;
  let holesWonA = 0;
  let holesWonB = 0;
  let completed = 0;
  let decisionIdx = null;
  let compact = "—";
  let status = "Not started";
  let pointsA = 0;
  let pointsB = 0;
  const prefix = options.prefix ? `${options.prefix} ` : "";

  for (let holeIdx = startIdx; holeIdx <= endIdx; holeIdx++) {
    const result = holeResults[holeIdx];
    if (!result) break;

    completed++;
    if (result === "A") holesWonA++;
    if (result === "B") holesWonB++;

    const diff = holesWonA - holesWonB;
    const remaining = endIdx - holeIdx;
    if (Math.abs(diff) > remaining) {
      const winner = diff > 0 ? "A" : "B";
      compact = remaining === 0 ? `${Math.abs(diff)} UP` : `${Math.abs(diff)} & ${remaining}`;
      status = `${sideLabel(winner === "A" ? match.a : match.b)} wins ${prefix}${compact}`;
      pointsA = winner === "A" ? pointsValue : 0;
      pointsB = winner === "B" ? pointsValue : 0;
      decisionIdx = holeIdx;
      break;
    }
  }

  const diff = holesWonA - holesWonB;

  if (decisionIdx === null) {
    if (completed === totalHoles) {
      if (diff === 0) {
        status = options.halvedStatus || `${prefix}Halved`.trim();
        compact = options.halvedCompact || "Halved";
        pointsA = options.halvedPointsA ?? pointsValue / 2;
        pointsB = options.halvedPointsB ?? pointsValue / 2;
      } else {
        const winner = diff > 0 ? "A" : "B";
        compact = "1 UP";
        status = `${sideLabel(winner === "A" ? match.a : match.b)} wins ${prefix}${compact}`;
        pointsA = winner === "A" ? pointsValue : 0;
        pointsB = winner === "B" ? pointsValue : 0;
        decisionIdx = endIdx;
      }
    } else if (completed > 0) {
      if (diff === 0) {
        compact = `${prefix}AS thru ${completed}`.trim();
        status = `${prefix}All square thru ${completed}`.trim();
      } else {
        compact = `${prefix}${Math.abs(diff)} UP thru ${completed}`.trim();
        status = `${sideLabel(diff > 0 ? match.a : match.b)} ${compact}`;
      }
    } else if (options.notStartedStatus) {
      status = options.notStartedStatus;
      compact = options.notStartedCompact || compact;
    }
  }

  return {
    startIdx,
    endIdx,
    completed,
    totalHoles,
    diff,
    decisionIdx,
    status,
    compact,
    pointsA,
    pointsB,
    decided: pointsA + pointsB > 0,
  };
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
  const holeResults = [];

  for (let i = 0; i < 9; i++) {
    const aNet = sideHoleState(row.gross_a, aMaps, aSlotCount, i);
    const bNet = sideHoleState(row.gross_b, bMaps, bSlotCount, i);
    if (!aNet.known || !bNet.known) {
      holeResults.push(null);
      continue;
    }
    if (aNet.forfeited && bNet.forfeited) {
      holeResults.push("HALVE");
    } else if (aNet.forfeited) {
      holeResults.push("B");
    } else if (bNet.forfeited) {
      holeResults.push("A");
    } else if (aNet.net < bNet.net) {
      holeResults.push("A");
    } else if (bNet.net < aNet.net) {
      holeResults.push("B");
    } else {
      holeResults.push("HALVE");
    }
  }

  const base = summarizeMatchSegment(match, holeResults, 0, 8, 1);
  const pressStartIdx = base.decided && base.decisionIdx !== null && base.decisionIdx < 8 ? base.decisionIdx + 1 : null;
  const press = pressStartIdx === null ? null : summarizeMatchSegment(match, holeResults, pressStartIdx, 8, 0.5, {
    prefix: "press",
    notStartedStatus: `Press open for holes ${course.holes.slice(pressStartIdx).join(", ")}`,
    notStartedCompact: "Press open",
    halvedStatus: "Press halved",
    halvedCompact: "Halved",
    halvedPointsA: 0,
    halvedPointsB: 0,
  });

  return {
    status: base.status,
    compact: base.compact,
    pointsA: base.pointsA,
    pointsB: base.pointsB,
    completed: base.completed,
    diff: base.diff,
    holeResults,
    aMaps,
    bMaps,
    aMap: aMaps[0],
    bMap: bMaps[0],
    base,
    press,
  };
}

function useScores() {
  const [rows, setRows] = useState(() => loadLocalRows());
  const rowsRef = useRef(rows);
  const loadErrorLoggedRef = useRef(false);
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
        if (!loadErrorLoggedRef.current) console.error(error);
        loadErrorLoggedRef.current = true;
        setSyncStatus("error");
        return;
      }
      loadErrorLoggedRef.current = false;

      const existingIds = new Set((data || []).map((r) => r.match_id));
      const missing = MATCHES.filter((m) => !existingIds.has(m.id)).map((m) => blankRow(m));

      if (missing.length) {
        await supabase.from("match_scores").upsert(missing.map(rowForSave));
      }

      const { data: refreshed } = await supabase.from("match_scores").select("*");
      if (active) {
        const nextRows = normalizeRows(refreshed || data || []);
        rowsRef.current = nextRows;
        setRows(nextRows);
        setSyncStatus("live");
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState !== "hidden") load();
    }

    load();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const refreshTimer = window.setInterval(refreshWhenVisible, SCORE_REFRESH_MS);

    const channel = supabase
      .channel("qlc-match-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_scores" }, (payload) => {
        const row = payload.new;
        if (!row?.match_id) return;
        if (!MATCHES.some((match) => match.id === row.match_id)) return;
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
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
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

    const { error } = await supabase.from("match_scores").upsert(rowForSave(nextRow));
    if (error) {
      console.error(error);
      setSyncStatus("error");
    }
  }

  return { rows, updateRow, syncStatus };
}

function useAppSettings() {
  const [settings, setSettings] = useState(() => (supabase ? normalizeSettings(DEFAULT_SETTINGS) : loadLocalSettings()));
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    function applySettings(nextSettings) {
      const normalized = normalizeSettings(nextSettings);
      settingsRef.current = normalized;
      setSettings(normalized);
      saveLocalSettings(normalized);
    }

    async function loadFallbackSettings() {
      const { data, error } = await supabase
        .from("match_scores")
        .select("match_id,gross_a")
        .eq("match_id", SETTINGS_MATCH_ID)
        .maybeSingle();

      if (error) return null;

      const fallbackSettings = settingsFromFallbackRow(data);
      if (fallbackSettings) return fallbackSettings;

      await supabase.from("match_scores").upsert(settingsFallbackRow(DEFAULT_SETTINGS));
      return normalizeSettings(DEFAULT_SETTINGS);
    }

    async function load() {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", "global")
        .maybeSingle();

      if (error) {
        const fallbackSettings = await loadFallbackSettings();
        if (active && fallbackSettings) applySettings(fallbackSettings);
        return;
      }

      if (!data) {
        await supabase.from("app_settings").upsert({ id: "global", settings: DEFAULT_SETTINGS });
        if (active) setSettings(normalizeSettings(DEFAULT_SETTINGS));
        return;
      }

      if (active) {
        applySettings(data.settings);
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState !== "hidden") load();
    }

    load();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const refreshTimer = window.setInterval(refreshWhenVisible, SETTINGS_REFRESH_MS);

    const channel = supabase
      .channel("qlc-app-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, (payload) => {
        if (payload.new?.id !== "global") return;
        applySettings(payload.new.settings);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_scores", filter: `match_id=eq.${SETTINGS_MATCH_ID}` }, (payload) => {
        const fallbackSettings = settingsFromFallbackRow(payload.new);
        if (fallbackSettings) applySettings(fallbackSettings);
      })
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateSettings(patch) {
    const current = settingsRef.current;
    const resolvedPatch = typeof patch === "function" ? patch(current) : patch;
    const nextSettings = normalizeSettings({ ...current, ...resolvedPatch });
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    saveLocalSettings(nextSettings);

    if (!supabase) return;
    const { error } = await supabase.from("app_settings").upsert({
      id: "global",
      settings: nextSettings,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      const { error: fallbackError } = await supabase.from("match_scores").upsert(settingsFallbackRow(nextSettings));
      if (fallbackError) console.error(fallbackError);
      return;
    }

    await supabase.from("match_scores").upsert(settingsFallbackRow(nextSettings));
  }

  return { settings, updateSettings };
}

function getInitialRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [view, matchId, mode] = hash.split("/");
  if (view === "score" && matchId) return { view: "score", matchId, mode: mode === "scorecard" ? "scorecard" : null };
  if (view === "score") return { view: "score", matchId: MATCHES[0].id, mode: null };
  if (view === "admin") return { view: "admin", matchId: null, mode: null };
  return { view: "board", matchId: null, mode: null };
}

function setHash(view, matchId, mode = null) {
  window.location.hash = view === "score" && matchId ? `/score/${matchId}${mode === "scorecard" ? "/scorecard" : ""}` : `/${view}`;
}

function Header({ route, setRoute, syncStatus }) {
  function nav(view) {
    const next = { view, matchId: view === "score" ? route.matchId || MATCHES[0].id : null, mode: null };
    setRoute(next);
    setHash(next.view, next.matchId, next.mode);
  }

  return (
    <header className="topbar">
      <div className="brandBlock">
        <img className="brandLogo" src="/assets/qlc-white.png" alt="" />
      </div>
      <div className="nav">
        <button className={route.view === "board" ? "active" : ""} onClick={() => nav("board")}>Overall</button>
        <button className={route.view === "score" ? "active" : ""} onClick={() => nav("score")}>Matches</button>
        <button className={route.view === "admin" ? "active" : ""} onClick={() => nav("admin")}>Admin</button>
        <div className={`sync ${syncStatus}`}>{syncStatus === "live" ? "Live" : syncStatus === "local" ? "Local" : syncStatus}</div>
      </div>
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

function projectedPressSidePoints(press) {
  if (!press) return { pointsA: 0, pointsB: 0, counted: false, active: false };
  const decided = press.pointsA + press.pointsB > 0;
  if (decided) return { pointsA: press.pointsA, pointsB: press.pointsB, counted: true, active: false };
  if (press.completed === 0) return { pointsA: 0, pointsB: 0, counted: false, active: false };
  if (press.completed === press.totalHoles && press.diff === 0) return { pointsA: 0, pointsB: 0, counted: true, active: false };
  if (press.diff > 0) return { pointsA: 0.5, pointsB: 0, counted: true, active: true };
  if (press.diff < 0) return { pointsA: 0, pointsB: 0.5, counted: true, active: true };
  return { pointsA: 0, pointsB: 0, counted: true, active: true };
}

function scoreTotals(rows, settings) {
  const actual = { jailbirds: 0, zookeepers: 0 };
  const projected = { jailbirds: 0, zookeepers: 0 };
  let decided = 0;
  let projectedCount = 0;
  let active = 0;

  orderedSessions(settings).forEach((session) => {
    session.matches.forEach((match) => {
      const result = computeMatch(session, match, rows[match.id]);
      addSidePointsToTeams(match, result.pointsA, result.pointsB, actual);
      decided += result.pointsA + result.pointsB;
      if (result.press) {
        addSidePointsToTeams(match, result.press.pointsA, result.press.pointsB, actual);
        decided += result.press.pointsA + result.press.pointsB;
      }

      const projection = projectedSidePoints(result);
      addSidePointsToTeams(match, projection.pointsA, projection.pointsB, projected);
      if (projection.counted) projectedCount += projection.pointsA + projection.pointsB;
      if (projection.active) active++;

      const pressProjection = projectedPressSidePoints(result.press);
      addSidePointsToTeams(match, pressProjection.pointsA, pressProjection.pointsB, projected);
      if (pressProjection.counted) projectedCount += pressProjection.pointsA + pressProjection.pointsB;
      if (pressProjection.active) active++;
    });
  });

  return { actual, projected, decided, projectedCount, active };
}

function OverallScore({ rows, settings }) {
  const totals = useMemo(() => scoreTotals(rows, settings), [rows, settings]);

  return (
    <section className="scoreHero">
      <div className="scoreTitle">
        <span>Overall Score</span>
        <span>{totals.active ? `${totals.active} active` : "No active matches"}</span>
      </div>
      <div className="scoreBoxes">
        <div className="scoreBox">
          <img src="/assets/jailbirds.png" alt="" />
          <div className="scoreBoxText">
            <strong>{totals.actual.jailbirds}</strong>
            <span>Projected: {totals.projected.jailbirds}</span>
          </div>
        </div>
        <div className="scoreBox">
          <img src="/assets/zookeepers.png" alt="" />
          <div className="scoreBoxText">
            <strong>{totals.actual.zookeepers}</strong>
            <span>Projected: {totals.projected.zookeepers}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BoardMatchDetails({ session, match, result }) {
  const course = COURSE[session.nine];
  const firstPressHoleIdx = result.press?.startIdx ?? null;
  const shouldMaskPressHole = (holeIdx) => result.base?.decided && firstPressHoleIdx !== null && holeIdx >= firstPressHoleIdx;

  return (
    <div className="boardMatchDetails">
      <div className="boardHoleGrid">
        {course.holes.map((hole, i) => {
          const isMasked = shouldMaskPressHole(i);
          return (
            <div className={`boardHole ${isMasked ? "masked" : ""}`} key={hole}>
              <small>{hole}</small>
              <span className={isMasked ? "holeResult masked" : holeResultClasses(match, result.holeResults[i])}>
                {isMasked ? "X" : holeResultLabel(match, result.holeResults[i])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WinnerHeadshots({ players, compact = false, tie = false }) {
  const winnerImage = tie ? TIE_HEADSHOT : winnerImageForPlayers(players);
  if (!winnerImage) return null;
  const imageClass = tie ? "tie" : players.length === 1 ? "solo" : "pair";

  return (
    <div className={`winnerHeadshots ${compact ? "compact" : ""} ${imageClass}`} aria-hidden="true">
      <img src={winnerImage} alt="" className="winnerHeadshot" />
    </div>
  );
}

function pressRangeLabel(course, press) {
  const firstHole = course.holes[press.startIdx];
  const lastHole = course.holes[press.endIdx];
  return firstHole === lastHole ? `${firstHole}` : `${firstHole}-${lastHole}`;
}

function PressBoardCard({ session, match, result, isExpanded, onAction, onDetails }) {
  const course = COURSE[session.nine];
  const press = result.press;
  if (!press) return null;
  const pressWinnerSide = winningSide(press);
  const isPressFinal = segmentIsFinal(press);
  const isPressHalved = isPressFinal && !pressWinnerSide;
  const pressWinnerPlayers = pressWinnerSide ? (pressWinnerSide === "A" ? match.a : match.b) : [];

  return (
    <div
      role="button"
      tabIndex={0}
      className={`pressCard ${leadingTeamClass(match, press)} ${isPressFinal ? "finished" : ""} ${isExpanded ? "expanded" : ""}`}
      onClick={onAction}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAction();
        }
      }}
      aria-expanded={isExpanded}
    >
      <WinnerHeadshots players={pressWinnerPlayers} compact tie={isPressHalved} />
      <div>
        <small>Press {pressRangeLabel(course, press)} · 0.5 pt</small>
        <strong className={sideNameClass(match, press, "A")}>{sideLabel(match.a)}</strong>
        <strong className={sideNameClass(match, press, "B")}>{sideLabel(match.b)}</strong>
      </div>
      <div className="right">
        <strong>{press.compact}</strong>
        {isPressFinal && <span className="finalPill">Final</span>}
      </div>
      {isExpanded && (
        <>
          <div
            className="boardHoleGrid pressHoleGrid"
            style={{ "--press-hole-count": press.endIdx - press.startIdx + 1 }}
          >
            {course.holes.slice(press.startIdx, press.endIdx + 1).map((hole, offset) => {
              const holeIdx = press.startIdx + offset;
              const isMasked = press.decided && press.decisionIdx !== null && holeIdx > press.decisionIdx;
              return (
                <div className={`boardHole pressHole ${isMasked ? "masked" : ""}`} key={hole}>
                  <small>{hole}</small>
                  <span className={isMasked ? "holeResult masked" : holeResultClasses(match, result.holeResults[holeIdx])}>
                    {isMasked ? "X" : holeResultLabel(match, result.holeResults[holeIdx])}
                  </span>
                </div>
              );
            })}
          </div>
          <button className="detailsButton" onClick={onDetails}>Details</button>
        </>
      )}
    </div>
  );
}

function Board({ rows, settings, setRoute }) {
  const [expandedMatchIds, setExpandedMatchIds] = useState(() => new Set());
  const [expandedPressIds, setExpandedPressIds] = useState(() => new Set());

  function scoreMatch(matchId, mode = null) {
    const next = { view: "score", matchId, mode };
    setRoute(next);
    setHash(next.view, next.matchId, next.mode);
  }

  function handleMatchCardAction(matchId, isExpanded) {
    setExpandedMatchIds((current) => {
      const next = new Set(current);
      if (isExpanded) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  }

  function handlePressCardAction(matchId, isExpanded) {
    setExpandedPressIds((current) => {
      const next = new Set(current);
      if (isExpanded) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  }

  return (
    <main className="page">
      <OverallScore rows={rows} settings={settings} />
      <div className="sessionGrid">
        {orderedSessions(settings).map((session) => (
          <section className="card" key={session.id}>
            <div className="cardHeader">
              <div>
                <h2>{session.label}</h2>
                <p>{session.format} · {COURSE[session.nine].label}</p>
              </div>
            </div>
            <div className="matchList">
              {session.matches.map((match) => {
                const result = computeMatch(session, match, rows[match.id]);
                const strokes = matchStrokes(session, match, rows[match.id]);
                const isExpanded = expandedMatchIds.has(match.id);
                const isPressExpanded = expandedPressIds.has(match.id);
                const leadingClass = leadingTeamClass(match, result);
                const isFinal = segmentIsFinal(result);
                const baseWinnerSide = winningSide(result);
                const baseIsHalved = isFinal && !baseWinnerSide;
                const baseWinnerPlayers = isFinal && baseWinnerSide ? (baseWinnerSide === "A" ? match.a : match.b) : [];
                return (
                  <React.Fragment key={match.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={`matchCard ${leadingClass} ${result.pointsA + result.pointsB > 0 ? "finished" : ""} ${isExpanded ? "expanded" : ""}`}
                      onClick={() => handleMatchCardAction(match.id, isExpanded)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleMatchCardAction(match.id, isExpanded);
                        }
                      }}
                      aria-expanded={isExpanded}
                    >
                      <WinnerHeadshots players={baseWinnerPlayers} tie={baseIsHalved} />
                      <div>
                        <small>Match {match.tee} · 1 pt</small>
                        <strong className={sideNameClass(match, result, "A")}>{sideLabel(match.a)}</strong>
                        <strong className={sideNameClass(match, result, "B")}>{sideLabel(match.b)}</strong>
                      </div>
                      <div className="right">
                        <strong>{result.compact}</strong>
                        {!isFinal && <small>thru {result.completed}</small>}
                        {isFinal && <span className="finalPill">Final</span>}
                      </div>
                      {isExpanded && (
                        <>
                          <div className="meta">Strokes: {strokesText(session, match, strokes)}</div>
                          <BoardMatchDetails session={session} match={match} result={result} />
                          <button
                            className="detailsButton"
                            onClick={(event) => {
                              event.stopPropagation();
                              scoreMatch(match.id, isFinal ? "scorecard" : null);
                            }}
                          >
                            Details
                          </button>
                        </>
                      )}
                    </div>
                    <PressBoardCard
                      session={session}
                      match={match}
                      result={result}
                      isExpanded={isPressExpanded}
                      onAction={() => handlePressCardAction(match.id, isPressExpanded)}
                      onDetails={(event) => {
                        event.stopPropagation();
                        scoreMatch(match.id, segmentIsFinal(result.press) ? "scorecard" : null);
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function MatchSelect({ value, onChange, matches = MATCHES }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {matches.map(({ session, ...match }) => (
        <option key={match.id} value={match.id}>
          {session.shortLabel} · Tee {match.tee} · {sideLabel(match.a)} vs {sideLabel(match.b)}
        </option>
      ))}
    </select>
  );
}

function ScoreButton({ value, current, onClick, className = "", disabled = false }) {
  return (
    <button
      className={`scoreButton ${String(value) === String(current ?? "") ? "selected" : ""} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
    >
      {value}
    </button>
  );
}

function scoreOptions(par) {
  return [Math.max(1, par - 2), par - 1, par, par + 1, par + 2, par + 3, par + 4, par + 5, FORFEIT]
    .filter((v, i, arr) => v === FORFEIT || (v > 0 && arr.indexOf(v) === i));
}

function strokesText(session, match, strokes) {
  if (isBestBall(session)) {
    return [...strokes.a, ...strokes.b].map(({ player, strokes: playerStrokes }) => `${player} ${playerStrokes}`).join(", ");
  }
  return `${sideLabel(match.a)} ${strokes.a}, ${sideLabel(match.b)} ${strokes.b}`;
}

function winningScoreForSlot(row, result, side, slotCount, slotIdx, holeIdx) {
  const winningResult = side === "a" ? "A" : "B";
  if (result.holeResults[holeIdx] !== winningResult) return false;

  const scores = side === "a" ? row.gross_a : row.gross_b;
  const maps = side === "a" ? result.aMaps : result.bMaps;
  const state = sideHoleState(scores, maps, slotCount, holeIdx);
  const slot = state.slots[slotIdx];
  return state.known && !state.forfeited && !slot.forfeited && slot.net === state.net;
}

function displayScoreValue(value) {
  if (value === null || value === undefined) return "";
  return value === FORFEIT ? FORFEIT : value;
}

function scoreRowTotal(cells) {
  const values = cells.map((cell) => cell.value);
  if (!values.length || values.some((value) => typeof value !== "number")) return "";
  return values.reduce((sum, value) => sum + value, 0);
}

function segmentHoleState(match, result, segment, holeIdx) {
  if (holeIdx < segment.startIdx || holeIdx > segment.endIdx) return null;
  if (segment.decisionIdx !== null && holeIdx > segment.decisionIdx) return null;
  if (!result.holeResults[holeIdx]) return null;

  let diff = 0;
  for (let i = segment.startIdx; i <= holeIdx; i++) {
    const holeResult = result.holeResults[i];
    if (holeResult === "A") diff += 1;
    if (holeResult === "B") diff -= 1;
  }

  if (diff === 0) return { label: "AS", className: "" };
  const side = diff > 0 ? "A" : "B";
  const direction = diff > 0 ? "↑" : "↓";
  return {
    label: `${Math.abs(diff)}${direction}`,
    className: sideTeamClass(match, side),
  };
}

function isClassicWinningScore(row, result, side, slotCount, slotIdx, holeIdx) {
  const sideKey = side === "A" ? "a" : "b";
  return winningScoreForSlot(row, result, sideKey, slotCount, slotIdx, holeIdx);
}

function scorecardRowsForSide(session, match, row, result, side, holeIdxs, segment) {
  const players = side === "A" ? match.a : match.b;
  const scores = side === "A" ? row.gross_a : row.gross_b;
  const maps = side === "A" ? result.aMaps : result.bMaps;
  const slotCount = sideSlotCount(session, players);
  const teamClass = sideTeamClass(match, side);
  const logo = `/assets/${teamKey(sideTeamName(match, side))}.png`;

  return Array.from({ length: slotCount }, (_, slotIdx) => ({
    label: slotLabel(session, players, slotIdx),
    teamClass,
    logo,
    cells: holeIdxs.map((holeIdx) => {
      const hidden = segment.decisionIdx !== null && holeIdx > segment.decisionIdx;
      const value = hidden ? null : getScore(scores, slotCount, slotIdx, holeIdx);
      return {
        holeIdx,
        value,
        strokes: hidden ? 0 : maps[slotIdx][holeIdx] || 0,
        winning: hidden ? false : isClassicWinningScore(row, result, side, slotCount, slotIdx, holeIdx),
      };
    }),
  }));
}

function scorecardPillClass(match, segment) {
  if (segment.diff > 0) return sideTeamClass(match, "A");
  if (segment.diff < 0) return sideTeamClass(match, "B");
  if (segment.completed > 0) return "team-tied";
  return "";
}

function ClassicMatchScorecard({ session, match, row, result, segment, startIdx, endIdx, press = false }) {
  const course = COURSE[session.nine];
  const segmentEndIdx = segment.decisionIdx !== null ? Math.min(endIdx, segment.decisionIdx) : endIdx;
  const holeIdxs = Array.from({ length: segmentEndIdx - startIdx + 1 }, (_, idx) => startIdx + idx);
  const aRows = scorecardRowsForSide(session, match, row, result, "A", holeIdxs, segment);
  const bRows = scorecardRowsForSide(session, match, row, result, "B", holeIdxs, segment);
  const parTotal = holeIdxs.reduce((sum, holeIdx) => sum + course.par[holeIdx], 0);
  const tableWidth = 104 + holeIdxs.length * 40 + 62;

  function renderPlayerRow(rowData) {
    return (
      <tr key={rowData.label} className={`playerRow ${rowData.teamClass}`}>
        <th style={{ "--team-logo": `url(${rowData.logo})` }}>
          <span className="classicPlayerName">{rowData.label}</span>
        </th>
        {rowData.cells.map((cell) => (
          <td key={cell.holeIdx} className={cell.winning ? "classicWinningScore" : ""}>
            {cell.strokes > 0 && (
              <span className="classicStrokeDots" aria-label={`${cell.strokes} stroke${cell.strokes === 1 ? "" : "s"}`}>
                {Array.from({ length: cell.strokes }, (_, idx) => (
                  <span key={idx} className="classicStrokeDot" />
                ))}
              </span>
            )}
            <span className="classicScoreCell">{displayScoreValue(cell.value)}</span>
          </td>
        ))}
        <td className="classicTotalCell">{scoreRowTotal(rowData.cells)}</td>
      </tr>
    );
  }

  return (
    <section className={`card finalScorecard ${press ? "pressFinalScorecard" : ""}`}>
      <div className="finalScorecardHeader">
        <span className={`finalScorePill ${scorecardPillClass(match, segment)}`}>{segment.compact}</span>
      </div>
      <div className="classicScorecardWrap">
        <table className="classicScorecard" style={{ width: tableWidth, minWidth: "100%" }}>
          <thead>
            <tr className="metaRow">
              <th className="rowHead">Hole</th>
              {holeIdxs.map((holeIdx) => <th key={holeIdx}>{course.holes[holeIdx]}</th>)}
              <th className="classicTotalCell">T</th>
            </tr>
          </thead>
          <tbody>
            <tr className="metaRow">
              <th>Par</th>
              {holeIdxs.map((holeIdx) => <td key={holeIdx}>{course.par[holeIdx]}</td>)}
              <td className="classicTotalCell">{parTotal}</td>
            </tr>
            <tr className="metaRow">
              <th>Hcp</th>
              {holeIdxs.map((holeIdx) => <td key={holeIdx}>{course.strokeIndex[holeIdx]}</td>)}
              <td className="classicTotalCell" />
            </tr>
            {aRows.map(renderPlayerRow)}
            <tr className="matchResultRow">
              <th>+/-</th>
              {holeIdxs.map((holeIdx) => {
                const state = segmentHoleState(match, result, segment, holeIdx);
                return <td key={holeIdx} className={state?.className || ""}>{state?.label || ""}</td>;
              })}
              <td className="classicTotalCell">{segment.compact}</td>
            </tr>
            {bRows.map(renderPlayerRow)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FinalMatchScorecards({ session, match, row, result }) {
  return (
    <div className="finalScorecards">
      <ClassicMatchScorecard
        session={session}
        match={match}
        row={row}
        result={result}
        segment={result.base}
        startIdx={0}
        endIdx={8}
      />
      {result.press && (
        <ClassicMatchScorecard
          session={session}
          match={match}
          row={row}
          result={result}
          segment={result.press}
          startIdx={result.press.startIdx}
          endIdx={result.press.endIdx}
          press
        />
      )}
    </div>
  );
}

function Score({ rows, updateRow, route, setRoute, settings }) {
  const availableMatches = visibleMatches(settings);
  const selectedMatchId = route.matchId || availableMatches[0]?.id;
  const found = availableMatches.find((m) => m.id === selectedMatchId) || availableMatches[0];
  const [holeIdx, setHoleIdx] = useState(0);
  const showScorecard = route.mode === "scorecard";

  useEffect(() => {
    if (!availableMatches.length) return;
    if (found?.id === selectedMatchId) return;
    const next = { view: "score", matchId: availableMatches[0].id, mode: route.mode || null };
    setRoute(next);
    setHash(next.view, next.matchId, next.mode);
  }, [availableMatches, found?.id, route.mode, selectedMatchId, setRoute]);

  useEffect(() => {
    if (!found) return;
    const matchResult = computeMatch(found.session, found, rows[found.id]);
    const firstOpenHoleIdx = matchResult.holeResults.findIndex((holeResult) => !holeResult);
    setHoleIdx(firstOpenHoleIdx === -1 ? 8 : firstOpenHoleIdx);
  }, [selectedMatchId, found?.id]);

  if (!found) {
    return (
      <main className="page narrow">
        <section className="card">
          <h2>No matches visible</h2>
          <p className="mutedText">Use Admin to reveal a session before entering scores.</p>
        </section>
      </main>
    );
  }

  const session = found.session;
  const match = found;
  const row = rows[match.id];

  const course = COURSE[session.nine];
  const result = computeMatch(session, match, row);
  const strokes = matchStrokes(session, match, row);
  const hole = course.holes[holeIdx];
  const par = course.par[holeIdx];
  const options = scoreOptions(par);
  const aSlotCount = sideSlotCount(session, match.a);
  const bSlotCount = sideSlotCount(session, match.b);
  const isPressHole = result.press && holeIdx >= result.press.startIdx && holeIdx <= result.press.endIdx;
  const statusTeamClass = leadingTeamClass(match, result).replace("leading-", "status-");
  const sessionLocked = isSessionLocked(settings, session.id);

  function selectMatch(matchId) {
    const next = { view: "score", matchId, mode: route.mode || null };
    setRoute(next);
    setHash(next.view, next.matchId, next.mode);
  }

  function openScorecard() {
    const next = { view: "score", matchId: match.id, mode: "scorecard" };
    setRoute(next);
    setHash(next.view, next.matchId, next.mode);
  }

  function closeScorecard() {
    const next = { view: "score", matchId: match.id, mode: null };
    setRoute(next);
    setHash(next.view, next.matchId, next.mode);
  }

  function setGross(side, slotIdx, value) {
    if (sessionLocked) return;
    const key = side === "a" ? "gross_a" : "gross_b";
    const slotCount = side === "a" ? aSlotCount : bSlotCount;
    updateRow(match.id, (currentRow) => ({
      [key]: setScore(currentRow[key], slotCount, slotIdx, holeIdx, value),
    }));
  }

  function clearGross(side, slotIdx) {
    setGross(side, slotIdx, null);
  }

  function handleNextHole() {
    if (holeIdx === 8) return;
    if (!sessionLocked && bestBallHoleNeedsAutoForfeit(row, session, match, holeIdx)) {
      updateRow(match.id, (currentRow) => bestBallAutoForfeitPatch(currentRow, session, match, holeIdx));
    }
    setHoleIdx(Math.min(8, holeIdx + 1));
  }

  function strokeDotsForHole(i) {
    const dots = [];
    result.aMaps.forEach((map, slotIdx) => {
      const count = map[i] || 0;
      for (let n = 0; n < count; n++) {
        dots.push({
          key: `a-${slotIdx}-${n}`,
          teamClass: `team-${teamKey(sideTeamName(match, "A"))}`,
          label: slotLabel(session, match.a, slotIdx),
        });
      }
    });
    result.bMaps.forEach((map, slotIdx) => {
      const count = map[i] || 0;
      for (let n = 0; n < count; n++) {
        dots.push({
          key: `b-${slotIdx}-${n}`,
          teamClass: `team-${teamKey(sideTeamName(match, "B"))}`,
          label: slotLabel(session, match.b, slotIdx),
        });
      }
    });
    return dots;
  }

  if (showScorecard) {
    return (
      <main className="page narrow">
        <section className="card scorecardPageHeader">
          <button className="backButton" onClick={closeScorecard}>‹ Back</button>
          <MatchSelect value={selectedMatchId} onChange={selectMatch} matches={availableMatches} />
          <div>
            <div className="eyebrow">Scorecard</div>
            <h2>{sideLabel(match.a)} vs {sideLabel(match.b)}</h2>
            <p className="mutedText">{session.label} · {session.format} · {course.label}</p>
          </div>
        </section>
        <FinalMatchScorecards session={session} match={match} row={row} result={result} />
      </main>
    );
  }

  return (
    <main className="page narrow">
      <section className="card">
        <div className="eyebrow">Select a Match</div>
        <MatchSelect value={selectedMatchId} onChange={selectMatch} matches={availableMatches} />
        <div className="matchSummary">
          <small>{session.label} · {session.format} · {course.label}</small>
          <p className={`matchStatusLine ${statusTeamClass}`}>{result.status}</p>
          {result.press && <p className="pressSummary">{result.press.status}</p>}
          {sessionLocked && <p className="lockNotice">Session locked · scores are read-only</p>}
          <small>Net strokes: {strokesText(session, match, strokes)}</small>
        </div>
      </section>

      <section className="card scorecardStrip">
        <div className="holeGrid">
          {course.holes.map((h, i) => {
            const strokeDots = strokeDotsForHole(i);
            return (
              <button
                key={h}
                className={[
                  i === holeIdx ? "selected" : "",
                  result.holeResults[i] ? "complete" : "",
                  resultTeamClass(match, result.holeResults[i]),
                  result.holeResults[i] === "HALVE" ? "halved" : "",
                  result.press && i >= result.press.startIdx && i <= result.press.endIdx ? "pressHoleButton" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setHoleIdx(i)}
              >
                <strong>{h}</strong>
                <span className={holeResultClasses(match, result.holeResults[i])}>
                  {holeResultLabel(match, result.holeResults[i])}
                </span>
                <span className="strokeDots" aria-label={strokeDots.map((dot) => `${dot.label} stroke`).join(", ") || undefined}>
                  {strokeDots.map((dot) => (
                    <span key={dot.key} className={`strokeDot ${dot.teamClass}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`card holeCard ${isPressHole ? "pressScoring" : ""}`}>
        <div className="holeNav">
          <button disabled={holeIdx === 0} onClick={() => setHoleIdx(holeIdx - 1)}>‹</button>
          <div>
            <small>Hole</small>
            <strong>{hole}</strong>
            <small>Par {par} · SI {course.strokeIndex[holeIdx]}</small>
          </div>
          <button disabled={holeIdx === 8} onClick={() => setHoleIdx(holeIdx + 1)}>›</button>
        </div>
        {isPressHole && <div className="pressNotice">Press hole · 0.5 pt match</div>}

        {Array.from({ length: aSlotCount }, (_, slotIdx) => (
          <SideScorer
            key={`a-${slotIdx}`}
            label={slotLabel(session, match.a, slotIdx)}
            side={sideLabel(match.a)}
            teamName={sideTeamName(match, "A")}
            stroke={result.aMaps[slotIdx][holeIdx] > 0}
            winningScore={winningScoreForSlot(row, result, "a", aSlotCount, slotIdx, holeIdx)}
            current={getScore(row.gross_a, aSlotCount, slotIdx, holeIdx)}
            options={options}
            locked={sessionLocked}
            onSelect={(n) => setGross("a", slotIdx, n)}
            onClear={() => clearGross("a", slotIdx)}
          />
        ))}
        {Array.from({ length: bSlotCount }, (_, slotIdx) => (
          <SideScorer
            key={`b-${slotIdx}`}
            label={slotLabel(session, match.b, slotIdx)}
            side={sideLabel(match.b)}
            teamName={sideTeamName(match, "B")}
            stroke={result.bMaps[slotIdx][holeIdx] > 0}
            winningScore={winningScoreForSlot(row, result, "b", bSlotCount, slotIdx, holeIdx)}
            current={getScore(row.gross_b, bSlotCount, slotIdx, holeIdx)}
            options={options}
            locked={sessionLocked}
            onSelect={(n) => setGross("b", slotIdx, n)}
            onClear={() => clearGross("b", slotIdx)}
          />
        ))}

        <div className="twoButtons scorecardActions">
          <button disabled={holeIdx === 8} onClick={handleNextHole}>Next Hole</button>
          <button className="secondary scorecardButton" onClick={openScorecard}>Scorecard</button>
        </div>
      </section>
    </main>
  );
}

function SideScorer({ label, side, teamName, stroke, winningScore, current, options, locked, onSelect, onClear }) {
  return (
    <div className={`sideScorer team-${teamKey(teamName)} ${stroke ? "hasStroke" : ""} ${winningScore ? "winningScore" : ""} ${locked ? "locked" : ""}`}>
      <div className="sideScorerTop">
        <div>
          <h3>{label}</h3>
        </div>
        {winningScore && <span className="winnerBadge">Winning score</span>}
        {stroke && <span className="strokeBadge">Stroke</span>}
        <strong>{current ?? "—"}</strong>
      </div>
      <div className="scoreGrid">
        {options.map((n) => (
          <ScoreButton key={n} value={n} current={current} disabled={locked} onClick={() => onSelect(n)} />
        ))}
        <ScoreButton value="C" current={current} className="clearScoreButton" disabled={locked || current === null} onClick={onClear} />
      </div>
    </div>
  );
}

function AdminGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(ADMIN_AUTH_KEY) === "true");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function unlock(event) {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      setUnlocked(true);
      setError("");
      setPassword("");
      return;
    }
    setError("Wrong password");
  }

  function lock() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setUnlocked(false);
  }

  if (unlocked) {
    return (
      <>
        <div className="adminLockBar">
          <span>Admin unlocked</span>
          <button onClick={lock}>Lock</button>
        </div>
        {children}
      </>
    );
  }

  return (
    <main className="page narrow">
      <section className="card adminLogin">
        <div className="eyebrow">Commissioner access</div>
        <h2>Admin Locked</h2>
        <p className="mutedText">Enter the admin password to edit scores and strokes.</p>
        <form onSubmit={unlock}>
          <label>
            Password
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="formError">{error}</p>}
          <button type="submit">Unlock Admin</button>
        </form>
      </section>
    </main>
  );
}

function Admin({ rows, updateRow, settings, updateSettings }) {
  async function clearAllScores() {
    const confirmed = window.confirm("Clear every entered score in unlocked sessions? Stroke settings and locked sessions will stay unchanged.");
    if (!confirmed) return;

    for (const match of MATCHES) {
      if (isSessionLocked(settings, match.session.id)) continue;
      const blank = blankRow(match);
      await updateRow(match.id, {
        gross_a: blank.gross_a,
        gross_b: blank.gross_b,
      });
    }
  }

  function toggleSessionVisibility(sessionId) {
    updateSettings((current) => {
      const visible = new Set(current.visibleSessionIds);
      if (visible.has(sessionId)) visible.delete(sessionId);
      else visible.add(sessionId);
      return { visibleSessionIds: Array.from(visible) };
    });
  }

  function toggleSessionLock(sessionId) {
    updateSettings((current) => {
      const locked = new Set(current.lockedSessionIds);
      if (locked.has(sessionId)) locked.delete(sessionId);
      else locked.add(sessionId);
      return { lockedSessionIds: Array.from(locked) };
    });
  }

  function setSessionOrder(sessionOrder) {
    updateSettings({ sessionOrder });
  }

  function moveSession(sessionId, direction) {
    updateSettings((current) => {
      const order = [...current.sessionOrder];
      const idx = order.indexOf(sessionId);
      const nextIdx = idx + direction;
      if (idx < 0 || nextIdx < 0 || nextIdx >= order.length) return {};
      [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
      return { sessionOrder: order };
    });
  }

  function updateManual(matchId, side, raw) {
    const match = MATCHES.find((m) => m.id === matchId);
    if (match && isSessionLocked(settings, match.session.id)) return;
    const value = raw === "" ? null : Number(raw.replace(/[^0-9]/g, "").slice(0, 2));
    updateRow(matchId, { [side]: value });
  }

  function updateManualPlayer(matchId, player, raw) {
    const match = MATCHES.find((m) => m.id === matchId);
    if (match && isSessionLocked(settings, match.session.id)) return;
    const value = raw === "" ? null : Number(raw.replace(/[^0-9]/g, "").slice(0, 2));
    updateRow(matchId, (currentRow) => {
      const manualPlayerStrokes = { ...(currentRow.manual_player_strokes || {}) };
      if (value === null) {
        delete manualPlayerStrokes[player];
      } else {
        manualPlayerStrokes[player] = value;
      }
      return {
        manual_player_strokes: Object.keys(manualPlayerStrokes).length ? manualPlayerStrokes : null,
      };
    });
  }

  function updateGross(matchId, key, holeIdx, raw) {
    updateGrossSlot(matchId, key, 0, holeIdx, raw);
  }

  function updateGrossSlot(matchId, key, slotIdx, holeIdx, raw) {
    const match = MATCHES.find((m) => m.id === matchId);
    if (match && isSessionLocked(settings, match.session.id)) return;
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
        <div className="adminControls">
          <h3>Session Visibility</h3>
          <div className="visibilityGrid">
            {SESSIONS.map((session) => (
              <label className="checkRow" key={session.id}>
                <input
                  type="checkbox"
                  checked={settings.visibleSessionIds.includes(session.id)}
                  onChange={() => toggleSessionVisibility(session.id)}
                />
                <span>{session.shortLabel} · {session.format}</span>
              </label>
            ))}
          </div>
          <div className="presetButtons">
            <button onClick={() => updateSettings({ visibleSessionIds: ["sat-am", "sat-pm"] })}>Hide Sunday</button>
            <button onClick={() => updateSettings({ visibleSessionIds: SESSIONS.map((session) => session.id) })}>Reveal All</button>
          </div>

          <h3>Session Locks</h3>
          <div className="visibilityGrid">
            {SESSIONS.map((session) => (
              <label className="checkRow" key={session.id}>
                <input
                  type="checkbox"
                  checked={isSessionLocked(settings, session.id)}
                  onChange={() => toggleSessionLock(session.id)}
                />
                <span>{session.shortLabel} · Locked</span>
              </label>
            ))}
          </div>

          <h3>Session Order</h3>
          <div className="presetButtons">
            <button onClick={() => setSessionOrder(["sat-am", "sat-pm", "sun-am", "sun-pm"])}>Saturday AM</button>
            <button onClick={() => setSessionOrder(["sat-pm", "sat-am", "sun-am", "sun-pm"])}>Saturday PM</button>
            <button onClick={() => setSessionOrder(["sun-am", "sun-pm", "sat-am", "sat-pm"])}>Sunday AM</button>
            <button onClick={() => setSessionOrder(["sun-pm", "sun-am", "sat-am", "sat-pm"])}>Sunday PM</button>
          </div>
          <div className="orderList">
            {orderedSessions(settings, { includeHidden: true }).map((session, idx, sessions) => (
              <div className="orderRow" key={session.id}>
                <span>{session.shortLabel} · {session.format}</span>
                <div>
                  <button disabled={idx === 0} onClick={() => moveSession(session.id, -1)}>Up</button>
                  <button disabled={idx === sessions.length - 1} onClick={() => moveSession(session.id, 1)}>Down</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="dangerButton" onClick={clearAllScores}>Clear All Scores</button>
      </section>

      <div className="sessionGrid">
        {orderedSessions(settings, { includeHidden: true }).map((session) => (
          <section className="card" key={session.id}>
            <div className="cardHeader">
              <div>
                <h2>{session.shortLabel}</h2>
                <p>{session.format} · {COURSE[session.nine].label}</p>
              </div>
              {isSessionLocked(settings, session.id) && <span className="lockPill">Locked</span>}
            </div>
            {session.matches.map((match) => {
              const row = rows[match.id];
              const result = computeMatch(session, match, row);
              const calculated = calculatedMatchStrokes(session, match);
              const calculatedPlayers = calculatedPlayerStrokes(session, match);
              const strokes = matchStrokes(session, match, row);
              const course = COURSE[session.nine];
              const aSlotCount = sideSlotCount(session, match.a);
              const bSlotCount = sideSlotCount(session, match.b);
              const sessionLocked = isSessionLocked(settings, session.id);
              return (
                <div className={`adminMatch ${sessionLocked ? "locked" : ""}`} key={match.id}>
                  <strong>{sideLabel(match.a)} vs {sideLabel(match.b)}</strong>
                  <small>{result.status}</small>
                  {isBestBall(session) ? (
                    <>
                      <div className="meta adminStrokeMeta">Player strokes: {strokesText(session, match, strokes)}</div>
                      <div className="manualGrid playerStrokeGrid">
                        {[...match.a, ...match.b].map((player) => (
                          <label key={player}>
                            {player} strokes
                            <input
                              value={row.manual_player_strokes?.[player] ?? ""}
                              placeholder={String(calculatedPlayers[player])}
                              disabled={sessionLocked}
                              onChange={(e) => updateManualPlayer(match.id, player, e.target.value)}
                            />
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="manualGrid">
                      <label>
                        {sideLabel(match.a)} strokes
                        <input value={row.manual_a ?? ""} placeholder={String(calculated.a)} disabled={sessionLocked} onChange={(e) => updateManual(match.id, "manual_a", e.target.value)} />
                      </label>
                      <label>
                        {sideLabel(match.b)} strokes
                        <input value={row.manual_b ?? ""} placeholder={String(calculated.b)} disabled={sessionLocked} onChange={(e) => updateManual(match.id, "manual_b", e.target.value)} />
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
                                  disabled={sessionLocked}
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
                                  disabled={sessionLocked}
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
  const { settings, updateSettings } = useAppSettings();
  const [route, setRoute] = useState(getInitialRoute);

  useEffect(() => {
    const onHash = () => setRoute(getInitialRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <Header route={route} setRoute={setRoute} syncStatus={syncStatus} />
      {route.view === "score" && <Score rows={rows} updateRow={updateRow} route={route} setRoute={setRoute} settings={settings} />}
      {route.view === "admin" && (
        <AdminGate>
          <Admin rows={rows} updateRow={updateRow} settings={settings} updateSettings={updateSettings} />
        </AdminGate>
      )}
      {route.view === "board" && <Board rows={rows} settings={settings} setRoute={setRoute} />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
