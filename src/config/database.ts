// إعداد قاعدة البيانات — المنصة تعمل بقاعدة بيانات محلية SQLite فقط
export type DatabaseProvider = 'local';

export const DATABASE_CONFIG = {
  PROVIDER: 'local' as DatabaseProvider,
};