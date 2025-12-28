'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Zap, Activity, CloudRain, Target, Crosshair, Cpu, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid, Label } from 'recharts';

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
  const [selectedPlayer, setSelectedPlayer] = useState(PATS_ROSTER[0]);
  const [playerBio, setPlayerBio] = useState<any>(null);
  
  // Referencia para mantener el historial vivo sin importar los cambios de UI
  const historyRef = useRef<any>([]);

  const fetchGameData = useCallback(async () => {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'nfl-api1.p.rapidapi.com'
      }
    };

    // Fecha dinámica para el partido actual (Dec 28, 2025)
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
        const comp = patsEvent.competitions[0];
        const patsTeam = comp.competitors.find((c: any) => c.team.abbreviation === 'NE');
        const oppTeam = comp.competitors.find((c: any) => c.team.abbreviation !== 'NE');
        
        // LÓGICA DE PROBABILIDAD REAL + HEURÍSTICA
        let prob = patsTeam.winProbability || 50;
        if (prob < 1 && prob > 0) prob = prob * 100;
        
        // Si la API dice 50% pero vamos ganando 28-3, forzamos la tendencia visual
        const scoreDiff = parseInt(patsTeam.score) - parseInt(oppTeam.score);
        if (prob === 50 && scoreDiff !== 0) {
            prob = 50 + (scoreDiff * 1.8);
            if (prob > 99) prob = 99.7;
            if (prob < 1) prob = 0.3;
        }

        const timestamp = patsEvent.status.displayClock;
        
        // Solo añadimos punto si el reloj avanzó
        if (historyRef.current.length === 0 || historyRef.current[historyRef.current.length - 1].time !== timestamp) {
          const newPoint = { time: timestamp, prob: parseFloat(prob.toFixed(1)) };
          historyRef.current = [...historyRef.current.slice(-40), newPoint];
          setWinProbHistory([...historyRef.current]);
        }

        setGameData({
          isLive: patsEvent.status.type.state === 'in',
          status: patsEvent.status.type.detail,
          clock: timestamp,
          period: patsEvent.status.period,
          score: { patriots: patsTeam.score, opponent: oppTeam.score, oppName: oppTeam.team.abbreviation },
          situation: comp.situation || {},
          weather: patsEvent.weather,
          winProb: prob.toFixed(1)
        });
      }
    } catch (e) { console.error("Scoreboard Link Failure", e); }
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
    } catch (e) { console.error("Bio Link Failure", e); }
  }, [selectedPlayer.id]);

  useEffect(() => {
    fetchGameData().then(() => setLoading(false));
    const interval = setInterval(fetchGameData, 15000);
    return () => clearInterval(interval);
  }, [fetchGameData]);

  useEffect(() => {
    fetchPlayerBio();
  }, [fetchPlayerBio]);

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-blue-500 animate-pulse"><Cpu size={48} className="mb-4" />FINALIZING_SYSTEM_V3.5...</div>;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-6 font-mono overflow-x-hidden">
      {/* CABECERA */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-blue-900/50 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 transform -skew-x-12 shadow-[0_0_15px_red]"><Shield size={24} /></div>
          <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">Patriots_Command_v3.5</h1>
            <div className="flex gap-3 text-[9px] font-bold">
               <span className={gameData?.isLive ? 'text-green-500 animate-pulse' : 'text-slate-500'}>● {gameData?.isLive ? 'LIVE_UPLINK' : 'UPLINK_STANDBY'}</span>
               <span className="text-blue-400 uppercase tracking-widest"><CloudRain size={10} className="inline mr-1"/> {gameData?.weather?.displayValue || 'Stable'}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-900/40 border border-blue-500/50 px-6 py-2 rounded-sm text-center">
          <p className="text-[10px] text-blue-300 font-bold uppercase">{gameData?.clock} - Q{gameData?.period}</p>
          <p className="text-xl font-black text-white tracking-widest uppercase">{gameData?.status || 'OFFLINE'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LADO IZQUIERDO: SCORE & STOCK CHART */}
        <div className="lg:col-span-4 space-y-4">
          <section className="bg-slate-950 border border-blue-900/30 p-6 rounded-sm shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center text-center mb-8">
               <div><p className="text-blue-500 text-xs font-black italic">NE_PATS</p><p className="text-7xl font-black">{gameData?.score?.patriots || 0}</p></div>
               <div className="text-slate-800 font-black italic text-2xl">VS</div>
               <div><p className="text-slate-500 text-xs font-black italic">{gameData?.score?.oppName || 'NYJ'}</p><p className="text-7xl font-black">{gameData?.score?.opponent || 0}</p></div>
            </div>
            
            {/* GRÁFICO ESTILO STOCK (BASADO EN DIBUJO) */}
            <div className="h-56 w-full bg-black/60 border border-slate-900 p-4 rounded-sm relative">
               <div className="flex justify-between items-center mb-6">
                  <p className="text-[10px] text-blue-400 font-black uppercase flex items-center gap-2 tracking-widest"><TrendingUp size={14}/> Win_Prob_Stock</p>
                  <span className="text-xs font-black text-white bg-blue-600 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse">{gameData?.winProb}%</span>
               </div>
               <ResponsiveContainer width="100%" height="70%">
                  <LineChart data={winProbHistory.length > 0 ? winProbHistory : [{time: '15:00', prob: 50}, {time: '14:59', prob: 50}]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #3b82f6', fontSize: '9px'}} />
                    <Line 
                      type="monotone" 
                      dataKey="prob" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ r: 3, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
               </ResponsiveContainer>
               <div className="flex justify-between mt-2 border-t border-slate-900 pt-1">
                  <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Time_Match</p>
                  <p className="text-[8px] text-slate-500 font-black italic">%_Probability</p>
               </div>
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
            <h3 className="text-[10px] font-black text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Crosshair size={12}/> Target_Selection</h3>
            <div className="grid grid-cols-1 gap-1">
              {PATS_ROSTER.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex justify-between p-3 text-[10px] transition-all border-b border-slate-900 ${selectedPlayer.id === p.id ? 'bg-blue-900/30 border-l-4 border-l-blue-500 text-white font-black' : 'text-slate-500 hover:bg-slate-900'}`}>
                  <span className="opacity-50 font-bold">{p.pos}</span><span className="italic uppercase tracking-wider">{p.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* LADO DERECHO: TACTICAL DRIVE EXPANDIDA */}
        <div className="lg:col-span-8">
          <section className="bg-[#020814] border border-blue-900/20 p-8 rounded-sm shadow-2xl h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40 animate-pulse"></div>
            <div className="flex items-center gap-3 text-blue-500 mb-8 border-b border-blue-900/30 pb-4">
              <Target size={24}/><h2 className="text-xl font-black uppercase italic tracking-widest text-white">Tactical_Drive_Feed</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center bg-black/40 p-10 rounded-sm border border-slate-900 mb-6">
                <p className="text-2xl italic text-slate-100 leading-relaxed text-center font-bold tracking-tight mb-10">
                  "{gameData?.situation?.lastPlay?.text || "Scanning stadium telemetry... No drive data detected."}"
                </p>
                <div className="grid grid-cols-3 gap-12 text-center">
                   <div><p className="text-[10px] text-slate-600 mb-2 font-black uppercase">Down</p><p className="text-5xl text-white font-black">{gameData?.situation?.down || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-600 mb-2 font-black uppercase">To_Go</p><p className="text-5xl text-white font-black">{gameData?.situation?.distance || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-600 mb-2 font-black uppercase">Ball_On</p><p className="text-5xl text-white font-black">{gameData?.situation?.yardLine || '-'}</p></div>
                </div>
            </div>
          </section>
        </div>

        {/* PIE DE PÁGINA: BIOMETRIC FEED */}
        <div className="lg:col-span-12">
          <section className="bg-gradient-to-r from-slate-950 to-blue-950/30 border-t-2 border-red-600 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-12 text-white">
             <div className="relative">
                <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${selectedPlayer.id}.png`} alt="Unit" className="w-28 h-28 rounded-full border-2 border-blue-600 bg-slate-900 object-cover shadow-[0_0_25px_rgba(59,130,246,0.5)]" onError={(e:any) => e.target.src = 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png'} />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[9px] font-black px-2 py-1 uppercase shadow-lg tracking-widest">ACTIVE_OBJ</div>
             </div>
             <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase italic mb-1 tracking-[0.4em]">Biometric_Feed_Scanner:</p>
                <h3 className="text-5xl font-black italic uppercase leading-none mb-4 tracking-tighter">{playerBio?.displayName || selectedPlayer.name}</h3>
                <div className="flex justify-center md:justify-start gap-12 text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                  <span>AGE: {playerBio?.age || '--'}</span>
                  <span>POS: {selectedPlayer.pos}</span>
                  <span>COLLEGE: {playerBio?.college?.name || '---'}</span>
                </div>
             </div>
             <div className="flex gap-12 border-l border-slate-800 pl-12">
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black italic mb-1 tracking-widest">Weight</p>
                  <p className="text-4xl font-black text-white">{playerBio?.displayWeight || '--'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black italic mb-1 tracking-widest">Status</p>
                  <p className="text-4xl font-black text-green-500 uppercase">ACT</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}