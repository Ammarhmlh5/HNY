import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    Plus,
    Edit,
    Trash2,
    Bell,
    Repeat,
    Target,
    Filter
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedingSchedule = ({ onScheduleUpdate, className }) => {
    const [schedules, setSchedules] = useState([]);
    const [upcomingFeedings, setUpcomingFeedings] = useState([]);
    const [overdueFeedings, setOverdueFeedings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewSchedule, setShowNewSchedule] = useState(false);
    const [selectedHive, setSelectedHive] = useState('');
    const [hives, setHives] = useState([]);
    const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming', 'overdue', 'all'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [hivesRes, upcomingRes, overdueRes] = await Promise.all([
                axios.get('/api/hives'),
                axios.get('/api/feeding/upcoming/list'),
                axios.get('/api/feeding/overdue/list')
            ]);

            setHives(hivesRes.data.data.hives || []);
            setUpcomingFeedings(upcomingRes.data.data || []);
            setOverdueFeedings(overdueRes.data.data || []);
        } catch (error) {
            toast.error('خطأ في تحميل جدولة التغذية');
            console.error('Error loading schedule data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSchedule = async (hiveData, feedingType, duration = 30) => {
        try {
            const response = await axios.post('/api/feeding/schedule', {
                hive_data: hiveData,
                feeding_type: feedingType,
                duration: duration
            });

            return response.data.data;
        } catch (error) {
            toast.error('خطأ في إنشاء الجدولة');
            throw error;
        }
    };

    const createScheduledFeeding = async (scheduleItem, hiveId) => {
        try {
            const calculation = await axios.post('/api/feeding/calculate', {
                hive_data: getHiveData(hiveId),
                feeding_type: scheduleItem.feeding_type
            });

            const feedingData = {
                hive_id: hiveId,
                feeding_type: scheduleItem.feeding_type,
                feeding_date: scheduleItem.date,
                ingredients: calculation.data.data.amounts,
                total_cost: calculation.data.data.total_cost * scheduleItem.amount_multiplier,
                feeding_method: 'top_feeder',
                status: 'planned',
                notes: scheduleItem.notes || 'تغذية مجدولة تلقائياً'
            };

            await axios.post('/api/feeding', feedingData);
            toast.success('تم إنشاء التغذية المجدولة');

            if (onScheduleUpdate) {
                onScheduleUpdate();
            }

            loadData();
        } catch (error) {
            toast.error('خطأ في إنشاء التغذية المجدولة');
        }
    };

    const getHiveData = (hiveId) => {
        const hive = hives.find(h => h.id === parseInt(hiveId));
        return {
            population_strength: hive?.population_strength || 'moderate',
            food_stores: hive?.food_stores || 'adequate',
            brood_pattern: hive?.brood_pattern || 'good',
            hive_type: hive?.hive_type || 'langstroth'
        };
    };

    const markFeedingComplete = async (feedingId) => {
        try {
            await axios.patch(`/api/feeding/${feedingId}/complete`, {
                amount_consumed: null, // Will be filled by user later
                consumption_rate: 'moderate',
                bee_response: 'positive',
                effectiveness: 8
            });

            toast.success('تم تحديد التغذية كمكتملة');
            loadData();
        } catch (error) {
            toast.error('خطأ في تحديث حالة التغذية');
        }
    };

    const deleteFeedingSchedule = async (feedingId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه التغذية المجدولة؟')) {
            return;
        }

        try {
            await axios.delete(`/api/feeding/${feedingId}`);
            toast.success('تم حذف التغذية المجدولة');
            loadData();
        } catch (error) {
            toast.error('خطأ في حذف التغذية المجدولة');
        }
    };

    const getDaysUntilFeeding = (feedingDate) => {
        const now = new Date();
        const feeding = new Date(feedingDate);
        const diffTime = feeding - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getCurrentFeedings = () => {
        switch (viewMode) {
            case 'upcoming':
                return upcomingFeedings;
            case 'overdue':
                return overdueFeedings;
            case 'all':
                return [...upcomingFeedings, ...overdueFeedings].sort((a, b) =>
                    new Date(a.next_feeding_date || a.feeding_date) - new Date(b.next_feeding_date || b.feeding_date)
                );
            default:
                return upcomingFeedings;
        }
    };

    if (loading) {
        return (
            <div className={clsx('space-y-4', className)}>
                <div className="animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="space-y-3">
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
        <div className={clsx('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">جدولة التغذية</h2>
                    <p className="text-gray-600">إدارة وتخطيط مواعيد التغذية</p>
                </div>

                <button
                    onClick={() => setShowNewSchedule(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4 ml-2" />
                    جدولة جديدة
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <div className="text-3xl font-bold text-warning-600 mb-2">
                        {upcomingFeedings.length}
                    </div>
                    <div className="text-gray-600">تغذيات قادمة</div>
                    <div className="text-sm text-gray-500 mt-1">الأسبوع القادم</div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-danger-600 mb-2">
                        {overdueFeedings.length}
                    </div>
                    <div className="text-gray-600">تغذيات متأخرة</div>
                    <div className="text-sm text-gray-500 mt-1">تحتاج انتباه</div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-success-600 mb-2">
                        {hives.length}
                    </div>
                    <div className="text-gray-600">إجمالي الخلايا</div>
                    <div className="text-sm text-gray-500 mt-1">تحت المراقبة</div>
                </div>
            </div>

            {/* Overdue Alert */}
            {overdueFeedings.length > 0 && (
                <div className="card bg-danger-50 border-danger-200">
                    <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-danger-600 mt-0.5 ml-3 flex-shrink-0" />
                        <div>
                            <h3 className="font-medium text-danger-900 mb-2">
                                تنبيه: {overdueFeedings.length} تغذية متأخرة
                            </h3>
                            <p className="text-danger-800 text-sm mb-3">
                                هناك تغذيات مجدولة تأخرت عن موعدها وتحتاج انتباه فوري
                            </p>
                            <button
                                onClick={() => setViewMode('overdue')}
                                className="btn-danger btn-sm"
                            >
                                عرض التغذيات المتأخرة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'upcoming', label: 'القادمة', count: upcomingFeedings.length },
                    { key: 'overdue', label: 'المتأخرة', count: overdueFeedings.length },
                    { key: 'all', label: 'الكل', count: upcomingFeedings.length + overdueFeedings.length }
                ].map((mode) => (
                    <button
                        key={mode.key}
                        onClick={() => setViewMode(mode.key)}
                        className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            viewMode === mode.key
                                ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                    >
                        {mode.label} ({mode.count})
                    </button>
                ))}
            </div>

            {/* Feeding Schedule List */}
            <div className="space-y-4">
                {getCurrentFeedings().length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {viewMode === 'upcoming' ? 'لا توجد تغذيات قادمة' :
                                viewMode === 'overdue' ? 'لا توجد تغذيات متأخرة' :
                                    'لا توجد تغذيات مجدولة'}
                        </h3>
                        <p className="text-gray-600">
                            {viewMode === 'upcoming' ? 'جميع التغذيات محدثة' :
                                viewMode === 'overdue' ? 'جميع التغذيات في الوقت المحدد' :
                                    'لم يتم جدولة أي تغذيات بعد'}
                        </p>
                    </div>
                ) : (
                    getCurrentFeedings().map((feeding) => {
                        const feedingDate = new Date(feeding.next_feeding_date || feeding.feeding_date);
                        const daysUntil = getDaysUntilFeeding(feedingDate);
                        const isOverdue = daysUntil < 0;
                        const isToday = daysUntil === 0;
                        const isSoon = daysUntil <= 2 && daysUntil > 0;

                        return (
                            <div
                                key={feeding.id}
                                className={clsx(
                                    'card transition-all duration-200',
                                    isOverdue && 'border-danger-300 bg-danger-50',
                                    isToday && 'border-warning-300 bg-warning-50',
                                    isSoon && 'border-info-300 bg-info-50'
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Type Icon */}
                                        <div className="text-3xl flex-shrink-0">
                                            {getFeedingTypeIcon(feeding.feeding_type)}
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {getFeedingTypeLabel(feeding.feeding_type)}
                                                </h3>

                                                {isOverdue && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-100 text-danger-800">
                                                        متأخر {Math.abs(daysUntil)} يوم
                                                    </span>
                                                )}

                                                {isToday && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-800">
                                                        اليوم
                                                    </span>
                                                )}

                                                {isSoon && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-info-100 text-info-800">
                                                        خلال {daysUntil} يوم
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 ml-1" />
                                                    {formatDate(feedingDate)}
                                                </div>

                                                <div className="flex items-center">
                                                    <span className="w-4 h-4 ml-1">🏠</span>
                                                    {feeding.hive?.name || 'خلية غير محددة'}
                                                </div>

                                                <div className="flex items-center">
                                                    <Target className="w-4 h-4 ml-1" />
                                                    {feeding.total_cost} ريال
                                                </div>
                                            </div>

                                            {feeding.notes && (
                                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">
                                                    {feeding.notes}
                                                </p>
                                            )}

                                            {/* Progress indicator for recurring feedings */}
                                            {feeding.batch_id && (
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Repeat className="w-3 h-3 ml-1" />
                                                    جزء من برنامج تغذية متكرر
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {feeding.status === 'planned' && (
                                            <button
                                                onClick={() => markFeedingComplete(feeding.id)}
                                                className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                                                title="تحديد كمكتمل"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {/* Edit functionality */ }}
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => deleteFeedingSchedule(feeding.id)}
                                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* New Schedule Modal */}
            {showNewSchedule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    جدولة تغذية جديدة
                                </h3>
                                <button
                                    onClick={() => setShowNewSchedule(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="form-label">اختر الخلية</label>
                                    <select
                                        value={selectedHive}
                                        onChange={(e) => setSelectedHive(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">اختر خلية</option>
                                        {hives.map((hive) => (
                                            <option key={hive.id} value={hive.id}>
                                                {hive.name} - {hive.apiary?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (selectedHive) {
                                                // Generate automatic schedule
                                                generateSchedule(
                                                    getHiveData(selectedHive),
                                                    'sugar_syrup',
                                                    30
                                                ).then(schedule => {
                                                    // Create feeding records for each schedule item
                                                    schedule.forEach(item => {
                                                        createScheduledFeeding(item, selectedHive);
                                                    });
                                                    setShowNewSchedule(false);
                                                });
                                            }
                                        }}
                                        disabled={!selectedHive}
                                        className="btn-primary flex-1 disabled:opacity-50"
                                    >
                                        إنشاء جدولة تلقائية
                                    </button>

                                    <button
                                        onClick={() => setShowNewSchedule(false)}
                                        className="btn-outline flex-1"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedingSchedule;