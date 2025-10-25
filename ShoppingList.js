import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Package,
    DollarSign,
    Check,
    Plus,
    Minus,
    Download,
    Share,
    Calculator,
    Store,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import clsx from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const ShoppingList = ({ feedingPlans = [], onListUpdate, className }) => {
    const [shoppingList, setShoppingList] = useState({});
    const [checkedItems, setCheckedItems] = useState({});
    const [customItems, setCustomItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        generateShoppingList();
    }, [feedingPlans]);

    const generateShoppingList = async () => {
        if (feedingPlans.length === 0) return;

        try {
            setLoading(true);

            // Aggregate all feeding plans
            const hivesData = feedingPlans.map(plan => ({
                hive_id: plan.hive_id,
                hive_name: plan.hive_name,
                population_strength: plan.population_strength || 'moderate',
                food_stores: plan.food_stores || 'adequate',
                brood_pattern: plan.brood_pattern || 'good',
                hive_type: plan.hive_type || 'langstroth'
            }));

            const response = await axios.post('/api/feeding/calculate-bulk', {
                hives_data: hivesData,
                feeding_type: feedingPlans[0].feeding_type || 'sugar_syrup',
                season: getCurrentSeason()
            });

            setShoppingList(response.data.data.shopping_list);
        } catch (error) {
            toast.error('خطأ في إنشاء قائمة التسوق');
            console.error('Error generating shopping list:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentSeason = () => {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    };

    const handleItemCheck = (itemKey) => {
        setCheckedItems(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

    const addCustomItem = () => {
        if (!newItemName || !newItemQuantity) {
            toast.error('يرجى إدخال اسم المادة والكمية');
            return;
        }

        const newItem = {
            id: Date.now(),
            name: newItemName,
            quantity: parseFloat(newItemQuantity),
            unit: 'قطعة',
            price: parseFloat(newItemPrice) || 0,
            isCustom: true
        };

        setCustomItems(prev => [...prev, newItem]);
        setNewItemName('');
        setNewItemQuantity('');
        setNewItemPrice('');
        setShowAddItem(false);
        toast.success('تم إضافة المادة لقائمة التسوق');
    };

    const removeCustomItem = (itemId) => {
        setCustomItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('تم حذف المادة من القائمة');
    };

    const updateItemQuantity = (itemKey, change) => {
        setShoppingList(prev => ({
            ...prev,
            [itemKey]: {
                ...prev[itemKey],
                packages_needed: Math.max(1, prev[itemKey].packages_needed + change),
                total_cost: (prev[itemKey].packages_needed + change) * prev[itemKey].unit_price
            }
        }));
    };

    const getTotalCost = () => {
        const shoppingCost = Object.values(shoppingList).reduce((sum, item) => sum + item.total_cost, 0);
        const customCost = customItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return shoppingCost + customCost;
    };

    const getCompletionPercentage = () => {
        const totalItems = Object.keys(shoppingList).length + customItems.length;
        const checkedCount = Object.values(checkedItems).filter(Boolean).length;
        return totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
    };

    const exportList = () => {
        const listText = generateListText();
        const blob = new Blob([listText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `قائمة_التسوق_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const shareList = async () => {
        const listText = generateListText();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'قائمة التسوق - تغذية النحل',
                    text: listText
                });
            } catch (error) {
                // Fallback to copy to clipboard
                copyToClipboard(listText);
            }
        } else {
            copyToClipboard(listText);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('تم نسخ القائمة للحافظة');
        }).catch(() => {
            toast.error('خطأ في نسخ القائمة');
        });
    };

    const generateListText = () => {
        let text = `قائمة التسوق - تغذية النحل\nالتاريخ: ${new Date().toLocaleDateString('ar-SA')}\n\n`;

        text += 'المواد الأساسية:\n';
        Object.entries(shoppingList).forEach(([ingredient, details]) => {
            const status = checkedItems[ingredient] ? '✓' : '☐';
            text += `${status} ${ingredient}: ${details.packages_needed} عبوة (${details.package_size} ${details.unit}) - ${details.total_cost.toFixed(2)} ريال\n`;
        });

        if (customItems.length > 0) {
            text += '\nمواد إضافية:\n';
            customItems.forEach(item => {
                const status = checkedItems[`custom_${item.id}`] ? '✓' : '☐';
                text += `${status} ${item.name}: ${item.quantity} ${item.unit} - ${(item.price * item.quantity).toFixed(2)} ريال\n`;
            });
        }

        text += `\nالتكلفة الإجمالية: ${getTotalCost().toFixed(2)} ريال\n`;
        text += `التقدم: ${getCompletionPercentage()}% مكتمل\n`;

        return text;
    };

    const getIngredientLabel = (ingredient) => {
        const labels = {
            sugar: 'سكر أبيض',
            honey: 'عسل طبيعي',
            pollen: 'حبوب لقاح',
            soy_flour: 'دقيق الصويا',
            yeast: 'خميرة غذائية',
            water: 'ماء'
        };
        return labels[ingredient] || ingredient;
    };

    const getIngredientIcon = (ingredient) => {
        const icons = {
            sugar: '🍬',
            honey: '🍯',
            pollen: '🌼',
            soy_flour: '🌾',
            yeast: '🦠',
            water: '💧'
        };
        return icons[ingredient] || '📦';
    };

    if (loading) {
        return (
            <div className={clsx('card', className)}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 space-x-reverse">
                            <div className="w-8 h-8 bg-gray-300 rounded"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
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
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center ml-3">
                        <ShoppingCart className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">قائمة التسوق</h2>
                        <p className="text-gray-600">المواد المطلوبة لتغذية النحل</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={shareList}
                        className="btn-outline btn-sm"
                    >
                        <Share className="w-4 h-4 ml-1" />
                        مشاركة
                    </button>

                    <button
                        onClick={exportList}
                        className="btn-outline btn-sm"
                    >
                        <Download className="w-4 h-4 ml-1" />
                        تصدير
                    </button>
                </div>
            </div>

            {/* Progress Summary */}
            <div className="card bg-gradient-to-r from-success-50 to-success-100 border-success-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-success-900">ملخص القائمة</h3>
                    <div className="text-2xl">🛒</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-success-600">
                            {Object.keys(shoppingList).length + customItems.length}
                        </div>
                        <div className="text-sm text-success-700">إجمالي المواد</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-success-600">
                            {getTotalCost().toFixed(2)}
                        </div>
                        <div className="text-sm text-success-700">ريال إجمالي</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-success-600">
                            {getCompletionPercentage()}%
                        </div>
                        <div className="text-sm text-success-700">مكتمل</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-success-600">
                            {Object.values(checkedItems).filter(Boolean).length}
                        </div>
                        <div className="text-sm text-success-700">تم شراؤها</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="w-full bg-success-200 rounded-full h-3">
                        <div
                            className="bg-success-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${getCompletionPercentage()}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Shopping List Items */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">المواد الأساسية</h3>
                    <button
                        onClick={() => setShowAddItem(true)}
                        className="btn-outline btn-sm"
                    >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة مادة
                    </button>
                </div>

                <div className="space-y-3">
                    {Object.entries(shoppingList).map(([ingredient, details]) => {
                        const isChecked = checkedItems[ingredient];

                        return (
                            <div
                                key={ingredient}
                                className={clsx(
                                    'flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200',
                                    isChecked
                                        ? 'border-success-300 bg-success-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                )}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={() => handleItemCheck(ingredient)}
                                    className={clsx(
                                        'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                                        isChecked
                                            ? 'border-success-500 bg-success-500 text-white'
                                            : 'border-gray-300 hover:border-gray-400'
                                    )}
                                >
                                    {isChecked && <Check className="w-4 h-4" />}
                                </button>

                                {/* Item Icon */}
                                <div className="text-2xl flex-shrink-0">
                                    {getIngredientIcon(ingredient)}
                                </div>

                                {/* Item Details */}
                                <div className="flex-1">
                                    <h4 className={clsx(
                                        'font-medium',
                                        isChecked ? 'text-success-900 line-through' : 'text-gray-900'
                                    )}>
                                        {getIngredientLabel(ingredient)}
                                    </h4>
                                    <div className="text-sm text-gray-600">
                                        مطلوب: {details.needed_amount.toLocaleString()} {details.unit}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        حجم العبوة: {details.package_size} {details.unit}
                                    </div>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateItemQuantity(ingredient, -1)}
                                        disabled={details.packages_needed <= 1}
                                        className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>

                                    <span className="w-12 text-center font-medium">
                                        {details.packages_needed}
                                    </span>

                                    <button
                                        onClick={() => updateItemQuantity(ingredient, 1)}
                                        className="p-1 text-gray-600 hover:text-gray-800"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">
                                        {details.total_cost.toFixed(2)} ريال
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {details.unit_price} ريال/عبوة
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Custom Items */}
            {customItems.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">مواد إضافية</h3>

                    <div className="space-y-3">
                        {customItems.map((item) => {
                            const itemKey = `custom_${item.id}`;
                            const isChecked = checkedItems[itemKey];

                            return (
                                <div
                                    key={item.id}
                                    className={clsx(
                                        'flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200',
                                        isChecked
                                            ? 'border-success-300 bg-success-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => handleItemCheck(itemKey)}
                                        className={clsx(
                                            'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                                            isChecked
                                                ? 'border-success-500 bg-success-500 text-white'
                                                : 'border-gray-300 hover:border-gray-400'
                                        )}
                                    >
                                        {isChecked && <Check className="w-4 h-4" />}
                                    </button>

                                    {/* Item Details */}
                                    <div className="flex-1">
                                        <h4 className={clsx(
                                            'font-medium',
                                            isChecked ? 'text-success-900 line-through' : 'text-gray-900'
                                        )}>
                                            {item.name}
                                        </h4>
                                        <div className="text-sm text-gray-600">
                                            {item.quantity} {item.unit}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900">
                                            {(item.price * item.quantity).toFixed(2)} ريال
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeCustomItem(item.id)}
                                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Custom Item Modal */}
            {showAddItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    إضافة مادة جديدة
                                </h3>
                                <button
                                    onClick={() => setShowAddItem(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="form-label">اسم المادة</label>
                                    <input
                                        type="text"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="form-input"
                                        placeholder="مثال: أكياس بلاستيك"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">الكمية</label>
                                    <input
                                        type="number"
                                        value={newItemQuantity}
                                        onChange={(e) => setNewItemQuantity(e.target.value)}
                                        className="form-input"
                                        placeholder="مثال: 10"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">السعر (اختياري)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newItemPrice}
                                        onChange={(e) => setNewItemPrice(e.target.value)}
                                        className="form-input"
                                        placeholder="مثال: 5.50"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={addCustomItem}
                                        className="btn-primary flex-1"
                                    >
                                        إضافة
                                    </button>

                                    <button
                                        onClick={() => setShowAddItem(false)}
                                        className="btn-outline flex-1"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shopping Tips */}
            <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-start">
                    <Store className="w-5 h-5 text-blue-600 mt-0.5 ml-3 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900 mb-2">نصائح التسوق</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• اشتري السكر بالجملة لتوفير التكلفة</li>
                            <li>• تأكد من جودة العسل وحبوب اللقاح</li>
                            <li>• احفظ المواد في مكان جاف وبارد</li>
                            <li>• تحقق من تواريخ الانتهاء قبل الشراء</li>
                            <li>• قارن الأسعار بين المتاجر المختلفة</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoppingList;