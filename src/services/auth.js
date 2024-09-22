import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { randomBytes } from 'crypto';

import SessionCollection from '../db/models/Session.js';
import UserCollection from '../db/models/User.js';

import {
  accessTokenLifetime,
  refreshTokenLifetime,
} from '../constants/users.js';

const createSession = () => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');
  const accessTokenValidUntil = new Date(Date.now() + accessTokenLifetime);
  const refreshTokenValidUntil = new Date(Date.now() + refreshTokenLifetime);

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  };
};

export const register = async (payload) => {
  const { email, password } = payload;
  const user = await UserCollection.findOne({ email });
  if (user) {
    throw createHttpError(409, 'Email in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const data = await UserCollection.create({
    ...payload,
    password: hashPassword,
  });
  delete data._doc.password;

  return data._doc;
};

export const login = async (payload) => {
  const { email, password } = payload;
  const user = await UserCollection.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Email or password invalid');
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw createHttpError(401, 'Email or password invalid');
  }

  await SessionCollection.deleteOne({ userId: user._id });

  const sessionData = createSession();

  const userSession = await SessionCollection.create({
    userId: user._id,
    ...sessionData,
  });

  return userSession;
};

export const findSessionByAccessToken = (accessToken) =>
  SessionCollection.findOne({ accessToken });

const generateAccessToken = (userId) => {
  return randomBytes(30).toString('base64');
};

const generateRefreshToken = () => {
  return randomBytes(30).toString('base64');
};

export const refreshSession = async ({ refreshToken, sessionId }) => {
  const oldSession = await SessionCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!oldSession) {
    console.error('Session not found or refreshToken mismatch');
    throw createHttpError(401, 'Session not found');
  }

  if (new Date() > oldSession.refreshTokenValidUntil) {
    console.error('Refresh token expired');
    throw createHttpError(401, 'Session token expired');
  }

  const newAccessToken = generateAccessToken(oldSession.userId);
  const newRefreshToken = generateRefreshToken();
  const accessTokenValidUntil = new Date(Date.now() + accessTokenLifetime);
  const refreshTokenValidUntil = new Date(Date.now() + refreshTokenLifetime);

  const sessionUpdate = await SessionCollection.updateOne(
    { _id: sessionId },
    {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenValidUntil,
      refreshTokenValidUntil,
    },
  );
  console.log('Session updated in DB:', sessionUpdate);

  return {
    ...oldSession.toObject(),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  };
};

export const logout = async (sessionId) => {
  const session = await SessionCollection.findOne({ _id: sessionId });

  if (!session) {
    console.error('Session not found during logout');
    throw createHttpError(404, 'Session not found');
  }

  await SessionCollection.deleteOne({ _id: sessionId });
};

export const findUser = (filter) => UserCollection.findOne(filter);
