import React, { useState, useEffect } from 'react';
import {
    Users,
    Calculator,
    ShoppingCart,
    DollarSign,
    Package,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Plus,
    Minus,
    Download,
    Save
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const BulkFeedingCalculator = ({ hives = [], onCalculationComplete, className }) => {
    const [selectedHives, setSelectedHives] = useState([]);
    const [feedingType, setFeedingType] = useState('sugar_syrup');
    const [season, setSeason] = useState('');
    const [calculation, setCalculation] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Auto-detect season
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) setSeason('spring');
        else if (month >= 6 && month <= 8) setSeason('summer');
        else if (month >= 9 && month <= 11) setSeason('autumn');
        else setSeason('winter');

        // Select all hives by default
        setSelectedHives(hives.map(hive => hive.id));
    }, [hives]);

    const feedingTypes = [
        { value: 'sugar_syrup', label: 'محلول سكري', icon: '🍯' },
        { value: 'honey_syrup', label: 'محلول عسل', icon: '🐝' },
        { value: 'pollen_patty', label: 'عجينة حبوب لقاح', icon: '🌼' },
        { value: 'protein_patty', label: 'عجينة بروتين', icon: '🥜' },
        { value: 'emergency_feeding', label: 'تغذية طارئة', icon: '🚨' },
        { value: 'winter_feeding', label: 'تغذية شتوية', icon: '❄️' }
    ];

    const handleHiveToggle = (hiveId) => {
        setSelectedHives(prev =>
            prev.includes(hiveId)
                ? prev.filter(id => id !== hiveId)
                : [...prev, hiveId]
        );
    };

    const selectAllHives = () => {
        setSelectedHives(hives.map(hive => hive.id));
    };

    const deselectAllHives = () => {
        setSelectedHives([]);
    };

    const handleCalculate = async () => {
        if (selectedHives.length === 0) {
            toast.error('يرجى اختيار خلية واحدة على الأقل');
            return;
        }

        try {
            setLoading(true);

            const hivesData = hives
                .filter(hive => selectedHives.includes(hive.id))
                .map(hive => ({
                    hive_id: hive.id,
                    hive_name: hive.name,
                    population_strength: hive.population_strength || 'moderate',
                    food_stores: hive.food_stores || 'adequate',
                    brood_pattern: hive.brood_pattern || 'good',
                    hive_type: hive.hive_type || 'langstroth'
                }));

            const requestData = {
                hives_data: hivesData,
                feeding_type: feedingType,
                season: season
            };

            const response = await axios.post('/api/feeding/calculate-bulk', requestData);
            setCalculation(response.data.data);

            if (onCalculationComplete) {
                onCalculationComplete(response.data.data);
            }

            toast.success('تم حساب التغذية الجماعية بنجاح');
        } catch (error) {
            toast.error('خطأ في حساب التغذية الجماعية');
            console.error('Error calculating bulk feeding:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBulkFeeding = async () => {
        if (!calculation) return;

        try {
            const batchId = `bulk_${Date.now()}`;

            // Create feeding records for each hive
            const promises = calculation.hive_calculations.map(hiveCalc => {
                return axios.post('/api/feeding', {
                    hive_id: hiveCalc.hive_id,
                    feeding_type: feedingType,
                    ingredients: hiveCalc.amounts,
                    total_cost: hiveCalc.total_cost,
                    feeding_method: 'top_feeder',
                    status: 'planned',
                    batch_id: batchId,
                    notes: `تغذية جماعية - ${calculation.recommendations.join('. ')}`
                });
            });

            await Promise.all(promises);
            toast.success('تم حفظ خطة التغذية الجماعية');
        } catch (error) {
            toast.error('خطأ في حفظ خطة التغذية الجماعية');
        }
    };

    const exportShoppingList = () => {
        if (!calculation) return;

        const shoppingListText = `
قائمة التسوق - التغذية الجماعية
التاريخ: ${new Date().toLocaleDateString('ar-SA')}
نوع التغذية: ${feedingTypes.find(t => t.value === feedingType)?.label}
عدد الخلايا: ${selectedHives.length}

المواد المطلوبة:
${Object.entries(calculation.shopping_list).map(([ingredient, details]) =>
            `${ingredient}: ${details.packages_needed} عبوة (${details.package_size} ${details.unit}) - ${details.total_cost} ريال`
        ).join('\n')}

التكلفة الإجمالية: ${calculation.total_cost.toFixed(2)} ريال

التوصيات:
${calculation.recommendations.map(rec => `- ${rec}`).join('\n')}
    `;

        const blob = new Blob([shoppingListText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `قائمة_التسوق_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getHiveStatusColor = (hive) => {
        if (hive.food_stores === 'critical' || hive.food_stores === 'none') return 'danger';
        if (hive.population_strength === 'very_weak') return 'danger';
        if (hive.food_stores === 'low' || hive.population_strength === 'weak') return 'warning';
        return 'success';
    };

    return (
        <div className={clsx('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center ml-3">
                        <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">حاسبة التغذية الجماعية</h2>
                        <p className="text-gray-600">احسب التغذية لعدة خلايا معاً</p>
                    </div>
                </div>
            </div>

            {/* Hive Selection */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">اختيار الخلايا</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={selectAllHives}
                            className="btn-outline btn-sm"
                        >
                            تحديد الكل
                        </button>
                        <button
                            onClick={deselectAllHives}
                            className="btn-outline btn-sm"
                        >
                            إلغاء التحديد
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hives.map((hive) => {
                        const isSelected = selectedHives.includes(hive.id);
                        const statusColor = getHiveStatusColor(hive);

                        return (
                            <div
                                key={hive.id}
                                onClick={() => handleHiveToggle(hive.id)}
                                className={clsx(
                                    'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
                                    isSelected
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleHiveToggle(hive.id)}
                                            className="form-checkbox ml-2"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <h4 className="font-medium text-gray-900">{hive.name}</h4>
                                    </div>

                                    <div className={clsx(
                                        'w-3 h-3 rounded-full',
                                        `bg-${statusColor}-500`
                                    )} />
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                    <div>المنحل: {hive.apiary?.name}</div>
                                    <div>القوة: {hive.population_strength || 'غير محدد'}</div>
                                    <div>المخزون: {hive.food_stores || 'غير محدد'}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedHives.length > 0 && (
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                        <p className="text-primary-800 font-medium">
                            تم اختيار {selectedHives.length} خلية من {hives.length}
                        </p>
                    </div>
                )}
            </div>

            {/* Feeding Type Selection */}
            <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">نوع التغذية</h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {feedingTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setFeedingType(type.value)}
                            className={clsx(
                                'p-4 rounded-lg border-2 text-center transition-all duration-200',
                                feedingType === type.value
                                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            )}
                        >
                            <div className="text-2xl mb-2">{type.icon}</div>
                            <div className="text-sm font-medium">{type.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Calculate Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleCalculate}
                    disabled={loading || selectedHives.length === 0}
                    className="btn-primary btn-lg disabled:opacity-50"
                >
                    {loading ? (
                        <div className="flex items-center">
                            <Calculator className="w-5 h-5 ml-2 animate-spin" />
                            جاري الحساب...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <Calculator className="w-5 h-5 ml-2" />
                            احسب التغذية الجماعية
                        </div>
                    )}
                </button>
            </div>

            {/* Results */}
            {calculation && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="card bg-gradient-to-r from-success-50 to-success-100 border-success-200">
                        <h3 className="text-lg font-semibold text-success-900 mb-4">
                            ملخص التغذية الجماعية
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-success-600">
                                    {selectedHives.length}
                                </div>
                                <div className="text-sm text-success-700">خلية</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-success-600">
                                    {calculation.total_cost.toFixed(2)}
                                </div>
                                <div className="text-sm text-success-700">ريال إجمالي</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-success-600">
                                    {Object.keys(calculation.total_amounts).length}
                                </div>
                                <div className="text-sm text-success-700">مكونات</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-success-600">
                                    {(calculation.total_cost / selectedHives.length).toFixed(2)}
                                </div>
                                <div className="text-sm text-success-700">ريال/خلية</div>
                            </div>
                        </div>
                    </div>

                    {/* Shopping List */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <ShoppingCart className="w-5 h-5 ml-2" />
                                قائمة التسوق
                            </h3>
                            <button
                                onClick={exportShoppingList}
                                className="btn-outline btn-sm"
                            >
                                <Download className="w-4 h-4 ml-1" />
                                تصدير
                            </button>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(calculation.shopping_list).map(([ingredient, details]) => (
                                <div key={ingredient} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Package className="w-5 h-5 text-gray-600 ml-3" />
                                        <div>
                                            <h4 className="font-medium text-gray-900 capitalize">
                                                {ingredient.replace('_', ' ')}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                مطلوب: {details.needed_amount.toLocaleString()} {details.unit}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg font-bold text-primary-600">
                                            {details.packages_needed} عبوة
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {details.package_size} {details.unit} × {details.unit_price} ريال
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
                                            المجموع: {details.total_cost} ريال
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>إجمالي قائمة التسوق:</span>
                                    <span className="text-primary-600">
                                        {Object.values(calculation.shopping_list)
                                            .reduce((sum, item) => sum + item.total_cost, 0)
                                            .toFixed(2)} ريال
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Individual Hive Calculations */}
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            تفاصيل كل خلية
                        </h3>

                        <div className="space-y-4">
                            {calculation.hive_calculations.map((hiveCalc) => (
                                <div key={hiveCalc.hive_id} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900">{hiveCalc.hive_name}</h4>
                                        <div className="text-lg font-bold text-primary-600">
                                            {hiveCalc.total_cost.toFixed(2)} ريال
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        {Object.entries(hiveCalc.amounts).map(([ingredient, amount]) => (
                                            <div key={ingredient} className="text-center p-2 bg-gray-50 rounded">
                                                <div className="font-medium text-gray-900">
                                                    {amount.toLocaleString()}
                                                </div>
                                                <div className="text-gray-600 capitalize">
                                                    {ingredient.replace('_', ' ')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    {calculation.recommendations && calculation.recommendations.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <AlertTriangle className="w-5 h-5 ml-2" />
                                توصيات التغذية الجماعية
                            </h3>

                            <div className="space-y-3">
                                {calculation.recommendations.map((recommendation, index) => (
                                    <div key={index} className="flex items-start p-3 bg-warning-50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-warning-600 mt-0.5 ml-3 flex-shrink-0" />
                                        <p className="text-warning-800">{recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveBulkFeeding}
                            className="btn-success flex-1"
                        >
                            <Save className="w-4 h-4 ml-2" />
                            حفظ خطة التغذية الجماعية
                        </button>

                        <button
                            onClick={exportShoppingList}
                            className="btn-outline flex-1"
                        >
                            <Download className="w-4 h-4 ml-2" />
                            تصدير قائمة التسوق
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkFeedingCalculator;