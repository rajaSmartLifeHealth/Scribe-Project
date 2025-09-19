const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Call Grok API
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-2-latest", // Grok’s main model
        messages: [
          {
            role: "system",
            content:
              "You are a helpful medical research assistant. Provide concise, safe, and factual medical information. Do not give personal diagnosis.",
          },
          { role: "user", content: query },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer = response.data.choices[0].message.content;

    res.json({ query, answer });
  } catch (error) {
    console.error("Grok API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong", msg: error.message });
  }
});

module.exports = router;
