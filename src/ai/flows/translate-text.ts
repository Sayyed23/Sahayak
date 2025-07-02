
'use server';

/**
 * @fileOverview An AI flow for translating text.
 * - translateText - A function that translates text to a target language.
 * - TranslateTextInput - The input type for the function.
 * - TranslateTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  texts: z.array(z.string()).describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Hindi", "English").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translations: z.array(z.string()).describe('The translated texts, in the same order as the input texts.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  if (input.targetLanguage.toLowerCase() === 'english') {
    return { translations: input.texts };
  }
  if (input.texts.length === 0) {
    return { translations: [] };
  }
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following JSON array of strings into {{targetLanguage}}.
  
  IMPORTANT: 
  - Respond with a JSON object containing a single key "translations".
  - The value of "translations" must be an array of the translated strings.
  - The translated strings must be in the exact same order as the input array.
  - Do not translate placeholders like {{name}} or anything inside double curly braces. Keep them as they are.

Input:
---
{{{json texts}}}
---
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
