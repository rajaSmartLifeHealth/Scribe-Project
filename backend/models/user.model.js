const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true, // prevent duplicate accounts
    lowercase: true
  },
  password: { 
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["patient", "clinician"], // only these two roles
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const UserModel = mongoose.model("users", userSchema);

module.exports = {
  UserModel
};
