// models/Transcript.model.js
const mongoose = require("mongoose");
const { type } = require("os");

const transcriptSchema = new mongoose.Schema({
  clinicianId: {
    type: String,
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  soapSummary: {
    type : Object
  },
  patientObject: {
   type : Object
  }
});

const TranscriptModel = mongoose.model("transcripts", transcriptSchema);

module.exports = { TranscriptModel };
