
'use server';
/**
 * @fileOverview An AI agent for generating educational games.
 *
 * - generateGame - A function that generates a game configuration.
 * - GenerateGameInput - The input type for the generateGame function.
 * - GameData - The type for the generated game data.
 * - GameQuestion - The type for a single game question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GameQuestionSchema = z.object({
    questionText: z.string().describe("The text of the game question."),
    options: z.array(z.string()).length(4).describe("An array of 4 possible answers."),
    correctAnswerIndex: z.number().min(0).max(3).describe("The 0-based index of the correct answer in the options array."),
    explanation: z.string().describe("A brief explanation for why the correct answer is right."),
});
export type GameQuestion = z.infer<typeof GameQuestionSchema>;


const GameDataSchema = z.object({
  title: z.string().describe("A creative and engaging title for the game."),
  questions: z.array(GameQuestionSchema).min(5).describe("An array of at least 5 game questions.")
});
export type GameData = z.infer<typeof GameDataSchema>;

const GenerateGameInputSchema = z.object({
  topic: z.string().describe('The educational topic for the game (e.g., "Indian states and capitals", "Photosynthesis").'),
  gradeLevel: z.string().describe('The target grade level for the game (e.g., "Grade 3").'),
});
export type GenerateGameInput = z.infer<typeof GenerateGameInputSchema>;

export async function generateGame(input: GenerateGameInput): Promise<GameData> {
  return generateGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGamePrompt',
  input: {schema: GenerateGameInputSchema},
  output: {schema: GameDataSchema},
  prompt: `You are an expert in creating fun and educational games for students in India.
  
  Your task is to generate a complete game with at least 5 questions based on the user's request. This will be structured like a multiple-choice quiz.
  
  Topic: {{topic}}
  Grade Level: {{gradeLevel}}
  
  Please generate a game configuration. The content should be engaging, age-appropriate, and relevant to the Indian context where possible.
  
  The output must be a valid JSON object matching the provided schema.
  Each question must have 4 options, a correct answer index, and a brief explanation for the correct answer.
  Create a suitable title for the game.
  `,
});

const generateGameFlow = ai.defineFlow(
  {
    name: 'generateGameFlow',
    inputSchema: GenerateGameInputSchema,
    outputSchema: GameDataSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
