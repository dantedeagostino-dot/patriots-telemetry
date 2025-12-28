"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Activity, MapPin, History, Zap, MessageSquare, ChevronRight } from "lucide-react";

export default function PatriotsTelemetryPro() {
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("QB");
  
  // --- 1. ESTADO DEL RELOJ (Contador en segundos) ---
  const [secondsLeft, setSecondsLeft] = useState(82); // 01:22 = 82 segundos
  const [isPaused, setIsPaused] = useState(false);

  const [game, setGame] = useState({
    homeTeam: "PATRIOTS",
    awayTeam: "NY JETS",
    scoreNE: 35,
    scoreOpp: 3,
    winProb: 98,
    quarter: "2nd",
    lastPlay: "Drake Maye pass short right to Hunter Henry for 12 yards, TOUCHDOWN.",
    units: {
      "QB": { name: "Drake Maye", stats: "18/24, 284 YDS, 3 TD" },
      "RB": { name: "R. Stevenson", stats: "14 CAR, 82 YDS, 1 TD" },
      "TE": { name: "Hunter Henry", stats: "4 REC, 52 YDS, 1 TD" }
    }
  });

  // --- 2. LÓGICA DEL CONTADOR EN TIEMPO REAL ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused && secondsLeft > 0) {
        setSecondsLeft((prev) => prev - 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, secondsLeft]);

  // Formateador de segundos a MM:SS
  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- HEADER: Patriots vs NY Jets --- */}
        <div className="flex justify-between items-start border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
              {game.homeTeam} <span className="text-blue-600">TELEMETRY</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
                LIVE MATCH TRACKER • WEEK 17 • AT {game.awayTeam}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black tracking-tighter text-white">
              {game.scoreNE} - {game.scoreOpp}
            </div>
            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">
              {game.quarter} QUARTER • <span className="text-white font-mono">{formatClock(secondsLeft)}</span>
            </div>
          </div>
        </div>

        {/* PLAY-BY-PLAY */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-4">
          <MessageSquare size={16} className="text-blue-500" />
          <p className="text-sm font-bold text-white italic tracking-tight">{game.lastPlay}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* WIN PROBABILITY */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-2xl">
               <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase italic">Win_Probability</span>
                  <span className="text-4xl font-black italic text-white">{game.winProb}%</span>
               </div>
               <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${game.winProb}%` }} className="h-full bg-blue-600 relative">
                    <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />
                  </motion.div>
               </div>
            </section>

            {/* TACTICAL POSITION */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6">
               <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-6">
                 <MapPin size={14} /> Tactical_Drive_Position
               </div>
               <div className="h-10 w-full bg-slate-900/50 rounded-lg border border-white/5 relative flex items-center shadow-inner">
                  <motion.div animate={{ left: `88%` }} className="absolute flex flex-col items-center -translate-x-1/2">
                    <div className="bg-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-sm mb-1 text-white">NE BALL</div>
                    <div className="w-2.5 h-2.5 bg-white rotate-45 shadow-[0_0_15px_#fff]" />
                  </motion.div>
               </div>
            </section>
          </div>

          {/* SIDEBAR: Unit Selector con Nombres Reales */}
          <div className="space-y-6">
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit_Selector</span>
               </div>
               
               <div className="p-5 bg-blue-600/10 relative border-b border-white/5">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 shadow-[0_0_15px_#2563eb]" />
                  <p className="text-md font-black text-white italic uppercase tracking-widest">{game.units[selectedPlayerId].name}</p>
                  <p className="text-[10px] font-bold text-blue-400 mt-1">{game.units[selectedPlayerId].stats}</p>
               </div>

               <div className="divide-y divide-white/5">
                  {Object.keys(game.units).map((id) => (
                    <button 
                      key={id} 
                      onClick={() => setSelectedPlayerId(id)}
                      className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-all"
                    >
                       <span className="text-[10px] font-black text-slate-600">{id}</span>
                       <span className="text-xs font-bold text-slate-400 uppercase italic">{game.units[id].name}</span>
                       <ChevronRight size={14} className="text-white/10" />
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