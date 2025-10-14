const express = require("express");
const { PromptModel } = require("../models/prompts");
const { auth } = require("../middleware/auth.middleware");

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
    const prompts = await PromptModel.find({
      clinician: req.clinician,
      is_deleted: false,
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

    const prompt = await PromptModel.findOneAndUpdate(
      { _id: promptId, clinician: req.clinician },
      { $addToSet: { transcript_ids: transcriptId }, updated_at: new Date() },
      { new: true }
    );

    if (!prompt) {
      return res.status(404).json({ msg: "Prompt not found or not accessible" });
    }

    res.status(200).json({ msg: "Transcript linked to prompt", data: prompt });
  } catch (error) {
    console.error("Error linking transcript:", error);
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
