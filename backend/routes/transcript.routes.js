
const express = require('express');
const {v4 : uuidv4} = require('uuid');

const { TranscriptModel } = require("../models/transcript.model");
const { equal } = require('assert');

const transcriptRouter = express.Router();

// Save transcript data
transcriptRouter.post("/save", async (req, res) => {
  const { transcript, soapSummary, patient_data, notes } = req.body;

  const clinicianId  = req.clinicianId;
  try {
    if (!clinicianId || !transcript) {
      return res.status(400).json({ msg: "Clinician and transcript are required" });
    }
    const patientObject = { 
      patient_id : uuidv4(),
      data: {patient_data}
    }
    const newTranscript = new TranscriptModel({ clinicianId, transcript, soapSummary, patientObject, notes });
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
      const clinicianId  = req.clinicianId;

    const transcripts = await TranscriptModel.find();
    res.status(200).json(transcripts);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching transcripts" });
  }
});

transcriptRouter.get("/:transcript_id", async (req, res) => {
  try {
    const { transcript_id } = req.params;
    const clinicianId = req.clinicianId;
      const transcript = await TranscriptModel.findOne({
        _id: transcript_id,
        clinicianId: clinicianId
      });

      console.log(transcript);

    res.status(200).json(transcript);
  } catch (error) {
    console.log(error);
    console.error("Error fetching transcripts:", error);
    res.status(500).json({ msg: "Error fetching transcripts" });
  }
});



module.exports = { transcriptRouter };
