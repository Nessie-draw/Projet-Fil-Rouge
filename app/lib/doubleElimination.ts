// app/lib/doubleElimination.ts
// Double-elimination tournament algorithm (ported from smwa/double_elimination)

export type Team = { id: string; name: string };
export type MatchLink = { matchId: string; slot: 1 | 2 };

export type Match = {
  id: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  winnerTo?: MatchLink;
  loserTo?: MatchLink;
  // Flags: true once a team slot has been filled (by initial setup or propagation)
  // Distinguishes "pending" (upstream not decided) from "BYE" (genuine null opponent)
  t1Set?: boolean;
  t2Set?: boolean;
};

export type DoubleEliminationData = {
  _format: "double_elimination";
  winners: Match[][];   // winners[round][matchIndex]
  losers: Match[][];    // losers[round][matchIndex]
  grandFinal: Match;
  teamIds: string[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────────

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Standard bracket seeding: ensures 1vN, 2v(N-1), on opposite sides */
function bracketSeeding(n: number): number[] {
  if (n === 1) return [1];
  const half = bracketSeeding(n / 2);
  const out: number[] = [];
  for (const s of half) { out.push(s, n + 1 - s); }
  return out;
}

/** Auto-resolve BYE matches (only if both slots are resolved) */
function normalize(m: Match): void {
  if (!m.t1Set || !m.t2Set) return; // wait for both slots to be filled
  if (!m.team1 && !m.team2) { m.winner = null; return; }
  if (m.team1 && !m.team2) { m.winner = m.team1; return; }
  if (!m.team1 && m.team2) { m.winner = m.team2; return; }
  if (m.winner && m.winner.id !== m.team1!.id && m.winner.id !== m.team2!.id) {
    m.winner = null;
  }
}

export function findMatch(t: DoubleEliminationData, id: string): Match | null {
  for (const round of t.winners) for (const m of round) if (m.id === id) return m;
  for (const round of t.losers) for (const m of round) if (m.id === id) return m;
  if (t.grandFinal.id === id) return t.grandFinal;
  return null;
}

// ── Generate ─────────────────────────────────────────────────────────────────────

export function generate(teams: Team[]): DoubleEliminationData {
  const n = teams.length;
  const size = nextPow2(n);
  const wbRounds = Math.log2(size);
  const lbRounds = Math.max(0, 2 * (wbRounds - 1));
  const seed = bracketSeeding(size);
  const teamAt = (s: number): Team | null => s <= n ? teams[s - 1] : null;

  // ── Winners bracket ──
  const winners: Match[][] = [];

  // WB R1 — teams are set, slots resolved
  const r1: Match[] = [];
  for (let i = 0; i < size / 2; i++) {
    r1.push({
      id: `wb-1-${i}`,
      team1: teamAt(seed[i * 2]),
      team2: teamAt(seed[i * 2 + 1]),
      winner: null,
      t1Set: true,
      t2Set: true,
    });
  }
  winners.push(r1);

  // WB R2..Rn — empty
  let mc = size / 2;
  for (let r = 1; r < wbRounds; r++) {
    mc /= 2;
    winners.push(
      Array.from({ length: mc }, (_, i) => ({
        id: `wb-${r + 1}-${i}`, team1: null, team2: null, winner: null, t1Set: false, t2Set: false,
      }))
    );
  }

  // ── Losers bracket ──
  const losers: Match[][] = [];
  let lmc = Math.max(1, size / 4);
  for (let r = 0; r < lbRounds; r++) {
    losers.push(
      Array.from({ length: lmc }, (_, i) => ({
        id: `lb-${r + 1}-${i}`, team1: null, team2: null, winner: null, t1Set: false, t2Set: false,
      }))
    );
    if (r % 2 === 1) lmc = Math.max(1, lmc / 2);
  }

  // ── Grand Final ──
  const grandFinal: Match = { id: "gf", team1: null, team2: null, winner: null, t1Set: false, t2Set: false };

  // ── Links ──────────────────────────────────────────────────────────────────────

  // WB internal: winner → next WB round
  for (let r = 0; r < wbRounds - 1; r++) {
    for (let i = 0; i < winners[r].length; i++) {
      winners[r][i].winnerTo = {
        matchId: winners[r + 1][Math.floor(i / 2)].id,
        slot: (i % 2 === 0 ? 1 : 2) as 1 | 2,
      };
    }
  }
  // WB final winner → GF team1
  winners[wbRounds - 1][0].winnerTo = { matchId: "gf", slot: 1 };

  // WB losers → LB
  if (lbRounds > 0) {
    // WB R1 losers → LB R1 (pair up 2:1)
    for (let i = 0; i < winners[0].length; i++) {
      winners[0][i].loserTo = {
        matchId: losers[0][Math.floor(i / 2)].id,
        slot: (i % 2 === 0 ? 1 : 2) as 1 | 2,
      };
    }
    // WB R(k+1) losers → LB R(2k+1) as team2
    for (let k = 1; k < wbRounds; k++) {
      const lbR = 2 * k - 1;
      if (lbR < lbRounds) {
        for (let i = 0; i < winners[k].length; i++) {
          winners[k][i].loserTo = { matchId: losers[lbR][i].id, slot: 2 };
        }
      }
    }
  } else {
    // 2-team edge case
    winners[0][0].loserTo = { matchId: "gf", slot: 2 };
  }

  // LB internal
  for (let r = 0; r < lbRounds - 1; r++) {
    if (r % 2 === 0) {
      // Minor → Major (1:1)
      for (let i = 0; i < losers[r].length; i++) {
        losers[r][i].winnerTo = { matchId: losers[r + 1][i].id, slot: 1 };
      }
    } else {
      // Major → Minor (merge 2:1)
      for (let i = 0; i < losers[r].length; i++) {
        losers[r][i].winnerTo = {
          matchId: losers[r + 1][Math.floor(i / 2)].id,
          slot: (i % 2 === 0 ? 1 : 2) as 1 | 2,
        };
      }
    }
  }
  // LB final → GF team2
  if (lbRounds > 0) {
    losers[lbRounds - 1][0].winnerTo = { matchId: "gf", slot: 2 };
  }

  const t: DoubleEliminationData = { _format: "double_elimination", winners, losers, grandFinal, teamIds: teams.map(t => t.id) };
  propagate(t);
  return t;
}

// ── Propagation ──────────────────────────────────────────────────────────────────

export function propagate(t: DoubleEliminationData): void {
  // Reset all non-WB-R1 slots
  for (let r = 1; r < t.winners.length; r++) {
    for (const m of t.winners[r]) { m.team1 = null; m.team2 = null; m.t1Set = false; m.t2Set = false; }
  }
  for (const round of t.losers) {
    for (const m of round) { m.team1 = null; m.team2 = null; m.t1Set = false; m.t2Set = false; }
  }
  t.grandFinal.team1 = null; t.grandFinal.team2 = null;
  t.grandFinal.t1Set = false; t.grandFinal.t2Set = false;

  // Process in topological order: WB rounds → LB rounds → GF
  const all: Match[] = [];
  for (const round of t.winners) all.push(...round);
  for (const round of t.losers) all.push(...round);
  all.push(t.grandFinal);

  for (const m of all) {
    // Validate existing winner
    if (m.winner) {
      const ids = [m.team1?.id, m.team2?.id].filter(Boolean);
      if (!ids.includes(m.winner.id)) m.winner = null;
    }

    normalize(m);

    if (!m.winner) continue;

    const loser = m.team1?.id === m.winner.id ? m.team2 : m.team1;

    // Propagate winner
    if (m.winnerTo) {
      const tgt = findMatch(t, m.winnerTo.matchId);
      if (tgt) {
        if (m.winnerTo.slot === 1) { tgt.team1 = m.winner; tgt.t1Set = true; }
        else { tgt.team2 = m.winner; tgt.t2Set = true; }
      }
    }

    // Propagate loser (even if null — marks the slot as resolved for BYE handling)
    if (m.loserTo) {
      const tgt = findMatch(t, m.loserTo.matchId);
      if (tgt) {
        if (m.loserTo.slot === 1) { tgt.team1 = loser; tgt.t1Set = true; }
        else { tgt.team2 = loser; tgt.t2Set = true; }
      }
    }
  }
}

// ── Set / Clear winner ───────────────────────────────────────────────────────────

export function setWinner(t: DoubleEliminationData, matchId: string, winner: Team): DoubleEliminationData {
  const copy: DoubleEliminationData = JSON.parse(JSON.stringify(t));
  const m = findMatch(copy, matchId);
  if (!m) return copy;
  m.winner = winner;
  propagate(copy);
  return copy;
}

export function clearWinner(t: DoubleEliminationData, matchId: string): DoubleEliminationData {
  const copy: DoubleEliminationData = JSON.parse(JSON.stringify(t));
  const m = findMatch(copy, matchId);
  if (m) m.winner = null;
  propagate(copy);
  return copy;
}

// ── Save / Load ──────────────────────────────────────────────────────────────────

export function fromSave(data: unknown): DoubleEliminationData | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d._format !== "double_elimination" || !Array.isArray(d.winners) || !Array.isArray(d.losers)) return null;
  return d as unknown as DoubleEliminationData;
}

export function areSame(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort(), sb = [...b].sort();
  return sa.every((id, i) => id === sb[i]);
}
