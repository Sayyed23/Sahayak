
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
  prompt: `You are a highly precise reading assessment analyst. Your task is to meticulously analyze a student's audio recording against a given passage of text.

  **Passage Text:**
  ---
  {{{passageText}}}
  ---

  **Audio Recording:**
  {{media url=audioDataUri}}

  **Your response MUST be a single, valid JSON object that strictly conforms to the output schema. No other text or explanation should be provided.**

  **Analysis Requirements:**
  You must calculate and include the following four (4) mandatory top-level fields in your JSON response: 'fluencyWPM', 'accuracyPercentage', 'analysis', and 'errorSummary'.

  1.  **fluencyWPM (number):** Calculate the student's reading fluency in Words Per Minute.
  2.  **accuracyPercentage (number):** Calculate the pronunciation accuracy as a percentage.
  3.  **errorSummary (object):** Provide a summary count for each error type: 'mispronunciations', 'substitutions', 'omissions', 'insertions'.
  4.  **analysis (array):** Provide a detailed, word-by-word analysis.
      - For every word spoken in the audio, you **MUST** provide its 'startTime' and 'endTime' in seconds.
      - Omissions will not have timestamps.
      - The 'status' must be one of: "correct", "mispronunciation", "substitution", "omission", or "insertion".

  **Example Output Format:**
  {
    "fluencyWPM": 85,
    "accuracyPercentage": 95.2,
    "errorSummary": {
      "mispronunciations": 1,
      "substitutions": 0,
      "omissions": 1,
      "insertions": 0
    },
    "analysis": [
      {
        "word": "The",
        "status": "correct",
        "startTime": 0.1,
        "endTime": 0.4
      },
      {
        "word": "quick",
        "status": "mispronunciation",
        "startTime": 0.5,
        "endTime": 0.8,
        "spokenWord": "quack"
      },
      {
        "word": "brown",
        "status": "omission"
      }
    ]
  }

  **Final Command:** Generate the JSON output now.`,
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
