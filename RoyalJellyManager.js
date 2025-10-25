/**
 * مدير إنتاج الغذاء الملكي - Royal Jelly Production Manager
 * واجهة شاملة لإدارة عمليات إنتاج الغذاء الملكي
 */

import React, { useState, useEffect } from 'react';
import { RoyalJellyProductionService } from '../../services/RoyalJellyProductionService.js';
import { GRAFTING_METHODS, PROCESSING_METHODS, ROYAL_JELLY_COLORS } from '../../models/RoyalJellyProduction.js';
import RoyalJellyForm from './RoyalJellyForm.js';
import RoyalJellyDetails from './RoyalJellyDetails.js';
import './RoyalJellyManager.css';

export const RoyalJellyManager = ({ apiaryId, onClose }) => {
    const [royalJellyService] = useState(() => new RoyalJellyProductionService());
    const [productions, setProductions] = useState([]);
    const [filteredProductions, setFilteredProductions] = useState([]);
    const [currentView, setCurrentView] = useState('list'); // list, add, edit, details
    const [selectedProduction, setSelectedProduction] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        graftingMethod: '',
        quality: '',
        year: new Date().getFullYear(),
        month: ''
    });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // تحميل البيانات عند بدء التشغيل
    useEffect(() => {
        loadProductions();
    }, [apiaryId]);

    // تطبيق الفلاتر والبحث
    useEffect(() => {
        applyFiltersAndSearch();
    }, [productions, searchQuery, filters]);

    const loadProductions = async () => {
        try {
            setLoading(true);
            await royalJellyService.loadProductions();

            const apiaryProductions = apiaryId ?
                royalJellyService.getProductionsByApiary(apiaryId) :
                royalJellyService.productions;

            setProductions(apiaryProductions);

            // حساب الإحصائيات
            const productionStats = apiaryId ?
                royalJellyService.getApiaryProductionStats(apiaryId, filters.year) :
                royalJellyService.getAllProductionStats(filters.year);

            setStats(productionStats);
        } catch (error) {
            console.error('خطأ في تحميل بيانات إنتاج الغذاء الملكي:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndSearch = () => {
        const filtered = royalJellyService.searchProductions(searchQuery, {
            ...filters,
            apiaryId: apiaryId
        });
        setFilteredProductions(filtered);
    };

    const handleAddProduction = () => {
        setSelectedProduction(null);
        setCurrentView('add');
    };

    const handleEditProduction = (production) => {
        setSelectedProduction(production);
        setCurrentView('edit');
    };

    const handleViewDetails = (production) => {
        setSelectedProduction(production);
        setCurrentView('details');
    };

    const handleDeleteProduction = async (productionId) => {
        if (window.confirm('هل أنت متأكد من حذف دورة الإنتاج هذه؟')) {
            try {
                await royalJellyService.deleteProduction(productionId);
                await loadProductions();
            } catch (error) {
                alert('خطأ في حذف دورة الإنتاج: ' + error.message);
            }
        }
    };

    const handleSaveProduction = async (productionData) => {
        try {
            if (selectedProduction) {
                await royalJellyService.updateProduction(selectedProduction.id, productionData);
            } else {
                await royalJellyService.addProduction({
                    ...productionData,
                    apiaryId: apiaryId
                });
            }

            await loadProductions();
            setCurrentView('list');
        } catch (error) {
            alert('خطأ في حفظ دورة الإنتاج: ' + error.message);
        }
    };

    const exportToCSV = () => {
        const csvData = royalJellyService.exportToCSV(filteredProductions);
        const csvContent = csvData.map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `royal_jelly_production_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="royal-jelly-manager loading">
                <div className="loading-spinner">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="royal-jelly-manager">
            <div className="manager-header">
                <h2>
                    <span className="icon">👑</span>
                    إدارة إنتاج الغذاء الملكي
                </h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            {currentView === 'list' && (
                <div className="production-list-view">
                    {/* شريط الأدوات */}
                    <div className="toolbar">
                        <div className="search-section">
                            <input
                                type="text"
                                placeholder="البحث في دورات الإنتاج..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filters-section">
                            <select
                                value={filters.graftingMethod}
                                onChange={(e) => setFilters({ ...filters, graftingMethod: e.target.value })}
                            >
                                <option value="">جميع طرق التطعيم</option>
                                {Object.entries(GRAFTING_METHODS).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>

                            <select
                                value={filters.quality}
                                onChange={(e) => setFilters({ ...filters, quality: e.target.value })}
                            >
                                <option value="">جميع درجات الجودة</option>
                                <option value="ممتاز">ممتاز</option>
                                <option value="جيد جداً">جيد جداً</option>
                                <option value="جيد">جيد</option>
                                <option value="مقبول">مقبول</option>
                                <option value="ضعيف">ضعيف</option>
                            </select>

                            <select
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="actions-section">
                            <button className="btn-primary" onClick={handleAddProduction}>
                                <span className="icon">➕</span>
                                دورة جديدة
                            </button>
                            <button className="btn-secondary" onClick={exportToCSV}>
                                <span className="icon">📊</span>
                                تصدير CSV
                            </button>
                        </div>
                    </div>

                    {/* الإحصائيات السريعة */}
                    {stats && (
                        <div className="quick-stats">
                            <div className="stat-card">
                                <div className="stat-value">{stats.totalCycles}</div>
                                <div className="stat-label">إجمالي الدورات</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.totalWeight.toFixed(1)} جم</div>
                                <div className="stat-label">إجمالي الوزن</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.averageSuccessRate.toFixed(1)}%</div>
                                <div className="stat-label">متوسط معدل النجاح</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.averageWeightPerCell.toFixed(3)} جم</div>
                                <div className="stat-label">متوسط الوزن/كأس</div>
                            </div>
                        </div>
                    )}

                    {/* قائمة دورات الإنتاج */}
                    <div className="productions-grid">
                        {filteredProductions.length === 0 ? (
                            <div className="empty-state">
                                <span className="icon">👑</span>
                                <h3>لا توجد دورات إنتاج</h3>
                                <p>ابدأ بإضافة أول دورة إنتاج غذاء ملكي</p>
                                <button className="btn-primary" onClick={handleAddProduction}>
                                    إضافة دورة جديدة
                                </button>
                            </div>
                        ) : (
                            filteredProductions.map(production => (
                                <ProductionCard
                                    key={production.id}
                                    production={production}
                                    onEdit={() => handleEditProduction(production)}
                                    onDelete={() => handleDeleteProduction(production.id)}
                                    onViewDetails={() => handleViewDetails(production)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {currentView === 'add' && (
                <RoyalJellyForm
                    onSave={handleSaveProduction}
                    onCancel={() => setCurrentView('list')}
                    apiaryId={apiaryId}
                />
            )}

            {currentView === 'edit' && selectedProduction && (
                <RoyalJellyForm
                    production={selectedProduction}
                    onSave={handleSaveProduction}
                    onCancel={() => setCurrentView('list')}
                    apiaryId={apiaryId}
                />
            )}

            {currentView === 'details' && selectedProduction && (
                <RoyalJellyDetails
                    production={selectedProduction}
                    onEdit={() => setCurrentView('edit')}
                    onClose={() => setCurrentView('list')}
                />
            )}
        </div>
    );
};

// مكون بطاقة دورة الإنتاج
const ProductionCard = ({ production, onEdit, onDelete, onViewDetails }) => {
    const profitability = production.calculateProfitability();
    const qualityGrade = production.getQualityGrade();

    return (
        <div className="production-card">
            <div className="card-header">
                <div className="batch-info">
                    <h4>{production.batchNumber}</h4>
                    <span className="grafting-date">
                        {new Date(production.graftingDate).toLocaleDateString('ar-SA')}
                    </span>
                </div>
                <div className="card-actions">
                    <button className="btn-icon" onClick={onViewDetails} title="عرض التفاصيل">
                        👁️
                    </button>
                    <button className="btn-icon" onClick={onEdit} title="تعديل">
                        ✏️
                    </button>
                    <button className="btn-icon delete" onClick={onDelete} title="حذف">
                        🗑️
                    </button>
                </div>
            </div>

            <div className="card-content">
                <div className="production-info">
                    <div className="info-row">
                        <span className="label">الكؤوس المطعمة:</span>
                        <span className="value">{production.cellsGrafted}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">معدل النجاح:</span>
                        <span className="value">{production.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="info-row">
                        <span className="label">الوزن الإجمالي:</span>
                        <span className="value">{production.totalWeight.toFixed(2)} جم</span>
                    </div>
                    <div className="info-row">
                        <span className="label">الجودة:</span>
                        <span className={`quality-badge ${qualityGrade}`}>{qualityGrade}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">الربح:</span>
                        <span className="value profit">{profitability.profit.toFixed(2)} ر.س</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoyalJellyManager;