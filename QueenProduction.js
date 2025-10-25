/**
 * نموذج إنتاج الملكات - Queen Production Model
 * يدير عمليات تربية وإنتاج الملكات مع تتبع الأنساب
 */

export class QueenProduction {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.apiaryId = data.apiaryId;
        this.sourceHiveId = data.sourceHiveId; // الخلية المصدر للملكة الأم
        this.nurseryHiveId = data.nurseryHiveId; // خلية الحضانة

        // معلومات الملكة الأم
        this.motherQueenId = data.motherQueenId;
        this.motherQueenAge = data.motherQueenAge || 12; // عمر الملكة الأم بالشهور
        this.motherQueenBreed = data.motherQueenBreed || 'carniolan'; // السلالة
        this.motherQueenOrigin = data.motherQueenOrigin || 'local'; // المنشأ
        this.motherQueenTraits = data.motherQueenTraits || {}; // الصفات الوراثية

        // معلومات دورة الإنتاج
        this.productionCycle = data.productionCycle || 1; // رقم الدورة
        this.startDate = data.startDate || new Date();
        this.graftingDate = data.graftingDate;
        this.emergenceDate = data.emergenceDate;
        this.matingDate = data.matingDate;
        this.layingStartDate = data.layingStartDate;

        // معلومات التطعيم والحضانة
        this.cellsGrafted = data.cellsGrafted || 0;
        this.cellsAccepted = data.cellsAccepted || 0;
        this.cellsEmerged = data.cellsEmerged || 0;
        this.queensMated = data.queensMated || 0;
        this.queensLaying = data.queensLaying || 0;
        this.larvalAge = data.larvalAge || 24; // عمر اليرقات بالساعات

        // معلومات الجودة والتقييم
        this.queenSize = data.queenSize || 'medium'; // small, medium, large
        this.queenWeight = data.queenWeight || 0; // وزن الملكة بالملليجرام
        this.wingCondition = data.wingCondition || 'perfect'; // perfect, damaged, clipped
        this.bodyCondition = data.bodyCondition || 'excellent'; // poor, good, excellent
        this.colorPattern = data.colorPattern || '';
        this.temperament = data.temperament || 'calm'; // aggressive, nervous, calm, gentle

        // معلومات الأداء
        this.layingRate = data.layingRate || 0; // عدد البيض يومياً
        this.broodPattern = data.broodPattern || 'compact'; // scattered, moderate, compact
        this.honeyProduction = data.honeyProduction || 0; // إنتاج العسل السنوي
        this.swarmingTendency = data.swarmingTendency || 'low'; // low, medium, high
        this.diseaseResistance = data.diseaseResistance || {}; // مقاومة الأمراض

        // معلومات التزاوج والوراثة
        this.matingMethod = data.matingMethod || 'natural'; // natural, instrumental, controlled
        this.droneSource = data.droneSource || 'local'; // مصدر الذكور
        this.geneticMarkers = data.geneticMarkers || {}; // المؤشرات الوراثية
        this.pedigree = data.pedigree || {}; // شجرة النسب
        this.inbreedingCoefficient = data.inbreedingCoefficient || 0; // معامل التزاوج الداخلي

        // معلومات التسويق والمبيعات
        this.priceCategory = data.priceCategory || 'standard'; // standard, premium, breeder
        this.unitPrice = data.unitPrice || 0;
        this.productionCost = data.productionCost || 0;
        this.soldQueens = data.soldQueens || 0;
        this.revenue = data.revenue || 0;

        // معلومات التتبع والجودة
        this.markingColor = data.markingColor || ''; // لون العلامة
        this.markingNumber = data.markingNumber || '';
        this.microchip = data.microchip || false; // شريحة إلكترونية
        this.certificates = data.certificates || []; // الشهادات
        this.healthStatus = data.healthStatus || 'healthy';

        // ملاحظات وتوثيق
        this.notes = data.notes || '';
        this.photos = data.photos || [];
        this.videos = data.videos || [];
        this.batchNumber = data.batchNumber || this.generateBatchNumber();

        // معلومات النظام
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    generateId() {
        return 'queen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateBatchNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `Q${year}${month}${day}-${random}`;
    }

    // حساب معدل النجاح في مراحل مختلفة
    calculateSuccessRates() {
        const acceptanceRate = this.cellsGrafted > 0 ? (this.cellsAccepted / this.cellsGrafted) * 100 : 0;
        const emergenceRate = this.cellsAccepted > 0 ? (this.cellsEmerged / this.cellsAccepted) * 100 : 0;
        const matingRate = this.cellsEmerged > 0 ? (this.queensMated / this.cellsEmerged) * 100 : 0;
        const layingRate = this.queensMated > 0 ? (this.queensLaying / this.queensMated) * 100 : 0;
        const overallRate = this.cellsGrafted > 0 ? (this.queensLaying / this.cellsGrafted) * 100 : 0;

        return {
            acceptance: Math.round(acceptanceRate * 10) / 10,
            emergence: Math.round(emergenceRate * 10) / 10,
            mating: Math.round(matingRate * 10) / 10,
            laying: Math.round(layingRate * 10) / 10,
            overall: Math.round(overallRate * 10) / 10
        };
    }

    // تقييم جودة الملكة
    getQualityGrade() {
        let score = 0;

        // تقييم الحجم والوزن
        if (this.queenSize === 'large' && this.queenWeight >= 200) score += 20;
        else if (this.queenSize === 'medium' && this.queenWeight >= 180) score += 15;
        else score += 10;

        // تقييم حالة الجسم والأجنحة
        if (this.bodyCondition === 'excellent' && this.wingCondition === 'perfect') score += 20;
        else if (this.bodyCondition === 'good') score += 15;
        else score += 10;

        // تقييم معدل وضع البيض
        if (this.layingRate >= 2000) score += 25;
        else if (this.layingRate >= 1500) score += 20;
        else if (this.layingRate >= 1000) score += 15;
        else score += 10;

        // تقييم نمط الحضنة
        if (this.broodPattern === 'compact') score += 15;
        else if (this.broodPattern === 'moderate') score += 10;
        else score += 5;

        // تقييم السلوك
        if (this.temperament === 'gentle') score += 10;
        else if (this.temperament === 'calm') score += 8;
        else score += 5;

        // تقييم مقاومة الأمراض
        const resistanceCount = Object.keys(this.diseaseResistance).length;
        if (resistanceCount >= 3) score += 10;
        else if (resistanceCount >= 2) score += 5;

        if (score >= 85) return 'ممتازة';
        else if (score >= 70) return 'جيدة جداً';
        else if (score >= 55) return 'جيدة';
        else if (score >= 40) return 'مقبولة';
        else return 'ضعيفة';
    }

    // حساب مؤشر الإنتاجية
    getProductivityIndex() {
        const successRates = this.calculateSuccessRates();
        const qualityScore = this.getQualityScore();
        const performanceScore = this.getPerformanceScore();

        return Math.round((successRates.overall * 0.4 + qualityScore * 0.3 + performanceScore * 0.3) * 10) / 10;
    }

    getQualityScore() {
        const grades = { 'ممتازة': 100, 'جيدة جداً': 80, 'جيدة': 60, 'مقبولة': 40, 'ضعيفة': 20 };
        return grades[this.getQualityGrade()] || 0;
    }

    getPerformanceScore() {
        let score = 0;

        // معدل وضع البيض (40%)
        score += Math.min(40, (this.layingRate / 2500) * 40);

        // إنتاج العسل (30%)
        score += Math.min(30, (this.honeyProduction / 50) * 30);

        // مقاومة التطريد (20%)
        const swarmScore = this.swarmingTendency === 'low' ? 20 :
            this.swarmingTendency === 'medium' ? 10 : 0;
        score += swarmScore;

        // مقاومة الأمراض (10%)
        const resistanceCount = Object.keys(this.diseaseResistance).length;
        score += Math.min(10, resistanceCount * 2);

        return Math.round(score * 10) / 10;
    }

    // حساب الربحية
    calculateProfitability() {
        const totalRevenue = this.soldQueens * this.unitPrice;
        const totalCost = this.productionCost;
        const profit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        const costPerQueen = this.queensLaying > 0 ? totalCost / this.queensLaying : 0;
        const profitPerQueen = this.soldQueens > 0 ? profit / this.soldQueens : 0;

        return {
            revenue: totalRevenue,
            cost: totalCost,
            profit,
            margin: Math.round(margin * 100) / 100,
            costPerQueen: Math.round(costPerQueen * 100) / 100,
            profitPerQueen: Math.round(profitPerQueen * 100) / 100
        };
    }

    // تحليل الصفات الوراثية
    analyzeGeneticTraits() {
        const traits = {
            productivity: this.calculateProductivityTrait(),
            gentleness: this.calculateGentlenessTrait(),
            diseaseResistance: this.calculateResistanceTrait(),
            swarmingTendency: this.calculateSwarmingTrait(),
            overallScore: 0
        };

        traits.overallScore = (traits.productivity + traits.gentleness +
            traits.diseaseResistance + traits.swarmingTendency) / 4;

        return traits;
    }

    calculateProductivityTrait() {
        return Math.min(100, (this.layingRate / 25) + (this.honeyProduction / 2));
    }

    calculateGentlenessTrait() {
        const scores = { gentle: 100, calm: 80, nervous: 40, aggressive: 20 };
        return scores[this.temperament] || 50;
    }

    calculateResistanceTrait() {
        const resistanceCount = Object.keys(this.diseaseResistance).length;
        return Math.min(100, resistanceCount * 20);
    }

    calculateSwarmingTrait() {
        const scores = { low: 100, medium: 60, high: 20 };
        return scores[this.swarmingTendency] || 50;
    }

    // التحقق من صحة البيانات
    validate() {
        const errors = [];

        if (!this.apiaryId) errors.push('معرف المنحل مطلوب');
        if (!this.sourceHiveId) errors.push('معرف الخلية المصدر مطلوب');
        if (this.cellsGrafted <= 0) errors.push('عدد الخلايا المطعمة يجب أن يكون أكبر من صفر');
        if (this.cellsAccepted > this.cellsGrafted) {
            errors.push('عدد الخلايا المقبولة لا يمكن أن يكون أكبر من المطعمة');
        }
        if (this.cellsEmerged > this.cellsAccepted) {
            errors.push('عدد الملكات الخارجة لا يمكن أن يكون أكبر من المقبولة');
        }
        if (this.queensMated > this.cellsEmerged) {
            errors.push('عدد الملكات المتزاوجة لا يمكن أن يكون أكبر من الخارجة');
        }
        if (this.queensLaying > this.queensMated) {
            errors.push('عدد الملكات الباضة لا يمكن أن يكون أكبر من المتزاوجة');
        }
        if (this.larvalAge < 12 || this.larvalAge > 36) {
            errors.push('عمر اليرقات يجب أن يكون بين 12-36 ساعة');
        }
        if (this.inbreedingCoefficient > 0.25) {
            errors.push('تحذير: معامل التزاوج الداخلي عالي جداً');
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
            sourceHiveId: this.sourceHiveId,
            nurseryHiveId: this.nurseryHiveId,
            motherQueenId: this.motherQueenId,
            motherQueenAge: this.motherQueenAge,
            motherQueenBreed: this.motherQueenBreed,
            motherQueenOrigin: this.motherQueenOrigin,
            motherQueenTraits: this.motherQueenTraits,
            productionCycle: this.productionCycle,
            startDate: this.startDate,
            graftingDate: this.graftingDate,
            emergenceDate: this.emergenceDate,
            matingDate: this.matingDate,
            layingStartDate: this.layingStartDate,
            cellsGrafted: this.cellsGrafted,
            cellsAccepted: this.cellsAccepted,
            cellsEmerged: this.cellsEmerged,
            queensMated: this.queensMated,
            queensLaying: this.queensLaying,
            larvalAge: this.larvalAge,
            queenSize: this.queenSize,
            queenWeight: this.queenWeight,
            wingCondition: this.wingCondition,
            bodyCondition: this.bodyCondition,
            colorPattern: this.colorPattern,
            temperament: this.temperament,
            layingRate: this.layingRate,
            broodPattern: this.broodPattern,
            honeyProduction: this.honeyProduction,
            swarmingTendency: this.swarmingTendency,
            diseaseResistance: this.diseaseResistance,
            matingMethod: this.matingMethod,
            droneSource: this.droneSource,
            geneticMarkers: this.geneticMarkers,
            pedigree: this.pedigree,
            inbreedingCoefficient: this.inbreedingCoefficient,
            priceCategory: this.priceCategory,
            unitPrice: this.unitPrice,
            productionCost: this.productionCost,
            soldQueens: this.soldQueens,
            revenue: this.revenue,
            markingColor: this.markingColor,
            markingNumber: this.markingNumber,
            microchip: this.microchip,
            certificates: this.certificates,
            healthStatus: this.healthStatus,
            notes: this.notes,
            photos: this.photos,
            videos: this.videos,
            batchNumber: this.batchNumber,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}// سلالات
النحل
export const BEE_BREEDS = {
    carniolan: 'كارنيولي',
    italian: 'إيطالي',
    caucasian: 'قوقازي',
    buckfast: 'باكفاست',
    local: 'محلي',
    hybrid: 'هجين'
};

// أحجام الملكات
export const QUEEN_SIZES = {
    small: 'صغيرة',
    medium: 'متوسطة',
    large: 'كبيرة'
};

// حالة الأجنحة
export const WING_CONDITIONS = {
    perfect: 'سليمة',
    damaged: 'تالفة',
    clipped: 'مقصوصة'
};

// حالة الجسم
export const BODY_CONDITIONS = {
    poor: 'ضعيفة',
    good: 'جيدة',
    excellent: 'ممتازة'
};

// السلوك
export const TEMPERAMENTS = {
    aggressive: 'عدوانية',
    nervous: 'عصبية',
    calm: 'هادئة',
    gentle: 'لطيفة'
};

// نمط الحضنة
export const BROOD_PATTERNS = {
    scattered: 'متناثر',
    moderate: 'متوسط',
    compact: 'مضغوط'
};

// ميل التطريد
export const SWARMING_TENDENCIES = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي'
};

// طرق التزاوج
export const MATING_METHODS = {
    natural: 'طبيعي',
    instrumental: 'تلقيح صناعي',
    controlled: 'تزاوج محكوم'
};

// فئات الأسعار
export const PRICE_CATEGORIES = {
    standard: 'عادية',
    premium: 'ممتازة',
    breeder: 'للتربية'
};

// ألوان العلامات
export const MARKING_COLORS = {
    white: 'أبيض',
    yellow: 'أصفر',
    red: 'أحمر',
    green: 'أخضر',
    blue: 'أزرق'
};