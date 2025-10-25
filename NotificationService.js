const { User } = require('../models');

class NotificationService {
    // Send alert notification to user
    static async sendAlert(alert) {
        try {
            const user = await User.findByPk(alert.user_id);
            if (!user) {
                throw new Error('User not found');
            }

            // Check user notification preferences
            const preferences = user.notification_preferences || {};

            if (!this.shouldSendNotification(alert, preferences)) {
                return { sent: false, reason: 'User preferences' };
            }

            const notifications = [];

            // Send push notification if enabled
            if (preferences.push_notifications !== false) {
                const pushResult = await this.sendPushNotification(user, alert);
                notifications.push({ type: 'push', ...pushResult });
            }

            // Send SMS if enabled and phone number available
            if (preferences.sms_notifications && user.phone) {
                const smsResult = await this.sendSMS(user, alert);
                notifications.push({ type: 'sms', ...smsResult });
            }

            // Send email if enabled and email available
            if (preferences.email_notifications && user.email) {
                const emailResult = await this.sendEmail(user, alert);
                notifications.push({ type: 'email', ...emailResult });
            }

            return {
                sent: true,
                notifications,
                alert_id: alert.id
            };
        } catch (error) {
            console.error('Error sending alert notification:', error);
            return { sent: false, error: error.message };
        }
    }

    // Check if notification should be sent based on user preferences
    static shouldSendNotification(alert, preferences) {
        // Always send high priority alerts
        if (alert.priority === 'high') {
            return true;
        }

        // Check if notifications are enabled for this alert type
        const typePreferences = preferences.alert_types || {};
        if (typePreferences[alert.type] === false) {
            return false;
        }

        // Check quiet hours
        if (preferences.quiet_hours) {
            const now = new Date();
            const currentHour = now.getHours();
            const { start, end } = preferences.quiet_hours;

            if (start < end) {
                // Same day quiet hours (e.g., 22:00 to 06:00)
                if (currentHour >= start && currentHour < end) {
                    return alert.priority === 'high'; // Only high priority during quiet hours
                }
            } else {
                // Overnight quiet hours (e.g., 22:00 to 06:00)
                if (currentHour >= start || currentHour < end) {
                    return alert.priority === 'high';
                }
            }
        }

        return true;
    }

    // Send push notification
    static async sendPushNotification(user, alert) {
        try {
            // In a real application, you would use a service like Firebase Cloud Messaging
            // or Apple Push Notification Service

            const payload = {
                title: alert.title,
                body: alert.message,
                data: {
                    alert_id: alert.id,
                    type: alert.type,
                    priority: alert.priority,
                    hive_id: alert.hive_id,
                    apiary_id: alert.apiary_id
                },
                badge: await this.getUnreadAlertCount(user.id)
            };

            // Mock implementation
            console.log('Push notification sent:', payload);

            // Here you would integrate with your push notification service:
            /*
            const fcm = require('fcm-notification');
            const FCM = new fcm(serverKey);
            
            const message = {
              to: user.fcm_token,
              notification: {
                title: payload.title,
                body: payload.body
              },
              data: payload.data
            };
            
            const result = await FCM.send(message);
            return { sent: true, result };
            */

            return { sent: true, mock: true };
        } catch (error) {
            console.error('Error sending push notification:', error);
            return { sent: false, error: error.message };
        }
    }

    // Send SMS notification
    static async sendSMS(user, alert) {
        try {
            // In a real application, you would use an SMS service like Twilio or local SMS gateway

            const message = `${alert.title}\n${alert.message}\n\nتطبيق النحالين`;

            // Mock implementation
            console.log(`SMS sent to ${user.phone}:`, message);

            // Here you would integrate with your SMS service:
            /*
            const twilio = require('twilio');
            const client = twilio(accountSid, authToken);
            
            const result = await client.messages.create({
              body: message,
              from: twilioPhoneNumber,
              to: user.phone
            });
            
            return { sent: true, sid: result.sid };
            */

            return { sent: true, mock: true };
        } catch (error) {
            console.error('Error sending SMS:', error);
            return { sent: false, error: error.message };
        }
    }

    // Send email notification
    static async sendEmail(user, alert) {
        try {
            // In a real application, you would use an email service like SendGrid or AWS SES

            const subject = `تنبيه من تطبيق النحالين: ${alert.title}`;
            const htmlContent = this.generateEmailHTML(user, alert);

            // Mock implementation
            console.log(`Email sent to ${user.email}:`, subject);

            // Here you would integrate with your email service:
            /*
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
            const msg = {
              to: user.email,
              from: 'noreply@beekeeping-app.com',
              subject: subject,
              html: htmlContent
            };
            
            const result = await sgMail.send(msg);
            return { sent: true, messageId: result[0].headers['x-message-id'] };
            */

            return { sent: true, mock: true };
        } catch (error) {
            console.error('Error sending email:', error);
            return { sent: false, error: error.message };
        }
    }

    // Generate HTML content for email notifications
    static generateEmailHTML(user, alert) {
        const priorityColors = {
            high: '#dc2626',
            medium: '#d97706',
            low: '#6b7280'
        };

        const priorityLabels = {
            high: 'عالية',
            medium: 'متوسطة',
            low: 'منخفضة'
        };

        return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تنبيه من تطبيق النحالين</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .alert-box {
            border-right: 4px solid ${priorityColors[alert.priority]};
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .priority {
            display: inline-block;
            background: ${priorityColors[alert.priority]};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .alert-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
          }
          .alert-message {
            color: #666;
            line-height: 1.6;
          }
          .metadata {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 14px;
          }
          .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #f59e0b;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐝 تطبيق النحالين</h1>
            <p>تنبيه جديد من مناحلك</p>
          </div>
          
          <div class="content">
            <p>مرحباً ${user.name}،</p>
            <p>لديك تنبيه جديد من تطبيق النحالين:</p>
            
            <div class="alert-box">
              <div class="priority">أولوية ${priorityLabels[alert.priority]}</div>
              <div class="alert-title">${alert.title}</div>
              <div class="alert-message">${alert.message}</div>
            </div>
            
            ${alert.hive_id ? `
            <div class="metadata">
              <strong>تفاصيل إضافية:</strong><br>
              معرف الخلية: ${alert.hive_id}<br>
              ${alert.apiary_id ? `معرف المنحل: ${alert.apiary_id}<br>` : ''}
              وقت التنبيه: ${new Date(alert.created_at).toLocaleString('ar-SA')}
            </div>
            ` : ''}
            
            <a href="#" class="button">عرض في التطبيق</a>
            
            <p>يمكنك إدارة إعدادات الإشعارات من خلال التطبيق.</p>
          </div>
          
          <div class="footer">
            <p>تطبيق النحالين - إدارة ذكية لمناحلك</p>
            <p>هذا إشعار تلقائي، يرجى عدم الرد على هذا البريد</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    // Get unread alert count for badge
    static async getUnreadAlertCount(userId) {
        try {
            const { Alert } = require('../models');
            return await Alert.count({
                where: {
                    user_id: userId,
                    is_read: false
                }
            });
        } catch (error) {
            console.error('Error getting unread alert count:', error);
            return 0;
        }
    }

    // Send bulk notifications
    static async sendBulkNotifications(alerts) {
        const results = [];

        for (const alert of alerts) {
            try {
                const result = await this.sendAlert(alert);
                results.push({ alert_id: alert.id, ...result });
            } catch (error) {
                results.push({
                    alert_id: alert.id,
                    sent: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    // Send scheduled reminders
    static async sendScheduledReminders() {
        try {
            const { Alert } = require('../models');

            // Find alerts that should be sent now
            const now = new Date();
            const alertsToSend = await Alert.findAll({
                where: {
                    // Add logic for scheduled alerts
                    // This could be based on a scheduled_at field or recurring rules
                },
                include: [
                    {
                        model: User,
                        as: 'user'
                    }
                ]
            });

            const results = await this.sendBulkNotifications(alertsToSend);

            console.log(`Sent ${results.filter(r => r.sent).length} scheduled notifications`);
            return results;
        } catch (error) {
            console.error('Error sending scheduled reminders:', error);
            throw error;
        }
    }

    // Test notification system
    static async testNotification(userId, type = 'push') {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const testAlert = {
                id: 'test',
                user_id: userId,
                type: 'custom',
                priority: 'medium',
                title: 'اختبار الإشعارات',
                message: 'هذا اختبار لنظام الإشعارات في تطبيق النحالين',
                created_at: new Date()
            };

            let result;
            switch (type) {
                case 'push':
                    result = await this.sendPushNotification(user, testAlert);
                    break;
                case 'sms':
                    result = await this.sendSMS(user, testAlert);
                    break;
                case 'email':
                    result = await this.sendEmail(user, testAlert);
                    break;
                default:
                    result = await this.sendAlert(testAlert);
            }

            return result;
        } catch (error) {
            console.error('Error testing notification:', error);
            throw error;
        }
    }

    // Update user notification preferences
    static async updateNotificationPreferences(userId, preferences) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const currentPreferences = user.notification_preferences || {};
            const updatedPreferences = { ...currentPreferences, ...preferences };

            await user.update({
                notification_preferences: updatedPreferences
            });

            return updatedPreferences;
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }

    // Get notification statistics
    static async getNotificationStats(userId, days = 30) {
        try {
            // This would require a notifications log table in a real implementation
            // For now, return mock statistics

            return {
                total_sent: 45,
                push_sent: 30,
                sms_sent: 10,
                email_sent: 5,
                delivery_rate: 95.5,
                open_rate: 78.2,
                period_days: days
            };
        } catch (error) {
            console.error('Error getting notification stats:', error);
            throw error;
        }
    }
}

module.exports = NotificationService;