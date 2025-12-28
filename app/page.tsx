'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, TrendingUp, Zap, MousePointer2, Radio, CloudRain, Activity, ChevronRight, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
// Importamos los componentes de Recharts para el nuevo gráfico de stock
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const ScoreTrendChart = dynamic(() => import('./ScoreTrendChart'), { 
  ssr: false,
  loading: () => <div className="h-[150px] w-full bg-slate-900/20 animate-pulse rounded" />
});

const MatrixLoading = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono overflow-hidden relative">
    <div className="absolute inset-0 opacity-20 pointer-events-none text-green-500 text-[10px] leading-none overflow-hidden break-all">
      {Array(20).fill("01101001010110PATS0101010101010MAYEDRAKE010101010").map((s, i) => (
        <p key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>{s}</p>
      ))}
    </div>
    <Zap className="text-blue-500 animate-bounce mb-4 relative z-10" size={48} />
    <p className="text-blue-400 tracking-[0.5em] animate-pulse relative z-10 font-black uppercase">Establishing_NE_Uplink</p>
    <p className="text-slate-600 text-[10px] mt-2 relative z-10 uppercase italic">Encrypting Data Feed...</p>
  </div>
);

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
  // 1. NUEVO ESTADO: Historial para el Stock Chart de Probabilidad
  const [winProbHistory, setWinProbHistory] = useState<any>([]);
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
        const neBoxStats = boxData.teams?.find((t: any) => t.team.abbreviation === 'NE')?.statistics;
        const weather = boxData.gameInfo?.weather;

        // Historial de marcador
        setScoreHistory((prev: any) => {
          const newPoint = { time: patsEvent.status.displayClock, pats: parseInt(patsTeam.score), opp: parseInt(oppTeam.score) };
          if (prev.length > 0 && prev[prev.length - 1].pats === newPoint.pats && prev[prev.length - 1].opp === newPoint.opp) return prev;
          return [...prev.slice(-15), newPoint];
        });

        // 2. LÓGICA DE CAPTURA: Actualizar el historial de probabilidad (Stock Chart)
        const currentProb = patsTeam.winProbability || 50;
        setWinProbHistory((prev: any) => {
          const newEntry = { time: patsEvent.status.displayClock, prob: currentProb };
          // Solo agregar si el valor cambió o si es el primer dato
          if (prev.length > 0 && prev[prev.length - 1].prob === currentProb) return prev;
          return [...prev.slice(-30), newEntry]; // Guardamos los últimos 30 movimientos
        });

        setGameData({
          status: patsEvent.status.type.detail,
          weather: { temp: weather?.temperature || "72", cond: weather?.displayValue || "Clear" },
          score: { patriots: patsTeam.score, opponent: oppTeam.score, oppName: oppTeam.team.abbreviation },
          timeouts: { pats: patsTeam.timeouts || 0, opp: oppTeam.timeouts || 0 },
          clock: `${patsEvent.status.displayClock} / ${patsEvent.status.period}Q`,
          possession: sit?.possession === patsTeam.id ? 'NE' : oppTeam.team.abbreviation,
          yardLine: sit?.lastPlay?.text.includes('at NE') ? `NE ${sit.yardLine}` : `OPP ${sit.yardLine}`,
          down: sit?.down || 0, distance: sit?.distance || 0, winProb: currentProb,
          efficiency: {
            thirdDown: neBoxStats?.find((s: any) => s.name === 'thirdDownEff')?.displayValue || "0/0",
            turnovers: neBoxStats?.find((s: any) => s.name === 'turnovers')?.displayValue || "0"
          },
          lastPlayText: sit?.lastPlay?.text || "Waiting for next snap...",
          roster: { 
            offense: [{ pos: "QB", name: "Drake Maye" }, { pos: "RB", name: "R. Stevenson" }, { pos: "WR", name: "J. Polk" }],
            defense: [{ pos: "CB", name: "C. Gonzalez" }, { pos: "S", name: "Kyle Dugger" }]
          }
        });
      } else {
          setGameData({ status: "OFFLINE", score: { patriots: "0", opponent: "0", oppName: "TBD" }, clock: "NO_GAME", weather: { temp: "--", cond: "--" }, timeouts: { pats: 3, opp: 3 }, efficiency: { thirdDown: "0/0", turnovers: "0" }, roster: { offense: [], defense: [] }, winProb: 0, lastPlayText: "No active game data." });
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 45000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !gameData) return <MatrixLoading />;

  return (
    <main className="min-h-screen bg-[#000d16] text-slate-100 p-4 lg:p-8 font-mono overflow-x-hidden">
      <header className="flex flex-col lg:flex-row justify-between items-start border-b border-blue-900/50 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-5">
          <div className="bg-red-600 p-3 transform -skew-x-12 shadow-[0_0_20px_rgba(220,38,38,0.3)]"><Shield className="text-white fill-white" size={32} /></div>
          <div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tighter italic">PATRIOTS_TELEMETRY</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-green-500 text-[10px] font-bold tracking-widest animate-pulse"><Activity size={12}/> LIVE_UPLINK</span>
              <span className="flex items-center gap-1 text-slate-500 text-[10px] uppercase font-bold"><CloudRain size={12}/> {gameData.weather.temp}°F | {gameData.weather.cond}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-blue-500/20 p-3 px-6 rounded-sm text-center">
          <p className="text-[9px] text-slate-500 mb-1 font-bold italic uppercase">System_Clock</p>
          <p className="text-2xl font-black tracking-tighter text-blue-400">{gameData.clock}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-gradient-to-b from-slate-900 to-black border border-blue-900/40 p-8 rounded-sm text-center shadow-2xl relative">
            <div className="flex justify-between items-center relative z-10">
              <div className="text-center">
                <p className="text-blue-500 font-black mb-1 italic text-sm">PATS</p>
                <p className="text-8xl font-black tracking-tighter leading-none">{gameData.score.patriots}</p>
                <div className="flex gap-1 justify-center mt-3">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className={`h-1.5 w-4 ${i < gameData.timeouts.pats ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-slate-800'}`}></div>
                   ))}
                </div>
              </div>
              <div className="text-slate-800 font-black text-2xl mx-2 font-mono">VS</div>
              <div className="opacity-60 text-center">
                <p className="text-slate-500 font-black mb-1 italic text-sm">{gameData.score.oppName}</p>
                <p className="text-8xl font-black tracking-tighter leading-none">{gameData.score.opponent}</p>
                <div className="flex gap-1 justify-center mt-3">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className={`h-1.5 w-4 ${i < gameData.timeouts.opp ? 'bg-red-600' : 'bg-slate-800'}`}></div>
                   ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. UI: CUADRO DE WIN PROBABILITY ESTILO STOCK CHART */}
          <section className="bg-black border border-blue-900/30 rounded-sm overflow-hidden shadow-2xl">
            <div className="p-5 flex justify-between items-end border-b border-blue-900/20 bg-slate-950">
              <div>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mb-1 italic">Win_Prob_Index</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl font-black italic tracking-tighter text-white">{gameData.winProb.toFixed(1)}%</h2>
                  <div className={`flex items-center text-xs font-bold ${gameData.winProb >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {gameData.winProb >= 50 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                    {gameData.winProb >= 50 ? 'BULLISH' : 'BEARISH'}
                  </div>
                </div>
              </div>
              <TrendingUp size={24} className="text-blue-900/50 mb-1" />
            </div>
            {/* Gráfico de Área Estilo Stock */}
            <div className="h-[120px] w-full bg-[#02080e] relative pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={winProbHistory.length > 0 ? winProbHistory : [{prob: 50}, {prob: 50}]}>
                  <defs>
                    <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #1e3a8a', fontSize: '10px'}} itemStyle={{color: '#3b82f6'}} />
                  <Area 
                    type="monotone" 
                    dataKey="prob" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorProb)" 
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* Línea base del 50% */}
              <div className="absolute top-1/2 left-0 w-full h-px border-t border-dashed border-slate-800 pointer-events-none"></div>
            </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm space-y-3">
             <div className="flex justify-between text-[10px] border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-bold uppercase">3rd Down Efficiency</span>
                <span className="text-white font-black">{gameData.efficiency.thirdDown}</span>
             </div>
             <div className="flex justify-between text-[10px] border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-bold uppercase">Offensive Turnovers</span>
                <span className="text-red-500 font-black">{gameData.efficiency.turnovers}</span>
             </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <section className="bg-[#02080e] border border-blue-900/30 p-8 rounded-sm shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3 text-blue-500"><Target size={20} /><h2 className="text-xl font-black uppercase tracking-widest italic text-white">Tactical Drive Monitor</h2></div>
              <div className="text-[10px] text-blue-900 font-black px-3 py-1 border border-blue-900/30 rounded-full animate-pulse tracking-widest">REALTIME_DATA_FLOW</div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-8">
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase italic">Down</p><p className="text-2xl font-black">{gameData.down}º</p></div>
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase italic">To Go</p><p className="text-2xl font-black text-yellow-400">{gameData.distance}</p></div>
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase italic">Ball On</p><p className="text-2xl font-black">{gameData.yardLine}</p></div>
               <div className="bg-black/40 p-3 border-l-2 border-slate-800"><p className="text-[9px] text-slate-500 uppercase font-bold uppercase italic">Pos</p><p className="text-2xl font-black text-blue-400">{gameData.possession}</p></div>
            </div>
            <TacticalField yardLine={gameData.yardLine} distance={gameData.distance} possession={gameData.possession} />
          </section>

          <section className="bg-slate-950 border border-slate-800 p-6 rounded-sm">
             <div className="flex items-center gap-2 mb-4 text-blue-400 border-b border-blue-900/30 pb-2">
                <ChevronRight size={16} />
                <span className="text-[10px] font-black uppercase tracking-tighter italic text-white">Live Tactical Feed</span>
             </div>
             <div className="text-sm italic text-slate-300 font-mono leading-relaxed bg-black/50 p-4 border-l-2 border-blue-600">
                {gameData.lastPlayText}
             </div>
          </section>

          <section className="bg-slate-950 border border-slate-800 p-5 rounded-sm h-[200px]">
             <div className="flex items-center gap-2 mb-4 text-blue-500">
                <Activity size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white italic">Score History Stream</span>
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