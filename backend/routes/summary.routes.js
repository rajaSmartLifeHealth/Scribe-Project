const express = require("express");
const { TranscriptModel } = require("../models/transcript.model");
const OpenAI = require("openai");
require('dotenv').config()

const summaryRouter = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /transcript/summarise
summaryRouter.post("/summarise", async (req, res) => {
  try {
    const { transcriptId } = req.body;

    // 1. Fetch transcript from DB
    const transcript = await TranscriptModel.findById(transcriptId);
    if (!transcript) {
      return res.status(404).json({ msg: "Transcript not found" });
    }

    // 2. Send transcript text to OpenAI for SOAP summary
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // you can switch to "gpt-4o-mini" for cheaper runs
      messages: [
        {
          role: "system",
          content:
            "You are a helpful medical assistant. Summarize the given transcript into SOAP format (Subjective, Objective, Assessment, Plan). Be concise, factual, and professional.",
        },
        { role: "user", content: transcript.text },
      ],
    });

    const soapSummary = completion.choices[0].message.content;

    // 3. Optionally save SOAP summary back to DB
    transcript.soapSummary = soapSummary;
    await transcript.save();

    res.json({
      msg: "SOAP summary generated successfully",
      transcriptId: transcript._id,
      soapSummary,
    });
  } catch (err) {
    console.error("OpenAI SOAP Summary Error:", err.message);
    res.status(500).json({ msg: "Error generating SOAP summary", error: err.message });
  }
});

module.exports = { summaryRouter };
