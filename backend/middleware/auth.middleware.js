const jwt = require("jsonwebtoken");
const { BlackTokenModel } = require("../models/token.models");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ msg: "Please login, no token provided" });
    }

    // check if token is blacklisted
    const blacklisted = await BlackTokenModel.findOne({ where: { blackToken: token } });
    if (blacklisted) {
      return res.status(401).json({ msg: "Session logged out. Please log in again." });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "masai");
    req.clinicianId = decoded.userID;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired. Please log in again." });
    }
    return res.status(401).json({ msg: "Not authorized, invalid token", error: err.message });
  }
};

module.exports = { auth };
