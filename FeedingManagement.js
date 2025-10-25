import React, { useState, useEffect } from 'react';
import {
    Droplets,
    Calculator,
    BookOpen,
    Users,
    Calendar,
    TrendingUp,
    Clock,
    AlertTriangle,
    Plus,
    Filter,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

// Import components
import FeedingCalculator from '../../components/Feeding/FeedingCalculator';
import RecipesList from '../../components/Feeding/RecipesList';
import BulkFeedingCalculator from '../../components/Feeding/BulkFeedingCalculator';
import FeedingRecords from '../../components/Feeding/FeedingRecords';
import FeedingSchedule from '../../components/Feeding/FeedingSchedule';
import FeedingStats from '../../components/Feeding/FeedingStats';

const FeedingManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [hives, setHives] = useState([]);
    const [feedingStats, setFeedingStats] = useState(null);
    const [upcomingFeedings, setUpcomingFeedings] = useState([]);
    const [overdueFeedings, setOverdueFeedings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load hives, stats, and feeding schedules in parallel
            const [hivesRes, statsRes, upcomingRes, overdueRes] = await Promise.all([
                axios.get('/api/hives'),
                axios.get('/api/feeding/stats/summary'),
                axios.get('/api/feeding/upcoming/list'),
                axios.get('/api/feeding/overdue/list')
            ]);

            setHives(hivesRes.data.data.hives || []);
            setFeedingStats(statsRes.data.data);
            setUpcomingFeedings(upcomingRes.data.data || []);
            setOverdueFeedings(overdueRes.data.data || []);
        } catch (error) {
            toast.error('خطأ في تحميل بيانات التغذية');
            console.error('Error loading feeding data:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        {
            id: 'overview',
            label: 'نظرة عامة',
            icon: TrendingUp,
            description: 'ملخص حالة التغذية والإحصائيات'
        },
        {
            id: 'calculator',
            label: 'حاسبة التغذية',
            icon: Calculator,
            description: 'احسب كميات التغذية المناسبة'
        },
        {
            id: 'bulk',
            label: 'التغذية الجماعية',
            icon: Users,
            description: 'تغذية عدة خلايا معاً'
        },
        {
            id: 'recipes',
            label: 'الوصفات',
            icon: BookOpen,
            description: 'وصفات التغذية المجربة'
        },
        {
            id: 'records',
            label: 'سجل التغذية',
            icon: Droplets,
            description: 'تتبع وإدارة سجلات التغذية'
        },
        {
            id: 'schedule',
            label: 'الجدولة',
            icon: Calendar,
            description: 'جدولة التغذية والتذكيرات'
        }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                        {feedingStats?.total_feedings || 0}
                    </div>
                    <div className="text-gray-600">إجمالي التغذيات</div>
                    <div className="text-sm text-gray-500 mt-1">آخر 30 يوم</div>
                </div>

                <div className="card text-center">
                    <div className="text-3xl font-bold text-success-600 mb-2">
                        {feedingStats?.total_cost?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-gray-600">ريال</div>
                    <div className="text-sm text-gray-500 mt-1">إجمالي التكلفة</div>
                </div>

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
            </div>

            {/* Alerts */}
            {overdueFeedings.length > 0 && (
                <div className="card bg-danger-50 border-danger-200">
                    <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-danger-600 mt-0.5 ml-3 flex-shrink-0" />
                        <div>
                            <h3 className="font-medium text-danger-900 mb-2">
                                تنبيه: {overdueFeedings.length} تغذية متأخرة
                            </h3>
                            <p className="text-danger-800 text-sm mb-3">
                                هناك تغذيات مجدولة تأخرت عن موعدها المحدد
                            </p>
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className="btn-danger btn-sm"
                            >
                                عرض الجدولة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feeding Types Distribution */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        توزيع أنواع التغذية
                    </h3>

                    {feedingStats?.by_type && Object.keys(feedingStats.by_type).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(feedingStats.by_type).map(([type, data]) => {
                                const percentage = (data.count / feedingStats.total_feedings) * 100;
                                const typeLabels = {
                                    sugar_syrup: 'محلول سكري',
                                    pollen_patty: 'عجينة حبوب لقاح',
                                    protein_patty: 'عجينة بروتين',
                                    emergency_feeding: 'تغذية طارئة',
                                    winter_feeding: 'تغذية شتوية'
                                };

                                return (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-primary-500 rounded-full ml-2"></div>
                                            <span className="text-gray-700">
                                                {typeLabels[type] || type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">
                                                {data.count} ({percentage.toFixed(1)}%)
                                            </span>
                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-primary-500 h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            لا توجد بيانات تغذية حتى الآن
                        </div>
                    )}
                </div>

                {/* Upcoming Feedings */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            التغذيات القادمة
                        </h3>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            عرض الكل
                        </button>
                    </div>

                    {upcomingFeedings.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingFeedings.slice(0, 5).map((feeding) => (
                                <div key={feeding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {feeding.hive?.name || 'خلية غير محددة'}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {feeding.getFeedingTypeLabel?.() || feeding.feeding_type}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(feeding.next_feeding_date).toLocaleDateString('ar-SA')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {feeding.getDaysUntilNextFeeding?.()} يوم متبقي
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            لا توجد تغذيات مجدولة
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                        <Calculator className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-900">حساب التغذية</div>
                        <div className="text-sm text-gray-600">احسب الكميات لخلية واحدة</div>
                    </button>

                    <button
                        onClick={() => setActiveTab('bulk')}
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                        <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-900">تغذية جماعية</div>
                        <div className="text-sm text-gray-600">احسب لعدة خلايا معاً</div>
                    </button>

                    <button
                        onClick={() => setActiveTab('recipes')}
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                        <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <div className="font-medium text-gray-900">عرض الوصفات</div>
                        <div className="text-sm text-gray-600">وصفات التغذية المجربة</div>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'calculator':
                return (
                    <FeedingCalculator
                        hiveData={null}
                        onCalculationComplete={(result) => {
                            toast.success('تم حساب التغذية بنجاح');
                        }}
                    />
                );
            case 'bulk':
                return (
                    <BulkFeedingCalculator
                        hives={hives}
                        onCalculationComplete={(result) => {
                            toast.success('تم حساب التغذية الجماعية بنجاح');
                        }}
                    />
                );
            case 'recipes':
                return (
                    <RecipesList
                        onRecipeSelect={(recipeKey, recipe) => {
                            toast.success(`تم اختيار وصفة: ${recipe.name}`);
                        }}
                    />
                );
            case 'records':
                return <FeedingRecords onRecordUpdate={loadData} />;
            case 'schedule':
                return <FeedingSchedule onScheduleUpdate={loadData} />;
            default:
                return renderOverview();
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                    <div className="grid grid-cols-4 gap-6">
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

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">إدارة التغذية</h1>
                    <p className="text-gray-600 mt-1">
                        نظام شامل لإدارة وتخطيط تغذية النحل
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/feeding/new')}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4 ml-2" />
                        تغذية جديدة
                    </button>

                    <button
                        onClick={() => {/* Export functionality */ }}
                        className="btn-outline"
                    >
                        <Download className="w-4 h-4 ml-2" />
                        تصدير البيانات
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 space-x-reverse overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                                    activeTab === tab.id
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default FeedingManagement;