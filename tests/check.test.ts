import { analyzeConfig } from '../src/services/config';
import { analyzePolicy } from '../src/services/policy';
import { TurnkeyConfig, TurnkeyPolicy } from '../src/types';

describe('Config Analysis', () => {
  test('should detect missing org_id', async () => {
    const config: TurnkeyConfig = {
      wallet_id: 'test-wallet',
      api_public_key: 'test-key',
      api_private_key: 'test-private-key',
      base_url: 'https://api.turnkey.com'
    };

    const result = await analyzeConfig(config);
    
    expect(result.issues).toContain('Missing organization ID (org_id)');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  test('should detect insecure base URL', async () => {
    const config: TurnkeyConfig = {
      org_id: 'test-org',
      wallet_id: 'test-wallet',
      api_public_key: 'test-key',
      api_private_key: 'test-private-key',
      base_url: 'http://api.turnkey.com' // Using HTTP instead of HTTPS
    };

    const result = await analyzeConfig(config);
    
    expect(result.issues).toContain('Base URL should use HTTPS for security');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  test('should pass with valid config', async () => {
    const config: TurnkeyConfig = {
      org_id: 'test-org',
      wallet_id: 'test-wallet',
      api_public_key: 'TK1234567890',
      api_private_key: 'this-is-a-long-enough-private-key-for-testing',
      base_url: 'https://api.turnkey.com'
    };

    const result = await analyzeConfig(config);
    
    expect(result.issues.length).toBe(0);
    expect(result.suggestions.length).toBe(0);
  });
});

describe('Policy Analysis', () => {
  test('should detect invalid required_approvals', async () => {
    const policy: TurnkeyPolicy = {
      required_approvals: 0, // Should be at least 1
      signing_keys: [
        {
          key_id: 'test-key',
          name: 'Test Key',
          public_key: 'test-public-key',
          algorithm: 'ECDSA_SECP256K1'
        }
      ],
      allowed_activities: [
        {
          type: 'SIGN_WITH_INTENT',
          resources: ['*']
        }
      ]
    };

    const result = await analyzePolicy(policy);
    
    expect(result.issues).toContain('required_approvals must be at least 1');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  test('should detect missing key_id in signing keys', async () => {
    const policy: TurnkeyPolicy = {
      required_approvals: 1,
      signing_keys: [
        {
          // Missing key_id
          name: 'Test Key',
          public_key: 'test-public-key',
          algorithm: 'ECDSA_SECP256K1'
        }
      ],
      allowed_activities: [
        {
          type: 'SIGN_WITH_INTENT',
          resources: ['*']
        }
      ]
    };

    const result = await analyzePolicy(policy);
    
    expect(result.issues).toContain('Signing key at index 0 is missing key_id');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  test('should pass with valid policy', async () => {
    const policy: TurnkeyPolicy = {
      required_approvals: 1,
      signing_keys: [
        {
          key_id: 'test-key',
          name: 'Test Key',
          public_key: 'test-public-key',
          algorithm: 'ECDSA_SECP256K1'
        }
      ],
      allowed_activities: [
        {
          type: 'SIGN_WITH_INTENT',
          resources: ['*'],
          parameters: {
            intent_action: 'eth_signTypedData_v4',
            intent_version: '1'
          }
        }
      ]
    };

    const result = await analyzePolicy(policy);
    
    expect(result.issues.length).toBe(0);
    expect(result.suggestions.length).toBe(0);
  });
});