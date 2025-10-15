
const express = require('express');
const {v4 : uuidv4} = require('uuid');

const { TranscriptModel } = require("../models/transcript.model");

const transcriptRouter = express.Router();

// POST /transcripts/update-text
transcriptRouter.post("/update-text", async (req, res) => {
  try {
    const { transcript_id, transcript_text } = req.body;
    const clinicianId = req.clinician;

    if (!transcript_id || !transcript_text)
      return res.status(400).json({ msg: "Missing data" });

    const updatedTranscript = await TranscriptModel.findOneAndUpdate(
      { _id: transcript_id, clinician: clinicianId },
      { transcript_text, updated_at: Date.now() },
      { new: true }
    );

    res.status(200).json({ msg: "Transcript updated", data: updatedTranscript });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error" });
  }
});


// Fetch transcripts (optional)
// transcriptRouter.get("/", async (req, res) => {
//   try {
//       const clinicianId  = req.clinician;

//     const transcripts = await TranscriptModel.find();
//     res.status(200).json(transcripts);
//   } catch (error) {
//     res.status(500).json({ msg: "Error fetching transcripts" });
//   }
// });

transcriptRouter.get("/:consultation_id", async (req, res) => {
  try {
    const { consultation_id } = req.params;
    const clinicianId = req.clinician;
      const transcript = await TranscriptModel.findOne({
        clinician: clinicianId,
        consultation: consultation_id
      });

    res.status(200).json(transcript);
  } catch (error) {
    console.log(error);
    console.error("Error fetching transcripts:", error);
    res.status(500).json({ msg: "Error fetching transcripts" });
  }
});



module.exports = { transcriptRouter };
