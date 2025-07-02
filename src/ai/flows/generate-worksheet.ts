'use server';
/**
 * @fileOverview An AI agent for creating differentiated worksheets.
 *
 * - extractTextFromImage - Extracts text from an image using OCR.
 * - ExtractTextFromImageInput - The input type for the extractTextFromImage function.
 * - ExtractTextFromImageOutput - The return type for the extractTextFromImage function.
 *
 * - generateWorksheet - Generates a worksheet from text.
 * - GenerateWorksheetInput - The input for generating a worksheet.
 * - GenerateWorksheetOutput - The output for a generated worksheet.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema for extracting text
export const ExtractTextFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a textbook page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromImageInput = z.infer<typeof ExtractTextFromImageInputSchema>;

export const ExtractTextFromImageOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the image.'),
});
export type ExtractTextFromImageOutput = z.infer<typeof ExtractTextFromImageOutputSchema>;

export async function extractTextFromImage(input: ExtractTextFromImageInput): Promise<ExtractTextFromImageOutput> {
    const {text} = await ai.generate({
        prompt: [{media: {url: input.imageDataUri}}, {text: 'Extract all text content from the provided image. Respond only with the text from the image.'}],
    });
    return {extractedText: text};
}


// Schema for worksheet generation
export const GenerateWorksheetInputSchema = z.object({
  text: z.string().describe('The text content to create a worksheet from.'),
  gradeLevel: z.string().describe('The target grade level for the worksheet (e.g., "Grade 1-2").'),
  worksheetType: z.enum(['mcq', 'fill-blanks', 'short-answer']).describe('The type of worksheet to generate.'),
});
export type GenerateWorksheetInput = z.infer<typeof GenerateWorksheetInputSchema>;

export const GenerateWorksheetOutputSchema = z.object({
  worksheetContent: z.string().describe('The generated worksheet content in Markdown format.'),
});
export type GenerateWorksheetOutput = z.infer<typeof GenerateWorksheetOutputSchema>;

export async function generateWorksheet(input: GenerateWorksheetInput): Promise<GenerateWorksheetOutput> {
    return generateWorksheetFlow(input);
}

const worksheetPrompt = ai.definePrompt({
    name: 'generateWorksheetPrompt',
    input: {schema: GenerateWorksheetInputSchema},
    output: {schema: GenerateWorksheetOutputSchema},
    prompt: `You are an expert in creating differentiated educational materials for multi-grade classrooms in India.
    
    Based on the following text, create a worksheet for students in {{gradeLevel}}.
    The worksheet should be of the type: {{worksheetType}}.
    
    The output should be formatted in simple Markdown. Include headings, lists, and bold text where appropriate.

    Text content:
    ---
    {{{text}}}
    ---
    `,
});

const generateWorksheetFlow = ai.defineFlow({
    name: 'generateWorksheetFlow',
    inputSchema: GenerateWorksheetInputSchema,
    outputSchema: GenerateWorksheetOutputSchema,
}, async (input) => {
    const {output} = await worksheetPrompt(input);
    return output!;
});
