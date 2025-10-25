import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    Target,
    Activity,
    Download,
    Filter,
    RefreshCw,
    PieChart,
    LineChart
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedingReports = ({ className }) => {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedHive, setSelectedHive] = useState('');
    const [selectedApiary, setSelectedApiary] = useState('');
    const [hives, setHives] = useState([]);
    const [apiaries, setApiaries] = useState([]);

    useEffect(() => {
        loadData();
        loadReports();
    }, []);

    useEffect(() => {
        loadReports();
    }, [dateRange, selectedHive, selectedApiary]);

    const loadData = async () => {
        try {
            const [hivesRes, apiariesRes] = await Promise.all([
                axios.get('/api/hives'),
                axios.get('/api/apiaries')
            ]);

            setHives(hivesRes.data.data.hives || []);
            setApiaries(apiariesRes.data.data.apiaries || []);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const loadReports = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                date_from: dateRange.start,
                date_to: dateRange.end
            });

            if (selectedHive) params.append('hive_id', selectedHive);
            if (selectedApiary) params.append('apiary_id', selectedApiary);

            const [statsRes, feedingsRes] = await Promise.all([
                axios.get(`/api/feeding/stats/summary?${params}`),
                axios.get(`/api/feeding?${params}&limit=100`)
            ]);

            const stats = statsRes.data.data;
            const feedings = feedingsRes.data.data.feedings;

            // Process data for reports
            const processedReports = processReportData(stats, feedings);
            setReports(processedReports);

        } catch (error) {
            toast.error('خطأ في تحميل التقارير');
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (stats, feedings) => {
        // Monthly consumption trend
        const monthlyData = {};
        feedings.forEach(feeding => {
            const month = new Date(feeding.feeding_date).toISOString().slice(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = {
                    count: 0,
                    cost: 0,
                    consumption: 0
                };
            }
            monthlyData[month].count += 1;
            monthlyData[month].cost += feeding.total_cost;
            monthlyData[month].consumption += feeding.amount_consumed || feeding.total_amount || 0;
        });

        // Hive performance comparison
        const hivePerformance = {};
        feedings.forEach(feeding => {
            if (feeding.hive) {
                const hiveId = feeding.hive.id;
                if (!hivePerformance[hiveId]) {
                    hivePerformance[hiveId] = {
                        name: feeding.hive.name,
                        totalCost: 0,
                        totalFeedings: 0,
                        avgEffectiveness: 0,
                        effectivenessCount: 0
                    };
                }
                hivePerformance[hiveId].totalCost += feeding.total_cost;
                hivePerformance[hiveId].totalFeedings += 1;

                if (feeding.effectiveness) {
                    hivePerformance[hiveId].avgEffectiveness += feeding.effectiveness;
                    hivePerformance[hiveId].effectivenessCount += 1;
                }
            }
        });

        // Calculate averages
        Object.values(hivePerformance).forEach(hive => {
            if (hive.effectivenessCount > 0) {
                hive.avgEffectiveness = hive.avgEffectiveness / hive.effectivenessCount;
            }
            hive.avgCostPerFeeding = hive.totalCost / hive.totalFeedings;
        });

        // Feeding type effectiveness
        const typeEffectiveness = {};
        feedings.forEach(feeding => {
            if (feeding.effectiveness) {
                if (!typeEffectiveness[feeding.feeding_type]) {
                    typeEffectiveness[feeding.feeding_type] = {
                        total: 0,
                        count: 0,
                        cost: 0
                    };
                }
                typeEffectiveness[feeding.feeding_type].total += feeding.effectiveness;
                typeEffectiveness[feeding.feeding_type].count += 1;
                typeEffectiveness[feeding.feeding_type].cost += feeding.total_cost;
            }
        });

        Object.keys(typeEffectiveness).forEach(type => {
            const data = typeEffectiveness[type];
            data.average = data.total / data.count;
            data.avgCost = data.cost / data.count;
        });

        return {
            summary: stats,
            monthlyTrend: Object.entries(monthlyData).map(([month, data]) => ({
                month,
                ...data
            })).sort((a, b) => a.month.localeCompare(b.month)),
            hivePerformance: Object.values(hivePerformance),
            typeEffectiveness,
            totalFeedings: feedings.length,
            dateRange
        };
    };

    const exportReport = () => {
        if (!reports) return;

        const reportText = generateReportText();
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير_التغذية_${dateRange.start}_${dateRange.end}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateReportText = () => {
        let text = `تقرير استهلاك التغذية\n`;
        text += `الفترة: من ${dateRange.start} إلى ${dateRange.end}\n`;
        text += `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}\n\n`;

        text += `الملخص العام:\n`;
        text += `- إجمالي التغذيات: ${reports.summary.total_feedings}\n`;
        text += `- إجمالي التكلفة: ${reports.summary.total_cost?.toFixed(2)} ريال\n`;
        text += `- متوسط التكلفة: ${reports.summary.average_cost_per_feeding?.toFixed(2)} ريال\n\n`;

        if (reports.hivePerformance.length > 0) {
            text += `أداء الخلايا:\n`;
            reports.hivePerformance.forEach(hive => {
                text += `- ${hive.name}: ${hive.totalFeedings} تغذية، ${hive.totalCost.toFixed(2)} ريال، فعالية ${hive.avgEffectiveness.toFixed(1)}/10\n`;
            });
            text += `\n`;
        }

        if (Object.keys(reports.typeEffectiveness).length > 0) {
            text += `فعالية أنواع التغذية:\n`;
            Object.entries(reports.typeEffectiveness).forEach(([type, data]) => {
                text += `- ${getFeedingTypeLabel(type)}: فعالية ${data.average.toFixed(1)}/10، متوسط التكلفة ${data.avgCost.toFixed(2)} ريال\n`;
            });
        }

        return text;
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

    const getEffectivenessColor = (effectiveness) => {
        if (effectiveness >= 8) return 'success';
        if (effectiveness >= 6) return 'warning';
        return 'danger';
    };

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

    if (!reports) {
        return (
            <div className={clsx('text-center py-12', className)}>
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد بيانات للتقرير
                </h3>
                <p className="text-gray-600">
                    لم يتم العثور على بيانات تغذية للفترة المحددة
                </p>
            </div>
        );
    }

    return (
        <div className={clsx('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">تقارير استهلاك التغذية</h2>
                    <p className="text-gray-600">تحليل شامل لاستهلاك وأداء التغذية</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadReports}
                        className="btn-outline btn-sm"
                    >
                        <RefreshCw className="w-4 h-4 ml-1" />
                        تحديث
                    </button>

                    <button
                        onClick={exportReport}
                        className="btn-primary btn-sm"
                    >
                        <Download className="w-4 h-4 ml-1" />
                        تصدير التقرير
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="form-label">من تاريخ</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="form-input"
                        />
                    </div>

                    <div>
                        <label className="form-label">إلى تاريخ</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="form-input"
                        />
                    </div>

                    <div>
                        <label className="form-label">المنحل</label>
                        <select
                            value={selectedApiary}
                            onChange={(e) => setSelectedApiary(e.target.value)}
                            className="form-select"
                        >
                            <option value="">جميع المناحل</option>
                            {apiaries.map(apiary => (
                                <option key={apiary.id} value={apiary.id}>
                                    {apiary.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">الخلية</label>
                        <select
                            value={selectedHive}
                            onChange={(e) => setSelectedHive(e.target.value)}
                            className="form-select"
                        >
                            <option value="">جميع الخلايا</option>
                            {hives
                                .filter(hive => !selectedApiary || hive.apiary_id === parseInt(selectedApiary))
                                .map(hive => (
                                    <option key={hive.id} value={hive.id}>
                                        {hive.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                        {reports.summary.total_feedings}
                    </div>
                    <div className="text-gray-600">إجمالي التغذيات</div>
                    <div className="text-sm text-gray-500 mt-1">
                        في الفترة المحددة
                    </div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-success-600 mb-2">
                        {reports.summary.total_cost?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-gray-600">ريال</div>
                    <div className="text-sm text-gray-500 mt-1">
                        إجمالي التكلفة
                    </div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-warning-600 mb-2">
                        {reports.summary.average_cost_per_feeding?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-gray-600">ريال</div>
                    <div className="text-sm text-gray-500 mt-1">
                        متوسط التكلفة
                    </div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-info-600 mb-2">
                        {Object.keys(reports.summary.by_type || {}).length}
                    </div>
                    <div className="text-gray-600">أنواع</div>
                    <div className="text-sm text-gray-500 mt-1">
                        أنواع التغذية المستخدمة
                    </div>
                </div>
            </div>

            {/* Monthly Trend */}
            {reports.monthlyTrend.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <LineChart className="w-5 h-5 ml-2" />
                        الاتجاه الشهري
                    </h3>

                    <div className="space-y-4">
                        {reports.monthlyTrend.map((month) => (
                            <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {new Date(month.month + '-01').toLocaleDateString('ar-SA', {
                                            year: 'numeric',
                                            month: 'long'
                                        })}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {month.count} تغذية
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold text-gray-900">
                                        {month.cost.toFixed(2)} ريال
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {month.consumption.toFixed(1)} وحدة استهلاك
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hive Performance */}
            {reports.hivePerformance.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 ml-2" />
                        أداء الخلايا
                    </h3>

                    <div className="space-y-3">
                        {reports.hivePerformance
                            .sort((a, b) => b.avgEffectiveness - a.avgEffectiveness)
                            .map((hive) => {
                                const effectivenessColor = getEffectivenessColor(hive.avgEffectiveness);

                                return (
                                    <div key={hive.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{hive.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {hive.totalFeedings} تغذية • {hive.totalCost.toFixed(2)} ريال
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <div className="text-sm text-gray-600">متوسط التكلفة</div>
                                                <div className="font-medium text-gray-900">
                                                    {hive.avgCostPerFeeding.toFixed(2)} ريال
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <div className="text-sm text-gray-600">الفعالية</div>
                                                <div className={clsx('font-bold', `text-${effectivenessColor}-600`)}>
                                                    {hive.avgEffectiveness.toFixed(1)}/10
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Type Effectiveness */}
            {Object.keys(reports.typeEffectiveness).length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 ml-2" />
                        فعالية أنواع التغذية
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(reports.typeEffectiveness)
                            .sort(([, a], [, b]) => b.average - a.average)
                            .map(([type, data]) => {
                                const effectivenessColor = getEffectivenessColor(data.average);

                                return (
                                    <div key={type} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900">
                                                {getFeedingTypeLabel(type)}
                                            </h4>
                                            <div className={clsx('font-bold', `text-${effectivenessColor}-600`)}>
                                                {data.average.toFixed(1)}/10
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div>
                                                <div>عدد المرات: {data.count}</div>
                                                <div>متوسط التكلفة: {data.avgCost.toFixed(2)} ريال</div>
                                            </div>

                                            <div className="text-right">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={clsx('h-2 rounded-full', `bg-${effectivenessColor}-500`)}
                                                        style={{ width: `${(data.average / 10) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Insights and Recommendations */}
            <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-start">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 ml-3 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900 mb-2">رؤى وتوصيات</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            {reports.summary.most_used_type && (
                                <li>• النوع الأكثر استخداماً: {getFeedingTypeLabel(reports.summary.most_used_type)}</li>
                            )}
                            {reports.summary.average_cost_per_feeding > 15 && (
                                <li>• متوسط التكلفة مرتفع، فكر في التغذية الجماعية لتوفير التكاليف</li>
                            )}
                            {reports.hivePerformance.length > 1 && (
                                <li>• هناك تفاوت في أداء الخلايا، راجع الخلايا ذات الأداء المنخفض</li>
                            )}
                            {Object.keys(reports.typeEffectiveness).length === 1 && (
                                <li>• تستخدم نوع واحد فقط من التغذية، جرب أنواع أخرى لتحسين النتائج</li>
                            )}
                            <li>• سجل استجابة النحل بانتظام لتحسين دقة التقارير</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedingReports;