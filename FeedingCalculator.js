import React, { useState, useEffect } from 'react';
import {
    Calculator,
    Droplets,
    Scale,
    DollarSign,
    Clock,
    AlertTriangle,
    CheckCircle,
    Info,
    Lightbulb,
    ShoppingCart,
    Save,
    RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedingCalculator = ({ hiveData, onCalculationComplete, className }) => {
    const [feedingType, setFeedingType] = useState('sugar_syrup');
    const [season, setSeason] = useState('');
    const [weatherConditions, setWeatherConditions] = useState(null);
    const [calculation, setCalculation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Advanced settings
    const [customHiveData, setCustomHiveData] = useState({
        population_strength: hiveData?.population_strength || 'moderate',
        food_stores: hiveData?.food_stores || 'adequate',
        brood_pattern: hiveData?.brood_pattern || 'good',
        hive_type: hiveData?.hive_type || 'langstroth',
        frame_count: hiveData?.frame_count || 10
    });

    useEffect(() => {
        // Auto-detect season
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) setSeason('spring');
        else if (month >= 6 && month <= 8) setSeason('summer');
        else if (month >= 9 && month <= 11) setSeason('autumn');
        else setSeason('winter');
    }, []);

    const feedingTypes = [
        {
            value: 'sugar_syrup',
            label: 'محلول سكري',
            description: 'للتحفيز والتغذية العامة',
            icon: '🍯',
            color: 'primary'
        },
        {
            value: 'honey_syrup',
            label: 'محلول عسل',
            description: 'تغذية طبيعية محفزة',
            icon: '🐝',
            color: 'warning'
        },
        {
            value: 'pollen_patty',
            label: 'عجينة حبوب لقاح',
            description: 'تغذية بروتينية طبيعية',
            icon: '🌼',
            color: 'success'
        },
        {
            value: 'protein_patty',
            label: 'عجينة بروتين بديل',
            description: 'بديل حبوب اللقاح',
            icon: '🥜',
            color: 'info'
        },
        {
            value: 'emergency_feeding',
            label: 'تغذية طارئة',
            description: 'للحالات الحرجة',
            icon: '🚨',
            color: 'danger'
        },
        {
            value: 'winter_feeding',
            label: 'تغذية شتوية',
            description: 'للتحضير للشتاء',
            icon: '❄️',
            color: 'secondary'
        }
    ];

    const seasons = [
        { value: 'spring', label: 'الربيع', icon: '🌸' },
        { value: 'summer', label: 'الصيف', icon: '☀️' },
        { value: 'autumn', label: 'الخريف', icon: '🍂' },
        { value: 'winter', label: 'الشتاء', icon: '❄️' }
    ];

    const handleCalculate = async () => {
        try {
            setLoading(true);

            const requestData = {
                hive_data: showAdvanced ? customHiveData : hiveData,
                feeding_type: feedingType,
                season: season,
                weather_conditions: weatherConditions
            };

            const response = await axios.post('/api/feeding/calculate', requestData);
            setCalculation(response.data.data);

            if (onCalculationComplete) {
                onCalculationComplete(response.data.data);
            }

            toast.success('تم حساب كميات التغذية بنجاح');
        } catch (error) {
            toast.error('خطأ في حساب كميات التغذية');
            console.error('Error calculating feeding:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFeeding = async () => {
        if (!calculation) return;

        try {
            const feedingData = {
                hive_id: hiveData?.hive_id,
                feeding_type: feedingType,
                ingredients: calculation.amounts,
                total_cost: calculation.total_cost,
                feeding_method: 'top_feeder',
                status: 'planned',
                notes: `حساب تلقائي - ${calculation.recommendations.join('. ')}`
            };

            await axios.post('/api/feeding', feedingData);
            toast.success('تم حفظ خطة التغذية');
        } catch (error) {
            toast.error('خطأ في حفظ خطة التغذية');
        }
    };

    const getIngredientIcon = (ingredient) => {
        const icons = {
            sugar: '🍬',
            water: '💧',
            honey: '🍯',
            pollen: '🌼',
            soy_flour: '🌾',
            yeast: '🦠'
        };
        return icons[ingredient] || '📦';
    };

    const getIngredientUnit = (ingredient) => {
        const units = {
            sugar: 'جرام',
            water: 'مل',
            honey: 'جرام',
            pollen: 'جرام',
            soy_flour: 'جرام',
            yeast: 'جرام'
        };
        return units[ingredient] || 'جرام';
    };

    const selectedFeedingType = feedingTypes.find(type => type.value === feedingType);

    return (
        <div className={clsx('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center ml-3">
                        <Calculator className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">حاسبة التغذية</h2>
                        <p className="text-gray-600">احسب الكميات المناسبة لتغذية النحل</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="btn-outline btn-sm"
                >
                    {showAdvanced ? 'إعدادات بسيطة' : 'إعدادات متقدمة'}
                </button>
            </div>

            {/* Feeding Type Selection */}
            <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">نوع التغذية</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {feedingTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setFeedingType(type.value)}
                            className={clsx(
                                'p-4 rounded-lg border-2 text-right transition-all duration-200',
                                feedingType === type.value
                                    ? `border-${type.color}-500 bg-${type.color}-50`
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{type.icon}</span>
                                <div className="flex-1 mr-3">
                                    <h4 className={clsx(
                                        'font-medium',
                                        feedingType === type.value ? `text-${type.color}-900` : 'text-gray-900'
                                    )}>
                                        {type.label}
                                    </h4>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">{type.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Season Selection */}
            <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">الموسم</h3>

                <div className="grid grid-cols-4 gap-3">
                    {seasons.map((seasonOption) => (
                        <button
                            key={seasonOption.value}
                            onClick={() => setSeason(seasonOption.value)}
                            className={clsx(
                                'p-3 rounded-lg border-2 text-center transition-all duration-200',
                                season === seasonOption.value
                                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            )}
                        >
                            <div className="text-2xl mb-1">{seasonOption.icon}</div>
                            <div className="text-sm font-medium">{seasonOption.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
                <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">إعدادات متقدمة</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">قوة الطائفة</label>
                            <select
                                value={customHiveData.population_strength}
                                onChange={(e) => setCustomHiveData(prev => ({
                                    ...prev,
                                    population_strength: e.target.value
                                }))}
                                className="form-select"
                            >
                                <option value="very_weak">ضعيفة جداً</option>
                                <option value="weak">ضعيفة</option>
                                <option value="moderate">متوسطة</option>
                                <option value="strong">قوية</option>
                                <option value="very_strong">قوية جداً</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">مخزون الغذاء</label>
                            <select
                                value={customHiveData.food_stores}
                                onChange={(e) => setCustomHiveData(prev => ({
                                    ...prev,
                                    food_stores: e.target.value
                                }))}
                                className="form-select"
                            >
                                <option value="none">منتهي</option>
                                <option value="critical">حرج</option>
                                <option value="low">قليل</option>
                                <option value="adequate">كافي</option>
                                <option value="abundant">وفير</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">نمط الحضنة</label>
                            <select
                                value={customHiveData.brood_pattern}
                                onChange={(e) => setCustomHiveData(prev => ({
                                    ...prev,
                                    brood_pattern: e.target.value
                                }))}
                                className="form-select"
                            >
                                <option value="none">لا يوجد</option>
                                <option value="poor">ضعيف</option>
                                <option value="fair">مقبول</option>
                                <option value="good">جيد</option>
                                <option value="excellent">ممتاز</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">نوع الخلية</label>
                            <select
                                value={customHiveData.hive_type}
                                onChange={(e) => setCustomHiveData(prev => ({
                                    ...prev,
                                    hive_type: e.target.value
                                }))}
                                className="form-select"
                            >
                                <option value="langstroth">لانجستروث</option>
                                <option value="dadant">دادان</option>
                                <option value="top_bar">شريط علوي</option>
                                <option value="warre">وارية</option>
                                <option value="national">وطني</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Calculate Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="btn-primary btn-lg disabled:opacity-50"
                >
                    {loading ? (
                        <div className="flex items-center">
                            <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
                            جاري الحساب...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <Calculator className="w-5 h-5 ml-2" />
                            احسب الكميات
                        </div>
                    )}
                </button>
            </div>

            {/* Results */}
            {calculation && (
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary-900">
                                نتائج الحساب - {selectedFeedingType?.label}
                            </h3>
                            <div className="text-2xl">{selectedFeedingType?.icon}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary-600">
                                    {calculation.total_cost.toFixed(2)}
                                </div>
                                <div className="text-sm text-primary-700">ريال سعودي</div>
                                <div className="text-xs text-primary-600">التكلفة الإجمالية</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-success-600">
                                    {Object.keys(calculation.amounts).length}
                                </div>
                                <div className="text-sm text-success-700">مكونات</div>
                                <div className="text-xs text-success-600">المطلوبة</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-warning-600">
                                    {(calculation.multipliers.total * 100).toFixed(0)}%
                                </div>
                                <div className="text-sm text-warning-700">معامل التعديل</div>
                                <div className="text-xs text-warning-600">حسب الحالة</div>
                            </div>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Scale className="w-5 h-5 ml-2" />
                            المكونات والكميات
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(calculation.amounts).map(([ingredient, amount]) => (
                                <div key={ingredient} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <span className="text-2xl ml-3">{getIngredientIcon(ingredient)}</span>
                                        <div>
                                            <div className="font-medium text-gray-900 capitalize">
                                                {ingredient.replace('_', ' ')}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {getIngredientUnit(ingredient)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-primary-600">
                                            {amount.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {getIngredientUnit(ingredient)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Multipliers */}
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Info className="w-5 h-5 ml-2" />
                            معاملات التعديل
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(calculation.multipliers).map(([factor, value]) => {
                                if (factor === 'total') return null;

                                const labels = {
                                    population: 'قوة الطائفة',
                                    food_stores: 'مخزون الغذاء',
                                    brood: 'نمط الحضنة',
                                    seasonal: 'الموسم',
                                    weather: 'الطقس'
                                };

                                return (
                                    <div key={factor} className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-lg font-bold text-gray-900">
                                            {(value * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {labels[factor]}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recommendations */}
                    {calculation.recommendations && calculation.recommendations.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Lightbulb className="w-5 h-5 ml-2" />
                                التوصيات
                            </h3>

                            <div className="space-y-3">
                                {calculation.recommendations.map((recommendation, index) => (
                                    <div key={index} className="flex items-start p-3 bg-warning-50 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 ml-3 flex-shrink-0" />
                                        <p className="text-warning-800">{recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveFeeding}
                            className="btn-success flex-1"
                        >
                            <Save className="w-4 h-4 ml-2" />
                            حفظ خطة التغذية
                        </button>

                        <button
                            onClick={() => {/* Navigate to shopping list */ }}
                            className="btn-outline flex-1"
                        >
                            <ShoppingCart className="w-4 h-4 ml-2" />
                            قائمة التسوق
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedingCalculator;