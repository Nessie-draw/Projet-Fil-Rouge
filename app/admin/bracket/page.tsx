"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Team, Match, DoubleEliminationData } from "../../lib/doubleElimination";
import { generate, setWinner, clearWinner, findMatch, fromSave, areSame } from "../../lib/doubleElimination";

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

// ── Y-position calculators ───────────────────────────────────────────────────
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
      // Major round: 1:1 from previous minor
      pos.push(pos[r - 1].map(y => y));
    } else {
      // Minor round: merge pairs from previous major
      pos.push(losers[r].map((_, i) => {
        const top = pos[r - 1][2 * i] + CARD_H / 2;
        const bot = pos[r - 1][2 * i + 1] + CARD_H / 2;
        return (top + bot) / 2 - CARD_H / 2;
      }));
    }
  }
  return pos;
}

// ── Admin page ────────────────────────────────────────────────────────────────
export default function AdminBracketPage() {
  const [tournament, setTournament] = useState<DoubleEliminationData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function saveTournament(data: DoubleEliminationData) {
    setSaving(true);
    try {
      const res = await fetch("/api/bracket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Erreur sauvegarde");
    } finally { setSaving(false); }
  }

  async function loadBracket() {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/bracket");
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json() as { teams: Team[]; savedBracket: unknown };
      if (data.teams.length < 2) { setError(`Il faut au moins 2 équipes (${data.teams.length})`); setLoading(false); return; }
      const liveIds = data.teams.map((t: Team) => t.id);
      const restored = fromSave(data.savedBracket);
      if (restored && areSame(restored.teamIds, liveIds)) {
        setTournament(restored);
      } else {
        const fresh = generate(data.teams);
        await saveTournament(fresh);
        setTournament(fresh);
      }
      setLoading(false);
    } catch (e) { setError(String(e)); setLoading(false); }
  }

  async function handleSelect(matchId: string, winner: Team) {
    if (!tournament) return;
    const match = findMatch(tournament, matchId);
    const updated = match?.winner?.id === winner.id
      ? clearWinner(tournament, matchId)
      : setWinner(tournament, matchId, winner);
    await saveTournament(updated);
    setTournament(updated);
  }

  async function resetTournament() {
    if (!confirm("Réinitialiser tout l'arbre ? Cette action est irréversible.")) return;
    const res = await fetch("/api/bracket");
    const data = await res.json() as { teams: Team[] };
    const fresh = generate(data.teams);
    await saveTournament(fresh);
    setTournament(fresh);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadBracket(); }, []);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400 text-sm">Chargement…</div>;
  if (error)   return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="p-4 bg-red-500/20 border border-red-500 text-red-300 text-xs rounded">{error}</div></div>;
  if (!tournament) return null;

  // ── Positions & dimensions ──
  const wbY = computeWBY(tournament.winners);
  const lbY = computeLBY(tournament.losers);

  const wbW = PAD + (tournament.winners.length - 1) * R_GAP + CARD_W + PAD;
  const wbH = wbY[0][wbY[0].length - 1] + CARD_H + 8;

  const hasLB = tournament.losers.length > 0;
  const lbW = hasLB ? PAD + (tournament.losers.length - 1) * R_GAP + CARD_W + PAD : 0;
  const lbH = hasLB ? lbY[0][lbY[0].length - 1] + CARD_H + 8 : 0;

  // ── SVG paths ──
  const wbPaths: string[] = [];
  for (let r = 0; r < tournament.winners.length - 1; r++) {
    for (let i = 0; i < tournament.winners[r].length; i++) {
      wbPaths.push(svgPath(PAD + r * R_GAP, wbY[r][i], PAD + (r + 1) * R_GAP, wbY[r + 1][Math.floor(i / 2)]));
    }
  }

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
    <div className="min-h-screen bg-[#020617] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-sm font-bold text-[#22c55e] uppercase tracking-widest">Admin · Double Élimination</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Cliquez sur une équipe pour la désigner vainqueure (recliquez pour annuler)</p>
        </div>
        <div className="flex gap-3">
          {saving && <span className="text-xs text-slate-400 self-center">Sauvegarde…</span>}
          <button onClick={resetTournament} className="px-4 py-2 text-xs bg-red-900/40 hover:bg-red-800/50 border border-red-800 text-red-400 rounded transition">Réinitialiser</button>
          <Link href="/admin/equipes" className="px-4 py-2 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded transition">Équipes</Link>
          <Link href="/" className="px-4 py-2 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded transition">← Site public</Link>
          <button onClick={handleLogout} className="px-4 py-2 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-400 hover:text-red-400 rounded transition">Déconnexion</button>
        </div>
      </div>

      <div className="bracket-scroll">
        {/* ── Winners Bracket ── */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Winners Bracket</h2>
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
                <MatchCard match={m} onSelect={w => handleSelect(m.id, w)} />
              </div>
            )))}
          </div>
        </div>

        {/* ── Losers Bracket ── */}
        {hasLB && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Losers Bracket</h2>
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
                  <MatchCard match={m} onSelect={w => handleSelect(m.id, w)} />
                </div>
              )))}
            </div>
          </div>
        )}

        {/* ── Grande Finale + Champion ── */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Grande Finale</h2>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div>
              <div className="bracket-round-label" style={{ width: CARD_W, marginBottom: 6 }}>Finale</div>
              <MatchCard match={tournament.grandFinal} onSelect={w => handleSelect("gf", w)} />
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

// ── MatchCard (clickable) ─────────────────────────────────────────────────────
function MatchCard({ match, onSelect }: { match: Match; onSelect: (w: Team) => void }) {
  const decided = !!match.winner;
  const isByeMatch = decided && (!match.team1 || !match.team2);
  return (
    <div className="bracket-card">
      <TeamRow team={match.team1} resolved={match.t1Set !== false} isWinner={decided && !isByeMatch && match.winner?.id === match.team1?.id} isLoser={decided && !isByeMatch && match.winner?.id !== match.team1?.id && !!match.team1} onClick={() => match.team1 && onSelect(match.team1)} borderBottom />
      <TeamRow team={match.team2} resolved={match.t2Set !== false} isWinner={decided && !isByeMatch && match.winner?.id === match.team2?.id} isLoser={decided && !isByeMatch && match.winner?.id !== match.team2?.id && !!match.team2} onClick={() => match.team2 && onSelect(match.team2)} borderBottom={false} />
    </div>
  );
}

function TeamRow({ team, resolved, isWinner, isLoser, onClick, borderBottom }: {
  team: Team | null; resolved: boolean; isWinner: boolean; isLoser: boolean; onClick: () => void; borderBottom: boolean;
}) {
  const isBye    = resolved && !team;
  const pending  = !resolved && !team;
  return (
    <div
      onClick={!team ? undefined : onClick}
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
