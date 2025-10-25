import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Menu,
    Bell,
    Search,
    User,
    LogOut,
    Settings,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Mock notifications - in real app, this would come from API
    const notifications = [
        {
            id: 1,
            title: 'فحص متأخر',
            message: 'خلية رقم 5 تحتاج فحص',
            time: 'منذ ساعتين',
            type: 'warning',
            unread: true
        },
        {
            id: 2,
            title: 'إنتاج عسل',
            message: 'منحل الربيع جاهز للقطف',
            time: 'منذ 4 ساعات',
            type: 'success',
            unread: true
        },
        {
            id: 3,
            title: 'تذكير تغذية',
            message: 'موعد تغذية الخلايا الضعيفة',
            time: 'أمس',
            type: 'info',
            unread: false
        }
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={onMenuClick}
            >
                <span className="sr-only">فتح الشريط الجانبي</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                {/* Search */}
                <form className="relative flex flex-1" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                        بحث
                    </label>
                    <Search
                        className="pointer-events-none absolute inset-y-0 right-0 h-full w-5 text-gray-400 pr-3"
                        aria-hidden="true"
                    />
                    <input
                        id="search-field"
                        className="block h-full w-full border-0 py-0 pr-8 pl-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                        placeholder="البحث في المناحل والخلايا..."
                        type="search"
                        name="search"
                    />
                </form>

                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative"
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                        >
                            <span className="sr-only">عرض التنبيهات</span>
                            <Bell className="h-6 w-6" aria-hidden="true" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -left-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications dropdown */}
                        {notificationsOpen && (
                            <div className="absolute left-0 z-10 mt-2 w-80 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="px-4 py-2 border-b border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-900">التنبيهات</h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={clsx(
                                                'px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0',
                                                notification.unread && 'bg-blue-50'
                                            )}
                                        >
                                            <div className="flex items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {notification.time}
                                                    </p>
                                                </div>
                                                {notification.unread && (
                                                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-2 border-t border-gray-200">
                                    <Link
                                        to="/notifications"
                                        className="text-sm text-primary-600 hover:text-primary-700"
                                        onClick={() => setNotificationsOpen(false)}
                                    >
                                        عرض جميع التنبيهات
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            className="-m-1.5 flex items-center p-1.5"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                        >
                            <span className="sr-only">فتح قائمة المستخدم</span>
                            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <span className="hidden lg:flex lg:items-center">
                                <span className="mr-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                    {user?.name}
                                </span>
                                <ChevronDown className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                        </button>

                        {/* User menu dropdown */}
                        {userMenuOpen && (
                            <div className="absolute left-0 z-10 mt-2.5 w-48 origin-top-left rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                <Link
                                    to="/profile"
                                    className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50 flex items-center"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <User className="ml-3 h-4 w-4 text-gray-400" />
                                    الملف الشخصي
                                </Link>
                                <Link
                                    to="/settings"
                                    className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50 flex items-center"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <Settings className="ml-3 h-4 w-4 text-gray-400" />
                                    الإعدادات
                                </Link>
                                <button
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                        logout();
                                    }}
                                    className="block w-full text-right px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50 flex items-center"
                                >
                                    <LogOut className="ml-3 h-4 w-4 text-gray-400" />
                                    تسجيل الخروج
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;