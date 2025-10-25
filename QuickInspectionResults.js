import React from 'react';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Calendar,
    Target,
    Lightbulb,
    ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

const QuickInspectionResults = ({ result, hive, onClose, onViewDetails }) => {
    const { summary, recommendations, analysis, next_inspection_date } = result;

    const getStatusConfig = (status) => {
        const configs = {
            green: {
                color: 'success',
                icon: CheckCircle,
                title: 'ممتاز',
                description: 'الخلية في حالة ممتازة'
            },
            yellow: {
                color: 'warning',
                icon: AlertTriangle,
                title: 'جيد',
                description: 'حالة جيدة مع بعض النقاط للتحسين'
            },
            orange: {
                color: 'orange',
                icon: AlertTriangle,
                title: 'يحتاج انتباه',
                description: 'تحتاج متابعة ورعاية إضافية'
            },
            red: {
                color: 'danger',
                icon: XCircle,
                title: 'حرج',
                description: 'تحتاج تدخل عاجل'
            }
        };
        return configs[status] || configs.yellow;
    };

    const statusConfig = getStatusConfig(summary.status);
    const StatusIcon = statusConfig.icon;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-success-600';
        if (score >= 60) return 'text-warning-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-danger-600';
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className={clsx(
                    'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
                    `bg-${statusConfig.color}-100`
                )}>
                    <StatusIcon className={clsx('w-10 h-10', `text-${statusConfig.color}-600`)} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    نتائج الفحص السريع
                </h1>

                <p className="text-gray-600">
                    {hive.name} - {hive.apiary?.name}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                    {formatDate(summary.timestamp)}
                </p>
            </div>

            {/* Score Display */}
            <div className="card text-center">
                <div className={clsx('text-5xl font-bold mb-2', getScoreColor(summary.score))}>
                    {summary.score}
                </div>

                <div className="text-lg text-gray-600 mb-4">
                    النقاط الإجمالية
                </div>

                <div className={clsx(
                    'inline-flex items-center px-4 py-2 rounded-full text-base font-medium',
                    `bg-${statusConfig.color}-100 text-${statusConfig.color}-800`
                )}>
                    <StatusIcon className="w-5 h-5 ml-2" />
                    {statusConfig.title}
                </div>

                <p className={clsx('mt-2 text-sm', `text-${statusConfig.color}-700`)}>
                    {statusConfig.description}
                </p>
            </div>

            {/* Key Metrics */}
            {analysis && analysis.metrics && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">المؤشرات الرئيسية</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {analysis.metrics.queen_health && (
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-primary-600">
                                    {analysis.metrics.queen_health}%
                                </div>
                                <div className="text-sm text-gray-600">صحة الملكة</div>
                            </div>
                        )}

                        {analysis.metrics.brood_health && (
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-primary-600">
                                    {analysis.metrics.brood_health}%
                                </div>
                                <div className="text-sm text-gray-600">صحة الحضنة</div>
                            </div>
                        )}

                        {analysis.metrics.population_trend && (
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center mb-1">
                                    {analysis.metrics.population_trend === 'increasing' ? (
                                        <TrendingUp className="w-6 h-6 text-success-600" />
                                    ) : analysis.metrics.population_trend === 'decreasing' ? (
                                        <TrendingDown className="w-6 h-6 text-danger-600" />
                                    ) : (
                                        <div className="w-6 h-6 bg-warning-600 rounded-full"></div>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600">اتجاه التعداد</div>
                            </div>
                        )}

                        {analysis.metrics.food_sufficiency && (
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-primary-600">
                                    {analysis.metrics.food_sufficiency}%
                                </div>
                                <div className="text-sm text-gray-600">كفاية الغذاء</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
                <div className="card">
                    <div className="flex items-center mb-4">
                        <Lightbulb className="w-5 h-5 text-warning-600 ml-2" />
                        <h3 className="text-lg font-semibold text-gray-900">التوصيات</h3>
                    </div>

                    <div className="space-y-3">
                        {recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start">
                                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-medium text-primary-600">{index + 1}</span>
                                </div>
                                <p className="text-gray-700 mr-3">{recommendation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Inspection */}
            {next_inspection_date && (
                <div className="card">
                    <div className="flex items-center mb-3">
                        <Calendar className="w-5 h-5 text-primary-600 ml-2" />
                        <h3 className="text-lg font-semibold text-gray-900">الفحص القادم</h3>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                        <div>
                            <p className="font-medium text-primary-900">
                                {formatDate(next_inspection_date)}
                            </p>
                            <p className="text-sm text-primary-700">
                                موصى به بناءً على حالة الخلية الحالية
                            </p>
                        </div>
                        <Target className="w-8 h-8 text-primary-600" />
                    </div>
                </div>
            )}

            {/* Detailed Analysis Preview */}
            {analysis && analysis.insights && analysis.insights.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">رؤى إضافية</h3>

                    <div className="space-y-2">
                        {analysis.insights.slice(0, 3).map((insight, index) => (
                            <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 ml-3 flex-shrink-0"></div>
                                <p className="text-sm text-gray-700">{insight}</p>
                            </div>
                        ))}
                    </div>

                    {analysis.insights.length > 3 && (
                        <button
                            onClick={onViewDetails}
                            className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            عرض جميع الرؤى ({analysis.insights.length})
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                {onViewDetails && (
                    <button
                        onClick={onViewDetails}
                        className="w-full btn-primary"
                    >
                        عرض التحليل التفصيلي
                    </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => window.location.href = `/hives/${hive.id}`}
                        className="btn-outline"
                    >
                        العودة للخلية
                    </button>

                    <button
                        onClick={onClose}
                        className="btn-secondary"
                    >
                        فحص جديد
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-gray-50">
                <h3 className="text-base font-medium text-gray-900 mb-3">إجراءات سريعة</h3>

                <div className="grid grid-cols-2 gap-2">
                    <button className="btn-outline btn-sm">
                        إضافة ملاحظة
                    </button>
                    <button className="btn-outline btn-sm">
                        جدولة تذكير
                    </button>
                    <button className="btn-outline btn-sm">
                        مشاركة النتائج
                    </button>
                    <button className="btn-outline btn-sm">
                        طباعة التقرير
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickInspectionResults;