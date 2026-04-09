import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkLog } from '../lib/gemini';
import { isSameDay } from 'date-fns';

interface CalendarViewProps {
  logs: WorkLog[];
}

export function CalendarView({ logs }: CalendarViewProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const loggedDays = logs.map(log => new Date(log.timestamp));

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm">
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          modifiers={{
            logged: loggedDays,
          }}
          modifiersStyles={{
            logged: { 
              fontWeight: 'bold', 
              color: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px'
            }
          }}
        />
      </div>
      <div className="mt-8 space-y-4">
        <h4 className="text-xs font-black tracking-widest text-zinc-500 uppercase">Selected Date Activity</h4>
        {date && logs.filter(l => isSameDay(new Date(l.timestamp), date)).length > 0 ? (
          <div className="space-y-3">
            {logs.filter(l => isSameDay(new Date(l.timestamp), date)).map(log => (
              <div key={log.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <p className="text-sm font-bold text-emerald-500">{log.title}</p>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{log.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-600 italic">No logs for this date.</p>
        )}
      </div>
    </div>
  );
}
