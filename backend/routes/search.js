const express = require("express");
const searchRouter = express.Router();
const OpenAI = require("openai");
require('dotenv').config()
const querystring = require('querystring')
const axios = require('axios')
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

const getAuthTokenSNOWMED = async () => {
  const url = 'https://ontology.nhs.uk/authorisation/auth/realms/nhs-digital-terminology/protocol/openid-connect/token'
  const data = querystring.stringify({
    grant_type: 'client_credentials', // or another grant type as per your requirement
    client_id: process.env.NHS_TERMINOLOGY_SERVER_CLIENT_ID,
    client_secret: process.env.NHS_TERMINOLOGY_SERVER_CLIENT_SECRET
  })

  try {
    const response = await axios.post(url, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return response.data.access_token
  } catch (error) {
    console.log(error)
    console.log(error.response)
    console.error('Error:', error.response ? error.response.data : error.message)
  }
}

searchRouter.get("/search/clinicalcodes", async (req, res)  => {
      const { name: term} = req.query;
  const accessToken = await getAuthTokenSNOWMED()
  const url = 'https://ontology.nhs.uk/production1/fhir/ValueSet/$expand'

const data = {
    url: 'http://snomed.info/sct/83821000000107/version/20240508?fhir_vs=isa/138875005',
    filter: term,
    count: 10
  }

  const retVal = {
    success: false,
    data: []
  }

  try {
    const response = await axios.get(url, {
      params: data,
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })
    console.log(response.data.expansion);

    if (response.data.expansion.total > 0) {
      retVal.data = response.data.expansion.contains.map((item) => {
         res.json({name: item.display, code: item.code, url: item.system });
      })
    }
    retVal.success = true
  } catch (error) {
    console.log(error.response.data)
    console.log(error.message)
  }

  return retVal
})
module.exports = searchRouter;
