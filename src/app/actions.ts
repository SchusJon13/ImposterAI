
"use server";

import { generateImposterWord, type GenerateImposterWordInput, type GenerateImposterWordOutput } from "@/ai/flows/generate-imposter-word";
import { z } from "zod";

const ImposterFormSchema = z.object({
  category: z.string().min(2, 'Category must be at least 2 characters long.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export async function getImposterWordAction(values: GenerateImposterWordInput): Promise<{
  data: GenerateImposterWordOutput | null;
  error: string | null;
}> {
  const validation = ImposterFormSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: 'Invalid input. Please check the form and try again.' };
  }

  try {
    const result = await generateImposterWord(validation.data);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error generating imposter word:", error);
    return { data: null, error: "An unexpected error occurred while generating the word. Please try again later." };
  }
}
