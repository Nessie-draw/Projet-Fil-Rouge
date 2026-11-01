"use client";
import { useEffect, useState } from "react";
import type { Team, Match, DoubleEliminationData } from "../lib/doubleElimination";
import { fromSave, areSame } from "../lib/doubleElimination";

// ── Layout constants ──────────────────────────────────────────────────────────
const CARD_W = 150;
const CARD_H = 44;
const V_GAP  = 20;
const R_GAP  = 180;
const PAD    = 24;
const SLOT   = CARD_H + V_GAP;

function svgPath(sx: number, sy: number, tx: number, ty: number): string {
  const right = sx + CARD_W;
  const mid   = (right + tx) / 2;
  return `M ${right} ${sy + CARD_H / 2} H ${mid} V ${ty + CARD_H / 2} H ${tx}`;
}

function computeWBY(winners: Match[][]): number[][] {
  const pos: number[][] = [winners[0].map((_, i) => i * SLOT)];
  for (let r = 1; r < winners.length; r++) {
    pos.push(winners[r].map((_, i) => {
      const top = pos[r - 1][2 * i] + CARD_H / 2;
      const bot = pos[r - 1][2 * i + 1] + CARD_H / 2;
      return (top + bot) / 2 - CARD_H / 2;
    }));
  }
  return pos;
}

function computeLBY(losers: Match[][]): number[][] {
  if (!losers.length) return [];
  const pos: number[][] = [losers[0].map((_, i) => i * SLOT)];
  for (let r = 1; r < losers.length; r++) {
    if (r % 2 === 1) {
      pos.push(pos[r - 1].map(y => y));
    } else {
      pos.push(losers[r].map((_, i) => {
        const top = pos[r - 1][2 * i] + CARD_H / 2;
        const bot = pos[r - 1][2 * i + 1] + CARD_H / 2;
        return (top + bot) / 2 - CARD_H / 2;
      }));
    }
  }
  return pos;
}

// ── Main component (read-only public view) ────────────────────────────────────
export function BracketContent() {
  const [tournament, setTournament] = useState<DoubleEliminationData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  async function loadBracket() {
    try {
      const res = await fetch("/api/bracket");
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json() as { teams: Team[]; savedBracket: unknown };
      if (data.teams.length < 2) {
        setError(`Il faut au moins 2 équipes (actuellement : ${data.teams.length})`);
        setLoading(false);
        return;
      }
      const liveIds = data.teams.map((t: Team) => t.id);
      const restored = fromSave(data.savedBracket);
      if (restored && areSame(restored.teamIds, liveIds)) {
        setTournament(restored);
      } else {
        setError("Le tournoi n'est pas encore configuré. Contactez l'administrateur.");
        setLoading(false);
        return;
      }
      setLoading(false);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBracket();

    // SSE for real-time updates
    const es = new EventSource("/api/bracket/stream");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as DoubleEliminationData;
        if (data._format === "double_elimination") setTournament(data);
      } catch { /* ignore */ }
    };
    let fallbackIv: ReturnType<typeof setInterval> | null = null;
    es.onerror = () => {
      es.close();
      fallbackIv = setInterval(() => { void loadBracket(); }, 3_000);
    };

    return () => {
      es.close();
      if (fallbackIv) clearInterval(fallbackIv);
    };
  }, []);

  if (loading) return <div className="flex justify-center py-8 text-slate-400 text-sm">Chargement…</div>;
  if (error)   return <div className="p-4 bg-red-500/20 border border-red-500 text-red-300 text-xs rounded">{error}</div>;
  if (!tournament) return null;

  // ── Positions & dimensions ──
  const wbY = computeWBY(tournament.winners);
  const lbY = computeLBY(tournament.losers);

  const wbW = PAD + (tournament.winners.length - 1) * R_GAP + CARD_W + PAD;
  const wbH = wbY[0][wbY[0].length - 1] + CARD_H + 8;

  const hasLB = tournament.losers.length > 0;
  const lbW = hasLB ? PAD + (tournament.losers.length - 1) * R_GAP + CARD_W + PAD : 0;
  const lbH = hasLB ? lbY[0][lbY[0].length - 1] + CARD_H + 8 : 0;

  // WB paths
  const wbPaths: string[] = [];
  for (let r = 0; r < tournament.winners.length - 1; r++) {
    for (let i = 0; i < tournament.winners[r].length; i++) {
      wbPaths.push(svgPath(PAD + r * R_GAP, wbY[r][i], PAD + (r + 1) * R_GAP, wbY[r + 1][Math.floor(i / 2)]));
    }
  }

  // LB paths
  const lbPaths: string[] = [];
  for (let r = 0; r < tournament.losers.length - 1; r++) {
    for (let i = 0; i < tournament.losers[r].length; i++) {
      const tgtI = r % 2 === 0 ? i : Math.floor(i / 2);
      lbPaths.push(svgPath(PAD + r * R_GAP, lbY[r][i], PAD + (r + 1) * R_GAP, lbY[r + 1][tgtI]));
    }
  }

  const champion = tournament.grandFinal.winner;

  const wbLabels = tournament.winners.map((_, r) => r === tournament.winners.length - 1 ? "Finale W" : `R${r + 1}`);
  const lbLabels = tournament.losers.map((_, r) => r === tournament.losers.length - 1 ? "Finale L" : `R${r + 1}`);

  return (
    <div className="bracket-shell">
      <h2 className="text-sm font-semibold text-slate-200 mb-3 text-center uppercase tracking-[0.14em]">Arbre du tournoi — Double Élimination</h2>

      <div className="bracket-scroll">
        {/* ── Winners Bracket ── */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2 ml-6">Winners Bracket</h3>
          <div style={{ display: "flex", paddingLeft: PAD, marginBottom: 6 }}>
            {wbLabels.map((l, r) => (
              <div key={r} className="bracket-round-label" style={{ width: CARD_W, marginRight: r < wbLabels.length - 1 ? R_GAP - CARD_W : 0, flexShrink: 0 }}>{l}</div>
            ))}
          </div>
          <div className="bracket-canvas" style={{ width: wbW, height: wbH }}>
            <svg className="bracket-lines" viewBox={`0 0 ${wbW} ${wbH}`}>
              {wbPaths.map((d, i) => <path key={i} d={d} className="bracket-line-path" />)}
            </svg>
            {tournament.winners.map((round, r) => round.map((m, i) => (
              <div key={m.id} className="bracket-node" style={{ left: PAD + r * R_GAP, top: wbY[r][i] }}>
                <MatchCard match={m} />
              </div>
            )))}
          </div>
        </div>

        {/* ── Losers Bracket ── */}
        {hasLB && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 ml-6">Losers Bracket</h3>
            <div style={{ display: "flex", paddingLeft: PAD, marginBottom: 6 }}>
              {lbLabels.map((l, r) => (
                <div key={r} className="bracket-round-label" style={{ width: CARD_W, marginRight: r < lbLabels.length - 1 ? R_GAP - CARD_W : 0, flexShrink: 0 }}>{l}</div>
              ))}
            </div>
            <div className="bracket-canvas" style={{ width: lbW, height: lbH }}>
              <svg className="bracket-lines" viewBox={`0 0 ${lbW} ${lbH}`}>
                {lbPaths.map((d, i) => <path key={i} d={d} className="bracket-line-path" />)}
              </svg>
              {tournament.losers.map((round, r) => round.map((m, i) => (
                <div key={m.id} className="bracket-node" style={{ left: PAD + r * R_GAP, top: lbY[r][i] }}>
                  <MatchCard match={m} />
                </div>
              )))}
            </div>
          </div>
        )}

        {/* ── Grande Finale + Champion ── */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 ml-6">Grande Finale</h3>
          <div style={{ display: "flex", gap: 24, alignItems: "center", paddingLeft: PAD }}>
            <div>
              <div className="bracket-round-label" style={{ width: CARD_W, marginBottom: 6 }}>Finale</div>
              <MatchCard match={tournament.grandFinal} />
            </div>
            <div>
              <div className="bracket-round-label" style={{ width: CARD_W, marginBottom: 6 }}>Champion</div>
              <div className={`bracket-vainqueur ${champion ? "bracket-vainqueur--won" : ""}`}>
                {champion ? champion.name : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MatchCard (read-only) ─────────────────────────────────────────────────────
function MatchCard({ match }: { match: Match }) {
  const decided = !!match.winner;
  const isByeMatch = decided && (!match.team1 || !match.team2);
  return (
    <div className="bracket-card">
      <TeamRow team={match.team1} resolved={match.t1Set !== false} isWinner={decided && !isByeMatch && match.winner?.id === match.team1?.id} isLoser={decided && !isByeMatch && match.winner?.id !== match.team1?.id && !!match.team1} borderBottom />
      <TeamRow team={match.team2} resolved={match.t2Set !== false} isWinner={decided && !isByeMatch && match.winner?.id === match.team2?.id} isLoser={decided && !isByeMatch && match.winner?.id !== match.team2?.id && !!match.team2} borderBottom={false} />
    </div>
  );
}

function TeamRow({ team, resolved, isWinner, isLoser, borderBottom }: {
  team: Team | null; resolved: boolean; isWinner: boolean; isLoser: boolean; borderBottom: boolean;
}) {
  const isBye   = resolved && !team;
  const pending = !resolved && !team;
  return (
    <div
      style={{ cursor: "default" }}
      className={[
        "bracket-team-row",
        borderBottom ? "border-b border-[#1e293b]" : "",
        isWinner ? "bracket-team-winner" : "",
        isLoser  ? "bracket-team-loser"  : "",
        isBye    ? "bracket-bye"         : "",
        pending  ? "bracket-bye"         : "",
      ].join(" ")}
    >
      <span className="truncate">{team ? team.name : isBye ? "BYE" : "—"}</span>
      {isWinner && <span className="bracket-badge bracket-badge--v">V</span>}
      {isLoser  && <span className="bracket-badge bracket-badge--d">D</span>}
    </div>
  );
}
