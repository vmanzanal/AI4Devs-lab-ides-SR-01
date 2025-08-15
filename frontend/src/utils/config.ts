// Application Configuration
// Environment variables and app configuration

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  auth: {
    tokenStorageKey: string;
    refreshTokenStorageKey: string;
    tokenRefreshThreshold: number; // seconds before expiry to refresh
  };
  ui: {
    theme: {
      defaultMode: 'light' | 'dark' | 'auto';
    };
    pagination: {
      defaultPageSize: number;
      pageSizeOptions: number[];
    };
    notifications: {
      defaultDuration: number;
      maxNotifications: number;
    };
  };
  files: {
    maxUploadSize: number; // bytes
    allowedTypes: string[];
    cvUploadPath: string;
  };
  features: {
    enableDarkMode: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
    enableOfflineMode: boolean;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  api: {
    baseUrl: 'http://localhost:3010',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  auth: {
    tokenStorageKey: 'access_token',
    refreshTokenStorageKey: 'refresh_token',
    tokenRefreshThreshold: 300 // 5 minutes
  },
  ui: {
    theme: {
      defaultMode: 'light'
    },
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50, 100]
    },
    notifications: {
      defaultDuration: 5000,
      maxNotifications: 5
    }
  },
  files: {
    maxUploadSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['.pdf', '.doc', '.docx'],
    cvUploadPath: '/api/candidates'
  },
  features: {
    enableDarkMode: true,
    enableNotifications: true,
    enableAnalytics: false,
    enableOfflineMode: false
  }
};

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    // Start with default config
    const config: AppConfig = { ...defaultConfig };

    // Override with environment variables
    if (process.env.REACT_APP_API_URL) {
      config.api.baseUrl = process.env.REACT_APP_API_URL;
    }

    if (process.env.REACT_APP_API_TIMEOUT) {
      config.api.timeout = parseInt(process.env.REACT_APP_API_TIMEOUT, 10);
    }

    if (process.env.REACT_APP_DEFAULT_THEME) {
      config.ui.theme.defaultMode = process.env.REACT_APP_DEFAULT_THEME as 'light' | 'dark' | 'auto';
    }

    if (process.env.REACT_APP_MAX_UPLOAD_SIZE) {
      config.files.maxUploadSize = parseInt(process.env.REACT_APP_MAX_UPLOAD_SIZE, 10);
    }

    if (process.env.REACT_APP_ENABLE_DARK_MODE) {
      config.features.enableDarkMode = process.env.REACT_APP_ENABLE_DARK_MODE === 'true';
    }

    if (process.env.REACT_APP_ENABLE_ANALYTICS) {
      config.features.enableAnalytics = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
    }

    // Validate configuration
    this.validateConfig(config);

    return config;
  }

  private validateConfig(config: AppConfig): void {
    // Validate API URL
    try {
      new URL(config.api.baseUrl);
    } catch (error) {
      console.warn(`Invalid API URL: ${config.api.baseUrl}, using default`);
      config.api.baseUrl = defaultConfig.api.baseUrl;
    }

    // Validate timeout
    if (config.api.timeout < 1000 || config.api.timeout > 300000) {
      console.warn(`Invalid API timeout: ${config.api.timeout}ms, using default`);
      config.api.timeout = defaultConfig.api.timeout;
    }

    // Validate max upload size
    if (config.files.maxUploadSize < 0 || config.files.maxUploadSize > 50 * 1024 * 1024) {
      console.warn(`Invalid max upload size: ${config.files.maxUploadSize} bytes, using default`);
      config.files.maxUploadSize = defaultConfig.files.maxUploadSize;
    }
  }

  public get(): AppConfig {
    return { ...this.config };
  }

  public getApiConfig() {
    return { ...this.config.api };
  }

  public getAuthConfig() {
    return { ...this.config.auth };
  }

  public getUIConfig() {
    return { ...this.config.ui };
  }

  public getFileConfig() {
    return { ...this.config.files };
  }

  public getFeatureFlags() {
    return { ...this.config.features };
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  public isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  public getVersion(): string {
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  public getBuildInfo(): {
    version: string;
    buildTime: string;
    environment: string;
    gitCommit?: string;
  } {
    return {
      version: this.getVersion(),
      buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      gitCommit: process.env.REACT_APP_GIT_COMMIT
    };
  }
}

// Create and export singleton instance
export const config = new ConfigManager();

// Export individual configs for convenience
export const apiConfig = config.getApiConfig();
export const authConfig = config.getAuthConfig();
export const uiConfig = config.getUIConfig();
export const fileConfig = config.getFileConfig();
export const featureFlags = config.getFeatureFlags();
