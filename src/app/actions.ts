
"use server";

import { generateImposterWord, type GenerateImposterWordInput, type GenerateImposterWordOutput } from "@/ai/flows/generate-imposter-word";
import { z } from "zod";

const ImposterFormSchema = z.object({
  category: z.string().min(2, 'Die Kategorie muss mindestens 2 Zeichen lang sein.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export async function getImposterWordAction(values: GenerateImposterWordInput): Promise<{
  data: GenerateImposterWordOutput | null;
  error: string | null;
}> {
  const validation = ImposterFormSchema.safeParse(values);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(', ');
    return { data: null, error: `Ungültige Eingabe: ${errorMessages}` };
  }

  try {
    const result = await generateImposterWord(validation.data);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in getImposterWordAction:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { data: null, error: `Beim Generieren des Wortes ist ein Fehler aufgetreten. (Details: ${errorMessage})` };
  }
}
