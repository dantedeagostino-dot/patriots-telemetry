"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Target, Cpu, ChevronRight, Activity, MapPin, History, Zap, BarChart3 } from "lucide-react";

export default function PatriotsTelemetryPro() {
  const [hasMounted, setHasMounted] = useState(false);
  
  // Estado con estructura real basada en nfl-api1
  const [game, setGame] = useState({
    scoreNE: 35,
    scoreOpp: 3,
    winProb: 98,
    teamStats: {
      totalYards: { ne: 342, opp: 112 },
      possession: { ne: "24:12", opp: "12:10" },
      thirdDown: { ne: "6/8", opp: "1/7" },
      turnovers: { ne: 0, opp: 2 }
    },
    currentDrive: {
      plays: 8,
      yards: 72,
      time: "04:12",
      pos: 88, // Yardas en % para el mapa
      down: "1st & Goal"
    },
    activeUnit: {
      pos: "QB",
      name: "Drake Maye",
      stats: "18/24, 284 YDS, 3 TD"
    }
  });

  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 lg:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- HEADER: LIVE SCORE & STATUS --- */}
        <div className="flex justify-between items-end border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
              Patriots <span className="text-blue-600">Telemetry</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Live Feed • Week 17 • 2Q 01:22</span>
            </div>
          </div>
          <div className="text-6xl font-black tracking-tighter text-white italic">
            {game.scoreNE}<span className="text-blue-600">/</span>{game.scoreOpp}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA PRINCIPAL (ANALYTICS & TACTICAL) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* WIN PROBABILITY SECTION */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-2xl">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Activity size={14} strokeWidth={3} />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase italic">Win_Probability_Trend</span>
                  </div>
                  <span className="text-4xl font-black italic text-white">{game.winProb}%</span>
               </div>
               
               <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${game.winProb}%` }}
                    className="h-full bg-blue-600 relative"
                  >
                    <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />
                  </motion.div>
               </div>

               <div className="h-[180px] w-full opacity-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{p:50},{p:65},{p:85},{p:98}]}>
                      <Area type="monotone" dataKey="p" stroke="#2563eb" strokeWidth={3} fill="#2563eb" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </section>

            {/* TEAM MATCHUP STATS (Recuperado de la API) */}
            <section className="grid grid-cols-4 gap-4">
               {[
                 { label: "Total Yards", ne: game.teamStats.totalYards.ne, opp: game.teamStats.totalYards.opp },
                 { label: "Possession", ne: game.teamStats.possession.ne, opp: game.teamStats.possession.opp },
                 { label: "3rd Down", ne: game.teamStats.thirdDown.ne, opp: game.teamStats.thirdDown.opp },
                 { label: "Turnovers", ne: game.teamStats.turnovers.ne, opp: game.teamStats.turnovers.opp },
               ].map((stat, i) => (
                 <div key={i} className="bg-[#0a0c14] border border-white/5 p-4 rounded-lg group hover:border-blue-500/30 transition-colors">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{stat.label}</span>
                    <div className="flex justify-between items-end">
                       <span className="text-sm font-black text-blue-500 italic">{stat.ne}</span>
                       <span className="text-[10px] font-bold text-slate-700">{stat.opp}</span>
                    </div>
                 </div>
               ))}
            </section>

            {/* TACTICAL DRIVE POSITION */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                    <MapPin size={14} /> Tactical_Positioning
                  </div>
                  <div className="flex gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                     <span className="text-blue-500/50">Plays: {game.currentDrive.plays}</span>
                     <span>Yards: {game.currentDrive.yards}</span>
                  </div>
               </div>
               <div className="h-10 w-full bg-slate-900/50 rounded-lg border border-white/5 relative flex items-center px-2">
                  <motion.div animate={{ left: `${game.currentDrive.pos}%` }} className="absolute flex flex-col items-center -translate-x-1/2">
                    <div className="bg-blue-600 text-[8px] font-bold px-1 py-0.5 rounded-sm mb-1 text-white">NE BALL</div>
                    <div className="w-2.5 h-2.5 bg-white rotate-45 shadow-[0_0_10px_#fff]" />
                  </motion.div>
               </div>
               <div className="grid grid-cols-3 mt-6 pt-4 border-t border-white/5">
                  <div><p className="text-[8px] text-slate-500 uppercase font-bold">Situation</p><p className="text-lg font-black italic text-white uppercase">{game.currentDrive.down}</p></div>
                  <div className="text-center"><p className="text-[8px] text-slate-500 uppercase font-bold">Ball On</p><p className="text-lg font-black italic text-white">OPP 12</p></div>
                  <div className="text-right"><p className="text-[8px] text-slate-500 uppercase font-bold">Drive Time</p><p className="text-lg font-black italic text-blue-500">{game.currentDrive.time}</p></div>
               </div>
            </section>
          </div>

          {/* SIDEBAR (HISTORY & UNITS) */}
          <div className="space-y-6">
            
            {/* SCORING LOG */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <History size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scoring_Log</span>
               </div>
               <div className="p-4 space-y-4">
                  <div className="border-l-2 border-blue-600 pl-3">
                    <p className="text-[10px] font-black text-blue-500">2Q • TD • 01:22</p>
                    <p className="text-xs font-bold text-white uppercase italic">Henry 12yd Pass from Maye</p>
                  </div>
                  <div className="border-l-2 border-slate-700 pl-3 opacity-40">
                    <p className="text-[10px] font-black text-slate-500">2Q • TD • 08:45</p>
                    <p className="text-xs font-bold text-white uppercase italic">Maye 4yd Rush</p>
                  </div>
               </div>
            </section>

            {/* UNIT SELECTOR CON STATS DETALLADAS */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Unit_Selection</span>
               </div>
               <div className="divide-y divide-white/5">
                  <div className="p-4 bg-blue-600/10 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 shadow-[0_0_10px_#2563eb]" />
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black text-blue-500">{game.activeUnit.pos}</span>
                       <Zap size={10} className="text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-sm font-black text-white italic uppercase tracking-widest">{game.activeUnit.name}</p>
                    <p className="text-[10px] font-bold text-blue-400 mt-1 font-mono tracking-tighter">{game.activeUnit.stats}</p>
                  </div>
                  {["RB R. Stevenson", "WR J. Polk"].map((p, i) => (
                    <div key={i} className="p-4 flex justify-between items-center hover:bg-white/5 cursor-pointer group transition-colors">
                       <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-400 uppercase tracking-widest">{p}</span>
                       <ChevronRight size={14} className="text-white/5 group-hover:text-blue-500" />
                    </div>
                  ))}
               </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}