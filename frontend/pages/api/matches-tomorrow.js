import { fetchMatches, todayStr } from '../../lib/apiFootball';

export default async function handler(req, res) {
  try {
    const date = todayStr(1);
    const data = await fetchMatches(date, date);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}
