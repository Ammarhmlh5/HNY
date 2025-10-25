/**
 * نموذج إنتاج حبوب اللقاح - Pollen Production Model
 * يدير عمليات جمع وإنتاج حبوب اللقاح
 */

export class PollenProduction {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.apiaryId = data.apiaryId;
    this.hiveId = data.hiveId;

    // معلومات الجمع
    this.collectionDate = data.collectionDate || new Date();
    this.collectionPeriod = data.collectionPeriod || 'morning'; // morning, afternoon, evening, full-day
    this.collectionDuration = data.collectionDuration || 8; // ساعات الجمع
    this.trapType = data.trapType || 'entrance'; // entrance, bottom-board, super
    this.trapEfficiency = data.trapEfficiency || 85; // كفاءة المصيدة %

    // معلومات الكمية والجودة
    this.grossWeight = data.grossWeight || 0; // الوزن الإجمالي بالجرام
    this.debrisWeight = data.debrisWeight || 0; // وزن الشوائب
    this.netWeight = data.netWeight || 0; // الوزن الصافي
    this.moistureContent = data.moistureContent || 8; // نسبة الرطوبة %
    this.proteinContent = data.proteinContent || 20; // نسبة البروتين %

    // تحليل الألوان والمصادر
    this.colorAnalysis = data.colorAnalysis || {}; // تحليل الألوان بالنسب المئوية
    this.dominantColors = data.dominantColors || []; // الألوان السائدة
    this.plantSources = data.plantSources || []; // مصادر النباتات المحددة
    this.floralDiversity = data.floralDiversity || 0; // تنوع المصادر النباتية

    // معلومات المعالجة والتخزين
    this.processingMethod = data.processingMethod || 'air-dried'; // air-dried, freeze-dried, frozen
    this.finalMoisture = data.finalMoisture || 4; // الرطوبة النهائية %
    this.storageContainer = data.storageContainer || 'airtight'; // airtight, vacuum, freezer
    this.storageTemperature = data.storageTemperature || -18; // درجة حرارة التخزين
    this.storageLocation = data.storageLocation || '';

    // معلومات الجودة والتصنيف
    this.gradeClassification = data.gradeClassification || 'A'; // A, B, C
    this.contaminationLevel = data.contaminationLevel || 'low'; // low, medium, high
    this.pesticideResidues = data.pesticideResidues || 'none'; // none, low, detected

    // معلومات مالية
    this.productionCost = data.productionCost || 0;
    this.expectedPrice = data.expectedPrice || 0; // السعر المتوقع للكيلو
    this.actualRevenue = data.actualRevenue || 0;

    // معلومات بيئية وموسمية
    this.season = data.season || 'spring'; // spring, summer, autumn, winter
    this.weatherConditions = data.weatherConditions || {};

    // ملاحظات وتتبع
    this.notes = data.notes || '';
    this.batchNumber = data.batchNumber || this.generateBatchNumber();
    this.expiryDate = data.expiryDate;

    // معلومات النظام
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return 'pollen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateBatchNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `POL${year}${month}${day}-${random}`;
  }
  // حساب الوزن الصافي
  calculateNetWeight() {
    this.netWeight = Math.max(0, this.grossWeight - this.debrisWeight);
    return this.netWeight;
  }

  // حساب معدل الجمع (جرام/ساعة)
  getCollectionRate() {
    if (this.collectionDuration === 0) return 0;
    return this.netWeight / this.collectionDuration;
  }

  // تحليل تنوع المصادر النباتية
  calculateFloralDiversity() {
    const colorCount = Object.keys(this.colorAnalysis).length;
    const sourceCount = this.plantSources.length;

    // حساب مؤشر التنوع بناءً على عدد الألوان والمصادر
    this.floralDiversity = Math.min(100, (colorCount * 10) + (sourceCount * 5));
    return this.floralDiversity;
  }

  // تحديد الألوان السائدة
  getDominantColors() {
    const colors = Object.entries(this.colorAnalysis)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([color, percentage]) => ({ color, percentage }));

    this.dominantColors = colors;
    return colors;
  }

  // تقييم جودة حبوب اللقاح
  getQualityGrade() {
    let score = 0;

    // تقييم الرطوبة (أهم معيار)
    if (this.finalMoisture <= 4) score += 30;
    else if (this.finalMoisture <= 6) score += 25;
    else if (this.finalMoisture <= 8) score += 15;
    else score += 5;

    // تقييم البروتين
    if (this.proteinContent >= 20) score += 25;
    else if (this.proteinContent >= 15) score += 20;
    else if (this.proteinContent >= 10) score += 10;
    else score += 5;

    // تقييم التلوث
    if (this.contaminationLevel === 'low') score += 20;
    else if (this.contaminationLevel === 'medium') score += 10;
    else score += 0;

    // تقييم التنوع النباتي
    if (this.floralDiversity >= 80) score += 15;
    else if (this.floralDiversity >= 60) score += 10;
    else if (this.floralDiversity >= 40) score += 5;

    // تقييم بقايا المبيدات
    if (this.pesticideResidues === 'none') score += 10;
    else if (this.pesticideResidues === 'low') score += 5;

    if (score >= 85) return 'ممتاز';
    else if (score >= 70) return 'جيد جداً';
    else if (score >= 55) return 'جيد';
    else if (score >= 40) return 'مقبول';
    else return 'ضعيف';
  }

  // حساب الربحية
  calculateProfitability() {
    const revenue = this.actualRevenue || (this.netWeight * this.expectedPrice / 1000); // تحويل إلى كيلو
    const profit = revenue - this.productionCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const costPerKg = this.netWeight > 0 ? (this.productionCost / (this.netWeight / 1000)) : 0;

    return {
      revenue,
      profit,
      margin: Math.round(margin * 100) / 100,
      costPerKg: Math.round(costPerKg * 100) / 100,
      profitPerKg: this.netWeight > 0 ? (profit / (this.netWeight / 1000)) : 0
    };
  }

  // التحقق من صحة البيانات
  validate() {
    const errors = [];

    if (!this.apiaryId) errors.push('معرف المنحل مطلوب');
    if (!this.hiveId) errors.push('معرف الخلية مطلوب');
    if (this.grossWeight <= 0) errors.push('الوزن الإجمالي يجب أن يكون أكبر من صفر');
    if (this.debrisWeight < 0) errors.push('وزن الشوائب لا يمكن أن يكون سالباً');
    if (this.debrisWeight > this.grossWeight) {
      errors.push('وزن الشوائب لا يمكن أن يكون أكبر من الوزن الإجمالي');
    }
    if (this.finalMoisture > 10) {
      errors.push('تحذير: الرطوبة النهائية عالية جداً - قد تؤثر على جودة التخزين');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // تحويل إلى JSON للحفظ
  toJSON() {
    return {
      id: this.id,
      apiaryId: this.apiaryId,
      hiveId: this.hiveId,
      collectionDate: this.collectionDate,
      collectionPeriod: this.collectionPeriod,
      collectionDuration: this.collectionDuration,
      trapType: this.trapType,
      trapEfficiency: this.trapEfficiency,
      grossWeight: this.grossWeight,
      debrisWeight: this.debrisWeight,
      netWeight: this.netWeight,
      moistureContent: this.moistureContent,
      proteinContent: this.proteinContent,
      colorAnalysis: this.colorAnalysis,
      dominantColors: this.dominantColors,
      plantSources: this.plantSources,
      floralDiversity: this.floralDiversity,
      processingMethod: this.processingMethod,
      finalMoisture: this.finalMoisture,
      storageContainer: this.storageContainer,
      storageTemperature: this.storageTemperature,
      storageLocation: this.storageLocation,
      gradeClassification: this.gradeClassification,
      contaminationLevel: this.contaminationLevel,
      pesticideResidues: this.pesticideResidues,
      productionCost: this.productionCost,
      expectedPrice: this.expectedPrice,
      actualRevenue: this.actualRevenue,
      season: this.season,
      weatherConditions: this.weatherConditions,
      notes: this.notes,
      batchNumber: this.batchNumber,
      expiryDate: this.expiryDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// أنواع مصائد حبوب اللقاح
export const TRAP_TYPES = {
  entrance: 'مصيدة المدخل',
  'bottom-board': 'مصيدة القاع',
  super: 'مصيدة العاسلة'
};

// فترات الجمع
export const COLLECTION_PERIODS = {
  morning: 'صباحي',
  afternoon: 'بعد الظهر',
  evening: 'مسائي',
  'full-day': 'يوم كامل'
};

// طرق المعالجة
export const PROCESSING_METHODS = {
  'air-dried': 'تجفيف هوائي',
  'freeze-dried': 'تجفيف بالتجميد',
  frozen: 'تجميد'
};

// مستويات التلوث
export const CONTAMINATION_LEVELS = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي'
};

// ألوان حبوب اللقاح الشائعة
export const POLLEN_COLORS = {
  yellow: 'أصفر',
  orange: 'برتقالي',
  red: 'أحمر',
  brown: 'بني',
  white: 'أبيض',
  green: 'أخضر',
  purple: 'بنفسجي',
  black: 'أسود',
  gray: 'رمادي'
};