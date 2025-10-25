/**
 * مدير إنتاج العسل - Honey Production Manager
 * واجهة شاملة لإدارة عمليات إنتاج العسل
 */

import React, { useState, useEffect } from 'react';
import { HoneyProductionService } from '../../services/HoneyProductionService.js';
import { HONEY_TYPES, HARVEST_SEASONS, COLOR_GRADES } from '../../models/HoneyProduction.js';
import ProductionForm from './ProductionForm.js';
import ProductionDetails from './ProductionDetails.js';
import './HoneyProductionManager.css';

export const HoneyProductionManager = ({ apiaryId, onClose }) => {
    const [honeyService] = useState(() => new HoneyProductionService());
    const [productions, setProductions] = useState([]);
    const [filteredProductions, setFilteredProductions] = useState([]);
    const [currentView, setCurrentView] = useState('list'); // list, add, edit, details
    const [selectedProduction, setSelectedProduction] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        season: '',
        honeyType: '',
        year: new Date().getFullYear(),
        quality: ''
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
            await honeyService.loadProductions();

            const apiaryProductions = apiaryId ?
                honeyService.getProductionsByApiary(apiaryId) :
                honeyService.productions;

            setProductions(apiaryProductions);

            // حساب الإحصائيات
            const productionStats = apiaryId ?
                honeyService.getApiaryProductionStats(apiaryId, filters.year) :
                honeyService.getAllProductionStats(filters.year);

            setStats(productionStats);
        } catch (error) {
            console.error('خطأ في تحميل بيانات الإنتاج:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndSearch = () => {
        const filtered = honeyService.searchProductions(searchQuery, {
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
        if (window.confirm('هل أنت متأكد من حذف هذا الإنتاج؟')) {
            try {
                await honeyService.deleteProduction(productionId);
                await loadProductions();
            } catch (error) {
                alert('خطأ في حذف الإنتاج: ' + error.message);
            }
        }
    };

    const handleSaveProduction = async (productionData) => {
        try {
            if (selectedProduction) {
                await honeyService.updateProduction(selectedProduction.id, productionData);
            } else {
                await honeyService.addProduction({
                    ...productionData,
                    apiaryId: apiaryId
                });
            }

            await loadProductions();
            setCurrentView('list');
        } catch (error) {
            alert('خطأ في حفظ الإنتاج: ' + error.message);
        }
    };

    const exportToCSV = () => {
        const csvData = honeyService.exportToCSV(filteredProductions);
        const csvContent = csvData.map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `honey_production_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="honey-production-manager loading">
                <div className="loading-spinner">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="honey-production-manager">
            <div className="manager-header">
                <h2>
                    <span className="icon">🍯</span>
                    إدارة إنتاج العسل
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
                                placeholder="البحث في الإنتاجات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filters-section">
                            <select
                                value={filters.season}
                                onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                            >
                                <option value="">جميع المواسم</option>
                                {Object.entries(HARVEST_SEASONS).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>

                            <select
                                value={filters.honeyType}
                                onChange={(e) => setFilters({ ...filters, honeyType: e.target.value })}
                            >
                                <option value="">جميع الأنواع</option>
                                {Object.entries(HONEY_TYPES).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
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
                                إضافة إنتاج
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
                                <div className="stat-value">{stats.totalProductions}</div>
                                <div className="stat-label">إجمالي الإنتاجات</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.totalWeight.toFixed(1)} كغ</div>
                                <div className="stat-label">إجمالي الوزن</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.averageYieldPerFrame.toFixed(2)} كغ</div>
                                <div className="stat-label">متوسط الإنتاج/إطار</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{stats.profitability.averageMargin.toFixed(1)}%</div>
                                <div className="stat-label">متوسط هامش الربح</div>
                            </div>
                        </div>
                    )}

                    {/* قائمة الإنتاجات */}
                    <div className="productions-grid">
                        {filteredProductions.length === 0 ? (
                            <div className="empty-state">
                                <span className="icon">🍯</span>
                                <h3>لا توجد إنتاجات</h3>
                                <p>ابدأ بإضافة أول إنتاج عسل لك</p>
                                <button className="btn-primary" onClick={handleAddProduction}>
                                    إضافة إنتاج جديد
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
                <ProductionForm
                    onSave={handleSaveProduction}
                    onCancel={() => setCurrentView('list')}
                    apiaryId={apiaryId}
                />
            )}

            {currentView === 'edit' && selectedProduction && (
                <ProductionForm
                    production={selectedProduction}
                    onSave={handleSaveProduction}
                    onCancel={() => setCurrentView('list')}
                    apiaryId={apiaryId}
                />
            )}

            {currentView === 'details' && selectedProduction && (
                <ProductionDetails
                    production={selectedProduction}
                    onEdit={() => setCurrentView('edit')}
                    onClose={() => setCurrentView('list')}
                />
            )}
        </div>
    );
};

// مكون بطاقة الإنتاج
const ProductionCard = ({ production, onEdit, onDelete, onViewDetails }) => {
    const profitability = production.calculateProfitability();
    const qualityGrade = production.getQualityGrade();

    return (
        <div className="production-card">
            <div className="card-header">
                <div className="batch-info">
                    <h4>{production.batchNumber}</h4>
                    <span className="harvest-date">
                        {new Date(production.harvestDate).toLocaleDateString('ar-SA')}
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
                        <span className="label">النوع:</span>
                        <span className="value">{HONEY_TYPES[production.honeyType]}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">الوزن:</span>
                        <span className="value">{production.netWeight} كغ</span>
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

// المكونات الفرعية مستوردة من ملفات منفصلة

export default HoneyProductionManager;