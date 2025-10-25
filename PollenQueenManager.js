/**
 * مدير حبوب اللقاح والملكات - Pollen & Queen Manager
 * واجهة شاملة لإدارة إنتاج حبوب اللقاح والملكات
 */

import React, { useState, useEffect } from 'react';
import { PollenQueenService } from '../../services/PollenQueenService.js';
import { TRAP_TYPES, COLLECTION_PERIODS } from '../../models/PollenProduction.js';
import { BEE_BREEDS, TEMPERAMENTS } from '../../models/QueenProduction.js';
import PollenForm from './PollenForm.js';
import QueenForm from './QueenForm.js';
import PollenDetails from './PollenDetails.js';
import QueenDetails from './QueenDetails.js';
import './PollenQueenManager.css';

export const PollenQueenManager = ({ apiaryId, onClose }) => {
    const [service] = useState(() => new PollenQueenService());
    const [activeTab, setActiveTab] = useState('pollen'); // pollen, queens
    const [currentView, setCurrentView] = useState('list'); // list, add, edit, details
    const [selectedItem, setSelectedItem] = useState(null);

    // حالة حبوب اللقاح
    const [pollenProductions, setPollenProductions] = useState([]);
    const [filteredPollen, setFilteredPollen] = useState([]);
    const [pollenStats, setPollenStats] = useState(null);

    // حالة الملكات
    const [queenProductions, setQueenProductions] = useState([]);
    const [filteredQueens, setFilteredQueens] = useState([]);
    const [queenStats, setQueenStats] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        season: '',
        trapType: '',
        breed: '',
        quality: '',
        year: new Date().getFullYear()
    });
    const [loading, setLoading] = useState(true);

    // تحميل البيانات عند بدء التشغيل
    useEffect(() => {
        loadData();
    }, [apiaryId]);

    // تطبيق الفلاتر والبحث
    useEffect(() => {
        applyFiltersAndSearch();
    }, [pollenProductions, queenProductions, searchQuery, filters, activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            await service.loadData();

            const apiaryPollen = apiaryId ?
                service.pollenProductions.filter(p => p.apiaryId === apiaryId) :
                service.pollenProductions;

            const apiaryQueens = apiaryId ?
                service.queenProductions.filter(p => p.apiaryId === apiaryId) :
                service.queenProductions;

            setPollenProductions(apiaryPollen);
            setQueenProductions(apiaryQueens);

            // حساب الإحصائيات
            const pollenStatsData = service.getPollenProductionStats(apiaryId, filters.year);
            const queenStatsData = service.getQueenProductionStats(apiaryId, filters.year);

            setPollenStats(pollenStatsData);
            setQueenStats(queenStatsData);
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndSearch = () => {
        if (activeTab === 'pollen') {
            const filtered = service.searchPollenProductions(searchQuery, {
                ...filters,
                apiaryId: apiaryId
            });
            setFilteredPollen(filtered);
        } else {
            const filtered = service.searchQueenProductions(searchQuery, {
                ...filters,
                apiaryId: apiaryId
            });
            setFilteredQueens(filtered);
        }
    };

    const handleAdd = () => {
        setSelectedItem(null);
        setCurrentView('add');
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setCurrentView('edit');
    };

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        setCurrentView('details');
    };

    const handleDelete = async (itemId) => {
        const confirmMessage = activeTab === 'pollen' ?
            'هل أنت متأكد من حذف إنتاج حبوب اللقاح؟' :
            'هل أنت متأكد من حذف إنتاج الملكات؟';

        if (window.confirm(confirmMessage)) {
            try {
                if (activeTab === 'pollen') {
                    await service.deletePollenProduction(itemId);
                } else {
                    await service.deleteQueenProduction(itemId);
                }
                await loadData();
            } catch (error) {
                alert('خطأ في الحذف: ' + error.message);
            }
        }
    };

    const handleSave = async (itemData) => {
        try {
            if (activeTab === 'pollen') {
                if (selectedItem) {
                    await service.updatePollenProduction(selectedItem.id, itemData);
                } else {
                    await service.addPollenProduction({
                        ...itemData,
                        apiaryId: apiaryId
                    });
                }
            } else {
                if (selectedItem) {
                    await service.updateQueenProduction(selectedItem.id, itemData);
                } else {
                    await service.addQueenProduction({
                        ...itemData,
                        apiaryId: apiaryId
                    });
                }
            }

            await loadData();
            setCurrentView('list');
        } catch (error) {
            alert('خطأ في الحفظ: ' + error.message);
        }
    };

    const exportToCSV = () => {
        const csvData = activeTab === 'pollen' ?
            service.exportPollenToCSV(filteredPollen) :
            service.exportQueensToCSV(filteredQueens);

        const csvContent = csvData.map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${activeTab}_production_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="pollen-queen-manager loading">
                <div className="loading-spinner">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="pollen-queen-manager">
            <div className="manager-header">
                <h2>
                    <span className="icon">🌸</span>
                    إدارة حبوب اللقاح والملكات
                </h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            {currentView === 'list' && (
                <div className="manager-content">
                    {/* تبويبات التنقل */}
                    <div className="tab-navigation">
                        <button
                            className={`tab-btn ${activeTab === 'pollen' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pollen')}
                        >
                            <span className="icon">🌼</span>
                            حبوب اللقاح
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'queens' ? 'active' : ''}`}
                            onClick={() => setActiveTab('queens')}
                        >
                            <span className="icon">👑</span>
                            الملكات
                        </button>
                    </div>

                    {/* شريط الأدوات */}
                    <div className="toolbar">
                        <div className="search-section">
                            <input
                                type="text"
                                placeholder={`البحث في ${activeTab === 'pollen' ? 'حبوب اللقاح' : 'الملكات'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filters-section">
                            {activeTab === 'pollen' ? (
                                <>
                                    <select
                                        value={filters.season}
                                        onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                                    >
                                        <option value="">جميع المواسم</option>
                                        <option value="spring">ربيع</option>
                                        <option value="summer">صيف</option>
                                        <option value="autumn">خريف</option>
                                        <option value="winter">شتاء</option>
                                    </select>

                                    <select
                                        value={filters.trapType}
                                        onChange={(e) => setFilters({ ...filters, trapType: e.target.value })}
                                    >
                                        <option value="">جميع المصائد</option>
                                        {Object.entries(TRAP_TYPES).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                        ))}
                                    </select>
                                </>
                            ) : (
                                <>
                                    <select
                                        value={filters.breed}
                                        onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                                    >
                                        <option value="">جميع السلالات</option>
                                        {Object.entries(BEE_BREEDS).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                        ))}
                                    </select>
                                </>
                            )}

                            <select
                                value={filters.quality}
                                onChange={(e) => setFilters({ ...filters, quality: e.target.value })}
                            >
                                <option value="">جميع درجات الجودة</option>
                                <option value="ممتاز">ممتاز</option>
                                <option value="جيد جداً">جيد جداً</option>
                                <option value="جيد">جيد</option>
                                <option value="مقبول">مقبول</option>
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
                            <button className="btn-primary" onClick={handleAdd}>
                                <span className="icon">➕</span>
                                {activeTab === 'pollen' ? 'إضافة حبوب لقاح' : 'إضافة ملكات'}
                            </button>
                            <button className="btn-secondary" onClick={exportToCSV}>
                                <span className="icon">📊</span>
                                تصدير CSV
                            </button>
                        </div>
                    </div>

                    {/* الإحصائيات السريعة */}
                    {activeTab === 'pollen' && pollenStats && (
                        <div className="quick-stats">
                            <div className="stat-card">
                                <div className="stat-value">{pollenStats.totalCollections}</div>
                                <div className="stat-label">إجمالي الجمعات</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{pollenStats.totalWeight.toFixed(1)} جم</div>
                                <div className="stat-label">إجمالي الوزن</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{pollenStats.averageWeight.toFixed(1)} جم</div>
                                <div className="stat-label">متوسط الوزن</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{pollenStats.profitability.averageMargin.toFixed(1)}%</div>
                                <div className="stat-label">متوسط هامش الربح</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'queens' && queenStats && (
                        <div className="quick-stats">
                            <div className="stat-card">
                                <div className="stat-value">{queenStats.totalCycles}</div>
                                <div className="stat-label">إجمالي الدورات</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{queenStats.totalQueensProduced}</div>
                                <div className="stat-label">الملكات المنتجة</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{queenStats.averageSuccessRate.toFixed(1)}%</div>
                                <div className="stat-label">متوسط معدل النجاح</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{queenStats.profitability.averageMargin.toFixed(1)}%</div>
                                <div className="stat-label">متوسط هامش الربح</div>
                            </div>
                        </div>
                    )}

                    {/* قائمة العناصر */}
                    <div className="items-grid">
                        {activeTab === 'pollen' ? (
                            filteredPollen.length === 0 ? (
                                <EmptyState
                                    type="pollen"
                                    onAdd={handleAdd}
                                />
                            ) : (
                                filteredPollen.map(item => (
                                    <PollenCard
                                        key={item.id}
                                        production={item}
                                        onEdit={() => handleEdit(item)}
                                        onDelete={() => handleDelete(item.id)}
                                        onViewDetails={() => handleViewDetails(item)}
                                    />
                                ))
                            )
                        ) : (
                            filteredQueens.length === 0 ? (
                                <EmptyState
                                    type="queens"
                                    onAdd={handleAdd}
                                />
                            ) : (
                                filteredQueens.map(item => (
                                    <QueenCard
                                        key={item.id}
                                        production={item}
                                        onEdit={() => handleEdit(item)}
                                        onDelete={() => handleDelete(item.id)}
                                        onViewDetails={() => handleViewDetails(item)}
                                    />
                                ))
                            )
                        )}
                    </div>
                </div>
            )}

            {/* النماذج والتفاصيل */}
            {currentView === 'add' && activeTab === 'pollen' && (
                <PollenForm
                    onSave={handleSave}
                    onCancel={() => setCurrentView('list')}
                    apiaryId={apiaryId}
                />
            )}

            {currentView === 'add' && activeTab === 'queens' && (
                <QueenForm
                    onSave={handleSave}
                    onCancel={() => setCurrentView('list')}
                    apiaryId={apiaryId}
                />
            )}

            {currentView === 'edit' && selectedItem && (
                activeTab === 'pollen' ? (
                    <PollenForm
                        production={selectedItem}
                        onSave={handleSave}
                        onCancel={() => setCurrentView('list')}
                        apiaryId={apiaryId}
                    />
                ) : (
                    <QueenForm
                        production={selectedItem}
                        onSave={handleSave}
                        onCancel={() => setCurrentView('list')}
                        apiaryId={apiaryId}
                    />
                )
            )}

            {currentView === 'details' && selectedItem && (
                activeTab === 'pollen' ? (
                    <PollenDetails
                        production={selectedItem}
                        onEdit={() => setCurrentView('edit')}
                        onClose={() => setCurrentView('list')}
                    />
                ) : (
                    <QueenDetails
                        production={selectedItem}
                        onEdit={() => setCurrentView('edit')}
                        onClose={() => setCurrentView('list')}
                    />
                )
            )}
        </div>
    );
};

// مكون الحالة الفارغة
const EmptyState = ({ type, onAdd }) => (
    <div className="empty-state">
        <span className="icon">{type === 'pollen' ? '🌼' : '👑'}</span>
        <h3>لا توجد {type === 'pollen' ? 'حبوب لقاح' : 'ملكات'}</h3>
        <p>ابدأ بإضافة أول {type === 'pollen' ? 'إنتاج حبوب لقاح' : 'دورة إنتاج ملكات'}</p>
        <button className="btn-primary" onClick={onAdd}>
            إضافة {type === 'pollen' ? 'حبوب لقاح' : 'ملكات'} جديدة
        </button>
    </div>
);

// مكون بطاقة حبوب اللقاح
const PollenCard = ({ production, onEdit, onDelete, onViewDetails }) => {
    const profitability = production.calculateProfitability();
    const qualityGrade = production.getQualityGrade();

    return (
        <div className="production-card pollen-card">
            <div className="card-header">
                <div className="batch-info">
                    <h4>{production.batchNumber}</h4>
                    <span className="collection-date">
                        {new Date(production.collectionDate).toLocaleDateString('ar-SA')}
                    </span>
                </div>
                <div className="card-actions">
                    <button className="btn-icon" onClick={onViewDetails} title="عرض التفاصيل">👁️</button>
                    <button className="btn-icon" onClick={onEdit} title="تعديل">✏️</button>
                    <button className="btn-icon delete" onClick={onDelete} title="حذف">🗑️</button>
                </div>
            </div>

            <div className="card-content">
                <div className="production-info">
                    <div className="info-row">
                        <span className="label">الوزن الصافي:</span>
                        <span className="value">{production.netWeight.toFixed(1)} جم</span>
                    </div>
                    <div className="info-row">
                        <span className="label">معدل الجمع:</span>
                        <span className="value">{production.getCollectionRate().toFixed(2)} جم/ساعة</span>
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

// مكون بطاقة الملكات
const QueenCard = ({ production, onEdit, onDelete, onViewDetails }) => {
    const profitability = production.calculateProfitability();
    const qualityGrade = production.getQualityGrade();
    const successRates = production.calculateSuccessRates();

    return (
        <div className="production-card queen-card">
            <div className="card-header">
                <div className="batch-info">
                    <h4>{production.batchNumber}</h4>
                    <span className="start-date">
                        {new Date(production.startDate).toLocaleDateString('ar-SA')}
                    </span>
                </div>
                <div className="card-actions">
                    <button className="btn-icon" onClick={onViewDetails} title="عرض التفاصيل">👁️</button>
                    <button className="btn-icon" onClick={onEdit} title="تعديل">✏️</button>
                    <button className="btn-icon delete" onClick={onDelete} title="حذف">🗑️</button>
                </div>
            </div>

            <div className="card-content">
                <div className="production-info">
                    <div className="info-row">
                        <span className="label">الملكات المنتجة:</span>
                        <span className="value">{production.queensLaying}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">معدل النجاح:</span>
                        <span className="value">{successRates.overall.toFixed(1)}%</span>
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

export default PollenQueenManager;