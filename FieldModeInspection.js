import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    EyeOff,
    Mic,
    MicOff,
    Camera,
    Volume2,
    VolumeX
} from 'lucide-react';
import clsx from 'clsx';

const FieldModeInspection = ({
    questions,
    currentStep,
    onAnswer,
    onNext,
    onPrevious,
    selectedAnswers,
    onTakePhoto,
    onToggleRecording,
    isRecording
}) => {
    const [speechEnabled, setSpeechEnabled] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(questions[currentStep]);

    useEffect(() => {
        setCurrentQuestion(questions[currentStep]);
    }, [currentStep, questions]);

    // تفعيل/إلغاء القراءة الصوتية
    const toggleSpeech = () => {
        if (speechEnabled) {
            window.speechSynthesis.cancel();
            setSpeechEnabled(false);
        } else {
            speakQuestion(currentQuestion);
            setSpeechEnabled(true);
        }
    };

    // قراءة السؤال صوتياً
    const speakQuestion = (question) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `${question.title}. ${question.description}`
            );
            utterance.lang = 'ar-SA';
            utterance.rate = 0.8;
            utterance.onend = () => setSpeechEnabled(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleAnswerSelect = (value) => {
        onAnswer(currentQuestion.id, value);

        // تأخير قصير ثم الانتقال للسؤال التالي تلقائياً
        setTimeout(() => {
            if (currentStep < questions.length - 1) {
                onNext();
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            {/* شريط التقدم */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>السؤال {currentStep + 1} من {questions.length}</span>
                    <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                        className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* السؤال الحالي */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-4">
                    {currentQuestion.title}
                </h1>
                <p className="text-xl text-gray-300 mb-6">
                    {currentQuestion.description}
                </p>

                {/* أزرار الأدوات */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={toggleSpeech}
                        className={clsx(
                            'p-4 rounded-full border-2 transition-all duration-200',
                            speechEnabled
                                ? 'border-primary-500 bg-primary-500 text-white'
                                : 'border-gray-600 text-gray-300 hover:border-gray-500'
                        )}
                    >
                        {speechEnabled ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </button>

                    <button
                        onClick={onTakePhoto}
                        className="p-4 rounded-full border-2 border-gray-600 text-gray-300 hover:border-gray-500 transition-all duration-200"
                    >
                        <Camera className="h-6 w-6" />
                    </button>

                    <button
                        onClick={onToggleRecording}
                        className={clsx(
                            'p-4 rounded-full border-2 transition-all duration-200',
                            isRecording
                                ? 'border-danger-500 bg-danger-500 text-white animate-pulse'
                                : 'border-gray-600 text-gray-300 hover:border-gray-500'
                        )}
                    >
                        {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* خيارات الإجابة - أزرار كبيرة */}
            <div className="grid grid-cols-1 gap-4 mb-8">
                {currentQuestion.options.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedAnswers[currentQuestion.id] === option.value;

                    return (
                        <button
                            key={option.value}
                            onClick={() => handleAnswerSelect(option.value)}
                            className={clsx(
                                'flex items-center justify-center p-8 rounded-2xl border-3 transition-all duration-300 text-xl font-semibold',
                                isSelected
                                    ? 'border-primary-500 bg-primary-500 text-white shadow-lg transform scale-105'
                                    : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500 hover:bg-gray-700 active:transform active:scale-95'
                            )}
                        >
                            <Icon className="h-8 w-8 ml-4" />
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {/* أزرار التنقل */}
            <div className="flex gap-4">
                {currentStep > 0 && (
                    <button
                        onClick={onPrevious}
                        className="flex-1 py-4 px-6 bg-gray-700 text-white rounded-xl text-lg font-medium hover:bg-gray-600 transition-colors duration-200"
                    >
                        السؤال السابق
                    </button>
                )}

                <div className="flex-1"></div> {/* Spacer */}

                {currentStep < questions.length - 1 && selectedAnswers[currentQuestion.id] && (
                    <button
                        onClick={onNext}
                        className="flex-1 py-4 px-6 bg-primary-600 text-white rounded-xl text-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                    >
                        السؤال التالي
                    </button>
                )}
            </div>

            {/* مؤشر الإجابات المكتملة */}
            <div className="fixed bottom-4 left-4 bg-gray-800 rounded-lg p-3">
                <div className="flex gap-2">
                    {questions.map((_, index) => (
                        <div
                            key={index}
                            className={clsx(
                                'w-3 h-3 rounded-full',
                                selectedAnswers[questions[index].id]
                                    ? 'bg-primary-500'
                                    : index === currentStep
                                        ? 'bg-gray-500'
                                        : 'bg-gray-700'
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FieldModeInspection;