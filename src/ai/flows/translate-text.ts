
'use server';

/**
 * @fileOverview An AI flow for translating text.
 * - translateText - A function that translates text to a target language.
 * - TranslateTextInput - The input type for the function.
 * - TranslateTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Hindi", "English").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

export const TranslateTextOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  // If the target is english, no need to translate.
  if (input.targetLanguage.toLowerCase() === 'english') {
    return { translation: input.text };
  }
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}. Only return the translated text. Do not include any preamble or explanation.

Text:
---
{{{text}}}
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
    // For short text, sometimes the model includes quotes. We remove them.
    const {output} = await prompt(input);
    return { translation: output!.translation.replace(/"/g, '') };
  }
);
