/**
 * نموذج إنتاج الغذاء الملكي - Royal Jelly Production Model
 * يدير عمليات إنتاج الغذاء الملكي من التطعيم إلى الحصاد
 */

export class RoyalJellyProduction {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.apiaryId = data.apiaryId;
        this.hiveId = data.hiveId;
        this.cycleNumber = data.cycleNumber || 1; // رقم الدورة في الموسم

        // معلومات التطعيم
        this.graftingDate = data.graftingDate || new Date();
        this.larvalAge = data.larvalAge || 24; // عمر اليرقات بالساعات (12-36 ساعة)
        this.cellsGrafted = data.cellsGrafted || 0; // عدد الكؤوس المطعمة
        this.graftingMethod = data.graftingMethod || 'manual'; // manual, semi-automatic, automatic
        this.graftingTool = data.graftingTool || 'needle'; // needle, spoon, grafting-tool

        // معلومات الحضانة
        this.incubationStartDate = data.incubationStartDate || new Date();
        this.incubationTemperature = data.incubationTemperature || 35; // درجة الحرارة المثلى 34-36°م
        this.incubationHumidity = data.incubationHumidity || 90; // الرطوبة المثلى 85-95%
        this.incubationPeriod = data.incubationPeriod || 72; // فترة الحضانة بالساعات (72 ساعة)

        // معلومات الحصاد
        this.harvestDate = data.harvestDate;
        this.cellsHarvested = data.cellsHarvested || 0; // عدد الكؤوس المحصودة
        this.successRate = data.successRate || 0; // معدل النجاح %
        this.totalWeight = data.totalWeight || 0; // الوزن الإجمالي بالجرام
        this.averageWeightPerCell = data.averageWeightPerCell || 0; // متوسط الوزن لكل كأس

        // معلومات الجودة
        this.color = data.color || 'white'; // white, cream, light-yellow
        this.consistency = data.consistency || 'gel'; // gel, liquid, thick
        this.purity = data.purity || 100; // نسبة النقاء %
        this.moistureContent = data.moistureContent || 67; // نسبة الرطوبة % (65-70%)
        this.pH = data.pH || 3.8; // الحموضة (3.4-4.5)
        this.proteinContent = data.proteinContent || 12; // نسبة البروتين %
        this.sugarContent = data.sugarContent || 15; // نسبة السكريات %
        this.lipidContent = data.lipidContent || 5; // نسبة الدهون %

        // معلومات التخزين والمعالجة
        this.processingMethod = data.processingMethod || 'fresh'; // fresh, freeze-dried, frozen
        this.storageTemperature = data.storageTemperature || -18; // درجة حرارة التخزين
        this.storageContainer = data.storageContainer || 'glass'; // glass, plastic, aluminum
        this.storageLocation = data.storageLocation || '';
        this.expiryDate = data.expiryDate;

        // معلومات مالية
        this.productionCost = data.productionCost || 0;
        this.expectedPrice = data.expectedPrice || 0; // السعر المتوقع للجرام
        this.actualRevenue = data.actualRevenue || 0;
        this.laborHours = data.laborHours || 0; // ساعات العمل المطلوبة

        // معلومات بيئية
        this.weatherConditions = data.weatherConditions || {};
        this.seasonalFactors = data.seasonalFactors || {};
        this.hiveStrength = data.hiveStrength || 'strong'; // weak, medium, strong
        this.queenAge = data.queenAge || 12; // عمر الملكة بالشهور

        // ملاحظات وتتبع
        this.notes = data.notes || '';
        this.photos = data.photos || [];
        this.qualityTestResults = data.qualityTestResults || {};
        this.batchNumber = data.batchNumber || this.generateBatchNumber();

        // معلومات النظام
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    generateId() {
        return 'rj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateBatchNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `RJ${year}${month}${day}-${random}`;
    }

    // حساب معدل النجاح
    calculateSuccessRate() {
        if (this.cellsGrafted === 0) return 0;
        this.successRate = (this.cellsHarvested / this.cellsGrafted) * 100;
        return this.successRate;
    }

    // حساب متوسط الوزن لكل كأس
    calculateAverageWeightPerCell() {
        if (this.cellsHarvested === 0) return 0;
        this.averageWeightPerCell = this.totalWeight / this.cellsHarvested;
        return this.averageWeightPerCell;
    }

    // تقييم جودة الغذاء الملكي
    getQualityGrade() {
        let score = 0;

        // تقييم اللون (الأبيض هو الأفضل)
        if (this.color === 'white') score += 25;
        else if (this.color === 'cream') score += 20;
        else score += 10;

        // تقييم القوام
        if (this.consistency === 'gel') score += 20;
        else if (this.consistency === 'thick') score += 15;
        else score += 10;

        // تقييم النقاء
        if (this.purity >= 98) score += 20;
        else if (this.purity >= 95) score += 15;
        else if (this.purity >= 90) score += 10;
        else score += 5;

        // تقييم الرطوبة (المعدل المثالي 67%)
        const moistureDiff = Math.abs(this.moistureContent - 67);
        if (moistureDiff <= 1) score += 15;
        else if (moistureDiff <= 2) score += 10;
        else if (moistureDiff <= 3) score += 5;

        // تقييم الحموضة (المعدل المثالي 3.8)
        const pHDiff = Math.abs(this.pH - 3.8);
        if (pHDiff <= 0.2) score += 10;
        else if (pHDiff <= 0.4) score += 5;

        // تقييم البروتين
        if (this.proteinContent >= 12) score += 10;
        else if (this.proteinContent >= 10) score += 5;

        if (score >= 85) return 'ممتاز';
        else if (score >= 70) return 'جيد جداً';
        else if (score >= 55) return 'جيد';
        else if (score >= 40) return 'مقبول';
        else return 'ضعيف';
    }

    // حساب الإنتاجية (جرام لكل ساعة عمل)
    getProductivityRate() {
        if (this.laborHours === 0) return 0;
        return this.totalWeight / this.laborHours;
    }

    // حساب الربحية
    calculateProfitability() {
        const revenue = this.actualRevenue || (this.totalWeight * this.expectedPrice);
        const profit = revenue - this.productionCost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        const costPerGram = this.totalWeight > 0 ? this.productionCost / this.totalWeight : 0;

        return {
            revenue,
            profit,
            margin: Math.round(margin * 100) / 100,
            costPerGram: Math.round(costPerGram * 100) / 100,
            profitPerGram: this.totalWeight > 0 ? profit / this.totalWeight : 0
        };
    }

    // تحديد تاريخ انتهاء الصلاحية بناءً على طريقة التخزين
    calculateExpiryDate() {
        const harvestDate = new Date(this.harvestDate || this.createdAt);
        let monthsToAdd = 0;

        switch (this.processingMethod) {
            case 'fresh':
                monthsToAdd = this.storageTemperature <= 4 ? 6 : 1; // 6 أشهر مبرد، شهر في درجة الغرفة
                break;
            case 'frozen':
                monthsToAdd = 24; // سنتان مجمد
                break;
            case 'freeze-dried':
                monthsToAdd = 36; // 3 سنوات مجفف بالتجميد
                break;
            default:
                monthsToAdd = 6;
        }

        const expiryDate = new Date(harvestDate);
        expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
        this.expiryDate = expiryDate;
        return expiryDate;
    }

    // تحديد الوقت المثالي للحصاد
    getOptimalHarvestTime() {
        const graftingDate = new Date(this.graftingDate);
        const optimalTime = new Date(graftingDate);
        optimalTime.setHours(optimalTime.getHours() + 72); // 72 ساعة بعد التطعيم
        return optimalTime;
    }

    // تقييم الظروف البيئية
    evaluateEnvironmentalConditions() {
        const conditions = {
            temperature: 'optimal',
            humidity: 'optimal',
            overall: 'good'
        };

        // تقييم درجة الحرارة
        if (this.incubationTemperature < 34 || this.incubationTemperature > 36) {
            conditions.temperature = this.incubationTemperature < 34 ? 'low' : 'high';
        }

        // تقييم الرطوبة
        if (this.incubationHumidity < 85 || this.incubationHumidity > 95) {
            conditions.humidity = this.incubationHumidity < 85 ? 'low' : 'high';
        }

        // التقييم العام
        if (conditions.temperature !== 'optimal' || conditions.humidity !== 'optimal') {
            conditions.overall = 'suboptimal';
        }

        return conditions;
    }

    // التحقق من صحة البيانات
    validate() {
        const errors = [];

        if (!this.apiaryId) errors.push('معرف المنحل مطلوب');
        if (!this.hiveId) errors.push('معرف الخلية مطلوب');
        if (this.cellsGrafted <= 0) errors.push('عدد الكؤوس المطعمة يجب أن يكون أكبر من صفر');
        if (this.larvalAge < 12 || this.larvalAge > 36) {
            errors.push('عمر اليرقات يجب أن يكون بين 12-36 ساعة');
        }
        if (this.incubationTemperature < 30 || this.incubationTemperature > 40) {
            errors.push('درجة حرارة الحضانة يجب أن تكون بين 30-40°م');
        }
        if (this.incubationHumidity < 70 || this.incubationHumidity > 100) {
            errors.push('رطوبة الحضانة يجب أن تكون بين 70-100%');
        }
        if (this.cellsHarvested > this.cellsGrafted) {
            errors.push('عدد الكؤوس المحصودة لا يمكن أن يكون أكبر من المطعمة');
        }
        if (this.pH < 3.0 || this.pH > 5.0) {
            errors.push('الحموضة يجب أن تكون بين 3.0-5.0');
        }
        if (this.moistureContent < 60 || this.moistureContent > 75) {
            errors.push('نسبة الرطوبة يجب أن تكون بين 60-75%');
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
            cycleNumber: this.cycleNumber,
            graftingDate: this.graftingDate,
            larvalAge: this.larvalAge,
            cellsGrafted: this.cellsGrafted,
            graftingMethod: this.graftingMethod,
            graftingTool: this.graftingTool,
            incubationStartDate: this.incubationStartDate,
            incubationTemperature: this.incubationTemperature,
            incubationHumidity: this.incubationHumidity,
            incubationPeriod: this.incubationPeriod,
            harvestDate: this.harvestDate,
            cellsHarvested: this.cellsHarvested,
            successRate: this.successRate,
            totalWeight: this.totalWeight,
            averageWeightPerCell: this.averageWeightPerCell,
            color: this.color,
            consistency: this.consistency,
            purity: this.purity,
            moistureContent: this.moistureContent,
            pH: this.pH,
            proteinContent: this.proteinContent,
            sugarContent: this.sugarContent,
            lipidContent: this.lipidContent,
            processingMethod: this.processingMethod,
            storageTemperature: this.storageTemperature,
            storageContainer: this.storageContainer,
            storageLocation: this.storageLocation,
            expiryDate: this.expiryDate,
            productionCost: this.productionCost,
            expectedPrice: this.expectedPrice,
            actualRevenue: this.actualRevenue,
            laborHours: this.laborHours,
            weatherConditions: this.weatherConditions,
            seasonalFactors: this.seasonalFactors,
            hiveStrength: this.hiveStrength,
            queenAge: this.queenAge,
            notes: this.notes,
            photos: this.photos,
            qualityTestResults: this.qualityTestResults,
            batchNumber: this.batchNumber,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

// طرق التطعيم
export const GRAFTING_METHODS = {
    manual: 'يدوي',
    'semi-automatic': 'شبه آلي',
    automatic: 'آلي'
};

// أدوات التطعيم
export const GRAFTING_TOOLS = {
    needle: 'إبرة',
    spoon: 'ملعقة',
    'grafting-tool': 'أداة تطعيم متخصصة'
};

// ألوان الغذاء الملكي
export const ROYAL_JELLY_COLORS = {
    white: 'أبيض',
    cream: 'كريمي',
    'light-yellow': 'أصفر فاتح'
};

// قوام الغذاء الملكي
export const CONSISTENCY_TYPES = {
    gel: 'هلامي',
    liquid: 'سائل',
    thick: 'كثيف'
};

// طرق المعالجة
export const PROCESSING_METHODS = {
    fresh: 'طازج',
    frozen: 'مجمد',
    'freeze-dried': 'مجفف بالتجميد'
};

// قوة الخلية
export const HIVE_STRENGTH = {
    weak: 'ضعيفة',
    medium: 'متوسطة',
    strong: 'قوية'
};