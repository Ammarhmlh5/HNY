import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Target,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Copy,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedingPlans = ({ onPlanUpdate, className }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [templates, setTemplates] = useState({});
  const [hives, setHives] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [plansRes, templatesRes, hivesRes] = await Promise.all([
        axios.get('/api/feeding-plans'),
        axios.get('/api/feeding-plans/templates/list'),
        axios.get('/api/hives')
      ]);

      setPlans(plansRes.data.data.plans || []);
      setTemplates(templatesRes.data.data || {});
      setHives(hivesRes.data.data.hives || []);
    } catch (error) {
      toast.error('خطأ في تحميل خطط التغذية');
      console.error('Error loading feeding plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateKey, hiveId, customName = null) => {
    try {
      const template = templates[templateKey];
      const hive = hives.find(h => h.id === parseInt(hiveId));
      
      const planData = {
        template_key: templateKey,
        hive_id: parseInt(hiveId),
        start_date: new Date().toISOString().split('T')[0],
        name: customName || `${template.name} - ${hive.name}`
      };

      await axios.post('/api/feeding-plans/from-template', planData);
      toast.success('تم إنشاء خطة التغذية من القالب');
      
      setShowNewPlan(false);
      loadData();
      
      if (onPlanUpdate) {
        onPlanUpdate();
      }
    } catch (error) {
