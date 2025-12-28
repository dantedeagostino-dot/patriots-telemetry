'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Zap, Activity, CloudRain, Target, ListChecks, Stethoscope, Crosshair, Cpu, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis } from 'recharts';

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
    <div className="relative h-16 bg-[#0a141d] border border-blue-900/30 rounded overflow-hidden flex items-center mt-2">
      <div className="absolute left-0 w-[8%] h-full bg-blue-900/20 border-r border-blue-800/50 flex items-center justify-center text-blue-500/20 font-black rotate-90 text-[7px]">PATS</div>
      <div className="absolute right-0 w-[8%] h-full bg-red-900/10 border-l border-red-800/50 flex items-center justify-center text-red-500/20 font-black -rotate-90 text-[7px]">OPP</div>
      <div className="relative w-[84%] h-full ml-[8%] flex justify-between">
        {[...Array(10)].map((_, i) => <div key={i} className="h-full w-px bg-slate-800/30"></div>)}
        <div className="absolute top-0 h-full w-1 bg-blue-500 shadow-[0_0_10px_cyan] z-20" style={{ left: `${absoluteYardLine}%` }}></div>
        <div className="absolute top-0 h-full w-0.5 bg-yellow-400 opacity-50 z-10" style={{ left: `${firstDownLine}%` }}></div>
      </div>
    </div>
  );
};

export default function PatriotsDashboard() {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

    const now = new Date();
    const y = now.getFullYear().toString();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    try {
      const [bioRes, standRes, injRes, scoreRes] = await Promise.all([
        fetch(`https://nfl-api1.p.rapidapi.com/player-bio?playerId=${selectedPlayer.id}`, options),
        fetch(`https://nfl-api1.p.rapidapi.com/nflstandings?year=${y}`, options),
        fetch(`https://nfl-api1.p.rapidapi.com/team/injuries?teamId=22`, options),
        fetch(`https://nfl-api1.p.rapidapi.com/nflscoreboard?year=${y}&month=${m}&day=${d}`, options)
      ]);
      
      const bioData = await bioRes.json();
      const standData = await standRes.json();
      const injData = await injRes.json();
      const scoreData = await scoreRes.json();
      
      setPlayerBio(bioData?.data || bioData);
      setStandings(standData?.children?.[0]?.children?.[0]?.standings?.entries || []);
      // Corrección de mapeo para Injury Log según el documento
      setInjuries(injData?.data?.injuries || []);

      const patsEvent = scoreData?.events?.find((e: any) => 
        e.competitions[0].competitors.some((c: any) => c.team.abbreviation === 'NE')
      );

      if (patsEvent) {
        const comp = patsEvent.competitions[0];
        const patsTeam = comp.competitors.find((c: any) => c.team.abbreviation === 'NE');
        const prob = patsTeam.winProbability || 50;

        setWinProbHistory((prev: any) => {
          const newHistory = [...prev, { time: patsEvent.status.displayClock, prob: parseFloat(prob) }];
          return newHistory.slice(-25);
        });

        setGameData({
          isLive: patsEvent.status.type.state === 'in',
          status: patsEvent.status.type.detail,
          clock: patsEvent.status.displayClock,
          period: patsEvent.status.period,
          score: { patriots: patsTeam.score, opponent: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').score, oppName: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').team.abbreviation },
          situation: comp.situation || {},
          weather: patsEvent.weather,
          winProb: prob
        });
      }
    } catch (error) {
      console.error("Telemetry Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlayer.id]);

  useEffect(() => {
    fetchProData();
    const interval = setInterval(fetchProData, 15000);
    return () => clearInterval(interval);
  }, [fetchProData]);

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-blue-500 animate-pulse"><Cpu size={48} className="mb-4" />REBUILDING_INTERFACE_V3.2...</div>;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-6 font-mono overflow-x-hidden">
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-blue-900/50 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 transform -skew-x-12 shadow-[0_0_15px_red]"><Shield size={24} /></div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Patriots_Command_v3.2</h1>
            <div className="flex gap-3 text-[9px] font-bold">
               <span className={gameData?.isLive ? 'text-green-500 animate-pulse' : 'text-slate-500'}>● {gameData?.isLive ? 'LIVE_UPLINK' : 'UPLINK_STANDBY'}</span>
               <span className="text-blue-400 uppercase tracking-widest"><CloudRain size={10} className="inline mr-1"/> {gameData?.weather?.displayValue || 'Stable'}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-900/40 border border-blue-500/50 px-6 py-1 rounded-sm text-center">
          <p className="text-[10px] text-blue-300 font-bold uppercase">{gameData?.clock} - Period {gameData?.period}</p>
          <p className="text-xl font-black text-white tracking-widest uppercase">{gameData?.status || 'OFFLINE'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-3 space-y-4">
          <section className="bg-slate-950 border border-blue-900/30 p-5 rounded-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 opacity-20"><TrendingUp size={40}/></div>
            <div className="flex justify-between items-center text-center relative z-10">
               <div><p className="text-blue-500 text-[10px] font-black italic">NE</p><p className="text-6xl font-black">{gameData?.score?.patriots || 0}</p></div>
               <div className="text-slate-800 font-black italic">VS</div>
               <div><p className="text-slate-500 text-[10px] font-black italic">{gameData?.score?.oppName || 'NYJ'}</p><p className="text-6xl font-black">{gameData?.score?.opponent || 0}</p></div>
            </div>
            
            {/* WIN PROBABILITY CHART (ESTILO STOCK) */}
            <div className="mt-6 h-24 w-full bg-black/40 border border-slate-900 p-2 rounded-sm">
               <p className="text-[8px] text-blue-400 font-bold uppercase mb-1 flex justify-between">Win_Probability_History <span>{gameData?.winProb}%</span></p>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={winProbHistory.length > 0 ? winProbHistory : [{prob: 50}, {prob: 50}]}>
                    <defs><linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <Area type="monotone" dataKey="prob" stroke="#3b82f6" fillOpacity={1} fill="url(#colorP)" isAnimationActive={false} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
            <h3 className="text-[10px] font-black text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Crosshair size={12}/> Unit_Selection</h3>
            <div className="space-y-1">
              {PATS_ROSTER.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex justify-between p-2 text-[10px] transition-all ${selectedPlayer.id === p.id ? 'bg-blue-900/40 border-l-2 border-l-blue-500 text-white font-black' : 'text-slate-600 hover:bg-slate-900'}`}>
                  <span>{p.pos}</span><span className="italic uppercase">{p.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMNA CENTRAL: TACTICAL DRIVE */}
        <div className="lg:col-span-6">
          <section className="bg-[#020814] border border-blue-900/20 p-5 rounded-sm shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-2 text-blue-500 mb-4 border-b border-blue-900/30 pb-2">
              <Target size={18}/><h2 className="text-sm font-black uppercase italic">Tactical_Drive_Feed</h2>
            </div>
            <div className="flex-1 bg-black/40 p-4 italic text-xs border-l-4 border-blue-600 text-slate-300 leading-relaxed overflow-hidden">
                {gameData?.situation?.lastPlay?.text || "Scanning stadium telemetry... Awaiting next drive data."}
            </div>
            <TacticalField yardLine={gameData?.situation?.yardLine} distance={gameData?.situation?.distance} possession={gameData?.situation?.possession === "22" ? 'NE' : 'OPP'} />
          </section>
        </div>

        {/* COLUMNA DERECHA: INJURY LOG CORREGIDO */}
        <div className="lg:col-span-3">
          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm h-full flex flex-col shadow-xl">
            <div className="flex items-center gap-2 text-red-500 mb-4 border-b border-red-900/30 pb-2">
              <Stethoscope size={18} /><h2 className="text-sm font-black uppercase italic text-white leading-none">Injury_Log</h2>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {injuries.length > 0 ? injuries.map((inj: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[9px] border-b border-slate-900 pb-2">
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-bold uppercase">{inj?.athlete?.displayName || "Unknown Unit"}</span>
                    <span className="text-[8px] text-blue-500 font-bold">{inj?.athlete?.position?.abbreviation}</span>
                  </div>
                  <span className="text-red-500 font-black uppercase bg-red-900/20 px-1 rounded-sm">{inj?.status || 'OUT'}</span>
                </div>
              )) : <div className="text-[10px] text-slate-600 italic text-center mt-10">Medical Scanners Clear.</div>}
            </div>
          </section>
        </div>

        {/* FOOTER: BIOMETRIC FEED */}
        <div className="lg:col-span-12">
          <section className="bg-gradient-to-r from-slate-950 to-blue-950/20 border-t-2 border-red-600 p-5 shadow-2xl flex flex-col md:flex-row items-center gap-8">
             <div className="relative">
                <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${selectedPlayer.id}.png`} alt="Unit" className="w-24 h-24 rounded-full border-2 border-blue-600 bg-slate-900 object-cover shadow-[0_0_15px_cyan]" onError={(e:any) => e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png'} />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-black px-2 py-1 uppercase shadow-lg">ACTIVE_OBJ</div>
             </div>
             <div className="flex-1 text-center md:text-left text-white">
                <p className="text-[10px] text-slate-500 font-black uppercase italic mb-1 tracking-[0.3em]">Biometric_Feed:</p>
                <h3 className="text-4xl font-black italic uppercase leading-none mb-2">{playerBio?.displayName || selectedPlayer.name}</h3>
                <div className="flex justify-center md:justify-start gap-8 text-[10px] font-bold text-blue-400 uppercase">
                  <span>AGE: {playerBio?.age || '--'}</span>
                  <span>COLLEGE: {playerBio?.college?.name || '---'}</span>
                  <span>POS: {selectedPlayer.pos}</span>
                </div>
             </div>
             <div className="flex gap-10 border-l border-slate-800 pl-10">
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black italic">Weight</p>
                  <p className="text-3xl font-black text-white">{playerBio?.displayWeight || '--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black italic">Exp</p>
                  <p className="text-3xl font-black text-green-500 uppercase">{playerBio?.experience?.years || 'R'}</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}