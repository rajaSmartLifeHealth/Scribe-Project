// routes/transcript.route.js
const express = require("express");
const { v4: uuidv4 } = require('uuid')

const { TranscriptModel } = require("../models/transcript.model");

const transcriptRouter = express.Router();

// Save transcript data
transcriptRouter.post("/save", async (req, res) => {
  const { transcript, soapSummary, patient_data } = req.body;

  const clinicianId  = req.user.id;
  try {
    if (!clinicianId || !transcript) {
      return res.status(400).json({ msg: "Clinician and transcript are required" });
    }
    const patientObject = { 
      patient_id : uuidv4(),
      data: patient_data
    }
    const newTranscript = new TranscriptModel({ clinicianId, transcript, soapSummary, patientObject });
    await newTranscript.save();

    res.status(200).json({ msg: "Transcript saved", data: newTranscript });
  } catch (error) {
    console.error("Error saving transcript:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Fetch transcripts (optional)
transcriptRouter.get("/", async (req, res) => {
  try {
    const transcripts = await TranscriptModel.find().sort({ createdAt: -1 });
    res.status(200).json(transcripts);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching transcripts" });
  }
});

transcriptRouter.get("/:patient_id", async (req, res) => {
  try {
    const { patient_id } = req.params;
    const transcripts = await TranscriptModel.find({ patient_id })
      .sort({ createdAt: -1 });

    res.status(200).json(transcripts);
  } catch (error) {
    console.error("Error fetching transcripts:", error);
    res.status(500).json({ msg: "Error fetching transcripts" });
  }
});



module.exports = { transcriptRouter };
