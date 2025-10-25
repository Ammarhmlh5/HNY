import React, { useState, useEffect } from 'react';
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    EyeOff,
    Trash2,
    Filter,
    MoreVertical,
    Calendar,
    MapPin,
    Zap
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const AlertsList = ({ filters = {}, onAlertClick }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0
    });

    const [activeFilters, setActiveFilters] = useState({
        type: '',
        priority: '',
        is_read: '',
        is_resolved: '',
        ...filters
    });

    useEffect(() => {
        loadAlerts();
    }, [activeFilters, pagination.page]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(activeFilters).filter(([_, value]) => value !== '')
                )
            });

            const response = await axios.get(`/api/alerts?${params}`);
            setAlerts(response.data.data.alerts);
            setPagination(prev => ({
                ...prev,
                ...response.data.data.pagination
            }));
        } catch (error) {
            toast.error('خطأ في تحميل التنبيهات');
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAlertClick = async (alert) => {
        // Mark as read if not already read
        if (!alert.is_read) {
            try {
                await axios.patch(`/api/alerts/${alert.id}/read`);
                setAlerts(prev => prev.map(a =>
                    a.id === alert.id ? { ...a, is_read: true } : a
                ));
            } catch (error) {
                console.error('Error marking alert as read:', error);
            }
        }

        if (onAlertClick) {
            onAlertClick(alert);
        }
    };

    const handleResolveAlert = async (alertId, event) => {
        event.stopPropagation();

        try {
            await axios.patch(`/api/alerts/${alertId}/resolve`);
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, is_resolved: true, resolved_at: new Date() } : a
            ));
            toast.success('تم حل التنبيه');
        } catch (error) {
            toast.error('خطأ في حل التنبيه');
        }
    };

    const handleDeleteAlert = async (alertId, event) => {
        event.stopPropagation();

        if (!window.confirm('هل أنت متأكد من حذف هذا التنبيه؟')) {
            return;
        }

        try {
            await axios.delete(`/api/alerts/${alertId}`);
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            toast.success('تم حذف التنبيه');
        } catch (error) {
            toast.error('خطأ في حذف التنبيه');
        }
    };

    const handleBulkMarkAsRead = async () => {
        if (selectedAlerts.length === 0) return;

        try {
            await axios.post('/api/alerts/bulk/read', {
                alert_ids: selectedAlerts
            });

            setAlerts(prev => prev.map(a =>
                selectedAlerts.includes(a.id) ? { ...a, is_read: true } : a
            ));
            setSelectedAlerts([]);
            toast.success(`تم تحديد ${selectedAlerts.length} تنبيه كمقروء`);
        } catch (error) {
            toast.error('خطأ في تحديث التنبيهات');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedAlerts.length === 0) return;

        if (!window.confirm(`هل أنت متأكد من حذف ${selectedAlerts.length} تنبيه؟`)) {
            return;
        }

        try {
            await axios.delete('/api/alerts/bulk', {
                data: { alert_ids: selectedAlerts }
            });

            setAlerts(prev => prev.filter(a => !selectedAlerts.includes(a.id)));
            setSelectedAlerts([]);
            toast.success(`تم حذف ${selectedAlerts.length} تنبيه`);
        } catch (error) {
            toast.error('خطأ في حذف التنبيهات');
        }
    };

    const toggleAlertSelection = (alertId) => {
        setSelectedAlerts(prev =>
            prev.includes(alertId)
                ? prev.filter(id => id !== alertId)
                : [...prev, alertId]
        );
    };

    const selectAllAlerts = () => {
        if (selectedAlerts.length === alerts.length) {
            setSelectedAlerts([]);
        } else {
            setSelectedAlerts(alerts.map(a => a.id));
        }
    };

    const getAlertIcon = (type) => {
        const icons = {
            inspection_reminder: Calendar,
            health_issue: AlertTriangle,
            feeding_required: Zap,
            seasonal_task: Clock,
            weather_warning: AlertTriangle,
            equipment_maintenance: Clock,
            harvest_ready: CheckCircle,
            queen_replacement: AlertTriangle,
            swarm_alert: Zap,
            disease_warning: AlertTriangle,
            custom: Bell
        };
        return icons[type] || Bell;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'danger',
            medium: 'warning',
            low: 'gray'
        };
        return colors[priority] || 'gray';
    };

    const getTypeLabel = (type) => {
        const labels = {
            inspection_reminder: 'تذكير فحص',
            health_issue: 'مشكلة صحية',
            feeding_required: 'تغذية مطلوبة',
            seasonal_task: 'مهمة موسمية',
            weather_warning: 'تحذير جوي',
            equipment_maintenance: 'صيانة معدات',
            harvest_ready: 'جاهز للقطف',
            queen_replacement: 'استبدال ملكة',
            swarm_alert: 'تنبيه تطريد',
            disease_warning: 'تحذير مرض',
            custom: 'مخصص'
        };
        return labels[type] || type;
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const alertDate = new Date(date);
        const diffInMinutes = Math.floor((now - alertDate) / (1000 * 60));

        if (diffInMinutes < 1) return 'الآن';
        if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `منذ ${diffInDays} يوم`;

        const diffInWeeks = Math.floor(diffInDays / 7);
        return `منذ ${diffInWeeks} أسبوع`;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="card animate-pulse">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with filters and bulk actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                        التنبيهات ({pagination.total})
                    </h2>

                    {selectedAlerts.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {selectedAlerts.length} محدد
                            </span>
                            <button
                                onClick={handleBulkMarkAsRead}
                                className="btn-outline btn-sm"
                            >
                                <Eye className="w-4 h-4 ml-1" />
                                تحديد كمقروء
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="btn-outline btn-sm text-danger-600 border-danger-300 hover:bg-danger-50"
                            >
                                <Trash2 className="w-4 h-4 ml-1" />
                                حذف
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
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
                        onClick={loadAlerts}
                        className="btn-outline btn-sm"
                    >
                        تحديث
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="card bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="form-label">النوع</label>
                            <select
                                value={activeFilters.type}
                                onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">جميع الأنواع</option>
                                <option value="inspection_reminder">تذكير فحص</option>
                                <option value="health_issue">مشكلة صحية</option>
                                <option value="feeding_required">تغذية مطلوبة</option>
                                <option value="seasonal_task">مهمة موسمية</option>
                                <option value="weather_warning">تحذير جوي</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">الأولوية</label>
                            <select
                                value={activeFilters.priority}
                                onChange={(e) => setActiveFilters(prev => ({ ...prev, priority: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">جميع الأولويات</option>
                                <option value="high">عالية</option>
                                <option value="medium">متوسطة</option>
                                <option value="low">منخفضة</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">الحالة</label>
                            <select
                                value={activeFilters.is_read}
                                onChange={(e) => setActiveFilters(prev => ({ ...prev, is_read: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">جميع الحالات</option>
                                <option value="false">غير مقروء</option>
                                <option value="true">مقروء</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">الحل</label>
                            <select
                                value={activeFilters.is_resolved}
                                onChange={(e) => setActiveFilters(prev => ({ ...prev, is_resolved: e.target.value }))}
                                className="form-select"
                            >
                                <option value="">جميع الحالات</option>
                                <option value="false">غير محلول</option>
                                <option value="true">محلول</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Select all checkbox */}
            {alerts.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <input
                        type="checkbox"
                        checked={selectedAlerts.length === alerts.length}
                        onChange={selectAllAlerts}
                        className="form-checkbox"
                    />
                    <span className="text-sm text-gray-600">
                        تحديد الكل ({alerts.length})
                    </span>
                </div>
            )}

            {/* Alerts list */}
            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            لا توجد تنبيهات
                        </h3>
                        <p className="text-gray-600">
                            لم يتم العثور على تنبيهات تطابق المعايير المحددة
                        </p>
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const Icon = getAlertIcon(alert.type);
                        const priorityColor = getPriorityColor(alert.priority);

                        return (
                            <div
                                key={alert.id}
                                onClick={() => handleAlertClick(alert)}
                                className={clsx(
                                    'card cursor-pointer transition-all duration-200 hover:shadow-md',
                                    !alert.is_read && 'border-r-4 border-primary-500 bg-primary-50',
                                    alert.is_resolved && 'opacity-60'
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Selection checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedAlerts.includes(alert.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleAlertSelection(alert.id);
                                        }}
                                        className="form-checkbox mt-1"
                                    />

                                    {/* Alert icon */}
                                    <div className={clsx(
                                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                        `bg-${priorityColor}-100`
                                    )}>
                                        <Icon className={clsx('w-5 h-5', `text-${priorityColor}-600`)} />
                                    </div>

                                    {/* Alert content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={clsx(
                                                        'font-medium',
                                                        !alert.is_read ? 'text-gray-900' : 'text-gray-700'
                                                    )}>
                                                        {alert.title}
                                                    </h3>

                                                    <span className={clsx(
                                                        'px-2 py-1 text-xs font-medium rounded-full',
                                                        `bg-${priorityColor}-100 text-${priorityColor}-800`
                                                    )}>
                                                        {getTypeLabel(alert.type)}
                                                    </span>

                                                    {alert.is_resolved && (
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                                                            محلول
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-gray-600 text-sm mb-2">
                                                    {alert.message}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <Clock className="w-3 h-3 ml-1" />
                                                        {formatTimeAgo(alert.created_at)}
                                                    </span>

                                                    {alert.hive && (
                                                        <span className="flex items-center">
                                                            <MapPin className="w-3 h-3 ml-1" />
                                                            {alert.hive.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                {!alert.is_resolved && (
                                                    <button
                                                        onClick={(e) => handleResolveAlert(alert.id, e)}
                                                        className="p-1 text-gray-400 hover:text-success-600 transition-colors"
                                                        title="حل التنبيه"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={(e) => handleDeleteAlert(alert.id, e)}
                                                    className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                                                    title="حذف التنبيه"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
        </div>
    );
};

export default AlertsList;