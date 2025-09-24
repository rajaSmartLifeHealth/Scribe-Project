const express = require("express");
const axios = require("axios"); // to call AI API
const { TranscriptModel } = require("../models/transcript.model"); // assume you saved transcripts here
const summaryRouter = express.Router();

// POST /transcript/summarise
summaryRouter.post("/summarise", async (req, res) => {
  try {
    const { 
        transcriptId
     } = req.body;

    // 1. Fetch transcript from DB
    const transcript = await TranscriptModel.findById(transcriptId);
    if (!transcript) {
      return res.status(404).json({ msg: "Transcript not found" });
    }

    // 2. Send transcript text to AI model for SOAP summary
    // Example with OpenAI GPT
        const aiResponse = await axios.post(
        "https://api.deepseek.com/v1/chat/completions", // DeepSeek endpoint
        {
            model: "deepseek-chat",
            messages: [
            {
                role: "system",
                content:
                "You are a helpful medical assistant. Summarise the given transcript into SOAP (Subjective, Objective, Assessment, Plan) format.",
            },
            { role: "user", content: transcript.text },
            ],
        },
        {
            headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
            },
        }
        );
        
    const soapSummary = aiResponse.data.choices[0].message.content;

    // 3. Optionally save SOAP summary back to DB
    transcript.soapSummary = soapSummary;
    await transcript.save();

    res.json({
      msg: "SOAP summary generated successfully",
      transcriptId: transcript._id,
      soapSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error generating SOAP summary", err });
  }
});

module.exports = { summaryRouter };
