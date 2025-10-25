const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        producer_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        hive_id: {
            type: DataTypes.UUID,
            allowNull: true, // null for products from multiple hives
            references: {
                model: 'hives',
                key: 'id'
            }
        },
        apiary_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'apiaries',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('honey', 'royal_jelly', 'pollen', 'queen', 'wax', 'propolis'),
            allowNull: false
        },
        production_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        unit: {
            type: DataTypes.ENUM('grams', 'kg', 'ml', 'liters', 'pieces'),
            allowNull: false
        },
        quality_grade: {
            type: DataTypes.ENUM('premium', 'grade_a', 'grade_b', 'commercial'),
            defaultValue: 'grade_a'
        },
        properties: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Product-specific properties (moisture, color, etc.)'
        },
        processing_data: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Processing methods and conditions'
        },
        storage_conditions: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Storage temperature, humidity, location'
        },
        expiry_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        cost_production: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            validate: {
                min: 0
            }
        },
        selling_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            validate: {
                min: 0
            }
        },
        quantity_sold: {
            type: DataTypes.DECIMAL(10, 3),
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        quantity_remaining: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        status: {
            type: DataTypes.ENUM('in_production', 'ready', 'partially_sold', 'sold_out', 'expired'),
            defaultValue: 'ready'
        },
        batch_number: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        certifications: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'Organic, halal, quality certifications'
        },
        photos: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'products',
        indexes: [
            {
                fields: ['producer_id']
            },
            {
                fields: ['hive_id']
            },
            {
                fields: ['apiary_id']
            },
            {
                fields: ['type']
            },
            {
                fields: ['production_date']
            },
            {
                fields: ['status']
            },
            {
                fields: ['batch_number']
            }
        ],
        hooks: {
            beforeCreate: (product, options) => {
                product.quantity_remaining = product.quantity;
            },
            beforeUpdate: (product, options) => {
                // Update status based on quantity remaining
                if (product.quantity_remaining <= 0) {
                    product.status = 'sold_out';
                } else if (product.quantity_sold > 0) {
                    product.status = 'partially_sold';
                }

                // Check expiry
                if (product.expiry_date && new Date() > product.expiry_date) {
                    product.status = 'expired';
                }
            }
        }
    });

    Product.associate = (models) => {
        Product.belongsTo(models.User, {
            foreignKey: 'producer_id',
            as: 'producer'
        });

        Product.belongsTo(models.Hive, {
            foreignKey: 'hive_id',
            as: 'hive'
        });

        Product.belongsTo(models.Apiary, {
            foreignKey: 'apiary_id',
            as: 'apiary'
        });
    };

    // Class methods for different product types
    Product.createHoneyProduct = async (data) => {
        const honeyData = {
            ...data,
            type: 'honey',
            properties: {
                moisture_content: data.moisture_content || null,
                honey_type: data.honey_type || 'wildflower',
                color: data.color || null,
                crystallization: data.crystallization || 'liquid',
                ...data.properties
            },
            processing_data: {
                extraction_method: data.extraction_method || 'centrifugal',
                filtration: data.filtration || 'coarse',
                heating_temperature: data.heating_temperature || null,
                ...data.processing_data
            }
        };

        return await Product.create(honeyData);
    };

    Product.createRoyalJellyProduct = async (data) => {
        const royalJellyData = {
            ...data,
            type: 'royal_jelly',
            properties: {
                freshness: data.freshness || 'fresh',
                color: data.color || 'white',
                consistency: data.consistency || 'gel',
                ...data.properties
            },
            storage_conditions: {
                temperature: -18, // Frozen storage
                humidity: 'low',
                container: 'airtight',
                ...data.storage_conditions
            }
        };

        return await Product.create(royalJellyData);
    };

    Product.createPollenProduct = async (data) => {
        const pollenData = {
            ...data,
            type: 'pollen',
            properties: {
                colors: data.colors || [],
                plant_sources: data.plant_sources || [],
                protein_content: data.protein_content || null,
                moisture_content: data.moisture_content || null,
                ...data.properties
            },
            processing_data: {
                drying_method: data.drying_method || 'air_dried',
                cleaning_level: data.cleaning_level || 'cleaned',
                ...data.processing_data
            }
        };

        return await Product.create(pollenData);
    };

    // Instance methods
    Product.prototype.getQuantityAvailable = function () {
        return this.quantity_remaining;
    };

    Product.prototype.getSoldPercentage = function () {
        if (this.quantity <= 0) return 0;
        return (this.quantity_sold / this.quantity) * 100;
    };

    Product.prototype.getProfit = function () {
        if (!this.selling_price || !this.cost_production) return 0;
        const revenue = this.quantity_sold * this.selling_price;
        const cost = this.quantity_sold * this.cost_production;
        return revenue - cost;
    };

    Product.prototype.getProfitMargin = function () {
        if (!this.selling_price || !this.cost_production) return 0;
        return ((this.selling_price - this.cost_production) / this.selling_price) * 100;
    };

    Product.prototype.getDaysUntilExpiry = function () {
        if (!this.expiry_date) return null;

        const today = new Date();
        const expiry = new Date(this.expiry_date);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    Product.prototype.isExpired = function () {
        if (!this.expiry_date) return false;
        return new Date() > new Date(this.expiry_date);
    };

    Product.prototype.isNearExpiry = function (daysThreshold = 30) {
        const daysUntilExpiry = this.getDaysUntilExpiry();
        return daysUntilExpiry !== null && daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
    };

    Product.prototype.sellQuantity = async function (quantityToSell, pricePerUnit = null) {
        if (quantityToSell > this.quantity_remaining) {
            throw new Error('Cannot sell more than available quantity');
        }

        const newQuantitySold = parseFloat(this.quantity_sold) + parseFloat(quantityToSell);
        const newQuantityRemaining = parseFloat(this.quantity_remaining) - parseFloat(quantityToSell);

        const updateData = {
            quantity_sold: newQuantitySold,
            quantity_remaining: newQuantityRemaining
        };

        if (pricePerUnit) {
            updateData.selling_price = pricePerUnit;
        }

        return await this.update(updateData);
    };

    return Product;
};