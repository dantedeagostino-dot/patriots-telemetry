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
import { motion } from "framer-motion";
import { 
  Target, Cpu, ChevronRight, Activity, 
  Zap, MapPin, History, Trophy, ArrowRight
} from "lucide-react";

// --- DATOS SIMULADOS ---
const CHART_DATA = [
  { time: '1Q', prob: 50 }, { time: '1Q', prob: 48 },
  { time: '2Q', prob: 55 }, { time: '2Q', prob: 52 },
  { time: '3Q', prob: 65 }, { time: '4Q', prob: 75 },
  { time: '4Q', prob: 82 },
];

const SCORING_DATA = [
  { qtr: "1Q", time: "08:22", team: "NE", type: "FG", player: "Joey Slye", score: "3-0", yds: "42" },
  { qtr: "2Q", time: "12:45", team: "NYJ", type: "TD", player: "B. Hall", score: "3-7", yds: "12" },
  { qtr: "3Q", time: "04:10", team: "NE", type: "TD", player: "D. Maye", score: "10-7", yds: "4" },
  { qtr: "4Q", time: "02:00", team: "NE", type: "TD", player: "H. Henry", score: "17-7", yds: "15" },
];

export default function PatriotsFinalDashboard() {
  const [hasMounted, setHasMounted] = useState(false);
  const [winProb] = useState(82);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- HEADER PRINCIPAL --- */}
        <div className="flex justify-between items-start border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
              Patriots <span className="text-blue-600">Telemetry</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Live Match Tracker • Week 17</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black tracking-tighter text-white">28 - 10</div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Final Result</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA Y CENTRAL: ANALYTICS & DRIVE */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. WIN PROBABILITY (DINÁMICO GIF) */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-2xl">
              <div className="flex justify-between items-end mb-6">
                <div className="flex items-center gap-2 text-blue-500">
                  <Activity size={14} strokeWidth={3} />
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase">Win_Probability</span>
                </div>
                <span className="text-4xl font-black italic text-white">{winProb}%</span>
              </div>

              {/* Barra de progreso animada */}
              <div className="relative h-4 w-full bg-[#161925] rounded-full overflow-hidden flex mb-8">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${winProb}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-blue-700 to-blue-400 relative"
                >
                  <motion.div 
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"
                  />
                </motion.div>
                <div style={{ left: `${winProb}%` }} className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#fff] z-10" />
              </div>

              {/* Gráfico Recharts */}
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA}>
                    <defs>
                      <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Area type="monotone" dataKey="prob" stroke="#3b82f6" strokeWidth={3} fill="url(#colorProb)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 2. TACTICAL DRIVE (NUEVO) */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 text-blue-500 mb-6 uppercase tracking-[0.2em] text-[10px] font-black">
                <MapPin size={14} /> Tactical_Drive_Position
              </div>
              
              <div className="relative pt-8 pb-4">
                {/* Campo de juego simplificado */}
                <div className="h-12 w-full bg-slate-900/50 rounded-lg border border-white/5 relative flex items-center px-2">
                  <div className="absolute inset-0 flex justify-between px-2 items-center opacity-20">
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className="h-full w-[1px] bg-white" />
                    ))}
                  </div>
                  {/* Posición del balón */}
                  <motion.div 
                    initial={{ left: "20%" }}
                    animate={{ left: "75%" }}
                    className="absolute z-20 flex flex-col items-center"
                  >
                    <div className="bg-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-sm mb-1 text-white uppercase">NE Ball</div>
                    <div className="w-3 h-3 bg-white rotate-45 shadow-[0_0_10px_#fff]" />
                  </motion.div>
                </div>
                {/* Marcadores de yardas */}
                <div className="flex justify-between mt-2 px-1 text-[9px] font-mono text-slate-600">
                  <span>OWN 0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>TD</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6 border-t border-white/5 pt-6">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Down & Distance</span>
                  <span className="text-lg font-black italic text-white uppercase">1st & 10</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Ball On</span>
                  <span className="text-lg font-black italic text-white uppercase">OPP 25</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Drive Time</span>
                  <span className="text-lg font-black italic text-white uppercase text-blue-500">04:12</span>
                </div>
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: SCORING, EXPERTS & UNIT */}
          <div className="space-y-8">
            
            {/* 3. SCORING HISTORY (NUEVO) */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                <History size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scoring_History</span>
              </div>
              <div className="p-2">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-white/5">
                    {SCORING_DATA.map((score, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <span className="text-[10px] font-black text-blue-500 block">{score.qtr}</span>
                          <span className="text-[9px] text-slate-600">{score.time}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1 rounded ${score.team === 'NE' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                              {score.team}
                            </span>
                            <span className="text-[10px] font-black text-white">{score.type}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase">{score.player} ({score.yds} Yds)</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-xs font-black text-white tracking-tighter italic">{score.score}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. EXPERT ANALYSIS */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-blue-500 uppercase tracking-[0.2em] text-[10px] font-black">
                <Cpu size={14} /> Expert_Analytics
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Expert_Pred</span>
                  <span className="text-xs font-black text-white/40 italic">LOCKED</span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Match_Str</span>
                  <span className="text-xs font-black text-white/20 italic">---</span>
                </div>
              </div>
            </section>

            {/* 5. UNIT SELECTOR (RECONSTRUCCIÓN FIEL) */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                <Target size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit_Selector</span>
              </div>
              <div className="divide-y divide-white/5">
                <div className="relative flex justify-between items-center p-4 bg-blue-600/10 transition-all">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 shadow-[0_0_10px_#2563eb]" />
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-blue-500 w-4">QB</span>
                    <span className="text-xs font-bold tracking-widest text-white uppercase italic">Drake Maye</span>
                  </div>
                  <ChevronRight size={14} className="text-blue-500" />
                </div>
                {["RB R. Stevenson", "WR J. Polk", "TE H. Henry"].map((name, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-700 w-4 uppercase group-hover:text-slate-500">{name.split(' ')[0]}</span>
                      <span className="text-xs font-bold tracking-widest text-slate-500 uppercase italic group-hover:text-slate-300">{name.split(' ').slice(1).join(' ')}</span>
                    </div>
                    <ChevronRight size={14} className="text-white/5 group-hover:text-white/20" />
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