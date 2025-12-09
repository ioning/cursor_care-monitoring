/**
 * Environment variables validator
 * Ensures all required environment variables are set before application startup
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

export class EnvValidator {
  private static missingVars: string[] = [];
  private static invalidVars: string[] = [];

  /**
   * Validate environment variables
   * @param configs Array of environment variable configurations
   * @throws Error if required variables are missing or invalid
   */
  static validate(configs: EnvVarConfig[]): void {
    this.missingVars = [];
    this.invalidVars = [];

    for (const config of configs) {
      const value = process.env[config.name];

      // Check if required variable is missing
      if (config.required && !value && !config.defaultValue) {
        this.missingVars.push(config.name);
        continue;
      }

      // Validate value if validator provided
      if (value && config.validator) {
        if (!config.validator(value)) {
          this.invalidVars.push(
            config.name + (config.errorMessage ? `: ${config.errorMessage}` : ''),
          );
        }
      }
    }

    // Throw error if any issues found
    if (this.missingVars.length > 0 || this.invalidVars.length > 0) {
      const errors: string[] = [];

      if (this.missingVars.length > 0) {
        errors.push(
          `Missing required environment variables: ${this.missingVars.join(', ')}`,
        );
      }

      if (this.invalidVars.length > 0) {
        errors.push(`Invalid environment variables: ${this.invalidVars.join(', ')}`);
      }

      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Get environment variable or throw error if missing
   */
  static getRequired(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  /**
   * Get environment variable with default value
   */
  static getOptional(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
  }
}

/**
 * Common validators
 */
export const validators = {
  isNotEmpty: (value: string): boolean => value.trim().length > 0,
  isUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  isPort: (value: string): boolean => {
    const port = parseInt(value, 10);
    return !isNaN(port) && port > 0 && port <= 65535;
  },
  isJwtSecret: (value: string): boolean => {
    // JWT secret should be at least 32 characters
    return value.length >= 32;
  },
  isNotDefault: (value: string): boolean => {
    // Check if value is not a default/placeholder
    const defaults = [
      'default-secret',
      'change-in-production',
      'your-secret',
      'your-key',
      'placeholder',
    ];
    return !defaults.some((d) => value.toLowerCase().includes(d.toLowerCase()));
  },
};


 * Environment variables validator
 * Ensures all required environment variables are set before application startup
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

export class EnvValidator {
  private static missingVars: string[] = [];
  private static invalidVars: string[] = [];

  /**
   * Validate environment variables
   * @param configs Array of environment variable configurations
   * @throws Error if required variables are missing or invalid
   */
  static validate(configs: EnvVarConfig[]): void {
    this.missingVars = [];
    this.invalidVars = [];

    for (const config of configs) {
      const value = process.env[config.name];

      // Check if required variable is missing
      if (config.required && !value && !config.defaultValue) {
        this.missingVars.push(config.name);
        continue;
      }

      // Validate value if validator provided
      if (value && config.validator) {
        if (!config.validator(value)) {
          this.invalidVars.push(
            config.name + (config.errorMessage ? `: ${config.errorMessage}` : ''),
          );
        }
      }
    }

    // Throw error if any issues found
    if (this.missingVars.length > 0 || this.invalidVars.length > 0) {
      const errors: string[] = [];

      if (this.missingVars.length > 0) {
        errors.push(
          `Missing required environment variables: ${this.missingVars.join(', ')}`,
        );
      }

      if (this.invalidVars.length > 0) {
        errors.push(`Invalid environment variables: ${this.invalidVars.join(', ')}`);
      }

      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Get environment variable or throw error if missing
   */
  static getRequired(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  /**
   * Get environment variable with default value
   */
  static getOptional(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
  }
}

/**
 * Common validators
 */
export const validators = {
  isNotEmpty: (value: string): boolean => value.trim().length > 0,
  isUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  isPort: (value: string): boolean => {
    const port = parseInt(value, 10);
    return !isNaN(port) && port > 0 && port <= 65535;
  },
  isJwtSecret: (value: string): boolean => {
    // JWT secret should be at least 32 characters
    return value.length >= 32;
  },
  isNotDefault: (value: string): boolean => {
    // Check if value is not a default/placeholder
    const defaults = [
      'default-secret',
      'change-in-production',
      'your-secret',
      'your-key',
      'placeholder',
    ];
    return !defaults.some((d) => value.toLowerCase().includes(d.toLowerCase()));
  },
};







