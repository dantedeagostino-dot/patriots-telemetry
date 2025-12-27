'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function ScoreTrendChart({ data }: { data: any[] }) {
  // Verificación de seguridad para evitar errores si no hay datos
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-700 text-[10px] border border-dashed border-slate-800 rounded">
        AWAITING_DATA_UPLINK...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '4px', fontSize: '10px' }}
          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
        />
        <Line 
          type="monotone" 
          dataKey="pats" 
          stroke="#3b82f6" 
          strokeWidth={3} 
          dot={false} 
          isAnimationActive={false}
        />
        <Line 
          type="monotone" 
          dataKey="opp" 
          stroke="#475569" 
          strokeWidth={2} 
          dot={false} 
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}