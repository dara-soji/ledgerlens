import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import OpenAI from 'openai';
import { LLMServiceInterface } from '../llm.interface';

@Injectable()
export class OpenAiProvider implements OnModuleInit, LLMServiceInterface {
  private readonly logger = new Logger(OpenAiProvider.name);
  private openai: OpenAI;

  constructor(@Optional() openai?: OpenAI) {
    if (openai) {
      this.openai = openai;
    }
  }

  onModuleInit() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async createResponse(
    systemInstruction: string,
    userInput: string,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemInstruction,
          },
          {
            role: 'user',
            content: userInput,
          },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      });

      return response.choices[0].message.content;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error calling OpenAI API: ${errorMessage}`);
      throw new Error(`Failed to get response from OpenAI: ${errorMessage}`);
    }
  }
}
