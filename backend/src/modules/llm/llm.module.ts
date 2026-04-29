import { DynamicModule, Module, Type } from '@nestjs/common';
import { OpenAiProvider } from './providers/openai.provider';
import { LLM_SERVICE } from './llm.interface';

@Module({})
export class LLMModule {
  /**
   * Register the module with a specific LLM provider
   */
  static forRoot(provider: string = 'openai'): DynamicModule {
    const providerClass = this.getProviderClass(provider);

    return {
      module: LLMModule,
      providers: [
        {
          provide: providerClass,
          useClass: providerClass,
        },
        {
          provide: LLM_SERVICE,
          useExisting: providerClass,
        },
      ],
      exports: [LLM_SERVICE],
      global: true,
    };
  }

  private static getProviderClass(provider: string): Type<any> {
    switch (provider) {
      case 'openai':
      default:
        return OpenAiProvider;
    }
  }
}
