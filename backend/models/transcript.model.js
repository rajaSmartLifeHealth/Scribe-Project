const mongoose = require("mongoose");

const transcriptSchema = new mongoose.Schema({
  clinician: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  consultation: {type: mongoose.Schema.Types.ObjectId, ref: "consultations", required: true},
  transcript_text: { type: String },
  summary: { type: Object },
  prompt_used: { type: mongoose.Schema.Types.ObjectId, ref: "prompts" },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
});

const TranscriptModel = mongoose.model("transcripts", transcriptSchema);
module.exports = { TranscriptModel };
