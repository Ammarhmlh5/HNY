import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Clock,
    DollarSign,
    Users,
    ChefHat,
    Scale,
    Thermometer,
    AlertCircle,
    CheckCircle,
    Copy,
    Star,
    Filter
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const RecipesList = ({ onRecipeSelect, selectedRecipe, className }) => {
    const [recipes, setRecipes] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedRecipe, setExpandedRecipe] = useState(null);

    useEffect(() => {
        loadRecipes();
    }, []);

    const loadRecipes = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/feeding/recipes/list');
            setRecipes(response.data.data);
        } catch (error) {
            toast.error('خطأ في تحميل الوصفات');
            console.error('Error loading recipes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRecipeIcon = (recipeKey) => {
        const icons = {
            sugar_syrup_1_1: '🍯',
            sugar_syrup_2_1: '🍯',
            pollen_patty: '🌼',
            protein_patty: '🥜',
            winter_candy: '🍬'
        };
        return icons[recipeKey] || '📋';
    };

    const getRecipeCategory = (recipeKey) => {
        if (recipeKey.includes('syrup')) return 'liquid';
        if (recipeKey.includes('patty')) return 'patty';
        if (recipeKey.includes('candy')) return 'solid';
        return 'other';
    };

    const getRecipeDifficulty = (recipeKey) => {
        const difficulties = {
            sugar_syrup_1_1: 'easy',
            sugar_syrup_2_1: 'easy',
            pollen_patty: 'medium',
            protein_patty: 'medium',
            winter_candy: 'hard'
        };
        return difficulties[recipeKey] || 'medium';
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            easy: 'success',
            medium: 'warning',
            hard: 'danger'
        };
        return colors[difficulty] || 'gray';
    };

    const getDifficultyLabel = (difficulty) => {
        const labels = {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب'
        };
        return labels[difficulty] || difficulty;
    };

    const getCategoryLabel = (category) => {
        const labels = {
            liquid: 'محاليل سائلة',
            patty: 'عجائن',
            solid: 'أغذية صلبة',
            other: 'أخرى'
        };
        return labels[category] || category;
    };

    const copyRecipe = (recipe) => {
        const recipeText = `
${recipe.name}
${recipe.description}

المكونات:
${Object.entries(recipe.ingredients).map(([ingredient, details]) =>
            `- ${details.amount} ${details.unit} ${ingredient} (${details.notes})`
        ).join('\n')}

طريقة التحضير:
${recipe.instructions.map((step, index) => `${index + 1}. ${step}`).join('\n')}

الاستخدام: ${recipe.usage}
التخزين: ${recipe.storage}
التكلفة: ${recipe.cost_per_liter || recipe.cost_per_kg} ريال
    `;

        navigator.clipboard.writeText(recipeText);
        toast.success('تم نسخ الوصفة');
    };

    const filteredRecipes = Object.entries(recipes).filter(([key, recipe]) => {
        if (filter === 'all') return true;
        return getRecipeCategory(key) === filter;
    });

    const categories = [
        { value: 'all', label: 'جميع الوصفات', icon: BookOpen },
        { value: 'liquid', label: 'محاليل سائلة', icon: '💧' },
        { value: 'patty', label: 'عجائن', icon: '🥮' },
        { value: 'solid', label: 'أغذية صلبة', icon: '🍬' }
    ];

    if (loading) {
        return (
            <div className={clsx('space-y-4', className)}>
                <div className="animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card">
                            <div className="space-y-3">
                                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
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
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center ml-3">
                        <ChefHat className="w-5 h-5 text-warning-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">وصفات التغذية</h2>
                        <p className="text-gray-600">وصفات مجربة لتغذية النحل</p>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                    const Icon = typeof category.icon === 'string' ?
                        () => <span className="text-lg">{category.icon}</span> :
                        category.icon;

                    return (
                        <button
                            key={category.value}
                            onClick={() => setFilter(category.value)}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                filter === category.value
                                    ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {category.label}
                        </button>
                    );
                })}
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredRecipes.map(([recipeKey, recipe]) => {
                    const difficulty = getRecipeDifficulty(recipeKey);
                    const difficultyColor = getDifficultyColor(difficulty);
                    const isExpanded = expandedRecipe === recipeKey;
                    const isSelected = selectedRecipe === recipeKey;

                    return (
                        <div
                            key={recipeKey}
                            className={clsx(
                                'card cursor-pointer transition-all duration-200 hover:shadow-md',
                                isSelected && 'ring-2 ring-primary-500 bg-primary-50'
                            )}
                            onClick={() => onRecipeSelect && onRecipeSelect(recipeKey, recipe)}
                        >
                            {/* Recipe Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start">
                                    <span className="text-3xl ml-3">{getRecipeIcon(recipeKey)}</span>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {recipe.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            {recipe.description}
                                        </p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className={clsx(
                                                'px-2 py-1 text-xs font-medium rounded-full',
                                                `bg-${difficultyColor}-100 text-${difficultyColor}-800`
                                            )}>
                                                {getDifficultyLabel(difficulty)}
                                            </span>

                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                {getCategoryLabel(getRecipeCategory(recipeKey))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyRecipe(recipe);
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="نسخ الوصفة"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedRecipe(isExpanded ? null : recipeKey);
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title={isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                                    >
                                        <BookOpen className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Info */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                    <DollarSign className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                    <div className="text-sm font-medium text-gray-900">
                                        {recipe.cost_per_liter || recipe.cost_per_kg} ريال
                                    </div>
                                    <div className="text-xs text-gray-600">التكلفة</div>
                                </div>

                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                    <Scale className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                    <div className="text-sm font-medium text-gray-900">
                                        {Object.keys(recipe.ingredients).length}
                                    </div>
                                    <div className="text-xs text-gray-600">مكونات</div>
                                </div>

                                <div className="text-center p-2 bg-gray-50 rounded-lg">
                                    <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                    <div className="text-sm font-medium text-gray-900">
                                        {recipe.instructions.length}
                                    </div>
                                    <div className="text-xs text-gray-600">خطوات</div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="space-y-4 pt-4 border-t border-gray-200">
                                    {/* Ingredients */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <Scale className="w-4 h-4 ml-1" />
                                            المكونات
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries(recipe.ingredients).map(([ingredient, details]) => (
                                                <div key={ingredient} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="text-sm text-gray-900 capitalize">
                                                        {ingredient.replace('_', ' ')}
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {details.amount} {details.unit}
                                                        </span>
                                                        {details.notes && (
                                                            <div className="text-xs text-gray-600">{details.notes}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Instructions */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <CheckCircle className="w-4 h-4 ml-1" />
                                            طريقة التحضير
                                        </h4>
                                        <ol className="space-y-2">
                                            {recipe.instructions.map((step, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-xs font-medium ml-2 mt-0.5">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-sm text-gray-700">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>

                                    {/* Usage and Storage */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <h5 className="font-medium text-blue-900 mb-1 flex items-center">
                                                <Users className="w-4 h-4 ml-1" />
                                                الاستخدام
                                            </h5>
                                            <p className="text-sm text-blue-800">{recipe.usage}</p>
                                        </div>

                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <h5 className="font-medium text-green-900 mb-1 flex items-center">
                                                <Thermometer className="w-4 h-4 ml-1" />
                                                التخزين
                                            </h5>
                                            <p className="text-sm text-green-800">{recipe.storage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredRecipes.length === 0 && (
                <div className="text-center py-12">
                    <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        لا توجد وصفات
                    </h3>
                    <p className="text-gray-600">
                        لم يتم العثور على وصفات في هذه الفئة
                    </p>
                </div>
            )}

            {/* Tips */}
            <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 ml-3 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900 mb-2">نصائح مهمة</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• استخدم مكونات نظيفة وطازجة دائماً</li>
                            <li>• اتبع النسب المحددة بدقة للحصول على أفضل النتائج</li>
                            <li>• قدم التغذية في المساء لتجنب السرقة</li>
                            <li>• راقب استجابة النحل وعدل الكميات حسب الحاجة</li>
                            <li>• احفظ الأغذية المحضرة في ظروف مناسبة</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipesList;