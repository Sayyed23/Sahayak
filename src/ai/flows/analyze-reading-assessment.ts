
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

const AnalyzeReadingAssessmentOutputSchema = z.object({
  fluencyWPM: z.number().describe("The student's reading fluency in words per minute."),
  accuracyPercentage: z.number().describe("The student's pronunciation accuracy as a percentage."),
  analysis: z.array(WordAnalysisSchema).describe("A detailed, word-by-word analysis of the reading performance, including timestamps for spoken words and error classifications. The array should follow the sequence of the original passage, with insertions placed at the appropriate positions."),
});
export type AnalyzeReadingAssessmentOutput = z.infer<typeof AnalyzeReadingAssessmentOutputSchema>;

export async function analyzeReadingAssessment(input: AnalyzeReadingAssessmentInput): Promise<AnalyzeReadingAssessmentOutput> {
  return analyzeReadingAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReadingAssessmentPrompt',
  input: {schema: AnalyzeReadingAssessmentInputSchema},
  output: {schema: AnalyzeReadingAssessmentOutputSchema},
  prompt: `You are an expert English reading teacher and assessment analyst. You will be given a passage of text and an audio recording of a student reading that passage. Your task is to provide a detailed, word-by-word analysis of the student's reading performance.

  Passage Text:
  ---
  {{{passageText}}}
  ---

  Audio Recording:
  {{media url=audioDataUri}}

  Please perform the following analysis and return it in the specified JSON format:
  1.  **Word-by-Word Analysis:** Go through the original passage word by word and compare it to the student's audio. For each word, determine its status:
      - **correct:** The word was read correctly.
      - **mispronunciation:** The word was read, but pronounced incorrectly.
      - **substitution:** The word was replaced by a different word.
      - **omission:** The word was skipped entirely.
      - **insertion:** The student added a word that was not in the text.
  2.  **Timestamps:** For every word that was actually spoken (including correct words, mispronunciations, substitutions, and insertions), you **must** provide its 'startTime' and 'endTime' in seconds from the beginning of the audio. Omitted words will not have timestamps.
  3.  **Spoken Word:** For substitutions and mispronunciations, provide the actual word the student said in the 'spokenWord' field.
  4.  **Overall Metrics:**
      - Calculate the student's reading fluency in Words Per Minute (WPM).
      - Calculate the pronunciation accuracy as a percentage.

  The final output must be a single JSON object. This object MUST contain the top-level properties: 'fluencyWPM', 'accuracyPercentage', and 'analysis'. The 'analysis' array must contain an object for each word in the original passage, in order, with insertions added at the points they occurred. Be precise and thorough.`,
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
