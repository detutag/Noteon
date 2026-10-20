/**
 * Document API routes - Turso/libsql backend
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as db from "../../../lib/db";

// GET /api/documents - List all documents for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parentDocument = searchParams.get("parentDocument") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "true";

    const documents = await db.getDocumentsByUser(userId, {
      parentDocument: parentDocument || null,
      includeArchived,
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, parentDocument } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = await db.createDocument({
      title,
      userId,
      parentDocument: parentDocument || null,
    });

    const document = await db.getDocument(id);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
