import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
    Plus,
    MapPin,
    Hexagon,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock data - in real app, this would come from API
const mockApiaries = [
    {
        id: '1',
        name: 'منحل الربيع',
        type: 'fixed',
        location: {
            address: 'الرياض، المملكة العربية السعودية',
            latitude: 24.7136,
            longitude: 46.6753
        },
        hive_count: 12,
        capacity: 20,
        status: 'active',
        last_inspection: '2024-01-15',
        health_status: 'excellent'
    },
    {
        id: '2',
        name: 'منحل الصيف',
        type: 'mobile',
        location: {
            address: 'جدة، المملكة العربية السعودية',
            latitude: 21.4858,
            longitude: 39.1925
        },
        hive_count: 8,
        capacity: 15,
        status: 'active',
        last_inspection: '2024-01-10',
        health_status: 'good'
    },
    {
        id: '3',
        name: 'منحل الشتاء',
        type: 'fixed',
        location: {
            address: 'الدمام، المملكة العربية السعودية',
            latitude: 26.4207,
            longitude: 50.0888
        },
        hive_count: 5,
        capacity: 10,
        status: 'maintenance',
        last_inspection: '2024-01-05',
        health_status: 'warning'
    }
];

const ApiariesList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // In real app, fetch apiaries from API
    const { data: apiaries, isLoading, refetch } = useQuery(
        ['apiaries', searchTerm, filterType],
        () => Promise.resolve(mockApiaries),
        {
            keepPreviousData: true,
        }
    );

    const handleDeleteApiary = async (apiaryId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المنحل؟')) {
            try {
                // In real app: await axios.delete(`/api/apiaries/${apiaryId}`);
                toast.success('تم حذف المنحل بنجاح');
                refetch();
            } catch (error) {
                toast.error('حدث خطأ في حذف المنحل');
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { label: 'نشط', class: 'badge-success' },
            maintenance: { label: 'صيانة', class: 'badge-warning' },
            inactive: { label: 'غير نشط', class: 'badge-danger' }
        };

        const config = statusConfig[status] || statusConfig.inactive;
        return <span className={`badge ${config.class}`}>{config.label}</span>;
    };

    const getHealthBadge = (health) => {
        const healthConfig = {
            excellent: { label: 'ممتاز', class: 'badge-success' },
            good: { label: 'جيد', class: 'badge-info' },
            warning: { label: 'يحتاج انتباه', class: 'badge-warning' },
            critical: { label: 'حرج', class: 'badge-danger' }
        };

        const config = healthConfig[health] || healthConfig.warning;
        return <span className={`badge ${config.class}`}>{config.label}</span>;
    };

    const filteredApiaries = apiaries?.filter(apiary => {
        const matchesSearch = apiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apiary.location.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || apiary.type === filterType;

        return matchesSearch && matchesFilter;
    }) || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        المناحل
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        إدارة جميع مناحلك في مكان واحد
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        to="/apiaries/create"
                        className="btn-primary"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة منحل جديد
                    </Link>
                </div>
            </div>

            {/* Search and filters */}
            <div className="card">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="البحث في المناحل..."
                            className="form-input pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-outline"
                    >
                        <Filter className="h-4 w-4 ml-2" />
                        تصفية
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="form-label">نوع المنحل</label>
                                <select
                                    className="form-input"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">جميع الأنواع</option>
                                    <option value="fixed">ثابت</option>
                                    <option value="mobile">متنقل</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Apiaries grid */}
            {filteredApiaries.length === 0 ? (
                <div className="text-center py-12">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مناحل</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        ابدأ بإضافة منحل جديد لإدارة خلاياك
                    </p>
                    <div className="mt-6">
                        <Link to="/apiaries/create" className="btn-primary">
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة منحل جديد
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredApiaries.map((apiary) => (
                        <div key={apiary.id} className="card hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {apiary.name}
                                    </h3>

                                    <div className="space-y-2 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 ml-2" />
                                            {apiary.location.address}
                                        </div>

                                        <div className="flex items-center">
                                            <Hexagon className="h-4 w-4 ml-2" />
                                            {apiary.hive_count} من {apiary.capacity} خلية
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {getStatusBadge(apiary.status)}
                                        {getHealthBadge(apiary.health_status)}
                                        <span className={`badge ${apiary.type === 'fixed' ? 'badge-info' : 'badge-warning'}`}>
                                            {apiary.type === 'fixed' ? 'ثابت' : 'متنقل'}
                                        </span>
                                    </div>

                                    <div className="mt-4 text-xs text-gray-400">
                                        آخر فحص: {new Date(apiary.last_inspection).toLocaleDateString('ar-SA')}
                                    </div>
                                </div>

                                {/* Actions dropdown */}
                                <div className="relative">
                                    <button className="p-2 text-gray-400 hover:text-gray-600">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                    {/* Dropdown menu would go here */}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="mt-6 flex gap-2">
                                <Link
                                    to={`/apiaries/${apiary.id}`}
                                    className="flex-1 btn-outline text-center"
                                >
                                    <Eye className="h-4 w-4 ml-2" />
                                    عرض
                                </Link>
                                <Link
                                    to={`/apiaries/${apiary.id}/edit`}
                                    className="flex-1 btn-secondary text-center"
                                >
                                    <Edit className="h-4 w-4 ml-2" />
                                    تعديل
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary stats */}
            <div className="card">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {filteredApiaries.length}
                        </div>
                        <div className="text-sm text-gray-500">إجمالي المناحل</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {filteredApiaries.reduce((sum, apiary) => sum + apiary.hive_count, 0)}
                        </div>
                        <div className="text-sm text-gray-500">إجمالي الخلايا</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {filteredApiaries.filter(a => a.status === 'active').length}
                        </div>
                        <div className="text-sm text-gray-500">مناحل نشطة</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {Math.round(
                                filteredApiaries.reduce((sum, apiary) => sum + (apiary.hive_count / apiary.capacity * 100), 0) /
                                filteredApiaries.length || 0
                            )}%
                        </div>
                        <div className="text-sm text-gray-500">متوسط الاستغلال</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiariesList;