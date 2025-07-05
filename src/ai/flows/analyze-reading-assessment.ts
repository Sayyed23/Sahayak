
'use server';

/**
 * @fileOverview An AI agent for analyzing a student's reading assessment.
 *
 * - analyzeReadingAssessment - A function that analyzes a student's reading audio against a passage.
 * - AnalyzeReadingAssessmentInput - The input type for the function.
 * - AnalyzeReadingAssessmentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeReadingAssessmentInputSchema = z.object({
  passageText: z.string().describe('The original text of the reading passage.'),
  audioDataUri: z.string().describe("The student's audio recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AnalyzeReadingAssessmentInput = z.infer<typeof AnalyzeReadingAssessmentInputSchema>;


const WordAnalysisSchema = z.object({
  word: z.string().describe("The word from the passage, or the inserted word."),
  status: z.enum(["correct", "mispronunciation", "omission", "insertion", "substitution"]).describe("The analysis of how the word was read."),
  startTime: z.number().optional().describe("The start time in seconds if the word was spoken. Not present for omissions."),
  endTime: z.number().optional().describe("The end time in seconds if the word was spoken. Not present for omissions."),
  spokenWord: z.string().optional().describe("The word that was actually spoken by the student, e.g., for substitutions or mispronunciations.")
});

const ErrorSummarySchema = z.object({
  mispronunciations: z.number().describe("The total number of mispronounced words."),
  substitutions: z.number().describe("The total number of substituted words."),
  omissions: z.number().describe("The total number of omitted words."),
  insertions: z.number().describe("The total number of inserted words."),
});

const AnalyzeReadingAssessmentOutputSchema = z.object({
  fluencyWPM: z.number().describe("The student's reading fluency in words per minute."),
  accuracyPercentage: z.number().describe("The student's pronunciation accuracy as a percentage."),
  analysis: z.array(WordAnalysisSchema).describe("A detailed, word-by-word analysis of the reading performance, including timestamps for spoken words and error classifications. The array should follow the sequence of the original passage, with insertions placed at the appropriate positions."),
  errorSummary: ErrorSummarySchema.describe("A summary count of each error type."),
});
export type AnalyzeReadingAssessmentOutput = z.infer<typeof AnalyzeReadingAssessmentOutputSchema>;

export async function analyzeReadingAssessment(input: AnalyzeReadingAssessmentInput): Promise<AnalyzeReadingAssessmentOutput> {
  return analyzeReadingAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReadingAssessmentPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: AnalyzeReadingAssessmentInputSchema},
  output: {schema: AnalyzeReadingAssessmentOutputSchema},
  prompt: `You are an expert reading assessment analyst. Your task is to analyze a student's audio recording against a given passage text and provide a detailed analysis.

  **Passage Text:**
  ---
  {{{passageText}}}
  ---

  **Audio Recording:**
  {{media url=audioDataUri}}

  **Analysis Requirements:**

  1.  **Fluency (WPM):** Calculate the student's reading fluency in Words Per Minute.
  2.  **Accuracy Percentage:** Calculate the pronunciation accuracy as a percentage.
  3.  **Word-by-Word Analysis:** Compare the audio to the text word by word.
      - Classify each word's status: "correct", "mispronunciation", "substitution", "omission", or "insertion".
      - **For every word spoken in the audio (correct, mispronounced, substituted, or inserted), you MUST provide its 'startTime' and 'endTime' in seconds.** Omissions will not have timestamps.
  4.  **Error Summary:** Count the total number of mispronunciations, substitutions, omissions, and insertions.

  **Output Command:**
  Your response MUST be a single, valid JSON object that strictly conforms to the output schema.
  The JSON object MUST contain these four top-level fields: 'fluencyWPM', 'accuracyPercentage', 'analysis', and 'errorSummary'. All fields are mandatory. Do not omit any fields.`,
});


const analyzeReadingAssessmentFlow = ai.defineFlow(
  {
    name: 'analyzeReadingAssessmentFlow',
    inputSchema: AnalyzeReadingAssessmentInputSchema,
    outputSchema: AnalyzeReadingAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
