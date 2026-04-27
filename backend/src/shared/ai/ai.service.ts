import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { buildCVGeneratePrompt } from './prompts/cv-generate.prompt';
import { buildCVTailorPrompt } from './prompts/cv-tailor.prompt';
import { buildATSAnalyzePrompt } from './prompts/ats-analyze.prompt';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly client: Anthropic;
  private readonly model =
    process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateCV(profileData: unknown): Promise<any> {
    const prompt = buildCVGeneratePrompt(profileData);
    const raw = await this.callAnthropic(prompt);
    return this.parseJson(raw);
  }

  async tailorCV(content: unknown, jobDescription: string): Promise<any> {
    const prompt = buildCVTailorPrompt(content, jobDescription);
    const raw = await this.callAnthropic(prompt);
    return this.parseJson(raw);
  }

  async analyzeATS(cvText: string, jobDescription: string): Promise<any> {
    const prompt = buildATSAnalyzePrompt(cvText, jobDescription);
    const raw = await this.callAnthropic(prompt);
    return this.parseJson(raw);
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const start = Date.now();

    try {
      const response = await this.client.completions.create(
        {
          model: this.model,
          prompt,
          max_tokens_to_sample: 1500,
        },
        { signal: controller.signal },
      );

      const duration = Date.now() - start;
      this.logger.log(
        `AI call finished in ${duration}ms using model ${this.model}`,
      );
      return response.completion ?? '';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('AI timeout. Coba lagi.');
      }
      this.logger.error(
        `AI call failed: ${error instanceof Error ? error.message : error}`,
      );
      throw new ServiceUnavailableException(
        'AI service tidak tersedia. Coba lagi.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseJson(raw: string): any {
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      throw new ServiceUnavailableException(
        'AI response tidak valid. Coba lagi.',
      );
    }
  }
}
