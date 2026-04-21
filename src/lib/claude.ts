import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedMedicine } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a Brazilian pharmacy assistant. You will receive images of a medical prescription (receita medica) from the Brazilian public health system (SUS).

Your job: extract each medicine from the prescription.

For each medicine, return:
- name: the medicine name
- dosage: the dosage (e.g., "50mg", "850mg")
- instructions: how to take it (e.g., "1 comprimido", "20 gotas")
- frequency: how often (e.g., "12/12h", "8/8h", "1x ao dia")
- duration: how long (e.g., "30 dias", "uso continuo")

If any field is unclear or missing, use "nao encontrado" as the value.
Common abbreviations: cp/comp = comprimido, gt = gotas, mg = miligrama, ml = mililitro

Return ONLY a valid JSON array. No markdown, no explanation. Example:
[{"name":"Losartana","dosage":"50mg","instructions":"1 comprimido","frequency":"12/12h","duration":"30 dias"}]`;

export async function parseReceita(imageUrls: string[]): Promise<{
  medicines: ExtractedMedicine[];
  rawText: string;
}> {
  const imageContent: Anthropic.Messages.ImageBlockParam[] = await Promise.all(
    imageUrls.map(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const contentType = response.headers.get("content-type") || "image/jpeg";

      return {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: contentType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: base64,
        },
      };
    })
  );

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          {
            type: "text",
            text: SYSTEM_PROMPT,
          },
        ],
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let medicines: ExtractedMedicine[];
  try {
    medicines = JSON.parse(responseText);
  } catch {
    medicines = [];
  }

  return { medicines, rawText: responseText };
}
