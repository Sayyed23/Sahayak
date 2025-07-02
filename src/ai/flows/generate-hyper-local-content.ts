'use server';
/**
 * @fileOverview An AI agent for generating hyper-local content for teachers.
 *
 * - generateHyperLocalContent - A function that generates hyper-local content.
 * - GenerateHyperLocalContentInput - The input type for the generateHyperLocalContent function.
 * - GenerateHyperLocalContentOutput - The return type for the generateHyperLocalContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHyperLocalContentInputSchema = z.object({
  text: z.string().describe('The content to generate, can include voice input.'),
  contentType: z.string().describe('The type of content to generate (e.g., story, explanation).'),
  outputLanguage: z.string().describe('The language to generate the content in.'),
});
export type GenerateHyperLocalContentInput = z.infer<typeof GenerateHyperLocalContentInputSchema>;

const GenerateHyperLocalContentOutputSchema = z.object({
  generatedContent: z.string().describe('The generated hyper-local content.'),
});
export type GenerateHyperLocalContentOutput = z.infer<typeof GenerateHyperLocalContentOutputSchema>;

export async function generateHyperLocalContent(input: GenerateHyperLocalContentInput): Promise<GenerateHyperLocalContentOutput> {
  return generateHyperLocalContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHyperLocalContentPrompt',
  input: {schema: GenerateHyperLocalContentInputSchema},
  output: {schema: GenerateHyperLocalContentOutputSchema},
  prompt: `You are an expert in generating hyper-local content for teachers in India.

You will generate content based on the following input:

Text: {{{text}}}
Content Type: {{{contentType}}}
Output Language: {{{outputLanguage}}}

Generate the content in the specified output language. The content should be relevant and engaging for students in under-resourced, multi-grade classrooms.
`,
});

const generateHyperLocalContentFlow = ai.defineFlow(
  {
    name: 'generateHyperLocalContentFlow',
    inputSchema: GenerateHyperLocalContentInputSchema,
    outputSchema: GenerateHyperLocalContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
