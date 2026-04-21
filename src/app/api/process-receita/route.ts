import { NextRequest, NextResponse } from "next/server";
import { parseReceita } from "@/lib/claude";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase auth token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrls } = await request.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "imageUrls array is required" },
        { status: 400 }
      );
    }

    const { medicines, rawText } = await parseReceita(imageUrls);

    return NextResponse.json({ medicines, rawText });
  } catch (error) {
    console.error("Error processing receita:", error);
    return NextResponse.json(
      { error: "Failed to process receita" },
      { status: 500 }
    );
  }
}
