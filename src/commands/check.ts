import fs from 'fs/promises';
import path from 'path';
import JSON5 from 'json5';
import { analyzeConfig } from '../services/config';
import { analyzePolicy } from '../services/policy';
import { analyzeTransaction } from '../services/transaction';
import { generateExplanation } from '../services/ai';
import { TurnkeyConfig, TurnkeyPolicy, TurnkeyTransactionRequest } from '../types';

// Simple color functions to replace chalk
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`
};

interface CheckOptions {
  verbose?: boolean;
}

/**
 * Checks a Turnkey configuration or policy file for potential issues
 * @param filePath Path to the config or policy JSON file
 * @param options Command options
 */
export async function checkConfig(filePath: string, options: CheckOptions): Promise<void> {
  console.log(colors.blue('🔍 Analyzing Turnkey configuration...'));
  
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(process.cwd(), filePath);
    
    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read and parse the file
    const fileContent = await fs.readFile(resolvedPath, 'utf-8');
    let data: TurnkeyConfig | TurnkeyPolicy | TurnkeyTransactionRequest;
    
    try {
      data = JSON5.parse(fileContent);
    } catch (error) {
      throw new Error(`Invalid JSON format in file: ${filePath}`);
    }
    
    // Determine file type based on content
    let issues: string[] = [];
    let suggestions: string[] = [];
    let fileType: 'transaction' | 'policy' | 'config' = 'config';
    
    // Check if it's a transaction signing request
    if ('type' in data && data.type === 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2') {
      console.log(colors.green('📝 Detected Turnkey transaction signing request'));
      const { issues: txIssues, suggestions: txSuggestions } = await analyzeTransaction(data as TurnkeyTransactionRequest);
      issues = txIssues;
      suggestions = txSuggestions;
      fileType = 'transaction';
    }
    // Check if it's a policy file (traditional format or simplified format)
    else if (
      'required_approvals' in data || 
      'signing_keys' in data || 
      ('policyName' in data && 'effect' in data && 'condition' in data)
    ) {
      console.log(colors.green('📋 Detected Turnkey policy file'));
      const { issues: policyIssues, suggestions: policySuggestions } = await analyzePolicy(data as TurnkeyPolicy);
      issues = policyIssues;
      suggestions = policySuggestions;
      fileType = 'policy';
    }
    // Otherwise assume it's a config file
    else {
      console.log(colors.green('⚙️ Detected Turnkey configuration file'));
      const { issues: configIssues, suggestions: configSuggestions } = await analyzeConfig(data as TurnkeyConfig);
      issues = configIssues;
      suggestions = configSuggestions;
      fileType = 'config';
    }
    
    // Display results
    if (issues.length === 0) {
      console.log(colors.green('✅ No issues found!'));
      
      // Display helpful suggestions even when there are no issues
      if (suggestions.length > 0 && fileType === 'transaction') {
        console.log(colors.blue('\n📋 Next steps:'));
        console.log(suggestions[0]);
      }
      
      return;
    }
    
    console.log(colors.yellow(`\n🚨 Found ${issues.length} potential issues:`));
    
    for (let i = 0; i < issues.length; i++) {
      console.log(colors.yellow(`\n[Issue ${i + 1}]:`));
      console.log(issues[i]);
      
      if (suggestions[i]) {
        console.log(colors.green('\n[Suggested Fix]:'));
        console.log(suggestions[i]);
      }
      
      // Generate AI explanation if verbose mode is enabled
      if (options.verbose) {
        console.log(colors.blue('\n[Detailed Explanation]:'));
        const explanation = await generateExplanation(issues[i], suggestions[i]);
        console.log(explanation);
      }
    }
    
  } catch (error) {
    throw error;
  }
}