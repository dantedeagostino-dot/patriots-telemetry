"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, MapPin, Zap, MessageSquare, ChevronRight,
  Activity, BarChart3, CalendarDays, RefreshCw, Trophy, Clock
} from "lucide-react";

// --- 1. CONFIGURACIÓN ---
const CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "",
  API_HOST: "nfl-api1.p.rapidapi.com",
  TEAM_ID: "17", // New England Patriots ID
  REFRESH_RATE: 15000, // Actualiza cada 15 segundos
  
  // ⚡️ INTERRUPTOR DE EMERGENCIA ⚡️
  // true = Usa datos falsos y bonitos (Ideal mientras arreglan la API)
  // false = Intenta conectarse a la API real
  FORCE_DEMO_MODE: false 
};

// --- 2. COMPONENTES AUXILIARES ---
const StatRow = ({ label, h, a }: { label: string, h: number | string, a: number | string }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="font-mono text-slate-500 w-8 text-right text-[10px]">{a}</span>
    <span className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em] text-center flex-1">{label}</span>
    <span className="font-mono text-white w-8 text-left text-[10px]">{h}</span>
  </div>
);

// --- 3. ESTRUCTURAS DE DATOS ---
type ViewMode = 'TELEMETRY' | 'SCHEDULE';
type GameStatus = 'PRE' | 'LIVE' | 'FINAL' | 'OFF';

const INITIAL_GAME_STATE = {
  status: 'OFF' as GameStatus,
  id: "",
  home: "---", away: "---",
  scoreH: 0, scoreA: 0,
  quarter: "-", clock: "--:--",
  playDescription: "ESTABLISHING UPLINK...",
  winProb: 50,
  down: "--", yl: "--",
  possession: null as string | null,
  weather: "--",
  stadium: "--",
  odds: { spread: "--", overUnder: "--" },
  stats: {
    totalYards: { h: 0, a: 0 },
    passing: { h: 0, a: 0 },
    rushing: { h: 0, a: 0 },
    turnovers: { h: 0, a: 0 }
  }
};

const INITIAL_PLAYERS = {
  QB: { name: "LOADING...", stats: "--", rating: "--", status: "Healthy" },
  RB: { name: "LOADING...", stats: "--", rating: "--", status: "Healthy" },
  WR: { name: "LOADING...", stats: "--", rating: "--", status: "Healthy" },
  TE: { name: "LOADING...", stats: "--", rating: "--", status: "Healthy" }
};

export default function PatriotsTelemetryPro() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<ViewMode>('TELEMETRY');

  // DATOS
  const [game, setGame] = useState(INITIAL_GAME_STATE);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [activeUnitId, setActiveUnitId] = useState("QB");
  const [winHistory, setWinHistory] = useState([{p:50}]);

  // --- 4. SIMULADOR INTELIGENTE (DATOS DE RESERVA) ---
  const simulateSmartData = useCallback(() => {
    console.log("⚡️ MODO SIMULACIÓN ACTIVO: Cargando datos de respaldo...");
    setGame({
      status: 'FINAL',
      id: "game-sim-01",
      home: "Pats", away: "Jets", // Patriots vs Jets
      scoreH: 42, scoreA: 10,
      quarter: "OT", clock: "00:00",
      playDescription: "GAME OFFICIAL • PATRIOTS WIN AT HOME (OT) • MAYE TO HENRY TD",
      winProb: 100,
      possession: null, down: "End", yl: "Game",
      weather: "28°F Snow", stadium: "Gillette Stadium",
      odds: { spread: "BUF -4.5", overUnder: "42.5" },
      stats: {
        totalYards: { h: 440, a: 340 },
        passing: { h: 285, a: 143 },
        rushing: { h: 155, a: 164},
        turnovers: { h: 0, a: 2 }
      }
    });

    setPlayers({
      QB: { name: "DRAKE MAYE", stats: "22/30, 265 YDS, 3 TD", rating: "128.5", status: "Healthy" },
      RB: { name: "R. STEVENSON", stats: "20 CAR, 120 YDS, 0 TD", rating: "6.0 AVG", status: "Healthy" },
      WR: { name: "JA'LYNN POLK", stats: "6 REC, 95 YDS, 1 TD", rating: "15.8 AVG", status: "Healthy" },
      TE: { name: "HUNTER HENRY", stats: "5 REC, 60 YDS, 2 TD", rating: "12.0 AVG", status: "Healthy" }
    });

    // Gráfico de victoria dramático
    setWinHistory([
      {p:50}, {p:48}, {p:45}, {p:40}, {p:30}, {p:20}, {p:50}, {p:60}, {p:55}, {p:85}, {p:95}, {p:100}
    ]);

    setSchedule([
      { id: 1, week: 18, opponent: "vs DOLPHINS", date: "Jan 04 • 1:00 PM", venue: "Gillette Stadium", ticket: "Home" },
      { id: 2, week: "WC", opponent: "@ CHIEFS", date: "Jan 12 • TBD", venue: "Arrowhead Stadium", ticket: "Away" },
      { id: 3, week: "DIV", opponent: "vs RAVENS", date: "TBD", venue: "Gillette Stadium", ticket: "Home" }
    ]);
  }, []);

  // --- 5. LÓGICA AUTO-PILOTO (API REAL + PROTECCIÓN) ---
  const fetchTelemetry = useCallback(async () => {
    setIsLoading(true);

    // 1. CHEQUEO: ¿Estamos forzando la demo o no hay API Key?
    if (CONFIG.FORCE_DEMO_MODE || !CONFIG.API_KEY) {
      simulateSmartData();
      setLastUpdate(new Date());
      setIsLoading(false);
      return;
    }

    try {
      const headers = { 'X-RapidAPI-Key': CONFIG.API_KEY, 'X-RapidAPI-Host': CONFIG.API_HOST };
      const seasonYear = "2025"; // Intentamos 2025 primero

      // A. OBTENER CALENDARIO
      const scheduleRes = await fetch(`https://${CONFIG.API_HOST}/nfl-schedule-team?teamId=${CONFIG.TEAM_ID}&season=${seasonYear}`, { headers });
      
      // Si falla la API, lanzamos error para caer en el CATCH y usar el simulador
      if (!scheduleRes.ok) throw new Error(`API Error: ${scheduleRes.status}`);

      const scheduleData = await scheduleRes.json();
      const allGames = scheduleData.events || [];

      // 🛑 PROTECCIÓN CRÍTICA: Si la API devuelve una lista vacía (error de año 2026), usar simulador
      if (allGames.length === 0) {
        console.warn("⚠️ API devolvió lista vacía. Activando Protocolo de Simulación.");
        simulateSmartData();
        setIsLoading(false);
        return;
      }

      // 1. ¿Hay partido EN VIVO?
      const liveGame = allGames.find((g: any) => g.status?.type?.state === 'in');
      let targetGameId = "";
      let mode: GameStatus = 'FINAL';

      if (liveGame) {
        targetGameId = liveGame.id;
        mode = 'LIVE';
        setActiveTab('TELEMETRY');
      } else {
        // NO HAY PARTIDO -> Buscar el último completado
        const completedGames = allGames
          .filter((g: any) => g.status?.type?.state === 'post')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (completedGames.length > 0) {
          targetGameId = completedGames[0].id;
          mode = 'FINAL';
        }
      }

      // 2. Procesar Schedule Futuro
      const futureGames = allGames
        .filter((g: any) => g.status?.type?.state === 'pre')
        .slice(0, 6)
        .map((g: any) => ({
          id: g.id,
          week: g.week?.text || "NEXT",
          opponent: g.name,
          date: new Date(g.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }),
          venue: g.competitions?.[0]?.venue?.fullName || "TBD",
          ticket: g.competitions?.[0]?.competitors?.find((c:any) => c.id === CONFIG.TEAM_ID)?.homeAway === 'home' ? 'Home' : 'Away'
        }));
      setSchedule(futureGames);

      // B. OBTENER DETALLES DEL PARTIDO SELECCIONADO
      if (targetGameId) {
        const [boxRes, playRes] = await Promise.all([
          fetch(`https://${CONFIG.API_HOST}/nflboxscore?id=${targetGameId}`, { headers }),
          fetch(`https://${CONFIG.API_HOST}/nflplay?id=${targetGameId}`, { headers })
        ]);

        if (boxRes.ok && playRes.ok) {
          const boxData = await boxRes.json();
          const playData = await playRes.json();
          const compet = boxData.gamepackageJSON?.header?.competitions?.[0] || {};
          const homeTeam = compet.competitors?.find((c:any) => c.homeAway === 'home');
          const awayTeam = compet.competitors?.find((c:any) => c.homeAway === 'away');
          const isPatsHome = homeTeam.id === CONFIG.TEAM_ID;

          let winProb = 50;
          if (mode === 'FINAL') {
             const hScore = parseInt(homeTeam.score);
             const aScore = parseInt(awayTeam.score);
             winProb = ((isPatsHome && hScore > aScore) || (!isPatsHome && aScore > hScore)) ? 100 : 0;
          }

          setGame({
            status: mode,
            id: targetGameId,
            home: homeTeam.team?.abbreviation || "NE",
            away: awayTeam.team?.abbreviation || "OPP",
            scoreH: parseInt(homeTeam.score || "0"),
            scoreA: parseInt(awayTeam.score || "0"),
            quarter: mode === 'FINAL' ? "FINAL" : compet.status?.type?.detail,
            clock: compet.status?.displayClock || "00:00",
            playDescription: playData.items?.[playData.items.length-1]?.text || "GAME DATA UPLINK ESTABLISHED",
            winProb: winProb,
            down: "End", yl: "Field", possession: null,
            weather: boxData.gamepackageJSON?.header?.weather?.displayValue || "--",
            stadium: compet.venue?.fullName || "--",
            odds: { spread: "--", overUnder: "--" },
            stats: {
              totalYards: { h: parseInt(homeTeam.statistics?.[0]?.displayValue || 0), a: parseInt(awayTeam.statistics?.[0]?.displayValue || 0) },
              passing: { h: 0, a: 0 },
              rushing: { h: 0, a: 0 },
              turnovers: { h: 0, a: 0 }
            }
          });
        }
      }

      setLastUpdate(new Date());
      setIsLoading(false);

    } catch (e) {
      console.error("❌ Fallo en API, activando simulador de respaldo:", e);
      simulateSmartData();
      setIsLoading(false);
    }

  }, [simulateSmartData]);

  // --- EFECTOS ---
  useEffect(() => {
    setHasMounted(true);
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, CONFIG.REFRESH_RATE);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  const isFinal = game.status === 'FINAL';
  const isLive = game.status === 'LIVE';
  const currentUnit = players[activeUnitId as keyof typeof players];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 font-sans selection:bg-blue-500/30 relative">
      
      {/* SCANLINES */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{backgroundSize: "100% 2px, 3px 100%"}} />

      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 space-y-6">

        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-6">
          <div className="space-y-2 w-full md:w-auto">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase flex flex-wrap items-center gap-2 leading-none">
              PATRIOTS <span className="text-blue-600">TELEMETRY</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs font-mono text-slate-400">
               <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isLive ? 'border-red-500/20 bg-red-900/10 text-red-500' : 'border-slate-500/20 bg-slate-800 text-slate-400'}`}>
                 {isLive && (
                   <span className="relative flex h-1.5 w-1.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                   </span>
                 )}
                 <span className="font-bold tracking-widest uppercase">
                   {isLive ? 'LIVE FEED' : isFinal ? 'POST-GAME REPORT' : 'OFFLINE'}
                 </span>
               </div>
               <div className="flex items-center gap-1"><MapPin size={10}/> {game.stadium}</div>
               <div className="flex items-center gap-1 text-slate-600 ml-2">
                 <RefreshCw size={8} className={isLoading ? "animate-spin" : ""} />
                 <span>{lastUpdate.toLocaleTimeString()}</span>
               </div>
               {CONFIG.FORCE_DEMO_MODE && <span className="text-amber-500 font-bold bg-amber-900/20 px-2 rounded border border-amber-500/20">SIMULATION MODE</span>}
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setActiveTab('TELEMETRY')}
              className={`px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'TELEMETRY' ? 
              'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <Activity size={12} /> {isLive ? 'Live Feed' : 'Last Match'}
            </button>
            <button 
              onClick={() => setActiveTab('SCHEDULE')}
              className={`px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'SCHEDULE' ? 
              'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <CalendarDays size={12} /> Upcoming Ops
            </button>
          </div>
        </header>

        {/* --- CONTENIDO SEGÚN PESTAÑA --- */}
        <AnimatePresence mode="wait">
          
          {/* VISTA 1: TELEMETRÍA (Partido Actual o Último Jugado) */}
          {activeTab === 'TELEMETRY' && (
            <motion.div
              key="telemetry"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* SCOREBOARD */}
              <div className="flex justify-end items-end border-b border-white/5 pb-4">
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Score</div>
                  <div className="text-6xl md:text-8xl font-black tracking-tighter text-white italic leading-[0.8]">
                    {game.scoreH}<span className="text-blue-600 text-4xl md:text-6xl mx-1">/</span><span className="text-slate-600 text-4xl md:text-6xl">{game.scoreA}</span>
                  </div>
                </div>
                <div className="text-right pl-6 border-l border-white/10 hidden md:block">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{isFinal ? 'STATUS' : 'CLOCK'}</div>
                  <div className="text-3xl font-black text-white font-mono">{game.clock}</div>
                  <div className="text-xs font-bold text-blue-500 uppercase">{game.quarter}</div>
                </div>
              </div>

              {/* TICKER */}
              <div className={`bg-blue-950/20 border border-blue-500/20 p-4 rounded-lg flex items-start md:items-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.1)] ${isFinal ? 'opacity-70 grayscale' : ''}`}>
                <MessageSquare size={16} className="text-blue-500 shrink-0 mt-0.5 md:mt-0" />
                <p className="text-xs md:text-sm font-bold text-white italic tracking-tight font-mono leading-tight">{game.playDescription}</p>
              </div>

              {/* GRID DE DATOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Stats */}
                <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-5 h-full flex flex-col justify-center shadow-lg">
                  <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <BarChart3 size={14} className="text-blue-500"/>
                    <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Matchup_Stats</h3>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase mb-2 px-2">
                    <span>{game.away}</span>
                    <span>{game.home}</span>
                  </div>
                  <div className="space-y-1">
                    <StatRow label="Tot Yards" a={game.stats.totalYards.a} h={game.stats.totalYards.h} />
                    <StatRow label="Passing" a={game.stats.passing.a} h={game.stats.passing.h} />
                    <StatRow label="Rushing" a={game.stats.rushing.a} h={game.stats.rushing.h} />
                    <StatRow label="Turnovers" a={game.stats.turnovers.a} h={game.stats.turnovers.h} />
                  </div>
                </section>

                {/* Probabilidad / Resultado */}
                <section className="md:col-span-2 bg-[#0a0c14] border border-white/5 rounded-xl p-6 md:p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-between shadow-2xl">
                  <div className="flex justify-between items-start z-10 relative">
                    <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-blue-500 uppercase italic">
                      Win_Probability_{isFinal ? 'Final' : 'Live'}
                    </span>
                    <span className="text-6xl md:text-8xl font-black italic text-white tracking-tighter leading-none">
                      {game.winProb}%
                    </span>
                  </div>

                  {isFinal && (
                    <div className="absolute top-6 right-8 z-10">
                      {game.winProb === 100 ? (
                        <span className="text-green-500 font-black tracking-widest border border-green-500/50 px-3 py-1 rounded bg-green-500/10">VICTORY</span>
                      ) : (
                        <span className="text-slate-500 font-black tracking-widest">DEFEAT</span>
                      )}
                    </div>
                  )}

                  <div className="relative z-10 mt-2">
                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${game.winProb}%` }}
                        className={`h-full shadow-[0_0_15px_#2563eb] ${isFinal ? 'bg-slate-500' : 'bg-blue-600'}`}
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-32 opacity-15 pointer-events-none mix-blend-screen w-full">
                    <div style={{ width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={winHistory}>
                          <defs>
                            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="p" stroke="#3b82f6" strokeWidth={2} fill="url(#colorProb)" isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* Unit Selector */}
                <div className="space-y-4">
                  <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2 shrink-0">
                      <Target size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Top_Performers
                      </span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeUnitId}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-6 bg-gradient-to-br from-blue-900/10 to-transparent relative border-b border-white/10 shrink-0"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 shadow-[0_0_15px_#3b82f6]" />
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-blue-500 tracking-widest bg-blue-500/10 px-2 rounded">{activeUnitId}</span>
                          <Zap size={12} className="text-blue-500 animate-pulse" />
                        </div>
                        <p className="text-xl md:text-2xl font-black text-white italic uppercase mt-2 tracking-tighter">{currentUnit.name}</p>
                        <p className="text-xs md:text-sm font-bold text-blue-400 font-mono tracking-wider mt-1">{currentUnit.stats}</p>
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                      {Object.keys(players).map((id) => (
                        <button key={id} onClick={() => setActiveUnitId(id)} className={`w-full flex justify-between items-center p-4 transition-all text-left group hover:bg-white/5 ${activeUnitId === id ? 
                          'bg-white/5' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black w-6 ${activeUnitId === id ? 'text-blue-500' : 'text-slate-600'}`}>{id}</span>
                            <span className={`text-[10px] md:text-xs font-bold uppercase italic tracking-wider truncate ${activeUnitId === id ? 'text-white' : 'text-slate-500'}`}>{players[id as keyof typeof players].name}</span>
                          </div>
                          <ChevronRight size={12} className={`transition-colors ${activeUnitId === id ? 'text-blue-500' : 'text-white/5'}`} />
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'SCHEDULE' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {schedule.map((game, i) => (
                <div key={i} className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative overflow-hidden hover:border-blue-500/30 transition-all group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy size={64} />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-1 rounded uppercase tracking-wider">
                      Week {game.week}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${game.ticket === 'Home' ? 'text-blue-400' : 'text-red-400'}`}>
                      {game.ticket} Game
                    </span>
                  </div>
                  <h3 className="text-2xl font-black italic text-white uppercase mb-1">{game.opponent}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mb-4">
                    <Clock size={12} /> {game.date}
                  </div>
                  <div className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <MapPin size={12} /> {game.venue}
                    </div>
                    {i === 0 && (
                      <div className="flex items-center gap-1 text-[9px] text-blue-500 font-black uppercase tracking-widest animate-pulse">
                        <Clock size={10} /> Next Up
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {schedule.length === 0 && (
                <div className="col-span-full text-center p-12 text-slate-500 font-mono text-sm border border-white/5 rounded-xl border-dashed">
                  NO SCHEDULED OPERATIONS FOUND
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}