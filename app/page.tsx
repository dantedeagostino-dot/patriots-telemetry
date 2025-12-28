"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, MapPin, Zap, MessageSquare, ChevronRight, 
  AlertTriangle, Activity, Thermometer, 
  BarChart3, CalendarDays, RefreshCw, Power, Settings
} from "lucide-react";

// --- 1. CONFIGURACIÓN ---
const CONFIG = {
  // 🔴 IMPORTANTE: Cuando tengas tu API Key de RapidAPI, pégala aquí.
  // Mientras esté vacía, el sistema usará el SIMULADOR MANUAL (Botones arriba derecha).
  API_KEY: "", 
  
  API_HOST: "nfl-api-data.p.rapidapi.com",
  TEAM_ID: "17", // New England Patriots
  REFRESH_RATE: 15000 
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
type GameStatus = 'PRE' | 'LIVE' | 'FINAL' | 'OFF';

const INITIAL_GAME_STATE = {
  status: 'PRE' as GameStatus,
  home: "PATRIOTS", away: "OPPONENT",
  scoreH: 0, scoreA: 0,
  quarter: "--", clock: "--:--",
  playDescription: "INITIALIZING TELEMETRY UPLINK...",
  winProb: 50,
  down: "--", yl: "--",
  possession: null as string | null,
  weather: "--°F",
  stadium: "Loading Stadium...",
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
  
  // ESTADO DE CONTROL MANUAL (Para probar vistas sin API)
  // Por defecto inicia en FINAL para que veas el resultado que esperas ahora mismo
  const [manualMode, setManualMode] = useState<GameStatus | null>('FINAL'); 

  // Estados de Datos
  const [game, setGame] = useState(INITIAL_GAME_STATE);
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [activeUnitId, setActiveUnitId] = useState("QB");
  const [winHistory, setWinHistory] = useState([{p:50}]);

  // --- 4. SIMULADOR DE DATOS (Genera datos según el modo elegido) ---
  const simulateDemoData = useCallback((forcedStatus: GameStatus = 'LIVE') => {
     const isFinal = forcedStatus === 'FINAL';
     const isPre = forcedStatus === 'PRE';
     const isOff = forcedStatus === 'OFF';

     // Generar datos aleatorios para dar vida
     const randomProb = isFinal ? 100 : (isPre ? 50 : 85 + Math.floor(Math.random() * 14));
     const mockClock = isFinal ? "00:00" : isPre ? "8:20 PM" : "03:45";
     const mockQuarter = isFinal ? "FINAL" : isPre ? "PRE" : "4TH";
     const mockPlay = isFinal 
        ? "GAME OVER • PATRIOTS WIN DIVISION TITLE" 
        : isPre 
        ? "WARMUPS UNDERWAY • KICKOFF IN 45 MIN" 
        : "(3:45) D.Maye pass deep right to J.Polk for 45 yards, TOUCHDOWN.";

     setGame({
         status: forcedStatus,
         home: "PATRIOTS", away: "JETS",
         scoreH: isPre ? 0 : 34, scoreA: isPre ? 0 : 17,
         quarter: mockQuarter, clock: mockClock,
         playDescription: isOff ? "NO TRANSMISSION" : mockPlay,
         winProb: randomProb,
         possession: isFinal || isPre || isOff ? null : "NE", 
         down: "1st & 10", yl: "NYJ 15",
         weather: "34°F Snow", stadium: "Gillette Stadium",
         odds: { spread: "NE -7.5", overUnder: "44.5" },
         stats: {
             totalYards: { h: isPre ? 0 : 380, a: isPre ? 0 : 210 },
             passing: { h: isPre ? 0 : 290, a: isPre ? 0 : 150 },
             rushing: { h: isPre ? 0 : 90, a: isPre ? 0 : 60 },
             turnovers: { h: 0, a: isPre ? 0 : 2 }
         }
     });

     setPlayers({
         QB: { name: "DRAKE MAYE", stats: "22/28, 290 YDS, 3 TD", rating: "142.0", status: "Healthy" },
         RB: { name: "R. STEVENSON", stats: "15 CAR, 85 YDS, 1 TD", rating: "5.6 AVG", status: "Questionable" },
         WR: { name: "JA'LYNN POLK", stats: "6 REC, 110 YDS, 1 TD", rating: "18.3 AVG", status: "Healthy" },
         TE: { name: "HUNTER HENRY", stats: "5 REC, 55 YDS, 1 TD", rating: "11.0 AVG", status: "Healthy" }
     });
     
     // Si no es Previa ni Off, mostramos gráfico de probabilidad
     if(!isPre && !isOff) {
        setWinHistory(prev => {
            const newHistory = [...prev.slice(-19), { p: randomProb }];
            // Si es final, llenamos el historial para que se vea completo
            return isFinal ? [{p:50}, {p:60}, {p:70}, {p:85}, {p:90}, {p:95}, {p:100}, {p:100}] : newHistory;
        });
     }
  }, []);

  // --- 5. CEREBRO: LÓGICA DE CONEXIÓN ---
  const fetchTelemetry = useCallback(async () => {
    setIsLoading(true);
    
    // -> SI ESTAMOS EN MODO MANUAL O NO HAY API KEY -> USAR SIMULADOR
    if (manualMode || !CONFIG.API_KEY) {
      simulateDemoData(manualMode || 'LIVE'); 
      setLastUpdate(new Date());
      setIsLoading(false);
      return;
    }

    try {
      const headers = { 'X-RapidAPI-Key': CONFIG.API_KEY, 'X-RapidAPI-Host': CONFIG.API_HOST };
      const today = new Date();
      // Ajuste de fecha para evitar errores de mes/día
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const scoreRes = await fetch(`https://${CONFIG.API_HOST}/nflscoreboard?year=${year}&month=${month}&day=${day}`, { headers });
      const scoreData = await scoreRes.json();
      
      const match = scoreData.events?.find((e: any) => e.competitions[0].competitors.some((c: any) => c.id === CONFIG.TEAM_ID));

      if (!match) {
        setGame(prev => ({ ...prev, status: 'OFF', playDescription: "NO GAME SCHEDULED FOR TODAY" }));
        setIsLoading(false);
        return;
      }
      
      // ... Lógica de parseo real (se activará cuando pongas la API Key) ...
      // Por ahora, si falla, vuelve a demo.
      
    } catch (error) {
      console.error("API Error - Switching to Demo:", error);
      simulateDemoData('LIVE'); 
    }
    setIsLoading(false);
  }, [manualMode, simulateDemoData]);

  // --- EFECTOS ---
  useEffect(() => {
    setHasMounted(true);
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, CONFIG.REFRESH_RATE);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  const isPreGame = game.status === 'PRE';
  const isFinal = game.status === 'FINAL';
  const isOffAir = game.status === 'OFF';
  const currentUnit = players[activeUnitId as keyof typeof players];

  // --- VISTA: MODO "OFF AIR" (TV Apagada) ---
  if (isOffAir) {
    return (
      <div className="min-h-screen bg-[#02040a] flex items-center justify-center text-slate-500 relative overflow-hidden font-sans">
         {/* BOTONES DE CONTROL (Visibles incluso en modo OFF) */}
         <div className="fixed top-4 right-4 z-50 flex gap-1 bg-black/50 p-1 rounded-lg backdrop-blur-md border border-white/10">
            <Settings size={14} className="text-slate-500 mx-2 self-center"/>
            {(['OFF', 'PRE', 'LIVE', 'FINAL'] as GameStatus[]).map((m) => (
                <button key={m} onClick={() => setManualMode(m)} className={`text-[9px] px-2 py-1 rounded font-bold transition-all ${manualMode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    {m}
                </button>
            ))}
         </div>

         <div className="fixed inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{backgroundSize: "100% 2px, 3px 100%"}} />
         <div className="text-center space-y-6 relative z-10 border border-white/10 p-12 rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl max-w-md mx-4">
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <Power size={64} className="text-blue-900" />
                    <div className="absolute inset-0 animate-pulse bg-blue-500/20 blur-xl rounded-full" />
                </div>
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">System Standby</h1>
                <p className="font-mono text-xs text-blue-500 uppercase tracking-widest">No active transmission detected</p>
            </div>
         </div>
      </div>
    );
  }

  // --- VISTA: MODO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 font-sans selection:bg-blue-500/30 relative">
      
      {/* --- PANEL DE CONTROL (SOLO DEV) --- */}
      <div className="fixed top-24 md:top-4 right-4 z-50 flex gap-1 bg-black/80 p-1 rounded-lg backdrop-blur-md border border-white/20 shadow-2xl scale-90 md:scale-100 origin-top-right">
            <div className="flex items-center gap-2 px-2 border-r border-white/10 mr-1">
                <Settings size={12} className="text-blue-400 animate-spin-slow"/>
                <span className="text-[8px] font-mono text-blue-400 uppercase hidden md:inline">DEV_MODE</span>
            </div>
            {(['OFF', 'PRE', 'LIVE', 'FINAL'] as GameStatus[]).map((m) => (
                <button 
                    key={m} 
                    onClick={() => setManualMode(m)} 
                    className={`text-[9px] px-3 py-1.5 rounded font-black tracking-wider transition-all border ${
                        manualMode === m 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                        : 'bg-transparent border-transparent text-slate-500 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {m}
                </button>
            ))}
      </div>

      {/* SCANLINES */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{backgroundSize: "100% 2px, 3px 100%"}} />

      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-6">
          <div className="space-y-2 w-full md:w-auto">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase flex flex-wrap items-center gap-2 leading-none">
              {game.home} <span className="text-blue-600">TELEMETRY</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs font-mono text-slate-400">
                <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isPreGame ? 'border-yellow-500/20 bg-yellow-900/10 text-yellow-500' : isFinal ? 'border-slate-500/20 bg-slate-800 text-slate-400' : 'border-red-500/20 bg-red-900/10 text-red-500'}`}>
                   {!isFinal && !isPreGame && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                   )}
                   <span className="font-bold tracking-widest uppercase">
                      {isPreGame ? 'SCHEDULED' : isFinal ? 'FINAL GAME' : 'LIVE FEED'}
                   </span>
                </div>
                <div className="flex items-center gap-1"><MapPin size={10}/> {game.stadium}</div>
                <div className="flex items-center gap-1"><Thermometer size={10}/> {game.weather}</div>
                <div className="flex items-center gap-1 text-slate-600 ml-2">
                    <RefreshCw size={8} className={isLoading ? "animate-spin" : ""} />
                    <span>Last Upd: {lastUpdate.toLocaleTimeString()}</span>
                </div>
            </div>
          </div>

          <div className="flex items-end gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Score</div>
              <div className="text-6xl md:text-8xl font-black tracking-tighter text-white italic leading-[0.8]">
                {game.scoreH}<span className="text-blue-600 text-4xl md:text-6xl mx-1">/</span><span className="text-slate-600 text-4xl md:text-6xl">{game.scoreA}</span>
              </div>
            </div>
            <div className="text-right pl-6 border-l border-white/10 hidden md:block">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  {isPreGame ? 'KICKOFF' : 'CLOCK'}
               </div>
               <div className="text-3xl font-black text-white font-mono">{game.clock}</div>
               <div className="text-xs font-bold text-blue-500 uppercase">{game.quarter}</div>
            </div>
          </div>
        </header>

        {/* --- TICKER --- */}
        <div className={`bg-blue-950/20 border border-blue-500/20 p-4 rounded-lg flex items-start md:items-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all ${isFinal ? 'grayscale opacity-70' : ''}`}>
          <MessageSquare size={16} className="text-blue-500 shrink-0 mt-0.5 md:mt-0" />
          <p className="text-xs md:text-sm font-bold text-white italic tracking-tight font-mono leading-tight">
            {game.playDescription}
          </p>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* COL 1: MATCHUP / ODDS */}
          <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-5 h-full flex flex-col justify-center shadow-lg">
              {isPreGame ? (
                <div className="space-y-4 text-center">
                    <div className="flex justify-center text-blue-500 mb-2"><Activity size={24} /></div>
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">VEGAS ODDS</h3>
                    <div className="space-y-3">
                       <div className="bg-white/5 p-3 rounded border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">SPREAD</p>
                          <p className="text-xl font-mono text-white font-bold">{game.odds.spread}</p>
                       </div>
                       <div className="bg-white/5 p-3 rounded border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">OVER/UNDER</p>
                          <p className="text-xl font-mono text-white font-bold">{game.odds.overUnder}</p>
                       </div>
                    </div>
                </div>
              ) : (
                <>
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
                </>
              )}
          </section>

          {/* COL 2 & 3: CENTRAL DASHBOARD */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            
            {/* WIN PROBABILITY */}
            {isPreGame ? (
               <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 md:p-8 relative overflow-hidden min-h-[220px] flex flex-col items-center justify-center shadow-2xl">
                  <CalendarDays size={40} className="text-blue-500 mb-4 opacity-80" />
                  <h2 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase mb-2">Kickoff Scheduled</h2>
                  <div className="text-4xl md:text-6xl font-black text-white font-mono tracking-tighter">{game.clock}</div>
                  <div className="text-xs text-blue-500 mt-2 font-bold uppercase tracking-widest">Awaiting Data Uplink</div>
               </section>
            ) : (
               <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 md:p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-between shadow-2xl">
                  <div className="flex justify-between items-start z-10 relative">
                      <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-blue-500 uppercase italic">
                        Win_Probability_{game.status === 'FINAL' ? 'Final' : 'Live'}
                      </span>
                      <span className="text-6xl md:text-8xl font-black italic text-white tracking-tighter leading-none">
                        {game.winProb}%
                      </span>
                  </div>
                  <div className="relative z-10 mt-2">
                      <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${game.winProb}%` }} 
                          className={`h-full shadow-[0_0_15px_#2563eb] ${isFinal ? 'bg-slate-500' : 'bg-blue-600'}`}
                        />
                      </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-32 opacity-15 pointer-events-none mix-blend-screen">
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
               </section>
            )}

            {/* FIELD POSITION */}
            <section className={`bg-[#0a0c14] border border-white/5 rounded-xl p-5 ${isPreGame || isFinal ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                   <MapPin size={14} /> Drive_Tracker
                 </div>
                 <div className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded">
                    {game.down} @ {game.yl}
                 </div>
               </div>
               <div className="h-14 w-full bg-slate-900/40 rounded border border-white/5 relative flex items-center overflow-hidden shadow-inner">
                  {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((val, i) => (
                      <div key={i} className="absolute h-full w-[1px] bg-white/5 flex flex-col justify-end pb-1" style={{left: `${(i+1)*10}%`}}>
                         <span className="text-[6px] text-white/20 ml-1">{val}</span>
                      </div>
                  ))}
                  {game.possession && !isFinal && (
                    <motion.div 
                      animate={{ left: game.possession === 'NE' ? "65%" : "35%" }} 
                      className="absolute flex flex-col items-center -translate-x-1/2 z-10"
                    >
                      <div className="bg-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-[1px] mb-1 text-white uppercase whitespace-nowrap shadow-lg">
                          {game.possession} BALL
                      </div>
                      <div className="w-2 h-2 bg-white rotate-45 shadow-[0_0_10px_#fff]" />
                    </motion.div>
                  )}
               </div>
            </section>
          </div>

          {/* COL 4: UNIT SELECTOR */}
          <div className="space-y-4">
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2 shrink-0">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {isPreGame ? 'Projected_Starters' : 'Active_Unit_Stats'}
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
                    <p className="text-xs md:text-sm font-bold text-blue-400 font-mono tracking-wider mt-1">
                        {isPreGame ? 'SEASON STATS' : currentUnit.stats}
                    </p>
                    
                    {currentUnit.status !== 'Healthy' && (
                        <div className="mt-3 inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                            <AlertTriangle size={10} />
                            <span className="text-[9px] font-black uppercase">{currentUnit.status}</span>
                        </div>
                    )}
                 </motion.div>
               </AnimatePresence>

               <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {Object.keys(players).map((id) => (
                    <button 
                      key={id} 
                      onClick={() => setActiveUnitId(id)}
                      className={`w-full flex justify-between items-center p-4 transition-all text-left group hover:bg-white/5 ${activeUnitId === id ? 'bg-white/5' : ''}`}
                    >
                       <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-black w-6 ${activeUnitId === id ? 'text-blue-500' : 'text-slate-600'}`}>{id}</span>
                           <span className={`text-[10px] md:text-xs font-bold uppercase italic tracking-wider truncate ${activeUnitId === id ? 'text-white' : 'text-slate-500'}`}>
                             {players[id as keyof typeof players].name}
                           </span>
                       </div>
                       <ChevronRight size={12} className={`transition-colors ${activeUnitId === id ? 'text-blue-500' : 'text-white/5'}`} />
                    </button>
                  ))}
               </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}