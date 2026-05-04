import jwt from "jsonwebtoken";

// User authentication middleware
const authUser = async (req, res, next) => {
  try {
    // Accept the legacy `token` header as well as a standard bearer token.
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = req.headers.token || bearerToken;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token is Missing!" });
    }

    // Verify the token
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    const userId = tokenDecode.id || tokenDecode.sub || tokenDecode.userId || null;
    req.user = { userId, id: tokenDecode.id || userId, sub: tokenDecode.sub || userId };

    // Call the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authUser;
