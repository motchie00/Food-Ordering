const app = require('./app');

let isReady = null;

module.exports = async (req, res) => {
  try {
    if (!isReady) {
      isReady = app.connectDB();
    }
    await isReady;
    return app(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    // Reset connection promise on error so next request can retry
    if (error.message && error.message.includes('buffering timed out')) {
      isReady = null;
    }
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

