import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

const oracleConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
};

export const getOracleConnection = async () => {
  try {
    const connection = await oracledb.getConnection(oracleConfig);
    return connection;
  } catch (error) {
    console.error('❌ Error conectando a Oracle:', error.message);
    throw error;
  }
};