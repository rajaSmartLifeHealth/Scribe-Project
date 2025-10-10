const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  prompt_name: { type: String, required: true, trim: true },
  prompt_text: { type: String, required: true, trim: true },
  is_shareable: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },

  clinician: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  transcript_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "transcripts" }],

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
});

const PromptModel = mongoose.model("prompts", promptSchema);
module.exports = { PromptModel };
