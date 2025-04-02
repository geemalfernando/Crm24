import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const db = req.query.db;
    const connection = getConnection(db);
    
    if (!connection) {
      return res.status(400).json({ error: 'Invalid database specified' });
    }

    const collections = await connection.db.listCollections().toArray();
    res.status(200).json({ db, collections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}