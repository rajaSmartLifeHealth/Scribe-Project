const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "clinician"], required: true },

  prompts: [{ type: mongoose.Schema.Types.ObjectId, ref: "prompts" }],
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "notes" }],
  transcripts: [{ type: mongoose.Schema.Types.ObjectId, ref: "transcripts" }],

  createdAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.model("users", userSchema);
module.exports = { UserModel };
