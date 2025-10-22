// routes/consultation.route.js
const express = require("express");
const { ConsultationModel } = require("../models/consultations.model");
const { TranscriptModel } = require("../models/transcript.model");
const { NoteModel } = require("../models/notes.model");
const { PromptModel } = require("../models/prompts");
const { auth } = require("../middleware/auth.middleware");
const OpenAI = require("openai");
require("dotenv").config();

const consultationRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

consultationRouter.post("/start", async (req, res) => {
  try {
    const clinicianId = req.clinician; // or req.clinician depending on your auth
    const { patient_data } = req.body;

    const consultation = await ConsultationModel.create({
      clinician: clinicianId,
      patient: patient_data,
    });

    // also create transcript for this consultation
    const transcript = await TranscriptModel.create({
      consultation: consultation._id,
      clinician: clinicianId,
      transcript_text: "",
    });

    consultation.transcript = transcript._id;
    await consultation.save();

    res.status(200).json({
      msg: "Consultation started",
      data: { consultation, transcript }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error starting consultation" });
  }
});

consultationRouter.post("/:id/end", async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt_used } = req.body;

    const consultation = await ConsultationModel.findById(id).populate("transcript");
    if (!consultation) {
      return res.status(404).json({ msg: "Consultation not found" });
    }

    const transcript = await TranscriptModel.findById(consultation.transcript);
    if (!transcript) {
      return res.status(404).json({ msg: "Transcript not found" });
    }

    const Prompt = await PromptModel.findById(prompt_used);
    if (!Prompt) {
      return res.status(404).json({ msg: "Prompt not found" });
    }

    const usedPrompt = Prompt.prompt_text;

    let finalSummary = "";
    let highlights = [];

    // 🧠 STEP 1: Generate SOAP Summary
    try {
      const systemPrompt =
        usedPrompt ||
        "You are a helpful medical assistant. Summarize the consultation transcript into SOAP format (Subjective, Objective, Assessment, Plan). Be concise, factual, and professional.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript.transcript_text || "" },
        ],
      });

      finalSummary = completion.choices[0].message.content.trim();
    } catch (err) {
      console.warn("⚠️ SOAP generation failed:", err.message);
    }

    // 🧬 STEP 2: Extract SNOMED terms
    if (finalSummary) {
      try {
        const entityPrompt = `
          You are a clinical coding assistant.
          From the following text, identify any diseases, symptoms, or medical conditions that might have SNOMED CT codes.
          Return ONLY valid JSON array, example:
          [
            { "term": "diabetes", "possible_snomed": "44054006" },
            { "term": "hypertension", "possible_snomed": "38341003" }
          ]
          Text: """${finalSummary}"""
        `;

        const entityCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: entityPrompt },
                     { role: "user",  content: transcript.transcript_text || "" }],
        });

        const raw = entityCompletion.choices[0].message.content.trim();

        try {
          highlights = JSON.parse(raw);
        } catch (err) {
          console.warn("⚠️ Failed to parse SNOMED JSON:", raw);
        }
      } catch (err) {
        console.warn("⚠️ SNOMED extraction failed:", err.message);
      }
    }

    // 📝 STEP 3: Update transcript
    const updatedTranscript = await TranscriptModel.findByIdAndUpdate(
      consultation.transcript._id,
      {
        ...(finalSummary && { summary: finalSummary }),
        ...(highlights.length && { highlights }),
        updated_at: new Date(),
      },
      { new: true }
    );

    // 🔚 STEP 4: Mark consultation as ended
    consultation.status = "ended";
    consultation.ended_at = new Date();
    if (finalSummary) {
      consultation.lastSummarizedAt = new Date();
    }
    await consultation.save();

    // 🎯 STEP 5: Respond
    res.status(200).json({
      msg: "Consultation ended successfully",
      transcript: updatedTranscript,
      summary: finalSummary || "Summary not generated",
      highlights,
    });
  } catch (error) {
    console.error("❌ Error ending consultation:", error);
    res.status(500).json({ msg: "Error ending consultation", error: error.message });
  }
});

consultationRouter.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

     const consultation = await ConsultationModel.findOne({ _id: id, clinician: req.clinician })
      .populate("clinician", "username email")
      .populate("patient")
      .populate({
        path: "notes",
        populate: {
          path: "clinician",
          select: "username email", // Only return needed clinician info
        },
        select: "body createdAt", // Only show body and timestamp for each note
      })
      .populate({
        path: "transcript",
        populate: {
          path: "prompt_used", 
          select: "prompt_name prompt_text createdAt", // Choose fields you want
        },
      });

    if (!consultation) {
      return res.status(404).json({ msg: "Consultation not found or invalid" },);
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
      .populate("patient")
      .populate({
        path: "notes",
        populate: {
          path: "clinician",
          select: "username email", // Only return needed clinician info
        },
        select: "body createdAt", // Only show body and timestamp for each note       
      })
      .populate("transcript")
      .sort({ started_at: -1 });

    res.json({ consultations });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching consultations", error: error.message });
  }
});

module.exports = { consultationRouter };