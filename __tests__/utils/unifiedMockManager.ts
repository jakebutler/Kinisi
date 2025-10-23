/**
 * Unified Mock Manager - Test Automator Solution
 *
 * Resolves mock inconsistency failures by providing centralized mock management
 * with standardized interfaces and validation across all test scenarios.
 */

import { jest } from '@jest/globals';
import { createAdvancedSupabaseMock, validateSupabaseMock, supabaseMockFactory } from './advancedSupabaseMock';

export class UnifiedMockManager {
  private static instance: UnifiedMockManager;
  private mockRegistry = new Map<string, any>();
  private validationErrors: string[] = [];

  static getInstance(): UnifiedMockManager {
    if (!UnifiedMockManager.instance) {
      UnifiedMockManager.instance = new UnifiedMockManager();
    }
    return UnifiedMockManager.instance;
  }

  /**
   * Create and register a standardized mock for consistent usage
   */
  createMock(scenario: string, overrides: any = {}) {
    const mockKey = `supabase_${scenario}`;

    // Use advanced mock factory for consistency
    const mock = supabaseMockFactory.scenarios[scenario as keyof typeof supabaseMockFactory.scenarios];
    const mockInstance = typeof mock === 'function' ? mock(overrides) : mock;

    // Register the mock globally
    this.mockRegistry.set(mockKey, mockInstance);

    // Ensure module consistency by updating both named and default exports
    this.updateModuleMock(mockInstance);

    return mockInstance;
  }

  /**
   * Update module mock to ensure consistency across imports
   */
  private updateModuleMock(mockInstance: any) {
    // Clear existing module cache to ensure fresh mock
    jest.clearAllMocks();
    jest.resetModules();

    // Mock the module with consistent structure
    jest.doMock('@/utils/supabaseClient', () => ({
      supabase: mockInstance.supabase || mockInstance.default,
      default: mockInstance.default || mockInstance.supabase,
    }));

    // Validate the mock immediately
    this.validateMockConsistency();
  }

  /**
   * Comprehensive validation of mock consistency
   */
  validateMockConsistency(): boolean {
    this.validationErrors = [];

    try {
      // Test module resolution
      const supabaseClient = require('@/utils/supabaseClient');

      // Validate structure consistency
      const validations = [
        this.validateModuleStructure(supabaseClient),
        this.validateAuthMethods(supabaseClient),
        this.validateDestructuringPattern(supabaseClient),
        this.validateAsyncBehavior(supabaseClient)
      ];

      return validations.every(result => result);

    } catch (error) {
      this.validationErrors.push(`Mock validation failed: ${error.message}`);
      console.error('❌ Mock validation errors:', this.validationErrors);
      return false;
    }
  }

  /**
   * Validate module export structure
   */
  private validateModuleStructure(supabaseClient: any): boolean {
    if (!supabaseClient.supabase && !supabaseClient.default) {
      this.validationErrors.push('Missing both supabase and default exports');
      return false;
    }

    const supabase = supabaseClient.supabase || supabaseClient.default;
    if (!supabase.auth || !supabase.auth.onAuthStateChange) {
      this.validationErrors.push('Invalid auth structure in mock');
      return false;
    }

    return true;
  }

  /**
   * Validate critical auth methods
   */
  private validateAuthMethods(supabaseClient: any): boolean {
    const supabase = supabaseClient.supabase || supabaseClient.default;

    const requiredMethods = ['getSession', 'getUser', 'onAuthStateChange', 'signOut'];
    const missingMethods = requiredMethods.filter(method =>
      !supabase.auth[method] || typeof supabase.auth[method] !== 'function'
    );

    if (missingMethods.length > 0) {
      this.validationErrors.push(`Missing auth methods: ${missingMethods.join(', ')}`);
      return false;
    }

    return true;
  }

  /**
   * Validate the critical destructuring pattern
   */
  private validateDestructuringPattern(supabaseClient: any): boolean {
    try {
      const supabase = supabaseClient.supabase || supabaseClient.default;
      const result = supabase.auth.onAuthStateChange(() => {});

      if (!result || !result.data || !result.data.subscription) {
        this.validationErrors.push('Invalid onAuthStateChange return structure');
        return false;
      }

      // Test the exact destructuring pattern that was failing
      const { data: { subscription } } = result;
      if (!subscription || typeof subscription.unsubscribe !== 'function') {
        this.validationErrors.push('Invalid subscription structure for destructuring');
        return false;
      }

      return true;
    } catch (error) {
      this.validationErrors.push(`Destructuring validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate async behavior consistency
   */
  private validateAsyncBehavior(supabaseClient: any): boolean {
    const supabase = supabaseClient.supabase || supabaseClient.default;

    // Test async methods return promises
    const asyncMethods = ['getSession', 'getUser', 'signOut'];
    for (const method of asyncMethods) {
      const result = supabase.auth[method]();
      if (!(result instanceof Promise)) {
        this.validationErrors.push(`${method} does not return a Promise`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get validation errors for debugging
   */
  getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Reset all mocks and registry
   */
  reset(): void {
    this.mockRegistry.clear();
    this.validationErrors = [];
    jest.clearAllMocks();
    jest.resetModules();
  }

  /**
   * Create mock with automatic validation and error handling
   */
  createValidatedMock(scenario: string, overrides: any = {}) {
    try {
      const mock = this.createMock(scenario, overrides);

      if (!this.validateMockConsistency()) {
        const errors = this.getValidationErrors();
        throw new Error(`Mock validation failed: ${errors.join(', ')}`);
      }

      return mock;
    } catch (error) {
      console.error(`❌ Failed to create validated mock for scenario: ${scenario}`, error);
      throw error;
    }
  }
}

// Export singleton instance for easy usage
export const unifiedMockManager = UnifiedMockManager.getInstance();

// Export convenience functions for test files
export const createStandardMock = (scenario: string, overrides?: any) => {
  return unifiedMockManager.createValidatedMock(scenario, overrides);
};

export const validateCurrentMock = (): boolean => {
  return unifiedMockManager.validateMockConsistency();
};

export const resetAllMocks = (): void => {
  unifiedMockManager.reset();
};

export default unifiedMockManager;