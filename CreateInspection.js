import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowRight,
    Clock,
    Thermometer,
    Cloud,
    Wind,
    Droplets,
    Plus,
    X,
    Camera,
    Mic,
    Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const CreateInspection = () => {
    const { hiveId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [inspectionType, setInspectionType] = useState('detailed');
    const [diseases, setDiseases] = useState([]);
    const [pests, setPests] = useState([]);
    const [photos, setPhotos] = useState([]);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            inspection_type: 'routine',
            inspection_date: new Date().toISOString().split('T')[0],
            weather_conditions: {
                temperature: '',
                humidity: '',
                wind_speed: '',
                condition: 'sunny'
            }
        }
    });

    // قوائم الأمراض والآفات الشائعة
    const commonDiseases = [
        'الفاروا (Varroa)',
        'النوزيما (Nosema)',
        'الطباشير الأمريكي (American Foulbrood)',
        'الطباشير الأوروبي (European Foulbrood)',
        'الطباشير الطباشيري (Chalkbrood)',
        'فيروس الجناح المشوه (DWV)',
        'فيروس الشلل الأسود (BQCV)'
    ];

    const commonPests = [
        'دودة الشمع الكبيرة',
        'دودة الشمع الصغيرة',
        'النمل',
        'الدبابير',
        'العث',
        'الخنافس',
        'العناكب'
    ];

    const weatherConditions = [
        { value: 'sunny', label: 'مشمس' },
        { value: 'partly_cloudy', label: 'غائم جزئياً' },
        { value: 'cloudy', label: 'غائم' },
        { value: 'rainy', label: 'ممطر' },
        { value: 'windy', label: 'عاصف' },
        { value: 'foggy', label: 'ضبابي' }
    ];

    // إضافة مرض
    const addDisease = (disease) => {
        if (!diseases.includes(disease)) {
            setDiseases([...diseases, disease]);
        }
    };

    // إزالة مرض
    const removeDisease = (disease) => {
        setDiseases(diseases.filter(d => d !== disease));
    };

    // إضافة آفة
    const addPest = (pest) => {
        if (!pests.includes(pest)) {
            setPests([...pests, pest]);
        }
    };

    // إزالة آفة
    const removePest = (pest) => {
        setPests(pests.filter(p => p !== pest));
    };

    // التقاط صورة
    const takePhoto = () => {
        const newPhoto = {
            id: Date.now(),
            url: '/placeholder-image.jpg',
            timestamp: new Date(),
            description: ''
        };
        setPhotos([...photos, newPhoto]);
        toast.success('تم التقاط الصورة');
    };

    // إزالة صورة
    const removePhoto = (photoId) => {
        setPhotos(photos.filter(p => p.id !== photoId));
    };

    // إرسال الفحص
    const onSubmit = async (data) => {
        setIsLoading(true);

        try {
            const inspectionData = {
                ...data,
                diseases_found: diseases,
                pests_found: pests,
                photos: photos.map(p => p.url),
                weather_conditions: {
                    ...data.weather_conditions,
                    temperature: parseFloat(data.weather_conditions.temperature) || null,
                    humidity: parseFloat(data.weather_conditions.humidity) || null,
                    wind_speed: parseFloat(data.weather_conditions.wind_speed) || null
                }
            };

            // في التطبيق الحقيقي: await axios.post(`/api/inspections/hive/${hiveId}`, inspectionData);
            console.log('Detailed inspection data:', inspectionData);

            // محاكاة استدعاء API
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast.success('تم حفظ الفحص المفصل بنجاح');
            navigate(`/hives/${hiveId}`);
        } catch (error) {
            toast.error('حدث خطأ في حفظ الفحص');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(`/hives/${hiveId}`)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowRight className="h-4 w-4 ml-1" />
                    العودة للخلية
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">فحص مفصل</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            فحص شامل مع جميع التفاصيل والملاحظات
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/hives/${hiveId}/inspections/quick`)}
                            className="btn-outline"
                        >
                            الفحص السريع
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* معلومات أساسية */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">معلومات الفحص</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="inspection_date" className="form-label">
                                تاريخ الفحص *
                            </label>
                            <input
                                type="date"
                                id="inspection_date"
                                className="form-input"
                                {...register('inspection_date', { required: 'تاريخ الفحص مطلوب' })}
                            />
                            {errors.inspection_date && (
                                <p className="form-error">{errors.inspection_date.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="inspection_type" className="form-label">
                                نوع الفحص *
                            </label>
                            <select
                                id="inspection_type"
                                className="form-input"
                                {...register('inspection_type', { required: 'نوع الفحص مطلوب' })}
                            >
                                <option value="routine">فحص دوري</option>
                                <option value="disease_check">فحص الأمراض</option>
                                <option value="harvest">فحص الحصاد</option>
                                <option value="feeding">فحص التغذية</option>
                                <option value="treatment">فحص العلاج</option>
                                <option value="emergency">فحص طارئ</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="duration" className="form-label">
                                مدة الفحص (دقيقة)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                min="1"
                                max="300"
                                className="form-input"
                                placeholder="30"
                                {...register('duration_minutes')}
                            />
                        </div>
                    </div>
                </div>

                {/* الظروف الجوية */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Cloud className="h-5 w-5 ml-2" />
                            الظروف الجوية
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="form-label flex items-center">
                                <Thermometer className="h-4 w-4 ml-1" />
                                درجة الحرارة (°م)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                className="form-input"
                                placeholder="25.5"
                                {...register('weather_conditions.temperature')}
                            />
                        </div>

                        <div>
                            <label className="form-label flex items-center">
                                <Droplets className="h-4 w-4 ml-1" />
                                الرطوبة (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="form-input"
                                placeholder="65"
                                {...register('weather_conditions.humidity')}
                            />
                        </div>

                        <div>
                            <label className="form-label flex items-center">
                                <Wind className="h-4 w-4 ml-1" />
                                سرعة الرياح (كم/س)
                            </label>
                            <input
                                type="number"
                                min="0"
                                className="form-input"
                                placeholder="10"
                                {...register('weather_conditions.wind_speed')}
                            />
                        </div>

                        <div>
                            <label className="form-label">حالة الطقس</label>
                            <select
                                className="form-input"
                                {...register('weather_conditions.condition')}
                            >
                                {weatherConditions.map(condition => (
                                    <option key={condition.value} value={condition.value}>
                                        {condition.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* الأسئلة الأساسية */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">التقييم الأساسي</h3>
                    </div>

                    <div className="space-y-6">
                        {/* وجود الملكة */}
                        <div>
                            <label className="form-label">وجود الملكة *</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                {[
                                    { value: 'yes', label: 'نعم، موجودة' },
                                    { value: 'not_seen', label: 'لم أرها' },
                                    { value: 'no', label: 'غير موجودة' },
                                    { value: 'unknown', label: 'غير متأكد' }
                                ].map(option => (
                                    <label key={option.value} className="flex items-center">
                                        <input
                                            type="radio"
                                            value={option.value}
                                            className="form-radio"
                                            {...register('queen_present', { required: 'وجود الملكة مطلوب' })}
                                        />
                                        <span className="mr-2 text-sm">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.queen_present && (
                                <p className="form-error">{errors.queen_present.message}</p>
                            )}
                        </div>

                        {/* وضع البيض */}
                        <div>
                            <label className="form-label">وضع البيض *</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                {[
                                    { value: 'yes', label: 'نعم، جيد' },
                                    { value: 'poor', label: 'ضعيف' },
                                    { value: 'no', label: 'لا يوجد' },
                                    { value: 'unknown', label: 'غير متأكد' }
                                ].map(option => (
                                    <label key={option.value} className="flex items-center">
                                        <input
                                            type="radio"
                                            value={option.value}
                                            className="form-radio"
                                            {...register('queen_laying', { required: 'وضع البيض مطلوب' })}
                                        />
                                        <span className="mr-2 text-sm">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.queen_laying && (
                                <p className="form-error">{errors.queen_laying.message}</p>
                            )}
                        </div>

                        {/* نمط الحضنة */}
                        <div>
                            <label className="form-label">نمط الحضنة *</label>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2">
                                {[
                                    { value: 'excellent', label: 'ممتاز' },
                                    { value: 'good', label: 'جيد' },
                                    { value: 'fair', label: 'مقبول' },
                                    { value: 'poor', label: 'ضعيف' },
                                    { value: 'none', label: 'لا يوجد' }
                                ].map(option => (
                                    <label key={option.value} className="flex items-center">
                                        <input
                                            type="radio"
                                            value={option.value}
                                            className="form-radio"
                                            {...register('brood_pattern', { required: 'نمط الحضنة مطلوب' })}
                                        />
                                        <span className="mr-2 text-sm">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.brood_pattern && (
                                <p className="form-error">{errors.brood_pattern.message}</p>
                            )}
                        </div>

                        {/* قوة الطائفة */}
                        <div>
                            <label className="form-label">قوة الطائفة *</label>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2">
                                {[
                                    { value: 'very_strong', label: 'قوية جداً' },
                                    { value: 'strong', label: 'قوية' },
                                    { value: 'moderate', label: 'متوسطة' },
                                    { value: 'weak', label: 'ضعيفة' },
                                    { value: 'very_weak', label: 'ضعيفة جداً' }
                                ].map(option => (
                                    <label key={option.value} className="flex items-center">
                                        <input
                                            type="radio"
                                            value={option.value}
                                            className="form-radio"
                                            {...register('population_strength', { required: 'قوة الطائفة مطلوبة' })}
                                        />
                                        <span className="mr-2 text-sm">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.population_strength && (
                                <p className="form-error">{errors.population_strength.message}</p>
                            )}
                        </div>

                        {/* مخزون الغذاء */}
                        <div>
                            <label className="form-label">مخزون الغذاء *</label>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2">
                                {[
                                    { value: 'abundant', label: 'وفير' },
                                    { value: 'adequate', label: 'كافي' },
                                    { value: 'low', label: 'قليل' },
                                    { value: 'critical', label: 'حرج' },
                                    { value: 'none', label: 'لا يوجد' }
                                ].map(option => (
                                    <label key={option.value} className="flex items-center">
                                        <input
                                            type="radio"
                                            value={option.value}
                                            className="form-radio"
                                            {...register('food_stores', { required: 'مخزون الغذاء مطلوب' })}
                                        />
                                        <span className="mr-2 text-sm">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.food_stores && (
                                <p className="form-error">{errors.food_stores.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* الأمراض والآفات */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* الأمراض */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">الأمراض المكتشفة</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {diseases.map(disease => (
                                    <span
                                        key={disease}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-danger-100 text-danger-800"
                                    >
                                        {disease}
                                        <button
                                            type="button"
                                            onClick={() => removeDisease(disease)}
                                            className="mr-2 text-danger-600 hover:text-danger-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div>
                                <label className="form-label">إضافة مرض</label>
                                <select
                                    className="form-input"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addDisease(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                >
                                    <option value="">اختر مرض...</option>
                                    {commonDiseases.filter(d => !diseases.includes(d)).map(disease => (
                                        <option key={disease} value={disease}>{disease}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* الآفات */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">الآفات المكتشفة</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {pests.map(pest => (
                                    <span
                                        key={pest}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-warning-100 text-warning-800"
                                    >
                                        {pest}
                                        <button
                                            type="button"
                                            onClick={() => removePest(pest)}
                                            className="mr-2 text-warning-600 hover:text-warning-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div>
                                <label className="form-label">إضافة آفة</label>
                                <select
                                    className="form-input"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addPest(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                >
                                    <option value="">اختر آفة...</option>
                                    {commonPests.filter(p => !pests.includes(p)).map(pest => (
                                        <option key={pest} value={pest}>{pest}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* الصور والوسائط */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">الصور والوسائط</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={takePhoto}
                                className="btn-outline"
                            >
                                <Camera className="h-4 w-4 ml-2" />
                                التقاط صورة
                            </button>

                            <button
                                type="button"
                                className="btn-outline"
                            >
                                <Mic className="h-4 w-4 ml-2" />
                                تسجيل صوتي
                            </button>
                        </div>

                        {photos.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {photos.map(photo => (
                                    <div key={photo.id} className="relative">
                                        <img
                                            src={photo.url}
                                            alt="صورة الفحص"
                                            className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(photo.id)}
                                            className="absolute -top-2 -left-2 bg-danger-500 text-white rounded-full p-1 hover:bg-danger-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* الملاحظات */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">الملاحظات والتفاصيل</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="notes" className="form-label">
                                ملاحظات عامة
                            </label>
                            <textarea
                                id="notes"
                                rows={4}
                                className="form-input"
                                placeholder="أي ملاحظات أو تفاصيل إضافية حول الفحص..."
                                {...register('notes')}
                            />
                        </div>

                        <div>
                            <label htmlFor="actions_taken" className="form-label">
                                الإجراءات المتخذة
                            </label>
                            <textarea
                                id="actions_taken"
                                rows={3}
                                className="form-input"
                                placeholder="الإجراءات التي تم اتخاذها أثناء الفحص..."
                                {...register('actions_taken')}
                            />
                        </div>
                    </div>
                </div>

                {/* أزرار الحفظ */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/hives/${hiveId}`)}
                        className="flex-1 btn-outline"
                    >
                        إلغاء
                    </button>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="spinner ml-2"></div>
                                جاري الحفظ...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Save className="h-5 w-5 ml-2" />
                                حفظ الفحص المفصل
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateInspection;