import jwt from "jsonwebtoken";

// Doctor authentication middleware
const authDoctor = async (req, res, next) => {
  try {
    // Get the token from the request headers
    const { dtoken } = req.headers;

    if (!dtoken) {
      res.status(401).json({
        success: false,
        message: "Token is missing.",
      });
    }

    // Verify the token
    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
    // req.user.docId = token_decode.id;
    req.user = { docId: token_decode.id };

    // Call the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export default authDoctor;
