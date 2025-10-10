// routes/consultation.route.js
const express = require("express");
const { ConsultationModel } = require("../models/consultations.model");
const { TranscriptModel } = require("../models/transcript.model");
const { NoteModel } = require("../models/notes.model");
const { PromptModel } = require("../models/prompts");
const { auth } = require("../middleware/auth.middleware");

const consultationRouter = express.Router();

/**
 * @route POST /consultations/start
 * @desc Start a new consultation (clinician + patient)
 */
consultationRouter.post("/start", async (req, res) => {
  try {
    const clinicianId = req.clinician;

    const newConsultation = new ConsultationModel({
      clinician: clinicianId,
    });

    await newConsultation.save();

    res.status(201).json({
      msg: "Consultation started successfully",
      consultation_id: newConsultation.consultation_id,
    });
  } catch (error) {
    console.error("Start consultation error:", error);
    res.status(500).json({ msg: "Error starting consultation", error: error.message });
  }
});

/**
 * @route PATCH /consultations/:id/end
 * @desc End a consultation session and mark as completed
 */
consultationRouter.patch("/:id/end", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await ConsultationModel.findOne({ consultation_uuid: id });

    if (!consultation) {
      return res.status(404).json({ msg: "Consultation not found" });
    }

    consultation.status = "ended";
    consultation.ended_at = new Date();
    await consultation.save();

    res.json({ msg: "Consultation ended successfully", consultation });
  } catch (error) {
    res.status(500).json({ msg: "Error ending consultation", error: error.message });
  }
});

/**
 * @route GET /consultations/:id
 * @desc Get full consultation details (with transcript, notes, and prompts)
 */
consultationRouter.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const consultation = await ConsultationModel.findOne({ consultation_id: id })
      .populate("clinician", "username email")
      .populate("transcript")
      .populate("notes")
      .populate("prompts_used");

    if (!consultation) {
      return res.status(404).json({ msg: "Consultation not found" });
    }

    res.json({ consultation });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching consultation", error: error.message });
  }
});

consultationRouter.get("/", auth, async (req, res) => {
  try {
    const clinicianId = req.clinician;
    const consultations = await ConsultationModel.find({ clinician: clinicianId })
      .populate("clinician", "username email")
      .sort({ started_at: -1 });

    res.json({ consultations });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching consultations", error: error.message });
  }
});

module.exports = { consultationRouter };