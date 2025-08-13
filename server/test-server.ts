import express from 'express';

const app = express();
const PORT = 3001;

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test server accessible at: http://localhost:${PORT}/test`);
});
