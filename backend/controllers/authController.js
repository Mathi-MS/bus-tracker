const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        role: 'user',
        firstLogin: new Date(),
        lastLogin: new Date(),
      });
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user (for revocation if needed)
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, picture: user.picture, role: user.role } });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const refresh = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) return res.sendStatus(401);

  const refreshToken = cookies.refreshToken;

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return res.sendStatus(403);

    const accessToken = generateAccessToken(user);
    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, picture: user.picture, role: user.role } });
  });
};

const updateProfile = async (req, res) => {
  const { name, mobile, picture } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (mobile) user.mobile = mobile;
    if (picture) user.picture = picture;

    await user.save();

    res.json({ 
      message: 'Profile updated successfully',
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture, mobile: user.mobile, role: user.role } 
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const logout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) return res.sendStatus(204);

  const refreshToken = cookies.refreshToken;
  const user = await User.findOne({ refreshToken });
  
  if (user) {
    user.refreshToken = '';
    await user.save();
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  res.sendStatus(204);
};

module.exports = {
  googleLogin,
  refresh,
  logout,
  updateProfile,
};
