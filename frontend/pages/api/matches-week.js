import { fetchMatches, todayStr } from '../../lib/apiFootball';

export default async function handler(req, res) {
  try {
    const start = todayStr();
    const end = todayStr(7);
    const data = await fetchMatches(start, end);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}
