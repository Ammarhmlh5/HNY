import React, { useState } from 'react';
import {
    Zap,
    Clock,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuickInspectionWidget from '../Inspection/QuickInspectionWidget';
import clsx from 'clsx';

const QuickInspectionCard = ({ hives, className }) => {
    const navigate = useNavigate();
    const [selectedHive, setSelectedHive] = useState(null);
    const [showWidget, setShowWidget] = useState(false);

    // Get hives that need inspection (last inspection > 2 weeks ago or never inspected)
    const hivesNeedingInspection = hives.filter(hive => {
        if (!hive.last_inspection_date) return true;

        const lastInspection = new Date(hive.last_inspection_date);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        return lastInspection < twoWeeksAgo;
    });

    // Get recent inspections for quick stats
    const recentInspections = hives
        .filter(hive => hive.last_inspection_date)
        .map(hive => ({
            ...hive,
            daysSinceInspection: Math.floor(
                (new Date() - new Date(hive.last_inspection_date)) / (1000 * 60 * 60 * 24)
            )
        }))
        .sort((a, b) => a.daysSinceInspection - b.daysSinceInspection);

    const handleStartQuickInspection = (hive) => {
        setSelectedHive(hive);
        setShowWidget(true);
    };

    const handleCompleteInspection = (result) => {
        setShowWidget(false);
        setSelectedHive(null);

        // Navigate to results or refresh data
        // In a real app, you might want to show results or refresh the hive list
        console.log('Inspection completed:', result);
    };

    const getStatusColor = (daysSince) => {
        if (daysSince <= 7) return 'success';
        if (daysSince <= 14) return 'warning';
        if (daysSince <= 21) return 'orange';
        return 'danger';
    };

    if (showWidget && selectedHive) {
        return (
            <div className={clsx('card', className)}>
                <div className="mb-4">
                    <button
                        onClick={() => setShowWidget(false)}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <ArrowRight className="w-4 h-4 ml-1" />
                        العودة للقائمة
                    </button>
                </div>

                <QuickInspectionWidget
                    hive={selectedHive}
                    onComplete={handleCompleteInspection}
                />
            </div>
        );
    }

    return (
        <div className={clsx('card', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center ml-3">
                        <Zap className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">الفحص السريع</h3>
                        <p className="text-sm text-gray-600">فحص سريع بالأسئلة الخمسة الأساسية</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/inspections/quick')}
                    className="btn-outline btn-sm"
                >
                    عرض الكل
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{hives.length}</div>
                    <div className="text-sm text-gray-600">إجمالي الخلايا</div>
                </div>

                <div className="text-center p-3 bg-warning-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning-600">{hivesNeedingInspection.length}</div>
                    <div className="text-sm text-gray-600">تحتاج فحص</div>
                </div>

                <div className="text-center p-3 bg-success-50 rounded-lg">
                    <div className="text-2xl font-bold text-success-600">
                        {Math.round((recentInspections.length / hives.length) * 100) || 0}%
                    </div>
                    <div className="text-sm text-gray-600">مُفحوصة حديثاً</div>
                </div>
            </div>

            {/* Hives Needing Inspection */}
            {hivesNeedingInspection.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">خلايا تحتاج فحص</h4>
                        <span className="text-sm text-gray-500">
                            {hivesNeedingInspection.length} خلية
                        </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {hivesNeedingInspection.slice(0, 5).map((hive) => {
                            const daysSinceInspection = hive.last_inspection_date
                                ? Math.floor((new Date() - new Date(hive.last_inspection_date)) / (1000 * 60 * 60 * 24))
                                : null;

                            return (
                                <div
                                    key={hive.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <div className={clsx(
                                            'w-3 h-3 rounded-full ml-3',
                                            daysSinceInspection === null ? 'bg-gray-400' :
                                                daysSinceInspection > 21 ? 'bg-danger-500' :
                                                    daysSinceInspection > 14 ? 'bg-warning-500' :
                                                        'bg-success-500'
                                        )} />

                                        <div>
                                            <div className="font-medium text-gray-900">{hive.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {hive.apiary?.name} •
                                                {daysSinceInspection === null
                                                    ? ' لم يتم فحصها'
                                                    : ` آخر فحص منذ ${daysSinceInspection} يوم`
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleStartQuickInspection(hive)}
                                        className="btn-primary btn-sm"
                                    >
                                        <Play className="w-4 h-4 ml-1" />
                                        فحص سريع
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {hivesNeedingInspection.length > 5 && (
                        <button
                            onClick={() => navigate('/inspections/quick')}
                            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
                        >
                            عرض جميع الخلايا ({hivesNeedingInspection.length})
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-2">جميع الخلايا مُفحوصة!</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        جميع خلاياك تم فحصها مؤخراً
                    </p>
                    <button
                        onClick={() => navigate('/inspections/quick')}
                        className="btn-outline btn-sm"
                    >
                        فحص إضافي
                    </button>
                </div>
            )}

            {/* Recent Inspections Summary */}
            {recentInspections.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">آخر الفحوصات</h4>

                    <div className="space-y-2">
                        {recentInspections.slice(0, 3).map((hive) => (
                            <div key={hive.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <div className={clsx(
                                        'w-2 h-2 rounded-full ml-2',
                                        `bg-${getStatusColor(hive.daysSinceInspection)}-500`
                                    )} />
                                    <span className="text-gray-900">{hive.name}</span>
                                </div>

                                <div className="flex items-center text-gray-600">
                                    <Clock className="w-3 h-3 ml-1" />
                                    <span>{hive.daysSinceInspection} يوم</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('/inspections/new')}
                        className="btn-outline btn-sm"
                    >
                        فحص تفصيلي
                    </button>

                    <button
                        onClick={() => navigate('/inspections')}
                        className="btn-outline btn-sm"
                    >
                        سجل الفحوصات
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickInspectionCard;