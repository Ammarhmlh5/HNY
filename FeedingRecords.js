import React, { useState, useEffect } from 'react';
import {
    Droplets,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Edit,
    Trash2,
    Eye,
    Filter,
    Plus,
    CheckCircle,
    Clock,
    AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedingRecords = ({ onRecordUpdate, className }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0
    });

    const [filters, setFilters] = useState({
        feeding_type: '',
        status: '',
        hive_id: '',
        date_from: '',
        date_to: ''
    });

    useEffect(() => {
        loadRecords();
    }, [filters, pagination.page]);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            });

            const response = await axios.get(`/api/feeding?${params}`);
            setRecords(response.data.data.feedings);
            setPagination(prev => ({
                ...prev,
                ...response.data.data.pagination
            }));
        } catch (error) {
            toast.error('خطأ في تحميل سجلات التغذية');
            console.error('Error loading feeding records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (recordId, newStatus, additionalData = {}) => {
        try {
            const updateData = {
                status: newStatus,
                ...additionalData
            };

            await axios.put(`/api/feeding/${recordId}`, updateData);

            setRecords(prev => prev.map(record =>
                record.id === recordId
                    ? { ...record, ...updateData }
                    : record
            ));

            toast.success('تم تحديث حالة التغذية');

            if (onRecordUpdate) {
                onRecordUpdate();
            }
        } catch (error) {
            toast.error('خطأ في تحديث حالة التغذية');
        }
    };

    const handleDelete = async (recordId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            return;
        }

        try {
            await axios.delete(`/api/feeding/${recordId}`);
            setRecords(prev => prev.filter(record => record.id !== recordId));
            toast.success('تم حذف السجل');

            if (onRecordUpdate) {
                onRecordUpdate();
            }
        } catch (error) {
            toast.error('خطأ في حذف السجل');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            planned: 'warning',
            completed: 'success',
            partially_consumed: 'info',
            rejected: 'danger',
            cancelled: 'gray'
        };
        return colors[status] || 'gray';
    };

    const getStatusLabel = (status) => {
        const labels = {
            planned: 'مخطط',
            completed: 'مكتمل',
            partially_consumed: 'مستهلك جزئياً',
            rejected: 'مرفوض',
            cancelled: 'ملغي'
        };
        return labels[status] || status;
    };

    const getFeedingTypeLabel = (type) => {
        const labels = {
            sugar_syrup: 'محلول سكري',
            honey_syrup: 'محلول عسل',
            pollen_patty: 'عجينة حبوب لقاح',
            protein_patty: 'عجينة بروتين',
            emergency_feeding: 'تغذية طارئة',
            winter_feeding: 'تغذية شتوية',
            stimulative_feeding: 'تغذية محفزة',
            maintenance_feeding: 'تغذية صيانة'
        };
        return labels[type] || type;
    };

    const getFeedingTypeIcon = (type) => {
        const icons = {
            sugar_syrup: '🍯',
            honey_syrup: '🐝',
            pollen_patty: '🌼',
            protein_patty: '🥜',
            emergency_feeding: '🚨',
            winter_feeding: '❄️',
            stimulative_feeding: '⚡',
            maintenance_feeding: '🔧'
        };
        return icons[type] || '🍯';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={clsx('space-y-4', className)}>
                <div className="animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={clsx('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">سجل التغذية</h2>
                    <p className="text-gray-600">تتبع وإدارة جميع عمليات التغذية</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            'btn-outline btn-sm',
                            showFilters && 'bg-primary-50 border-primary-300'
                        )}
                    >
                        <Filter className="w-4 h-4 ml-1" />
                        فلترة
                    </button>

                    <button
                        onClick={() => {/* Navigate to new feeding */ }}
                        className="btn-primary btn-sm"
                    >
                        <Plus className="w-4 h-4 ml-1" />
                        تغذية جديدة
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="card bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="form-label">نوع التغذية</label>
                            <select
                                value={filters.feeding_type}
                                onChange={(e) => setFilters(prev => ({ ...prev, feeding_type: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">جميع الأنواع</option>
                                <option value="sugar_syrup">محلول سكري</option>
                                <option value="pollen_patty">عجينة حبوب لقاح</option>
                                <option value="protein_patty">عجينة بروتين</option>
                                <option value="emergency_feeding">تغذية طارئة</option>
                                <option value="winter_feeding">تغذية شتوية</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">الحالة</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">جميع الحالات</option>
                                <option value="planned">مخطط</option>
                                <option value="completed">مكتمل</option>
                                <option value="partially_consumed">مستهلك جزئياً</option>
                                <option value="rejected">مرفوض</option>
                                <option value="cancelled">ملغي</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">من تاريخ</label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="form-label">إلى تاريخ</label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                                className="form-input"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({
                                    feeding_type: '',
                                    status: '',
                                    hive_id: '',
                                    date_from: '',
                                    date_to: ''
                                })}
                                className="btn-outline btn-sm w-full"
                            >
                                إعادة تعيين
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Records List */}
            <div className="space-y-4">
                {records.length === 0 ? (
                    <div className="text-center py-12">
                        <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            لا توجد سجلات تغذية
                        </h3>
                        <p className="text-gray-600">
                            لم يتم العثور على سجلات تطابق المعايير المحددة
                        </p>
                    </div>
                ) : (
                    records.map((record) => {
                        const statusColor = getStatusColor(record.status);

                        return (
                            <div key={record.id} className="card hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Type Icon */}
                                        <div className="text-3xl flex-shrink-0">
                                            {getFeedingTypeIcon(record.feeding_type)}
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {getFeedingTypeLabel(record.feeding_type)}
                                                </h3>

                                                <span className={clsx(
                                                    'px-2 py-1 text-xs font-medium rounded-full',
                                                    `bg-${statusColor}-100 text-${statusColor}-800`
                                                )}>
                                                    {getStatusLabel(record.status)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 ml-1" />
                                                    {formatDate(record.feeding_date)}
                                                </div>

                                                <div className="flex items-center">
                                                    <DollarSign className="w-4 h-4 ml-1" />
                                                    {record.total_cost} ريال
                                                </div>

                                                {record.hive && (
                                                    <div className="flex items-center">
                                                        <span className="w-4 h-4 ml-1">🏠</span>
                                                        {record.hive.name}
                                                    </div>
                                                )}

                                                {record.effectiveness && (
                                                    <div className="flex items-center">
                                                        <TrendingUp className="w-4 h-4 ml-1" />
                                                        فعالية {record.effectiveness}/10
                                                    </div>
                                                )}
                                            </div>

                                            {/* Ingredients */}
                                            {record.ingredients && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {Object.entries(record.ingredients).map(([ingredient, amount]) => (
                                                        <span
                                                            key={ingredient}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                        >
                                                            {ingredient}: {amount}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {record.notes && (
                                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                    {record.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {record.status === 'planned' && (
                                            <button
                                                onClick={() => handleStatusUpdate(record.id, 'completed', {
                                                    feeding_date: new Date().toISOString()
                                                })}
                                                className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                                                title="تحديد كمكتمل"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setSelectedRecord(record)}
                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                            title="عرض التفاصيل"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => {/* Edit functionality */ }}
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar for Consumption */}
                                {record.total_amount && record.amount_consumed && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                            <span>معدل الاستهلاك</span>
                                            <span>
                                                {record.amount_consumed} / {record.total_amount}
                                                ({Math.round((record.amount_consumed / record.total_amount) * 100)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-success-500 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min((record.amount_consumed / record.total_amount) * 100, 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="btn-outline btn-sm disabled:opacity-50"
                        >
                            السابق
                        </button>

                        <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                            {pagination.page} من {pagination.total_pages}
                        </span>

                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.total_pages}
                            className="btn-outline btn-sm disabled:opacity-50"
                        >
                            التالي
                        </button>
                    </div>
                </div>
            )}

            {/* Record Details Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    تفاصيل التغذية
                                </h3>
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">نوع التغذية</label>
                                        <p className="text-gray-900">{getFeedingTypeLabel(selectedRecord.feeding_type)}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">الحالة</label>
                                        <p className="text-gray-900">{getStatusLabel(selectedRecord.status)}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">تاريخ التغذية</label>
                                        <p className="text-gray-900">{formatDate(selectedRecord.feeding_date)}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">التكلفة</label>
                                        <p className="text-gray-900">{selectedRecord.total_cost} ريال</p>
                                    </div>
                                </div>

                                {selectedRecord.ingredients && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">المكونات</label>
                                        <div className="mt-1 space-y-1">
                                            {Object.entries(selectedRecord.ingredients).map(([ingredient, amount]) => (
                                                <div key={ingredient} className="flex justify-between text-sm">
                                                    <span className="capitalize">{ingredient.replace('_', ' ')}</span>
                                                    <span>{amount}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRecord.notes && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                                        <p className="text-gray-900 text-sm">{selectedRecord.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedingRecords;