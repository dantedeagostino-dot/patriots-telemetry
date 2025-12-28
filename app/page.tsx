'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Zap, Activity, CloudRain, Target, Crosshair, Cpu, TrendingUp, List, Trophy, Newspaper } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid } from 'recharts';

// Imagen de un campo de la NFL visto desde arriba (Top-Down View)
const NFL_FIELD_TOP_DOWN = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop";

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
  const [scoringPlays, setScoringPlays] = useState<any>([]);
  const [teamLeaders, setTeamLeaders] = useState<any>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [nflNews, setNflNews] = useState<any>([]);

  const historyRef = useRef<any>([]);

  const fetchIntel = useCallback(async () => {
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
        const oppTeam = comp.competitors.find((c: any) => c.team.abbreviation !== 'NE');

        const [scoringRes, leaderRes, predRes, newsRes] = await Promise.all([
          fetch(`https://nfl-api1.p.rapidapi.com/game/soringplays?eventId=${gameId}`, options),
          fetch(`https://nfl-api1.p.rapidapi.com/team/leaders?teamId=22&limit=3&season=${y}`, options),
          fetch(`https://nfl-api1.p.rapidapi.com/game/predictions?eventId=${gameId}`, options),
          fetch(`https://nfl-api1.p.rapidapi.com/nfl-news`, options)
        ]);

        const sData = await scoringRes.json();
        const lData = await leaderRes.json();
        const pData = await predRes.json();
        const nData = await newsRes.json();

        setScoringPlays(sData?.scoringPlays || []);
        setTeamLeaders(lData?.data || []);
        setPredictions(pData);
        setNflNews(nData?.articles?.slice(0, 5) || []);

        let prob = patsTeam.winProbability || 50;
        if (prob < 1 && prob > 0) prob = prob * 100;
        const scoreDiff = parseInt(patsTeam.score) - parseInt(oppTeam.score);
        if (prob === 50 && scoreDiff !== 0) prob = 50 + (scoreDiff * 2);

        const timestamp = patsEvent.status.displayClock;
        if (historyRef.current.length === 0 || historyRef.current[historyRef.current.length - 1].time !== timestamp) {
          historyRef.current = [...historyRef.current.slice(-30), { time: timestamp, prob: parseFloat(prob.toFixed(1)) }];
          setWinProbHistory([...historyRef.current]);
        }

        setGameData({
          status: patsEvent.status.type.detail,
          clock: timestamp,
          period: patsEvent.status.period,
          score: { patriots: patsTeam.score, opponent: oppTeam.score, oppName: oppTeam.team.abbreviation },
          situation: comp.situation || {},
          winProb: prob.toFixed(1)
        });
      }
    } catch (e) { console.error("Intel Link Failure", e); }
  }, []);

  const fetchBio = useCallback(async () => {
    const options = {
      method: 'GET',
      headers: { 'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '', 'x-rapidapi-host': 'nfl-api1.p.rapidapi.com' }
    };
    try {
      const res = await fetch(`https://nfl-api1.p.rapidapi.com/player-bio?playerId=${selectedPlayer.id}`, options);
      const data = await res.json();
      setPlayerBio(data?.data || data);
    } catch (e) { console.error(e); }
  }, [selectedPlayer.id]);

  useEffect(() => {
    fetchIntel().then(() => setLoading(false));
    const interval = setInterval(fetchIntel, 20000);
    return () => clearInterval(interval);
  }, [fetchIntel]);

  useEffect(() => { fetchBio(); }, [fetchBio]);

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-blue-500 animate-pulse font-mono"><Cpu size={64} className="mb-4" />CONFIGURING_FIELD_VIEW_v3.8...</div>;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-6 font-mono overflow-x-hidden">
      {/* NEWS TICKER */}
      <div className="bg-blue-600/10 border border-blue-500/20 mb-4 overflow-hidden py-1">
        <div className="animate-marquee whitespace-nowrap flex gap-10 items-center">
          {nflNews.map((news: any, i: number) => (
            <span key={i} className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2">
              <Newspaper size={12}/> {news.headline || news.description}
            </span>
          ))}
        </div>
      </div>

      <header className="flex justify-between items-center border-b border-blue-900/50 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 transform -skew-x-12 shadow-[0_0_15px_red]"><Shield size={24} /></div>
          <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter">Patriots_Command_v3.8</h1>
        </div>
        <div className="bg-blue-950/60 border border-blue-500/50 px-8 py-2 text-center">
          <p className="text-[10px] text-blue-300 font-bold uppercase">{gameData?.clock} - Q{gameData?.period}</p>
          <p className="text-2xl font-black text-white uppercase tracking-[0.2em]">{gameData?.status || 'OFFLINE'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SCORE & FIELD CHART */}
        <div className="lg:col-span-4 space-y-4">
          <section className="bg-slate-950 border border-blue-900/30 p-6 shadow-2xl">
            <div className="flex justify-between items-center text-center mb-8">
               <div><p className="text-blue-500 text-xs font-black">NE_PATS</p><p className="text-7xl font-black">{gameData?.score?.patriots}</p></div>
               <div className="text-slate-800 font-black italic text-3xl">VS</div>
               <div><p className="text-slate-500 text-xs font-black">{gameData?.score?.oppName}</p><p className="text-7xl font-black">{gameData?.score?.opponent}</p></div>
            </div>
            
            {/* CUADRO DE PROBABILIDAD CON FONDO DE CAMPO CENITAL */}
            <div 
              className="h-56 w-full border border-blue-500/30 relative overflow-hidden rounded-sm" 
              style={{
                backgroundImage: `url('${NFL_FIELD_TOP_DOWN}')`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
               {/* Overlay más claro (50%) para que se vea el campo */}
               <div className="absolute inset-0 bg-black/50 p-4 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] text-white font-black uppercase flex items-center gap-2 drop-shadow-lg">
                      <TrendingUp size={14} className="text-blue-400"/> Win_Probability_Stock
                    </p>
                    <span className="text-xs font-black text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-[0_0_10px_blue]">{gameData?.winProb}%</span>
                 </div>
                 <div className="flex-1 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={winProbHistory}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip contentStyle={{backgroundColor: 'rgba(0,13,22,0.9)', border: '1px solid #3b82f6', color: '#fff'}} />
                        <Line 
                          type="monotone" 
                          dataKey="prob" 
                          stroke="#fff" 
                          strokeWidth={4} 
                          dot={{r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2}} 
                          isAnimationActive={false} 
                        />
                      </LineChart>
                   </ResponsiveContainer>
                 </div>
                 <p className="text-[8px] text-white/70 uppercase text-center mt-2 font-bold tracking-widest">AERIAL_FIELD_TELEMETRY</p>
               </div>
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5">
            <h3 className="text-[10px] font-black text-blue-400 mb-4 uppercase flex items-center gap-2"><List size={14}/> Scoring_Timeline</h3>
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {scoringPlays.map((play: any, i: number) => (
                <div key={i} className="text-[10px] border-l-2 border-blue-600 pl-3 py-1 bg-white/5">
                  <p className="font-black text-white uppercase">{play.text}</p>
                  <p className="text-slate-500 italic">Score: {play.awayScore} - {play.homeScore}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* TACTICAL DRIVE & LEADERS */}
        <div className="lg:col-span-5 space-y-4">
          <section className="bg-[#020814] border border-blue-900/20 p-8 shadow-2xl h-[400px] flex flex-col justify-center">
            <div className="flex items-center gap-3 text-blue-500 mb-6 border-b border-blue-900/30 pb-4">
              <Target size={24}/><h2 className="text-xl font-black uppercase italic text-white">Tactical_Drive_Feed</h2>
            </div>
            <p className="text-2xl italic text-slate-100 text-center font-bold">"{gameData?.situation?.lastPlay?.text || "Scanning drive telemetry..."}"</p>
            <div className="mt-10 grid grid-cols-3 gap-8 text-center border-t border-slate-900 pt-6">
              <div><p className="text-[10px] text-slate-600 font-black uppercase">Down</p><p className="text-4xl text-white font-black">{gameData?.situation?.down || '-'}</p></div>
              <div><p className="text-[10px] text-slate-600 font-black uppercase">To_Go</p><p className="text-4xl text-white font-black">{gameData?.situation?.distance || '-'}</p></div>
              <div><p className="text-[10px] text-slate-600 font-black uppercase">Ball_On</p><p className="text-4xl text-white font-black">{gameData?.situation?.yardLine || '-'}</p></div>
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5">
            <h3 className="text-[10px] font-black text-yellow-500 mb-4 uppercase flex items-center gap-2"><Trophy size={14}/> Top_Performers</h3>
            <div className="grid grid-cols-3 gap-4">
              {teamLeaders.map((leader: any, i: number) => (
                <div key={i} className="text-center bg-white/5 p-2 border-t border-yellow-600/30">
                  <p className="text-[9px] font-black text-white uppercase truncate">{leader.name}</p>
                  <p className="text-[8px] text-yellow-500 font-bold">{leader.position}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* UNIT SELECTOR & PREDICTIONS */}
        <div className="lg:col-span-3 space-y-4">
          <section className="bg-slate-950 border border-slate-800 p-4">
            <h3 className="text-[10px] font-black text-blue-400 mb-4 uppercase flex items-center gap-2"><Crosshair size={12}/> Unit_Selector</h3>
            <div className="space-y-1">
              {PATS_ROSTER.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex justify-between p-3 text-[10px] border-b border-slate-900 transition-all ${selectedPlayer.id === p.id ? 'bg-blue-900/30 border-l-4 border-l-blue-500 text-white font-black' : 'text-slate-500 hover:bg-slate-900'}`}>
                  <span>{p.pos}</span><span className="uppercase">{p.name}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="bg-blue-900/10 border border-blue-500/30 p-4 text-center">
             <p className="text-[9px] text-blue-400 font-black uppercase mb-1">League_Prediction</p>
             <p className="text-2xl font-black text-white">{predictions?.pickCenter?.[0]?.details || "ANALYZING"}</p>
          </div>
        </div>

        {/* BIOMETRIC FEED */}
        <div className="lg:col-span-12">
          <section className="bg-gradient-to-r from-slate-950 to-blue-900/30 border-t-2 border-red-600 p-6 flex flex-col md:flex-row items-center gap-10">
             <div className="relative">
                <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${selectedPlayer.id}.png`} alt="Unit" className="w-24 h-24 rounded-full border-2 border-blue-600 bg-slate-900 object-cover shadow-[0_0_20px_cyan]" />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-black px-2 py-1 uppercase">ACTIVE</div>
             </div>
             <div className="flex-1 text-center md:text-left text-white">
                <p className="text-[10px] text-slate-500 font-black uppercase italic mb-1 tracking-[0.4em]">Biometric_Scanner:</p>
                <h3 className="text-5xl font-black italic uppercase leading-none tracking-tighter mb-2">{playerBio?.displayName || selectedPlayer.name}</h3>
                <div className="flex justify-center md:justify-start gap-10 text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                  <span>AGE: {playerBio?.age || '--'}</span>
                  <span>COLLEGE: {playerBio?.college?.name || '---'}</span>
                  <span>POS: {selectedPlayer.pos}</span>
                </div>
             </div>
             <div className="flex gap-12 border-l border-slate-800 pl-12 text-center">
                <div><p className="text-[9px] text-slate-500 uppercase font-black italic mb-1">Weight</p><p className="text-4xl font-black text-white">{playerBio?.displayWeight || '--'}</p></div>
                <div><p className="text-[9px] text-slate-500 uppercase font-black italic mb-1">Status</p><p className="text-4xl font-black text-green-500 uppercase">ACT</p></div>
             </div>
          </section>
        </div>
      </div>
      <style jsx>{` 
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } 
        .animate-marquee { animation: marquee 30s linear infinite; } 
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </main>
  );
}