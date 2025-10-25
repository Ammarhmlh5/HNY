import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Target,
    BarChart3,
    PieChart,
    Activity,
    Award,
    AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';

const FeedingStats = ({ hiveId, apiaryId, className }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        loadStats();
    }, [period, hiveId, apiaryId]);

    const loadStats = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                days: period
            });

            if (hiveId) params.append('hive_id', hiveId);
            if (apiaryId) params.append('apiary_id', apiaryId);

            const response = await axios.get(`/api/feeding/stats/summary?${params}`);
            setStats(response.data.data);

            // Process data for charts
            processChartData(response.data.data);
        } catch (error) {
            console.error('Error loading feeding stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const processChartData = (statsData) => {
        if (!statsData.by_type) return;

        const chartData = {
            typeDistribution: Object.entries(statsData.by_type).map(([type, data]) => ({
                name: getFeedingTypeLabel(type),
                value: data.count,
                cost: data.total_cost
            })),
            costTrend: [] // Would need historical data for this
        };

        setChartData(chartData);
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

    const getFeedingTypeColor = (type) => {
        const colors = {
            sugar_syrup: 'bg-blue-500',
            honey_syrup: 'bg-yellow-500',
            pollen_patty: 'bg-green-500',
            protein_patty: 'bg-purple-500',
            emergency_feeding: 'bg-red-500',
            winter_feeding: 'bg-gray-500',
            stimulative_feeding: 'bg-orange-500',
            maintenance_feeding: 'bg-indigo-500'
        };
        return colors[type] || 'bg-gray-400';
    };

    const calculateEfficiencyScore = () => {
        if (!stats || stats.total_feedings === 0) return 0;

        // Simple efficiency calculation based on cost per feeding and frequency
        const avgCost = stats.average_cost_per_feeding || 0;
        const frequency = stats.total_feedings / (period / 7); // feedings per week

        // Lower cost and appropriate frequency = higher efficiency
        const costScore = Math.max(0, 100 - (avgCost * 2));
        const frequencyScore = Math.min(100, frequency * 25);

        return Math.round((costScore + frequencyScore) / 2);
    };

    const getEfficiencyColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    };

    const periods = [
        { value: 7, label: '7 أيام' },
        { value: 30, label: '30 يوم' },
        { value: 90, label: '90 يوم' },
        { value: 365, label: 'سنة' }
    ];

    if (loading) {
        return (
            <div className={clsx('space-y-6', className)}>
                <div className="animate-pulse">
                    <div className="grid grid-cols-4 gap-6 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card">
                                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                                <div className="h-4 bg-gray-300 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={clsx('text-center py-12', className)}>
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد بيانات إحصائية
                </h3>
                <p className="text-gray-600">
                    لم يتم العثور على بيانات تغذية للفترة المحددة
                </p>
            </div>
        );
    }

    const efficiencyScore = calculateEfficiencyScore();
    const efficiencyColor = getEfficiencyColor(efficiencyScore);

    return (
        <div className={clsx('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">إحصائيات التغذية</h2>
                    <p className="text-gray-600">تحليل شامل لأداء التغذية</p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                    {periods.map((periodOption) => (
                        <button
                            key={periodOption.value}
                            onClick={() => setPeriod(periodOption.value)}
                            className={clsx(
                                'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                                period === periodOption.value
                                    ? 'bg-primary-100 text-primary-800'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            {periodOption.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                        {stats.total_feedings}
                    </div>
                    <div className="text-gray-600">إجمالي التغذيات</div>
                    <div className="text-sm text-gray-500 mt-1">
                        آخر {period} يوم
                    </div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-success-600 mb-2">
                        {stats.total_cost?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-gray-600">ريال</div>
                    <div className="text-sm text-gray-500 mt-1">
                        إجمالي التكلفة
                    </div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-warning-600 mb-2">
                        {stats.average_cost_per_feeding?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-gray-600">ريال</div>
                    <div className="text-sm text-gray-500 mt-1">
                        متوسط التكلفة
                    </div>
                </div>

                <div className="card text-center">
                    <div className={clsx(
                        'text-3xl font-bold mb-2',
                        `text-${efficiencyColor}-600`
                    )}>
                        {efficiencyScore}%
                    </div>
                    <div className="text-gray-600">الكفاءة</div>
                    <div className="text-sm text-gray-500 mt-1">
                        نقاط الأداء
                    </div>
                </div>
            </div>

            {/* Feeding Types Distribution */}
            {chartData && chartData.typeDistribution.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <PieChart className="w-5 h-5 ml-2" />
                        توزيع أنواع التغذية
                    </h3>

                    <div className="space-y-4">
                        {chartData.typeDistribution.map((item, index) => {
                            const percentage = (item.value / stats.total_feedings) * 100;
                            const typeKey = Object.keys(stats.by_type)[index];
                            const colorClass = getFeedingTypeColor(typeKey);

                            return (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                        <div className={clsx('w-4 h-4 rounded ml-3', colorClass)}></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {item.value} مرة • {item.cost?.toFixed(2)} ريال
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-900">
                                            {percentage.toFixed(1)}%
                                        </span>
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={clsx('h-2 rounded-full', colorClass)}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Analysis */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 ml-2" />
                        تحليل التكاليف
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">أعلى تكلفة</div>
                                <div className="text-sm text-gray-600">نوع التغذية الأغلى</div>
                            </div>
                            <div className="text-right">
                                {stats.by_type && Object.entries(stats.by_type).length > 0 ? (
                                    (() => {
                                        const mostExpensive = Object.entries(stats.by_type)
                                            .reduce((max, [type, data]) =>
                                                data.average_cost > (max.data?.average_cost || 0)
                                                    ? { type, data }
                                                    : max
                                                , {});

                                        return (
                                            <>
                                                <div className="font-bold text-gray-900">
                                                    {mostExpensive.data?.average_cost?.toFixed(2)} ريال
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {getFeedingTypeLabel(mostExpensive.type)}
                                                </div>
                                            </>
                                        );
                                    })()
                                ) : (
                                    <div className="text-gray-500">لا توجد بيانات</div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">أقل تكلفة</div>
                                <div className="text-sm text-gray-600">نوع التغذية الأوفر</div>
                            </div>
                            <div className="text-right">
                                {stats.by_type && Object.entries(stats.by_type).length > 0 ? (
                                    (() => {
                                        const leastExpensive = Object.entries(stats.by_type)
                                            .reduce((min, [type, data]) =>
                                                data.average_cost < (min.data?.average_cost || Infinity)
                                                    ? { type, data }
                                                    : min
                                                , {});

                                        return (
                                            <>
                                                <div className="font-bold text-gray-900">
                                                    {leastExpensive.data?.average_cost?.toFixed(2)} ريال
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {getFeedingTypeLabel(leastExpensive.type)}
                                                </div>
                                            </>
                                        );
                                    })()
                                ) : (
                                    <div className="text-gray-500">لا توجد بيانات</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Patterns */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 ml-2" />
                        أنماط الاستخدام
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">الأكثر استخداماً</div>
                                <div className="text-sm text-gray-600">نوع التغذية المفضل</div>
                            </div>
                            <div className="text-right">
                                {stats.most_used_type ? (
                                    <>
                                        <div className="font-bold text-gray-900">
                                            {getFeedingTypeLabel(stats.most_used_type)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {stats.by_type[stats.most_used_type]?.count} مرة
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-gray-500">لا توجد بيانات</div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">معدل التغذية</div>
                                <div className="text-sm text-gray-600">تغذيات في الأسبوع</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">
                                    {((stats.total_feedings / period) * 7).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">مرة/أسبوع</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Efficiency Score Breakdown */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="w-5 h-5 ml-2" />
                    تقييم الكفاءة
                </h3>

                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">النقاط الإجمالية</span>
                        <span className={clsx('font-bold', `text-${efficiencyColor}-600`)}>
                            {efficiencyScore}/100
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className={clsx('h-3 rounded-full transition-all duration-500', `bg-${efficiencyColor}-500`)}
                            style={{ width: `${efficiencyScore}%` }}
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className={clsx('text-2xl font-bold mb-1', `text-${efficiencyColor}-600`)}>
                            {efficiencyScore >= 80 ? 'ممتاز' :
                                efficiencyScore >= 60 ? 'جيد' : 'يحتاج تحسين'}
                        </div>
                        <div className="text-sm text-gray-600">التقييم العام</div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600 mb-1">
                            {stats.total_cost > 0 ? 'نشط' : 'خامل'}
                        </div>
                        <div className="text-sm text-gray-600">حالة التغذية</div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-info-600 mb-1">
                            {Object.keys(stats.by_type || {}).length}
                        </div>
                        <div className="text-sm text-gray-600">أنواع مستخدمة</div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 ml-3 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900 mb-2">توصيات لتحسين الكفاءة</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            {efficiencyScore < 60 && (
                                <li>• راجع تكاليف التغذية وابحث عن بدائل أوفر</li>
                            )}
                            {stats.total_feedings === 0 && (
                                <li>• ابدأ برنامج تغذية منتظم لخلاياك</li>
                            )}
                            {stats.average_cost_per_feeding > 20 && (
                                <li>• متوسط التكلفة مرتفع، جرب التغذية الجماعية لتوفير التكاليف</li>
                            )}
                            {Object.keys(stats.by_type || {}).length === 1 && (
                                <li>• نوع واحد من التغذية، جرب أنواع أخرى لتحسين التغذية</li>
                            )}
                            <li>• سجل استجابة النحل لتحسين فعالية التغذية</li>
                            <li>• استخدم حاسبة التغذية لتحديد الكميات المناسبة</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedingStats;