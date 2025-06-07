// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: ['GET', 'POST'],
  },
});

// Store notifications (in-memory for simplicity; use a database in production)
let notifications = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send existing notifications to the connected client
  socket.emit('initialNotifications', notifications.filter(n => n.userRole === socket.handshake.query.userRole));

  // Handle new notification
  socket.on('newNotification', (notification) => {
    notifications.push({ ...notification, id: `${Date.now()}`, time: new Date().toISOString() });
    // Broadcast to clients with matching userRole
    io.to(notification.userRole).emit('notification', notification);
  });

  // Join a room based on userRole for role-based notifications
  socket.on('joinRole', (userRole) => {
    socket.join(userRole);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(express.json());

// Optional: API to trigger notifications for testing
app.post('/api/notifications', (req, res) => {
  const notification = req.body;
  notifications.push({ ...notification, id: `${Date.now()}`, time: new Date().toISOString() });
  io.to(notification.userRole).emit('notification', notification);
  res.status(201).send('Notification sent');
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});