export const leaves = [
  { date: '2025-07-05', name: 'Alice', type: 'Annual Leave' },
  { date: '2025-07-05', name: 'Bob', type: 'Sick Leave' },
  { date: '2025-07-10', name: 'Charlie', type: 'Annual Leave' },
  { date: '2025-06-15', name: 'David', type: 'Annual Leave' },
  { date: '2025-06-20', name: 'Eve', type: 'Sick Leave' },
  { date: '2025-08-01', name: 'Frank', type: 'Annual Leave' },
  { date: '2025-08-03', name: 'Grace', type: 'Sick Leave' }
];

export function getLeavesByDate(dateStr) {
  return leaves.filter(l => l.date === dateStr);
}
