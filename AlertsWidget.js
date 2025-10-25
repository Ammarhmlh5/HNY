import React, { useState, useEffect } from 'react';
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    ArrowRight,
    Filter,
    Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import axios from 'axios';

const AlertsWidget = ({ className }) => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        unresolved: 0,
        high_priority: 0,
        by_type: {}
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('unread'); // 'all', 'unread', 'high_priority'

    useEffect(() => {
        loadAlerts();
        loadStats();
    }, [filter]);

    const loadAlerts = async () => {
        try {
            const params = new URLSearchParams({
                limit: 5,
                sort_by: 'created_at',
                sort_order: 'DESC'
            });

            if (filter === 'unread') {
                params.append('is_read', 'false');
            } else if (filter === 'high_priority') {
                params.append('priority', 'high');
                params.append('is_resolved', 'false');
            }

            const response = await axios.get(`/api/alerts?${params}`);
            setAlerts(response.data.data.alerts);
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    };

    const loadStats = async () => {
        try {
            const response = await axios.get('/api/alerts/stats/summary');
            setStats(response.data.data);
        } catch (error) {
            console.error('Error loading alert stats:', error);
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

        // Navigate to appropriate page based on alert type
        if (alert.hive_id) {
            navigate(`/hives/${alert.hive_id}`);
        } else if (alert.apiary_id) {
            navigate(`/apiaries/${alert.apiary_id}`);
        } else {
            navigate('/alerts');
        }
    };

    const getAlertIcon = (type) => {
        const icons = {
            inspection_reminder: Clock,
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

        return `منذ ${Math.floor(diffInDays / 7)} أسبوع`;
    };

    const getFilterLabel = (filterType) => {
        const labels = {
            all: 'جميع التنبيهات',
            unread: 'غير مقروءة',
            high_priority: 'عالية الأولوية'
        };
        return labels[filterType] || filterType;
    };

    if (loading) {
        return (
            <div className={clsx('card', className)}>
                <div className="animate-pulse space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-8 bg-gray-300 rounded w-20"></div>
                    </div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 space-x-reverse">
                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={clsx('card', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center ml-3">
                        <Bell className="w-5 h-5 text-warning-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">التنبيهات</h3>
                        <p className="text-sm text-gray-600">
                            {stats.unresolved} غير محلول من {stats.total}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/alerts')}
                    className="btn-outline btn-sm"
                >
                    عرض الكل
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">إجمالي</div>
                </div>

                <div className="text-center p-3 bg-danger-50 rounded-lg">
                    <div className="text-2xl font-bold text-danger-600">{stats.by_priority?.high || 0}</div>
                    <div className="text-sm text-gray-600">عالية الأولوية</div>
                </div>

                <div className="text-center p-3 bg-warning-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning-600">{stats.unresolved}</div>
                    <div className="text-sm text-gray-600">غير محلول</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {['unread', 'high_priority', 'all'].map((filterType) => (
                    <button
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={clsx(
                            'px-3 py-1 text-sm font-medium rounded-full transition-colors',
                            filter === filterType
                                ? 'bg-primary-100 text-primary-800'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                    >
                        {getFilterLabel(filterType)}
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-2">
                            {filter === 'unread' ? 'جميع التنبيهات مقروءة!' :
                                filter === 'high_priority' ? 'لا توجد تنبيهات عالية الأولوية' :
                                    'لا توجد تنبيهات'}
                        </h4>
                        <p className="text-sm text-gray-600">
                            {filter === 'unread' ? 'لقد قرأت جميع التنبيهات الحديثة' :
                                filter === 'high_priority' ? 'جميع المشاكل الحرجة تم حلها' :
                                    'لم يتم إنشاء أي تنبيهات بعد'}
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
                                    'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50',
                                    !alert.is_read && 'bg-primary-50 border border-primary-200'
                                )}
                            >
                                {/* Alert Icon */}
                                <div className={clsx(
                                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                    `bg-${priorityColor}-100`
                                )}>
                                    <Icon className={clsx('w-4 h-4', `text-${priorityColor}-600`)} />
                                </div>

                                {/* Alert Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className={clsx(
                                                'text-sm font-medium mb-1',
                                                !alert.is_read ? 'text-gray-900' : 'text-gray-700'
                                            )}>
                                                {alert.title}
                                            </h4>

                                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                {alert.message}
                                            </p>

                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>{formatTimeAgo(alert.created_at)}</span>

                                                {alert.hive && (
                                                    <span>• {alert.hive.name}</span>
                                                )}

                                                <span className={clsx(
                                                    'px-2 py-0.5 rounded-full font-medium',
                                                    `bg-${priorityColor}-100 text-${priorityColor}-700`
                                                )}>
                                                    {alert.priority === 'high' ? 'عالية' :
                                                        alert.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                                </span>
                                            </div>
                                        </div>

                                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Actions */}
            {alerts.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/alerts')}
                            className="btn-outline btn-sm"
                        >
                            إدارة التنبيهات
                        </button>

                        <button
                            onClick={() => navigate('/alerts/settings')}
                            className="btn-outline btn-sm"
                        >
                            إعدادات الإشعارات
                        </button>
                    </div>
                </div>
            )}

            {/* Type Distribution */}
            {Object.keys(stats.by_type).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">توزيع التنبيهات</h4>
                    <div className="space-y-2">
                        {Object.entries(stats.by_type).slice(0, 3).map(([type, count]) => {
                            const typeLabels = {
                                inspection_reminder: 'تذكير فحص',
                                health_issue: 'مشاكل صحية',
                                feeding_required: 'تغذية مطلوبة',
                                seasonal_task: 'مهام موسمية'
                            };

                            return (
                                <div key={type} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        {typeLabels[type] || type}
                                    </span>
                                    <span className="font-medium text-gray-900">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsWidget;