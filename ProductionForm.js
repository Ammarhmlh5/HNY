/**
 * نموذج إنتاج العسل - Production Form
 * نموذج شامل لإضافة وتعديل بيانات إنتاج العسل
 */

import React, { useState, useEffect } from 'react';
import { HONEY_TYPES, HARVEST_SEASONS, COLOR_GRADES } from '../../models/HoneyProduction.js';
import './ProductionForm.css';

export const ProductionForm = ({ production, onSave, onCancel, apiaryId }) => {
    const [formData, setFormData] = useState({
        // بيانات أساسية
        harvestDate: '',
        harvestType: 'spring',
        honeyType: 'mixed',

        // بيانات الحصاد
        framesHarvested: '',
        grossWeight: '',
        frameWeight: '0.5',

        // معلومات الجودة
        moistureContent: '',
        color: 'light',
        clarity: 'clear',
        taste: 'mild',
        aroma: 'floral',

        // معلومات المعالجة
        extractionMethod: 'centrifuge',
        filtrationLevel: 'coarse',
        heatingTemperature: '0',
        processingDate: '',

        // معلومات التخزين
        storageContainer: 'stainless-steel',
        storageLocation: '',
        packagingDate: '',

        // معلومات مالية
        productionCost: '',
        expectedPrice: '',

        // ملاحظات
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [calculatedValues, setCalculatedValues] = useState({
        netWeight: 0,
        yieldPerFrame: 0,
        qualityGrade: '',
        expiryDate: null
    });

    // تحميل بيانات الإنتاج للتعديل
    useEffect(() => {
        if (production) {
            setFormData({
                harvestDate: production.harvestDate ? new Date(production.harvestDate).toISOString().split('T')[0] : '',
                harvestType: production.harvestType || 'spring',
                honeyType: production.honeyType || 'mixed',
                framesHarvested: production.framesHarvested || '',
                grossWeight: production.grossWeight || '',
                frameWeight: production.frameWeight || '0.5',
                moistureContent: production.moistureContent || '',
                color: production.color || 'light',
                clarity: production.clarity || 'clear',
                taste: production.taste || 'mild',
                aroma: production.aroma || 'floral',
                extractionMethod: production.extractionMethod || 'centrifuge',
                filtrationLevel: production.filtrationLevel || 'coarse',
                heatingTemperature: production.heatingTemperature || '0',
                processingDate: production.processingDate ? new Date(production.processingDate).toISOString().split('T')[0] : '',
                storageContainer: production.storageContainer || 'stainless-steel',
                storageLocation: production.storageLocation || '',
                packagingDate: production.packagingDate ? new Date(production.packagingDate).toISOString().split('T')[0] : '',
                productionCost: production.productionCost || '',
                expectedPrice: production.expectedPrice || '',
                notes: production.notes || ''
            });
        } else {
            // تعيين التواريخ الافتراضية للإنتاج الجديد
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({
                ...prev,
                harvestDate: today,
                processingDate: today
            }));
        }
    }, [production]);

    // حساب القيم المشتقة عند تغيير البيانات
    useEffect(() => {
        calculateDerivedValues();
    }, [formData.grossWeight, formData.framesHarvested, formData.frameWeight, formData.moistureContent, formData.color, formData.clarity, formData.taste, formData.aroma, formData.heatingTemperature]);

    const calculateDerivedValues = () => {
        const grossWeight = parseFloat(formData.grossWeight) || 0;
        const framesHarvested = parseInt(formData.framesHarvested) || 0;
        const frameWeight = parseFloat(formData.frameWeight) || 0.5;

        // حساب الوزن الصافي
        const netWeight = Math.max(0, grossWeight - (framesHarvested * frameWeight));

        // حساب الإنتاجية لكل إطار
        const yieldPerFrame = framesHarvested > 0 ? netWeight / framesHarvested : 0;

        // حساب درجة الجودة
        const qualityGrade = calculateQualityGrade();

        // حساب تاريخ انتهاء الصلاحية
        const expiryDate = formData.processingDate ?
            new Date(new Date(formData.processingDate).setFullYear(new Date(formData.processingDate).getFullYear() + 2)) :
            null;

        setCalculatedValues({
            netWeight: Math.round(netWeight * 100) / 100,
            yieldPerFrame: Math.round(yieldPerFrame * 100) / 100,
            qualityGrade,
            expiryDate
        });
    };

    const calculateQualityGrade = () => {
        let score = 0;
        const moistureContent = parseFloat(formData.moistureContent) || 0;

        // تقييم الرطوبة
        if (moistureContent <= 18) score += 30;
        else if (moistureContent <= 20) score += 20;
        else if (moistureContent <= 22) score += 10;

        // تقييم الوضوح
        if (formData.clarity === 'clear') score += 25;
        else if (formData.clarity === 'slightly-cloudy') score += 15;
        else score += 5;

        // تقييم اللون
        if (formData.color === 'light') score += 20;
        else if (formData.color === 'medium') score += 15;
        else score += 10;

        // تقييم الطعم والرائحة
        if (formData.taste === 'mild' && formData.aroma === 'floral') score += 15;
        else if (formData.taste === 'medium') score += 10;
        else score += 5;

        // تقييم المعالجة
        const heatingTemp = parseFloat(formData.heatingTemperature) || 0;
        if (heatingTemp === 0) score += 10;
        else if (heatingTemp <= 40) score += 5;

        if (score >= 85) return 'ممتاز';
        else if (score >= 70) return 'جيد جداً';
        else if (score >= 55) return 'جيد';
        else if (score >= 40) return 'مقبول';
        else return 'ضعيف';
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // إزالة الخطأ عند التعديل
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        switch (step) {
            case 1: // بيانات الحصاد الأساسية
                if (!formData.harvestDate) newErrors.harvestDate = 'تاريخ الحصاد مطلوب';
                if (!formData.framesHarvested || formData.framesHarvested <= 0) {
                    newErrors.framesHarvested = 'عدد الإطارات يجب أن يكون أكبر من صفر';
                }
                if (!formData.grossWeight || formData.grossWeight <= 0) {
                    newErrors.grossWeight = 'الوزن الإجمالي يجب أن يكون أكبر من صفر';
                }
                break;

            case 2: // معلومات الجودة
                if (formData.moistureContent && (formData.moistureContent < 0 || formData.moistureContent > 100)) {
                    newErrors.moistureContent = 'نسبة الرطوبة يجب أن تكون بين 0 و 100';
                }
                if (formData.moistureContent > 22) {
                    newErrors.moistureContent = 'تحذير: نسبة الرطوبة عالية جداً - قد يفسد العسل';
                }
                break;

            case 3: // معلومات المعالجة والتخزين
                if (!formData.processingDate) newErrors.processingDate = 'تاريخ المعالجة مطلوب';
                if (formData.heatingTemperature && formData.heatingTemperature < 0) {
                    newErrors.heatingTemperature = 'درجة الحرارة لا يمكن أن تكون سالبة';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // التحقق من جميع الخطوات
        let isValid = true;
        for (let step = 1; step <= 3; step++) {
            if (!validateStep(step)) {
                isValid = false;
                setCurrentStep(step);
                break;
            }
        }

        if (isValid) {
            // تحويل البيانات إلى الصيغة المطلوبة
            const productionData = {
                ...formData,
                harvestDate: new Date(formData.harvestDate),
                processingDate: new Date(formData.processingDate),
                packagingDate: formData.packagingDate ? new Date(formData.packagingDate) : null,
                framesHarvested: parseInt(formData.framesHarvested),
                grossWeight: parseFloat(formData.grossWeight),
                frameWeight: parseFloat(formData.frameWeight),
                moistureContent: parseFloat(formData.moistureContent) || 0,
                heatingTemperature: parseFloat(formData.heatingTemperature) || 0,
                productionCost: parseFloat(formData.productionCost) || 0,
                expectedPrice: parseFloat(formData.expectedPrice) || 0,
                netWeight: calculatedValues.netWeight
            };

            onSave(productionData);
        }
    };

    return (
        <div className="production-form">
            <div className="form-header">
                <h3>
                    {production ? 'تعديل إنتاج العسل' : 'إضافة إنتاج عسل جديد'}
                </h3>
                <div className="step-indicator">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
                    <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
                    <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4</div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* الخطوة 1: بيانات الحصاد الأساسية */}
                {currentStep === 1 && (
                    <div className="form-step">
                        <h4>بيانات الحصاد الأساسية</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>تاريخ الحصاد *</label>
                                <input
                                    type="date"
                                    value={formData.harvestDate}
                                    onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                                    className={errors.harvestDate ? 'error' : ''}
                                />
                                {errors.harvestDate && <span className="error-text">{errors.harvestDate}</span>}
                            </div>

                            <div className="form-group">
                                <label>موسم الحصاد</label>
                                <select
                                    value={formData.harvestType}
                                    onChange={(e) => handleInputChange('harvestType', e.target.value)}
                                >
                                    {Object.entries(HARVEST_SEASONS).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>نوع العسل</label>
                                <select
                                    value={formData.honeyType}
                                    onChange={(e) => handleInputChange('honeyType', e.target.value)}
                                >
                                    {Object.entries(HONEY_TYPES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>عدد الإطارات المحصودة *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.framesHarvested}
                                    onChange={(e) => handleInputChange('framesHarvested', e.target.value)}
                                    className={errors.framesHarvested ? 'error' : ''}
                                />
                                {errors.framesHarvested && <span className="error-text">{errors.framesHarvested}</span>}
                            </div>

                            <div className="form-group">
                                <label>الوزن الإجمالي (كغ) *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.grossWeight}
                                    onChange={(e) => handleInputChange('grossWeight', e.target.value)}
                                    className={errors.grossWeight ? 'error' : ''}
                                />
                                {errors.grossWeight && <span className="error-text">{errors.grossWeight}</span>}
                            </div>

                            <div className="form-group">
                                <label>وزن الإطار الفارغ (كغ)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.frameWeight}
                                    onChange={(e) => handleInputChange('frameWeight', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* عرض القيم المحسوبة */}
                        <div className="calculated-values">
                            <div className="calc-item">
                                <label>الوزن الصافي:</label>
                                <span>{calculatedValues.netWeight} كغ</span>
                            </div>
                            <div className="calc-item">
                                <label>الإنتاجية لكل إطار:</label>
                                <span>{calculatedValues.yieldPerFrame} كغ</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* الخطوة 2: معلومات الجودة */}
                {currentStep === 2 && (
                    <div className="form-step">
                        <h4>معلومات الجودة</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>نسبة الرطوبة (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={formData.moistureContent}
                                    onChange={(e) => handleInputChange('moistureContent', e.target.value)}
                                    className={errors.moistureContent ? 'error' : ''}
                                />
                                {errors.moistureContent && <span className="error-text">{errors.moistureContent}</span>}
                                <small>المعدل المثالي: أقل من 18%</small>
                            </div>

                            <div className="form-group">
                                <label>درجة اللون</label>
                                <select
                                    value={formData.color}
                                    onChange={(e) => handleInputChange('color', e.target.value)}
                                >
                                    {Object.entries(COLOR_GRADES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>درجة الوضوح</label>
                                <select
                                    value={formData.clarity}
                                    onChange={(e) => handleInputChange('clarity', e.target.value)}
                                >
                                    <option value="clear">صافي</option>
                                    <option value="slightly-cloudy">عكر قليلاً</option>
                                    <option value="cloudy">عكر</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>قوة الطعم</label>
                                <select
                                    value={formData.taste}
                                    onChange={(e) => handleInputChange('taste', e.target.value)}
                                >
                                    <option value="mild">خفيف</option>
                                    <option value="medium">متوسط</option>
                                    <option value="strong">قوي</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>نوع الرائحة</label>
                                <select
                                    value={formData.aroma}
                                    onChange={(e) => handleInputChange('aroma', e.target.value)}
                                >
                                    <option value="floral">زهرية</option>
                                    <option value="fruity">فاكهية</option>
                                    <option value="woody">خشبية</option>
                                    <option value="herbal">عشبية</option>
                                    <option value="spicy">حارة</option>
                                </select>
                            </div>
                        </div>

                        {/* عرض تقييم الجودة */}
                        <div className="quality-assessment">
                            <div className="quality-grade">
                                <label>تقييم الجودة:</label>
                                <span className={`grade ${calculatedValues.qualityGrade}`}>
                                    {calculatedValues.qualityGrade}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* الخطوة 3: معلومات المعالجة والتخزين */}
                {currentStep === 3 && (
                    <div className="form-step">
                        <h4>المعالجة والتخزين</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>طريقة الاستخلاص</label>
                                <select
                                    value={formData.extractionMethod}
                                    onChange={(e) => handleInputChange('extractionMethod', e.target.value)}
                                >
                                    <option value="centrifuge">الطرد المركزي</option>
                                    <option value="crush-strain">الهرس والتصفية</option>
                                    <option value="gravity">الجاذبية</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>مستوى التصفية</label>
                                <select
                                    value={formData.filtrationLevel}
                                    onChange={(e) => handleInputChange('filtrationLevel', e.target.value)}
                                >
                                    <option value="coarse">خشن</option>
                                    <option value="fine">ناعم</option>
                                    <option value="ultra-fine">ناعم جداً</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>درجة حرارة المعالجة (°م)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.heatingTemperature}
                                    onChange={(e) => handleInputChange('heatingTemperature', e.target.value)}
                                    className={errors.heatingTemperature ? 'error' : ''}
                                />
                                {errors.heatingTemperature && <span className="error-text">{errors.heatingTemperature}</span>}
                                <small>0 = عسل خام (الأفضل)</small>
                            </div>

                            <div className="form-group">
                                <label>تاريخ المعالجة *</label>
                                <input
                                    type="date"
                                    value={formData.processingDate}
                                    onChange={(e) => handleInputChange('processingDate', e.target.value)}
                                    className={errors.processingDate ? 'error' : ''}
                                />
                                {errors.processingDate && <span className="error-text">{errors.processingDate}</span>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>نوع وعاء التخزين</label>
                                <select
                                    value={formData.storageContainer}
                                    onChange={(e) => handleInputChange('storageContainer', e.target.value)}
                                >
                                    <option value="stainless-steel">ستانلس ستيل</option>
                                    <option value="food-grade-plastic">بلاستيك غذائي</option>
                                    <option value="glass">زجاج</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>مكان التخزين</label>
                                <input
                                    type="text"
                                    value={formData.storageLocation}
                                    onChange={(e) => handleInputChange('storageLocation', e.target.value)}
                                    placeholder="مثل: مخزن رقم 1، الرف العلوي"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>تاريخ التعبئة</label>
                                <input
                                    type="date"
                                    value={formData.packagingDate}
                                    onChange={(e) => handleInputChange('packagingDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* عرض تاريخ انتهاء الصلاحية */}
                        {calculatedValues.expiryDate && (
                            <div className="expiry-info">
                                <label>تاريخ انتهاء الصلاحية المتوقع:</label>
                                <span>{calculatedValues.expiryDate.toLocaleDateString('ar-SA')}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* الخطوة 4: المعلومات المالية والملاحظات */}
                {currentStep === 4 && (
                    <div className="form-step">
                        <h4>المعلومات المالية والملاحظات</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>تكلفة الإنتاج (ر.س)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.productionCost}
                                    onChange={(e) => handleInputChange('productionCost', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>السعر المتوقع للكيلو (ر.س)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.expectedPrice}
                                    onChange={(e) => handleInputChange('expectedPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>ملاحظات</label>
                            <textarea
                                rows="4"
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="أي ملاحظات إضافية حول هذا الإنتاج..."
                            />
                        </div>

                        {/* عرض ملخص الإنتاج */}
                        <div className="production-summary">
                            <h5>ملخص الإنتاج</h5>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <label>الوزن الصافي:</label>
                                    <span>{calculatedValues.netWeight} كغ</span>
                                </div>
                                <div className="summary-item">
                                    <label>تقييم الجودة:</label>
                                    <span>{calculatedValues.qualityGrade}</span>
                                </div>
                                <div className="summary-item">
                                    <label>الإيراد المتوقع:</label>
                                    <span>{(calculatedValues.netWeight * (parseFloat(formData.expectedPrice) || 0)).toFixed(2)} ر.س</span>
                                </div>
                                <div className="summary-item">
                                    <label>الربح المتوقع:</label>
                                    <span>{((calculatedValues.netWeight * (parseFloat(formData.expectedPrice) || 0)) - (parseFloat(formData.productionCost) || 0)).toFixed(2)} ر.س</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* أزرار التنقل */}
                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-secondary">
                        إلغاء
                    </button>

                    {currentStep > 1 && (
                        <button type="button" onClick={handlePrevStep} className="btn-secondary">
                            السابق
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button type="button" onClick={handleNextStep} className="btn-primary">
                            التالي
                        </button>
                    ) : (
                        <button type="submit" className="btn-primary">
                            {production ? 'تحديث الإنتاج' : 'حفظ الإنتاج'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ProductionForm;