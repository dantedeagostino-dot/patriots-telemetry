"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Cpu, ChevronRight, Activity, MapPin, History, Zap, MessageSquare } from "lucide-react";

// --- DATOS TÉCNICOS DE UNIDADES (Basado en el partido real) ---
const UNITS_DATA = {
  QB: { pos: "QB", name: "Drake Maye", stats: "18/24, 284 YDS, 3 TD" },
  RB: { pos: "RB", name: "R. Stevenson", stats: "14 CAR, 82 YDS, 1 TD" },
  WR: { pos: "WR", name: "Ja'lynn Polk", stats: "5 REC, 94 YDS, 1 TD" },
  TE: { pos: "TE", name: "Hunter Henry", stats: "4 REC, 52 YDS, 1 TD" }
};

export default function PatriotsTelemetryPro() {
  const [hasMounted, setHasMounted] = useState(false);
  
  // 1. ESTADO PARA EL SELECTOR
  const [activeUnitId, setActiveUnitId] = useState("QB");
  
  // 2. ESTADO PARA EL RELOJ (En segundos: 01:22 = 82s)
  const [secondsLeft, setSecondsLeft] = useState(82);

  // Datos del partido
  const [game, setGame] = useState({
    homeTeam: "PATRIOTS",
    awayTeam: "NY JETS",
    scoreHome: 35,
    scoreAway: 3,
    winProb: 98,
    quarter: "2nd",
    teamStats: {
      totalYards: { ne: 342, opp: 112 },
      possession: { ne: "24:12", opp: "12:10" },
      thirdDown: { ne: "6/8", opp: "1/7" },
      turnovers: { ne: 0, opp: 2 }
    }
  });

  // --- LÓGICA DEL CONTADOR EN TIEMPO REAL ---
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formateador de MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  const activeUnit = UNITS_DATA[activeUnitId as keyof typeof UNITS_DATA];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 lg:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- HEADER: Matchup & Live Clock --- */}
        <div className="flex justify-between items-end border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
              {game.homeTeam} <span className="text-blue-600">Telemetry</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
                Week 17 • Live AT {game.awayTeam} • {game.quarter} Quarter
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black tracking-tighter text-white italic">
              {game.scoreHome}<span className="text-blue-600">/</span>{game.scoreAway}
            </div>
            <p className="text-blue-500 font-mono font-bold text-xs tracking-widest mt-1">
              GAME CLOCK: {formatTime(secondsLeft)}
            </p>
          </div>
        </div>

        {/* --- PLAY-BY-PLAY TICKER --- */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-4">
          <MessageSquare size={16} className="text-blue-500" />
          <p className="text-sm font-bold text-white italic tracking-tight">
            Drake Maye pass short right to Hunter Henry for 12 yards, TOUCHDOWN.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* WIN PROBABILITY */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-2xl">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Activity size={14} strokeWidth={3} />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase italic">Win_Probability</span>
                  </div>
                  <span className="text-4xl font-black italic text-white">{game.winProb}%</span>
               </div>
               <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-6">
                  <motion.div animate={{ width: `${game.winProb}%` }} className="h-full bg-blue-600 relative">
                    <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />
                  </motion.div>
               </div>
               <div className="h-[150px] w-full opacity-30">
                  <ResponsiveContainer width="100%" height="100%"><AreaChart data={[{p:50},{p:98}]}><Area type="monotone" dataKey="p" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} /></AreaChart></ResponsiveContainer>
               </div>
            </section>

            {/* TEAM MATCHUP EFFICIENCY */}
            <section className="grid grid-cols-4 gap-4">
               {[
                 { label: "Total Yards", ne: game.teamStats.totalYards.ne, opp: game.teamStats.totalYards.opp },
                 { label: "Possession", ne: game.teamStats.possession.ne, opp: game.teamStats.possession.opp },
                 { label: "3rd Down", ne: game.teamStats.thirdDown.ne, opp: game.teamStats.thirdDown.opp },
                 { label: "Turnovers", ne: game.teamStats.turnovers.ne, opp: game.teamStats.turnovers.opp },
               ].map((stat, i) => (
                 <div key={i} className="bg-[#0a0c14] border border-white/5 p-4 rounded-lg">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{stat.label}</span>
                    <div className="flex justify-between items-end">
                       <span className="text-sm font-black text-blue-500 italic">{stat.ne}</span>
                       <span className="text-[10px] font-bold text-slate-700">{stat.opp}</span>
                    </div>
                 </div>
               ))}
            </section>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            
            {/* UNIT SELECTOR (Arreglado y Funcional) */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit_Selector</span>
               </div>
               
               {/* Cuadro de Jugador Seleccionado */}
               <AnimatePresence mode="wait">
                 <motion.div 
                   key={activeUnitId}
                   initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                   className="p-5 bg-blue-600/10 relative border-b border-white/5"
                 >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 shadow-[0_0_15px_#2563eb]" />
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black text-blue-500">{activeUnit.pos}</span>
                       <Zap size={10} className="text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-md font-black text-white italic uppercase tracking-widest">{activeUnit.name}</p>
                    <p className="text-[10px] font-bold text-blue-400 mt-1 font-mono">{activeUnit.stats}</p>
                 </motion.div>
               </AnimatePresence>

               {/* Botones de Selección */}
               <div className="divide-y divide-white/5">
                  {Object.entries(UNITS_DATA).map(([id, player]) => (
                    <button 
                      key={id} 
                      onClick={() => setActiveUnitId(id)}
                      className={`w-full flex justify-between items-center p-4 transition-all hover:bg-white/5 ${activeUnitId === id ? 'bg-white/5' : ''}`}
                    >
                       <span className="text-[10px] font-black text-slate-600 w-4">{id}</span>
                       <span className="text-xs font-bold tracking-widest text-slate-400 uppercase italic">{player.name}</span>
                       <ChevronRight size={14} className={activeUnitId === id ? "text-blue-500" : "text-white/10"} />
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