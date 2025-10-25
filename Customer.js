/**
 * نموذج العميل - Customer Model
 * يدير معلومات العملاء وتاريخ التعاملات
 */

export class Customer {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    
    // المعلومات الأساسية
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.alternativePhone = data.alternativePhone || '';
    this.customerType = data.customerType || 'individual'; // individual, business, retailer, distributor
    
    // معلومات العنوان
    this.address = data.address || {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'السعودية'
    };
    
    // معلومات الشركة (للعملاء التجاريين)
    this.businessInfo = data.businessInfo || {
      companyName: '',
      taxNumber: '',
      commercialRegister: '',
      businessType: '', // retail, wholesale, restaurant, pharmacy
      contactPerson: ''
    };
    
    // معلومات التفضيلات
    this.preferences = data.preferences || {
      preferredProducts: [], // أنواع المنتجات المفضلة
      preferredPaymentMethod: 'cash', // cash, bank_transfer, card, installments
      deliveryPreference: 'pickup', // pickup, delivery, shipping
      communicationPreference: 'phone', // phone, email, whatsapp
      priceCategory: 'retail' // retail, wholesale, special
    };
    
    // معلومات الائتمان والمالية
    this.creditInfo = data.creditInfo || {
      creditLimit: 0, // حد الائتمان
      currentBalance: 0, // الرصيد الحالي (موجب = دين للعميل، سالب = دين على العميل)
      paymentTerms: 0, // مدة السداد بالأيام
      discountRate: 0, // نسبة الخصم %
      loyaltyPoints: 0 // نقاط الولاء
    };
    
    // إحصائيات العميل
    this.statistics = data.statistics || {
      totalOrders: 0,
      totalPurchases: 0, // إجمالي المشتريات
      averageOrderValue: 0,
      lastOrderDate: null,
      firstOrderDate: null,
      customerLifetimeValue: 0,
      returnRate: 0 // معدل العودة للشراء
    };
    
    // معلومات التقييم والتصنيف
    this.rating = data.rating || {
      customerRating: 5, // تقييم العميل من 1-5
      paymentReliability: 'excellent', // excellent, good, fair, poor
      riskLevel: 'low', // low, medium, high
      vipStatus: false,
      blacklisted: false,
      blacklistReason: ''
    };
    
    // ملاحظات وتتبع
    this.notes = data.notes || '';
    this.tags = data.tags || []; // علامات للتصنيف
    this.source = data.source || 'direct'; // direct, referral, social_media, advertisement
    this.referredBy = data.referredBy || '';
    
    // معلومات النظام
    this.status = data.status || 'active'; // active, inactive, suspended
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastContactDate = data.lastContactDate;
  }

  generateId() {
    return 'customer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // تحديث إحصائيات العميل
  updateStatistics(orderData) {
    this.statistics.totalOrders++;
    this.statistics.totalPurchases += orderData.totalAmount;
    this.statistics.averageOrderValue = this.statistics.totalPurchases / this.statistics.totalOrders;
    this.statistics.lastOrderDate = orderData.orderDate;
    
    if (!this.statistics.firstOrderDate) {
      this.statistics.firstOrderDate = orderData.orderDate;
    }
    
    // حساب قيمة العميل مدى الحياة
    this.calculateCustomerLifetimeValue();
    
    // حساب معدل العودة
    this.calculateReturnRate();
    
    this.updatedAt = new Date();
  }

  // حساب قيمة العميل مدى الحياة
  calculateCustomerLifetimeValue() {
    const monthsSinceFirst = this.getMonthsSinceFirstOrder();
    if (monthsSinceFirst > 0) {
      const monthlyAverage = this.statistics.totalPurchases / monthsSinceFirst;
      // تقدير قيمة العميل لمدة 24 شهر
      this.statistics.customerLifetimeValue = monthlyAverage * 24;
    }
  }

  // حساب معدل العودة للشراء
  calculateReturnRate() {
    const monthsSinceFirst = this.getMonthsSinceFirstOrder();
    if (monthsSinceFirst > 0) {
      this.statistics.returnRate = this.statistics.totalOrders / monthsSinceFirst;
    }
  }

  // حساب عدد الأشهر منذ أول طلب
  getMonthsSinceFirstOrder() {
    if (!this.statistics.firstOrderDate) return 0;
    
    const firstOrder = new Date(this.statistics.firstOrderDate);
    const now = new Date();
    const diffTime = Math.abs(now - firstOrder);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }

  // تحديث الرصيد
  updateBalance(amount, type = 'sale') {
    if (type === 'sale') {
      this.creditInfo.currentBalance -= amount; // دين على العميل
    } else if (type === 'payment') {
      this.creditInfo.currentBalance += amount; // دفع من العميل
    } else if (type === 'refund') {
      this.creditInfo.currentBalance += amount; // استرداد للعميل
    }
    
    this.updatedAt = new Date();
  }

  // إضافة نقاط الولاء
  addLoyaltyPoints(points) {
    this.creditInfo.loyaltyPoints += points;
    this.updatedAt = new Date();
  }

  // استخدام نقاط الولاء
  redeemLoyaltyPoints(points) {
    if (this.creditInfo.loyaltyPoints >= points) {
      this.creditInfo.loyaltyPoints -= points;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // تحديد فئة العميل بناءً على الإحصائيات
  getCustomerSegment() {
    const clv = this.statistics.customerLifetimeValue;
    const orderFrequency = this.statistics.returnRate;
    
    if (clv >= 10000 && orderFrequency >= 2) {
      return 'VIP';
    } else if (clv >= 5000 && orderFrequency >= 1) {
      return 'عميل ذهبي';
    } else if (clv >= 2000 || orderFrequency >= 0.5) {
      return 'عميل فضي';
    } else if (this.statistics.totalOrders >= 3) {
      return 'عميل منتظم';
    } else {
      return 'عميل جديد';
    }
  }

  // تحديد مستوى المخاطر
  assessRiskLevel() {
    let riskScore = 0;
    
    // تقييم تاريخ الدفع
    if (this.rating.paymentReliability === 'poor') riskScore += 3;
    else if (this.rating.paymentReliability === 'fair') riskScore += 2;
    else if (this.rati