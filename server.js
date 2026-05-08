const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const appointments = {};

function getTodayKey() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/appointments', (req, res) => {
  const date = req.query.date || getTodayKey();
  res.json({ date, slots: appointments[date] || [] });
});

io.on('connection', (socket) => {
  socket.on('bookSlot', ({ date, time, name }) => {
    if (!appointments[date]) appointments[date] = [];
    const existing = appointments[date].find((slot) => slot.time === time);
    if (existing) {
      socket.emit('bookingError', 'That time slot is already booked.');
      return;
    }
    const booking = { time, name, bookedAt: new Date().toISOString() };
    appointments[date].push(booking);
    io.emit('appointmentUpdate', { date, booking });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
