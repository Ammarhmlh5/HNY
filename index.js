/**
 * نقطة دخول التطبيق الرئيسية
 * Main Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import BeekeepingApp from './components/BeekeepingApp.js';
import './index.css';

// إنشاء جذر التطبيق
const root = ReactDOM.createRoot(document.getElementById('root'));

// تشغيل التطبيق
root.render(
    <React.StrictMode>
        <BeekeepingApp />
    </React.StrictMode>
);

// تسجيل Service Worker للعمل بدون اتصال (اختياري)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}