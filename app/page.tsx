'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, TrendingUp, Zap, Radio, CloudRain, Activity, ChevronRight, Target, ArrowUpRight, ArrowDownRight, Users, Info, ListChecks, Stethoscope, Crosshair, Map } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const ScoreTrendChart = dynamic(() => import('./ScoreTrendChart'), { 
  ssr: false,
  loading: () => <div className="h-[150px] w-full bg-slate-900/20 animate-pulse rounded" />
});

const PATS_ROSTER = [
  { name: "Drake Maye", id: "4685721", pos: "QB" },
  { name: "R. Stevenson", id: "4242335", pos: "RB" },
  { name: "Ja'Lynn Polk", id: "4430839", pos: "WR" },
  { name: "Hunter Henry", id: "2976212", pos: "TE" },
  { name: "C. Gonzalez", id: "4426336", pos: "CB" }
];

const MatrixLoading = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-blue-500">
    <Zap className="animate-bounce mb-4" size={48} />
    <p className="tracking-[0.5em] animate-pulse font-black uppercase">Establishing_NE_Uplink</p>
  </div>
);

const TacticalField = ({ yardLine, distance, possession }: any) => {
  const [side, lineStr] = yardLine && typeof yardLine === 'string' ? yardLine.split(' ') : ['NE', '50'];
  const line = parseInt(lineStr) || 50;
  const absoluteYardLine = side === 'NE' ? line : 100 - line;
  const firstDownLine = absoluteYardLine + (possession === 'NE' ? distance : -distance);

  return (
    <div className="relative h-20 bg-[#0a141d] border border-blue-900/30 rounded overflow-hidden flex items-center mt-4">
      <div className="absolute left-0 w-[8%] h-full bg-blue-900/20 border-r border-blue-800/50 flex items-center justify-center">
        <span className="text-blue-500/20 font-black rotate-90 text-[8px] tracking-[0.3em]">PATS</span>
      </div>
      <div className="absolute right-0 w-[8%] h-full bg-red-900/10 border-l border-red-800/50 flex items-center justify-center">
        <span className="text-red-500/20 font-black -rotate-90 text-[8px] tracking-[0.3em]">OPP</span>
      </div>
      <div className="relative w-[84%] h-full ml-[8%] flex justify-between">
        {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((_, i) => (
          <div key={i} className="h-full w-px bg-slate-800/40"></div>
        ))}
        <div className="absolute top-0 h-full w-1 bg-blue-500 shadow-[0_0_15px_cyan] z-20" style={{ left: `${absoluteYardLine}%` }}></div>
        <div className="absolute top-0 h-full w-1 bg-yellow-400 opacity-60 z-10" style={{ left: `${firstDownLine}%` }}></div>
      </div>
    </div>
  );
};

export default function PatriotsDashboard() {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoreHistory, setScoreHistory] = useState<any>([]);
  const [winProbHistory, setWinProbHistory] = useState<any>([]);
  const [standings, setStandings] = useState<any>([]);
  const [injuries, setInjuries] = useState<any>([]);
  const [selectedPlayer, setSelectedPlayer] = useState(PATS_ROSTER[0]);
  const [playerBio, setPlayerBio] = useState<any>(null);

  const fetchProData = useCallback(async () => {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'nfl-api1.p.rapidapi.com'
      }
    };

    try {
      // 1. CARGAR DATOS FIJOS
      const [bioRes, standRes, injRes] = await Promise.all([
        fetch(`https://nfl-api1.p.rapidapi.com/v2/nfl/player/bio?id=${selectedPlayer.id}`, options),
        fetch('https://nfl-api1.p.rapidapi.com/v2/nfl/standings', options),
        fetch('https://nfl-api1.p.rapidapi.com/v2/nfl/injuries-team?id=22', options)
      ]);
      
      const bioData = await bioRes.json();
      const standData = await standRes.json();
      const injData = await injRes.json();
      
      setPlayerBio(bioData.player || bioData);
      setStandings(standData.children?.[0]?.children?.[0]?.standings?.entries || []);
      setInjuries(injData.injuries?.slice(0, 5) || []);

      // 2. DATOS DE PARTIDO
      const scoreRes = await fetch('https://nfl-api1.p.rapidapi.com/v2/nfl/scoreboard', options);
      const scoreData = await scoreRes.json();
      const patsEvent = scoreData.events?.find((e: any) => e.competitions[0].competitors.some((c: any) => c.team.abbreviation === 'NE'));

      if (patsEvent) {
        const gameId = patsEvent.id;
        const comp = patsEvent.competitions[0];
        const patsTeam = comp.competitors.find((c: any) => c.team.abbreviation === 'NE');
        const currentProb = patsTeam.winProbability || 50;

        const [boxRes, oddsRes] = await Promise.all([
          fetch(`https://nfl-api1.p.rapidapi.com/v2/nfl/boxscore?id=${gameId}`, options),
          fetch(`https://nfl-api1.p.rapidapi.com/v2/nfl/odds?id=${gameId}`, options)
        ]);
        const boxData = await boxRes.json();
        const oddsData = await oddsRes.json();

        setWinProbHistory((prev: any) => [...prev.slice(-30), { time: patsEvent.status.displayClock, prob: currentProb }]);
        setGameData({
          isLive: patsEvent.status.type.state === 'in',
          status: patsEvent.status.type.detail,
          score: { patriots: patsTeam.score, opponent: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').score, oppName: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').team.abbreviation },
          timeouts: { pats: patsTeam.timeouts, opp: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').timeouts },
          odds: oddsData.items?.[0] || { details: "N/A" },
          situation: comp.situation || {},
          winProb: currentProb,
          weather: boxData.gameInfo?.weather
        });
      } else {
        setGameData({ status: "OFFLINE", isLive: false, score: { patriots: "0", opponent: "0", oppName: "TBD" }, odds: { details: "OFF_BOARD" }, situation: {}, winProb: 50 });
      }
    } catch (error) {
      console.error("Link Error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlayer.id]);

  useEffect(() => {
    fetchProData();
    const interval = setInterval(fetchProData, 15000);
    return () => clearInterval(interval);
  }, [fetchProData]);

  if (loading) return <MatrixLoading />;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-8 font-mono overflow-x-hidden">
      <header className="flex flex-col lg:flex-row justify-between items-start border-b border-blue-900/50 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-5">
          <div className="bg-red-600 p-3 transform -skew-x-12"><Shield size={32} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Patriots_Telemetry_v2.5</h1>
            <div className="flex gap-4 mt-2 text-[10px] font-bold">
               <span className={`${gameData?.isLive ? 'text-green-500 animate-pulse' : 'text-slate-600'} flex items-center gap-1`}>
                 <Activity size={12}/> {gameData?.isLive ? 'LIVE_FEED' : 'STANDBY'}
               </span>
               <span className="text-blue-400 uppercase tracking-widest"><CloudRain size={12} className="inline mr-1"/> {gameData?.weather?.displayValue || 'Atmosphere_Stable'}</span>
               <span className="text-yellow-500 border border-yellow-900/50 px-2">Odds: {gameData?.odds?.details}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-blue-500/20 p-3 px-6 text-center">
          <p className="text-[9px] text-slate-500 uppercase italic">Status</p>
          <p className="text-2xl font-black text-blue-400 tracking-widest uppercase">{gameData?.status || 'OFFLINE'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-950 border border-blue-900/30 p-6 rounded-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <div className="text-center text-white">
                 <p className="text-blue-500 text-xs font-black">NE</p>
                 <p className="text-7xl font-black leading-none">{gameData?.score.patriots}</p>
                 <div className="flex gap-1 justify-center mt-2">
                   {[...Array(3)].map((_, i) => <div key={i} className={`h-1 w-3 ${i < (gameData?.timeouts?.pats || 0) ? 'bg-yellow-400' : 'bg-slate-800'}`} />)}
                 </div>
               </div>
               <div className="text-slate-800 font-black text-xl">VS</div>
               <div className="text-center opacity-60 text-white">
                 <p className="text-slate-500 text-xs font-black">{gameData?.score.oppName}</p>
                 <p className="text-7xl font-black leading-none">{gameData?.score.opponent}</p>
               </div>
            </div>
            <div className="bg-black/50 p-4 border border-slate-900 rounded-sm">
              <p className="text-[9px] text-blue-500 font-black uppercase mb-2">Win_Probability</p>
              <div className="h-[60px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={winProbHistory.length > 1 ? winProbHistory : [{prob: 50}, {prob: 50}]}>
                    <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <Area type="monotone" dataKey="prob" stroke="#3b82f6" fill="url(#c)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm">
            <h3 className="text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Crosshair size={14}/> Target_Selection_Unit
            </h3>
            <div className="space-y-1">
              {PATS_ROSTER.map((player) => (
                <button key={player.id} onClick={() => setSelectedPlayer(player)} className={`w-full flex justify-between p-2 text-[10px] border-b border-slate-900 transition-all ${selectedPlayer.id === player.id ? 'bg-blue-900/40 border-l-4 border-l-blue-500 text-white font-black' : 'text-slate-500 hover:bg-slate-900'}`}>
                  <span className="w-8 text-left font-bold">{player.pos}</span>
                  <span className="flex-1 text-left ml-4 italic uppercase">{player.name}</span>
                  {selectedPlayer.id === player.id && <Zap size={10} className="text-blue-500 animate-pulse" />}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm">
             <h3 className="text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-2"><ListChecks size={14}/> AFC_East_Standings</h3>
             <div className="space-y-2">
                {standings.map((team: any, i: number) => (
                  <div key={i} className={`flex justify-between text-[10px] p-2 border-l-2 ${team.team.abbreviation === 'NE' ? 'bg-blue-900/20 border-blue-500' : 'bg-white/5 border-slate-800'}`}>
                    <span className="font-bold text-slate-300 uppercase">{team.team.displayName}</span>
                    <span className="text-white font-black">{team.stats.find((s:any)=>s.name==='wins')?.value}-{team.stats.find((s:any)=>s.name==='losses')?.value}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-[#020814] border border-blue-900/20 p-6 rounded-sm shadow-2xl relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-blue-500"><Target /><h2 className="text-lg font-black uppercase italic text-white">Tactical_Drive</h2></div>
                <div className={`text-[8px] font-black px-2 py-1 border rounded-sm ${gameData?.isLive ? 'border-green-900 text-green-500' : 'border-slate-800 text-slate-600'}`}>
                   {gameData?.isLive ? 'STREAM_ACTIVE' : 'FEED_STANDBY'}
                </div>
              </div>
              <div className="bg-black/40 p-4 italic text-[11px] border-l-4 border-blue-600 leading-relaxed min-h-[60px] text-slate-300">
                {gameData?.situation?.lastPlay?.text || "Awaiting stadium telemetry feed..."}
              </div>
              <TacticalField yardLine={gameData?.situation?.yardLine} distance={gameData?.situation?.distance} possession={gameData?.possession} />
            </section>

            <section className="bg-slate-950 border border-slate-800 p-6 rounded-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-6 text-red-500"><Stethoscope size={18} /><h2 className="text-lg font-black uppercase italic text-white">Injury_Report</h2></div>
              <div className="space-y-2">
                {injuries.length > 0 ? injuries.map((inj: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px] border-b border-slate-900 pb-2 text-white">
                    <span className="text-slate-300 font-bold">{inj.athlete.displayName}</span>
                    <span className="text-red-500 font-black uppercase">{inj.status}</span>
                  </div>
                )) : <p className="text-[10px] text-slate-600 italic">Scanning complete. No major injuries.</p>}
              </div>
            </section>
          </div>

          <section className="bg-gradient-to-r from-slate-950 to-blue-950/20 border-t-2 border-red-600 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-8">
             <div className="relative">
                <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${selectedPlayer.id}.png`} alt="Unit" className="w-28 h-28 rounded-full border-2 border-blue-600 bg-slate-900 object-cover shadow-[0_0_15px_cyan]" onError={(e:any) => e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png'} />
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-[8px] font-black px-2 py-1 uppercase shadow-lg">ACTIVE_OBJ</div>
             </div>
             <div className="flex-1 text-center md:text-left text-white">
                <p className="text-[10px] text-slate-500 font-black uppercase italic mb-1 tracking-[0.3em]">Biometric_Feed:</p>
                <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-2">{playerBio?.displayName || selectedPlayer.name}</h3>
                <div className="flex gap-4 text-[10px] font-bold text-blue-400 uppercase">
                  <span>AGE: {playerBio?.age || '--'}</span>
                  <span>EXP: {playerBio?.experience?.years || 'R'} YRS</span>
                  <span>COLLEGE: {playerBio?.college?.name || '---'}</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 border-l border-slate-800 pl-8">
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black">Weight</p>
                  <p className="text-2xl font-black text-white">{playerBio?.displayWeight || '--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black">Status</p>
                  <p className="text-2xl font-black text-green-500 uppercase">{playerBio?.status?.type || 'ACT'}</p>
                </div>
             </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm h-[200px]">
             <div className="flex items-center gap-2 mb-4 text-blue-500/50">
                <Activity size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">Score_History_Telemetry</span>
             </div>
             <div className="h-[120px] w-full">
               <ScoreTrendChart data={scoreHistory} />
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}