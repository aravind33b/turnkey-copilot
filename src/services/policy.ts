import { TurnkeyPolicy, AnalysisResult } from '../types';

/**
 * Analyzes a Turnkey policy for potential issues
 * @param policy The Turnkey policy object
 * @returns Analysis result with issues and suggestions
 */
export async function analyzePolicy(policy: TurnkeyPolicy): Promise<AnalysisResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check if this is a simplified policy format
  if ('policyName' in policy && 'effect' in policy && 'condition' in policy) {
    return analyzeSimplifiedPolicy(policy);
  }

  // Check for required approvals
  if (policy.required_approvals === undefined) {
    issues.push('Missing required_approvals field');
    suggestions.push('Add the required_approvals field to specify how many approvals are needed:\n```json\n{\n  "required_approvals": 1,\n  ...\n}\n```');
  } else if (policy.required_approvals < 1) {
    issues.push('required_approvals must be at least 1');
    suggestions.push('Update required_approvals to be at least 1:\n```json\n{\n  "required_approvals": 1,\n  ...\n}\n```');
  }

  // Check for signing keys
  if (!policy.signing_keys || policy.signing_keys.length === 0) {
    issues.push('No signing keys defined in the policy');
    suggestions.push('Add at least one signing key to the policy:\n```json\n{\n  "signing_keys": [\n    {\n      "key_id": "your-key-id",\n      "name": "Key Name",\n      "public_key": "your-public-key",\n      "algorithm": "ECDSA_SECP256K1"\n    }\n  ],\n  ...\n}\n```');
  } else {
    // Check each signing key for issues
    policy.signing_keys.forEach((key, index) => {
      if (!key.key_id) {
        issues.push(`Signing key at index ${index} is missing key_id`);
        suggestions.push(`Add key_id to the signing key at index ${index}:\n\`\`\`json\n"signing_keys": [\n  {\n    "key_id": "your-key-id",\n    ...\n  }\n]\n\`\`\``);
      }
      
      if (!key.public_key) {
        issues.push(`Signing key at index ${index} is missing public_key`);
        suggestions.push(`Add public_key to the signing key at index ${index}:\n\`\`\`json\n"signing_keys": [\n  {\n    "public_key": "your-public-key",\n    ...\n  }\n]\n\`\`\``);
      }
    });
  }

  // Check for allowed activities
  if (!policy.allowed_activities || policy.allowed_activities.length === 0) {
    issues.push('No allowed_activities defined in the policy');
    suggestions.push('Add allowed_activities to specify what operations are permitted:\n```json\n{\n  "allowed_activities": [\n    {\n      "type": "SIGN_WITH_INTENT",\n      "resources": ["*"]\n    }\n  ],\n  ...\n}\n```');
  } else {
    // Check each allowed activity for issues
    policy.allowed_activities.forEach((activity, index) => {
      if (!activity.type) {
        issues.push(`Allowed activity at index ${index} is missing type`);
        suggestions.push(`Add type to the allowed activity at index ${index}:\n\`\`\`json\n"allowed_activities": [\n  {\n    "type": "SIGN_WITH_INTENT",\n    ...\n  }\n]\n\`\`\``);
      }
      
      if (!activity.resources || activity.resources.length === 0) {
        issues.push(`Allowed activity at index ${index} has no resources defined`);
        suggestions.push(`Add resources to the allowed activity at index ${index}:\n\`\`\`json\n"allowed_activities": [\n  {\n    "resources": ["*"],\n    ...\n  }\n]\n\`\`\``);
      }

      // Check for Solana-specific policy conditions
      if (activity.parameters && activity.parameters.condition) {
        const condition = activity.parameters.condition as string;
        
        // Check for placeholder values in Solana conditions
        if (condition.includes('<SENDER_ADDRESS>')) {
          issues.push(`Solana policy condition at index ${index} contains placeholder '<SENDER_ADDRESS>'`);
          suggestions.push(`Replace '<SENDER_ADDRESS>' with an actual Solana address in the condition:\n\`\`\`json\n"condition": "solana.tx.transfers.all(transfer, transfer.from == 'actual_solana_address')"\n\`\`\``);
        }
        
        // Check for common Solana condition patterns
        if (condition.includes('solana.tx.transfers')) {
          // This is a valid pattern, but let's check for potential issues
          if (!condition.includes('.all(') && !condition.includes('.any(')) {
            issues.push(`Solana policy condition at index ${index} might be missing quantifier (all/any)`);
            suggestions.push(`Consider using 'all' or 'any' quantifier in your Solana condition:\n\`\`\`json\n"condition": "solana.tx.transfers.all(transfer, transfer.from == '<ADDRESS>')"\n\`\`\``);
          }
        }
      }
    });
  }

  // Check for sign_with_intent specific issues
  const signWithIntentActivity = policy.allowed_activities?.find(activity => 
    activity.type === 'SIGN_WITH_INTENT' || activity.type === 'SIGN_TRANSACTION'
  );

  if (signWithIntentActivity && signWithIntentActivity.type === 'SIGN_WITH_INTENT') {
    if (!signWithIntentActivity.parameters) {
      issues.push('SIGN_WITH_INTENT activity is missing parameters');
      suggestions.push('Add parameters to the SIGN_WITH_INTENT activity:\n```json\n{\n  "type": "SIGN_WITH_INTENT",\n  "parameters": {\n    "intent_action": "eth_signTypedData_v4",\n    "intent_version": "1"\n  },\n  ...\n}\n```');
    } else if (!signWithIntentActivity.parameters.intent_action) {
      issues.push('SIGN_WITH_INTENT activity is missing intent_action parameter');
      suggestions.push('Add intent_action parameter to the SIGN_WITH_INTENT activity:\n```json\n"parameters": {\n  "intent_action": "eth_signTypedData_v4",\n  ...\n}\n```');
    }
  }

  return { issues, suggestions };
}

/**
 * Analyzes a simplified Turnkey policy format
 * @param policy The simplified policy object with policyName, effect, and condition
 * @returns Analysis result with issues and suggestions
 */
function analyzeSimplifiedPolicy(policy: any): AnalysisResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for required fields
  if (!policy.policyName) {
    issues.push('Missing policyName field');
    suggestions.push('Add a descriptive policy name:\n```json\n{\n  "policyName": "Your Policy Name",\n  ...\n}\n```');
  }

  if (!policy.effect) {
    issues.push('Missing effect field');
    suggestions.push('Add the effect field (EFFECT_ALLOW or EFFECT_DENY):\n```json\n{\n  "effect": "EFFECT_ALLOW",\n  ...\n}\n```');
  } else if (policy.effect !== 'EFFECT_ALLOW' && policy.effect !== 'EFFECT_DENY') {
    issues.push(`Invalid effect value: ${policy.effect}`);
    suggestions.push('Use either "EFFECT_ALLOW" or "EFFECT_DENY" for the effect field');
  }

  if (!policy.condition) {
    issues.push('Missing condition field');
    suggestions.push('Add a condition expression:\n```json\n{\n  "condition": "your.condition.expression",\n  ...\n}\n```');
  } else {
    // Check for placeholder values in conditions
    if (policy.condition.includes('<SENDER_ADDRESS>')) {
      issues.push('Condition contains placeholder <SENDER_ADDRESS>');
      suggestions.push('Replace <SENDER_ADDRESS> with an actual blockchain address');
    }

    // Check for Solana-specific conditions
    if (policy.condition.includes('solana.tx.transfers')) {
      // This is a valid pattern, but let's check for potential issues
      if (!policy.condition.includes('.all(') && !policy.condition.includes('.any(')) {
        issues.push('Solana condition might be missing quantifier (all/any)');
        suggestions.push('Consider using "all" or "any" quantifier in your Solana condition:\n```json\n{\n  "condition": "solana.tx.transfers.all(transfer, transfer.from == \'your_address\')",\n  ...\n}\n```');
      }
    }
  }

  // If no issues found, provide helpful information
  if (issues.length === 0) {
    suggestions.push(
      'Your policy looks valid! Here\'s how to use it with Turnkey:\n\n' +
      '1. This policy will ' + (policy.effect === 'EFFECT_ALLOW' ? 'allow' : 'deny') + ' transactions that match the condition:\n' +
      '   `' + policy.condition + '`\n\n' +
      '2. For Solana conditions, make sure to replace any placeholders with actual addresses\n\n' +
      '3. You can apply this policy to your Turnkey organization or specific wallets'
    );
  }

  return { issues, suggestions };
}