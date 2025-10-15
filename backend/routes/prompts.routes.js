const express = require("express");
const { PromptModel } = require("../models/prompts");
const { auth } = require("../middleware/auth.middleware");
const { TranscriptModel } = require("../models/transcript.model");

const promptRouter = express.Router();

// 🟢 Add new prompt
promptRouter.post("/", auth, async (req, res) => {
  try {
    const { prompt_name, prompt_text, is_shareable } = req.body;

    const newPrompt = new PromptModel({
      prompt_name,
      prompt_text,
      is_shareable,
      clinician: req.clinician,
    });

    await newPrompt.save();
    res.status(201).json({ msg: "Prompt created successfully", data: newPrompt });
  } catch (error) {
    console.error("Error creating prompt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// 🟡 Get all prompts for clinician
promptRouter.get("/", auth, async (req, res) => {
  try {
    const clinicianId = req.clinician; 

    const prompts = await PromptModel.find({
      is_deleted: false,
      $or: [
        { is_shareable: true },            
        { clinician: clinicianId }       
      ]
    }).sort({ created_at: -1 });

    res.status(200).json({ prompts });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// 🟠 Update prompt (edit text, shareable flag, etc.)
promptRouter.patch("/:promptId", auth, async (req, res) => {
  try {
    const { promptId } = req.params;
    const updateData = { ...req.body, updated_at: new Date() };

    const prompt = await PromptModel.findOneAndUpdate(
      { _id: promptId, clinician: req.clinician, is_deleted: false },
      updateData,
      { new: true }
    );

    if (!prompt) {
      return res.status(404).json({ msg: "Prompt not found or not accessible" });
    }

    res.status(200).json({ msg: "Prompt updated", data: prompt });
  } catch (error) {
    console.error("Error updating prompt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// 🔵 Add a transcript ID reference to a prompt
promptRouter.patch("/:promptId/add-prompt/:transcriptId", auth, async (req, res) => {
  try {
    const { promptId, transcriptId } = req.params;

    // Step 1: Verify that prompt exists and belongs to this clinician
    const prompt = await PromptModel.findOne({
      _id: promptId,
      clinician: req.clinician
    });

    if (!prompt) {
      return res.status(404).json({ msg: "Prompt not found or not accessible" });
    }

    // Step 2: Update transcript with this prompt
    const transcript = await TranscriptModel.findOneAndUpdate(
      { _id: transcriptId },
      { 
        $set: { prompt_used: promptId },
        updated_at: new Date() 
      },
      { new: true }
    );

    if (!transcript) {
      return res.status(404).json({ msg: "Transcript not found" });
    }

    res.status(200).json({ 
      msg: "Prompt linked to transcript successfully",
      data: transcript 
    });

  } catch (error) {
    console.error("Error linking prompt to transcript:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// 🔴 Soft delete prompt
promptRouter.delete("/:promptId", auth, async (req, res) => {
  try {
    const { promptId } = req.params;

    const prompt = await PromptModel.findOneAndUpdate(
      { _id: promptId, clinician: req.clinician },
      { is_deleted: true, updated_at: new Date() },
      { new: true }
    );

    if (!prompt) {
      return res.status(404).json({ msg: "Prompt not found or not accessible" });
    }

    res.status(200).json({ msg: "Prompt deleted successfully" });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = { promptRouter };
