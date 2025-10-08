const express = require("express");
const searchRouter = express.Router();
const OpenAI = require("openai");
require('dotenv').config()

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

searchRouter.post("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4o-mini" for cheaper, faster responses
      messages: [
        {
          role: "system",
          content:
            "You are a helpful medical research assistant. Provide concise, safe, and factual medical information. Do not give personal diagnosis.",
        },
        { role: "user", content: query },
      ],
    });

    const answer = completion.choices[0].message.content;

    res.json({ query, answer });
  } catch (error) {
    console.error("OpenAI API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong", msg: error.message });
  }
});

module.exports = searchRouter;
