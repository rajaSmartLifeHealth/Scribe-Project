const express = require("express");
const { NoteModel } = require("../models/notes.model");
const { TranscriptModel } = require("../models/transcript.model");
const { ConsultationModel } = require("../models/consultations.model");
const { auth } = require("../middleware/auth.middleware");

const noteRouter = express.Router();

/**
 * Add a new note to a consultation
 */
noteRouter.post("/:consultationId", async (req, res) => {
  try {
    const { body, transcriptId } = req.body;
    const clinicianId = req.clinician;
    const { consultationId } = req.params; 

    if (!body) return res.status(400).json({ msg: "Note body is required." });

    // Ensure consultation exists
    const consultation = await ConsultationModel.findById(consultationId);
    if (!consultation) return res.status(404).json({ msg: "Consultation not found." });

    const newNote = await NoteModel.create({
      clinician: clinicianId,
      consultation: consultationId,
      transcript: transcriptId,
      body,
    });

    // Link note back to consultation
    consultation.notes = consultation.notes || [];
    consultation.notes.push(newNote._id);
    await consultation.save();

    res.status(201).json({ msg: "Note added successfully.", note: newNote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

noteRouter.get("/:consultationId", auth, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const notes = await NoteModel.find({ consultation: consultationId })
      .populate("clinician", "username email")
      .sort({ created_at: -1 });

    res.json({ count: notes.length, notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

noteRouter.patch("/:noteId", auth, async (req, res) => {
  try {
    const { noteId } = req.params;
    const clinicianId = req.clinician;
    const note = await NoteModel.findById(noteId);

    if (!note) return res.status(404).json({ msg: "Note not found." });
    if (note.clinician.toString() !== clinicianId)
      return res.status(403).json({ msg: "Not authorized." });

    note.body = req.body.body || note.body;
    note.updated_at = new Date();
    await note.save();

    res.json({ msg: "Note updated.", note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

/**
 * Delete a note
 */
noteRouter.delete("/:noteId", auth, async (req, res) => {
  try {
    const { noteId } = req.params;
    const clinicianId = req.clinician;
    const note = await NoteModel.findById(noteId);

    if (!note) return res.status(404).json({ msg: "Note not found." });
    if (note.clinician.toString() !== clinicianId)
      return res.status(403).json({ msg: "Not authorized." });

    await NoteModel.findByIdAndDelete(noteId);

    // Remove from consultation.notesIds
    await ConsultationModel.updateOne(
      { _id: note.consultation },
      { $pull: { notesIds: noteId } }
    );

    res.json({ msg: "Note deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = { noteRouter };
