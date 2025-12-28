'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, TrendingUp, Zap, Radio, CloudRain, Activity, ChevronRight, Target, ArrowUpRight, ArrowDownRight, Users, BarChart3, Info } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const ScoreTrendChart = dynamic(() => import('./ScoreTrendChart'), { 
  ssr: false,
  loading: () => <div className="h-[150px] w-full bg-slate-900/20 animate-pulse rounded" />
});

export default function PatriotsDashboard() {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoreHistory, setScoreHistory] = useState<any>([]);
  const [winProbHistory, setWinProbHistory] = useState<any>([]);
  const [selectedPlayer, setSelectedPlayer] = useState({ name: "Drake Maye", id: "4685721", pos: "QB" });
  const [playerBio, setPlayerBio] = useState<any>(null);

  const fetchLiveStats = useCallback(async () => {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'nfl-api1.p.rapidapi.com'
      }
    };

    try {
      // 1. SCOREBOARD & SITUATION
      const scoreRes = await fetch('https://nfl-api1.p.rapidapi.com/v2/nfl/scoreboard', options);
      const scoreData = await scoreRes.json();
      const patsEvent = scoreData.events?.find((e: any) => e.competitions[0].competitors.some((c: any) => c.team.abbreviation === 'NE'));

      if (!patsEvent) return;
      const gameId = patsEvent.id;

      // 2. BOXSCORE (Stats & Scoring Plays)
      const boxRes = await fetch(`https://nfl-api1.p.rapidapi.com/v2/nfl/boxscore?id=${gameId}`, options);
      const boxData = await boxRes.json();

      // 3. ODDS (Betting Data)
      const oddsRes = await fetch(`https://nfl-api1.p.rapidapi.com/v2/nfl/odds?id=${gameId}`, options);
      const oddsData = await oddsRes.json();

      // 4. PLAYER BIO (Solo si cambia el jugador o al inicio)
      if (!playerBio || playerBio.name !== selectedPlayer.name) {
        const bioRes = await fetch(`https://nfl-api1.p.rapidapi.com/v2/nfl/player/bio?id=${selectedPlayer.id}`, options);
        const bioData = await bioRes.json();
        setPlayerBio(bioData);
      }

      const comp = patsEvent.competitions[0];
      const patsTeam = comp.competitors.find((c: any) => c.team.abbreviation === 'NE');
      const currentProb = patsTeam.winProbability || 50;

      // Actualizar Historiales
      setWinProbHistory((prev: any) => [...prev.slice(-30), { time: patsEvent.status.displayClock, prob: currentProb }]);
      
      setGameData({
        isLive: patsEvent.status.type.state === 'in',
        status: patsEvent.status.type.detail,
        weather: boxData.gameInfo?.weather,
        score: { patriots: patsTeam.score, opponent: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').score, oppName: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').team.abbreviation },
        timeouts: { pats: patsTeam.timeouts, opp: comp.competitors.find((c: any) => c.team.abbreviation !== 'NE').timeouts },
        odds: oddsData.items?.[0] || { details: "N/A", overUnder: "N/A" },
        scoring: boxData.scoringPlays?.slice(-3).reverse() || [],
        situation: comp.situation,
        efficiency: boxData.teams?.find((t: any) => t.team.abbreviation === 'NE')?.statistics
      });

      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  }, [selectedPlayer, playerBio]);

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveStats]);

  if (loading || !gameData) return <div className="bg-black min-h-screen" />;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-8 font-mono">
      {/* HEADER PRO CON CLIMA Y ODDS */}
      <header className="flex flex-col lg:flex-row justify-between items-start border-b border-blue-900/50 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-5">
          <div className="bg-red-600 p-3 transform -skew-x-12 shadow-[0_0_15px_red]"><Shield size={32} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Patriots_Command_Center</h1>
            <div className="flex gap-4 mt-2 text-[10px] font-bold">
               <span className="text-green-500 animate-pulse flex items-center gap-1"><Activity size={12}/> LIVE_FEED</span>
               <span className="text-slate-500 flex items-center gap-1"><CloudRain size={12}/> {gameData.weather?.displayValue}</span>
               <span className="text-yellow-500 border border-yellow-900/50 px-2 uppercase">Odds: {gameData.odds.details} | O/U: {gameData.odds.overUnder}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-blue-500/20 p-3 px-6 text-center">
          <p className="text-[9px] text-slate-500 uppercase italic">Game_Clock</p>
          <p className="text-2xl font-black text-blue-400 tracking-widest">{gameData.status}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: SCORE & STOCK CHART */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-950 border border-blue-900/30 p-6 rounded-sm">
            <div className="flex justify-between items-center mb-8">
               <div className="text-center">
                 <p className="text-7xl font-black">{gameData.score.patriots}</p>
                 <div className="flex gap-1 justify-center mt-2">
                   {[...Array(3)].map((_, i) => <div key={i} className={`h-1 w-3 ${i < gameData.timeouts.pats ? 'bg-yellow-400' : 'bg-slate-800'}`} />)}
                 </div>
               </div>
               <div className="text-slate-800 font-black text-xl italic">VS</div>
               <div className="text-center opacity-60">
                 <p className="text-7xl font-black">{gameData.score.opponent}</p>
                 <div className="flex gap-1 justify-center mt-2">
                   {[...Array(3)].map((_, i) => <div key={i} className={`h-1 w-3 ${i < gameData.timeouts.opp ? 'bg-red-800' : 'bg-slate-800'}`} />)}
                 </div>
               </div>
            </div>

            {/* WIN PROB STOCK CHART */}
            <div className="bg-black/50 p-4 border border-slate-900 rounded-sm">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Win_Prob_Ticker</p>
                <p className="text-3xl font-black italic">{gameData.winProb.toFixed(1)}%</p>
              </div>
              <div className="h-[80px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={winProbHistory}>
                    <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <Area type="monotone" dataKey="prob" stroke="#3b82f6" fill="url(#c)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* SCORING SUMMARY (HISTORIAL DE ANOTACIONES) */}
          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm">
             <h3 className="text-[10px] font-bold text-white mb-4 uppercase tracking-[0.2em] flex items-center gap-2"><Info size={14}/> Scoring_History</h3>
             <div className="space-y-3">
                {gameData.scoring.map((play: any, i: number) => (
                  <div key={i} className="text-[10px] border-l-2 border-red-600 pl-3 py-1 bg-white/5">
                    <p className="font-bold text-blue-400">{play.team.abbreviation} - {play.type.text}</p>
                    <p className="italic text-slate-400">{play.text}</p>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: DRIVE DATA & PLAYER BIO */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-[#020814] border border-blue-900/20 p-8 rounded-sm relative shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3"><Target className="text-blue-500" /><h2 className="text-xl font-black italic uppercase">Tactical_Drive</h2></div>
              <div className="text-[10px] font-black px-4 py-1 bg-blue-950/30 border border-blue-500/30 rounded-full animate-pulse">UPLINK_STABLE</div>
            </div>
            {/* Aquí mantendrías el TacticalField original */}
            <div className="bg-black/40 p-6 italic text-sm border-l-4 border-blue-600 mb-6">
              {gameData.lastPlayText}
            </div>
          </section>

          {/* PLAYER BIO MONITOR (NUEVO) */}
          <section className="bg-gradient-to-r from-slate-950 to-blue-950/20 border-t-2 border-red-600 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-8">
             <div className="relative">
                <img 
                  src={playerBio?.headshot?.href || 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/0.png'} 
                  alt="Player" 
                  className="w-24 h-24 rounded-full border-2 border-blue-600 bg-slate-900"
                />
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-[8px] font-black px-2 py-1 uppercase">Target_Bio</div>
             </div>
             <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase italic mb-1">Monitoring_Unit:</p>
                <h3 className="text-4xl font-black italic tracking-tighter uppercase">{playerBio?.displayName || 'Loading...'}</h3>
                <div className="flex gap-4 mt-2 text-[10px] font-bold text-blue-400">
                  <span>AGE: {playerBio?.age}</span>
                  <span>EXP: {playerBio?.experience?.years} YRS</span>
                  <span>COLLEGE: {playerBio?.college?.name}</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 border-l border-slate-800 pl-8">
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black">Weight</p>
                  <p className="text-2xl font-black">{playerBio?.displayWeight}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black">Status</p>
                  <p className="text-2xl font-black text-green-500">{playerBio?.status?.type === 'active' ? 'ACT' : 'OFF'}</p>
                </div>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}