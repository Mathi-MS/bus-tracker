const TrackingSession = require('../models/TrackingSession');

const setupTrackingSocket = (io) => {
  const socketMeta = {};

  const getViewers = (code) =>
    Object.values(socketMeta).filter((m) => m.code === code && m.role === 'viewer');

  io.on('connection', (socket) => {
    socket.on('join-session', async ({ code, role, user }) => {
      socket.join(code);
      socketMeta[socket.id] = { code, role, user: user || null };

      if (role === 'viewer') {
        const session = await TrackingSession.findOneAndUpdate(
          { code, status: 'active' },
          { $inc: { viewerCount: 1 } },
          { new: true }
        );
        if (session) {
          io.to(code).emit('viewer-count-update', session.viewerCount);
          io.to(code).emit('viewers-update', getViewers(code).map((v) => ({ socketId: v.socketId, ...v.user })));
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

    socket.on('kick-viewer', ({ code, socketId }) => {
      io.to(socketId).emit('kicked');
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
          io.to(code).emit('viewers-update', getViewers(code).map((v) => ({ socketId: v.socketId, ...v.user })));
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
          delete socketMeta[socket.id];
          io.to(meta.code).emit('viewer-count-update', Math.max(0, session.viewerCount));
          io.to(meta.code).emit('viewers-update', getViewers(meta.code).map((v) => ({ socketId: v.socketId, ...v.user })));
        }
      }
      delete socketMeta[socket.id];
    });
  });
};

module.exports = setupTrackingSocket;
