/**
 * Audit Middleware
 * Middleware for automatic audit logging of API calls and state changes
 */

import { 
  AuditAction, 
  AuditEntityType, 
  AuditChange 
} from '../types/audit';
import { auditService } from '../services/auditService';
import { auditComparators, auditPerformanceMonitor } from '../utils/auditUtils';

/**
 * API Audit Middleware
 * Automatically logs API requests and responses
 */
export interface APIAuditConfig {
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
  enableErrorLogging: boolean;
  enablePerformanceLogging: boolean;
  excludeEndpoints: string[];
  sensitiveFields: string[];
  maxPayloadSize: number;
}

export class APIAuditMiddleware {
  private config: APIAuditConfig;

  constructor(config: Partial<APIAuditConfig> = {}) {
    this.config = {
      enableRequestLogging: true,
      enableResponseLogging: true,
      enableErrorLogging: true,
      enablePerformanceLogging: true,
      excludeEndpoints: ['/health', '/ping'],
      sensitiveFields: ['password', 'token', 'secret', 'key'],
      maxPayloadSize: 10000,
      ...config
    };
  }

  /**
   * Fetch interceptor for audit logging
   */
  createFetchInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      
      // Skip excluded endpoints
      if (this.config.excludeEndpoints.some(endpoint => url.includes(endpoint))) {
        return originalFetch(input, init);
      }

      const stopTimer = this.config.enablePerformanceLogging 
        ? auditPerformanceMonitor.startTimer(`api_${method}_${url}`)
        : () => {};

      const startTime = Date.now();
      let requestBody: any = null;

      try {
        // Log request
        if (this.config.enableRequestLogging && init?.body) {
          requestBody = await this.parseRequestBody(init.body);
        }

        const response = await originalFetch(input, init);
        const duration = Date.now() - startTime;
        
        stopTimer();

        // Log successful response
        if (this.config.enableResponseLogging) {
          await this.logAPICall(
            method as AuditAction,
            url,
            requestBody,
            response.status,
            duration,
            true
          );
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        stopTimer();

        // Log error
        if (this.config.enableErrorLogging) {
          await this.logAPICall(
            method as AuditAction,
            url,
            requestBody,
            0,
            duration,
            false,
            error as Error
          );
        }

        throw error;
      }
    };
  }

  /**
   * Axios interceptor for audit logging
   */
  createAxiosInterceptor() {
    return {
      request: (config: any) => {
        // Add request timestamp for duration calculation
        config.metadata = {
          startTime: Date.now(),
          stopTimer: this.config.enablePerformanceLogging 
            ? auditPerformanceMonitor.startTimer(`api_${config.method}_${config.url}`)
            : () => {}
        };
        return config;
      },

      response: async (response: any) => {
        const { config } = response;
        const duration = Date.now() - config.metadata.startTime;
        config.metadata.stopTimer();

        if (this.config.enableResponseLogging) {
          await this.logAPICall(
            config.method.toUpperCase(),
            config.url,
            config.data,
            response.status,
            duration,
            true
          );
        }

        return response;
      },

      error: async (error: any) => {
        const { config } = error;
        if (config?.metadata) {
          const duration = Date.now() - config.metadata.startTime;
          config.metadata.stopTimer();

          if (this.config.enableErrorLogging) {
            await this.logAPICall(
              config.method.toUpperCase(),
              config.url,
              config.data,
              error.response?.status || 0,
              duration,
              false,
              error
            );
          }
        }

        throw error;
      }
    };
  }

  private async parseRequestBody(body: BodyInit): Promise<any> {
    try {
      if (typeof body === 'string') {
        return JSON.parse(body);
      }
      
      if (body instanceof FormData) {
        const formObject: Record<string, any> = {};
        body.forEach((value, key) => {
          formObject[key] = value;
        });
        return formObject;
      }
      
      return body;
    } catch {
      return null;
    }
  }

  private async logAPICall(
    method: string,
    url: string,
    requestBody: any,
    statusCode: number,
    duration: number,
    success: boolean,
    error?: Error
  ) {
    try {
      const action = this.mapMethodToAction(method);
      const entityType = this.extractEntityTypeFromURL(url);
      const entityId = this.extractEntityIdFromURL(url);

      const sanitizedBody = this.sanitizePayload(requestBody);
      
      const metadata = {
        url,
        method,
        statusCode,
        duration,
        requestSize: JSON.stringify(sanitizedBody).length,
        userAgent: navigator.userAgent
      };

      if (success) {
        await auditService.logAction(
          action,
          entityType,
          entityId,
          [],
          metadata
        );
      } else if (error) {
        await auditService.logError(
          action,
          entityType,
          entityId,
          error,
          metadata
        );
      }
    } catch (auditError) {
      console.error('Failed to log API audit event:', auditError);
    }
  }

  private mapMethodToAction(method: string): AuditAction {
    const methodMap: Record<string, AuditAction> = {
      'GET': 'read',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };
    
    return methodMap[method.toUpperCase()] || 'read';
  }

  private extractEntityTypeFromURL(url: string): AuditEntityType {
    // Extract entity type from URL patterns
    if (url.includes('/roles')) return 'role';
    if (url.includes('/permissions')) return 'permission';
    if (url.includes('/users')) return 'user';
    if (url.includes('/semesters')) return 'semester';
    if (url.includes('/holidays')) return 'holiday';
    if (url.includes('/prefixes')) return 'title_prefix';
    if (url.includes('/settings')) return 'system_settings';
    
    return 'system_settings';
  }

  private extractEntityIdFromURL(url: string): string {
    // Extract ID from URL patterns like /api/users/123
    const matches = url.match(/\/(\d+)(?:\/|$)/);
    return matches ? matches[1] : url;
  }

  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = { ...payload };
    
    // Remove sensitive fields
    this.config.sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Truncate large payloads
    const payloadString = JSON.stringify(sanitized);
    if (payloadString.length > this.config.maxPayloadSize) {
      return {
        ...sanitized,
        _truncated: true,
        _originalSize: payloadString.length
      };
    }

    return sanitized;
  }
}

/**
 * State Management Audit Middleware
 * For Redux, Zustand, or other state management libraries
 */
export interface StateAuditConfig {
  enableStateLogging: boolean;
  enableActionLogging: boolean;
  excludeActions: string[];
  maxStateSize: number;
  trackStateChanges: boolean;
}

export class StateAuditMiddleware {
  private config: StateAuditConfig;
  private previousState: any = null;

  constructor(config: Partial<StateAuditConfig> = {}) {
    this.config = {
      enableStateLogging: true,
      enableActionLogging: true,
      excludeActions: ['@@redux/INIT', '@@redux/PROBE_UNKNOWN_ACTION'],
      maxStateSize: 50000,
      trackStateChanges: true,
      ...config
    };
  }

  /**
   * Redux middleware
   */
  createReduxMiddleware() {
    return (store: any) => (next: any) => async (action: any) => {
      // Skip excluded actions
      if (this.config.excludeActions.includes(action.type)) {
        return next(action);
      }

      const prevState = this.config.trackStateChanges ? store.getState() : null;
      const result = next(action);
      const nextState = this.config.trackStateChanges ? store.getState() : null;

      try {
        if (this.config.enableActionLogging) {
          await this.logStateAction(action, prevState, nextState);
        }
      } catch (error) {
        console.error('Failed to log state audit event:', error);
      }

      return result;
    };
  }

  /**
   * Zustand middleware
   */
  createZustandMiddleware() {
    return (config: any) => (set: any, get: any, api: any) => {
      const wrappedSet = (partial: any, replace?: boolean) => {
        const prevState = get();
        const result = set(partial, replace);
        const nextState = get();

        // Log state change
        this.logStateChange(prevState, nextState, 'zustand_update');

        return result;
      };

      return config(wrappedSet, get, api);
    };
  }

  private async logStateAction(action: any, prevState: any, nextState: any) {
    try {
      const changes = this.config.trackStateChanges && prevState && nextState
        ? auditComparators.compareObjects(prevState, nextState)
        : [];

      const sanitizedAction = this.sanitizeState(action);
      const entityType = this.extractEntityTypeFromAction(action.type);

      await auditService.logAction(
        'update',
        entityType,
        action.type,
        changes,
        {
          actionType: action.type,
          actionPayload: sanitizedAction.payload,
          stateSize: JSON.stringify(nextState).length,
          changesCount: changes.length
        }
      );
    } catch (error) {
      console.error('Failed to log state action:', error);
    }
  }

  private async logStateChange(prevState: any, nextState: any, actionType: string) {
    try {
      const changes = auditComparators.compareObjects(prevState, nextState);
      
      if (changes.length > 0) {
        await auditService.logAction(
          'update',
          'system_settings',
          actionType,
          changes,
          {
            actionType,
            stateSize: JSON.stringify(nextState).length,
            changesCount: changes.length
          }
        );
      }
    } catch (error) {
      console.error('Failed to log state change:', error);
    }
  }

  private extractEntityTypeFromAction(actionType: string): AuditEntityType {
    const type = actionType.toLowerCase();
    
    if (type.includes('role')) return 'role';
    if (type.includes('permission')) return 'permission';
    if (type.includes('user')) return 'user';
    if (type.includes('semester')) return 'semester';
    if (type.includes('holiday')) return 'holiday';
    if (type.includes('prefix')) return 'title_prefix';
    
    return 'system_settings';
  }

  private sanitizeState(state: any): any {
    if (!state || typeof state !== 'object') {
      return state;
    }

    const stateString = JSON.stringify(state);
    if (stateString.length > this.config.maxStateSize) {
      return {
        _truncated: true,
        _originalSize: stateString.length,
        type: state.type || 'unknown'
      };
    }

    return state;
  }
}

/**
 * Form Audit Middleware
 * Tracks form interactions and submissions
 */
export class FormAuditMiddleware {
  private formStates: Map<string, any> = new Map();

  /**
   * Track form field changes
   */
  trackFieldChange(formId: string, fieldName: string, oldValue: any, newValue: any) {
    const formState = this.formStates.get(formId) || {};
    formState[fieldName] = { oldValue, newValue, timestamp: Date.now() };
    this.formStates.set(formId, formState);
  }

  /**
   * Log form submission
   */
  async logFormSubmission(
    formId: string,
    entityType: AuditEntityType,
    entityId: string,
    formData: any,
    success: boolean,
    error?: Error
  ) {
    try {
      const formState = this.formStates.get(formId) || {};
      const changes: AuditChange[] = [];

      // Create changes from tracked field changes
      Object.entries(formState).forEach(([fieldName, fieldData]: [string, any]) => {
        changes.push({
          field: fieldName,
          oldValue: fieldData.oldValue,
          newValue: fieldData.newValue,
          fieldType: typeof fieldData.newValue
        });
      });

      const metadata = {
        formId,
        formData: this.sanitizeFormData(formData),
        fieldCount: Object.keys(formState).length,
        submissionTime: new Date().toISOString()
      };

      if (success) {
        await auditService.logAction(
          'update',
          entityType,
          entityId,
          changes,
          metadata
        );
      } else if (error) {
        await auditService.logError(
          'update',
          entityType,
          entityId,
          error,
          metadata
        );
      }

      // Clear form state after logging
      this.formStates.delete(formId);
    } catch (auditError) {
      console.error('Failed to log form submission:', auditError);
    }
  }

  private sanitizeFormData(formData: any): any {
    const sensitiveFields = ['password', 'confirmPassword', 'token', 'secret'];
    const sanitized = { ...formData };

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

// Export singleton instances
export const apiAuditMiddleware = new APIAuditMiddleware();
export const stateAuditMiddleware = new StateAuditMiddleware();
export const formAuditMiddleware = new FormAuditMiddleware();