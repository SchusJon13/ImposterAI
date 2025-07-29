'use server';
/**
 * @fileOverview Generates an imposter word and hint based on a category and difficulty level.
 *
 * - generateImposterWord - A function that generates the imposter word and hint.
 * - GenerateImposterWordInput - The input type for the generateImposterWord function.
 * - GenerateImposterWordOutput - The return type for the generateImposterWord function.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
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
  hint: z.string().optional().describe('Ein Hilfswort für das Imposter-Wort.'),
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
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `Du bist ein Imposter-Wortgenerator. Deine Aufgabe ist es, ein geheimes Wort (imposterWord) und ein einzelnes Hilfswort (hint) zu generieren, basierend auf einer Kategorie und einem Schwierigkeitsgrad. Beide Wörter müssen auf Deutsch sein. Das Hilfswort ist für den Imposter bestimmt, damit dieser eine Chance hat, das geheime Wort zu erraten oder seine Rolle zu verschleiern.

Kategorie: {{{category}}}
Schwierigkeitsgrad: {{{difficulty}}}

Schwierigkeitsgrade:
- Leicht: Das Imposter-Wort ist ein gebräuchliches Wort. Das Hilfswort ist ein sehr naher Verwandter oder ein Oberbegriff.
- Mittel: Das Imposter-Wort ist etwas spezifischer. Das Hilfswort ist ein verwandtes Wort, aber nicht zu offensichtlich.
- Schwer: Das Imposter-Wort ist selten oder spezifisch. Das Hilfswort ist nur vage oder durch Assoziation mit dem Imposter-Wort verbunden.

Beispiel:
- Kategorie: "Obst", Schwierigkeitsgrad: "Leicht"
- Mögliches Imposter-Wort: "Apfel"
- Mögliches Hilfswort: "Frucht"

Gib das Imposter-Wort und das Hilfswort als JSON-Objekt mit den Feldern "imposterWord" und "hint" aus.

{
  "imposterWord": "<imposter_wort>",
  "hint": "<hilfswort>"
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
