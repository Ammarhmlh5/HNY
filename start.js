#!/usr/bin/env node

/**
 * Quick start script for Beekeeping App
 * This script helps users get started quickly with the application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐝 مرحباً بك في تطبيق النحالين - Beekeeping Management App');
console.log('===============================================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
    console.log('⚠️  ملف .env غير موجود. سيتم إنشاؤه من .env.example...');

    if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ تم إنشاء ملف .env بنجاح');
        console.log('📝 يرجى تحديث المتغيرات في ملف .env قبل التشغيل\n');
    } else {
        console.log('❌ ملف .env.example غير موجود');
        process.exit(1);
    }
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    console.log('📦 تثبيت التبعيات...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ تم تثبيت التبعيات بنجاح\n');
    } catch (error) {
        console.log('❌ فشل في تثبيت التبعيات');
        process.exit(1);
    }
}

// Check command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
    case 'dev':
    case 'development':
        console.log('🚀 تشغيل التطبيق في وضع التطوير...');
        execSync('npm run server:dev', { stdio: 'inherit' });
        break;

    case 'prod':
    case 'production':
        console.log('🏭 تشغيل التطبيق في وضع الإنتاج...');
        execSync('npm start', { stdio: 'inherit' });
        break;

    case 'test':
        console.log('🧪 تشغيل الاختبارات...');
        execSync('npm test', { stdio: 'inherit' });
        break;

    case 'docker':
        console.log('🐳 تشغيل التطبيق باستخدام Docker...');
        execSync('docker-compose --profile dev up -d', { stdio: 'inherit' });
        break;

    case 'setup':
        console.log('⚙️  إعداد قاعدة البيانات...');
        console.log('يرجى التأكد من تشغيل PostgreSQL وتحديث ملف .env');
        console.log('ثم تشغيل: npm run dev');
        break;

    case 'help':
    default:
        console.log('الأوامر المتاحة:');
        console.log('  node start.js dev        - تشغيل وضع التطوير');
        console.log('  node start.js prod       - تشغيل وضع الإنتاج');
        console.log('  node start.js test       - تشغيل الاختبارات');
        console.log('  node start.js docker     - تشغيل باستخدام Docker');
        console.log('  node start.js setup      - مساعدة في الإعداد');
        console.log('  node start.js help       - عرض هذه المساعدة');
        console.log('\nللمزيد من المعلومات، راجع ملف README.md');
        break;
}

console.log('\n🐝 شكراً لاستخدام تطبيق النحالين!');