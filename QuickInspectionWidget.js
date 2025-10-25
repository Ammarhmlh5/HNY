import React, { useState } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    Zap,
    Clock,
    TrendingUp,
    TrendingDown,
    ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const QuickInspectionWidget = ({ hive, onComplete, className }) => {
    const [responses, setResponses] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const questions = [
        {
            id: 'queen_present',
            text: 'الملكة موجودة؟',
            options: [
                { value: 'yes', label: '✓', color: 'success' },
                { value: 'not_seen', label: '?', color: 'warning' },
                { value: 'no', label: '✗', color: 'danger' }
            ]
        },
        {
            id: 'queen_laying',
            text: 'الملكة تبيض؟',
            options: [
                { value: 'yes', label: '✓', color: 'success' },
                { value: 'poor', label: '~', color: 'warning' },
                { value: 'no', label: '✗', color: 'danger' }
            ]
        },
        {
            id: 'brood_pattern',
            text: 'نمط الحضنة؟',
            options: [
                { value: 'excellent', label: 'A+', color: 'success' },
                { value: 'good', label: 'A', color: 'success' },
                { value: 'fair', label: 'B', color: 'warning' },
                { value: 'poor', label: 'C', color: 'danger' }
            ]
        },
        {
            id: 'population_strength',
            text: 'قوة الطائفة؟',
            options: [
                { value: 'very_strong', label: '5', color: 'success' },
                { value: 'strong', label: '4', color: 'success' },
                { value: 'moderate', label: '3', color: 'warning' },
                { value: 'weak', label: '2', color: 'danger' },
                { value: 'very_weak', label: '1', color: 'danger' }
            ]
        },
        {
            id: 'food_stores',
            text: 'مخزون الغذاء؟',
            options: [
                { value: 'abundant', label: '100%', color: 'success' },
                { value: 'adequate', label: '75%', color: 'success' },
                { value: 'low', label: '25%', color: 'warning' },
                { value: 'critical', label: '5%', color: 'danger' },
                { value: 'none', label: '0%', color: 'danger' }
            ]
        }
    ];

    const handleResponse = (questionId, value) => {
        const newResponses = { ...responses, [questionId]: value };
        setResponses(newResponses);

        // Auto-advance to next question
        if (currentQuestion < questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1);
            }, 300);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Calculate quick score
            const score = calculateQuickScore(responses);
            const status = getStatusFromScore(score);

            const result = {
                responses,
                score,
                status,
                timestamp: new Date().toISOString(),
                hive_id: hive.id
            };

            // في التطبيق الحقيقي: await axios.post(`/api/inspections/hive/${hive.id}/quick`, result);
            console.log('Quick inspection result:', result);

            toast.success('تم حفظ الفحص السريع');
            onComplete && onComplete(result);

        } catch (error) {
            toast.error('خطأ في حفظ الفحص');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateQuickScore = (responses) => {
        const weights = {
            queen_present: 25,
            queen_laying: 25,
            brood_pattern: 20,
            population_strength: 15,
            food_stores: 15
        };

        const scores = {
            queen_present: {
                yes: 100,
                not_seen: 70,
                no: 0
            },
            queen_laying: {
                yes: 100,
                poor: 50,
                no: 0
            },
            brood_pattern: {
                excellent: 100,
                good: 80,
                fair: 60,
                poor: 30,
                none: 0
            },
            population_strength: {
                very_strong: 100,
                strong: 80,
                moderate: 60,
                weak: 30,
                very_weak: 10
            },
            food_stores: {
                abundant: 100,
                adequate: 80,
                low: 40,
                critical: 10,
                none: 0
            }
        };

        let totalScore = 0;
        let totalWeight = 0;

        Object.keys(responses).forEach(questionId => {
            const response = responses[questionId];
            const weight = weights[questionId];
            const score = scores[questionId][response] || 0;

            totalScore += (score * weight) / 100;
            totalWeight += weight;
        });

        return totalWeight > 0 ? Math.round(totalScore / totalWeight * 100) : 0;
    };

    const getStatusFromScore = (score) => {
        if (score >= 80) return 'green';
        if (score >= 60) return 'yellow';
        if (score >= 40) return 'orange';
        return 'red';
    };

    const getProgressPercentage = () => {
        return Math.round(((currentQuestion + 1) / questions.length) * 100);
    };

    const isComplete = Object.keys(responses).length === questions.length;
    const currentQ = questions[currentQuestion];

    return (
        <div className={clsx('card', className)}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Zap className="h-5 w-5 text-primary-600 ml-2" />
                    <h3 className="text-lg font-semibold text-gray-900">فحص سريع</h3>
                </div>
                <div className="text-sm text-gray-500">
                    {hive.name}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>السؤال {currentQuestion + 1} من {questions.length}</span>
                    <span>{getProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>
            </div>

            {!isComplete ? (
                <>
                    {/* Current Question */}
                    <div className="mb-4">
                        <h4 className="text-base font-medium text-gray-900 mb-3">
                            {currentQ.text}
                        </h4>

                        <div className="grid grid-cols-3 gap-2">
                            {currentQ.options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleResponse(currentQ.id, option.value)}
                                    className={clsx(
                                        'p-3 rounded-lg border-2 font-medium transition-all duration-200',
                                        responses[currentQ.id] === option.value
                                            ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div className="flex justify-between">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="btn-outline btn-sm disabled:opacity-50"
                        >
                            السابق
                        </button>

                        <div className="flex gap-1">
                            {questions.map((_, index) => (
                                <div
                                    key={index}
                                    className={clsx(
                                        'w-2 h-2 rounded-full',
                                        index <= currentQuestion ? 'bg-primary-600' : 'bg-gray-300',
                                        responses[questions[index].id] && 'bg-success-600'
                                    )}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                            disabled={currentQuestion === questions.length - 1}
                            className="btn-outline btn-sm disabled:opacity-50"
                        >
                            التالي
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Results Summary */}
                    <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-primary-600 mb-2">
                            {calculateQuickScore(responses)}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                            النقاط الإجمالية
                        </div>

                        {/* Status Indicator */}
                        <div className={clsx(
                            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                            {
                                'bg-success-100 text-success-800': getStatusFromScore(calculateQuickScore(responses)) === 'green',
                                'bg-warning-100 text-warning-800': getStatusFromScore(calculateQuickScore(responses)) === 'yellow',
                                'bg-orange-100 text-orange-800': getStatusFromScore(calculateQuickScore(responses)) === 'orange',
                                'bg-danger-100 text-danger-800': getStatusFromScore(calculateQuickScore(responses)) === 'red'
                            }
                        )}>
                            {getStatusFromScore(calculateQuickScore(responses)) === 'green' && 'ممتاز'}
                            {getStatusFromScore(calculateQuickScore(responses)) === 'yellow' && 'جيد'}
                            {getStatusFromScore(calculateQuickScore(responses)) === 'orange' && 'يحتاج انتباه'}
                            {getStatusFromScore(calculateQuickScore(responses)) === 'red' && 'حرج'}
                        </div>
                    </div>

                    {/* Response Summary */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                        {questions.map((question, index) => {
                            const response = responses[question.id];
                            const option = question.options.find(opt => opt.value === response);

                            return (
                                <div
                                    key={question.id}
                                    className={clsx(
                                        'text-center p-2 rounded-lg border',
                                        option ? `border-${option.color}-300 bg-${option.color}-50` : 'border-gray-300 bg-gray-50'
                                    )}
                                >
                                    <div className={clsx(
                                        'text-lg font-bold',
                                        option ? `text-${option.color}-700` : 'text-gray-500'
                                    )}>
                                        {option ? option.label : '?'}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {question.text.split('؟')[0]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="spinner ml-2"></div>
                                    جاري الحفظ...
                                </div>
                            ) : (
                                'حفظ الفحص'
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setResponses({});
                                setCurrentQuestion(0);
                            }}
                            className="btn-outline"
                        >
                            إعادة
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default QuickInspectionWidget;