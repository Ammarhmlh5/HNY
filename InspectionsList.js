import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Eye,
    BarChart3,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import clsx from 'clsx';

// Mock data - في التطبيق الحقيقي سيأتي من API
const mockInspections = [
    {
        id: '1',
        hive: { id: '1', name: 'خلية رقم 1', apiary: { name: 'منحل الربيع' } },
        inspection_date: '2024-01-20',
        inspection_type: 'routine',
        auto_score: 85,
        overall_status: 'green',
        risk_level: 'low',
        inspector: { name: 'أحمد محمد' },
        duration_minutes: 45,
        queen_present: 'yes',
        population_strength: 'strong',
        food_stores: 'adequate',
        diseases_found: [],
        pests_found: []
    },
    {
        id: '2',
        hive: { id: '2', name: 'خلية رقم 5', apiary: { name: 'منحل الصيف' } },
        inspection_date: '2024-01-18',
        inspection_type: 'disease_check',
        auto_score: 65,
        overall_status: 'yellow',
        risk_level: 'medium',
        inspector: { name: 'أحمد محمد' },
        duration_minutes: 60,
        queen_present: 'yes',
        population_strength: 'moderate',
        food_stores: 'low',
        diseases_found: ['الفاروا'],
        pests_found: ['دودة الشمع']
    },
    {
        id: '3',
        hive: { id: '3', name: 'خلية رقم 3', apiary: { name: 'منحل الربيع' } },
        inspection_date: '2024-01-15',
        inspection_type: 'emergency',
        auto_score: 35,
        overall_status: 'red',
        risk_level: 'critical',
        inspector: { name: 'أحمد محمد' },
        duration_minutes: 30,
        queen_present: 'no',
        population_strength: 'weak',
        food_stores: 'critical',
        diseases_found: ['النوزيما', 'الطباشير الأمريكي'],
        pests_found: ['الدبابير']
    }
];

const InspectionsList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // في التطبيق الحقيقي: fetch من API
    const { data: inspections, isLoading } = useQuery(
        ['inspections', searchTerm, filterStatus, filterType, sortBy, sortOrder],
        () => Promise.resolve(mockInspections),
        {
            keepPreviousData: true,
        }
    );

    const getStatusIcon = (status) => {
        const icons = {
            green: CheckCircle,
            yellow: AlertTriangle,
            orange: AlertTriangle,
            red: XCircle
        };
        return icons[status] || AlertTriangle;
    };

    const getStatusColor = (status) => {
        const colors = {
            green: 'text-success-600 bg-success-100',
            yellow: 'text-warning-600 bg-warning-100',
            orange: 'text-orange-600 bg-orange-100',
            red: 'text-danger-600 bg-danger-100'
        };
        return colors[status] || 'text-gray-600 bg-gray-100';
    };

    const getTypeLabel = (type) => {
        const labels = {
            routine: 'دوري',
            disease_check: 'فحص أمراض',
            harvest: 'حصاد',
            feeding: 'تغذية',
            treatment: 'علاج',
            emergency: 'طارئ'
        };
        return labels[type] || type;
    };

    const getRiskLevelColor = (level) => {
        const colors = {
            low: 'text-success-700 bg-success-50 border-success-200',
            medium: 'text-warning-700 bg-warning-50 border-warning-200',
            high: 'text-orange-700 bg-orange-50 border-orange-200',
            critical: 'text-danger-700 bg-danger-50 border-danger-200'
        };
        return colors[level] || 'text-gray-700 bg-gray-50 border-gray-200';
    };

    const getRiskLevelLabel = (level) => {
        const labels = {
            low: 'منخفض',
            medium: 'متوسط',
            high: 'عالي',
            critical: 'حرج'
        };
        return labels[level] || level;
    };

    const filteredInspections = inspections?.filter(inspection => {
        const matchesSearch =
            inspection.hive.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.hive.apiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.inspector.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || inspection.overall_status === filterStatus;
        const matchesType = filterType === 'all' || inspection.inspection_type === filterType;

        return matchesSearch && matchesStatus && matchesType;
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
                        الفحوصات
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        جميع فحوصات الخلايا والتقييمات
                    </p>
                </div>
                <div className="mt-4 flex gap-2 md:ml-4 md:mt-0">
                    <Link
                        to="/inspections/create"
                        className="btn-secondary"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        فحص مفصل
                    </Link>
                    <Link
                        to="/inspections/quick"
                        className="btn-primary"
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        فحص سريع
                    </Link>
                </div>
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BarChart3 className="h-8 w-8 text-primary-600" />
                        </div>
                        <div className="mr-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    إجمالي الفحوصات
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {filteredInspections.length}
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
                                    حالة ممتازة
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {filteredInspections.filter(i => i.overall_status === 'green').length}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-8 w-8 text-warning-600" />
                        </div>
                        <div className="mr-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    تحتاج انتباه
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {filteredInspections.filter(i => ['yellow', 'orange'].includes(i.overall_status)).length}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <XCircle className="h-8 w-8 text-danger-600" />
                        </div>
                        <div className="mr-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    حالة حرجة
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {filteredInspections.filter(i => i.overall_status === 'red').length}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* البحث والفلاتر */}
            <div className="card">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* البحث */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="البحث في الفحوصات..."
                            className="form-input pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* زر الفلاتر */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-outline"
                    >
                        <Filter className="h-4 w-4 ml-2" />
                        تصفية
                    </button>
                </div>

                {/* الفلاتر */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="form-label">الحالة</label>
                                <select
                                    className="form-input"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">جميع الحالات</option>
                                    <option value="green">ممتاز</option>
                                    <option value="yellow">جيد</option>
                                    <option value="orange">يحتاج انتباه</option>
                                    <option value="red">حرج</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">نوع الفحص</label>
                                <select
                                    className="form-input"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">جميع الأنواع</option>
                                    <option value="routine">دوري</option>
                                    <option value="disease_check">فحص أمراض</option>
                                    <option value="harvest">حصاد</option>
                                    <option value="feeding">تغذية</option>
                                    <option value="treatment">علاج</option>
                                    <option value="emergency">طارئ</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">ترتيب حسب</label>
                                <select
                                    className="form-input"
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(e) => {
                                        const [field, order] = e.target.value.split('-');
                                        setSortBy(field);
                                        setSortOrder(order);
                                    }}
                                >
                                    <option value="date-desc">التاريخ (الأحدث أولاً)</option>
                                    <option value="date-asc">التاريخ (الأقدم أولاً)</option>
                                    <option value="score-desc">النقاط (الأعلى أولاً)</option>
                                    <option value="score-asc">النقاط (الأقل أولاً)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* قائمة الفحوصات */}
            {filteredInspections.length === 0 ? (
                <div className="text-center py-12">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فحوصات</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        ابدأ بإجراء فحص لخلاياك
                    </p>
                    <div className="mt-6">
                        <Link to="/inspections/create" className="btn-primary">
                            <Plus className="h-4 w-4 ml-2" />
                            فحص جديد
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInspections.map((inspection) => {
                        const StatusIcon = getStatusIcon(inspection.overall_status);

                        return (
                            <div key={inspection.id} className="card hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <StatusIcon className={clsx(
                                                'h-6 w-6',
                                                getStatusColor(inspection.overall_status).split(' ')[0]
                                            )} />

                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {inspection.hive.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {inspection.hive.apiary.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500">التاريخ</p>
                                                <p className="text-sm font-medium">
                                                    {format(new Date(inspection.inspection_date), 'dd MMM yyyy', { locale: ar })}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-500">النوع</p>
                                                <p className="text-sm font-medium">
                                                    {getTypeLabel(inspection.inspection_type)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-500">النقاط</p>
                                                <p className="text-sm font-medium">
                                                    {inspection.auto_score}/100
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-gray-500">المدة</p>
                                                <p className="text-sm font-medium">
                                                    {inspection.duration_minutes} دقيقة
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className={clsx(
                                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                                                getStatusColor(inspection.overall_status)
                                            )}>
                                                الحالة العامة
                                            </span>

                                            <span className={clsx(
                                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                                                getRiskLevelColor(inspection.risk_level)
                                            )}>
                                                مخاطر: {getRiskLevelLabel(inspection.risk_level)}
                                            </span>

                                            {inspection.diseases_found.length > 0 && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800 border border-danger-200">
                                                    {inspection.diseases_found.length} مرض
                                                </span>
                                            )}

                                            {inspection.pests_found.length > 0 && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 border border-warning-200">
                                                    {inspection.pests_found.length} آفة
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-400">
                                            فحص بواسطة {inspection.inspector.name}
                                        </div>
                                    </div>

                                    {/* أزرار الإجراءات */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/inspections/${inspection.id}`}
                                            className="btn-outline text-sm"
                                        >
                                            <Eye className="h-4 w-4 ml-1" />
                                            عرض
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InspectionsList;