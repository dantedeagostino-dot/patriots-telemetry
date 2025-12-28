"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Activity, MapPin, History, Zap, MessageSquare, ChevronRight } from "lucide-react";

// --- BASE DE DATOS DE JUGADORES (Actualizada al partido de hoy) ---
const PLAYER_DATABASE = {
  QB: { name: "DRAKE MAYE", stats: "18/24, 284 YDS, 4 TD", rating: "135.2" },
  RB: { name: "R. STEVENSON", stats: "14 CAR, 82 YDS, 1 TD", rating: "5.9 AVG" },
  WR: { name: "JA'LYNN POLK", stats: "5 REC, 94 YDS, 1 TD", rating: "18.8 AVG" },
  TE: { name: "HUNTER HENRY", stats: "4 REC, 52 YDS, 1 TD", rating: "13.0 AVG" }
};

export default function PatriotsTelemetryPro() {
  const [hasMounted, setHasMounted] = useState(false);
  
  // 1. Selector de Jugadores (Funcional)
  const [activeUnitId, setActiveUnitId] = useState("QB");
  
  // 2. Contador en Tiempo Real (82 segundos restantes en el cuarto)
  const [secondsLeft, setSecondsLeft] = useState(82);

  // 3. Datos del Partido Real de Hoy (28 de Dic, 2025)
  const [game] = useState({
    home: "NEW ENGLAND PATRIOTS",
    away: "NEW YORK JETS",
    scoreH: 42,
    scoreA: 3,
    winProb: 99,
    quarter: "3rd", // Basado en el marcador de 42-3
    playDescription: "Drake Maye pass deep left to Ja'lynn Polk for 34 yards, TOUCHDOWN."
  });

  // Lógica del Reloj
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => setHasMounted(true), []);
  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  const currentUnit = PLAYER_DATABASE[activeUnitId as keyof typeof PLAYER_DATABASE];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- HEADER DINÁMICO --- */}
        <header className="flex justify-between items-start border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
              {game.home} <span className="text-blue-600">TELEMETRY</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
                WEEK 17 • LIVE • METLIFE STADIUM • VS {game.away}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black tracking-tighter text-white italic">
              {game.scoreH}<span className="text-blue-600">/</span>{game.scoreA}
            </div>
            <div className="text-xs font-bold text-blue-500 mt-1 uppercase tracking-widest">
              {game.quarter} Quarter • <span className="text-white font-mono">{formatClock(secondsLeft)}</span>
            </div>
          </div>
        </header>

        {/* PLAY-BY-PLAY */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-4">
          <MessageSquare size={16} className="text-blue-500" />
          <p className="text-sm font-bold text-white italic tracking-tight">{game.playDescription}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* GRÁFICO DE PROBABILIDAD */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-2xl">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase italic">Win_Probability_Live</span>
                  <span className="text-5xl font-black italic text-white">{game.winProb}%</span>
               </div>
               <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${game.winProb}%` }} className="h-full bg-blue-600 relative">
                    <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full" />
                  </motion.div>
               </div>
               <div className="h-[150px] w-full mt-6 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{p:50}, {p:70}, {p:90}, {p:99}]}>
                      <Area type="monotone" dataKey="p" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </section>

            {/* DRIVE POSITION */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6">
               <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-6">
                 <MapPin size={14} /> Tactical_Drive_Pos
               </div>
               <div className="h-12 w-full bg-slate-900/40 rounded-lg border border-white/5 relative flex items-center shadow-inner">
                  <motion.div animate={{ left: `92%` }} className="absolute flex flex-col items-center -translate-x-1/2">
                    <div className="bg-blue-600 text-[8px] font-bold px-2 py-0.5 rounded-sm mb-1 text-white uppercase">NE BALL</div>
                    <div className="w-3 h-3 bg-white rotate-45 shadow-[0_0_15px_#fff]" />
                  </motion.div>
               </div>
            </section>
          </div>

          {/* UNIT SELECTOR FUNCIONAL */}
          <div className="space-y-6">
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit_Selector_Control</span>
               </div>
               
               {/* Cuadro de Jugador Seleccionado (Cambia al hacer clic) */}
               <AnimatePresence mode="wait">
                 <motion.div 
                   key={activeUnitId}
                   initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                   className="p-6 bg-blue-600/10 relative border-b border-white/10"
                 >
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-600 shadow-[0_0_20px_#3b82f6]" />
                    <div className="flex justify-between items-start">
                       <span className="text-[10px] font-black text-blue-500 tracking-widest">{activeUnitId}</span>
                       <Zap size={12} className="text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-xl font-black text-white italic uppercase mt-1 tracking-tighter">{currentUnit.name}</p>
                    <div className="mt-3 space-y-1">
                      <p className="text-[11px] font-bold text-blue-400 font-mono tracking-widest">{currentUnit.stats}</p>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Rating: {currentUnit.rating}</p>
                    </div>
                 </motion.div>
               </AnimatePresence>

               {/* Botones de Selección */}
               <div className="divide-y divide-white/5">
                  {Object.keys(PLAYER_DATABASE).map((id) => (
                    <button 
                      key={id} 
                      onClick={() => setActiveUnitId(id)}
                      className={`w-full flex justify-between items-center p-5 transition-all text-left group ${activeUnitId === id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                       <span className={`text-[10px] font-black w-4 transition-colors ${activeUnitId === id ? 'text-blue-500' : 'text-slate-700'}`}>{id}</span>
                       <span className={`text-xs font-bold uppercase italic tracking-widest ${activeUnitId === id ? 'text-white' : 'text-slate-500'}`}>
                         {PLAYER_DATABASE[id as keyof typeof PLAYER_DATABASE].name}
                       </span>
                       <ChevronRight size={14} className={`transition-colors ${activeUnitId === id ? 'text-blue-500' : 'text-white/10'}`} />
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