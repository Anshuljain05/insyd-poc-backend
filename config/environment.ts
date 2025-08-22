export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  frontendUrl: process.env.FRONTEND_URL || 'https://notification-poc-web.vercel.app',
  email: {
    from: process.env.EMAIL_FROM || 'noreply@notifications.com',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    }
  }
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';

// Validate critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('✅ Environment configuration loaded:', {
  nodeEnv: config.nodeEnv,
  port: config.port,
  frontendUrl: config.frontendUrl,
  hasDatabase: !!config.databaseUrl,
  hasEmail: !!(config.email.smtp.user && config.email.smtp.pass)
});
