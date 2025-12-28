"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Target, MapPin, Zap, MessageSquare, ChevronRight, AlertTriangle, Loader2, Activity } from "lucide-react";

// --- CONFIGURACIÓN DE API (Opcional para probar) ---
const API_CONFIG = {
  key: "TU_API_KEY_AQUI", // Reemplazar con tu key de RapidAPI
  host: "nfl-api-data.p.rapidapi.com",
  patriotsId: "17", // ID oficial de NE Patriots
  date: { year: "2025", month: "12", day: "28" }
};

// Datos iniciales (Skeleton)
const INITIAL_PLAYER_DB = {
  QB: { name: "DRAKE MAYE", stats: "Initializing...", rating: "--", status: "Healthy" },
  RB: { name: "R. STEVENSON", stats: "Initializing...", rating: "--", status: "Healthy" },
  WR: { name: "JA'LYNN POLK", stats: "Initializing...", rating: "--", status: "Healthy" },
  TE: { name: "HUNTER HENRY", stats: "Initializing...", rating: "--", status: "Healthy" }
};

export default function PatriotsTelemetryPro() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados de la UI
  const [activeUnitId, setActiveUnitId] = useState("QB");
  const [playerData, setPlayerData] = useState(INITIAL_PLAYER_DB);
  const [winProbHistory, setWinProbHistory] = useState([{p:50}]);
  
  const [game, setGame] = useState({
    home: "PATRIOTS",
    away: "JETS",
    scoreH: 0,
    scoreA: 0,
    winProb: 50,
    quarter: "PRE",
    clock: "00:00",
    playDescription: "ESTABLISHING UPLINK WITH METLIFE STADIUM...",
    possession: "NE",
    odds: { spread: "NE -3.5", overUnder: "42.5" } // Valor por defecto
  });

  // --- FUNCIÓN MAESTRA DE TELEMETRÍA ---
  const fetchTelemetry = async () => {
    // Si no hay API Key configurada, usamos simulación para no romper la UI
    if (API_CONFIG.key === "TU_API_KEY_AQUI") {
      simulateLiveFeed();
      return;
    }

    try {
      const headers = {
        'X-RapidAPI-Key': API_CONFIG.key,
        'X-RapidAPI-Host': API_CONFIG.host
      };

      // 1. Obtener Game ID desde el Scoreboard (GET /nflscoreboard)
      const scoreRes = await fetch(`https://${API_CONFIG.host}/nflscoreboard?year=${API_CONFIG.date.year}&month=${API_CONFIG.date.month}&day=${API_CONFIG.date.day}`, { headers });
      const scoreData = await scoreRes.json();
      
      // Buscar el partido de los Patriots
      const match = scoreData.events?.find((e: any) => e.name.toLowerCase().includes("patriots"));
      
      if (!match) {
          console.warn("No se encontró partido activo para la fecha.");
          setIsLoading(false);
          return;
      }

      const gameId = match.id;
      const compet = match.competitions[0];
      const homeTeam = compet.competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = compet.competitors.find((c: any) => c.homeAway === 'away');

      // 2. Ejecutar llamadas paralelas para optimizar velocidad (GET /boxscore, /play, /predictions)
      const [boxRes, playRes, predRes, oddsRes] = await Promise.all([
        fetch(`https://${API_CONFIG.host}/nflboxscore?id=${gameId}`, { headers }),
        fetch(`https://${API_CONFIG.host}/nflplay?id=${gameId}`, { headers }),
        fetch(`https://${API_CONFIG.host}/game/predictions?eventId=${gameId}`, { headers }),
        fetch(`https://${API_CONFIG.host}/odds`, { headers }) // Para líneas de apuestas
      ]);

      const boxData = await boxRes.json();
      const playData = await playRes.json();
      const predData = await predRes.json();
      const oddsData = await oddsRes.json();

      // --- MAPEO DE DATOS ---
      
      // A. Estado del Juego
      const lastPlay = playData.items?.[playData.items.length - 1];
      const currentWinProb = predData.winProbability ? Math.round(predData.winProbability * 100) : 50;

      setGame(prev => ({
        home: homeTeam.team.shortDisplayName.toUpperCase(),
        away: awayTeam.team.shortDisplayName.toUpperCase(),
        scoreH: parseInt(homeTeam.score),
        scoreA: parseInt(awayTeam.score),
        winProb: currentWinProb,
        quarter: match.status.period > 4 ? "OT" : `Q${match.status.period}`,
        clock: match.status.displayClock,
        playDescription: lastPlay?.text || "TV Timeout / Commercial Break",
        possession: match.status.possession === API_CONFIG.patriotsId ? "NE" : "OPP",
        odds: { spread: "NE -7.5", overUnder: "44.5" } // Simplificado para el ejemplo
      }));

      // B. Gráfico Histórico
      setWinProbHistory(prev => [...prev.slice(-19), { p: currentWinProb }]);

      // C. Stats de Jugadores (Ejemplo simplificado de extracción del boxscore)
      // En producción, iterarías sobre boxData.boxscore.players para hallar los IDs exactos
      if (boxData.boxscore) {
         setPlayerData(prev => ({
           ...prev,
           QB: { ...prev.QB, stats: "19/25, 284 YDS, 3 TD", rating: "135.2" }, 
           RB: { ...prev.RB, stats: "14 CAR, 82 YDS, 1 TD", rating: "5.9 AVG" }
         }));
      }

      setIsLoading(false);

    } catch (error) {
      console.error("Error en Telemetría:", error);
      simulateLiveFeed(); // Fallback a simulación si falla la API
    }
  };

  // Simulación para demostración visual (Borrar cuando tengas la API Key)
  const simulateLiveFeed = () => {
    setTimeout(() => {
        setGame({
            home: "PATRIOTS", away: "JETS", scoreH: 42, scoreA: 3, winProb: 99, 
            quarter: "4th", clock: "02:14", possession: "NE",
            playDescription: "(2:14) D.Maye kneels to NE 44 for -1 yards.",
            odds: { spread: "NE -7.5", overUnder: "44.5" }
        });
        setPlayerData({
            QB: { name: "DRAKE MAYE", stats: "18/24, 284 YDS, 4 TD", rating: "135.2", status: "Healthy" },
            RB: { name: "R. STEVENSON", stats: "14 CAR, 82 YDS, 1 TD", rating: "5.9", status: "Questionable" }, // Ejemplo lesión
            WR: { name: "JA'LYNN POLK", stats: "5 REC, 94 YDS, 1 TD", rating: "18.8", status: "Healthy" },
            TE: { name: "HUNTER HENRY", stats: "4 REC, 52 YDS, 1 TD", rating: "13.0", status: "Healthy" }
        });
        setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    setHasMounted(true);
    fetchTelemetry();
    // Polling cada 15 segundos
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!hasMounted) return <div className="min-h-screen bg-[#02040a]" />;

  const currentUnit = playerData[activeUnitId as keyof typeof playerData];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 p-4 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-start border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
              {game.home} <span className="text-blue-600">TELEMETRY</span>
            </h1>
            
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 md:items-center">
                <div className="flex items-center gap-3">
                  {isLoading ? (
                     <Loader2 className="animate-spin text-blue-600 h-3 w-3"/>
                  ) : (
                     <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  )}
                  <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
                    WEEK 17 • LIVE FEED
                  </span>
                </div>
                
                {/* NUEVO: ODDS INTEGRATION */}
                {!isLoading && (
                    <div className="hidden md:flex gap-3 text-[10px] font-mono text-blue-500/80 border-l border-white/10 pl-4">
                       <span className="flex items-center gap-1"><Activity size={10}/> LINE: {game.odds.spread}</span>
                       <span>O/U: {game.odds.overUnder}</span>
                    </div>
                )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-6xl font-black tracking-tighter text-white italic">
              {game.scoreH}<span className="text-blue-600">/</span>{game.scoreA}
            </div>
            <div className="text-xs font-bold text-blue-500 mt-1 uppercase tracking-widest">
              {game.quarter} • <span className="text-white font-mono">{game.clock}</span>
            </div>
          </div>
        </header>

        {/* PLAY TICKER */}
        <motion.div 
          key={game.playDescription} 
          initial={{ x: -20, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-4"
        >
          <MessageSquare size={16} className="text-blue-500 shrink-0" />
          <p className="text-sm font-bold text-white italic tracking-tight truncate">{game.playDescription}</p>
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
                  <motion.div 
                    animate={{ width: `${game.winProb}%` }} 
                    transition={{ duration: 1 }}
                    className="h-full bg-blue-600 relative"
                  >
                    <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full" />
                  </motion.div>
               </div>
               <div className="h-[150px] w-full mt-6 opacity-30 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={winProbHistory}>
                      <Area type="monotone" dataKey="p" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </section>

            {/* DRIVE POSITION */}
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl p-6">
               <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-6">
                 <MapPin size={14} /> Tactical_Drive_Pos
               </div>
               <div className="h-12 w-full bg-slate-900/40 rounded-lg border border-white/5 relative flex items-center shadow-inner overflow-hidden">
                  {[20, 40, 50, 40, 20].map((val, i) => (
                      <div key={i} className="absolute h-full w-[1px] bg-white/5" style={{left: `${(i+1)*16.6}%`}} />
                  ))}
                  
                  {/* Animación basada en posesión */}
                  <motion.div 
                    animate={{ left: game.possession === 'NE' ? '80%' : '20%' }} 
                    className="absolute flex flex-col items-center -translate-x-1/2 transition-all duration-1000"
                  >
                    <div className="bg-blue-600 text-[8px] font-bold px-2 py-0.5 rounded-sm mb-1 text-white uppercase whitespace-nowrap">
                        {game.possession} BALL
                    </div>
                    <div className="w-3 h-3 bg-white rotate-45 shadow-[0_0_15px_#fff]" />
                  </motion.div>
               </div>
            </section>
          </div>

          {/* UNIT SELECTOR */}
          <div className="space-y-6">
            <section className="bg-[#0a0c14] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active_Unit_Stats</span>
               </div>
               
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
                    
                    <div className="mt-3 space-y-2">
                      <p className="text-[12px] font-bold text-blue-400 font-mono tracking-widest">{currentUnit.stats}</p>
                      
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Rating: {currentUnit.rating}</p>
                        
                        {/* NUEVO: ALERTA DE LESIÓN */}
                        {currentUnit.status !== 'Healthy' && (
                            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                                <AlertTriangle size={10} />
                                <span className="text-[8px] font-black uppercase tracking-wide">{currentUnit.status}</span>
                            </div>
                        )}
                      </div>
                    </div>
                 </motion.div>
               </AnimatePresence>

               <div className="divide-y divide-white/5">
                  {Object.keys(playerData).map((id) => (
                    <button 
                      key={id} 
                      onClick={() => setActiveUnitId(id)}
                      className={`w-full flex justify-between items-center p-5 transition-all text-left group ${activeUnitId === id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                       <span className={`text-[10px] font-black w-4 transition-colors ${activeUnitId === id ? 'text-blue-500' : 'text-slate-700'}`}>{id}</span>
                       <span className={`text-xs font-bold uppercase italic tracking-widest ${activeUnitId === id ? 'text-white' : 'text-slate-500'}`}>
                         {playerData[id as keyof typeof playerData].name}
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