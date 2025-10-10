const express = require("express");
const { TranscriptModel } = require("../models/transcript.model");
const { ConsultationModel } = require("../models/consultations.model");
const OpenAI = require("openai");
require("dotenv").config();

const summaryRouter = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /consultation/:consultationId/summarise
 * Generates a SOAP summary for a consultation by summarizing all related transcripts.
 */
summaryRouter.post("/:consultationId/summarise", async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { usedPrompt } = req.body; // optional: can override default prompt

    // 1. Fetch consultation
    const consultation = await ConsultationModel.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ msg: "Consultation not found" });
    }

    // 2. Fetch all transcripts for that consultation
    const transcripts = await TranscriptModel.find({ consultationId }).sort({ createdAt: 1 });
    if (!transcripts || transcripts.length === 0) {
      return res.status(404).json({ msg: "No transcripts found for this consultation" });
    }

    // 3. Combine transcript text
    const combinedTranscript = transcripts.map(t => t.text).join("\n\n");

    // 4. Prepare AI prompt
    const systemPrompt =
      usedPrompt ||
      "You are a helpful medical assistant. Summarize the consultation transcript into SOAP format (Subjective, Objective, Assessment, Plan). Be concise, factual, and professional.";

    // 5. Send to OpenAI for summarization
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: combinedTranscript },
      ],
    });

    const soapSummary = completion.choices[0].message.content.trim();

    // 6. Save SOAP summary to consultation record
    consultation.soapSummary = soapSummary;
    consultation.lastSummarizedAt = new Date();
    await consultation.save();

    // 7. Respond to client
    res.json({
      msg: "SOAP summary generated successfully",
      consultationId: consultation._id,
      soapSummary,
    });
  } catch (err) {
    console.error("SOAP Summary Error:", err.message);
    res.status(500).json({
      msg: "Error generating SOAP summary",
      error: err.message,
    });
  }
});

module.exports = { summaryRouter };