import { Request, Response } from "express";
import { identifyContact, IdentifyRequest } from "../services/identify.service";

export async function identify(req: Request, res: Response): Promise<void> {
  try {
    const { email, phoneNumber } = req.body as IdentifyRequest;

    // Validate that body exists and has proper types
    if (email !== undefined && email !== null && typeof email !== "string") {
      res.status(400).json({ error: "email must be a string" });
      return;
    }

    if (
      phoneNumber !== undefined &&
      phoneNumber !== null &&
      typeof phoneNumber !== "string"
    ) {
      res.status(400).json({ error: "phoneNumber must be a string" });
      return;
    }

    // Trim whitespace
    const cleanEmail = email?.trim() || null;
    const cleanPhone = phoneNumber?.trim() || null;

    if (!cleanEmail && !cleanPhone) {
      res.status(400).json({
        error: "At least one of email or phoneNumber must be provided",
      });
      return;
    }

    const result = await identifyContact({
      email: cleanEmail,
      phoneNumber: cleanPhone,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("[identify] Error:", error);

    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
