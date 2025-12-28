'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Zap, Activity, CloudRain, Target, ListChecks, Stethoscope, Crosshair, Cpu } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const ScoreTrendChart = dynamic(() => import('./ScoreTrendChart'), { 
  ssr: false,
  loading: () => <div className="h-[100px] w-full bg-slate-900/20 animate-pulse rounded" />
});

const PATS_ROSTER = [
  { name: "Drake Maye", id: "4685721", pos: "QB" },
  { name: "R. Stevenson", id: "4242335", pos: "RB" },
  { name: "Ja'Lynn Polk", id: "4430839", pos: "WR" },
  { name: "Hunter Henry", id: "2976212", pos: "TE" },
  { name: "C. Gonzalez", id: "4426336", pos: "CB" }
];

// COMPONENTE: CAMPO TÁCTICO RESTAURADO
const TacticalField = ({ yardLine, distance, possession }: any) => {
  const [side, lineStr] = yardLine && typeof yardLine === 'string' ? yardLine.split(' ') : ['NE', '50'];
  const line = parseInt(lineStr) || 50;
  const absoluteYardLine = side === 'NE' ? line : 100 - line;
  const firstDownLine = absoluteYardLine + (possession === 'NE' ? distance : -distance);

  return (
    <div className="relative h-20 bg-[#0a141d] border border-blue-900/30 rounded overflow-hidden flex items-center mt-4">
      <div className="absolute left-0 w-[8%] h-full bg-blue-900/20 border-r border-blue-800/50 flex items-center justify-center text-blue-500/20 font-black rotate-90 text-[8px] tracking-[0.3em]">PATS</div>
      <div className="absolute right-0 w-[8%] h-full bg-red-900/10 border-l border-red-800/50 flex items-center justify-center text-red-500/20 font-black -rotate-90 text-[8px] tracking-[0.3em]">OPP</div>
      <div className="relative w-[84%] h-full ml-[8%] flex justify-between">
        {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((_, i) => <div key={i} className="h-full w-px bg-slate-800/40"></div>)}
        <div className="absolute top-0 h-full w-1 bg-blue-500 shadow-[0_0_15px_cyan] z-20" style={{ left: `${absoluteYardLine}%` }}></div>
        <div className="absolute top-0 h-full w-1 bg-yellow-400 opacity-60 z-10" style={{ left: `${firstDownLine}%` }}></div>
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

    // FECHA DINÁMICA PARA EL PARTIDO DE HOY (DEC 28, 2025)
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
        setGameData({ status: "OFFLINE", isLive: false, score: { patriots: "0", opponent: "0", oppName: "TBD" }, winProb: 50 });
      }
    } catch (error) {
      console.error("Telemetry Link Failure:", error);
    } finally {
      setLoading(false); // ESTO EVITA QUE SE QUEDE CARGANDO ETERNAMENTE
    }
  }, [selectedPlayer.id]);

  useEffect(() => {
    fetchProData();
    const interval = setInterval(fetchProData, 20000);
    return () => clearInterval(interval);
  }, [fetchProData]);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-blue-500 animate-pulse">
      <Cpu size={48} className="mb-4" />
      <p className="tracking-[0.3em] uppercase">Recalibrating_System_v3.1...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-6 font-mono overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-blue-900/50 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 transform -skew-x-12 shadow-[0_0_15px_red]"><Shield size={24} /></div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Patriots_Command_v3.1</h1>
            <div className="flex gap-3 text-[9px] font-bold">
               <span className={gameData?.isLive ? 'text-green-500 animate-pulse' : 'text-slate-500'}>● {gameData?.isLive ? 'LIVE_STREAM' : 'STANDBY'}</span>
               <span className="text-blue-400 uppercase tracking-widest"><CloudRain size={10} className="inline mr-1"/> {gameData?.weather?.displayValue || 'Stable'}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 px-6 py-1 rounded-sm">
          <p className="text-xl font-black text-blue-400 tracking-widest uppercase">{gameData?.status || 'OFFLINE'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LADO IZQUIERDO: MARCADOR Y SELECTOR */}
        <div className="lg:col-span-3 space-y-4">
          <section className="bg-slate-950 border border-blue-900/30 p-4 rounded-sm shadow-xl">
            <div className="flex justify-between items-center text-center">
               <div><p className="text-blue-500 text-[10px] font-black italic">NE_PATS</p><p className="text-6xl font-black">{gameData?.score?.patriots || 0}</p></div>
               <div className="text-slate-800 font-black italic">VS</div>
               <div><p className="text-slate-500 text-[10px] font-black italic">{gameData?.score?.oppName || 'NYJ'}</p><p className="text-6xl font-black">{gameData?.score?.opponent || 0}</p></div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-900 text-[9px] flex justify-between uppercase">
               <span className="text-blue-400 font-bold">Win_Prob:</span>
               <span className="text-white font-black">{gameData?.winProb?.toFixed(1)}%</span>
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

          <section className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
             <h3 className="text-[10px] font-black text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2"><ListChecks size={12}/> Standings</h3>
             <div className="space-y-2">
                {standings.slice(0, 4).map((team: any, i: number) => (
                  <div key={i} className={`flex justify-between text-[9px] border-b border-slate-900 pb-1 ${team?.team?.abbreviation === 'NE' ? 'text-blue-400' : 'text-slate-500'}`}>
                    <span className="font-bold">{team?.team?.abbreviation || '---'}</span>
                    <span>{team?.stats?.find((s:any)=>s.name==='wins')?.value || 0}-{team?.stats?.find((s:any)=>s.name==='losses')?.value || 0}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* CENTRO: TACTICAL DRIVE */}
        <div className="lg:col-span-6">
          <section className="bg-[#020814] border border-blue-900/20 p-5 rounded-sm shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-2 text-blue-500 mb-4 border-b border-blue-900/30 pb-2">
              <Target size={18}/><h2 className="text-sm font-black uppercase italic">Tactical_Drive_Feed</h2>
            </div>
            <div className="bg-black/40 p-4 italic text-xs border-l-4 border-blue-600 min-h-[60px] text-slate-300 leading-relaxed mb-4">
                {gameData?.situation?.lastPlay?.text || "Scanning stadium telemetry feed..."}
            </div>
            <TacticalField yardLine={gameData?.situation?.yardLine} distance={gameData?.situation?.distance} possession={gameData?.situation?.possession === "22" ? 'NE' : 'OPP'} />
          </section>
        </div>

        {/* DERECHA: INJURY REPORT */}
        <div className="lg:col-span-3">
          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm h-full">
            <div className="flex items-center gap-2 text-red-500 mb-4 border-b border-red-900/30 pb-2">
              <Stethoscope size={18} /><h2 className="text-sm font-black uppercase italic text-white leading-none">Injury_Log</h2>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[300px]">
              {injuries.length > 0 ? injuries.map((inj: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[9px] border-b border-slate-900 pb-1">
                  <span className="text-slate-300 font-bold truncate max-w-[100px]">{inj?.athlete?.displayName || 'Unit'}</span>
                  <span className="text-red-500 font-black uppercase">{inj?.status || 'OUT'}</span>
                </div>
              )) : <p className="text-[10px] text-slate-600 italic">Medical scan: GREEN.</p>}
            </div>
          </section>
        </div>

        {/* FOOTER: BIOMETRIC FEED */}
        <div className="lg:col-span-12">
          <section className="bg-gradient-to-r from-slate-950 to-blue-950/20 border-t-2 border-red-600 p-5 shadow-2xl flex flex-col md:flex-row items-center gap-6">
             <div className="relative">
                <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${selectedPlayer.id}.png`} alt="Unit" className="w-24 h-24 rounded-full border-2 border-blue-600 bg-slate-900 object-cover shadow-[0_0_15px_cyan]" onError={(e:any) => e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png'} />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-black px-2 py-1 uppercase shadow-lg">ACTIVE_OBJ</div>
             </div>
             <div className="flex-1 text-center md:text-left text-white">
                <p className="text-[10px] text-slate-500 font-black uppercase italic mb-1 tracking-[0.3em]">Biometric_Feed_Scanner:</p>
                <h3 className="text-4xl font-black italic uppercase leading-none mb-2">{playerBio?.displayName || selectedPlayer.name}</h3>
                <div className="flex justify-center md:justify-start gap-6 text-[10px] font-bold text-blue-400 uppercase">
                  <span>AGE: {playerBio?.age || '--'}</span>
                  <span>COLLEGE: {playerBio?.college?.name || '---'}</span>
                  <span>POS: {selectedPlayer.pos}</span>
                </div>
             </div>
             <div className="flex gap-8 border-l border-slate-800 pl-8">
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black italic">Weight</p>
                  <p className="text-3xl font-black text-white">{playerBio?.displayWeight || '--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black italic">Status</p>
                  <p className="text-3xl font-black text-green-500 uppercase">ACT</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}