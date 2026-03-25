import authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../util/response.util.js";

function getMeta(req) {
  return {
    ip: req.ip || req.headers["x-forwarded-for"],
    userAgent: req.headers["user-agent"],
  };
}

export async function register(req, res) {
  try {
    const result = await authService.register(req.body, getMeta(req));
    return sendSuccess(res, result, "Registration successful", 201);
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const result = await authService.login(email, password, getMeta(req));
    return sendSuccess(res, result, "Login successful");
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

export async function refreshToken(req, res) {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return sendError(res, "Refresh token required", 400);
    }

    const tokens = await authService.refresh(token, getMeta(req));
    return sendSuccess(res, tokens, "Token refreshed");
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

export async function logout(req, res) {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    await authService.logout(token);

    return sendSuccess(res, {}, "Logged out successfully");
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

export async function logoutAll(req, res) {
  try {
    await authService.logoutAll(req.user.sub);

    return sendSuccess(res, {}, "Logged out from all devices");
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}