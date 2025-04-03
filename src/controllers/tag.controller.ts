import { Request, Response, RequestHandler } from "express";
import * as tagService from "../services/tag.service";

// Get all tags
export const getTags: RequestHandler = async (req, res): Promise<void> => {
  try {
    const result = await tagService.getAllTags(req.query);
    res.json(result); // Sends { data: tags[], total: number }
  } catch (error: any) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Failed to fetch tags", message: error.message });
  }
};

// Get a single tag by ID
export const getTag: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const tag = await tagService.getTagById(id);

    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    res.json(tag);
  } catch (error: any) {
    console.error("Error fetching tag:", error);
    res.status(500).json({ error: "Failed to fetch tag", message: error.message });
  }
};

// Create a new tag
export const createTagHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const tag = await tagService.createTag(req.body);
    res.status(201).json(tag);
  } catch (error: any) {
     console.error("Error creating tag:", error);
     // Use status code from service error if available, otherwise default
     const statusCode = error.statusCode || 400;
     res.status(statusCode).json({ error: "Failed to create tag", message: error.message });
  }
};

// Update an existing tag
export const updateTagHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const tag = await tagService.updateTag(id, req.body);

    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    res.json(tag);
  } catch (error: any) {
    console.error("Error updating tag:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to update tag", message: error.message });
  }
};

// Delete a tag
export const deleteTagHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedTag = await tagService.deleteTag(id);

     if (!deletedTag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    // Successfully deleted
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting tag:", error);
    const statusCode = error.statusCode || 400; // Use 409 for conflict, 400 general
    res.status(statusCode).json({ error: "Failed to delete tag", message: error.message });
  }
};
