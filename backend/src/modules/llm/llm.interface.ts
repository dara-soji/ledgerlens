/**
 * Token for LLM service dependency injection
 */
export const LLM_SERVICE = 'LLM_SERVICE';

/**
 * Generic interface for LLM services to ensure consistent behavior
 * regardless of the underlying LLM provider.
 */
export interface LLMServiceInterface {
  /**
   * Creates a response from the LLM based on system instructions and user input
   *
   * @param systemInstruction - Instructions for the LLM's behavior
   * @param userInput - The user's input/query
   * @returns A string response from the LLM
   */
  createResponse(systemInstruction: string, userInput: string): Promise<string>;
}
