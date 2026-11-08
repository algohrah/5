import { IDatabaseAdapter } from './interfaces';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import type { DatabaseProvider } from '../../config/database';

// ============================================================================
//  DataService — نقطة الوصول الموحدة لجميع عمليات قاعدة البيانات
//  كل العمليات تمر عبر قاعدة البيانات المحلية SQLite داخل المتصفح.
// ============================================================================

export class DataService {
  private static instance: DataService;

  /** المحوّل النشط حاليًا لتنفيذ جميع العمليات */
  public db: IDatabaseAdapter;

  /** نوع مزود البيانات النشط */
  public provider: DatabaseProvider;

  private constructor() {
    this.provider = 'local';
    this.db = new LocalStorageAdapter();
    if (typeof window !== 'undefined') {
      console.info('[DataService] Connected to Local SQLite Database.');
    }
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /** تبديل مزود قاعدة البيانات ديناميكيًا (الوضع المحلي هو الوحيد المدعوم) */
  public setProvider(_newProvider: DatabaseProvider): void {
    this.provider = 'local';
    this.db = new LocalStorageAdapter();
  }
}

export const dataService = DataService.getInstance();