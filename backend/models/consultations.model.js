const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  clinician: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  patient: {type : Object},
  transcript: { type: mongoose.Schema.Types.ObjectId, ref: "transcripts" },
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "notes" }],

  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date },
  status: { type: String, enum: ["active", "ended"], default: "active" }
});

const ConsultationModel = mongoose.model("consultations", consultationSchema);
module.exports = { ConsultationModel };
