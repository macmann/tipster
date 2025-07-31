import { useState } from 'react';
import CalendarView from '../components/CalendarView';
import { leaves } from '../utils/leaveData';

export default function LeaveReport() {
  const [filter, setFilter] = useState('');

  const filtered = leaves.filter(l =>
    l.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-4">
      <nav className="mb-4">
        <a href="/" className="mr-2">Matches</a>|
        <a href="/recommendations" className="mx-2">Recommendations</a>|
        <a href="/leave-report" className="ml-2">Leave Report</a>
      </nav>
      <h1 className="text-center text-2xl font-semibold mb-4">Leave Report</h1>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((l, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-1 border">{l.name}</td>
              <td className="p-1 border">{l.date}</td>
              <td className="p-1 border">{l.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mb-8">
        <label>
          Filter by name:
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border ml-2 px-1"
          />
        </label>
      </div>
      <CalendarView />
    </div>
  );
}
