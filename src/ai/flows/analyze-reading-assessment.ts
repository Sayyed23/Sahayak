
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

const ReadingErrorSchema = z.object({
    word: z.string().describe("The word that was read incorrectly or the context word for an omission/insertion."),
    errorType: z.enum(["mispronunciation", "omission", "insertion", "substitution"]).describe("The type of reading error."),
    expected: z.string().optional().describe("The expected word or pronunciation."),
    actual: z.string().optional().describe("What the student actually said."),
});

const AnalyzeReadingAssessmentInputSchema = z.object({
  passageText: z.string().describe('The original text of the reading passage.'),
  audioDataUri: z.string().describe("The student's audio recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AnalyzeReadingAssessmentInput = z.infer<typeof AnalyzeReadingAssessmentInputSchema>;

const AnalyzeReadingAssessmentOutputSchema = z.object({
  fluencyWPM: z.number().describe("The student's reading fluency in words per minute."),
  accuracyPercentage: z.number().describe("The student's pronunciation accuracy as a percentage."),
  gradedText: z.string().describe("The original passage with errors marked up using Markdown. Use **word** for mispronunciation/substitution, ~~word~~ for omission, and *word* for insertion."),
  errors: z.array(ReadingErrorSchema).describe("A detailed list of all identified reading errors."),
});
export type AnalyzeReadingAssessmentOutput = z.infer<typeof AnalyzeReadingAssessmentOutputSchema>;

export async function analyzeReadingAssessment(input: AnalyzeReadingAssessmentInput): Promise<AnalyzeReadingAssessmentOutput> {
  return analyzeReadingAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReadingAssessmentPrompt',
  input: {schema: AnalyzeReadingAssessmentInputSchema},
  output: {schema: AnalyzeReadingAssessmentOutputSchema},
  prompt: `You are an expert English reading teacher and assessment analyst. You will be given a passage of text and an audio recording of a student reading that passage. Your task is to analyze the student's reading performance and provide a detailed report.

  Passage Text:
  ---
  {{{passageText}}}
  ---

  Audio Recording:
  {{media url=audioDataUri}}

  Please perform the following analysis:
  1.  **Fluency:** Calculate the student's reading fluency in Words Per Minute (WPM).
  2.  **Accuracy:** Calculate the pronunciation accuracy as a percentage.
  3.  **Error Analysis:** Identify every reading error. The types of errors to look for are:
      - **mispronunciation:** A word that is pronounced incorrectly.
      - **omission:** A word from the passage that the student skipped.
      - **insertion:** A word spoken by the student that was not in the original passage.
      - **substitution:** A word from the passage that was replaced by a different word.
  4.  **Graded Text:** Provide the full original passage as a single string, but with all errors marked up using simple Markdown:
      - For mispronunciations and substitutions, wrap the incorrect word in **bold**.
      - For omissions, wrap the skipped word in ~~strikethrough~~.
      - For insertions, add the extra word and wrap it in *italics*.

  Return your analysis in the specified JSON output format. Be precise and thorough.`,
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
