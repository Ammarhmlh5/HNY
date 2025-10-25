import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Target,
    Calendar,
    Lightbulb,
    BarChart3,
    Activity
} from 'lucide-react';
import clsx from 'clsx';

const InspectionResults = ({ inspection, analysis }) => {
    const getScoreColor = (score) => {
        if (score >= 85) return 'text-success-600 bg-success-100';
        if (score >= 70) return 'text-primary-600 bg-primary-100';
        if (score >= 55) return 'text-warning-600 bg-warning-100';
        return 'text-danger-600 bg-danger-100';
    };

    const getGradeColor = (grade) => {
        if (['A+', 'A', 'A-'].includes(grade)) return 'text-success-600 bg-success-100';
        if (['B+', 'B', 'B-'].includes(grade)) return 'text-primary-600 bg-primary-100';
        if (['C+', 'C', 'C-'].includes(grade)) return 'text-warning-600 bg-warning-100';
        return 'text-danger-600 bg-danger-100';
    };

    const getTrendIcon = (trend) => {
        if (trend === 'improving') return TrendingUp;
        if (trend === 'declining') return TrendingDown;
        return Minus;
    };

    const getTrendColor = (trend) => {
        if (trend === 'improving') return 'text-success-600';
        if (trend === 'declining') return 'text-danger-600';
        return 'text-gray-600';
    };

    return (
        <div className="space-y-6">
            {/* النتيجة الإجمالية */}
            <div className="card">
                <div className="text-center">
                    <div className={clsx(
                        'inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold mb-4',
                        getScoreColor(analysis.score_analysis.weighted_score)
                    )}>
                        {Math.round(analysis.score_analysis.weighted_score)}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {analysis.score_analysis.performance_level}
                    </h2>

                    <div className={clsx(
                        'inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold',
                        getGradeColor(analysis.score_analysis.grade)
                    )}>
                        درجة {analysis.score_analysis.grade}
                    </div>

                    {/* مؤشر الثقة */}
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                            مستوى الثقة في التحليل: {analysis.confidence_metrics.overall_confidence}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${analysis.confidence_metrics.overall_confidence}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* تفصيل النقاط */}
            <div className="card">
                <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <BarChart3 className="h-5 w-5 ml-2" />
                        تفصيل النقاط
                    </h3>
                </div>

                <div className="space-y-4">
                    {Object.entries(analysis.score_analysis.score_breakdown).map(([key, component]) => {
                        const labels = {
                            queen_assessment: 'تقييم الملكة',
                            brood_assessment: 'تقييم الحضنة',
                            population_assessment: 'تقييم الطائفة',
                            food_assessment: 'تقييم الغذاء',
                            health_assessment: 'تقييم الصحة',
                            environmental_assessment: 'العوامل البيئية',
                            behavioral_assessment: 'المؤشرات السلوكية'
                        };

                        return (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    {labels[key] || key}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={clsx(
                                                'h-2 rounded-full',
                                                component.percentage >= 80 ? 'bg-success-500' :
                                                    component.percentage >= 60 ? 'bg-primary-500' :
                                                        component.percentage >= 40 ? 'bg-warning-500' : 'bg-danger-500'
                                            )}
                                            style={{ width: `${component.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 w-12 text-left">
                                        {component.score}/{component.max_score}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* التنبيهات والمخاطر */}
            {analysis.alerts && analysis.alerts.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <AlertTriangle className="h-5 w-5 ml-2" />
                            التنبيهات والمخاطر
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {analysis.alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={clsx(
                                    'p-4 rounded-lg border-r-4',
                                    alert.level === 'critical' ? 'bg-danger-50 border-danger-500' :
                                        alert.level === 'high' ? 'bg-orange-50 border-orange-500' :
                                            alert.level === 'medium' ? 'bg-warning-50 border-warning-500' :
                                                'bg-blue-50 border-blue-500'
                                )}
                            >
                                <div className="flex items-start">
                                    <AlertTriangle className={clsx(
                                        'h-5 w-5 mt-0.5 ml-3',
                                        alert.level === 'critical' ? 'text-danger-600' :
                                            alert.level === 'high' ? 'text-orange-600' :
                                                alert.level === 'medium' ? 'text-warning-600' :
                                                    'text-blue-600'
                                    )} />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                                        <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                                        {alert.timeline && (
                                            <p className="text-xs text-gray-600 mt-2">
                                                الإطار الزمني: {alert.timeline}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* التوصيات */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Lightbulb className="h-5 w-5 ml-2" />
                            التوصيات
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {analysis.recommendations.slice(0, 5).map((recommendation, index) => (
                            <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 ml-3" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800">
                                        {typeof recommendation === 'string' ? recommendation : recommendation.action || recommendation.message}
                                    </p>
                                    {recommendation.priority && (
                                        <span className={clsx(
                                            'inline-block mt-1 px-2 py-1 text-xs rounded-full',
                                            recommendation.priority === 'high' ? 'bg-danger-100 text-danger-800' :
                                                recommendation.priority === 'medium' ? 'bg-warning-100 text-warning-800' :
                                                    'bg-gray-100 text-gray-800'
                                        )}>
                                            أولوية {recommendation.priority === 'high' ? 'عالية' : recommendation.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* التنبؤات */}
            {analysis.predictions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* توقع التطريد */}
                    {analysis.predictions.swarming && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <Target className="h-5 w-5 ml-2" />
                                    توقع التطريد
                                </h3>
                            </div>

                            <div className="text-center">
                                <div className={clsx(
                                    'inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold mb-3',
                                    analysis.predictions.swarming.probability_percentage >= 70 ? 'bg-danger-100 text-danger-600' :
                                        analysis.predictions.swarming.probability_percentage >= 40 ? 'bg-warning-100 text-warning-600' :
                                            'bg-success-100 text-success-600'
                                )}>
                                    {analysis.predictions.swarming.probability_percentage}%
                                </div>

                                <p className="text-sm text-gray-600 mb-2">
                                    احتمالية التطريد
                                </p>

                                <span className={clsx(
                                    'inline-block px-3 py-1 rounded-full text-sm font-medium',
                                    analysis.predictions.swarming.risk_level === 'critical' ? 'bg-danger-100 text-danger-800' :
                                        analysis.predictions.swarming.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                                            analysis.predictions.swarming.risk_level === 'medium' ? 'bg-warning-100 text-warning-800' :
                                                'bg-success-100 text-success-800'
                                )}>
                                    {analysis.predictions.swarming.risk_level === 'critical' ? 'خطر حرج' :
                                        analysis.predictions.swarming.risk_level === 'high' ? 'خطر عالي' :
                                            analysis.predictions.swarming.risk_level === 'medium' ? 'خطر متوسط' : 'خطر منخفض'}
                                </span>

                                {analysis.predictions.swarming.estimated_timeframe && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        الإطار الزمني المتوقع: {analysis.predictions.swarming.estimated_timeframe}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* توقع الإنتاج */}
                    {analysis.predictions.production && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <Activity className="h-5 w-5 ml-2" />
                                    توقع الإنتاج
                                </h3>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary-600 mb-2">
                                    {analysis.predictions.production.current_season?.estimated_kg || 'غير محدد'} كغ
                                </div>

                                <p className="text-sm text-gray-600 mb-3">
                                    الإنتاج المتوقع هذا الموسم
                                </p>

                                {analysis.predictions.production.annual_projection && (
                                    <div className="text-sm text-gray-500">
                                        الإنتاج السنوي المتوقع: {analysis.predictions.production.annual_projection.estimated_kg} كغ
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* الاتجاهات */}
            {analysis.trend_analysis && analysis.trend_analysis.trend_available && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Activity className="h-5 w-5 ml-2" />
                            تحليل الاتجاهات
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* اتجاه الصحة */}
                        {analysis.trend_analysis.health_trend && (
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    {React.createElement(getTrendIcon(analysis.trend_analysis.health_trend.trend), {
                                        className: clsx('h-6 w-6', getTrendColor(analysis.trend_analysis.health_trend.trend))
                                    })}
                                </div>
                                <p className="text-sm font-medium text-gray-900">اتجاه الصحة</p>
                                <p className="text-xs text-gray-600">
                                    {analysis.trend_analysis.health_trend.trend === 'improving' ? 'تحسن' :
                                        analysis.trend_analysis.health_trend.trend === 'declining' ? 'تراجع' : 'مستقر'}
                                </p>
                            </div>
                        )}

                        {/* اتجاه الطائفة */}
                        {analysis.trend_analysis.population_trend && (
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    {React.createElement(getTrendIcon(analysis.trend_analysis.population_trend.trend), {
                                        className: clsx('h-6 w-6', getTrendColor(analysis.trend_analysis.population_trend.trend))
                                    })}
                                </div>
                                <p className="text-sm font-medium text-gray-900">اتجاه الطائفة</p>
                                <p className="text-xs text-gray-600">
                                    {analysis.trend_analysis.population_trend.trend === 'improving' ? 'نمو' :
                                        analysis.trend_analysis.population_trend.trend === 'declining' ? 'تراجع' : 'مستقر'}
                                </p>
                            </div>
                        )}

                        {/* اتجاه الإنتاجية */}
                        {analysis.trend_analysis.productivity_trend && (
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    {React.createElement(getTrendIcon(analysis.trend_analysis.productivity_trend.trend), {
                                        className: clsx('h-6 w-6', getTrendColor(analysis.trend_analysis.productivity_trend.trend))
                                    })}
                                </div>
                                <p className="text-sm font-medium text-gray-900">اتجاه الإنتاجية</p>
                                <p className="text-xs text-gray-600">
                                    {analysis.trend_analysis.productivity_trend.trend === 'improving' ? 'تحسن' :
                                        analysis.trend_analysis.productivity_trend.trend === 'declining' ? 'تراجع' : 'مستقر'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* نقاط القوة ومجالات التحسين */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* نقاط القوة */}
                {analysis.score_analysis.strengths && analysis.score_analysis.strengths.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <CheckCircle className="h-5 w-5 ml-2 text-success-600" />
                                نقاط القوة
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {analysis.score_analysis.strengths.map((strength, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-success-50 rounded">
                                    <span className="text-sm text-success-800">
                                        {strength.area === 'queen_assessment' ? 'تقييم الملكة' :
                                            strength.area === 'brood_assessment' ? 'تقييم الحضنة' :
                                                strength.area === 'population_assessment' ? 'تقييم الطائفة' :
                                                    strength.area === 'food_assessment' ? 'تقييم الغذاء' :
                                                        strength.area}
                                    </span>
                                    <span className="text-sm font-semibold text-success-700">
                                        {strength.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* مجالات التحسين */}
                {analysis.score_analysis.improvement_areas && analysis.score_analysis.improvement_areas.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <Target className="h-5 w-5 ml-2 text-warning-600" />
                                مجالات التحسين
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {analysis.score_analysis.improvement_areas.map((area, index) => (
                                <div key={index} className={clsx(
                                    'flex items-center justify-between p-2 rounded',
                                    area.priority === 'high' ? 'bg-danger-50' : 'bg-warning-50'
                                )}>
                                    <span className={clsx(
                                        'text-sm',
                                        area.priority === 'high' ? 'text-danger-800' : 'text-warning-800'
                                    )}>
                                        {area.area === 'queen_assessment' ? 'تقييم الملكة' :
                                            area.area === 'brood_assessment' ? 'تقييم الحضنة' :
                                                area.area === 'population_assessment' ? 'تقييم الطائفة' :
                                                    area.area === 'food_assessment' ? 'تقييم الغذاء' :
                                                        area.area}
                                    </span>
                                    <div className="text-left">
                                        <span className={clsx(
                                            'text-sm font-semibold',
                                            area.priority === 'high' ? 'text-danger-700' : 'text-warning-700'
                                        )}>
                                            {area.percentage}%
                                        </span>
                                        <span className="text-xs text-gray-500 block">
                                            إمكانية تحسين: +{area.improvement_potential}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* الفحص القادم */}
            {analysis.next_inspection_date && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Calendar className="h-5 w-5 ml-2" />
                            الفحص القادم
                        </h3>
                    </div>

                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 mb-2">
                            {new Date(analysis.next_inspection_date).toLocaleDateString('ar-SA', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>

                        <p className="text-sm text-gray-600">
                            موعد الفحص القادم المقترح بناءً على التحليل
                        </p>

                        {/* عداد الأيام */}
                        <div className="mt-4">
                            {(() => {
                                const daysUntil = Math.ceil((new Date(analysis.next_inspection_date) - new Date()) / (1000 * 60 * 60 * 24));
                                return (
                                    <span className={clsx(
                                        'inline-block px-3 py-1 rounded-full text-sm font-medium',
                                        daysUntil <= 3 ? 'bg-danger-100 text-danger-800' :
                                            daysUntil <= 7 ? 'bg-warning-100 text-warning-800' :
                                                'bg-primary-100 text-primary-800'
                                    )}>
                                        {daysUntil > 0 ? `بعد ${daysUntil} يوم` : 'متأخر'}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionResults;