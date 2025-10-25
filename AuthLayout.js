import React from 'react';
import { Hexagon } from 'lucide-react';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex">
            {/* Left side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Logo */}
                    <div className="flex items-center justify-center mb-8">
                        <Hexagon className="h-12 w-12 text-primary-600" />
                        <span className="mr-3 text-2xl font-bold text-gray-900">
                            إدارة المناحل
                        </span>
                    </div>

                    {children}
                </div>
            </div>

            {/* Right side - Image/Illustration */}
            <div className="hidden lg:block relative w-0 flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <div className="relative h-full flex items-center justify-center p-12">
                        <div className="text-center text-white">
                            <Hexagon className="h-24 w-24 mx-auto mb-6 text-white opacity-80" />
                            <h2 className="text-3xl font-bold mb-4">
                                مرحباً بك في نظام إدارة المناحل
                            </h2>
                            <p className="text-xl opacity-90 leading-relaxed">
                                نظام شامل لإدارة المناحل والخلايا مع متابعة الفحوصات والإنتاج
                            </p>
                            <div className="mt-8 grid grid-cols-1 gap-4 text-sm">
                                <div className="flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full ml-3"></div>
                                    إدارة متقدمة للمناحل والخلايا
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full ml-3"></div>
                                    نظام فحص ذكي مع التوصيات
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full ml-3"></div>
                                    تقارير وإحصائيات شاملة
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full ml-3"></div>
                                    متابعة الإنتاج والمبيعات
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;