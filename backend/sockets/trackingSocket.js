const TrackingSession = require('../models/TrackingSession');

const setupTrackingSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-session', async ({ code, role }) => {
      socket.join(code);
      console.log(`Socket ${socket.id} joined session ${code} as ${role}`);

      if (role === 'viewer') {
        const session = await TrackingSession.findOneAndUpdate(
          { code, status: 'active' },
          { $inc: { viewerCount: 1 } },
          { new: true }
        );
        if (session) {
          io.to(code).emit('viewer-count-update', session.viewerCount);
        }
      }
    });

    socket.on('location-update', ({ code, location }) => {
      // Broadcast location to everyone in the room except sender (sharer)
      socket.to(code).emit('location-broadcast', location);
      
      // Optionally update DB (throttled)
      // For performance, we usually update DB less frequently than we broadcast
    });

    socket.on('stop-sharing', async ({ code }) => {
      io.to(code).emit('session-ended');
      socket.leave(code);
    });

    socket.on('leave-session', async ({ code, role }) => {
      socket.leave(code);
      if (role === 'viewer') {
        const session = await TrackingSession.findOneAndUpdate(
          { code, status: 'active' },
          { $inc: { viewerCount: -1 } },
          { new: true }
        );
        if (session) {
          io.to(code).emit('viewer-count-update', session.viewerCount > 0 ? session.viewerCount : 0);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = setupTrackingSocket;
