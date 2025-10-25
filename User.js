const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [2, 100]
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^[+]?[0-9\s-()]+$/
            }
        },
        location: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        role: {
            type: DataTypes.ENUM('user', 'admin', 'moderator'),
            defaultValue: 'user'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        },
        preferences: {
            type: DataTypes.JSONB,
            defaultValue: {
                language: 'ar',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                privacy: {
                    show_location: false,
                    show_apiary_details: false
                }
            }
        }
    }, {
        tableName: 'users',
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['is_active']
            }
        ]
    });

    User.associate = (models) => {
        User.hasMany(models.Apiary, {
            foreignKey: 'owner_id',
            as: 'apiaries'
        });
    };

    return User;
};