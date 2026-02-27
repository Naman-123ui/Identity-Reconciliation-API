import { Contact, LinkPrecedence } from "@prisma/client";
import { prisma } from "../prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

export interface IdentifyResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

// ─── Helper: Build consolidated response from a primaryId ─────────────────────

async function buildResponse(primaryId: number): Promise<IdentifyResponse> {
  // Fetch primary contact
  const primary = await prisma.contact.findUnique({
    where: { id: primaryId },
  });

  if (!primary) {
    throw new Error(`Primary contact with id ${primaryId} not found`);
  }

  // Fetch all secondary contacts linked to this primary
  const secondaries = await prisma.contact.findMany({
    where: {
      linkedId: primaryId,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  const allContacts = [primary, ...secondaries];

  // Deduplicate emails and phone numbers, primary's values come first
  const emails: string[] = [];
  const phoneNumbers: string[] = [];
  const secondaryContactIds: number[] = [];

  // Add primary's values first
  if (primary.email && !emails.includes(primary.email)) {
    emails.push(primary.email);
  }
  if (primary.phoneNumber && !phoneNumbers.includes(primary.phoneNumber)) {
    phoneNumbers.push(primary.phoneNumber);
  }

  // Then add secondary values
  for (const contact of secondaries) {
    if (contact.email && !emails.includes(contact.email)) {
      emails.push(contact.email);
    }
    if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
    }
    secondaryContactIds.push(contact.id);
  }

  return {
    contact: {
      primaryContactId: primaryId,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
}

// ─── Helper: Get root primary contact for any contact ─────────────────────────

async function getRootPrimary(contact: Contact): Promise<Contact> {
  if (contact.linkPrecedence === "primary") {
    return contact;
  }

  // Walk up the chain to find root primary
  let current = contact;
  while (current.linkedId !== null) {
    const parent = await prisma.contact.findUnique({
      where: { id: current.linkedId },
    });
    if (!parent) break;
    current = parent;
  }

  return current;
}

// ─── Main identify service ─────────────────────────────────────────────────────

export async function identifyContact(
  req: IdentifyRequest
): Promise<IdentifyResponse> {
  const { email, phoneNumber } = req;

  // Validate: at least one of email or phoneNumber must be provided
  if (!email && !phoneNumber) {
    throw new Error("At least one of email or phoneNumber must be provided");
  }

  // ── Step 1: Find all existing contacts matching either email or phone ─────

  const conditions: object[] = [];
  if (email) conditions.push({ email, deletedAt: null });
  if (phoneNumber) conditions.push({ phoneNumber, deletedAt: null });

  const matchingContacts = await prisma.contact.findMany({
    where: { OR: conditions },
    orderBy: { createdAt: "asc" },
  });

  // ── Step 2: No matches found → create new primary contact ─────────────────

  if (matchingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: LinkPrecedence.primary,
      },
    });

    return {
      contact: {
        primaryContactId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }

  // ── Step 3: Find all root primary contacts from the matches ───────────────

  const rootPrimaries: Contact[] = [];
  for (const contact of matchingContacts) {
    const root = await getRootPrimary(contact);
    if (!rootPrimaries.find((p) => p.id === root.id)) {
      rootPrimaries.push(root);
    }
  }

  // Sort primaries by creation date (oldest first)
  rootPrimaries.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const truePrimary = rootPrimaries[0];

  // ── Step 4: If multiple primaries found → merge them ─────────────────────
  // The oldest primary stays, all others become secondary

  if (rootPrimaries.length > 1) {
    for (let i = 1; i < rootPrimaries.length; i++) {
      const demoted = rootPrimaries[i];

      // Demote this primary to secondary
      await prisma.contact.update({
        where: { id: demoted.id },
        data: {
          linkedId: truePrimary.id,
          linkPrecedence: LinkPrecedence.secondary,
        },
      });

      // Re-link all of demoted primary's secondaries to the true primary
      await prisma.contact.updateMany({
        where: { linkedId: demoted.id },
        data: { linkedId: truePrimary.id },
      });
    }
  }

  // ── Step 5: Check if the incoming request has new information ─────────────
  // If so, create a new secondary contact

  // Get all contacts now linked to truePrimary (after potential merge)
  const allLinked = await prisma.contact.findMany({
    where: {
      OR: [{ id: truePrimary.id }, { linkedId: truePrimary.id }],
      deletedAt: null,
    },
  });

  const existingEmails = new Set(
    allLinked.map((c) => c.email).filter(Boolean) as string[]
  );
  const existingPhones = new Set(
    allLinked.map((c) => c.phoneNumber).filter(Boolean) as string[]
  );

  const isNewEmail = email && !existingEmails.has(email);
  const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  // Only create a new secondary if there's genuinely new info
  // AND the combination doesn't already exist as a single contact
  if (isNewEmail || isNewPhone) {
    await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkedId: truePrimary.id,
        linkPrecedence: LinkPrecedence.secondary,
      },
    });
  }

  // ── Step 6: Build and return the consolidated response ────────────────────

  return buildResponse(truePrimary.id);
}
