import { TurnkeyTransactionRequest, AnalysisResult } from '../types';

/**
 * Analyzes a Turnkey transaction signing request for potential issues
 * @param transaction The Turnkey transaction signing request object
 * @returns Analysis result with issues and suggestions
 */
export async function analyzeTransaction(transaction: TurnkeyTransactionRequest): Promise<AnalysisResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for required fields
  if (!transaction.organizationId) {
    issues.push('Missing organizationId field');
    suggestions.push('Add your Turnkey organization ID to the request:\n```json\n{\n  "organizationId": "your-org-id",\n  ...\n}\n```');
  }

  if (!transaction.type) {
    issues.push('Missing type field');
    suggestions.push('Add the activity type to the request:\n```json\n{\n  "type": "ACTIVITY_TYPE_SIGN_TRANSACTION_V2",\n  ...\n}\n```');
  } else if (transaction.type !== 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2') {
    issues.push(`Unsupported transaction type: ${transaction.type}`);
    suggestions.push('Use "ACTIVITY_TYPE_SIGN_TRANSACTION_V2" for the type field:\n```json\n{\n  "type": "ACTIVITY_TYPE_SIGN_TRANSACTION_V2",\n  ...\n}\n```');
  }

  if (!transaction.timestampMs) {
    issues.push('Missing timestampMs field');
    suggestions.push('Add a current timestamp in milliseconds:\n```json\n{\n  "timestampMs": "' + Date.now().toString() + '",\n  ...\n}\n```');
  }

  // Check parameters
  if (!transaction.parameters) {
    issues.push('Missing parameters object');
    suggestions.push('Add the parameters object with transaction details:\n```json\n{\n  "parameters": {\n    "type": "TRANSACTION_TYPE_ETHEREUM",\n    "signWith": "your-ethereum-address",\n    "unsignedTransaction": "your-unsigned-transaction-hex"\n  },\n  ...\n}\n```');
  } else {
    // Check transaction type
    if (!transaction.parameters.type) {
      issues.push('Missing transaction type in parameters');
      suggestions.push('Add the transaction type to parameters:\n```json\n"parameters": {\n  "type": "TRANSACTION_TYPE_ETHEREUM",\n  ...\n}\n```');
    } else {
      // Check for supported blockchain types
      const supportedTypes = ['TRANSACTION_TYPE_ETHEREUM', 'TRANSACTION_TYPE_SOLANA', 'TRANSACTION_TYPE_BITCOIN'];
      if (!supportedTypes.includes(transaction.parameters.type)) {
        issues.push(`Unsupported blockchain type: ${transaction.parameters.type}`);
        suggestions.push(`Use one of the supported blockchain types: ${supportedTypes.join(', ')}`);
      }
    }

    // Check signing address
    if (!transaction.parameters.signWith) {
      issues.push('Missing signWith address in parameters');
      suggestions.push('Add the address to sign with:\n```json\n"parameters": {\n  "signWith": "your-blockchain-address",\n  ...\n}\n```');
    } else {
      // Validate address format based on blockchain type
      if (transaction.parameters.type === 'TRANSACTION_TYPE_ETHEREUM') {
        if (!transaction.parameters.signWith.startsWith('0x') || transaction.parameters.signWith.length !== 42) {
          issues.push('Invalid Ethereum address format');
          suggestions.push('Ethereum addresses should start with "0x" and be 42 characters long');
        }
      }
    }

    // Check unsigned transaction
    if (!transaction.parameters.unsignedTransaction) {
      issues.push('Missing unsignedTransaction in parameters');
      suggestions.push('Add the unsigned transaction hex:\n```json\n"parameters": {\n  "unsignedTransaction": "your-unsigned-transaction-hex",\n  ...\n}\n```');
    } else {
      // Basic validation of transaction hex
      if (!/^0x[0-9a-f]+$/i.test(transaction.parameters.unsignedTransaction) && 
          !/^[0-9a-f]+$/i.test(transaction.parameters.unsignedTransaction)) {
        issues.push('Invalid transaction hex format');
        suggestions.push('Transaction hex should contain only hexadecimal characters, optionally starting with "0x"');
      }
    }
  }

  // Add helpful information about next steps
  if (issues.length === 0) {
    suggestions.push(
      'Your transaction signing request looks valid! Here\'s how to use it with Turnkey:\n\n' +
      '1. Use the Turnkey API to submit this request:\n' +
      '```bash\n' +
      'turnkey request --path /public/v1/submit/sign_transaction --body \'<your-json-content>\' --key-name your-key-name\n' +
      '```\n\n' +
      '2. From the response, extract the "signedTransaction" value:\n' +
      '```json\n' +
      '{\n' +
      '  "activity": {\n' +
      '    "result": {\n' +
      '      "signTransactionResult": {\n' +
      '        "signedTransaction": "0x..." // This is what you need\n' +
      '      }\n' +
      '    }\n' +
      '  }\n' +
      '}\n' +
      '```\n\n' +
      '3. Broadcast the signed transaction to the blockchain network using etherscan:\n' +
      'https://etherscan.io/tx/0x...' +
      `\n\n` +
      '4. Track your transaction on a blockchain explorer like Etherscan'
    );
  }

  return { issues, suggestions };
}
