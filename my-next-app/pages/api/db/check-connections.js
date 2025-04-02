export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        error: 'Method not allowed' 
      });
    }
  
    try {
      const { isConnected } = await import('../../../lib/db');
      
      res.status(200).json({
        success: true,
        connections: {
          production: isConnected('production'),
          development: isConnected('development')
        }
      });
    } catch (error) {
      console.error('Error checking connections:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }