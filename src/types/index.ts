/**
 * Turnkey configuration interface
 */
export interface TurnkeyConfig {
  org_id?: string;
  wallet_id?: string;
  api_public_key?: string;
  api_private_key?: string;
  base_url?: string;
  [key: string]: any;
}

/**
 * Turnkey policy interface
 */
export interface TurnkeyPolicy {
  required_approvals?: number;
  signing_keys?: SigningKey[];
  allowed_origins?: string[];
  allowed_request_origins?: string[];
  allowed_activities?: AllowedActivity[];
  [key: string]: any;
}

/**
 * Turnkey transaction signing request interface
 */
export interface TurnkeyTransactionRequest {
  timestampMs?: string;
  type?: string;
  organizationId?: string;
  parameters?: {
    type?: string;
    signWith?: string;
    unsignedTransaction?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Signing key interface
 */
export interface SigningKey {
  key_id?: string;
  name?: string;
  public_key?: string;
  algorithm?: string;
  [key: string]: any;
}

/**
 * Allowed activity interface
 */
export interface AllowedActivity {
  type?: string;
  resources?: string[];
  parameters?: Record<string, any>;
  [key: string]: any;
}

/**
 * Analysis result interface
 */
export interface AnalysisResult {
  issues: string[];
  suggestions: string[];
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: string;
}