
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
    return { data: null, error: 'Ungültige Eingabe. Bitte überprüfe das Formular und versuche es erneut.' };
  }

  try {
    const result = await generateImposterWord(validation.data);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error generating imposter word:", error);
    return { data: null, error: "Beim Generieren des Wortes ist ein unerwarteter Fehler aufgetreten. Bitte versuche es später erneut." };
  }
}
