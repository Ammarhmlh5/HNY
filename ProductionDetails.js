/**
 * تفاصيل إنتاج العسل - Production Details
 * عرض تفصيلي شامل لبيانات إنتاج العسل
 */

import React from 'react';
import { HONEY_TYPES, HARVEST_SEASONS, COLOR_GRADES } from '../../models/HoneyProduction.js';
import './ProductionDetails.css';

export const ProductionDetails = ({ production, onEdit, onClose }) => {
    if (!production) return null;

    const profitability = production.calculateProfitability();
    const qualityGrade = production.getQualityGrade();
    const yieldPerFrame = production.getYieldPerFrame();

    const formatDate = (date) => {
        return date ? new Date(date).toLocaleDateString('ar-SA') : 'غير محدد';
    };

    const formatCurrency = (amount) => {
        return `${amount.toFixed(2)} ر.س`;
    };

    return (
        <div className="production-details">
            <div className="details-header">
                <div className="header-info">
                    <h3>تفاصيل إنتاج العسل</h3>
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
                            <label>تاريخ الحصاد:</label>
                            <span>{formatDate(production.harvestDate)}</span>
                        </div>
                        <div className="info-item">
                            <label>موسم الحصاد:</label>
                            <span>{HARVEST_SEASONS[production.harvestType] || production.harvestType}</span>
                        </div>
                        <div className="info-item">
                            <label>نوع العسل:</label>
                            <span>{HONEY_TYPES[production.honeyType] || production.honeyType}</span>
                        </div>
                        <div className="info-item">
                            <label>رقم الدفعة:</label>
                            <span className="batch-code">{production.batchNumber}</span>
                        </div>
                    </div>
                </div>

                {/* بيانات الحصاد */}
                <div className="details-section">
                    <h4>بيانات الحصاد</h4>
                    <div className="harvest-stats">
                        <div className="stat-card">
                            <div className="stat-icon">🍯</div>
                            <div className="stat-info">
                                <div className="stat-value">{production.netWeight} كغ</div>
                                <div className="stat-label">الوزن الصافي</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📦</div>
                            <div className="stat-info">
                                <div className="stat-value">{production.framesHarvested}</div>
                                <div className="stat-label">عدد الإطارات</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">⚖️</div>
                            <div className="stat-info">
                                <div className="stat-value">{yieldPerFrame.toFixed(2)} كغ</div>
                                <div className="stat-label">الإنتاج/إطار</div>
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

                    <div className="weight-breakdown">
                        <h5>تفصيل الأوزان</h5>
                        <div className="weight-items">
                            <div className="weight-item">
                                <span className="label">الوزن الإجمالي:</span>
                                <span className="value">{production.grossWeight} كغ</span>
                            </div>
                            <div className="weight-item">
                                <span className="label">وزن الإطارات ({production.framesHarvested} × {production.frameWeight}):</span>
                                <span className="value">{(production.framesHarvested * production.frameWeight).toFixed(2)} كغ</span>
                            </div>
                            <div className="weight-item total">
                                <span className="label">الوزن الصافي:</span>
                                <span className="value">{production.netWeight} كغ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* معلومات الجودة */}
                <div className="details-section">
                    <h4>معلومات الجودة</h4>
                    <div className="quality-grid">
                        <div className="quality-item">
                            <label>نسبة الرطوبة:</label>
                            <div className="moisture-indicator">
                                <span className={`moisture-value ${production.moistureContent > 20 ? 'high' : production.moistureContent > 18 ? 'medium' : 'good'}`}>
                                    {production.moistureContent}%
                                </span>
                                <div className="moisture-bar">
                                    <div
                                        className="moisture-fill"
                                        style={{ width: `${Math.min(production.moistureContent * 4, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="quality-item">
                            <label>درجة اللون:</label>
                            <span className={`color-badge ${production.color}`}>
                                {COLOR_GRADES[production.color] || production.color}
                            </span>
                        </div>

                        <div className="quality-item">
                            <label>درجة الوضوح:</label>
                            <span className={`clarity-badge ${production.clarity}`}>
                                {production.clarity === 'clear' ? 'صافي' :
                                    production.clarity === 'slightly-cloudy' ? 'عكر قليلاً' : 'عكر'}
                            </span>
                        </div>

                        <div className="quality-item">
                            <label>قوة الطعم:</label>
                            <span className="taste-badge">
                                {production.taste === 'mild' ? 'خفيف' :
                                    production.taste === 'medium' ? 'متوسط' : 'قوي'}
                            </span>
                        </div>

                        <div className="quality-item">
                            <label>نوع الرائحة:</label>
                            <span className="aroma-badge">
                                {production.aroma === 'floral' ? 'زهرية' :
                                    production.aroma === 'fruity' ? 'فاكهية' :
                                        production.aroma === 'woody' ? 'خشبية' :
                                            production.aroma === 'herbal' ? 'عشبية' :
                                                production.aroma === 'spicy' ? 'حارة' : production.aroma}
                            </span>
                        </div>
                    </div>

                    {/* تقييم الجودة الشامل */}
                    <div className="quality-assessment">
                        <div className="assessment-header">
                            <h5>تقييم الجودة الشامل</h5>
                            <span className={`grade-badge ${qualityGrade}`}>{qualityGrade}</span>
                        </div>
                        <div className="quality-tips">
                            {production.moistureContent > 20 && (
                                <div className="tip warning">
                                    ⚠️ نسبة الرطوبة عالية - قد يؤثر على مدة الحفظ
                                </div>
                            )}
                            {production.heatingTemperature === 0 && (
                                <div className="tip success">
                                    ✅ عسل خام - لم يتعرض للحرارة
                                </div>
                            )}
                            {production.clarity === 'clear' && production.color === 'light' && (
                                <div className="tip success">
                                    ✅ عسل فاتح وصافي - جودة ممتازة للتسويق
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* معلومات المعالجة */}
                <div className="details-section">
                    <h4>معلومات المعالجة والتخزين</h4>
                    <div className="processing-grid">
                        <div className="processing-item">
                            <label>طريقة الاستخلاص:</label>
                            <span>
                                {production.extractionMethod === 'centrifuge' ? 'الطرد المركزي' :
                                    production.extractionMethod === 'crush-strain' ? 'الهرس والتصفية' :
                                        production.extractionMethod === 'gravity' ? 'الجاذبية' : production.extractionMethod}
                            </span>
                        </div>

                        <div className="processing-item">
                            <label>مستوى التصفية:</label>
                            <span>
                                {production.filtrationLevel === 'coarse' ? 'خشن' :
                                    production.filtrationLevel === 'fine' ? 'ناعم' :
                                        production.filtrationLevel === 'ultra-fine' ? 'ناعم جداً' : production.filtrationLevel}
                            </span>
                        </div>

                        <div className="processing-item">
                            <label>درجة حرارة المعالجة:</label>
                            <span className={production.heatingTemperature === 0 ? 'raw-honey' : ''}>
                                {production.heatingTemperature}°م
                                {production.heatingTemperature === 0 && ' (عسل خام)'}
                            </span>
                        </div>

                        <div className="processing-item">
                            <label>تاريخ المعالجة:</label>
                            <span>{formatDate(production.processingDate)}</span>
                        </div>

                        <div className="processing-item">
                            <label>نوع وعاء التخزين:</label>
                            <span>
                                {production.storageContainer === 'stainless-steel' ? 'ستانلس ستيل' :
                                    production.storageContainer === 'food-grade-plastic' ? 'بلاستيك غذائي' :
                                        production.storageContainer === 'glass' ? 'زجاج' : production.storageContainer}
                            </span>
                        </div>

                        <div className="processing-item">
                            <label>مكان التخزين:</label>
                            <span>{production.storageLocation || 'غير محدد'}</span>
                        </div>
                    </div>
                </div>

                {/* المعلومات المالية */}
                <div className="details-section">
                    <h4>المعلومات المالية</h4>
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
                                    <span className={`value margin ${profitability.margin >= 30 ? 'good' : profitability.margin >= 15 ? 'average' : 'low'}`}>
                                        {profitability.margin.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="financial-item">
                                    <span className="label">التكلفة لكل كيلو:</span>
                                    <span className="value">{formatCurrency(profitability.costPerKg)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* التواريخ المهمة */}
                <div className="details-section">
                    <h4>التواريخ المهمة</h4>
                    <div className="dates-timeline">
                        <div className="timeline-item">
                            <div className="timeline-icon">🌾</div>
                            <div className="timeline-content">
                                <div className="timeline-title">تاريخ الحصاد</div>
                                <div className="timeline-date">{formatDate(production.harvestDate)}</div>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-icon">⚙️</div>
                            <div className="timeline-content">
                                <div className="timeline-title">تاريخ المعالجة</div>
                                <div className="timeline-date">{formatDate(production.processingDate)}</div>
                            </div>
                        </div>

                        {production.packagingDate && (
                            <div className="timeline-item">
                                <div className="timeline-icon">📦</div>
                                <div className="timeline-content">
                                    <div className="timeline-title">تاريخ التعبئة</div>
                                    <div className="timeline-date">{formatDate(production.packagingDate)}</div>
                                </div>
                            </div>
                        )}

                        {production.expiryDate && (
                            <div className="timeline-item">
                                <div className="timeline-icon">⏰</div>
                                <div className="timeline-content">
                                    <div className="timeline-title">تاريخ انتهاء الصلاحية</div>
                                    <div className="timeline-date">{formatDate(production.expiryDate)}</div>
                                </div>
                            </div>
                        )}
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
                            <label>معرف الإنتاج:</label>
                            <span className="system-id">{production.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionDetails;