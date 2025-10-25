/**
 * تفاصيل إنتاج الغذاء الملكي - Royal Jelly Production Details
 * عرض تفصيلي شامل لبيانات دورة إنتاج الغذاء الملكي
 */

import React from 'react';
import {
    GRAFTING_METHODS,
    GRAFTING_TOOLS,
    ROYAL_JELLY_COLORS,
    CONSISTENCY_TYPES,
    PROCESSING_METHODS,
    HIVE_STRENGTH
} from '../../models/RoyalJellyProduction.js';
import './RoyalJellyDetails.css';

export const RoyalJellyDetails = ({ production, onEdit, onClose }) => {
    if (!production) return null;

    const profitability = production.calculateProfitability();
    const qualityGrade = production.getQualityGrade();
    const productivityRate = production.getProductivityRate();
    const environmentalConditions = production.evaluateEnvironmentalConditions();
    const optimalHarvestTime = production.getOptimalHarvestTime();

    const formatDate = (date) => {
        return date ? new Date(date).toLocaleDateString('ar-SA') : 'غير محدد';
    };

    const formatDateTime = (date) => {
        return date ? new Date(date).toLocaleString('ar-SA') : 'غير محدد';
    };

    const formatCurrency = (amount) => {
        return `${amount.toFixed(2)} ر.س`;
    };

    return (
        <div className="royal-jelly-details">
            <div className="details-header">
                <div className="header-info">
                    <h3>تفاصيل دورة إنتاج الغذاء الملكي</h3>
                    <div className="batch-number">{production.batchNumber}</div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={onEdit}>
                        <span className="icon">✏️</span>
                        تعديل
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                        <span className="icon">✕</span>
                        إغلاق
                    </button>
                </div>
            </div>

            <div className="details-content">
                {/* معلومات أساسية */}
                <div className="details-section">
                    <h4>المعلومات الأساسية</h4>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>تاريخ التطعيم:</label>
                            <span>{formatDate(production.graftingDate)}</span>
                        </div>
                        <div className="info-item">
                            <label>رقم الدورة:</label>
                            <span>{production.cycleNumber}</span>
                        </div>
                        <div className="info-item">
                            <label>رقم الدفعة:</label>
                            <span className="batch-code">{production.batchNumber}</span>
                        </div>
                        <div className="info-item">
                            <label>عمر اليرقات:</label>
                            <span>{production.larvalAge} ساعة</span>
                        </div>
                    </div>
                </div>

                {/* إحصائيات الإنتاج */}
                <div className="details-section">
                    <h4>إحصائيات الإنتاج</h4>
                    <div className="production-stats">
                        <div className="stat-card">
                            <div className="stat-icon">🥄</div>
                            <div className="stat-info">
                                <div className="stat-value">{production.cellsGrafted}</div>
                                <div className="stat-label">كؤوس مطعمة</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <div className="stat-value">{production.cellsHarvested}</div>
                                <div className="stat-label">كؤوس محصودة</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-info">
                                <div className="stat-value">{production.successRate.toFixed(1)}%</div>
                                <div className="stat-label">معدل النجاح</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⚖️</div>
                            <div className="stat-info">
                                <div className="stat-value">{production.totalWeight.toFixed(2)} جم</div>
                                <div className="stat-label">الوزن الإجمالي</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔬</div>
                            <div className="stat-info">
                                <div className="stat-value">{production.averageWeightPerCell.toFixed(3)} جم</div>
                                <div className="stat-label">متوسط الوزن/كأس</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🏆</div>
                            <div className="stat-info">
                                <div className="stat-value quality-grade">{qualityGrade}</div>
                                <div className="stat-label">درجة الجودة</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* معلومات التطعيم */}
                <div className="details-section">
                    <h4>معلومات التطعيم</h4>
                    <div className="grafting-info">
                        <div className="info-row">
                            <span className="label">طريقة التطعيم:</span>
                            <span className="value">{GRAFTING_METHODS[production.graftingMethod] || production.graftingMethod}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">أداة التطعيم:</span>
                            <span className="value">{GRAFTING_TOOLS[production.graftingTool] || production.graftingTool}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">الوقت المثالي للحصاد:</span>
                            <span className="value optimal-time">{formatDateTime(optimalHarvestTime)}</span>
                        </div>
                        {production.harvestDate && (
                            <div className="info-row">
                                <span className="label">تاريخ الحصاد الفعلي:</span>
                                <span className="value">{formatDate(production.harvestDate)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ظروف الحضانة */}
                <div className="details-section">
                    <h4>ظروف الحضانة</h4>
                    <div className="incubation-conditions">
                        <div className="condition-item">
                            <label>تاريخ بدء الحضانة:</label>
                            <span>{formatDate(production.incubationStartDate)}</span>
                        </div>
                        <div className="condition-item">
                            <label>فترة الحضانة:</label>
                            <span>{production.incubationPeriod} ساعة</span>
                        </div>
                        <div className="condition-item">
                            <label>درجة الحرارة:</label>
                            <div className="temperature-indicator">
                                <span className={`temp-value ${environmentalConditions.temperature}`}>
                                    {production.incubationTemperature}°م
                                </span>
                                <div className="temp-status">
                                    {environmentalConditions.temperature === 'optimal' ? '✅ مثالية' :
                                        environmentalConditions.temperature === 'low' ? '❄️ منخفضة' : '🔥 عالية'}
                                </div>
                            </div>
                        </div>
                        <div className="condition-item">
                            <label>الرطوبة:</label>
                            <div className="humidity-indicator">
                                <span className={`humidity-value ${environmentalConditions.humidity}`}>
                                    {production.incubationHumidity}%
                                </span>
                                <div className="humidity-status">
                                    {environmentalConditions.humidity === 'optimal' ? '✅ مثالية' :
                                        environmentalConditions.humidity === 'low' ? '🏜️ منخفضة' : '💧 عالية'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* تقييم الظروف البيئية */}
                    <div className="environmental-assessment">
                        <div className="assessment-header">
                            <h5>تقييم الظروف البيئية</h5>
                            <span className={`overall-status ${environmentalConditions.overall}`}>
                                {environmentalConditions.overall === 'good' ? '✅ جيدة' : '⚠️ دون المثالية'}
                            </span>
                        </div>
                        {environmentalConditions.overall !== 'good' && (
                            <div className="environmental-tips">
                                <div className="tip warning">
                                    ⚠️ الظروف البيئية دون المثالية قد تؤثر على جودة وكمية الإنتاج
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* معلومات الجودة */}
                <div className="details-section">
                    <h4>معلومات الجودة</h4>
                    <div className="quality-analysis">
                        <div className="quality-overview">
                            <div className="quality-grade-display">
                                <span className={`grade-badge ${qualityGrade}`}>{qualityGrade}</span>
                            </div>
                        </div>

                        <div className="quality-parameters">
                            <div className="parameter-item">
                                <label>اللون:</label>
                                <span className={`color-badge ${production.color}`}>
                                    {ROYAL_JELLY_COLORS[production.color] || production.color}
                                </span>
                            </div>
                            <div className="parameter-item">
                                <label>القوام:</label>
                                <span className="consistency-badge">
                                    {CONSISTENCY_TYPES[production.consistency] || production.consistency}
                                </span>
                            </div>
                            <div className="parameter-item">
                                <label>نسبة النقاء:</label>
                                <span className="purity-value">{production.purity}%</span>
                            </div>
                        </div>

                        <div className="chemical-composition">
                            <h5>التركيب الكيميائي</h5>
                            <div className="composition-grid">
                                <div className="composition-item">
                                    <label>الرطوبة:</label>
                                    <div className="moisture-bar">
                                        <div className="bar-fill" style={{ width: `${production.moistureContent}%` }}></div>
                                        <span className="bar-value">{production.moistureContent}%</span>
                                    </div>
                                </div>
                                <div className="composition-item">
                                    <label>الحموضة (pH):</label>
                                    <span className={`ph-value ${production.pH >= 3.6 && production.pH <= 4.0 ? 'optimal' : 'suboptimal'}`}>
                                        {production.pH}
                                    </span>
                                </div>
                                <div className="composition-item">
                                    <label>البروتين:</label>
                                    <span className="protein-value">{production.proteinContent}%</span>
                                </div>
                                <div className="composition-item">
                                    <label>السكريات:</label>
                                    <span className="sugar-value">{production.sugarContent}%</span>
                                </div>
                                <div className="composition-item">
                                    <label>الدهون:</label>
                                    <span className="lipid-value">{production.lipidContent}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* معلومات التخزين */}
                <div className="details-section">
                    <h4>معلومات التخزين والمعالجة</h4>
                    <div className="storage-info">
                        <div className="storage-item">
                            <label>طريقة المعالجة:</label>
                            <span className={`processing-method ${production.processingMethod}`}>
                                {PROCESSING_METHODS[production.processingMethod] || production.processingMethod}
                            </span>
                        </div>
                        <div className="storage-item">
                            <label>درجة حرارة التخزين:</label>
                            <span className="storage-temp">{production.storageTemperature}°م</span>
                        </div>
                        <div className="storage-item">
                            <label>نوع الوعاء:</label>
                            <span className="container-type">
                                {production.storageContainer === 'glass' ? 'زجاج' :
                                    production.storageContainer === 'plastic' ? 'بلاستيك' :
                                        production.storageContainer === 'aluminum' ? 'ألومنيوم' : production.storageContainer}
                            </span>
                        </div>
                        <div className="storage-item">
                            <label>مكان التخزين:</label>
                            <span className="storage-location">{production.storageLocation || 'غير محدد'}</span>
                        </div>
                        {production.expiryDate && (
                            <div className="storage-item">
                                <label>تاريخ انتهاء الصلاحية:</label>
                                <span className="expiry-date">{formatDate(production.expiryDate)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* المعلومات المالية */}
                <div className="details-section">
                    <h4>المعلومات المالية</h4>
                    <div className="financial-analysis">
                        <div className="financial-summary">
                            <div className="financial-card">
                                <div className="card-header">
                                    <h5>ملخص الربحية</h5>
                                </div>
                                <div className="financial-items">
                                    <div className="financial-item">
                                        <span className="label">تكلفة الإنتاج:</span>
                                        <span className="value cost">{formatCurrency(production.productionCost)}</span>
                                    </div>
                                    <div className="financial-item">
                                        <span className="label">الإيراد المتوقع:</span>
                                        <span className="value revenue">{formatCurrency(profitability.revenue)}</span>
                                    </div>
                                    <div className="financial-item">
                                        <span className="label">الربح المتوقع:</span>
                                        <span className={`value profit ${profitability.profit >= 0 ? 'positive' : 'negative'}`}>
                                            {formatCurrency(profitability.profit)}
                                        </span>
                                    </div>
                                    <div className="financial-item">
                                        <span className="label">هامش الربح:</span>
                                        <span className={`value margin ${profitability.margin >= 200 ? 'good' : profitability.margin >= 100 ? 'average' : 'low'}`}>
                                            {profitability.margin.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="financial-item">
                                        <span className="label">التكلفة لكل جرام:</span>
                                        <span className="value">{formatCurrency(profitability.costPerGram)}</span>
                                    </div>
                                    <div className="financial-item">
                                        <span className="label">الربح لكل جرام:</span>
                                        <span className="value">{formatCurrency(profitability.profitPerGram)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* معلومات الإنتاجية */}
                        <div className="productivity-info">
                            <h5>معلومات الإنتاجية</h5>
                            <div className="productivity-items">
                                <div className="productivity-item">
                                    <label>ساعات العمل:</label>
                                    <span>{production.laborHours} ساعة</span>
                                </div>
                                <div className="productivity-item">
                                    <label>الإنتاجية (جم/ساعة):</label>
                                    <span className="productivity-rate">{productivityRate.toFixed(3)} جم/ساعة</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* معلومات الخلية */}
                <div className="details-section">
                    <h4>معلومات الخلية</h4>
                    <div className="hive-info">
                        <div className="hive-item">
                            <label>قوة الخلية:</label>
                            <span className={`hive-strength ${production.hiveStrength}`}>
                                {HIVE_STRENGTH[production.hiveStrength] || production.hiveStrength}
                            </span>
                        </div>
                        <div className="hive-item">
                            <label>عمر الملكة:</label>
                            <span className="queen-age">{production.queenAge} شهر</span>
                        </div>
                    </div>
                </div>

                {/* الملاحظات */}
                {production.notes && (
                    <div className="details-section">
                        <h4>الملاحظات</h4>
                        <div className="notes-content">
                            <p>{production.notes}</p>
                        </div>
                    </div>
                )}

                {/* معلومات النظام */}
                <div className="details-section system-info">
                    <h4>معلومات النظام</h4>
                    <div className="system-grid">
                        <div className="system-item">
                            <label>تاريخ الإنشاء:</label>
                            <span>{formatDate(production.createdAt)}</span>
                        </div>
                        <div className="system-item">
                            <label>آخر تحديث:</label>
                            <span>{formatDate(production.updatedAt)}</span>
                        </div>
                        <div className="system-item">
                            <label>معرف الدورة:</label>
                            <span className="system-id">{production.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoyalJellyDetails;