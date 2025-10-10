const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema({
  clinician: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  patient: { type: Object }, // could later become ref to patient collection

  transcript_text: { type: String, required: true },
  soap_summary: { type: Object },

  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "notes" }],
  prompts_used: [{ type: mongoose.Schema.Types.ObjectId, ref: "prompts" }],

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
});

const TranscriptModel = mongoose.model("transcripts", transcriptSchema);
module.exports = { TranscriptModel };
