import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);

        try {
            const result = await login(data.email, data.password);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError('root', {
                    type: 'manual',
                    message: result.error
                });
            }
        } catch (error) {
            setError('root', {
                type: 'manual',
                message: 'حدث خطأ غير متوقع'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                    تسجيل الدخول
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    أو{' '}
                    <Link
                        to="/register"
                        className="font-medium text-primary-600 hover:text-primary-500"
                    >
                        إنشاء حساب جديد
                    </Link>
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* Email */}
                <div>
                    <label htmlFor="email" className="form-label">
                        البريد الإلكتروني
                    </label>
                    <div className="mt-1 relative">
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            className={`form-input pr-10 ${errors.email ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                            placeholder="أدخل بريدك الإلكتروني"
                            {...register('email', {
                                required: 'البريد الإلكتروني مطلوب',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'البريد الإلكتروني غير صحيح'
                                }
                            })}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    {errors.email && (
                        <p className="form-error">{errors.email.message}</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="form-label">
                        كلمة المرور
                    </label>
                    <div className="mt-1 relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            className={`form-input pr-10 pl-10 ${errors.password ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                            placeholder="أدخل كلمة المرور"
                            {...register('password', {
                                required: 'كلمة المرور مطلوبة',
                                minLength: {
                                    value: 6,
                                    message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
                                }
                            })}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    {errors.password && (
                        <p className="form-error">{errors.password.message}</p>
                    )}
                </div>

                {/* Remember me and Forgot password */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-900">
                            تذكرني
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link
                            to="/forgot-password"
                            className="font-medium text-primary-600 hover:text-primary-500"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    </div>
                </div>

                {/* Error message */}
                {errors.root && (
                    <div className="rounded-md bg-danger-50 p-4">
                        <div className="text-sm text-danger-700">
                            {errors.root.message}
                        </div>
                    </div>
                )}

                {/* Submit button */}
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="spinner ml-2"></div>
                                جاري تسجيل الدخول...
                            </div>
                        ) : (
                            'تسجيل الدخول'
                        )}
                    </button>
                </div>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                    بيانات تجريبية للاختبار:
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                    <div>البريد الإلكتروني: demo@beekeeping.com</div>
                    <div>كلمة المرور: 123456</div>
                </div>
            </div>
        </div>
    );
};

export default Login;