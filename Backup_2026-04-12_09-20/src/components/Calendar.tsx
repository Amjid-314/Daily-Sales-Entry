import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  holidays?: string[];
}

export const Calendar: React.FC<CalendarProps> = ({ currentDate, onDateChange, holidays = [] }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => onDateChange(new Date(year, month - 1, 1));
  const nextMonth = () => onDateChange(new Date(year, month + 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = holidays.includes(dateStr);
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const isSunday = new Date(year, month, d).getDay() === 0;

    days.push(
      <div
        key={d}
        className={`h-8 w-8 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all
          ${isToday ? 'bg-seablue text-white shadow-lg shadow-seablue/20' : ''}
          ${isHoliday ? 'bg-red-50 text-red-500 border border-red-100' : ''}
          ${isSunday && !isToday ? 'text-red-400' : !isToday ? 'text-slate-600 hover:bg-slate-100' : ''}
        `}
      >
        {d}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-black text-seablue uppercase tracking-widest">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className={`text-center text-[9px] font-black ${i === 0 ? 'text-red-400' : 'text-slate-300'}`}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
};
