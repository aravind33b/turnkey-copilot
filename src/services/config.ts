import { TurnkeyConfig, AnalysisResult } from '../types';

/**
 * Analyzes a Turnkey configuration for potential issues
 * @param config The Turnkey configuration object
 * @returns Analysis result with issues and suggestions
 */
export async function analyzeConfig(config: TurnkeyConfig): Promise<AnalysisResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for missing required fields
  if (!config.org_id) {
    issues.push('Missing organization ID (org_id)');
    suggestions.push('Add your Turnkey organization ID to the configuration:\n```json\n{\n  "org_id": "your-org-id",\n  ...\n}\n```');
  }

  if (!config.wallet_id) {
    issues.push('Missing wallet ID (wallet_id)');
    suggestions.push('Add your Turnkey wallet ID to the configuration:\n```json\n{\n  "wallet_id": "your-wallet-id",\n  ...\n}\n```');
  }

  // Check for API key issues
  if (!config.api_public_key) {
    issues.push('Missing API public key (api_public_key)');
    suggestions.push('Add your Turnkey API public key to the configuration:\n```json\n{\n  "api_public_key": "your-api-public-key",\n  ...\n}\n```');
  }

  if (!config.api_private_key) {
    issues.push('Missing API private key (api_private_key)');
    suggestions.push('Add your Turnkey API private key to the configuration. For security, consider using environment variables:\n```json\n{\n  "api_private_key": "${TURNKEY_API_PRIVATE_KEY}",\n  ...\n}\n```');
  } else if (config.api_private_key.length < 20 && !config.api_private_key.includes('$')) {
    issues.push('API private key appears to be invalid or too short');
    suggestions.push('Ensure your API private key is correctly formatted. For security, consider using environment variables:\n```json\n{\n  "api_private_key": "${TURNKEY_API_PRIVATE_KEY}",\n  ...\n}\n```');
  }

  // Check for base URL issues
  if (!config.base_url) {
    issues.push('Missing base URL (base_url)');
    suggestions.push('Add the Turnkey API base URL to the configuration:\n```json\n{\n  "base_url": "https://api.turnkey.com",\n  ...\n}\n```');
  } else if (!config.base_url.startsWith('https://')) {
    issues.push('Base URL should use HTTPS for security');
    suggestions.push(`Update the base URL to use HTTPS:\n\`\`\`json\n{\n  "base_url": "https://${config.base_url.replace(/^http:\/\//, '')}",\n  ...\n}\n\`\`\``);
  }

  // Check for potential 401 error causes
  if (config.api_public_key && config.api_private_key && (!config.api_public_key.includes('TK') || config.api_public_key.length < 10)) {
    issues.push('API public key format appears invalid (might cause 401 errors)');
    suggestions.push('Ensure your API public key starts with "TK" and is correctly formatted according to Turnkey documentation');
  }

  return { issues, suggestions };
}