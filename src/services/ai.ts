import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates an explanation for an issue using OpenAI
 * @param issue The issue description
 * @param suggestion The suggested fix
 * @returns AI-generated explanation
 */
export async function generateExplanation(issue: string, suggestion: string): Promise<string> {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return 'OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable to enable detailed explanations.';
    }

    const prompt = `
You are an expert in Turnkey API integration and crypto wallet infrastructure.
Explain the following issue in simple terms and why it's important to fix:

Issue: ${issue}

Suggested fix: ${suggestion}

Provide a clear explanation of:
1. Why this issue occurs
2. What problems it might cause
3. How the suggested fix resolves the issue
4. Any additional context that would help a developer understand
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that explains Turnkey API integration issues clearly and concisely.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'Unable to generate explanation.';
  } catch (error) {
    console.error('Error generating explanation:', error);
    return 'Failed to generate explanation. Please check your OpenAI API key and try again.';
  }
}