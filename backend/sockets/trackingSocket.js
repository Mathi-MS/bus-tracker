const TrackingSession = require('../models/TrackingSession');

const setupTrackingSocket = (io) => {
  const socketMeta = {};

  const getViewers = (code) =>
    Object.values(socketMeta).filter((m) => m.code === code && m.role === 'viewer');

  const broadcastViewers = (code) => {
    const viewers = getViewers(code);
    io.to(code).emit('viewer-count-update', viewers.length);
    io.to(code).emit('viewers-update', viewers.map((v) => ({ socketId: v.socketId, ...v.user })));
  };

  io.on('connection', (socket) => {
    socket.on('join-session', ({ code, role, user }) => {
      socket.join(code);
      socketMeta[socket.id] = { socketId: socket.id, code, role, user: user || {} };

      if (role === 'viewer') {
        // Update DB total views only (not live count)
        TrackingSession.findOneAndUpdate(
          { code, status: 'active' },
          { $inc: { totalViews: 1 } }
        ).catch(() => {});

        broadcastViewers(code);
      }
    });

    socket.on('location-update', ({ code, location }) => {
      socket.to(code).emit('location-broadcast', location);
    });

    socket.on('stop-sharing', ({ code }) => {
      io.to(code).emit('session-ended');
      socket.leave(code);
    });

    socket.on('kick-viewer', ({ socketId }) => {
      io.to(socketId).emit('kicked');
    });

    socket.on('leave-session', ({ code, role }) => {
      socket.leave(code);
      delete socketMeta[socket.id];
      if (role === 'viewer') broadcastViewers(code);
    });

    socket.on('disconnect', () => {
      const meta = socketMeta[socket.id];
      if (meta) {
        delete socketMeta[socket.id];
        if (meta.role === 'viewer') broadcastViewers(meta.code);
      }
    });
  });
};

module.exports = setupTrackingSocket;
