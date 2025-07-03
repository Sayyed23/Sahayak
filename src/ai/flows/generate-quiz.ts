
'use server';
/**
 * @fileOverview An AI agent for generating educational quizzes.
 *
 * - generateQuiz - A function that generates a quiz configuration.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - QuizData - The type for the generated quiz data.
 * - QuizQuestion - The type for a single quiz question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuizQuestionSchema = z.object({
    questionText: z.string().describe("The text of the quiz question."),
    options: z.array(z.string()).length(4).describe("An array of 4 possible answers."),
    correctAnswerIndex: z.number().min(0).max(3).describe("The 0-based index of the correct answer in the options array."),
    explanation: z.string().describe("A brief explanation for why the correct answer is right."),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;


const QuizDataSchema = z.object({
  title: z.string().describe("A creative and engaging title for the quiz."),
  questions: z.array(QuizQuestionSchema).min(5).describe("An array of at least 5 quiz questions.")
});
export type QuizData = z.infer<typeof QuizDataSchema>;

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The educational topic for the quiz (e.g., "Indian states and capitals", "Photosynthesis").'),
  gradeLevel: z.string().describe('The target grade level for the game (e.g., "Grade 3").'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<QuizData> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: QuizDataSchema},
  prompt: `You are an expert in creating fun and educational quizzes for students in India.
  
  Your task is to generate a complete quiz with at least 5 questions based on the user's request.
  
  Topic: {{topic}}
  Grade Level: {{gradeLevel}}
  
  Please generate a quiz configuration. The content should be engaging, age-appropriate, and relevant to the Indian context where possible.
  
  The output must be a valid JSON object matching the provided schema.
  Each question must have 4 options, a correct answer index, and a brief explanation for the correct answer.
  Create a suitable title for the quiz.
  `,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: QuizDataSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
