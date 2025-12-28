'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Zap, Activity, CloudRain, Target, ListChecks, Crosshair, Cpu, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

const PATS_ROSTER = [
  { name: "Drake Maye", id: "4685721", pos: "QB" },
  { name: "R. Stevenson", id: "4242335", pos: "RB" },
  { name: "Ja'Lynn Polk", id: "4430839", pos: "WR" },
  { name: "Hunter Henry", id: "2976212", pos: "TE" },
  { name: "C. Gonzalez", id: "4426336", pos: "CB" }
];

const TacticalField = ({ yardLine, distance, possession }: any) => {
  const [side, lineStr] = yardLine && typeof yardLine === 'string' ? yardLine.split(' ') : ['NE', '50'];
  const line = parseInt(lineStr) || 50;
  const absoluteYardLine = side === 'NE' ? line : 100 - line;
  const firstDownLine = absoluteYardLine + (possession === 'NE' ? distance : -distance);

  return (
    <div className="relative h-16 bg-[#0a141d] border border-blue-900/30 rounded overflow-hidden flex items-center mt-4">
      <div className="absolute left-0 w-[8%] h-full bg-blue-900/20 border-r border-blue-800/50 flex items-center justify-center text-blue-500/20 font-black rotate-90 text-[7px]">PATS</div>
      <div className="absolute right-0 w-[8%] h-full bg-red-900/10 border-l border-red-800/50 flex items-center justify-center text-red-500/20 font-black -rotate-90 text-[7px]">OPP</div>
      <div className="relative w-[84%] h-full ml-[8%] flex justify-between px-2">
        {[...Array(10)].map((_, i) => <div key={i} className="h-full w-px bg-slate-800/30"></div>)}
        <div className="absolute top-0 h-full w-1 bg-blue-500 shadow-[0_0_15px_cyan] z-20 transition-all duration-1000" style={{ left: `${absoluteYardLine}%` }}></div>
        <div className="absolute top-0 h-full w-0.5 bg-yellow-400 opacity-50 z-10" style={{ left: `${firstDownLine}%` }}></div>
      </div>
    </div>
  );
};

export default function PatriotsDashboard() {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [winProbHistory, setWinProbHistory] = useState<any>([]);
  const [selectedPlayer, setSelectedPlayer] = useState(PATS_ROSTER[0]);
  const [playerBio, setPlayerBio] = useState<any>(null);

  const fetchGameData = useCallback(async () => {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'nfl-api1.p.rapidapi.com'
      }
    };

    const now = new Date();
    const y = now.getFullYear().toString();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    try {
      const scoreRes = await fetch(`https://nfl-api1.p.rapidapi.com/nflscoreboard?year=${y}&month=${m}&day=${d}`, options);
      const scoreData = await scoreRes.json();
      
      const patsEvent = scoreData?.events?.find((e: any) => 
        e.competitions[0].competitors.some((c: any) => c.team.abbreviation === 'NE')
      );

      if (patsEvent) {
        const gameId = patsEvent.id;
        const comp = patsEvent.competitions[0];
        const patsTeam = comp.competitors.find((c: any) => c.team.abbreviation === 'NE');
        // Capturar probabilidad real (algunas APIs la envían como decimal 0.75, otras como 75)
        let prob = patsTeam.winProbability || 50;
        if (prob < 1 && prob > 0) prob = prob * 100;

        setWinProbHistory((prev: any) => {
          const timestamp = patsEvent.status.displayClock;
          if (prev.length > 0 && prev[prev.length - 1].time === timestamp) return prev;
          return [...prev.slice(-40), { time: timestamp, prob: parseFloat(prob.toFixed(1)) }];
        });

        setGameData({
          isLive: patsEvent.status.type.state === 'in',
          status: patsEvent.status.type.detail,
          clock: patsEvent.status.displayClock,
          period: patsEvent.status.period,
          score: { patriots: patsTeam.score, opponent: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').score, oppName: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').team.abbreviation },
          situation: comp.situation || {},
          weather: patsEvent.weather,
          winProb: prob.toFixed(1)
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchPlayerBio = useCallback(async () => {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'nfl-api1.p.rapidapi.com'
      }
    };
    try {
      const res = await fetch(`https://nfl-api1.p.rapidapi.com/player-bio?playerId=${selectedPlayer.id}`, options);
      const data = await res.json();
      setPlayerBio(data?.data || data);
    } catch (e) { console.error(e); }
  }, [selectedPlayer.id]);

  useEffect(() => {
    fetchGameData().then(() => setLoading(false));
    const interval = setInterval(fetchGameData, 15000);
    return () => clearInterval(interval);
  }, [fetchGameData]);

  useEffect(() => {
    fetchPlayerBio();
  }, [fetchPlayerBio]);

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-blue-500 animate-pulse"><Cpu size={48} className="mb-4" />OPTIMIZING_COMMAND_CENTER_V3.3...</div>;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-6 font-mono overflow-x-hidden">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-blue-900/50 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 transform -skew-x-12 shadow-[0_0_15px_red]"><Shield size={24} /></div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Patriots_Command_v3.3</h1>
            <div className="flex gap-3 text-[9px] font-bold">
               <span className={gameData?.isLive ? 'text-green-500 animate-pulse' : 'text-slate-500'}>● {gameData?.isLive ? 'LIVE_UPLINK' : 'UPLINK_STANDBY'}</span>
               <span className="text-blue-400 uppercase tracking-widest"><CloudRain size={10} className="inline mr-1"/> {gameData?.weather?.displayValue || 'Stable'}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-900/40 border border-blue-500/50 px-6 py-1 rounded-sm text-center">
          <p className="text-[10px] text-blue-300 font-bold uppercase">{gameData?.clock} - Q{gameData?.period}</p>
          <p className="text-xl font-black text-white tracking-widest uppercase">{gameData?.status || 'OFFLINE'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: SCORE & STOCK CHART */}
        <div className="lg:col-span-4 space-y-4">
          <section className="bg-slate-950 border border-blue-900/30 p-6 rounded-sm shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center text-center relative z-10">
               <div><p className="text-blue-500 text-xs font-black italic">NE_PATS</p><p className="text-7xl font-black">{gameData?.score?.patriots || 0}</p></div>
               <div className="text-slate-800 font-black italic text-2xl">VS</div>
               <div><p className="text-slate-500 text-xs font-black italic">{gameData?.score?.oppName || 'NYJ'}</p><p className="text-7xl font-black">{gameData?.score?.opponent || 0}</p></div>
            </div>
            
            {/* WIN PROBABILITY STOCK CHART */}
            <div className="mt-8 h-40 w-full bg-black/60 border border-slate-900 p-4 rounded-sm relative">
               <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-blue-400 font-black uppercase flex items-center gap-2"><TrendingUp size={14}/> Win_Probability_Stock</p>
                  <span className="text-xs font-black text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-[0_0_10px_blue]">{gameData?.winProb}%</span>
               </div>
               <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={winProbHistory.length > 0 ? winProbHistory : [{prob: 50}, {prob: 50}]}>
                    <defs>
                      <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #1e293b', fontSize: '10px'}} />
                    <Area type="stepAfter" dataKey="prob" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" isAnimationActive={false} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </section>

          {/* UNIT SELECTOR */}
          <section className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
            <h3 className="text-[10px] font-black text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Crosshair size={12}/> Unit_Selection_Scanner</h3>
            <div className="grid grid-cols-1 gap-1">
              {PATS_ROSTER.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex justify-between p-3 text-[10px] transition-all border-b border-slate-900 ${selectedPlayer.id === p.id ? 'bg-blue-900/30 border-l-4 border-l-blue-500 text-white font-black' : 'text-slate-500 hover:bg-slate-900'}`}>
                  <span className="opacity-50">{p.pos}</span><span className="italic uppercase tracking-wider">{p.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: TACTICAL DRIVE (EXPANDIDA) */}
        <div className="lg:col-span-8">
          <section className="bg-[#020814] border border-blue-900/20 p-8 rounded-sm shadow-2xl h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30 animate-pulse"></div>
            <div className="flex items-center justify-between mb-6 border-b border-blue-900/30 pb-4">
              <div className="flex items-center gap-3 text-blue-500">
                <Target size={24}/><h2 className="text-xl font-black uppercase italic tracking-widest text-white">Tactical_Drive_Feed</h2>
              </div>
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase"><Activity size={12} className="text-green-500 animate-pulse"/> Tracking_Active</div>
            </div>
            <div className="flex-1 flex flex-col justify-center bg-black/40 p-8 rounded-sm border border-slate-900 mb-6">
                <p className="text-xl italic text-slate-200 leading-relaxed text-center font-medium">
                  "{gameData?.situation?.lastPlay?.text || "Scanning stadium telemetry... Awaiting next drive data in current sector."}"
                </p>
                <div className="mt-8 flex justify-center gap-12 text-[11px] font-black uppercase text-blue-400 tracking-tighter">
                   <div className="text-center"><p className="text-slate-600 mb-1">Down</p><p className="text-2xl text-white">{gameData?.situation?.down || '-'}</p></div>
                   <div className="text-center"><p className="text-slate-600 mb-1">To_Go</p><p className="text-2xl text-white">{gameData?.situation?.distance || '-'}</p></div>
                   <div className="text-center"><p className="text-slate-600 mb-1">Ball_On</p><p className="text-2xl text-white">{gameData?.situation?.yardLine || '-'}</p></div>
                </div>
            </div>
            <TacticalField yardLine={gameData?.situation?.yardLine} distance={gameData?.situation?.distance} possession={gameData?.situation?.possession === "22" ? 'NE' : 'OPP'} />
          </section>
        </div>

        {/* FOOTER: BIOMETRIC FEED */}
        <div className="lg:col-span-12 mt-4">
          <section className="bg-gradient-to-r from-slate-950 to-blue-950/20 border-t-2 border-red-600 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-10">
             <div className="relative">
                <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${selectedPlayer.id}.png`} alt="Unit" className="w-28 h-28 rounded-full border-2 border-blue-600 bg-slate-900 object-cover shadow-[0_0_20px_rgba(59,130,246,0.5)]" onError={(e:any) => e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png'} />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[9px] font-black px-2 py-1 uppercase shadow-lg tracking-widest">ACTIVE_OBJ</div>
             </div>
             <div className="flex-1 text-center md:text-left text-white">
                <p className="text-[11px] text-slate-500 font-black uppercase italic mb-1 tracking-[0.4em]">Biometric_Feed_Scanner:</p>
                <h3 className="text-5xl font-black italic uppercase leading-none mb-3 tracking-tighter">{playerBio?.displayName || selectedPlayer.name}</h3>
                <div className="flex justify-center md:justify-start gap-10 text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                  <span>AGE: {playerBio?.age || '--'}</span>
                  <span>POS: {selectedPlayer.pos}</span>
                  <span>COLLEGE: {playerBio?.college?.name || '---'}</span>
                </div>
             </div>
             <div className="flex gap-12 border-l border-slate-800 pl-12">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black italic mb-1">Weight</p>
                  <p className="text-4xl font-black text-white">{playerBio?.displayWeight || '--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black italic mb-1">Status</p>
                  <p className="text-4xl font-black text-green-500 uppercase">ACT</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}