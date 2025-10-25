const { Feeding, Hive, Apiary, User, Inspection } = require('../models');
const { Op } = require('sequelize');

class FeedingService {
    // Create a new feeding record
    static async createFeeding(feedingData) {
        try {
            const feeding = await Feeding.create({
                ...feedingData,
                feeding_date: feedingData.feeding_date || new Date(),
                created_at: new Date()
            });

            return feeding;
        } catch (error) {
            console.error('Error creating feeding record:', error);
            throw error;
        }
    }

    // Get feeding records with filtering
    static async getFeedings(userId, filters = {}, pagination = {}) {
        try {
            const {
                hive_id,
                apiary_id,
                feeding_type,
                date_from,
                date_to,
                status
            } = filters;

            const {
                page = 1,
                limit = 20,
                sort_by = 'feeding_date',
                sort_order = 'DESC'
            } = pagination;

            const whereClause = { user_id: userId };

            // Apply filters
            if (hive_id) whereClause.hive_id = hive_id;
            if (apiary_id) whereClause.apiary_id = apiary_id;
            if (feeding_type) whereClause.feeding_type = feeding_type;
            if (status) whereClause.status = status;

            if (date_from || date_to) {
                whereClause.feeding_date = {};
                if (date_from) whereClause.feeding_date[Op.gte] = new Date(date_from);
                if (date_to) whereClause.feeding_date[Op.lte] = new Date(date_to);
            }

            const offset = (page - 1) * limit;

            const { rows: feedings, count } = await Feeding.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Hive,
                        as: 'hive',
                        attributes: ['id', 'name', 'hive_type'],
                        include: [{
                            model: Apiary,
                            as: 'apiary',
                            attributes: ['id', 'name', 'location']
                        }]
                    }
                ],
                order: [[sort_by, sort_order]],
                limit,
                offset
            });

            return {
                feedings,
                pagination: {
                    total: count,
                    page,
                    limit,
                    total_pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching feedings:', error);
            throw error;
        }
    }

    // Calculate feeding amounts based on hive conditions
    static calculateFeedingAmounts(hiveData, feedingType, season = null, weatherConditions = null) {
        try {
            const {
                population_strength,
                food_stores,
                brood_pattern,
                hive_type = 'langstroth',
                frame_count = 10
            } = hiveData;

            // Base calculations
            const baseAmounts = this.getBaseFeedingAmounts(feedingType, hive_type);

            // Population multiplier
            const populationMultiplier = this.getPopulationMultiplier(population_strength);

            // Food stores adjustment
            const foodStoresMultiplier = this.getFoodStoresMultiplier(food_stores);

            // Brood pattern adjustment
            const broodMultiplier = this.getBroodMultiplier(brood_pattern);

            // Seasonal adjustment
            const seasonalMultiplier = this.getSeasonalMultiplier(season);

            // Weather adjustment
            const weatherMultiplier = this.getWeatherMultiplier(weatherConditions);

            // Calculate final amounts
            const totalMultiplier = populationMultiplier * foodStoresMultiplier * broodMultiplier * seasonalMultiplier * weatherMultiplier;

            const calculatedAmounts = {};
            Object.keys(baseAmounts).forEach(ingredient => {
                calculatedAmounts[ingredient] = Math.round(baseAmounts[ingredient] * totalMultiplier);
            });

            // Calculate cost
            const cost = this.calculateFeedingCost(calculatedAmounts, feedingType);

            return {
                amounts: calculatedAmounts,
                total_cost: cost,
                feeding_type: feedingType,
                multipliers: {
                    population: populationMultiplier,
                    food_stores: foodStoresMultiplier,
                    brood: broodMultiplier,
                    seasonal: seasonalMultiplier,
                    weather: weatherMultiplier,
                    total: totalMultiplier
                },
                recommendations: this.getFeedingRecommendations(hiveData, feedingType, calculatedAmounts)
            };
        } catch (error) {
            console.error('Error calculating feeding amounts:', error);
            throw error;
        }
    }

    // Get base feeding amounts for different types
    static getBaseFeedingAmounts(feedingType, hiveType) {
        const baseAmounts = {
            sugar_syrup: {
                sugar: 1000, // grams
                water: 1000, // ml
                honey: 0
            },
            honey_syrup: {
                sugar: 500,
                water: 500,
                honey: 200
            },
            pollen_patty: {
                pollen: 200,
                sugar: 300,
                water: 100,
                honey: 150
            },
            protein_patty: {
                soy_flour: 150,
                yeast: 50,
                sugar: 200,
                water: 100,
                honey: 100
            },
            emergency_feeding: {
                sugar: 2000,
                water: 1000,
                honey: 0
            },
            winter_feeding: {
                sugar: 1500,
                water: 750,
                honey: 300
            },
            stimulative_feeding: {
                sugar: 500,
                water: 500,
                honey: 100
            }
        };

        // Adjust for hive type
        const hiveMultipliers = {
            langstroth: 1.0,
            dadant: 1.2,
            top_bar: 0.8,
            warre: 0.9,
            national: 1.0
        };

        const multiplier = hiveMultipliers[hiveType] || 1.0;
        const amounts = baseAmounts[feedingType] || baseAmounts.sugar_syrup;

        const adjustedAmounts = {};
        Object.keys(amounts).forEach(ingredient => {
            adjustedAmounts[ingredient] = Math.round(amounts[ingredient] * multiplier);
        });

        return adjustedAmounts;
    }

    // Get population strength multiplier
    static getPopulationMultiplier(populationStrength) {
        const multipliers = {
            very_weak: 0.3,
            weak: 0.5,
            moderate: 0.8,
            strong: 1.0,
            very_strong: 1.3
        };
        return multipliers[populationStrength] || 1.0;
    }

    // Get food stores multiplier
    static getFoodStoresMultiplier(foodStores) {
        const multipliers = {
            none: 2.0,
            critical: 1.8,
            low: 1.5,
            adequate: 1.0,
            abundant: 0.5
        };
        return multipliers[foodStores] || 1.0;
    }

    // Get brood pattern multiplier
    static getBroodMultiplier(broodPattern) {
        const multipliers = {
            none: 0.5,
            poor: 0.7,
            fair: 0.9,
            good: 1.0,
            excellent: 1.2
        };
        return multipliers[broodPattern] || 1.0;
    }

    // Get seasonal multiplier
    static getSeasonalMultiplier(season) {
        if (!season) {
            const month = new Date().getMonth() + 1;
            if (month >= 3 && month <= 5) season = 'spring';
            else if (month >= 6 && month <= 8) season = 'summer';
            else if (month >= 9 && month <= 11) season = 'autumn';
            else season = 'winter';
        }

        const multipliers = {
            spring: 1.3, // Active season, more feeding needed
            summer: 0.8, // Natural nectar flow
            autumn: 1.5, // Preparation for winter
            winter: 1.0  // Maintenance feeding
        };
        return multipliers[season] || 1.0;
    }

    // Get weather multiplier
    static getWeatherMultiplier(weatherConditions) {
        if (!weatherConditions) return 1.0;

        let multiplier = 1.0;

        // Temperature adjustment
        if (weatherConditions.temperature < 15) {
            multiplier *= 1.2; // Cold weather increases energy needs
        } else if (weatherConditions.temperature > 35) {
            multiplier *= 0.9; // Hot weather may reduce feeding
        }

        // Weather conditions adjustment
        if (weatherConditions.conditions) {
            if (weatherConditions.conditions.includes('ممطر')) {
                multiplier *= 1.3; // Rainy weather prevents foraging
            } else if (weatherConditions.conditions.includes('عاصف')) {
                multiplier *= 1.2; // Windy weather limits foraging
            }
        }

        return multiplier;
    }

    // Calculate feeding cost
    static calculateFeedingCost(amounts, feedingType) {
        // Price per unit in SAR
        const prices = {
            sugar: 0.003, // per gram
            water: 0.001, // per ml
            honey: 0.02,  // per gram
            pollen: 0.05, // per gram
            soy_flour: 0.008, // per gram
            yeast: 0.02   // per gram
        };

        let totalCost = 0;
        Object.keys(amounts).forEach(ingredient => {
            const price = prices[ingredient] || 0;
            totalCost += amounts[ingredient] * price;
        });

        return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
    }

    // Get feeding recommendations
    static getFeedingRecommendations(hiveData, feedingType, amounts) {
        const recommendations = [];

        // Based on population strength
        if (hiveData.population_strength === 'very_weak') {
            recommendations.push('الطائفة ضعيفة جداً - قدم التغذية على دفعات صغيرة متكررة');
            recommendations.push('تجنب التغذية الثقيلة التي قد تسبب السرقة');
        } else if (hiveData.population_strength === 'very_strong') {
            recommendations.push('الطائفة قوية - يمكن زيادة كمية التغذية');
            recommendations.push('راقب علامات التطريد مع التغذية المحفزة');
        }

        // Based on food stores
        if (hiveData.food_stores === 'critical' || hiveData.food_stores === 'none') {
            recommendations.push('مخزون الغذاء حرج - ابدأ التغذية فوراً');
            recommendations.push('قدم التغذية يومياً حتى تحسن الوضع');
        }

        // Based on brood pattern
        if (hiveData.brood_pattern === 'excellent') {
            recommendations.push('نمط الحضنة ممتاز - التغذية البروتينية مفيدة');
        } else if (hiveData.brood_pattern === 'poor' || hiveData.brood_pattern === 'none') {
            recommendations.push('نمط الحضنة ضعيف - ركز على التغذية المحفزة');
        }

        // Feeding type specific recommendations
        switch (feedingType) {
            case 'sugar_syrup':
                recommendations.push('قدم المحلول السكري في المساء لتجنب السرقة');
                recommendations.push('استخدم نسبة 1:1 للتغذية المحفزة أو 2:1 للتخزين');
                break;
            case 'pollen_patty':
                recommendations.push('ضع عجينة اللقاح فوق الإطارات مباشرة');
                recommendations.push('غطها بورق شمعي لمنع الجفاف');
                break;
            case 'emergency_feeding':
                recommendations.push('التغذية الطارئة - قدم كميات كبيرة بسرعة');
                recommendations.push('راقب الخلية يومياً أثناء التغذية الطارئة');
                break;
        }

        // General recommendations
        recommendations.push('تأكد من نظافة أدوات التغذية');
        recommendations.push('راقب استجابة النحل وعدل الكميات حسب الحاجة');

        return recommendations;
    }

    // Get feeding recipes
    static getFeedingRecipes() {
        return {
            sugar_syrup_1_1: {
                name: 'محلول سكري 1:1 (محفز)',
                description: 'للتحفيز على وضع البيض وبناء الشمع',
                ingredients: {
                    sugar: { amount: 1000, unit: 'جرام', notes: 'سكر أبيض نقي' },
                    water: { amount: 1000, unit: 'مل', notes: 'ماء نظيف' }
                },
                instructions: [
                    'اغلي الماء في إناء نظيف',
                    'أضف السكر تدريجياً مع التحريك',
                    'حرك حتى يذوب السكر تماماً',
                    'اتركه يبرد إلى درجة حرارة الغرفة',
                    'قدمه في غذايات نظيفة'
                ],
                usage: 'للتحفيز في الربيع والخريف',
                storage: 'يحفظ في الثلاجة لمدة أسبوع',
                cost_per_liter: 3.0
            },
            sugar_syrup_2_1: {
                name: 'محلول سكري 2:1 (تخزين)',
                description: 'للتخزين والتحضير للشتاء',
                ingredients: {
                    sugar: { amount: 2000, unit: 'جرام', notes: 'سكر أبيض نقي' },
                    water: { amount: 1000, unit: 'مل', notes: 'ماء نظيف' }
                },
                instructions: [
                    'اغلي الماء في إناء نظيف',
                    'أضف السكر تدريجياً مع التحريك المستمر',
                    'حرك حتى يذوب السكر تماماً',
                    'اتركه يبرد قبل التقديم',
                    'قدمه في كميات كبيرة'
                ],
                usage: 'للتخزين في الخريف والشتاء',
                storage: 'يحفظ في الثلاجة لمدة أسبوعين',
                cost_per_liter: 6.0
            },
            pollen_patty: {
                name: 'عجينة حبوب اللقاح',
                description: 'تغذية بروتينية لتحفيز تربية الحضنة',
                ingredients: {
                    pollen: { amount: 200, unit: 'جرام', notes: 'حبوب لقاح طبيعية' },
                    sugar: { amount: 300, unit: 'جرام', notes: 'سكر بودرة' },
                    honey: { amount: 150, unit: 'جرام', notes: 'عسل طبيعي' },
                    water: { amount: 50, unit: 'مل', notes: 'ماء دافئ' }
                },
                instructions: [
                    'اخلط حبوب اللقاح مع السكر البودرة',
                    'أضف العسل تدريجياً',
                    'أضف الماء الدافئ قليلاً',
                    'اعجن حتى تحصل على عجينة متماسكة',
                    'شكلها على هيئة أقراص مسطحة'
                ],
                usage: 'في الربيع لتحفيز تربية الحضنة',
                storage: 'تحفظ في الثلاجة لمدة شهر',
                cost_per_kg: 25.0
            },
            protein_patty: {
                name: 'عجينة البروتين البديل',
                description: 'بديل حبوب اللقاح للتغذية البروتينية',
                ingredients: {
                    soy_flour: { amount: 200, unit: 'جرام', notes: 'دقيق الصويا' },
                    yeast: { amount: 50, unit: 'جرام', notes: 'خميرة غذائية' },
                    sugar: { amount: 200, unit: 'جرام', notes: 'سكر بودرة' },
                    honey: { amount: 100, unit: 'جرام', notes: 'عسل طبيعي' },
                    water: { amount: 80, unit: 'مل', notes: 'ماء دافئ' }
                },
                instructions: [
                    'اخلط دقيق الصويا مع الخميرة والسكر',
                    'أضف العسل واخلط جيداً',
                    'أضف الماء تدريجياً حتى تتكون عجينة',
                    'اعجن لمدة 5 دقائق',
                    'شكلها على هيئة أقراص'
                ],
                usage: 'عند نقص حبوب اللقاح الطبيعية',
                storage: 'تحفظ في الثلاجة لمدة 3 أسابيع',
                cost_per_kg: 15.0
            },
            winter_candy: {
                name: 'حلوى الشتاء',
                description: 'تغذية صلبة للشتاء',
                ingredients: {
                    sugar: { amount: 2000, unit: 'جرام', notes: 'سكر أبيض' },
                    honey: { amount: 300, unit: 'جرام', notes: 'عسل طبيعي' },
                    water: { amount: 200, unit: 'مل', notes: 'ماء' }
                },
                instructions: [
                    'اخلط السكر مع الماء في مقلاة',
                    'اتركه على نار هادئة حتى يذوب',
                    'أضف العسل واخلط',
                    'اتركه ينضج حتى يصبح كثيفاً',
                    'اسكبه في قوالب واتركه يبرد'
                ],
                usage: 'للتغذية الشتوية الطويلة المدى',
                storage: 'يحفظ في مكان جاف لعدة أشهر',
                cost_per_kg: 8.0
            }
        };
    }

    // Calculate bulk feeding for multiple hives
    static calculateBulkFeeding(hivesData, feedingType, season = null) {
        try {
            const results = {
                total_amounts: {},
                total_cost: 0,
                hive_calculations: [],
                shopping_list: {},
                recommendations: []
            };

            // Calculate for each hive
            hivesData.forEach(hiveData => {
                const calculation = this.calculateFeedingAmounts(hiveData, feedingType, season);
                results.hive_calculations.push({
                    hive_id: hiveData.hive_id,
                    hive_name: hiveData.hive_name,
                    ...calculation
                });

                // Add to totals
                Object.keys(calculation.amounts).forEach(ingredient => {
                    if (!results.total_amounts[ingredient]) {
                        results.total_amounts[ingredient] = 0;
                    }
                    results.total_amounts[ingredient] += calculation.amounts[ingredient];
                });

                results.total_cost += calculation.total_cost;
            });

            // Generate shopping list with package sizes
            results.shopping_list = this.generateShoppingList(results.total_amounts);

            // Generate bulk recommendations
            results.recommendations = this.getBulkFeedingRecommendations(hivesData.length, results.total_amounts);

            return results;
        } catch (error) {
            console.error('Error calculating bulk feeding:', error);
            throw error;
        }
    }

    // Generate shopping list with package sizes
    static generateShoppingList(totalAmounts) {
        const packageSizes = {
            sugar: { size: 1000, unit: 'جرام', price: 3.0 },
            honey: { size: 500, unit: 'جرام', price: 25.0 },
            pollen: { size: 100, unit: 'جرام', price: 15.0 },
            soy_flour: { size: 500, unit: 'جرام', price: 8.0 },
            yeast: { size: 100, unit: 'جرام', price: 5.0 }
        };

        const shoppingList = {};

        Object.keys(totalAmounts).forEach(ingredient => {
            if (packageSizes[ingredient]) {
                const needed = totalAmounts[ingredient];
                const packageSize = packageSizes[ingredient].size;
                const packagesNeeded = Math.ceil(needed / packageSize);
                const totalCost = packagesNeeded * packageSizes[ingredient].price;

                shoppingList[ingredient] = {
                    needed_amount: needed,
                    package_size: packageSize,
                    packages_needed: packagesNeeded,
                    unit_price: packageSizes[ingredient].price,
                    total_cost: totalCost,
                    unit: packageSizes[ingredient].unit
                };
            }
        });

        return shoppingList;
    }

    // Get bulk feeding recommendations
    static getBulkFeedingRecommendations(hiveCount, totalAmounts) {
        const recommendations = [];

        recommendations.push(`تغذية ${hiveCount} خلية - خطط للتغذية في نفس الوقت`);
        recommendations.push('حضر جميع المواد مسبقاً لتوفير الوقت');

        if (hiveCount > 10) {
            recommendations.push('للمناحل الكبيرة: استخدم خزانات خلط كبيرة');
            recommendations.push('وزع العمل على عدة أيام لتجنب الإرهاق');
        }

        if (totalAmounts.sugar > 10000) {
            recommendations.push('كمية السكر كبيرة - تأكد من التخزين الجاف');
            recommendations.push('اشتري السكر بالجملة لتوفير التكلفة');
        }

        recommendations.push('سجل استجابة كل خلية لتعديل الكميات لاحقاً');
        recommendations.push('تأكد من تنظيف جميع أدوات التغذية بعد الانتهاء');

        return recommendations;
    }

    // Get feeding schedule recommendations
    static getFeedingSchedule(hiveData, feedingType, duration = 30) {
        const schedule = [];
        const startDate = new Date();

        // Determine feeding frequency based on type and hive condition
        let frequency; // days between feedings
        let amount_per_feeding;

        switch (feedingType) {
            case 'emergency_feeding':
                frequency = 1; // daily
                amount_per_feeding = 1.0;
                break;
            case 'stimulative_feeding':
                frequency = 2; // every 2 days
                amount_per_feeding = 0.5;
                break;
            case 'maintenance_feeding':
                frequency = 7; // weekly
                amount_per_feeding = 1.0;
                break;
            default:
                frequency = 3; // every 3 days
                amount_per_feeding = 0.7;
        }

        // Adjust frequency based on hive condition
        if (hiveData.food_stores === 'critical') {
            frequency = Math.max(1, frequency - 1);
        } else if (hiveData.food_stores === 'abundant') {
            frequency = frequency + 2;
        }

        // Generate schedule
        for (let day = 0; day < duration; day += frequency) {
            const feedingDate = new Date(startDate);
            feedingDate.setDate(startDate.getDate() + day);

            schedule.push({
                date: feedingDate.toISOString().split('T')[0],
                feeding_type: feedingType,
                amount_multiplier: amount_per_feeding,
                notes: this.getScheduleNotes(day, feedingType, hiveData)
            });
        }

        return schedule;
    }

    // Get schedule notes
    static getScheduleNotes(day, feedingType, hiveData) {
        const notes = [];

        if (day === 0) {
            notes.push('بداية برنامج التغذية');
        }

        if (day % 7 === 0 && day > 0) {
            notes.push('فحص أسبوعي - قيم استجابة النحل');
        }

        if (feedingType === 'emergency_feeding' && day > 7) {
            notes.push('قيم إمكانية تقليل التغذية');
        }

        if (hiveData.population_strength === 'very_weak' && day % 3 === 0) {
            notes.push('راقب علامات التحسن في قوة الطائفة');
        }

        return notes.join(' • ');
    }

    // Update feeding record
    static async updateFeeding(feedingId, updateData, userId) {
        try {
            const [updatedRows] = await Feeding.update(
                updateData,
                {
                    where: {
                        id: feedingId,
                        user_id: userId
                    }
                }
            );

            if (updatedRows === 0) {
                return null;
            }

            return await Feeding.findByPk(feedingId);
        } catch (error) {
            console.error('Error updating feeding:', error);
            throw error;
        }
    }

    // Delete feeding record
    static async deleteFeeding(feedingId, userId) {
        try {
            const deletedRows = await Feeding.destroy({
                where: {
                    id: feedingId,
                    user_id: userId
                }
            });

            return deletedRows > 0;
        } catch (error) {
            console.error('Error deleting feeding:', error);
            throw error;
        }
    }

    // Get feeding statistics
    static async getFeedingStats(userId, filters = {}) {
        try {
            const { hive_id, apiary_id, days = 30 } = filters;

            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            const whereClause = {
                user_id: userId,
                feeding_date: { [Op.gte]: dateFrom }
            };

            if (hive_id) whereClause.hive_id = hive_id;
            if (apiary_id) whereClause.apiary_id = apiary_id;

            const feedings = await Feeding.findAll({
                where: whereClause,
                attributes: [
                    'feeding_type',
                    'total_cost',
                    'feeding_date',
                    [Feeding.sequelize.fn('COUNT', Feeding.sequelize.col('id')), 'count'],
                    [Feeding.sequelize.fn('SUM', Feeding.sequelize.col('total_cost')), 'total_spent']
                ],
                group: ['feeding_type'],
                raw: true
            });

            // Process statistics
            const stats = {
                total_feedings: 0,
                total_cost: 0,
                by_type: {},
                average_cost_per_feeding: 0,
                most_used_type: null
            };

            let maxCount = 0;

            feedings.forEach(feeding => {
                const count = parseInt(feeding.count);
                const cost = parseFloat(feeding.total_spent) || 0;

                stats.total_feedings += count;
                stats.total_cost += cost;

                stats.by_type[feeding.feeding_type] = {
                    count: count,
                    total_cost: cost,
                    average_cost: cost / count
                };

                if (count > maxCount) {
                    maxCount = count;
                    stats.most_used_type = feeding.feeding_type;
                }
            });

            stats.average_cost_per_feeding = stats.total_feedings > 0
                ? stats.total_cost / stats.total_feedings
                : 0;

            return stats;
        } catch (error) {
            console.error('Error getting feeding stats:', error);
            throw error;
        }
    }
}

module.exports = FeedingService;