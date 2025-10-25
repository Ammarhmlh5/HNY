import React, { useState, useEffect } from 'react';
import {
    ArrowRight,
    Save,
    Calculator,
    BookOpen,
    Calendar,
    DollarSign,
    Droplets,
    Scale,
    Clock,
    Target
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

// Import components
import FeedingCalculator from '../../components/Feeding/FeedingCalculator';
import RecipesList from '../../components/Feeding/RecipesList';

const NewFeeding = () => {
    const navigate = useNavigate();
    const { hiveId } = useParams();
    const [step, setStep] = useState(1);
    const [hives, setHives] = useState([]);
    const [selectedHive, setSelectedHive] = useState(null);
    const [calculation, setCalculation] = useState(null);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            feeding_type: 'sugar_syrup',
            feeding_method: 'top_feeder',
            status: 'planned',
            feeding_date: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        loadHives();
        if (hiveId) {
            loadHiveData(hiveId);
        }
    }, [hiveId]);

    const loadHives = async () => {
        try {
            const response = await axios.get('/api/hives');
            setHives(response.data.data.hives || []);
        } catch (error) {
            toast.error('خطأ في تحميل الخلايا');
        }
    };

    const loadHiveData = async (id) => {
        try {
            const response = await axios.get(`/api/hives/${id}`);
            setSelectedHive(response.data.data);
            setValue('hive_id', parseInt(id));
        } catch (error) {
            toast.error('خطأ في تحميل بيانات الخلية');
        }
    };

    const handleHiveSelect = (hiveId) => {
        const hive = hives.find(h => h.id === parseInt(hiveId));
        setSelectedHive(hive);
        setValue('hive_id', parseInt(hiveId));
    };

    const handleCalculationComplete = (result) => {
        setCalculation(result);
        setValue('ingredients', result.amounts);
        setValue('total_cost', result.total_cost);
        setStep(3);
    };

    const handleRecipeSelect = (recipeKey, recipe) => {
        setSelectedRecipe({ key: recipeKey, ...recipe });
        setValue('recipe_name', recipe.name);
        setValue('feeding_type', recipeKey.includes('syrup') ? 'sugar_syrup' :
            recipeKey.includes('patty') ? 'pollen_patty' : 'custom');

        // Set ingredients from recipe
        const ingredients = {};
        Object.entries(recipe.ingredients).forEach(([ingredient, details]) => {
            ingredients[ingredient] = details.amount;
        });
        setValue('ingredients', ingredients);
        setValue('total_cost', recipe.cost_per_liter || recipe.cost_per_kg || 0);

        setStep(3);
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const feedingData = {
                ...data,
                hive_id: selectedHive?.id,
                apiary_id: selectedHive?.apiary_id
            };

            await axios.post('/api/feeding', feedingData);

            toast.success('تم إنشاء سجل التغذية بنجاح');
            navigate('/feeding');
        } catch (error) {
            toast.error('خطأ في إنشاء سجل التغذية');
            console.error('Error creating feeding:', error);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: 'اختيار الخلية', icon: Target },
        { id: 2, title: 'تحديد التغذية', icon: Calculator },
        { id: 3, title: 'تفاصيل التغذية', icon: Droplets },
        { id: 4, title: 'المراجعة والحفظ', icon: Save }
    ];

    const feedingTypes = [
        { value: 'sugar_syrup', label: 'محلول سكري', icon: '🍯' },
        { value: 'honey_syrup', label: 'محلول عسل', icon: '🐝' },
        { value: 'pollen_patty', label: 'عجينة حبوب لقاح', icon: '🌼' },
        { value: 'protein_patty', label: 'عجينة بروتين', icon: '🥜' },
        { value: 'emergency_feeding', label: 'تغذية طارئة', icon: '🚨' },
        { value: 'winter_feeding', label: 'تغذية شتوية', icon: '❄️' },
        { value: 'stimulative_feeding', label: 'تغذية محفزة', icon: '⚡' },
        { value: 'maintenance_feeding', label: 'تغذية صيانة', icon: '🔧' }
    ];

    const feedingMethods = [
        { value: 'top_feeder', label: 'غذاية علوية' },
        { value: 'entrance_feeder', label: 'غذاية مدخل' },
        { value: 'boardman_feeder', label: 'غذاية بوردمان' },
        { value: 'frame_feeder', label: 'غذاية إطار' },
        { value: 'baggie_feeder', label: 'غذاية كيس' },
        { value: 'patty_placement', label: 'وضع عجينة' }
    ];

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Target className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                اختر الخلية المراد تغذيتها
                            </h2>
                            <p className="text-gray-600">
                                حدد الخلية التي تريد إنشاء سجل تغذية لها
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {hives.map((hive) => (
                                <button
                                    key={hive.id}
                                    onClick={() => handleHiveSelect(hive.id)}
                                    className={clsx(
                                        'p-4 border-2 rounded-lg text-right transition-all duration-200',
                                        selectedHive?.id === hive.id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{hive.name}</h3>
                                        <div className="text-2xl">🏠</div>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>المنحل: {hive.apiary?.name}</div>
                                        <div>النوع: {hive.hive_type}</div>
                                        {hive.population_strength && (
                                            <div>القوة: {hive.population_strength}</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedHive && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setStep(2)}
                                    className="btn-primary"
                                >
                                    التالي: تحديد التغذية
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Calculator className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                حدد نوع وكمية التغذية
                            </h2>
                            <p className="text-gray-600">
                                استخدم الحاسبة أو اختر وصفة جاهزة
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Calculator Option */}
                            <div className="card">
                                <div className="text-center mb-4">
                                    <Calculator className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900">حاسبة التغذية</h3>
                                    <p className="text-sm text-gray-600">احسب الكميات المناسبة</p>
                                </div>

                                <FeedingCalculator
                                    hiveData={selectedHive}
                                    onCalculationComplete={handleCalculationComplete}
                                    className="max-h-96 overflow-y-auto"
                                />
                            </div>

                            {/* Recipe Option */}
                            <div className="card">
                                <div className="text-center mb-4">
                                    <BookOpen className="w-8 h-8 text-warning-600 mx-auto mb-2" />
                                    <h3 className="font-semibold text-gray-900">الوصفات الجاهزة</h3>
                                    <p className="text-sm text-gray-600">اختر من الوصفات المجربة</p>
                                </div>

                                <RecipesList
                                    onRecipeSelect={handleRecipeSelect}
                                    selectedRecipe={selectedRecipe?.key}
                                    className="max-h-96 overflow-y-auto"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Droplets className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                تفاصيل التغذية
                            </h2>
                            <p className="text-gray-600">
                                أكمل المعلومات المطلوبة لسجل التغذية
                            </p>
                        </div>

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Feeding Type */}
                                <div>
                                    <label className="form-label">نوع التغذية</label>
                                    <select
                                        {...register('feeding_type', { required: 'نوع التغذية مطلوب' })}
                                        className="form-select"
                                    >
                                        {feedingTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.feeding_type && (
                                        <p className="form-error">{errors.feeding_type.message}</p>
                                    )}
                                </div>

                                {/* Feeding Method */}
                                <div>
                                    <label className="form-label">طريقة التغذية</label>
                                    <select
                                        {...register('feeding_method', { required: 'طريقة التغذية مطلوبة' })}
                                        className="form-select"
                                    >
                                        {feedingMethods.map((method) => (
                                            <option key={method.value} value={method.value}>
                                                {method.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.feeding_method && (
                                        <p className="form-error">{errors.feeding_method.message}</p>
                                    )}
                                </div>

                                {/* Feeding Date */}
                                <div>
                                    <label className="form-label">تاريخ التغذية</label>
                                    <input
                                        type="date"
                                        {...register('feeding_date', { required: 'تاريخ التغذية مطلوب' })}
                                        className="form-input"
                                    />
                                    {errors.feeding_date && (
                                        <p className="form-error">{errors.feeding_date.message}</p>
                                    )}
                                </div>

                                {/* Total Cost */}
                                <div>
                                    <label className="form-label">التكلفة الإجمالية (ريال)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('total_cost', {
                                            required: 'التكلفة مطلوبة',
                                            min: { value: 0, message: 'التكلفة يجب أن تكون أكبر من صفر' }
                                        })}
                                        className="form-input"
                                    />
                                    {errors.total_cost && (
                                        <p className="form-error">{errors.total_cost.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Recipe Name (if selected) */}
                            {selectedRecipe && (
                                <div>
                                    <label className="form-label">اسم الوصفة</label>
                                    <input
                                        type="text"
                                        {...register('recipe_name')}
                                        className="form-input"
                                        readOnly
                                    />
                                </div>
                            )}

                            {/* Ingredients Display */}
                            {(calculation || selectedRecipe) && (
                                <div>
                                    <label className="form-label">المكونات</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(watch('ingredients') || {}).map(([ingredient, amount]) => (
                                            <div key={ingredient} className="p-3 bg-gray-50 rounded-lg text-center">
                                                <div className="font-medium text-gray-900 capitalize">
                                                    {ingredient.replace('_', ' ')}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {amount} {ingredient === 'water' ? 'مل' : 'جرام'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="form-label">ملاحظات (اختياري)</label>
                                <textarea
                                    {...register('notes')}
                                    rows={3}
                                    className="form-input"
                                    placeholder="أي ملاحظات إضافية حول التغذية..."
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="form-label">حالة التغذية</label>
                                <select
                                    {...register('status')}
                                    className="form-select"
                                >
                                    <option value="planned">مخطط</option>
                                    <option value="completed">مكتمل</option>
                                </select>
                            </div>
                        </form>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setStep(4)}
                                className="btn-primary"
                            >
                                التالي: المراجعة
                            </button>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <Save className="w-12 h-12 text-success-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                مراجعة وحفظ
                            </h2>
                            <p className="text-gray-600">
                                راجع المعلومات قبل الحفظ
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص التغذية</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">معلومات الخلية</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div>الخلية: {selectedHive?.name}</div>
                                        <div>المنحل: {selectedHive?.apiary?.name}</div>
                                        <div>النوع: {selectedHive?.hive_type}</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">تفاصيل التغذية</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div>النوع: {feedingTypes.find(t => t.value === watch('feeding_type'))?.label}</div>
                                        <div>الطريقة: {feedingMethods.find(m => m.value === watch('feeding_method'))?.label}</div>
                                        <div>التاريخ: {watch('feeding_date')}</div>
                                        <div>التكلفة: {watch('total_cost')} ريال</div>
                                    </div>
                                </div>
                            </div>

                            {watch('ingredients') && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-2">المكونات</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(watch('ingredients')).map(([ingredient, amount]) => (
                                            <div key={ingredient} className="p-2 bg-gray-50 rounded text-center">
                                                <div className="font-medium text-gray-900 capitalize text-sm">
                                                    {ingredient.replace('_', ' ')}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {amount} {ingredient === 'water' ? 'مل' : 'جرام'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {watch('notes') && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-2">الملاحظات</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                        {watch('notes')}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={loading}
                                className="btn-success disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="spinner ml-2"></div>
                                        جاري الحفظ...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <Save className="w-4 h-4 ml-2" />
                                        حفظ سجل التغذية
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/feeding')}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                >
                    <ArrowRight className="w-5 h-5 ml-1" />
                    العودة لإدارة التغذية
                </button>

                <h1 className="text-2xl font-bold text-gray-900">تغذية جديدة</h1>

                <div className="w-24"></div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4 space-x-reverse">
                    {steps.map((stepItem, index) => {
                        const Icon = stepItem.icon;
                        const isActive = step === stepItem.id;
                        const isCompleted = step > stepItem.id;

                        return (
                            <React.Fragment key={stepItem.id}>
                                <div className="flex items-center">
                                    <div className={clsx(
                                        'w-10 h-10 rounded-full flex items-center justify-center',
                                        isActive ? 'bg-primary-600 text-white' :
                                            isCompleted ? 'bg-success-600 text-white' :
                                                'bg-gray-200 text-gray-600'
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="mr-3 text-sm">
                                        <div className={clsx(
                                            'font-medium',
                                            isActive ? 'text-primary-600' :
                                                isCompleted ? 'text-success-600' :
                                                    'text-gray-600'
                                        )}>
                                            {stepItem.title}
                                        </div>
                                    </div>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className={clsx(
                                        'w-8 h-0.5',
                                        step > stepItem.id ? 'bg-success-600' : 'bg-gray-200'
                                    )}></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="min-h-96">
                {renderStepContent()}
            </div>

            {/* Navigation */}
            {step > 1 && step < 4 && (
                <div className="flex justify-between">
                    <button
                        onClick={() => setStep(step - 1)}
                        className="btn-outline"
                    >
                        السابق
                    </button>

                    <div></div>
                </div>
            )}
        </div>
    );
};

export default NewFeeding;