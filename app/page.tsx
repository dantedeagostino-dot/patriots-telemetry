"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Cpu, ChevronRight, Activity, MapPin, History, Zap, MessageSquare } from "lucide-react";

export default function PatriotsTelemetryFinal() {
  const [hasMounted, setHasMounted] = useState(false);
  
  // --- 1. MEMORIA DEL SELECTOR (Estado) ---
  const [selectedPlayerId, setSelectedPlayerId] = useState("QB");

  // --- 2. DATOS DE LA API (Estructura recuperada) ---
  const [game, setGame] = useState({
    scoreNE: 35, scoreNYJ: 3, winProb: 98,
    quarter: "2nd", clock: "01:22",
    lastPlay: "Drake Maye pass short right to Hunter Henry for 12 yards, TOUCHDOWN.",
    teamStats: [
      { label: "Total Yards", ne: 342, opp: 112 },
      { label: "Possession", ne: "24:12", opp: "12:10" },
      { label: "3rd Down", ne: "6/8", opp: "1/7" }
    ],
    // Lista de unidades para el selector
    units: {
      "QB": { name: "Drake Maye", stats: "18/24, 284 YDS, 3 TD", rating: "118.4" },
      "RB": { name: "R. Stevenson", stats: "14 CAR, 82 YDS, 1 TD", rating: "5.9 AVG" },
      "WR": { name: "Ja'lynn Polk", stats: "5 REC, 94 YDS, 1 TD", rating: "18.8 AVG" },
      "TE": { name: "Hunter Henry", stats: "4 REC, 52 YDS, 1 TD", rating: "13.0 AVG" }
    }
  });

  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  const activeUnit = game.units[selectedPlayerId];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER & SCORE */}
        <div className="flex justify-between items-end border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
              Patriots <span className="text-blue-600">Telemetry</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
              Live Feed • Week 17 • {game.quarter} {game.clock}
            </span>
          </div>
          <div className="text-6xl font-black tracking-tighter text-white italic">
            {game.scoreNE}<span className="text-blue-600">/</span>{game.scoreNYJ}
          </div>
        </div>

        {/* PLAY-BY-PLAY TICKER */}
        <motion.div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-4">
          <MessageSquare size={16} className="text-blue-500" />
          <p className="text-sm font-bold text-white italic tracking-tight">{game.lastPlay}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* WIN PROBABILITY */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase italic">Win_Probability</span>
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

            {/* TEAM MATCHUP STATS (Nueva Sección API) */}
            <section className="grid grid-cols-3 gap-4">
               {game.teamStats.map((stat, i) => (
                 <div key={i} className="bg-[#0a0c14] border border-white/5 p-4 rounded-lg">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                    <div className="flex justify-between items-end">
                       <span className="text-lg font-black text-blue-500 italic">{stat.ne}</span>
                       <span className="text-xs font-bold text-slate-700">{stat.opp}</span>
                    </div>
                 </div>
               ))}
            </section>

            {/* TACTICAL POSITION */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6">
               <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-6">
                 <MapPin size={14} /> Tactical_Drive_Pos
               </div>
               <div className="h-10 w-full bg-slate-900/50 rounded-lg border border-white/5 relative flex items-center shadow-inner">
                  <motion.div animate={{ left: `88%` }} className="absolute flex flex-col items-center -translate-x-1/2">
                    <div className="bg-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-sm mb-1 text-white">NE BALL</div>
                    <div className="w-2.5 h-2.5 bg-white rotate-45 shadow-[0_0_15px_#fff]" />
                  </motion.div>
               </div>
               <div className="grid grid-cols-2 mt-6 pt-4 border-t border-white/5">
                  <div><p className="text-[8px] text-slate-500 uppercase font-bold">Situation</p><p className="text-lg font-black italic text-white uppercase">1st & Goal</p></div>
                  <div className="text-right"><p className="text-[8px] text-slate-500 uppercase font-bold">Ball On</p><p className="text-lg font-black italic text-blue-500 uppercase">OPP 12</p></div>
               </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            
            {/* UNIT SELECTOR DINÁMICO */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit_Selector</span>
               </div>
               
               {/* Visualización del jugador ACTIVO */}
               <AnimatePresence mode="wait">
                 <motion.div 
                   key={selectedPlayerId}
                   initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                   className="p-5 bg-blue-600/10 relative border-b border-white/5"
                 >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 shadow-[0_0_15px_#2563eb]" />
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black text-blue-500">{selectedPlayerId}</span>
                       <Zap size={10} className="text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-md font-black text-white italic uppercase tracking-widest">{activeUnit.name}</p>
                    <p className="text-[10px] font-bold text-blue-400 mt-1 font-mono">{activeUnit.stats}</p>
                 </motion.div>
               </AnimatePresence>

               {/* LISTA DE SELECCIÓN */}
               <div className="divide-y divide-white/5">
                  {Object.keys(game.units).map((id) => (
                    <button 
                      key={id} 
                      onClick={() => setSelectedPlayerId(id)}
                      className={`w-full flex justify-between items-center p-4 transition-all hover:bg-white/5 ${selectedPlayerId === id ? 'opacity-30 pointer-events-none' : ''}`}
                    >
                       <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-slate-600 w-4">{id}</span>
                         <span className="text-xs font-bold tracking-widest text-slate-400 uppercase italic">{game.units[id].name}</span>
                       </div>
                       <ChevronRight size={14} className="text-white/10" />
                    </button>
                  ))}
               </div>
            </section>

            {/* SCORING HISTORY */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <History size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Scoring_Log</span>
               </div>
               <div className="p-4 space-y-4">
                  <div className="border-l-2 border-blue-600 pl-3">
                    <p className="text-[10px] font-black text-blue-500">2Q • TD • 01:22</p>
                    <p className="text-xs font-bold text-white uppercase italic">Henry 12yd Pass from Maye</p>
                  </div>
               </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}