"use client";

import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Cpu, 
  ChevronRight, 
  Activity, 
  TrendingUp, 
  ShieldAlert,
  Zap
} from "lucide-react";

// --- DATOS SIMULADOS (Conecta aquí tu API de NFL) ---
const CHART_DATA = [
  { time: '1Q', prob: 50, score: '0-0' },
  { time: '1Q', prob: 48, score: '0-3' },
  { time: '2Q', prob: 55, score: '7-3' },
  { time: '2Q', prob: 52, score: '7-10' },
  { time: '3Q', prob: 65, score: '14-10' },
  { time: '4Q', prob: 75, score: '21-10' },
  { time: '4Q', prob: 82, score: '28-10' },
];

export default function PatriotsDashboard() {
  const [hasMounted, setHasMounted] = useState(false);
  const [currentWinProb, setCurrentWinProb] = useState(82);

  // 1. SOLUCIÓN AL ERROR width(-1): 
  // Evita que Recharts intente dibujar antes de que el DOM esté listo en Next.js
  useEffect(() => {
    setMountedLogic();
  }, []);

  const setMountedLogic = () => {
    setHasMounted(true);
  };

  if (!hasMounted) {
    return <div className="min-h-screen bg-[#02040a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 font-sans">
      
      {/* --- NAVEGACIÓN SUPERIOR / HEADER --- */}
      <nav className="border-b border-white/5 bg-[#05070f] p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-1.5 rounded-md">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">
                Patriots<span className="text-blue-500">Analytics</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Live Data Feed</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-bold tracking-widest uppercase text-slate-500">
            <span className="hover:text-white cursor-pointer transition-colors">Matchup</span>
            <span className="hover:text-white cursor-pointer transition-colors">Draft</span>
            <span className="text-blue-500">Live Tracker</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        
        {/* --- SECCIÓN 1: WIN PROBABILITY (ESTILO DINÁMICO GIF) --- */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-500 px-1">
            <Activity size={16} strokeWidth={3} />
            <h3 className="text-[11px] font-black tracking-[0.3em] uppercase">Win_Probability_Live</h3>
          </div>

          <div className="bg-[#0a0c14] border border-white/5 rounded-xl p-8 relative overflow-hidden group shadow-2xl">
            {/* Efecto decorativo de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
            
            <div className="flex justify-between items-end mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-6xl font-black italic tracking-tighter text-white">
                    {currentWinProb}%
                  </h2>
                  <div className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                    <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">+2.4% last drive</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase italic">New England Patriots</p>
              </div>
              
              <div className="text-right pb-1">
                <span className="text-3xl font-black text-white/10 italic tracking-tighter">
                  {100 - currentWinProb}% OPPONENT
                </span>
              </div>
            </div>

            {/* BARRA DE PROGRESO TIPO GIF */}
            <div className="relative h-5 w-full bg-[#161925] rounded-full overflow-hidden flex shadow-inner border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentWinProb}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-blue-700 to-blue-500 relative"
              >
                {/* EFECTO DE MOVIMIENTO DE LUZ (EL "GIF") */}
                <motion.div 
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"
                />
              </motion.div>
              
              {/* INDICADOR CENTRAL DINÁMICO */}
              <motion.div 
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  boxShadow: ["0 0 10px #fff", "0 0 25px #fff", "0 0 10px #fff"]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ left: `${currentWinProb}%` }}
                className="absolute top-0 bottom-0 w-[3px] bg-white z-20"
              />
            </div>

            {/* GRÁFICO DE TENDENCIA (FIXED) */}
            <div className="h-[220px] w-full mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0f121d] border border-white/10 p-3 rounded-lg shadow-xl">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{payload[0].payload.time}</p>
                            <p className="text-lg font-black text-blue-500">{payload[0].value}% Win Prob</p>
                            <p className="text-[9px] font-mono text-white/40 mt-1">SCORE: {payload[0].payload.score}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke="#ffffff10" strokeDasharray="3 3" />
                  <Area 
                    type="monotone" 
                    dataKey="prob" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorProb)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* --- SECCIÓN 2: PICKCENTER EXPERT ANALYSIS --- */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-blue-500 px-1">
            <Cpu size={16} />
            <h3 className="text-[11px] font-black tracking-[0.3em] uppercase italic">Pickcenter_Expert_Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative group transition-all hover:border-white/10">
              <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase block mb-3">Expert_Prediction</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/5 p-2 rounded-lg">
                    <ShieldAlert size={18} className="text-white/20" />
                  </div>
                  <span className="text-2xl font-black tracking-tighter text-white/30 uppercase italic">Locked</span>
                </div>
                <div className="bg-red-500/5 px-3 py-1 rounded-full border border-red-500/10">
                  <span className="text-[9px] font-bold text-red-500/50 uppercase">Live Game</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 group transition-all hover:border-white/10">
              <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase block mb-3">Matchup_Strength</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black tracking-tighter text-white/10 uppercase italic">---</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-1 w-6 bg-white/5 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN 3: UNIT SELECTOR (RECONSTRUCCIÓN FIEL) --- */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-blue-500 px-1">
            <Target size={16} />
            <h3 className="text-[11px] font-black tracking-[0.3em] uppercase italic">Unit_Selector</h3>
          </div>

          <div className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            {/* Cabecera del selector */}
            <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Primary Starters</span>
              <Zap size={14} className="text-blue-500" />
            </div>

            <div className="divide-y divide-white/5">
              {/* JUGADOR ACTIVO */}
              <div className="relative flex justify-between items-center p-5 bg-blue-600/5 transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                <div className="flex items-center gap-8">
                  <span className="text-xs font-black text-blue-500 w-8 italic">QB</span>
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold tracking-widest text-white uppercase italic">Drake Maye</span>
                    <div className="flex gap-4">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Comp: 18/24</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Yds: 215</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-blue-400 block tracking-widest uppercase">Rating</span>
                    <span className="text-xs font-black text-white">108.4</span>
                  </div>
                  <ChevronRight size={18} className="text-blue-500" />
                </div>
              </div>

              {/* OTROS JUGADORES */}
              {[
                { pos: "RB", name: "R. Stevenson", stats: "84 YDS" },
                { pos: "WR", name: "Ja'lynn Polk", stats: "3 REC" },
                { pos: "TE", name: "Hunter Henry", stats: "1 TD" },
                { pos: "CB", name: "C. Gonzalez", stats: "2 INT" }
              ].map((player) => (
                <div key={player.pos} className="flex justify-between items-center p-5 hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-8">
                    <span className="text-xs font-black text-slate-600 w-8 italic group-hover:text-blue-400/50">{player.pos}</span>
                    <span className="text-sm font-bold tracking-widest text-slate-400 uppercase italic group-hover:text-slate-200">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{player.stats}</span>
                    <ChevronRight size={16} className="text-white/5 group-hover:text-white/20 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
      
      {/* Footer / Copyright */}
      <footer className="p-12 text-center">
        <p className="text-[9px] font-bold text-slate-700 tracking-[0.5em] uppercase">
          Neural Analytics Engine © 2025 • End-to-End Encryption
        </p>
      </footer>
    </div>
  );
}