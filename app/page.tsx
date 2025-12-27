'use client';

import React, { useState, useEffect } from 'react';
import { Shield, List, Gauge, Users, TrendingUp, Zap, LineChart as ChartIcon, MousePointer2, Radio } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- COMPONENTE: CAMPO TÁCTICO ---
const TacticalField = ({ yardLine, distance, possession }: any) => {
  const [side, lineStr] = yardLine ? yardLine.split(' ') : ['NE', '50'];
  const line = parseInt(lineStr) || 50;
  const absoluteYardLine = side === 'NE' ? line : 100 - line;
  const firstDownLine = absoluteYardLine + (possession === 'NE' ? distance : -distance);

  return (
    <div className="relative h-24 bg-[#0a141d] border border-blue-900/30 rounded overflow-hidden flex items-center shadow-inner">
      <div className="absolute left-0 w-[8%] h-full bg-blue-900/20 border-r border-blue-800/50 flex items-center justify-center">
        <span className="text-blue-500/20 font-black rotate-90 text-[10px] tracking-[0.5em]">PATS</span>
      </div>
      <div className="absolute right-0 w-[8%] h-full bg-red-900/10 border-l border-red-800/50 flex items-center justify-center">
        <span className="text-red-500/20 font-black -rotate-90 text-[10px] tracking-[0.5em]">OPP</span>
      </div>
      <div className="relative w-[84%] h-full ml-[8%] flex justify-between">
        {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((y, i) => (
          <div key={i} className="h-full w-px bg-slate-800/40"></div>
        ))}
        <div className="absolute top-0 h-full w-1 bg-blue-500 shadow-[0_0_15px_cyan] z-20 transition-all duration-1000" style={{ left: `${absoluteYardLine}%` }}></div>
        <div className="absolute top-0 h-full w-1 bg-yellow-400 opacity-60 z-10 transition-all duration-1000" style={{ left: `${firstDownLine}%` }}></div>
      </div>
    </div>
  );
};

export default function PatriotsDashboard() {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoreHistory, setScoreHistory] = useState<any>([]);
  const [rosterTab, setRosterTab] = useState<'offense' | 'defense'>('offense');
  const [selectedPlayer, setSelectedPlayer] = useState({ name: "Drake Maye", pos: "QB" });

  const fetchLiveStats = async () => {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'nfl-api1.p.rapidapi.com'
      }
    };

    try {
      const scoreRes = await fetch('https://nfl-api1.p.rapidapi.com/v2/nfl/scoreboard', options);
      const scoreData = await scoreRes.json();
      
      const patsEvent = scoreData.events?.find((e: any) => 
        e.competitions[0].competitors.some((c: any) => c.team.abbreviation === 'NE')
      );

      if (patsEvent) {
        const gameId = patsEvent.id;
        const comp = patsEvent.competitions[0];
        const patsTeam = comp.competitors.find((c: any) => c.team.abbreviation === 'NE');
        const oppTeam = comp.competitors.find((c: any) => c.team.abbreviation !== 'NE');
        const sit = comp.situation;

        const boxRes = await fetch(`https://nfl-api1.p.rapidapi.com/v2/nfl/boxscore?id=${gameId}`, options);
        const boxData = await boxRes.json();
        const patsStats = boxData.players?.find((p: any) => p.team.abbreviation === 'NE');

        let playerStats: any = { yards: "0", tds: "0", extra: "0/0", label: "STATS" };
        patsStats?.statistics?.forEach((cat: any) => {
          const athlete = cat.athletes?.find((a: any) => a.athlete.displayName === selectedPlayer.name);
          if (athlete) {
            if (cat.name === 'passing') playerStats = { yards: athlete.stats[2], tds: athlete.stats[3], extra: athlete.stats[0], label: "PASS_YDS" };
            if (cat.name === 'rushing') playerStats = { yards: athlete.stats[1], tds: athlete.stats[2], extra: athlete.stats[0], label: "RUSH_YDS" };
            if (cat.name === 'receiving') playerStats = { yards: athlete.stats[1], tds: athlete.stats[2], extra: athlete.stats[0], label: "REC_YDS" };
          }
        });

        const newScorePoint = { time: patsEvent.status.displayClock, pats: parseInt(patsTeam.score), opp: parseInt(oppTeam.score) };
        setScoreHistory((prev: any) => (prev.length > 0 && prev[prev.length-1].pats === newScorePoint.pats ? prev : [...prev, newScorePoint]));

        setGameData({
          status: "LIVE",
          teamName: "NEW ENGLAND PATRIOTS",
          score: { patriots: patsTeam.score, opponent: oppTeam.score, oppName: oppTeam.team.abbreviation },
          clock: `${patsEvent.status.displayClock} / ${patsEvent.status.period}Q`,
          possession: sit?.possession === patsTeam.id ? 'NE' : oppTeam.team.abbreviation,
          yardLine: sit?.lastPlay?.text.includes('at NE') ? `NE ${sit.yardLine}` : `OPP ${sit.yardLine}`,
          down: sit?.down || 0,
          distance: sit?.distance || 0,
          winProb: patsTeam.winProbability || 50,
          lastPlays: sit?.lastPlay ? [{ id: Date.now(), text: sit.lastPlay.text }] : [],
          playerMonitor: { ...selectedPlayer, ...playerStats },
          roster: { 
            offense: [{ pos: "QB", name: "Drake Maye" }, { pos: "RB", name: "Rhamondre Stevenson" }, { pos: "WR", name: "Ja'Lynn Polk" }],
            defense: [{ pos: "CB", name: "Christian Gonzalez" }, { pos: "S", name: "Kyle Dugger" }]
          }
        });
      } else {
        // MODO OFFLINE / STANDBY
        setGameData({
          status: "OFFLINE",
          teamName: "NEW ENGLAND PATRIOTS",
          score: { patriots: "0", opponent: "0", oppName: "TBD" },
          clock: "NO_GAME_ACTIVE",
          possession: "N/A", yardLine: "50", down: 0, distance: 0, winProb: 0,
          lastPlays: [{ id: 1, text: "System on standby. Waiting for next game signal..." }],
          playerMonitor: { ...selectedPlayer, yards: "0", tds: "0", extra: "0/0", label: "YARDS" },
          roster: { 
            offense: [{ pos: "QB", name: "Drake Maye" }, { pos: "RB", name: "Rhamondre Stevenson" }],
            defense: [{ pos: "CB", name: "Christian Gonzalez" }]
          }
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("TELEMETRY_ERROR:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 45000);
    return () => clearInterval(interval);
  }, [selectedPlayer]);

  if (loading || !gameData) return (
    <div className="min-h-screen bg-[#000d16] flex flex-col items-center justify-center font-mono text-blue-500">
      <Zap className="animate-bounce mb-4" size={48} />
      <p className="animate-pulse tracking-[0.3em]">ESTABLISHING_UPLINK...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-8 font-mono overflow-x-hidden">
      
      {/* HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start border-b border-blue-900/50 pb-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="bg-red-600 p-3 transform -skew-x-12"><Shield className="text-white fill-white" size={32} /></div>
          <div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tighter leading-none italic">{gameData?.teamName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Radio size={12} className={gameData.status === 'LIVE' ? "text-green-500 animate-pulse" : "text-slate-600"} />
              <p className="text-blue-500 text-[10px] tracking-[0.4em] font-bold uppercase">{gameData.status}_SIGNAL_v4.0</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-blue-500/20 p-3 px-6 rounded-sm text-center">
          <p className="text-[9px] text-slate-500 mb-1 font-bold">GAME CLOCK</p>
          <p className="text-2xl font-black">{gameData?.clock}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: SCORE Y ROSTER */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-gradient-to-b from-slate-900 to-black border border-blue-900/40 p-8 rounded-sm shadow-2xl text-center relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <div><p className="text-blue-500 font-black mb-1 italic text-sm">PATS</p><p className="text-8xl font-black tracking-tighter">{gameData.score.patriots}</p></div>
              <div className="text-slate-800 font-black text-2xl mx-2">VS</div>
              <div className="opacity-60">
                <p className="text-slate-500 font-black mb-1 italic text-sm">{gameData.score.oppName}</p><p className="text-8xl font-black tracking-tighter">{gameData.score.opponent}</p>
              </div>
            </div>
          </section>

          {/* GRÁFICA DE TENDENCIA */}
          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm shadow-inner">
             <div className="flex items-center gap-2 mb-4 text-blue-500">
                <ChartIcon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Score Trend</span>
             </div>
             <div className="h-[150px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={scoreHistory}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="time" hide />
                   <YAxis hide />
                   <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', fontSize: '10px' }} />
                   <Line type="monotone" dataKey="pats" stroke="#3b82f6" strokeWidth={3} dot={false} />
                   <Line type="monotone" dataKey="opp" stroke="#475569" strokeWidth={2} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </section>

          {/* ROSTER SELECTOR */}
          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm">
             <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Target Selector</span>
                <div className="flex gap-1">
                   <button onClick={() => setRosterTab('offense')} className={`text-[9px] px-2 py-1 ${rosterTab === 'offense' ? 'bg-blue-600' : 'bg-slate-800'}`}>OFF</button>
                   <button onClick={() => setRosterTab('defense')} className={`text-[9px] px-2 py-1 ${rosterTab === 'defense' ? 'bg-red-600' : 'bg-slate-800'}`}>DEF</button>
                </div>
             </div>
             <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-900">
               {gameData.roster[rosterTab].map((p: any, i: number) => (
                 <button 
                  key={i} 
                  onClick={() => setSelectedPlayer({ name: p.name, pos: p.pos })}
                  className={`w-full flex justify-between p-2 text-[10px] border-b border-slate-900 transition-all ${selectedPlayer.name === p.name ? 'bg-blue-900/40 border-l-4 border-l-blue-500 text-white' : 'text-slate-500 hover:bg-slate-900'}`}
                 >
                   <span className="font-black w-6">{p.pos}</span>
                   <span className="flex-1 text-left ml-4">{p.name}</span>
                   {selectedPlayer.name === p.name && <MousePointer2 size={10} className="text-blue-500 animate-pulse" />}
                 </button>
               ))}
             </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: DRIVE Y MONITOR */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-[#02080e] border border-blue-900/30 p-8 rounded-sm shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3"><TrendingUp className="text-blue-500" size={20} /><h2 className="text-xl font-black uppercase tracking-widest">Tactical Drive</h2></div>
              <div className="text-right border-r-4 border-blue-600 pr-6"><p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Win Prob</p><p className="text-4xl font-black">{gameData.winProb}%</p></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-8">
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase">Down</p><p className="text-2xl font-black italic">{gameData.down}</p></div>
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase">To Go</p><p className="text-2xl font-black text-yellow-400 italic">{gameData.distance}</p></div>
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase">Ball On</p><p className="text-2xl font-black italic">{gameData.yardLine}</p></div>
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase">Pos</p><p className="text-2xl font-black text-blue-400 italic">{gameData.possession}</p></div>
            </div>
            <TacticalField yardLine={gameData.yardLine} distance={gameData.distance} possession={gameData.possession} />
          </section>

          {/* MONITOR DINÁMICO DE JUGADOR */}
          <section className="bg-gradient-to-r from-slate-950 to-blue-950/20 border-t-4 border-red-600 p-8 shadow-2xl relative group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Target Monitoring:</p>
                <h3 className="text-4xl font-black text-white italic tracking-tighter">{gameData.playerMonitor.name} <span className="text-blue-500 text-lg ml-2">[{gameData.playerMonitor.pos}]</span></h3>
              </div>
              <div className="flex gap-12">
                <div className="text-center"><p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">{gameData.playerMonitor.label || "YARDS"}</p><p className="text-5xl font-black text-white tracking-tighter">{gameData.playerMonitor.yards}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">TOUCHDOWNS</p><p className="text-5xl font-black text-red-500 tracking-tighter">{gameData.playerMonitor.tds}</p></div>
                <div className="text-center"><p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">DETAILS</p><p className="text-xl font-black text-blue-400 mt-2">{gameData.playerMonitor.extra}</p></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}