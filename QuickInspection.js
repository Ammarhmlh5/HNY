import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowRight,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    EyeOff,
    Mic,
    MicOff,
    Camera,
    Save,
    RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const QuickInspection = () => {
    const { hiveId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [fieldMode, setFieldMode] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [audioNotes, setAudioNotes] = useState([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset
    } = useForm();

    // الأسئلة الخمسة الأساسية
    const questions = [
        {
            id: 'queen_present',
            title: 'هل الملكة موجودة؟',
            description: 'هل رأيت الملكة أو علامات وجودها؟',
            options: [
                { value: 'yes', label: 'نعم، رأيتها', color: 'success', icon: CheckCircle },
                { value: 'not_seen', label: 'لم أرها لكن هناك علامات', color: 'warning', icon: Eye },
                { value: 'no', label: 'لا، غير موجودة', color: 'danger', icon: XCircle },
                { value: 'unknown', label: 'غير متأكد', color: 'secondary', icon: AlertTriangle }
            ]
        },
        {
            id: 'queen_laying',
            title: 'هل الملكة تبيض؟',
            description: 'هل تشاهد بيض حديث أو يرقات صغيرة؟',
            options: [
                { value: 'yes', label: 'نعم، بيض ويرقات حديثة', color: 'success', icon: CheckCircle },
                { value: 'poor', label: 'قليل أو متقطع', color: 'warning', icon: AlertTriangle },
                { value: 'no', label: 'لا يوجد بيض حديث', color: 'danger', icon: XCircle },
                { value: 'unknown', label: 'غير متأكد', color: 'secondary', icon: EyeOff }
            ]
        },
        {
            id: 'brood_pattern',
            title: 'كيف نمط الحضنة؟',
            description: 'شكل وتوزيع الحضنة في الإطارات',
            options: [
                { value: 'excellent', label: 'ممتاز - متصل ومنتظم', color: 'success', icon: CheckCircle },
                { value: 'good', label: 'جيد - معظمه متصل', color: 'success', icon: CheckCircle },
                { value: 'fair', label: 'مقبول - بعض الفجوات', color: 'warning', icon: AlertTriangle },
                { value: 'poor', label: 'ضعيف - فجوات كثيرة', color: 'danger', icon: XCircle },
                { value: 'none', label: 'لا يوجد حضنة', color: 'danger', icon: XCircle }
            ]
        },
        {
            id: 'population_strength',
            title: 'ما قوة الطائفة؟',
            description: 'عدد النحل وتغطية الإطارات',
            options: [
                { value: 'very_strong', label: 'قوية جداً - تغطي كل الإطارات', color: 'success', icon: CheckCircle },
                { value: 'strong', label: 'قوية - تغطي معظم الإطارات', color: 'success', icon: CheckCircle },
                { value: 'moderate', label: 'متوسطة - تغطي نصف الإطارات', color: 'warning', icon: AlertTriangle },
                { value: 'weak', label: 'ضعيفة - تغطي ربع الإطارات', color: 'danger', icon: XCircle },
                { value: 'very_weak', label: 'ضعيفة جداً - قليل جداً', color: 'danger', icon: XCircle }
            ]
        },
        {
            id: 'food_stores',
            title: 'ما حالة مخزون الغذاء؟',
            description: 'العسل وحبوب اللقاح المخزنة',
            options: [
                { value: 'abundant', label: 'وفير - أكثر من كافي', color: 'success', icon: CheckCircle },
                { value: 'adequate', label: 'كافي - مخزون جيد', color: 'success', icon: CheckCircle },
                { value: 'low', label: 'قليل - يحتاج تغذية', color: 'warning', icon: AlertTriangle },
                { value: 'critical', label: 'حرج - يحتاج تغذية فورية', color: 'danger', icon: XCircle },
                { value: 'none', label: 'لا يوجد مخزون', color: 'danger', icon: XCircle }
            ]
        }
    ];

    const watchedValues = watch();

    // تبديل وضع الحقل
    const toggleFieldMode = () => {
        setFieldMode(!fieldMode);
        toast.success(fieldMode ? 'تم إلغاء وضع الحقل' : 'تم تفعيل وضع الحقل');
    };

    // التسجيل الصوتي
    const toggleRecording = () => {
        if (isRecording) {
            // إيقاف التسجيل
            setIsRecording(false);
            toast.success('تم إيقاف التسجيل');
            // هنا يمكن إضافة منطق حفظ التسجيل
        } else {
            // بدء التسجيل
            setIsRecording(true);
            toast.success('بدء التسجيل الصوتي');
            // هنا يمكن إضافة منطق بدء التسجيل
        }
    };

    // التقاط صورة
    const takePhoto = () => {
        // هنا يمكن إضافة منطق التقاط الصورة
        const newPhoto = {
            id: Date.now(),
            url: '/placeholder-image.jpg',
            timestamp: new Date()
        };
        setPhotos([...photos, newPhoto]);
        toast.success('تم التقاط الصورة');
    };

    // الانتقال للسؤال التالي
    const nextQuestion = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    // الانتقال للسؤال السابق
    const previousQuestion = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // إرسال الفحص
    const onSubmit = async (data) => {
        setIsLoading(true);

        try {
            // إضافة البيانات الإضافية
            const inspectionData = {
                ...data,
                photos: photos.map(p => p.url),
                audio_notes: audioNotes,
                field_mode: fieldMode,
                inspection_type: 'routine'
            };

            // في التطبيق الحقيقي: await axios.post(`/api/inspections/hive/${hiveId}/quick`, inspectionData);
            console.log('Quick inspection data:', inspectionData);

            // محاكاة استدعاء API
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success('تم حفظ الفحص السريع بنجاح');
            navigate(`/hives/${hiveId}`);
        } catch (error) {
            toast.error('حدث خطأ في حفظ الفحص');
        } finally {
            setIsLoading(false);
        }
    };

    // إعادة تعيين النموذج
    const resetForm = () => {
        reset();
        setCurrentStep(0);
        setPhotos([]);
        setAudioNotes([]);
        toast.success('تم إعادة تعيين النموذج');
    };

    const currentQuestion = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/hives/${hiveId}`)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowRight className="h-4 w-4 ml-1" />
                    العودة للخلية
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">الفحص السريع</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            الأسئلة الخمسة الأساسية لتقييم حالة الخلية
                        </p>
                    </div>

                    {/* أدوات الحقل */}
                    <div className="flex gap-2">
                        <button
                            onClick={toggleFieldMode}
                            className={clsx(
                                'btn',
                                fieldMode ? 'btn-primary' : 'btn-outline'
                            )}
                        >
                            {fieldMode ? 'وضع الحقل نشط' : 'وضع الحقل'}
                        </button>
                    </div>
                </div>
            </div>

            {/* شريط التقدم */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>السؤال {currentStep + 1} من {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* السؤال الحالي */}
                <div className="card">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {currentQuestion.title}
                        </h2>
                        <p className="text-gray-600">
                            {currentQuestion.description}
                        </p>
                    </div>

                    {/* خيارات الإجابة */}
                    <div className={clsx(
                        'grid gap-3',
                        fieldMode ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                    )}>
                        {currentQuestion.options.map((option) => {
                            const Icon = option.icon;
                            const isSelected = watchedValues[currentQuestion.id] === option.value;

                            return (
                                <label
                                    key={option.value}
                                    className={clsx(
                                        'relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200',
                                        fieldMode ? 'p-6 text-lg' : 'p-4',
                                        isSelected
                                            ? `border-${option.color}-500 bg-${option.color}-50`
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        value={option.value}
                                        className="sr-only"
                                        {...register(currentQuestion.id, {
                                            required: 'يرجى اختيار إجابة'
                                        })}
                                    />

                                    <Icon className={clsx(
                                        'h-6 w-6 ml-3',
                                        fieldMode && 'h-8 w-8',
                                        isSelected
                                            ? `text-${option.color}-600`
                                            : 'text-gray-400'
                                    )} />

                                    <span className={clsx(
                                        'font-medium',
                                        fieldMode && 'text-lg',
                                        isSelected
                                            ? `text-${option.color}-900`
                                            : 'text-gray-900'
                                    )}>
                                        {option.label}
                                    </span>

                                    {isSelected && (
                                        <CheckCircle className={clsx(
                                            'h-5 w-5 mr-auto',
                                            fieldMode && 'h-6 w-6',
                                            `text-${option.color}-600`
                                        )} />
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    {errors[currentQuestion.id] && (
                        <p className="form-error mt-2">{errors[currentQuestion.id].message}</p>
                    )}
                </div>

                {/* أدوات إضافية */}
                <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">أدوات إضافية</h3>

                    <div className={clsx(
                        'grid gap-3',
                        fieldMode ? 'grid-cols-1' : 'grid-cols-3'
                    )}>
                        {/* التسجيل الصوتي */}
                        <button
                            type="button"
                            onClick={toggleRecording}
                            className={clsx(
                                'flex items-center justify-center p-4 border-2 rounded-lg transition-all duration-200',
                                fieldMode && 'p-6',
                                isRecording
                                    ? 'border-danger-500 bg-danger-50 text-danger-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            )}
                        >
                            {isRecording ? (
                                <MicOff className={clsx('h-6 w-6', fieldMode && 'h-8 w-8')} />
                            ) : (
                                <Mic className={clsx('h-6 w-6', fieldMode && 'h-8 w-8')} />
                            )}
                            <span className={clsx('mr-2', fieldMode && 'text-lg')}>
                                {isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                            </span>
                        </button>

                        {/* التقاط صورة */}
                        <button
                            type="button"
                            onClick={takePhoto}
                            className={clsx(
                                'flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 text-gray-700 transition-all duration-200',
                                fieldMode && 'p-6'
                            )}
                        >
                            <Camera className={clsx('h-6 w-6', fieldMode && 'h-8 w-8')} />
                            <span className={clsx('mr-2', fieldMode && 'text-lg')}>
                                التقاط صورة
                            </span>
                        </button>

                        {/* إعادة تعيين */}
                        <button
                            type="button"
                            onClick={resetForm}
                            className={clsx(
                                'flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 text-gray-700 transition-all duration-200',
                                fieldMode && 'p-6'
                            )}
                        >
                            <RotateCcw className={clsx('h-6 w-6', fieldMode && 'h-8 w-8')} />
                            <span className={clsx('mr-2', fieldMode && 'text-lg')}>
                                إعادة تعيين
                            </span>
                        </button>
                    </div>

                    {/* عرض الصور المُلتقطة */}
                    {photos.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">الصور المُلتقطة ({photos.length})</p>
                            <div className="flex gap-2 overflow-x-auto">
                                {photos.map((photo) => (
                                    <div key={photo.id} className="flex-shrink-0">
                                        <img
                                            src={photo.url}
                                            alt="صورة الفحص"
                                            className="w-16 h-16 object-cover rounded-lg border"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ��زرار التنقل */}
                <div className={clsx(
                    'flex gap-4',
                    fieldMode && 'flex-col'
                )}>
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={previousQuestion}
                            className={clsx(
                                'btn-outline',
                                fieldMode ? 'w-full py-4 text-lg' : 'flex-1'
                            )}
                        >
                            السؤال السابق
                        </button>
                    )}

                    {currentStep < questions.length - 1 ? (
                        <button
                            type="button"
                            onClick={nextQuestion}
                            disabled={!watchedValues[currentQuestion.id]}
                            className={clsx(
                                'btn-primary disabled:opacity-50 disabled:cursor-not-allowed',
                                fieldMode ? 'w-full py-4 text-lg' : 'flex-1'
                            )}
                        >
                            السؤال التالي
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isLoading || !watchedValues[currentQuestion.id]}
                            className={clsx(
                                'btn-success disabled:opacity-50 disabled:cursor-not-allowed',
                                fieldMode ? 'w-full py-4 text-lg' : 'flex-1'
                            )}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="spinner ml-2"></div>
                                    جاري الحفظ...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <Save className="h-5 w-5 ml-2" />
                                    حفظ الفحص
                                </div>
                            )}
                        </button>
                    )}
                </div>

                {/* ملاحظات إضافية */}
                <div className="card">
                    <label htmlFor="notes" className="form-label">
                        ملاحظات إضافية (اختياري)
                    </label>
                    <textarea
                        id="notes"
                        rows={fieldMode ? 6 : 3}
                        className="form-input"
                        placeholder="أي ملاحظات أو تفاصيل إضافية..."
                        {...register('notes')}
                    />
                </div>
            </form>
        </div>
    );
};

export default QuickInspection;