'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Zap, Activity, CloudRain, Target, ListChecks, Stethoscope, Crosshair, Cpu } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const PATS_ROSTER = [
  { name: "Drake Maye", id: "4685721", pos: "QB" },
  { name: "R. Stevenson", id: "4242335", pos: "RB" },
  { name: "Ja'Lynn Polk", id: "4430839", pos: "WR" },
  { name: "Hunter Henry", id: "2976212", pos: "TE" },
  { name: "C. Gonzalez", id: "4426336", pos: "CB" }
];

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
      // LLAMADAS SEGÚN API OVERVIEW.DOCX
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
      setInjuries(injData?.data?.injuries || []);

      const patsEvent = scoreData?.events?.find((e: any) => 
        e.competitions[0].competitors.some((c: any) => c.team.abbreviation === 'NE')
      );

      if (patsEvent) {
        const comp = patsEvent.competitions[0];
        const patsTeam = comp.competitors.find((c: any) => c.team.abbreviation === 'NE');
        const oppTeam = comp.competitors.find((c: any) => c.team.abbreviation !== 'NE');
        const prob = patsTeam.winProbability || 50;

        setWinProbHistory((prev: any) => [...prev.slice(-20), { time: patsEvent.status.displayClock, prob }]);

        setGameData({
          isLive: patsEvent.status.type.state === 'in',
          status: patsEvent.status.type.detail,
          score: { patriots: patsTeam.score, opponent: oppTeam.score, oppName: oppTeam.team.abbreviation },
          situation: comp.situation || {},
          weather: patsEvent.weather,
          winProb: prob
        });
      } else {
        setGameData({ status: "STANDBY", isLive: false, score: { patriots: "0", opponent: "0", oppName: "TBD" }, winProb: 50 });
      }
    } catch (error) {
      console.error("Uplink Error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlayer.id]);

  useEffect(() => {
    fetchProData();
    const interval = setInterval(fetchProData, 20000);
    return () => clearInterval(interval);
  }, [fetchProData]);

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-blue-500 animate-pulse"><Cpu size={48} className="mb-4" />SCANNING_NFL_NETWORK...</div>;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-8 font-mono overflow-x-hidden">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-blue-900/50 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-5">
          <div className="bg-red-600 p-3 transform -skew-x-12 shadow-[0_0_15px_red]"><Shield size={32} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">Patriots_Command_v3.0</h1>
            <div className="flex gap-4 mt-2 text-[10px] font-bold">
               <span className={gameData?.isLive ? 'text-green-500 animate-pulse' : 'text-slate-600'}>● {gameData?.isLive ? 'LIVE_STREAM' : 'UPLINK_STANDBY'}</span>
               <span className="text-blue-400 uppercase tracking-widest"><CloudRain size={12} className="inline mr-1"/> {gameData?.weather?.displayValue || 'Stable'}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 p-3 px-8 rounded-sm">
          <p className="text-2xl font-black text-blue-400 tracking-widest uppercase">{gameData?.status || 'OFFLINE'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-950 border border-blue-900/30 p-6 rounded-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <div className="text-center text-white">
                 <p className="text-blue-500 text-xs font-black">NE</p>
                 <p className="text-7xl font-black">{gameData?.score?.patriots}</p>
               </div>
               <div className="text-slate-800 font-black text-xl italic text-center">VS</div>
               <div className="text-center opacity-60 text-white">
                 <p className="text-slate-500 text-xs font-black">{gameData?.score?.oppName}</p>
                 <p className="text-7xl font-black">{gameData?.score?.opponent}</p>
               </div>
            </div>
            <div className="bg-black/50 p-4 border border-slate-900 rounded-sm">
              <p className="text-[9px] text-blue-500 font-black uppercase mb-2 flex justify-between italic">Win_Prob <span>{gameData?.winProb?.toFixed(1)}%</span></p>
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
            <h3 className="text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-2"><Crosshair size={14}/> Unit_Selection</h3>
            <div className="space-y-1">
              {PATS_ROSTER.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex justify-between p-2 text-[10px] border-b border-slate-900 transition-all ${selectedPlayer.id === p.id ? 'bg-blue-900/40 border-l-4 border-l-blue-500 text-white font-black' : 'text-slate-500 hover:bg-slate-900'}`}>
                  <span>{p.pos}</span><span className="italic uppercase">{p.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm shadow-xl">
             <h3 className="text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-2"><ListChecks size={14}/> Division_Standings</h3>
             <div className="space-y-2">
                {standings.map((team: any, i: number) => (
                  <div key={i} className={`flex justify-between text-[10px] p-2 border-l-2 ${team?.team?.abbreviation === 'NE' ? 'bg-blue-900/20 border-blue-500' : 'bg-white/5 border-slate-800'}`}>
                    <span className="font-bold text-slate-300 uppercase">{team?.team?.displayName || 'TBD'}</span>
                    <span className="text-white font-black">{team?.stats?.find((s:any)=>s.name==='wins')?.value || 0}-{team?.stats?.find((s:any)=>s.name==='losses')?.value || 0}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-[#020814] border border-blue-900/20 p-6 rounded-sm shadow-2xl">
              <h2 className="text-lg font-black uppercase italic text-white mb-4 flex items-center gap-2 text-blue-500"><Target /> Tactical_Drive</h2>
              <div className="bg-black/40 p-4 italic text-[11px] border-l-4 border-blue-600 min-h-[80px] text-slate-300 leading-relaxed">
                {gameData?.situation?.lastPlay?.text || "Scanning stadium telemetry feed..."}
              </div>
            </section>

            <section className="bg-slate-950 border border-slate-800 p-6 rounded-sm">
              <h2 className="text-lg font-black uppercase italic text-white mb-4 flex items-center gap-2 text-red-500"><Stethoscope size={18} /> Injury_Report</h2>
              <div className="space-y-2">
                {injuries.length > 0 ? injuries.map((inj: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px] border-b border-slate-900 pb-2 text-white">
                    <span className="text-slate-300 font-bold">{inj?.athlete?.displayName}</span>
                    <span className="text-red-500 font-black uppercase">{inj?.status}</span>
                  </div>
                )) : <p className="text-[10px] text-slate-600 italic uppercase">All units active. No injuries reported.</p>}
              </div>
            </section>
          </div>

          <section className="bg-gradient-to-r from-slate-950 to-blue-950/20 border-t-2 border-red-600 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-8 text-white">
             <div className="relative">
                <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${selectedPlayer.id}.png`} alt="Unit" className="w-28 h-28 rounded-full border-2 border-blue-600 bg-slate-900 object-cover shadow-[0_0_15px_cyan]" onError={(e:any) => e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png'} />
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-[8px] font-black px-2 py-1 uppercase shadow-lg">ACTIVE_OBJ</div>
             </div>
             <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase italic mb-1 tracking-[0.3em]">Biometric_Feed:</p>
                <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-2">{playerBio?.displayName || selectedPlayer.name}</h3>
                <div className="flex gap-4 text-[10px] font-bold text-blue-400 uppercase">
                  <span>AGE: {playerBio?.age || '--'}</span>
                  <span>COLLEGE: {playerBio?.college?.name || '---'}</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 border-l border-slate-800 pl-8">
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black">Weight</p>
                  <p className="text-2xl font-black text-white">{playerBio?.displayWeight || '--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black">Exp</p>
                  <p className="text-2xl font-black text-green-500 uppercase">{playerBio?.experience?.years || 'R'}</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}