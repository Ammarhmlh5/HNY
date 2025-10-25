import React, { useState, useEffect } from 'react';
import {
    Lightbulb,
    Clock,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Star,
    Calendar,
    Target,
    ArrowRight,
    Filter,
    RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const RecommendationsList = ({ hiveId, apiaryId, type = 'hive' }) => {
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [completedActions, setCompletedActions] = useState([]);

    useEffect(() => {
        loadRecommendations();
    }, [hiveId, apiaryId, type]);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            let url;

            if (type === 'hive' && hiveId) {
                url = `/api/alerts/recommendations/hive/${hiveId}`;
            } else if (type === 'apiary' && apiaryId) {
                url = `/api/alerts/recommendations/apiary/${apiaryId}`;
            } else {
                throw new Error('Invalid recommendation type or missing ID');
            }

            const response = await axios.get(url);
            setRecommendations(response.data.data);
        } catch (error) {
            toast.error('خطأ في تحميل التوصيات');
            console.error('Error loading recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionComplete = (recommendationId, actionType) => {
        const actionKey = `${recommendationId}-${actionType}`;
        setCompletedActions(prev => [...prev, actionKey]);
        toast.success('تم تنفيذ الإجراء بنجاح');
    };

    const isActionCompleted = (recommendationId, actionType) => {
        const actionKey = `${recommendationId}-${actionType}`;
        return completedActions.includes(actionKey);
    };

    const getPriorityIcon = (priority) => {
        const icons = {
            high: AlertTriangle,
            medium: Clock,
            low: Lightbulb
        };
        return icons[priority] || Lightbulb;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'danger',
            medium: 'warning',
            low: 'primary'
        };
        return colors[priority] || 'primary';
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            easy: 'success',
            medium: 'warning',
            hard: 'danger'
        };
        return colors[difficulty] || 'gray';
    };

    const getTypeIcon = (type) => {
        const icons = {
            queen_management: '👑',
            health_management: '🏥',
            population_management: '👥',
            feeding: '🍯',
            inspection: '🔍',
            management: '⚙️',
            harvest: '📦',
            equipment: '🔧',
            preventive: '🛡️'
        };
        return icons[type] || '📋';
    };

    const getCategoryRecommendations = () => {
        if (!recommendations) return [];

        if (selectedCategory === 'all') {
            return [
                ...recommendations.recommendations.immediate,
                ...recommendations.recommendations.short_term,
                ...recommendations.recommendations.long_term,
                ...recommendations.recommendations.seasonal,
                ...recommendations.recommendations.preventive
            ];
        }

        return recommendations.recommendations[selectedCategory] || [];
    };

    const categories = [
        { key: 'all', label: 'جميع التوصيات', icon: Target },
        { key: 'immediate', label: 'فورية', icon: AlertTriangle },
        { key: 'short_term', label: 'قصيرة المدى', icon: Clock },
        { key: 'long_term', label: 'طويلة المدى', icon: Calendar },
        { key: 'seasonal', label: 'موسمية', icon: Star },
        { key: 'preventive', label: 'وقائية', icon: CheckCircle }
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!recommendations) {
        return (
            <div className="text-center py-12">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    لا توجد توصيات متاحة
                </h3>
                <p className="text-gray-600">
                    لم يتم العثور على توصيات لهذا العنصر
                </p>
            </div>
        );
    }

    const displayRecommendations = getCategoryRecommendations();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Lightbulb className="w-6 h-6 text-warning-600 ml-2" />
                        التوصيات الذكية
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {type === 'hive' ? recommendations.hive_name : recommendations.apiary_name}
                    </p>
                </div>

                <button
                    onClick={loadRecommendations}
                    className="btn-outline btn-sm"
                >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    تحديث
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card text-center">
                    <div className="text-2xl font-bold text-danger-600">
                        {recommendations.recommendations.immediate.length}
                    </div>
                    <div className="text-sm text-gray-600">توصيات فورية</div>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-warning-600">
                        {recommendations.recommendations.short_term.length}
                    </div>
                    <div className="text-sm text-gray-600">قصيرة المدى</div>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-primary-600">
                        {recommendations.recommendations.long_term.length}
                    </div>
                    <div className="text-sm text-gray-600">طويلة المدى</div>
                </div>

                <div className="card text-center">
                    <div className="text-2xl font-bold text-success-600">
                        {recommendations.recommendations.preventive.length}
                    </div>
                    <div className="text-sm text-gray-600">وقائية</div>
                </div>
            </div>

            {/* Weather & Context Info */}
            {recommendations.weather_conditions && (
                <div className="card bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-blue-900">الظروف الجوية الحالية</h3>
                            <p className="text-blue-700 text-sm">
                                {recommendations.weather_conditions.temperature}°م •
                                رطوبة {recommendations.weather_conditions.humidity}% •
                                {recommendations.weather_conditions.conditions}
                            </p>
                        </div>
                        <div className="text-2xl">🌤️</div>
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const count = category.key === 'all'
                        ? displayRecommendations.length
                        : recommendations.recommendations[category.key]?.length || 0;

                    return (
                        <button
                            key={category.key}
                            onClick={() => setSelectedCategory(category.key)}
                            className={clsx(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                selectedCategory === category.key
                                    ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {category.label}
                            <span className="bg-white px-2 py-0.5 rounded-full text-xs">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                {displayRecommendations.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            لا توجد توصيات في هذه الفئة
                        </h3>
                        <p className="text-gray-600">
                            جميع التوصيات في هذه الفئة مكتملة أو غير متاحة حالياً
                        </p>
                    </div>
                ) : (
                    displayRecommendations.map((recommendation, index) => {
                        const PriorityIcon = getPriorityIcon(recommendation.priority);
                        const priorityColor = getPriorityColor(recommendation.priority);
                        const difficultyColor = getDifficultyColor(recommendation.difficulty);
                        const typeIcon = getTypeIcon(recommendation.type);

                        return (
                            <div key={index} className="card hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    {/* Type Icon */}
                                    <div className="text-2xl flex-shrink-0">
                                        {typeIcon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {recommendation.title}
                                                    </h3>

                                                    <span className={clsx(
                                                        'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                                                        `bg-${priorityColor}-100 text-${priorityColor}-800`
                                                    )}>
                                                        <PriorityIcon className="w-3 h-3" />
                                                        {recommendation.priority === 'high' ? 'عالية' :
                                                            recommendation.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                                    </span>

                                                    <span className={clsx(
                                                        'px-2 py-1 text-xs font-medium rounded-full',
                                                        `bg-${difficultyColor}-100 text-${difficultyColor}-800`
                                                    )}>
                                                        {recommendation.difficulty === 'easy' ? 'سهل' :
                                                            recommendation.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                                                    </span>
                                                </div>

                                                <p className="text-gray-700 mb-3">
                                                    {recommendation.description}
                                                </p>

                                                {/* Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 ml-1" />
                                                        <span>المدة: {recommendation.timeline}</span>
                                                    </div>

                                                    {recommendation.estimated_cost > 0 && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <DollarSign className="w-4 h-4 ml-1" />
                                                            <span>التكلفة: {recommendation.estimated_cost} ريال</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Target className="w-4 h-4 ml-1" />
                                                        <span>النوع: {recommendation.type}</span>
                                                    </div>
                                                </div>

                                                {/* Resources Needed */}
                                                {recommendation.resources_needed && recommendation.resources_needed.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                            الموارد المطلوبة:
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {recommendation.resources_needed.map((resource, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                                >
                                                                    {resource}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => handleActionComplete(index, recommendation.action)}
                                                disabled={isActionCompleted(index, recommendation.action)}
                                                className={clsx(
                                                    'btn btn-sm',
                                                    isActionCompleted(index, recommendation.action)
                                                        ? 'btn-success cursor-not-allowed'
                                                        : 'btn-primary'
                                                )}
                                            >
                                                {isActionCompleted(index, recommendation.action) ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 ml-1" />
                                                        تم التنفيذ
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowRight className="w-4 h-4 ml-1" />
                                                        تنفيذ الإجراء
                                                    </>
                                                )}
                                            </button>

                                            <div className="text-xs text-gray-500">
                                                آخر تحديث: {new Date(recommendations.generated_at).toLocaleDateString('ar-SA')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Last Inspection Info */}
            {recommendations.last_inspection && (
                <div className="card bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-gray-900">آخر فحص</h3>
                            <p className="text-gray-600 text-sm">
                                {new Date(recommendations.last_inspection).toLocaleDateString('ar-SA')}
                            </p>
                        </div>
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsList;