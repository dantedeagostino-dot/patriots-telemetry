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
  if (!data || data.length === 0) {
    return <div className="h-full w-full bg-slate-900/10 animate-pulse rounded" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '4px', fontSize: '10px' }}
          itemStyle={{ color: '#fff' }}
        />
        <Line type="monotone" dataKey="pats" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="opp" stroke="#475569" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}