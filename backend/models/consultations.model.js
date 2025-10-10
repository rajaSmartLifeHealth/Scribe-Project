// models/consultation.model.js
const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  consultation_id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(), // or use uuidv4()
    unique: true,
  },
  clinician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  transcript: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transcripts",
  },
  notesIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "notes" }],
  prompts_used: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "prompts",
    },
  ],
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date },
  status: {
    type: String,
    enum: ["active", "ended"],
    default: "active",
  },
});

const ConsultationModel = mongoose.model("consultations", consultationSchema);
module.exports = { ConsultationModel };
