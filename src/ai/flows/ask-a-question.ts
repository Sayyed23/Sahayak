'use server';

/**
 * @fileOverview Provides an AI flow to answer a question and provide an explanation with analogies.
 *
 * - askAQuestion - A function that handles the question answering process.
 * - AskAQuestionInput - The input type for the askAQuestion function.
 * - AskAQuestionOutput - The return type for the askAQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskAQuestionInputSchema = z.object({
  question: z.string().describe('The question to be answered.'),
  explanationLanguage: z
    .string()
    .describe('The language in which the explanation should be provided.'),
});
export type AskAQuestionInput = z.infer<typeof AskAQuestionInputSchema>;

const AskAQuestionOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the answer.'),
});
export type AskAQuestionOutput = z.infer<typeof AskAQuestionOutputSchema>;

export async function askAQuestion(input: AskAQuestionInput): Promise<AskAQuestionOutput> {
  return askAQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAQuestionPrompt',
  input: {schema: AskAQuestionInputSchema},
  output: {schema: AskAQuestionOutputSchema},
  prompt: `You are an expert in explaining complex topics in simple terms with analogies.

  Please answer the following question in {{explanationLanguage}} and provide an explanation with analogies:
  {{question}}`,
});

const askAQuestionFlow = ai.defineFlow(
  {
    name: 'askAQuestionFlow',
    inputSchema: AskAQuestionInputSchema,
    outputSchema: AskAQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
