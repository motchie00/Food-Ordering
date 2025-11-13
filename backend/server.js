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
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

