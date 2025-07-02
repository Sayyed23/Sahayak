'use server';

/**
 * @fileOverview Visual aid designer AI agent.
 *
 * - designVisualAid - A function that handles the visual aid generation process.
 * - DesignVisualAidInput - The input type for the designVisualAid function.
 * - DesignVisualAidOutput - The return type for the designVisualAid function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DesignVisualAidInputSchema = z.object({
  description: z.string().describe('The description of the visual aid.'),
  style: z.enum(['hand-drawn', 'professional', 'chalkboard']).default('hand-drawn').describe('The style of the visual aid.'),
});
export type DesignVisualAidInput = z.infer<typeof DesignVisualAidInputSchema>;

const DesignVisualAidOutputSchema = z.object({
  imageUrl: z.string().describe('The generated image of the visual aid, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'),
});
export type DesignVisualAidOutput = z.infer<typeof DesignVisualAidOutputSchema>;

export async function designVisualAid(input: DesignVisualAidInput): Promise<DesignVisualAidOutput> {
  return designVisualAidFlow(input);
}

const prompt = ai.definePrompt({
  name: 'designVisualAidPrompt',
  input: {schema: DesignVisualAidInputSchema},
  output: {schema: DesignVisualAidOutputSchema},
  prompt: `You are an expert visual aid designer for teachers.

You will use the description to generate a visual aid for the teacher, in the specified style.

Description: {{{description}}}
Style: {{{style}}}

Ensure that the outputted image URL is a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const designVisualAidFlow = ai.defineFlow(
  {
    name: 'designVisualAidFlow',
    inputSchema: DesignVisualAidInputSchema,
    outputSchema: DesignVisualAidOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `${input.description}, in a ${input.style} style`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {imageUrl: media!.url};
  }
);
