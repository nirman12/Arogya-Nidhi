import jwt from "jsonwebtoken";

// Admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
    // Get the token from the request headers
    const { atoken } = req.headers;

    if (!atoken) {
      return res
        .status(401)
        .json({ success: false, message: "Token is Missing!" });
    }

    // Verify the token
    const tokenDecode = jwt.verify(atoken, process.env.JWT_SECRET);

    if (tokenDecode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized, Try Again!" });
    }

    // Call the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized access" });
  }
};

export default authAdmin;