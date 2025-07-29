'use server';
/**
 * @fileOverview Generates an imposter word and hint based on a category and difficulty level.
 *
 * - generateImposterWord - A function that generates the imposter word and hint.
 * - GenerateImposterWordInput - The input type for the generateImposterWord function.
 * - GenerateImposterWordOutput - The return type for the generateImposterWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImposterWordInputSchema = z.object({
  category: z.string().describe('Die Kategorie für das Imposter-Wort.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('Der Schwierigkeitsgrad für das Imposter-Wort und den Hinweis.'),
});
export type GenerateImposterWordInput = z.infer<typeof GenerateImposterWordInputSchema>;

const GenerateImposterWordOutputSchema = z.object({
  imposterWord: z.string().describe('Das generierte Imposter-Wort.'),
  hint: z.string().optional().describe('Ein Hinweis für das Imposter-Wort.'),
});
export type GenerateImposterWordOutput = z.infer<typeof GenerateImposterWordOutputSchema>;

export async function generateImposterWord(
  input: GenerateImposterWordInput
): Promise<GenerateImposterWordOutput> {
  return generateImposterWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImposterWordPrompt',
  input: {schema: GenerateImposterWordInputSchema},
  output: {schema: GenerateImposterWordOutputSchema},
  prompt: `Du bist ein Imposter-Wortgenerator. Du generierst ein Imposter-Wort und einen Hinweis basierend auf der Kategorie und dem Schwierigkeitsgrad. Die Wörter und Hinweise müssen auf Deutsch sein.

Kategorie: {{{category}}}
Schwierigkeitsgrad: {{{difficulty}}}

Schwierigkeitsgrade:
- Leicht: Das Imposter-Wort ist ein gebräuchliches Wort, das mit der Kategorie zusammenhängt, und der Hinweis ist eine kurze Definition oder ein Beispiel für das Wort.
- Mittel: Das Imposter-Wort ist ein weniger gebräuchliches Wort, das mit der Kategorie zusammenhängt, und der Hinweis ist eine detailliertere Definition oder ein Beispiel für das Wort.
- Schwer: Das Imposter-Wort ist ein seltenes oder obskures Wort, das mit der Kategorie zusammenhängt, und der Hinweis ist ein kryptischer Anhaltspunkt oder eine Assoziation.

Gib das Imposter-Wort und den Hinweis als JSON-Objekt mit den Feldern "imposterWord" und "hint" aus. Das Feld "hint" ist optional und kann leer gelassen werden.

{
  "imposterWord": "<imposter_wort>",
  "hint": "<hinweis>"
}
`,
});

const generateImposterWordFlow = ai.defineFlow(
  {
    name: 'generateImposterWordFlow',
    inputSchema: GenerateImposterWordInputSchema,
    outputSchema: GenerateImposterWordOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
