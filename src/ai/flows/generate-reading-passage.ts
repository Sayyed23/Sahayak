
'use server';

/**
 * @fileOverview An AI agent for generating reading passages for assessments.
 *
 * - generateReadingPassage - A function that generates a reading passage.
 * - GenerateReadingPassageInput - The input type for the function.
 * - GenerateReadingPassageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReadingPassageInputSchema = z.object({
  topic: z.string().describe('The topic for the reading passage.'),
  gradeLevel: z.string().describe('The target grade level for the passage (e.g., "Grade 4").'),
  wordCount: z.number().describe('The approximate number of words for the passage.'),
});
export type GenerateReadingPassageInput = z.infer<typeof GenerateReadingPassageInputSchema>;

const GenerateReadingPassageOutputSchema = z.object({
  passage: z.string().describe('The generated reading passage.'),
});
export type GenerateReadingPassageOutput = z.infer<typeof GenerateReadingPassageOutputSchema>;

export async function generateReadingPassage(input: GenerateReadingPassageInput): Promise<GenerateReadingPassageOutput> {
  return generateReadingPassageFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateReadingPassagePrompt',
    input: {schema: GenerateReadingPassageInputSchema},
    output: {schema: GenerateReadingPassageOutputSchema},
    prompt: `Generate a reading passage of approximately {{wordCount}} words for a student in {{gradeLevel}} on the topic of "{{topic}}". The passage should be engaging, age-appropriate, and suitable for a reading fluency and accuracy assessment in an Indian context.`,
});

const generateReadingPassageFlow = ai.defineFlow(
  {
    name: 'generateReadingPassageFlow',
    inputSchema: GenerateReadingPassageInputSchema,
    outputSchema: GenerateReadingPassageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
