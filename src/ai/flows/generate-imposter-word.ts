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
  category: z.string().describe('The category for the imposter word.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for the imposter word and hint.'),
});
export type GenerateImposterWordInput = z.infer<typeof GenerateImposterWordInputSchema>;

const GenerateImposterWordOutputSchema = z.object({
  imposterWord: z.string().describe('The generated imposter word.'),
  hint: z.string().optional().describe('A hint for the imposter word.'),
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
  prompt: `You are an imposter word generator. You will generate an imposter word and a hint based on the category and difficulty level.

Category: {{{category}}}
Difficulty: {{{difficulty}}}

Difficulty levels:
- Easy: The imposter word is a common word related to the category, and the hint is a short definition or example of the word.
- Medium: The imposter word is a less common word related to the category, and the hint is a more detailed definition or example of the word.
- Hard: The imposter word is a rare or obscure word related to the category, and the hint is a cryptic clue or association.

Output the imposter word and the hint as a JSON object with the fields "imposterWord" and "hint". The hint field is optional and can be left blank.

{
  "imposterWord": "<imposter_word>",
  "hint": "<hint>"
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
