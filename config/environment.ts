export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  email: {
    from: process.env.EMAIL_FROM!,
    smtp: {
      host: process.env.SMTP_HOST!,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    }
  }
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
