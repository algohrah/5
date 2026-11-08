import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// إعداد مجمع اتصالات MySQL (Connection Pool) لبيئة Hostinger
let pool: mysql.Pool | null = null;
let isDbConnected = false;
let dbError: string | null = null;

export function getDbPool(): mysql.Pool | null {
  if (pool) return pool;

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'u125449775_tawafok_';
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'u125449775_tawafok_';
  const port = Number(process.env.DB_PORT) || 3306;

  // التحقق من وجود كلمة المرور وقاعدة البيانات
  if (!password) {
    dbError = 'يرجى تحديد كلمة مرور قاعدة البيانات (DB_PASSWORD) في ملف .env';
    return null;
  }

  try {
    pool = mysql.createPool({
      host,
      user,
      password: password || '',
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4_unicode_ci',
    });

    return pool;
  } catch (err: any) {
    dbError = err.message || 'فشل إنشاء مجمع اتصالات قاعدة البيانات';
    console.error('[Database] Pool creation error:', err);
    return null;
  }
}

// فحص الاتصال بقاعدة بيانات Hostinger
export async function testDbConnection(): Promise<{ connected: boolean; message: string; details?: any }> {
  const currentPool = getDbPool();
  if (!currentPool) {
    return {
      connected: false,
      message: dbError || 'لم يتم تكوين إعدادات قاعدة البيانات بعد',
    };
  }

  try {
    const connection = await currentPool.getConnection();
    const [rows]: any = await connection.query('SELECT 1 + 1 AS test');
    
    // إحصاء عدد الجداول في قاعدة بيانات هوستنجر
    const [tables]: any = await connection.query('SHOW TABLES');
    connection.release();

    isDbConnected = true;
    dbError = null;

    return {
      connected: true,
      message: 'تم الاتصال بقاعدة بيانات MySQL في Hostinger بنجاح',
      details: {
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        tablesCount: Array.isArray(tables) ? tables.length : 0,
      },
    };
  } catch (error: any) {
    isDbConnected = false;
    dbError = error.message || 'خطأ أثناء الاتصال بـ MySQL';
    console.error('[Database] Connection test failed:', error);
    return {
      connected: false,
      message: `فشل الاتصال بقاعدة البيانات: ${error.message}`,
    };
  }
}
