/**
 * نموذج إنتاج الغذاء الملكي - Royal Jelly Production Form
 * نموذج شامل لإضافة وتعديل دورات إنتاج الغذاء الملكي
 */

import React, { useState, useEffect } from 'react';
import {
    GRAFTING_METHODS,
    GRAFTING_TOOLS,
    ROYAL_JELLY_COLORS,
    CONSISTENCY_TYPES,
    PROCESSING_METHODS,
    HIVE_STRENGTH
} from '../../models/RoyalJellyProduction.js';
import './RoyalJellyForm.css';

export const RoyalJellyForm = ({ production, onSave, onCancel, apiaryId }) => {
    const [formData, setFormData] = useState({
        // معلومات التطعيم
        graftingDate: '',
        larvalAge: '24',
        cellsGrafted: '',
        graftingMethod: 'manual',
        graftingTool: 'needle',

        // معلومات الحضانة
        incubationStartDate: '',
        incubationTemperature: '35',
        incubationHumidity: '90',
        incubationPeriod: '72',

        // معلومات الحصاد
        harvestDate: '',
        cellsHarvested: '',
        totalWeight: '',

        // معلومات الجودة
        color: 'white',
        consistency: 'gel',
        purity: '100',
        moistureContent: '67',
        pH: '3.8',
        proteinContent: '12',
        sugarContent: '15',
        lipidContent: '5',

        // معلومات التخزين
        processingMethod: 'fresh',
        storageTemperature: '-18',
        storageContainer: 'glass',
        storageLocation: '',

        // معلومات مالية
        productionCost: '',
        expectedPrice: '',
        laborHours: '',

        // معلومات بيئية
        hiveStrength: 'strong',
        queenAge: '12',

        // ملاحظات
        notes: ''
    });

    const [errors, setErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [calculatedValues, setCalculatedValues] = useState({
        successRate: 0,
        averageWeightPerCell: 0,
        qualityGrade: '',
        optimalHarvestTime: null,
        expiryDate: null
    });

    // تحميل بيانات الإنتاج للتعديل
    useEffect(() => {
        if (production) {
            setFormData({
                graftingDate: production.graftingDate ? new Date(production.graftingDate).toISOString().split('T')[0] : '',
                larvalAge: production.larvalAge || '24',
                cellsGrafted: production.cellsGrafted || '',
                graftingMethod: production.graftingMethod || 'manual',
                graftingTool: production.graftingTool || 'needle',
                incubationStartDate: production.incubationStartDate ? new Date(production.incubationStartDate).toISOString().split('T')[0] : '',
                incubationTemperature: production.incubationTemperature || '35',
                incubationHumidity: production.incubationHumidity || '90',
                incubationPeriod: production.incubationPeriod || '72',
                harvestDate: production.harvestDate ? new Date(production.harvestDate).toISOString().split('T')[0] : '',
                cellsHarvested: production.cellsHarvested || '',
                totalWeight: production.totalWeight || '',
                color: production.color || 'white',
                consistency: production.consistency || 'gel',
                purity: production.purity || '100',
                moistureContent: production.moistureContent || '67',
                pH: production.pH || '3.8',
                proteinContent: production.proteinContent || '12',
                sugarContent: production.sugarContent || '15',
                lipidContent: production.lipidContent || '5',
                processingMethod: production.processingMethod || 'fresh',
                storageTemperature: production.storageTemperature || '-18',
                storageContainer: production.storageContainer || 'glass',
                storageLocation: production.storageLocation || '',
                productionCost: production.productionCost || '',
                expectedPrice: production.expectedPrice || '',
                laborHours: production.laborHours || '',
                hiveStrength: production.hiveStrength || 'strong',
                queenAge: production.queenAge || '12',
                notes: production.notes || ''
            });
        } else {
            // تعيين التواريخ الافتراضية للدورة الجديدة
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({
                ...prev,
                graftingDate: today,
                incubationStartDate: today
            }));
        }
    }, [production]);

    // حساب القيم المشتقة عند تغيير البيانات
    useEffect(() => {
        calculateDerivedValues();
    }, [formData.cellsGrafted, formData.cellsHarvested, formData.totalWeight, formData.graftingDate, formData.harvestDate, formData.color, formData.consistency, formData.purity, formData.moistureContent, formData.pH, formData.proteinContent]);

    const calculateDerivedValues = () => {
        const cellsGrafted = parseInt(formData.cellsGrafted) || 0;
        const cellsHarvested = parseInt(formData.cellsHarvested) || 0;
        const totalWeight = parseFloat(formData.totalWeight) || 0;

        // حساب معدل النجاح
        const successRate = cellsGrafted > 0 ? (cellsHarvested / cellsGrafted) * 100 : 0;

        // حساب متوسط الوزن لكل كأس
        const averageWeightPerCell = cellsHarvested > 0 ? totalWeight / cellsHarvested : 0;

        // حساب درجة الجودة
        const qualityGrade = calculateQualityGrade();

        // حساب الوقت المثالي للحصاد
        const optimalHarvestTime = formData.graftingDate ?
            new Date(new Date(formData.graftingDate).getTime() + (72 * 60 * 60 * 1000)) :
            null;

        // حساب تاريخ انتهاء الصلاحية
        const expiryDate = calculateExpiryDate();

        setCalculatedValues({
            successRate: Math.round(successRate * 10) / 10,
            averageWeightPerCell: Math.round(averageWeightPerCell * 1000) / 1000,
            qualityGrade,
            optimalHarvestTime,
            expiryDate
        });
    };

    const calculateQualityGrade = () => {
        let score = 0;

        // تقييم اللون
        if (formData.color === 'white') score += 25;
        else if (formData.color === 'cream') score += 20;
        else score += 10;

        // تقييم القوام
        if (formData.consistency === 'gel') score += 20;
        else if (formData.consistency === 'thick') score += 15;
        else score += 10;

        // تقييم النقاء
        const purity = parseFloat(formData.purity) || 0;
        if (purity >= 98) score += 20;
        else if (purity >= 95) score += 15;
        else if (purity >= 90) score += 10;
        else score += 5;

        // تقييم الرطوبة
        const moistureContent = parseFloat(formData.moistureContent) || 0;
        const moistureDiff = Math.abs(moistureContent - 67);
        if (moistureDiff <= 1) score += 15;
        else if (moistureDiff <= 2) score += 10;
        else if (moistureDiff <= 3) score += 5;

        // تقييم الحموضة
        const pH = parseFloat(formData.pH) || 0;
        const pHDiff = Math.abs(pH - 3.8);
        if (pHDiff <= 0.2) score += 10;
        else if (pHDiff <= 0.4) score += 5;

        // تقييم البروتين
        const proteinContent = parseFloat(formData.proteinContent) || 0;
        if (proteinContent >= 12) score += 10;
        else if (proteinContent >= 10) score += 5;

        if (score >= 85) return 'ممتاز';
        else if (score >= 70) return 'جيد جداً';
        else if (score >= 55) return 'جيد';
        else if (score >= 40) return 'مقبول';
        else return 'ضعيف';
    };

    const calculateExpiryDate = () => {
        if (!formData.harvestDate) return null;

        const harvestDate = new Date(formData.harvestDate);
        let monthsToAdd = 0;

        switch (formData.processingMethod) {
            case 'fresh':
                monthsToAdd = parseFloat(formData.storageTemperature) <= 4 ? 6 : 1;
                break;
            case 'frozen':
                monthsToAdd = 24;
                break;
            case 'freeze-dried':
                monthsToAdd = 36;
                break;
            default:
                monthsToAdd = 6;
        }

        const expiryDate = new Date(harvestDate);
        expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);
        return expiryDate;
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
            case 1: // معلومات التطعيم
                if (!formData.graftingDate) newErrors.graftingDate = 'تاريخ التطعيم مطلوب';
                if (!formData.cellsGrafted || formData.cellsGrafted <= 0) {
                    newErrors.cellsGrafted = 'عدد الكؤوس المطعمة يجب أن يكون أكبر من صفر';
                }
                if (formData.larvalAge < 12 || formData.larvalAge > 36) {
                    newErrors.larvalAge = 'عمر اليرقات يجب أن يكون بين 12-36 ساعة';
                }
                break;

            case 2: // معلومات الحضانة والحصاد
                if (!formData.incubationStartDate) newErrors.incubationStartDate = 'تاريخ بدء الحضانة مطلوب';
                if (formData.incubationTemperature < 30 || formData.incubationTemperature > 40) {
                    newErrors.incubationTemperature = 'درجة حرارة الحضانة يجب أن تكون بين 30-40°م';
                }
                if (formData.incubationHumidity < 70 || formData.incubationHumidity > 100) {
                    newErrors.incubationHumidity = 'رطوبة الحضانة يجب أن تكون بين 70-100%';
                }
                if (formData.cellsHarvested && formData.cellsHarvested > formData.cellsGrafted) {
                    newErrors.cellsHarvested = 'عدد الكؤوس المحصودة لا يمكن أن يكون أكبر من المطعمة';
                }
                break;

            case 3: // معلومات الجودة
                if (formData.pH && (formData.pH < 3.0 || formData.pH > 5.0)) {
                    newErrors.pH = 'الحموضة يجب أن تكون بين 3.0-5.0';
                }
                if (formData.moistureContent && (formData.moistureContent < 60 || formData.moistureContent > 75)) {
                    newErrors.moistureContent = 'نسبة الرطوبة يجب أن تكون بين 60-75%';
                }
                if (formData.purity && (formData.purity < 80 || formData.purity > 100)) {
                    newErrors.purity = 'نسبة النقاء يجب أن تكون بين 80-100%';
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
                graftingDate: new Date(formData.graftingDate),
                incubationStartDate: new Date(formData.incubationStartDate),
                harvestDate: formData.harvestDate ? new Date(formData.harvestDate) : null,
                larvalAge: parseInt(formData.larvalAge),
                cellsGrafted: parseInt(formData.cellsGrafted),
                cellsHarvested: parseInt(formData.cellsHarvested) || 0,
                incubationTemperature: parseFloat(formData.incubationTemperature),
                incubationHumidity: parseFloat(formData.incubationHumidity),
                incubationPeriod: parseFloat(formData.incubationPeriod),
                totalWeight: parseFloat(formData.totalWeight) || 0,
                purity: parseFloat(formData.purity),
                moistureContent: parseFloat(formData.moistureContent),
                pH: parseFloat(formData.pH),
                proteinContent: parseFloat(formData.proteinContent),
                sugarContent: parseFloat(formData.sugarContent),
                lipidContent: parseFloat(formData.lipidContent),
                storageTemperature: parseFloat(formData.storageTemperature),
                productionCost: parseFloat(formData.productionCost) || 0,
                expectedPrice: parseFloat(formData.expectedPrice) || 0,
                laborHours: parseFloat(formData.laborHours) || 0,
                queenAge: parseInt(formData.queenAge),
                successRate: calculatedValues.successRate,
                averageWeightPerCell: calculatedValues.averageWeightPerCell
            };

            onSave(productionData);
        }
    };

    return (
        <div className="royal-jelly-form">
            <div className="form-header">
                <h3>
                    {production ? 'تعديل دورة إنتاج الغذاء الملكي' : 'إضافة دورة إنتاج جديدة'}
                </h3>
                <div className="step-indicator">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
                    <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
                    <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4</div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* الخطوة 1: معلومات التطعيم */}
                {currentStep === 1 && (
                    <div className="form-step">
                        <h4>معلومات التطعيم</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>تاريخ التطعيم *</label>
                                <input
                                    type="date"
                                    value={formData.graftingDate}
                                    onChange={(e) => handleInputChange('graftingDate', e.target.value)}
                                    className={errors.graftingDate ? 'error' : ''}
                                />
                                {errors.graftingDate && <span className="error-text">{errors.graftingDate}</span>}
                            </div>

                            <div className="form-group">
                                <label>عمر اليرقات (ساعة) *</label>
                                <input
                                    type="number"
                                    min="12"
                                    max="36"
                                    value={formData.larvalAge}
                                    onChange={(e) => handleInputChange('larvalAge', e.target.value)}
                                    className={errors.larvalAge ? 'error' : ''}
                                />
                                {errors.larvalAge && <span className="error-text">{errors.larvalAge}</span>}
                                <small>المعدل المثالي: 24 ساعة</small>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>عدد الكؤوس المطعمة *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.cellsGrafted}
                                    onChange={(e) => handleInputChange('cellsGrafted', e.target.value)}
                                    className={errors.cellsGrafted ? 'error' : ''}
                                />
                                {errors.cellsGrafted && <span className="error-text">{errors.cellsGrafted}</span>}
                            </div>

                            <div className="form-group">
                                <label>طريقة التطعيم</label>
                                <select
                                    value={formData.graftingMethod}
                                    onChange={(e) => handleInputChange('graftingMethod', e.target.value)}
                                >
                                    {Object.entries(GRAFTING_METHODS).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>أداة التطعيم</label>
                                <select
                                    value={formData.graftingTool}
                                    onChange={(e) => handleInputChange('graftingTool', e.target.value)}
                                >
                                    {Object.entries(GRAFTING_TOOLS).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* عرض الوقت المثالي للحصاد */}
                        {calculatedValues.optimalHarvestTime && (
                            <div className="optimal-harvest-time">
                                <label>الوقت المثالي للحصاد:</label>
                                <span>{calculatedValues.optimalHarvestTime.toLocaleString('ar-SA')}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* الخطوة 2: معلومات الحضانة والحصاد */}
                {currentStep === 2 && (
                    <div className="form-step">
                        <h4>الحضانة والحصاد</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>تاريخ بدء الحضانة *</label>
                                <input
                                    type="date"
                                    value={formData.incubationStartDate}
                                    onChange={(e) => handleInputChange('incubationStartDate', e.target.value)}
                                    className={errors.incubationStartDate ? 'error' : ''}
                                />
                                {errors.incubationStartDate && <span className="error-text">{errors.incubationStartDate}</span>}
                            </div>

                            <div className="form-group">
                                <label>فترة الحضانة (ساعة)</label>
                                <input
                                    type="number"
                                    min="48"
                                    max="96"
                                    value={formData.incubationPeriod}
                                    onChange={(e) => handleInputChange('incubationPeriod', e.target.value)}
                                />
                                <small>المعدل المثالي: 72 ساعة</small>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>درجة حرارة الحضانة (°م) *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="30"
                                    max="40"
                                    value={formData.incubationTemperature}
                                    onChange={(e) => handleInputChange('incubationTemperature', e.target.value)}
                                    className={errors.incubationTemperature ? 'error' : ''}
                                />
                                {errors.incubationTemperature && <span className="error-text">{errors.incubationTemperature}</span>}
                                <small>المعدل المثالي: 35°م</small>
                            </div>

                            <div className="form-group">
                                <label>رطوبة الحضانة (%) *</label>
                                <input
                                    type="number"
                                    min="70"
                                    max="100"
                                    value={formData.incubationHumidity}
                                    onChange={(e) => handleInputChange('incubationHumidity', e.target.value)}
                                    className={errors.incubationHumidity ? 'error' : ''}
                                />
                                {errors.incubationHumidity && <span className="error-text">{errors.incubationHumidity}</span>}
                                <small>المعدل المثالي: 90%</small>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>تاريخ الحصاد</label>
                                <input
                                    type="date"
                                    value={formData.harvestDate}
                                    onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>عدد الكؤوس المحصودة</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={formData.cellsGrafted}
                                    value={formData.cellsHarvested}
                                    onChange={(e) => handleInputChange('cellsHarvested', e.target.value)}
                                    className={errors.cellsHarvested ? 'error' : ''}
                                />
                                {errors.cellsHarvested && <span className="error-text">{errors.cellsHarvested}</span>}
                            </div>

                            <div className="form-group">
                                <label>الوزن الإجمالي (جم)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.totalWeight}
                                    onChange={(e) => handleInputChange('totalWeight', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* عرض القيم المحسوبة */}
                        <div className="calculated-values">
                            <div className="calc-item">
                                <label>معدل النجاح:</label>
                                <span>{calculatedValues.successRate}%</span>
                            </div>
                            <div className="calc-item">
                                <label>متوسط الوزن/كأس:</label>
                                <span>{calculatedValues.averageWeightPerCell} جم</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* الخطوة 3: معلومات الجودة */}
                {currentStep === 3 && (
                    <div className="form-step">
                        <h4>معلومات الجودة</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>اللون</label>
                                <select
                                    value={formData.color}
                                    onChange={(e) => handleInputChange('color', e.target.value)}
                                >
                                    {Object.entries(ROYAL_JELLY_COLORS).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>القوام</label>
                                <select
                                    value={formData.consistency}
                                    onChange={(e) => handleInputChange('consistency', e.target.value)}
                                >
                                    {Object.entries(CONSISTENCY_TYPES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>نسبة النقاء (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="80"
                                    max="100"
                                    value={formData.purity}
                                    onChange={(e) => handleInputChange('purity', e.target.value)}
                                    className={errors.purity ? 'error' : ''}
                                />
                                {errors.purity && <span className="error-text">{errors.purity}</span>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>نسبة الرطوبة (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="60"
                                    max="75"
                                    value={formData.moistureContent}
                                    onChange={(e) => handleInputChange('moistureContent', e.target.value)}
                                    className={errors.moistureContent ? 'error' : ''}
                                />
                                {errors.moistureContent && <span className="error-text">{errors.moistureContent}</span>}
                                <small>المعدل المثالي: 67%</small>
                            </div>

                            <div className="form-group">
                                <label>الحموضة (pH)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="3.0"
                                    max="5.0"
                                    value={formData.pH}
                                    onChange={(e) => handleInputChange('pH', e.target.value)}
                                    className={errors.pH ? 'error' : ''}
                                />
                                {errors.pH && <span className="error-text">{errors.pH}</span>}
                                <small>المعدل المثالي: 3.8</small>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>نسبة البروتين (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="8"
                                    max="18"
                                    value={formData.proteinContent}
                                    onChange={(e) => handleInputChange('proteinContent', e.target.value)}
                                />
                                <small>المعدل المثالي: 12%</small>
                            </div>

                            <div className="form-group">
                                <label>نسبة السكريات (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="10"
                                    max="20"
                                    value={formData.sugarContent}
                                    onChange={(e) => handleInputChange('sugarContent', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>نسبة الدهون (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="3"
                                    max="8"
                                    value={formData.lipidContent}
                                    onChange={(e) => handleInputChange('lipidContent', e.target.value)}
                                />
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

                {/* الخطوة 4: التخزين والمعلومات المالية */}
                {currentStep === 4 && (
                    <div className="form-step">
                        <h4>التخزين والمعلومات المالية</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>طريقة المعالجة</label>
                                <select
                                    value={formData.processingMethod}
                                    onChange={(e) => handleInputChange('processingMethod', e.target.value)}
                                >
                                    {Object.entries(PROCESSING_METHODS).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>درجة حرارة التخزين (°م)</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="-30"
                                    max="25"
                                    value={formData.storageTemperature}
                                    onChange={(e) => handleInputChange('storageTemperature', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>نوع وعاء التخزين</label>
                                <select
                                    value={formData.storageContainer}
                                    onChange={(e) => handleInputChange('storageContainer', e.target.value)}
                                >
                                    <option value="glass">زجاج</option>
                                    <option value="plastic">بلاستيك</option>
                                    <option value="aluminum">ألومنيوم</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>مكان التخزين</label>
                                <input
                                    type="text"
                                    value={formData.storageLocation}
                                    onChange={(e) => handleInputChange('storageLocation', e.target.value)}
                                    placeholder="مثل: ثلاجة رقم 1، الرف العلوي"
                                />
                            </div>

                            <div className="form-group">
                                <label>قوة الخلية</label>
                                <select
                                    value={formData.hiveStrength}
                                    onChange={(e) => handleInputChange('hiveStrength', e.target.value)}
                                >
                                    {Object.entries(HIVE_STRENGTH).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>عمر الملكة (شهر)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={formData.queenAge}
                                    onChange={(e) => handleInputChange('queenAge', e.target.value)}
                                />
                            </div>
                        </div>

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
                                <label>السعر المتوقع للجرام (ر.س)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.expectedPrice}
                                    onChange={(e) => handleInputChange('expectedPrice', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>ساعات العمل</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={formData.laborHours}
                                    onChange={(e) => handleInputChange('laborHours', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>ملاحظات</label>
                            <textarea
                                rows="4"
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="أي ملاحظات إضافية حول دورة الإنتاج..."
                            />
                        </div>

                        {/* عرض تاريخ انتهاء الصلاحية */}
                        {calculatedValues.expiryDate && (
                            <div className="expiry-info">
                                <label>تاريخ انتهاء الصلاحية المتوقع:</label>
                                <span>{calculatedValues.expiryDate.toLocaleDateString('ar-SA')}</span>
                            </div>
                        )}

                        {/* عرض ملخص الدورة */}
                        <div className="production-summary">
                            <h5>ملخص دورة الإنتاج</h5>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <label>معدل النجاح:</label>
                                    <span>{calculatedValues.successRate}%</span>
                                </div>
                                <div className="summary-item">
                                    <label>تقييم الجودة:</label>
                                    <span>{calculatedValues.qualityGrade}</span>
                                </div>
                                <div className="summary-item">
                                    <label>الإيراد المتوقع:</label>
                                    <span>{((parseFloat(formData.totalWeight) || 0) * (parseFloat(formData.expectedPrice) || 0)).toFixed(2)} ر.س</span>
                                </div>
                                <div className="summary-item">
                                    <label>الربح المتوقع:</label>
                                    <span>{(((parseFloat(formData.totalWeight) || 0) * (parseFloat(formData.expectedPrice) || 0)) - (parseFloat(formData.productionCost) || 0)).toFixed(2)} ر.س</span>
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
                            {production ? 'تحديث الدورة' : 'حفظ الدورة'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default RoyalJellyForm;