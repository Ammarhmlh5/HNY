import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    MapPin,
    Hexagon,
    ClipboardList,
    BarChart3,
    Settings,
    User,
    X
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
    { name: 'لوحة المعلومات', href: '/dashboard', icon: Home },
    { name: 'المناحل', href: '/apiaries', icon: MapPin },
    { name: 'الخلايا', href: '/hives', icon: Hexagon },
    { name: 'الفحوصات', href: '/inspections', icon: ClipboardList },
    { name: 'التقارير', href: '/reports', icon: BarChart3 },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
];

const Sidebar = ({ open, setOpen }) => {
    const location = useLocation();

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-l border-gray-200 px-6 pb-4">
                    {/* Logo */}
                    <div className="flex h-16 shrink-0 items-center">
                        <div className="flex items-center">
                            <Hexagon className="h-8 w-8 text-primary-600" />
                            <span className="mr-2 text-xl font-bold text-gray-900">
                                إدارة المناحل
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => {
                                        const isActive = location.pathname === item.href ||
                                            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                                        return (
                                            <li key={item.name}>
                                                <Link
                                                    to={item.href}
                                                    className={clsx(
                                                        isActive
                                                            ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                                            : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                                                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors duration-200'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={clsx(
                                                            isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                                                            'h-6 w-6 shrink-0'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>

                            {/* User section */}
                            <li className="mt-auto">
                                <Link
                                    to="/profile"
                                    className={clsx(
                                        location.pathname === '/profile'
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                                        'group -mx-2 flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                                    )}
                                >
                                    <User
                                        className={clsx(
                                            location.pathname === '/profile' ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                                            'h-6 w-6 shrink-0'
                                        )}
                                        aria-hidden="true"
                                    />
                                    الملف الشخصي
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Mobile sidebar */}
            <div className={clsx(
                'relative z-50 lg:hidden',
                open ? 'block' : 'hidden'
            )}>
                <div className="fixed inset-0 bg-gray-900/80" />

                <div className="fixed inset-0 flex">
                    <div className="relative mr-16 flex w-full max-w-xs flex-1">
                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                            <button
                                type="button"
                                className="-m-2.5 p-2.5"
                                onClick={() => setOpen(false)}
                            >
                                <span className="sr-only">إغلاق الشريط الجانبي</span>
                                <X className="h-6 w-6 text-white" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                            {/* Logo */}
                            <div className="flex h-16 shrink-0 items-center">
                                <div className="flex items-center">
                                    <Hexagon className="h-8 w-8 text-primary-600" />
                                    <span className="mr-2 text-xl font-bold text-gray-900">
                                        إدارة المناحل
                                    </span>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex flex-1 flex-col">
                                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        <ul role="list" className="-mx-2 space-y-1">
                                            {navigation.map((item) => {
                                                const isActive = location.pathname === item.href ||
                                                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                                                return (
                                                    <li key={item.name}>
                                                        <Link
                                                            to={item.href}
                                                            onClick={() => setOpen(false)}
                                                            className={clsx(
                                                                isActive
                                                                    ? 'bg-primary-50 text-primary-700'
                                                                    : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                                                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                                                            )}
                                                        >
                                                            <item.icon
                                                                className={clsx(
                                                                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                                                                    'h-6 w-6 shrink-0'
                                                                )}
                                                                aria-hidden="true"
                                                            />
                                                            {item.name}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>

                                    {/* User section */}
                                    <li className="mt-auto">
                                        <Link
                                            to="/profile"
                                            onClick={() => setOpen(false)}
                                            className={clsx(
                                                location.pathname === '/profile'
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                                                'group -mx-2 flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                                            )}
                                        >
                                            <User
                                                className={clsx(
                                                    location.pathname === '/profile' ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                                                    'h-6 w-6 shrink-0'
                                                )}
                                                aria-hidden="true"
                                            />
                                            الملف الشخصي
                                        </Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;