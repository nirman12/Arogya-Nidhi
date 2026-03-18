import jwt from "jsonwebtoken";

// User authentication middleware
const authUser = async (req, res, next) => {
  try {
    // Get the token from the request headers
    const { token } = req.headers;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token is Missing!" });
    }

    // Verify the token
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: tokenDecode.id };

    // Call the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authUser;
