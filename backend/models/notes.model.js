// models/note.model.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  clinician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  transcript: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transcripts',
    required: true,
  },
  consultation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "consultations", 
    required: true
 }, // optional but recommended
  body: {
    type: String,
    required: true,
    trim: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, { versionKey: false });

const NoteModel = mongoose.model("notes", noteSchema);

module.exports = { NoteModel };
