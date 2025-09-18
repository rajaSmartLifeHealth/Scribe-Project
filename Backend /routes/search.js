const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { query } = req.body; // coming from search bar payload
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Call OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // lightweight & fast model
      messages: [
        {
          role: "system",
          content:
            "You are a helpful medical research assistant. Provide concise, safe, and factual medical information. Do not give personal diagnosis.",
        },
        { role: "user", content: query },
      ],
    });

    const answer = response.choices[0].message.content;

    res.json({ query, answer });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;