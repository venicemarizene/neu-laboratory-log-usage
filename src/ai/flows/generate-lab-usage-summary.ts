'use server';
/**
 * @fileOverview A Genkit flow for generating natural language summaries of laboratory usage patterns.
 *
 * - generateLabUsageSummary - A function that triggers the lab usage summary generation process.
 * - GenerateLabUsageSummaryInput - The input type for the generateLabUsageSummary function.
 * - GenerateLabUsageSummaryOutput - The return type for the generateLabUsageSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Represents a single entry from the Room_Logs Firestore collection.
 */
const RoomLogEntrySchema = z.object({
  professorId: z.string().describe('ID of the professor who used the room.'),
  roomId: z.string().describe('ID of the laboratory room used (e.g., M101).'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp when the session started.'),
  endTime: z.string().datetime().optional().describe('ISO 8601 timestamp when the session ended, if applicable.'),
  status: z.enum(['Active', 'Completed']).describe('Status of the lab usage session (e.g., Active, Completed).'),
});

const GenerateLabUsageSummaryInputSchema = z.object({
  logEntries: z.array(RoomLogEntrySchema).describe('A list of raw room log entries from Firestore for the specified period.'),
  timePeriod: z.enum(['Daily', 'Weekly', 'Monthly', 'Custom']).describe('The selected time period for the summary (Daily, Weekly, Monthly, or Custom).'),
  startDate: z.string().datetime().optional().describe('Optional: Start date of the custom period, if timePeriod is "Custom".'),
  endDate: z.string().datetime().optional().describe('Optional: End date of the custom period, if timePeriod is "Custom".'),
});
export type GenerateLabUsageSummaryInput = z.infer<typeof GenerateLabUsageSummaryInputSchema>;

const GenerateLabUsageSummaryOutputSchema = z.object({
  summary: z.string().describe('A natural language summary of the overall laboratory usage patterns for the given period.'),
  totalRoomUses: z.number().describe('Total number of distinct room usage sessions logged.'),
  totalUniqueProfessors: z.number().describe('Total number of unique professors who used rooms.'),
  peakUsageTimes: z.array(z.string()).describe('List of times or time ranges (e.g., "Mondays, 10 AM - 12 PM") identified as peak usage periods.'),
  underutilizedRooms: z.array(z.string()).describe('List of rooms that appear to be underutilized during the period.'),
  keyInsights: z.array(z.string()).describe('A list of key insights or trends observed from the usage data.'),
});
export type GenerateLabUsageSummaryOutput = z.infer<typeof GenerateLabUsageSummaryOutputSchema>;

const generateLabUsageSummaryPrompt = ai.definePrompt({
  name: 'generateLabUsageSummaryPrompt',
  input: { schema: GenerateLabUsageSummaryInputSchema },
  output: { schema: GenerateLabUsageSummaryOutputSchema },
  prompt: `You are an expert laboratory operations manager specializing in analyzing usage data. Your task is to provide a comprehensive summary and insights for the NEU Laboratory application based on the provided room log entries.

Analyze the following laboratory usage data for the {{timePeriod}} period.
{{#if startDate}} The period starts on {{startDate}}. {{/if}}
{{#if endDate}} The period ends on {{endDate}}. {{/if}}

Here are the raw room log entries in JSON format:

\`\`\`json
{{{logEntries}}}
\`\`\`

Based on this data, provide:
1.  A concise natural language summary of the overall laboratory usage patterns.
2.  The total number of distinct room usage sessions.
3.  The total number of unique professors who used rooms.
4.  Identify and list peak usage times or periods.
5.  Identify and list any rooms that appear to be underutilized.
6.  List any other key insights or trends you observe.

Ensure your output strictly adheres to the JSON schema provided.
`,
});

const generateLabUsageSummaryFlow = ai.defineFlow(
  {
    name: 'generateLabUsageSummaryFlow',
    inputSchema: GenerateLabUsageSummaryInputSchema,
    outputSchema: GenerateLabUsageSummaryOutputSchema,
  },
  async (input) => {
    // Stringify the logEntries to pass them as a single string to the prompt
    const stringifiedLogEntries = JSON.stringify(input.logEntries, null, 2);

    const { output } = await generateLabUsageSummaryPrompt({
      logEntries: stringifiedLogEntries,
      timePeriod: input.timePeriod,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    return output!;
  }
);

export async function generateLabUsageSummary(
  input: GenerateLabUsageSummaryInput
): Promise<GenerateLabUsageSummaryOutput> {
  return generateLabUsageSummaryFlow(input);
}
