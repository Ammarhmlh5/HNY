import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  ShoppingCart,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Users,
  MapPin
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedingPlanner = ({ className }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [hives, setHives] = useState([]);
  const [apiaries, setApiaries] = useState([]);

  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    plan_type: 'custom',
    primary_feeding_type: 'sugar_syrup',
    feeding_method: 'top_feeder',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    season: '',
    target_hives: [],
    target_apiaries: [],
    frequency_days: 3,
    auto_adjust_frequency: true,
    auto_generate_schedule: true,
    notifications_enabled: true,
    reminder_days_before: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [plansRes, hivesRes, apiariesRes] = await Promise.all([
        axios.get('/api/feeding-plans'),
        axios.get('/api/hives'),
        axios.get('/api/apiaries')
      ]);

      setPlans(plansRes.data.data.plans || []);
      setHives(hivesRes.data.data.hives || []);
      setApiaries(apiariesRes.data.data.apiaries || []);
    } catch (error) {
      toast.error('خطأ في تحميل خطط التغذية');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      // Validate required fields
      if (!newPlan.name || !newPlan.end_date) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      if (new Date(newPlan.end_date) <= new Date(newPlan.start_date)) {
        toast.error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
        return;
      }

      await axios.post('/api/feeding-plans', newPlan);
      
      toast.success('تم إنشاء خطة التغذية بنجاح');
      setShowNewPlan(false);
      setNewPlan({
        name: '',
        description: '',
        plan_type: 'custom',
        primary_feeding_type: 'sugar_syrup',
        feeding_method: 'top_feeder',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        season: '',
        target_hives: [],
        target_apiaries: [],
        frequency_days: 3,
        auto_adjust_frequency: true,
        plan.id === planId 
          ? { ...plan, is_active: !plan.is_active }
          : plan
      ));
      
      toast.success('تم تغيير حالة الخطة');
    } catch (error) {
      toast.error('خطأ في تغيير حالة الخطة');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الخطة؟ سيتم إلغاء جميع التغذيات المجدولة.')) {
      return;
    }

    try {
      await axios.delete(`/api/feeding-plans/${planId}`);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      toast.success('تم حذف خطة التغذية');
      loadData();
    } catch (error) {
      toast.error('خطأ في حذف خطة التغذية');
    }
  };

  const handleRegeneratePlan = async (planId) => {
    try {
      await axios.post(`/api/feeding-plans/${planId}/regenerate`);
      toast.success('تم إعادة إنشاء جدولة التغذية');
      loadData();
    } catch (error) {
      toast.error('خطأ في إعادة إنشاء الجدولة');
    }
  };

  const getPlanTypeLabel = (type) => {
    const labels = {
      emergency: 'طارئة',
      intensive: 'مكثفة',
      maintenance: 'صيانة',
      seasonal: 'موسمية',
      preparation: 'تحضيرية',
      recovery: 'استشفاء',
      custom: 'مخصصة'
    };
    return labels[type] || type;
  };

  const getPlanTypeColor = (type) => {
    const colors = {
      emergency: 'danger',
      intensive: 'warning',
      maintenance: 'primary',
      seasonal: 'success',
      preparation: 'info',
      recovery: 'secondary',
      custom: 'gray'
    };
    return colors[type] || 'gray';
  };

  const getFeedingTypeLabel = (type) => {
    const labels = {
      sugar_syrup: 'محلول سكري',
      honey_syrup: 'محلول عسل',
      pollen_patty: 'عجينة حبوب لقاح',
      protein_patty: 'عجينة بروتين',
      emergency_feeding: 'تغذية طارئة',
      winter_feeding: 'تغذية شتوية',
      stimulative_feeding: 'تغذية محفزة',
      maintenance_feeding: 'تغذية صيانة'
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'gray',
      medium: 'primary',
      high: 'warning',
      critical: 'danger'
    };
    return colors[priority] || 'gray';
  };

  const calculateProgress = (plan) => {
    if (plan.generated_feedings_count === 0) return 0;
    return Math.round((plan.completed_feedings_count / plan.generated_feedings_count) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={clsx('space-y-4', className)}>
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="space-y-3">
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">خطط التغذية</h2>
          <p className="text-gray-600">إدارة وتخطيط برامج التغذية طويلة المدى</p>
        </div>
        
        <button
          onClick={() => setShowNewPlan(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 ml-2" />
          خطة جديدة
        </button>
      </div>

      {/* Stats Summary */}
      {planStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {planStats.total_plans}
            </div>
            <div className="text-gray-600">إجمالي الخطط</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-600 mb-2">
              {planStats.active_plans}
            </div>
            <div className="text-gray-600">خطط نشطة</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning-600 mb-2">
              {Math.round(planStats.average_duration)}
            </div>
            <div className="text-gray-600">متوسط المدة (يوم)</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-info-600 mb-2">
              {Object.keys(planStats.by_type || {}).length}
            </div>
            <div className="text-gray-600">أنواع مختلفة</div>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد خطط تغذية
            </h3>
            <p className="text-gray-600 mb-4">
              ابدأ بإنشاء خطة تغذية لتنظيم برنامج التغذية
            </p>
            <button
              onClick={() => setShowNewPlan(true)}
              className="btn-primary"
            >
              إنشاء خطة جديدة
            </button>
          </div>
        ) : (
          plans.map((plan) => {
            const progress = calculateProgress(plan);
            const planTypeColor = getPlanTypeColor(plan.plan_type);
            const priorityColor = getPriorityColor(plan.priority);
            
            return (
              <div key={plan.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Plan Icon */}
                    <div className={clsx(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      `bg-${planTypeColor}-100`
                    )}>
                      <Calendar className={clsx('w-6 h-6', `text-${planTypeColor}-600`)} />
                    </div>
                    
                    {/* Plan Info *