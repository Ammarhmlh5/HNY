import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MapPin, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateApiary = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm({
        defaultValues: {
            type: 'fixed'
        }
    });

    const watchType = watch('type');

    const onSubmit = async (data) => {
        setIsLoading(true);

        try {
            // In real app: await axios.post('/api/apiaries', data);
            console.log('Creating apiary:', data);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success('تم إنشاء المنحل بنجاح');
            navigate('/apiaries');
        } catch (error) {
            toast.error('حدث خطأ في إنشاء المنحل');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/apiaries')}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowRight className="h-4 w-4 ml-1" />
                    العودة للمناحل
                </button>

                <h1 className="text-2xl font-bold text-gray-900">إضافة منحل جديد</h1>
                <p className="mt-1 text-sm text-gray-600">
                    أدخل معلومات المنحل الجديد
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">
                            المعلومات الأساسية
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="form-label">
                                اسم المنحل *
                            </label>
                            <input
                                type="text"
                                id="name"
                                className={`form-input ${errors.name ? 'border-danger-300' : ''}`}
                                placeholder="مثال: منحل الربيع"
                                {...register('name', {
                                    required: 'اسم المنحل مطلوب',
                                    minLength: {
                                        value: 2,
                                        message: 'اسم المنحل يجب أن يكون حرفين على الأقل'
                                    }
                                })}
                            />
                            {errors.name && (
                                <p className="form-error">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Type */}
                        <div>
                            <label className="form-label">نوع المنحل *</label>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="fixed"
                                        type="radio"
                                        value="fixed"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                        {...register('type', { required: 'نوع المنحل مطلوب' })}
                                    />
                                    <label htmlFor="fixed" className="mr-3 block text-sm text-gray-700">
                                        ثابت - منحل في موقع محدد
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="mobile"
                                        type="radio"
                                        value="mobile"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                        {...register('type', { required: 'نوع المنحل مطلوب' })}
                                    />
                                    <label htmlFor="mobile" className="mr-3 block text-sm text-gray-700">
                                        متنقل - يتم نقله بين المواقع
                                    </label>
                                </div>
                            </div>
                            {errors.type && (
                                <p className="form-error">{errors.type.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="form-label">
                                الوصف
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                className="form-input"
                                placeholder="وصف مختصر عن المنحل..."
                                {...register('description')}
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <MapPin className="h-5 w-5 ml-2" />
                            معلومات الموقع
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {/* Address */}
                        <div>
                            <label htmlFor="address" className="form-label">
                                العنوان *
                            </label>
                            <input
                                type="text"
                                id="address"
                                className={`form-input ${errors['location.address'] ? 'border-danger-300' : ''}`}
                                placeholder="المدينة، المنطقة، البلد"
                                {...register('location.address', {
                                    required: 'العنوان مطلوب'
                                })}
                            />
                            {errors['location.address'] && (
                                <p className="form-error">{errors['location.address'].message}</p>
                            )}
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="latitude" className="form-label">
                                    خط العرض *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    id="latitude"
                                    className={`form-input ${errors['location.latitude'] ? 'border-danger-300' : ''}`}
                                    placeholder="24.7136"
                                    {...register('location.latitude', {
                                        required: 'خط العرض مطلوب',
                                        min: {
                                            value: -90,
                                            message: 'خط العرض يجب أن يكون بين -90 و 90'
                                        },
                                        max: {
                                            value: 90,
                                            message: 'خط العرض يجب أن يكون بين -90 و 90'
                                        }
                                    })}
                                />
                                {errors['location.latitude'] && (
                                    <p className="form-error">{errors['location.latitude'].message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="longitude" className="form-label">
                                    خط الطول *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    id="longitude"
                                    className={`form-input ${errors['location.longitude'] ? 'border-danger-300' : ''}`}
                                    placeholder="46.6753"
                                    {...register('location.longitude', {
                                        required: 'خط الطول مطلوب',
                                        min: {
                                            value: -180,
                                            message: 'خط الطول يجب أن يكون بين -180 و 180'
                                        },
                                        max: {
                                            value: 180,
                                            message: 'خط الطول يجب أن يكون بين -180 و 180'
                                        }
                                    })}
                                />
                                {errors['location.longitude'] && (
                                    <p className="form-error">{errors['location.longitude'].message}</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <p className="text-sm text-blue-700">
                                💡 يمكنك الحصول على الإحداثيات من خرائط جوجل بالنقر بزر الماوس الأيمن على الموقع واختيار الإحداثيات
                            </p>
                        </div>
                    </div>
                </div>

                {/* Specifications */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">
                            المواصفات
                        </h3>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Capacity */}
                            <div>
                                <label htmlFor="capacity" className="form-label">
                                    السعة القصوى (عدد الخلايا)
                                </label>
                                <input
                                    type="number"
                                    id="capacity"
                                    min="1"
                                    className="form-input"
                                    placeholder="50"
                                    {...register('capacity', {
                                        min: {
                                            value: 1,
                                            message: 'السعة يجب أن تكون رقم موجب'
                                        }
                                    })}
                                />
                                {errors.capacity && (
                                    <p className="form-error">{errors.capacity.message}</p>
                                )}
                            </div>

                            {/* Area */}
                            <div>
                                <label htmlFor="area" className="form-label">
                                    المساحة (متر مربع)
                                </label>
                                <input
                                    type="number"
                                    id="area"
                                    min="0"
                                    step="0.1"
                                    className="form-input"
                                    placeholder="1000"
                                    {...register('area', {
                                        min: {
                                            value: 0,
                                            message: 'المساحة يجب أن تكون رقم موجب'
                                        }
                                    })}
                                />
                                {errors.area && (
                                    <p className="form-error">{errors.area.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/apiaries')}
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
                                جاري الإنشاء...
                            </div>
                        ) : (
                            'إنشاء المنحل'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateApiary;