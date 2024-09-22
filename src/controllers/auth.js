import * as authServices from '../services/auth.js';

const setupSession = (res, session) => {
  if (!session.refreshToken || !session._id) {
    console.error('Failed to set cookies: Missing session tokens');
    return;
  }

  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    path: '/',
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    path: '/',
  });

  console.log('Cookies set successfully:', {
    refreshToken: session.refreshToken,
    sessionId: session._id,
  });
};

export const registerController = async (req, res) => {
  const newUser = await authServices.register(req.body);

  res.status(201).json({
    status: 201,
    message: 'Successfully registered a user!',
    data: newUser,
  });
};

export const loginController = async (req, res) => {
  const session = await authServices.login(req.body);

  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully logged in an user!',
    data: {
      accessToken: session.accessToken,
    },
  });
};

export const refreshController = async (req, res) => {
  const { refreshToken, sessionId } = req.cookies;
  const session = await authServices.refreshSession({
    refreshToken,
    sessionId,
  });

  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully refresh session',
    data: {
      accessToken: session.accessToken,
    },
  });
};

export const logoutController = async (req, res) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    await authServices.logout(sessionId);
  }

  res.clearCookie('sessionId');
  res.clearCookie('refreshToken');

  res.status(204).send();
};
