
'use server';
/**
 * @fileOverview An AI agent for generating educational games.
 *
 * - generateGame - A function that generates a game configuration.
 * - GenerateGameInput - The input type for the generateGame function.
 * - GameData - The type for the generated game data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for Quiz
const QuizQuestionSchema = z.object({
    questionText: z.string().describe("The text of the game question."),
    options: z.array(z.string()).length(4).describe("An array of 4 possible answers."),
    correctAnswerIndex: z.number().min(0).max(3).describe("The 0-based index of the correct answer in the options array."),
    explanation: z.string().describe("A brief explanation for why the correct answer is right."),
});
const QuizDataSchema = z.object({
  gameType: z.literal('quiz'),
  title: z.string().describe("A creative and engaging title for the quiz."),
  questions: z.array(QuizQuestionSchema).min(5).describe("An array of at least 5 quiz questions.")
});

// Schemas for Matching Game
const MatchingPairSchema = z.object({
  item1: z.string().describe("The first item in a pair to be matched (e.g., a word, a country)."),
  item2: z.string().describe("The second item in a pair to be matched (e.g., a definition, a capital city)."),
});
const MatchingDataSchema = z.object({
    gameType: z.literal('matching'),
    title: z.string().describe("A creative and engaging title for the matching game."),
    pairs: z.array(MatchingPairSchema).min(5).describe("An array of at least 5 pairs of items to be matched."),
    item1Title: z.string().describe("A title for the first column of items (e.g., 'Country')."),
    item2Title: z.string().describe("A title for the second column of items (e.g., 'Capital')."),
});

// Discriminated union for all game types
const GameDataSchema = z.discriminatedUnion("gameType", [
    QuizDataSchema,
    MatchingDataSchema
]);
export type GameData = z.infer<typeof GameDataSchema>;


const GenerateGameInputSchema = z.object({
  topic: z.string().describe('The educational topic for the game (e.g., "Indian states and capitals", "Photosynthesis").'),
  gradeLevel: z.string().describe('The target grade level for the game (e.g., "Grade 3").'),
  gameType: z.enum(['quiz', 'matching']).describe("The type of game to generate.")
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
  
Your task is to generate a complete game configuration based on the user's request.

Topic: {{topic}}
Grade Level: {{gradeLevel}}
Game Type: {{gameType}}

The content should be engaging, age-appropriate, and relevant to the Indian context where possible.
The output must be a valid JSON object matching the provided schema for the specified game type.

- If the game type is 'quiz', generate a multiple-choice quiz. The JSON output should conform to the 'quiz' schema, with a 'questions' array. Each question must have 4 options, a correct answer index, and a brief explanation. Generate at least 5 questions.
- If the game type is 'matching', generate a matching game. The JSON output should conform to the 'matching' schema, with a 'pairs' array. Generate at least 5 pairs of items to be matched. Also provide titles for each column of items (item1Title and item2Title). For example, if the topic is "Countries and Capitals", a pair could be {"item1": "India", "item2": "New Delhi"} and titles could be 'Country' and 'Capital'.
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
