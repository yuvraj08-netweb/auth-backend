import jwt from "jsonwebtoken";

export const identifier = (req, res, next) => {
  try {
    const bearerToken = req.headers["authorization"]?.split(" ")[1];
    const cookieToken = req.cookies?.Authorization;

   const token = bearerToken || cookieToken;
   
    if (!token) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
};
