import React from 'react';
import { Link } from 'react-router-dom';
import {
    MapPin,
    Hexagon,
    ClipboardList,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plus
} from 'lucide-react';
import { useQuery } from 'react-query';
import axios from 'axios';

// Mock data - in real app, this would come from API
const mockDashboardData = {
    summary: {
        total_apiaries: 3,
        total_hives: 25,
        active_hives: 23,
        recent_inspections: 8
    },
    recent_activity: [
        {
            id: 1,
            type: 'inspection',
            title: 'فحص خلية رقم 12',
            description: 'منحل الربيع - حالة ممتازة',
            time: 'منذ ساعتين',
            status: 'success'
        },
        {
            id: 2,
            type: 'alert',
            title: 'تنبيه: خلية تحتاج انتباه',
            description: 'خلية رقم 7 - منحل الصيف',
            time: 'منذ 4 ساعات',
            status: 'warning'
        },
        {
            id: 3,
            type: 'production',
            title: 'حصاد عسل جديد',
            description: '15 كيلو من منحل الربيع',
            time: 'أمس',
            status: 'success'
        }
    ],
    alerts: [
        {
            id: 1,
            title: 'فحوصات متأخرة',
            count: 3,
            type: 'warning'
        },
        {
            id: 2,
            title: 'خلايا تحتاج انتباه',
            count: 2,
            type: 'danger'
        }
    ],
    weather: {
        temperature: 28,
        condition: 'مشمس',
        humidity: 65,
        wind: 12
    }
};

const Dashboard = () => {
    // In real app, fetch dashboard data
    const { data: dashboardData, isLoading } = useQuery(
        'dashboard',
        () => Promise.resolve(mockDashboardData),
        {
            refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        }
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
            </div>
        );
    }

    const { summary, recent_activity, alerts, weather } = dashboardData;

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        لوحة المعلومات
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        نظرة عامة على مناحلك وخلاياك
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        to="/inspections/create"
                        className="btn-primary"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        فحص جديد
                    </Link>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <MapPin className="h-8 w-8 text-primary-600" />
                        </div>
                        <div className="mr-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    إجمالي المناحل
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {summary.total_apiaries}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Hexagon className="h-8 w-8 text-secondary-600" />
                        </div>
                        <div className="mr-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    إجمالي الخلايا
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {summary.total_hives}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircle className="h-8 w-8 text-success-600" />
                        </div>
                        <div className="mr-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    الخلايا النشطة
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {summary.active_hives}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ClipboardList className="h-8 w-8 text-warning-600" />
                        </div>
                        <div className="mr-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    الفحوصات الأخيرة
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {summary.recent_inspections}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">
                                النشاط الأخير
                            </h3>
                        </div>
                        <div className="flow-root">
                            <ul role="list" className="-mb-8">
                                {recent_activity.map((activity, activityIdx) => (
                                    <li key={activity.id}>
                                        <div className="relative pb-8">
                                            {activityIdx !== recent_activity.length - 1 ? (
                                                <span
                                                    className="absolute top-4 right-4 -mr-px h-full w-0.5 bg-gray-200"
                                                    aria-hidden="true"
                                                />
                                            ) : null}
                                            <div className="relative flex space-x-3 space-x-reverse">
                                                <div>
                                                    <span className={`
                            h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                            ${activity.status === 'success' ? 'bg-success-500' :
                                                            activity.status === 'warning' ? 'bg-warning-500' : 'bg-gray-500'}
                          `}>
                                                        {activity.type === 'inspection' && <ClipboardList className="h-4 w-4 text-white" />}
                                                        {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-white" />}
                                                        {activity.type === 'production' && <TrendingUp className="h-4 w-4 text-white" />}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4 space-x-reverse">
                                                    <div>
                                                        <p className="text-sm text-gray-900">
                                                            {activity.title}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {activity.description}
                                                        </p>
                                                    </div>
                                                    <div className="text-left text-sm whitespace-nowrap text-gray-500">
                                                        <time>{activity.time}</time>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-6">
                            <Link
                                to="/activity"
                                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                عرض جميع الأنشطة
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Alerts and Weather */}
                <div className="space-y-6">
                    {/* Alerts */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">
                                التنبيهات
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`
                    p-3 rounded-md border
                    ${alert.type === 'warning' ? 'bg-warning-50 border-warning-200' : 'bg-danger-50 border-danger-200'}
                  `}
                                >
                                    <div className="flex items-center">
                                        <AlertTriangle className={`
                      h-5 w-5 ml-2
                      ${alert.type === 'warning' ? 'text-warning-600' : 'text-danger-600'}
                    `} />
                                        <div className="flex-1">
                                            <p className={`
                        text-sm font-medium
                        ${alert.type === 'warning' ? 'text-warning-800' : 'text-danger-800'}
                      `}>
                                                {alert.title}
                                            </p>
                                            <p className={`
                        text-sm
                        ${alert.type === 'warning' ? 'text-warning-700' : 'text-danger-700'}
                      `}>
                                                {alert.count} عنصر
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weather */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">
                                حالة الطقس
                            </h3>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                {weather.temperature}°
                            </div>
                            <div className="text-sm text-gray-500 mb-4">
                                {weather.condition}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-500">الرطوبة</div>
                                    <div className="font-medium">{weather.humidity}%</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">الرياح</div>
                                    <div className="font-medium">{weather.wind} كم/س</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">
                                إجراءات سريعة
                            </h3>
                        </div>
                        <div className="space-y-2">
                            <Link
                                to="/apiaries/create"
                                className="w-full btn-outline text-right"
                            >
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة منحل جديد
                            </Link>
                            <Link
                                to="/hives/create"
                                className="w-full btn-outline text-right"
                            >
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة خلية جديدة
                            </Link>
                            <Link
                                to="/inspections"
                                className="w-full btn-outline text-right"
                            >
                                <Clock className="h-4 w-4 ml-2" />
                                عرض الفحوصات
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;