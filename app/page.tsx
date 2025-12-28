"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, MapPin, Zap, MessageSquare, ChevronRight, 
  AlertTriangle, Activity, Wind, Thermometer, 
  BarChart3, Shield 
} from "lucide-react";

// --- CONFIGURACIÓN DE DATOS (MOCKUP) ---
// Simulación inicial que prepara el terreno para tus endpoints /nflboxscore y /game/predictions
const MOCK_GAME_STATE = {
  home: "PATRIOTS", away: "JETS", 
  scoreH: 42, scoreA: 3, 
  winProb: 99, 
  quarter: "4TH", clock: "02:14", 
  playDescription: "(2:14) D.Maye kneels to NE 44 for -1 yards.",
  possession: "NE",
  down: "1st & 10",
  yl: "NE 44",
  stadium: "MetLife Stadium",
  weather: "34°F",
  wind: "12 mph NW",
  // NUEVO: Datos comparativos para llenar el "vacío" (Simulando API Boxscore)
  stats: {
    totalYards: { h: 412, a: 180 },
    passing: { h: 284, a: 115 },
    rushing: { h: 128, a: 65 },
    firstDowns: { h: 24, a: 9 },
    turnovers: { h: 0, a: 3 }
  }
};

const MOCK_PLAYERS = {
  QB: { name: "DRAKE MAYE", stats: "18/24, 284 YDS, 4 TD", rating: "135.2", status: "Healthy" },
  RB: { name: "R. STEVENSON", stats: "14 CAR, 82 YDS, 1 TD", rating: "5.9 AVG", status: "Questionable" },
  WR: { name: "JA'LYNN POLK", stats: "5 REC, 94 YDS, 1 TD", rating: "18.8 AVG", status: "Healthy" },
  TE: { name: "HUNTER HENRY", stats: "4 REC, 52 YDS, 1 TD", rating: "13.0 AVG", status: "Healthy" }
};

// Componente para filas de estadísticas (Tabla Comparativa)
const StatRow = ({ label, h, a }: { label: string, h: number, a: number }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="font-mono text-slate-500 w-8 text-right text-[10px]">{a}</span>
    <span className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em] text-center flex-1">{label}</span>
    <span className="font-mono text-white w-8 text-left text-[10px]">{h}</span>
  </div>
);

export default function PatriotsTelemetryPro() {
  const [hasMounted, setHasMounted] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState("QB");
  // Datos históricos para el gráfico de fondo "lindo"
  const [winHistory] = useState([
    {p:50}, {p:52}, {p:48}, {p:55}, {p:60}, {p:65}, {p:62}, {p:70}, {p:85}, {p:92}, {p:95}, {p:99}, {p:99}
  ]);

  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  const currentUnit = MOCK_PLAYERS[activeUnitId as keyof typeof MOCK_PLAYERS];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 font-sans selection:bg-blue-500/30">
      
      {/* Fondo de "Scanlines" sutil para efecto TV Broadcast */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{backgroundSize: "100% 2px, 3px 100%"}} />

      <div className="relative z-10 max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        
        {/* --- HEADER RESPONSIVE (Se adapta a iPhone) --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-6">
          <div className="space-y-2 w-full md:w-auto">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase flex flex-wrap items-center gap-2 leading-none">
              {MOCK_GAME_STATE.home} <span className="text-blue-600">TELEMETRY</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2 text-red-500 bg-red-900/10 px-2 py-1 rounded border border-red-500/20">
                   <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    <span className="font-bold tracking-widest uppercase">Live</span>
                </div>
                <div className="flex items-center gap-1"><MapPin size={10}/> {MOCK_GAME_STATE.stadium}</div>
                <div className="flex items-center gap-1"><Thermometer size={10}/> {MOCK_GAME_STATE.weather}</div>
            </div>
          </div>

          <div className="flex items-end gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Score</div>
              <div className="text-6xl md:text-8xl font-black tracking-tighter text-white italic leading-[0.8]">
                {MOCK_GAME_STATE.scoreH}<span className="text-blue-600 text-4xl md:text-6xl mx-1">/</span><span className="text-slate-600 text-4xl md:text-6xl">{MOCK_GAME_STATE.scoreA}</span>
              </div>
            </div>
            <div className="text-right pl-6 border-l border-white/10 hidden md:block">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Clock</div>
               <div className="text-3xl font-black text-white font-mono">{MOCK_GAME_STATE.clock}</div>
               <div className="text-xs font-bold text-blue-500 uppercase">{MOCK_GAME_STATE.quarter}</div>
            </div>
          </div>
        </header>

        {/* --- TICKER (Mobile Friendly) --- */}
        <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-lg flex items-start md:items-center gap-3 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
          <MessageSquare size={16} className="text-blue-500 shrink-0 mt-0.5 md:mt-0" />
          <p className="text-xs md:text-sm font-bold text-white italic tracking-tight font-mono leading-tight">{MOCK_GAME_STATE.playDescription}</p>
        </div>

        {/* --- MAIN GRID (1 Columna en Móvil -> 4 Columnas en PC) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* COL 1: MATCHUP STATS (NUEVO - LLENA EL VACÍO) */}
          <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-5 h-full flex flex-col justify-center shadow-lg">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <BarChart3 size={14} className="text-blue-500"/>
                  <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Matchup_Stats</h3>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase mb-2 px-2">
                   <span>NYJ</span>
                   <span>NE</span>
              </div>
              <div className="space-y-1">
                  <StatRow label="Tot Yards" a={MOCK_GAME_STATE.stats.totalYards.a} h={MOCK_GAME_STATE.stats.totalYards.h} />
                  <StatRow label="Passing" a={MOCK_GAME_STATE.stats.passing.a} h={MOCK_GAME_STATE.stats.passing.h} />
                  <StatRow label="Rushing" a={MOCK_GAME_STATE.stats.rushing.a} h={MOCK_GAME_STATE.stats.rushing.h} />
                  <StatRow label="1st Downs" a={MOCK_GAME_STATE.stats.firstDowns.a} h={MOCK_GAME_STATE.stats.firstDowns.h} />
                  <StatRow label="Turnovers" a={MOCK_GAME_STATE.stats.turnovers.a} h={MOCK_GAME_STATE.stats.turnovers.h} />
              </div>
          </section>

          {/* COL 2 & 3: WIN PROBABILITY (DISEÑO RESTAURADO) + FIELD */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            
            {/* 1. WIN PROBABILITY - TU DISEÑO ORIGINAL + MEJORA */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 md:p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-between shadow-2xl">
               {/* Fila Superior: Título a la Izq, Número gigante a la Der */}
               <div className="flex justify-between items-start z-10 relative">
                  <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-blue-500 uppercase italic">
                    Win_Probability_Live
                  </span>
                  <span className="text-6xl md:text-8xl font-black italic text-white tracking-tighter leading-none">
                    {MOCK_GAME_STATE.winProb}%
                  </span>
               </div>

               {/* Centro: Barra de Progreso Limpia */}
               <div className="relative z-10 mt-2">
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${MOCK_GAME_STATE.winProb}%` }} 
                      className="h-full bg-blue-600 shadow-[0_0_15px_#2563eb]"
                    />
                  </div>
               </div>

               {/* Fondo: Gráfico Sutil (Lo hace ver "lindo" y lleno) */}
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

            {/* 2. FIELD POSITION */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-5">
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                   <MapPin size={14} /> Drive_Tracker
                 </div>
                 <div className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded">
                    {MOCK_GAME_STATE.down} @ {MOCK_GAME_STATE.yl}
                 </div>
               </div>
               
               {/* Visualizador de Campo */}
               <div className="h-14 w-full bg-slate-900/40 rounded border border-white/5 relative flex items-center overflow-hidden shadow-inner">
                  {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((val, i) => (
                      <div key={i} className="absolute h-full w-[1px] bg-white/5 flex flex-col justify-end pb-1" style={{left: `${(i+1)*10}%`}}>
                         <span className="text-[6px] text-white/20 ml-1">{val}</span>
                      </div>
                  ))}
                  
                  {/* Marcador de Balón */}
                  <motion.div 
                    initial={{ left: "50%" }}
                    animate={{ left: "65%" }} 
                    className="absolute flex flex-col items-center -translate-x-1/2 z-10"
                  >
                    <div className="bg-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-[1px] mb-1 text-white uppercase whitespace-nowrap shadow-lg">
                        {MOCK_GAME_STATE.possession} BALL
                    </div>
                    <div className="w-2 h-2 bg-white rotate-45 shadow-[0_0_10px_#fff]" />
                  </motion.div>
               </div>
            </section>
          </div>

          {/* COL 4: UNIT SELECTOR (IPHONE FRIENDLY) */}
          <div className="space-y-4">
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2 shrink-0">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active_Unit</span>
               </div>
               
               {/* Panel Principal */}
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
                    
                    {currentUnit.status !== 'Healthy' && (
                        <div className="mt-3 inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                            <AlertTriangle size={10} />
                            <span className="text-[9px] font-black uppercase">{currentUnit.status}</span>
                        </div>
                    )}
                 </motion.div>
               </AnimatePresence>

               {/* Lista Scrollable */}
               <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {Object.keys(MOCK_PLAYERS).map((id) => (
                    <button 
                      key={id} 
                      onClick={() => setActiveUnitId(id)}
                      className={`w-full flex justify-between items-center p-4 transition-all text-left group hover:bg-white/5 ${activeUnitId === id ? 'bg-white/5' : ''}`}
                    >
                       <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-black w-6 ${activeUnitId === id ? 'text-blue-500' : 'text-slate-600'}`}>{id}</span>
                           <span className={`text-[10px] md:text-xs font-bold uppercase italic tracking-wider truncate ${activeUnitId === id ? 'text-white' : 'text-slate-500'}`}>
                             {MOCK_PLAYERS[id as keyof typeof MOCK_PLAYERS].name}
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