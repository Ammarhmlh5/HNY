/**
 * التطبيق الرئيسي لإدارة المناحل
 * Beekeeping Management Application
 */

import React, { useState, useEffect } from 'react';
import { HoneyProductionManager } from './HoneyProduction/index.js';
import { RoyalJellyManager } from './RoyalJellyProduction/index.js';
import { PollenQueenManager } from './PollenQueen/index.js';
import './BeekeepingApp.css';

export const BeekeepingApp = () => {
    const [currentTab, setCurrentTab] = useState('dashboard');
    const [selectedApiary, setSelectedApiary] = useState(null);
    const [apiaries, setApiaries] = useState([]);

    // تحميل المناحل عند بدء التشغيل
    useEffect(() => {
        loadApiaries();
    }, []);

    const loadApiaries = () => {
        // محاكاة تحميل المناحل - سيتم استبدالها بالخدمة الحقيقية
        const mockApiaries = [
            {
                id: 'apiary_1',
                name: 'منحل الربيع',
                location: 'الرياض',
                hiveCount: 25
            },
            {
                id: 'apiary_2',
                name: 'منحل الصيف',
                location: 'الطائف',
                hiveCount: 18
            }
        ];
        setApiaries(mockApiaries);
        if (mockApiaries.length > 0) {
            setSelectedApiary(mockApiaries[0]);
        }
    };

    const tabs = [
        { id: 'dashboard', name: 'لوحة المعلومات', icon: '📊' },
        { id: 'apiaries', name: 'المناحل', icon: '🏠' },
        { id: 'hives', name: 'الخلايا', icon: '📦' },
        { id: 'inspections', name: 'الفحوصات', icon: '🔍' },
        { id: 'feeding', name: 'التغذية', icon: '🍯' },
        { id: 'honey-production', name: 'إنتاج العسل', icon: '🍯' },
        { id: 'royal-jelly', name: 'الغذاء الملكي', icon: '👑' },
        { id: 'pollen-queens', name: 'حبوب اللقاح والملكات', icon: '🌸' },
        { id: 'reports', name: 'التقارير', icon: '📈' },
        { id: 'settings', name: 'الإعدادات', icon: '⚙️' }
    ];

    const renderTabContent = () => {
        switch (currentTab) {
            case 'dashboard':
                return <DashboardView selectedApiary={selectedApiary} />;

            case 'honey-production':
                return (
                    <HoneyProductionManager
                        apiaryId={selectedApiary?.id}
                        onClose={() => setCurrentTab('dashboard')}
                    />
                );

            case 'royal-jelly':
                return (
                    <RoyalJellyManager
                        apiaryId={selectedApiary?.id}
                        onClose={() => setCurrentTab('dashboard')}
                    />
                );

            case 'pollen-queens':
                return (
                    <PollenQueenManager
                        apiaryId={selectedApiary?.id}
                        onClose={() => setCurrentTab('dashboard')}
                    />
                );

            case 'apiaries':
                return <ApiariesView apiaries={apiaries} onSelectApiary={setSelectedApiary} />;

            case 'hives':
                return <HivesView selectedApiary={selectedApiary} />;

            case 'inspections':
                return <InspectionsView selectedApiary={selectedApiary} />;

            case 'feeding':
                return <FeedingView selectedApiary={selectedApiary} />;

            case 'reports':
                return <ReportsView selectedApiary={selectedApiary} />;

            case 'settings':
                return <SettingsView />;

            default:
                return <DashboardView selectedApiary={selectedApiary} />;
        }
    };

    return (
        <div className="beekeeping-app">
            {/* رأس التطبيق */}
            <header className="app-header">
                <div className="header-content">
                    <div className="app-title">
                        <span className="app-icon">🐝</span>
                        <h1>إدارة المناحل</h1>
                    </div>

                    {selectedApiary && (
                        <div className="selected-apiary">
                            <span className="apiary-icon">🏠</span>
                            <div className="apiary-info">
                                <div className="apiary-name">{selectedApiary.name}</div>
                                <div className="apiary-location">{selectedApiary.location}</div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* شريط التنقل */}
            <nav className="app-navigation">
                <div className="nav-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${currentTab === tab.id ? 'active' : ''}`}
                            onClick={() => setCurrentTab(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-name">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* محتوى التطبيق */}
            <main className="app-content">
                {renderTabContent()}
            </main>
        </div>
    );
};

// مكونات مؤقتة للتبويبات الأخرى
const DashboardView = ({ selectedApiary }) => (
    <div className="dashboard-view">
        <h2>لوحة المعلومات</h2>
        <p>مرحباً بك في تطبيق إدارة المناحل</p>
        {selectedApiary && (
            <div className="apiary-summary">
                <h3>ملخص المنحل: {selectedApiary.name}</h3>
                <p>عدد الخلايا: {selectedApiary.hiveCount}</p>
                <p>الموقع: {selectedApiary.location}</p>
            </div>
        )}
    </div>
);

const ApiariesView = ({ apiaries, onSelectApiary }) => (
    <div className="apiaries-view">
        <h2>إدارة المناحل</h2>
        <div className="apiaries-grid">
            {apiaries.map(apiary => (
                <div key={apiary.id} className="apiary-card" onClick={() => onSelectApiary(apiary)}>
                    <h3>{apiary.name}</h3>
                    <p>الموقع: {apiary.location}</p>
                    <p>عدد الخلايا: {apiary.hiveCount}</p>
                </div>
            ))}
        </div>
    </div>
);

const HivesView = ({ selectedApiary }) => (
    <div className="hives-view">
        <h2>إدارة الخلايا</h2>
        {selectedApiary ? (
            <p>خلايا المنحل: {selectedApiary.name}</p>
        ) : (
            <p>يرجى اختيار منحل أولاً</p>
        )}
    </div>
);

const InspectionsView = ({ selectedApiary }) => (
    <div className="inspections-view">
        <h2>إدارة الفحوصات</h2>
        {selectedApiary ? (
            <p>فحوصات المنحل: {selectedApiary.name}</p>
        ) : (
            <p>يرجى اختيار منحل أولاً</p>
        )}
    </div>
);

const FeedingView = ({ selectedApiary }) => (
    <div className="feeding-view">
        <h2>إدارة التغذية</h2>
        {selectedApiary ? (
            <p>تغذية المنحل: {selectedApiary.name}</p>
        ) : (
            <p>يرجى اختيار منحل أولاً</p>
        )}
    </div>
);

const ReportsView = ({ selectedApiary }) => (
    <div className="reports-view">
        <h2>التقارير والإحصائيات</h2>
        {selectedApiary ? (
            <p>تقارير المنحل: {selectedApiary.name}</p>
        ) : (
            <p>يرجى اختيار منحل أولاً</p>
        )}
    </div>
);

const SettingsView = () => (
    <div className="settings-view">
        <h2>إعدادات التطبيق</h2>
        <p>إعدادات عامة للتطبيق</p>
    </div>
);

export default BeekeepingApp;