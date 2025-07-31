import { useState } from 'react';
import { getLeavesByDate } from '../utils/leaveData';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDays(current) {
  const year = current.getFullYear();
  const month = current.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 0; i < first.getDay(); i++) {
    days.push(null);
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const remaining = 7 - (days.length % 7 || 7);
  for (let i = 0; i < remaining; i++) {
    days.push(null);
  }
  return days;
}

export default function CalendarView() {
  const [current, setCurrent] = useState(new Date());
  const today = new Date();

  const days = getDays(current);

  const monthLabel = current.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  const prevMonth = () =>
    setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="px-2 py-1 border rounded">Prev</button>
        <h2 className="text-xl font-semibold">{monthLabel}</h2>
        <button onClick={nextMonth} className="px-2 py-1 border rounded">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-300 text-center">
        {WEEK_DAYS.map(d => (
          <div key={d} className="p-2 font-semibold bg-gray-200">
            {d}
          </div>
        ))}
        {days.map((d, idx) => {
          if (!d) {
            return <div key={idx} className="h-24 bg-white"></div>;
          }
          const dateStr = d.toISOString().split('T')[0];
          const dayLeaves = getLeavesByDate(dateStr);
          const isFuture = d > today;
          return (
            <div
              key={dateStr}
              className={`relative h-24 p-1 border bg-white group ${
                isFuture ? 'bg-gray-100 text-gray-400' : ''
              }`}
            >
              <div className="text-sm font-medium">{d.getDate()}</div>
              {dayLeaves.length > 0 && (
                <span className="absolute bottom-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
              {dayLeaves.length > 0 && (
                <div className="absolute left-0 top-0 z-10 hidden w-full h-full bg-gray-800 bg-opacity-90 text-white text-xs p-1 overflow-auto group-hover:block">
                  {dayLeaves.map(l => (
                    <div key={l.name}>{l.name} - {l.type}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
