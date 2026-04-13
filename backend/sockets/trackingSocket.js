const TrackingSession = require('../models/TrackingSession');

const setupTrackingSocket = (io) => {
  // Track socket metadata for cleanup on disconnect
  const socketMeta = {};

  io.on('connection', (socket) => {
    socket.on('join-session', async ({ code, role }) => {
      socket.join(code);
      socketMeta[socket.id] = { code, role };

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
      socket.to(code).emit('location-broadcast', location);
    });

    socket.on('stop-sharing', async ({ code }) => {
      io.to(code).emit('session-ended');
      socket.leave(code);
    });

    socket.on('leave-session', async ({ code, role }) => {
      socket.leave(code);
      delete socketMeta[socket.id];
      if (role === 'viewer') {
        const session = await TrackingSession.findOneAndUpdate(
          { code, status: 'active' },
          { $inc: { viewerCount: -1 } },
          { new: true }
        );
        if (session) {
          io.to(code).emit('viewer-count-update', Math.max(0, session.viewerCount));
        }
      }
    });

    socket.on('disconnect', async () => {
      const meta = socketMeta[socket.id];
      if (meta?.role === 'viewer') {
        const session = await TrackingSession.findOneAndUpdate(
          { code: meta.code, status: 'active' },
          { $inc: { viewerCount: -1 } },
          { new: true }
        );
        if (session) {
          io.to(meta.code).emit('viewer-count-update', Math.max(0, session.viewerCount));
        }
      }
      delete socketMeta[socket.id];
    });
  });
};

module.exports = setupTrackingSocket;
