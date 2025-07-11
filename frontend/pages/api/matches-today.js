import { fetchMatches, todayStr } from '../../lib/apiFootball';

export default async function handler(req, res) {
  try {
    const data = await fetchMatches(todayStr(), todayStr());
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}
