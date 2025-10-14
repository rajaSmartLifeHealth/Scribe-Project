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


summaryRouter.post("/analyze", async (req, res) => {
  try {
    let { prompt, images } = req.body;
    // Make image input optional; coerce non-arrays to an empty list
    images = Array.isArray(images) ? images : [];

    if (!prompt) {
      prompt = "Explain this image !"
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const systemMsg = {
      role: "system",
      content:
        `You are a helpful and expert UK based medical AI,
        explaining things to a medical professional. 
        Tailor your answers to a UK audience and the NHS guidelines. 
        Do not include irrelevant filler. Avoid duplication. Focus on clarity, accuracy, and brevity.
        Do not explain what you are generating, just get to the answer directly.
        Respond in markdown format.`
    };

    // Normalize and validate image URLs: allow only http(s) or data:image/* data URLs
    const normalizeImageUrl = (u) => {
      if (typeof u !== 'string' || !u) return null;
      const isHttp = /^https?:\/\//i.test(u);
      const isData = u.startsWith('data:');
      if (isHttp) return u;
      if (isData) {
        if (!/^data:image\//i.test(u)) return null; // reject non-image data URLs
        return u;
      }
      // Accept bare base64 payloads by assuming PNG
      if (/^[A-Za-z0-9+/=]+$/.test(u)) {
        return `data:image/png;base64,${u}`;
      }
      // Accept our custom "base64:mime:payload" format
      if (u.startsWith('base64:')) {
        const parts = u.split(':');
        if (parts.length >= 3) {
          const mime = parts[1] || 'image/png';
          const payload = parts.slice(2).join(':');
          if (!/^image\//i.test(mime)) return null;
          return `data:${mime};base64,${payload}`;
        }
        const payload = u.replace(/^base64:[^:]*:/, '');
        return `data:image/png;base64,${payload}`;
      }
      return null;
    };

    const cleanedImages = images
      .map(normalizeImageUrl)
      .filter((u) => typeof u === 'string' && u);

    // If no valid images are provided, proceed with text-only content

    const userContent = [
      { type: "text", text: prompt },
      ...cleanedImages.map((url) => ({
        type: "image_url",
        image_url: {
          url,
        }
      }))
    ];

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        systemMsg,
        { role: "user", content: userContent }
      ]
    });

    return res.status(200).json({
      status: "ok",
      response: resp.choices[0].message.content
    });
  } catch (err) {
    console.error("Internal server error:", err);
    const isTooLarge = err && (err.type === 'entity.too.large' || err.status === 413);
    const status = isTooLarge ? 413 : 500;
    const stackExcerpt = err?.stack ? String(err.stack).split('\n').slice(0, 3).join('\n') : undefined;
    return res.status(status).json({
      status: "error",
      error: {
        name: err?.name,
        type: err?.type,
        message: err?.message || (isTooLarge ? "Payload too large" : "Internal server error"),
        stackExcerpt
      }
    });
  }
});
module.exports = { summaryRouter };