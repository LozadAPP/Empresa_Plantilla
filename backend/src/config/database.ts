import { Sequelize } from 'sequelize';
import { env } from './env';

// Determine logging level based on environment
const getLoggingConfig = () => {
  if (env.NODE_ENV === 'production') {
    return false; // No SQL logging in production
  }
  if (env.DB_LOGGING === 'false') {
    return false; // Allow disabling in development too
  }
  if (env.DB_LOGGING === 'minimal') {
    // Only log slow queries (> 1 second)
    return (msg: string, timing?: number) => {
      if (timing && timing > 1000) {
        console.log(`WARNING: Slow query (${timing}ms):`, msg);
      }
    };
  }
  return console.log; // Full logging in development by default
};

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  logging: getLoggingConfig(),
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;
