import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { QuizMeResponse } from '../../types/tutor';
import { useTutorStore } from '../../store/useTutorStore';
import { useColors } from '../../hooks/useColors';
import { FontSize, Radius, Spacing } from '../../constants/theme';

interface InteractiveQuizProps {
    messageId: string;
    quizData: QuizMeResponse;
    quizState?: {
        answers: Record<string, string>;
        isCompleted: boolean;
    };
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ messageId, quizData, quizState }) => {
    const colors = useColors();
    const { submitQuiz } = useTutorStore();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});

    const questions = quizData.questions || [];
    const isCompleted = quizState?.isCompleted || false;
    const finalAnswers = isCompleted && quizState ? quizState.answers : localAnswers;

    if (questions.length === 0) return null;

    const handleSelectOption = (questionId: string, option: string) => {
        if (isCompleted) return;
        setLocalAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = () => {
        if (isCompleted) return;
        submitQuiz(messageId, localAnswers);
    };

    // ── Completed View ───────────────────────────────────────────
    if (isCompleted) {
        return (
            <View style={styles.container}>
                <Text style={styles.headerTitle}>Quiz Results - {quizData.topic}</Text>
                
                {questions.map((q, idx) => {
                    const selected = finalAnswers[q.question_id];
                    const evaluation = quizState?.evaluations?.[q.question_id];
                    const actualCorrectAnswer = evaluation?.correct_answer || q.correct_answer;
                    const isCorrect = evaluation ? evaluation.is_correct : (selected === actualCorrectAnswer);
                    
                    return (
                        <View key={q.question_id} style={styles.resultCard}>
                            <Text style={styles.questionText}>
                                {idx + 1}. {q.question}
                            </Text>
                            <View style={styles.optionsList}>
                                {q.options.map(opt => {
                                    const isThisSelected = opt === selected;
                                    const isThisCorrect = opt === actualCorrectAnswer;
                                    
                                    let bgColor = '#F8F8F9';
                                    let borderColor = '#E5E7EB';
                                    let icon = null;

                                    if (isThisCorrect) {
                                        bgColor = '#DEF7EC';
                                        borderColor = '#31C48D';
                                        icon = <Ionicons name="checkmark-circle" size={16} color="#046C4E" style={{ marginLeft: 'auto' }} />;
                                    } else if (isThisSelected && !isThisCorrect) {
                                        bgColor = '#FDE8E8';
                                        borderColor = '#F98080';
                                        icon = <Ionicons name="close-circle" size={16} color="#9B1C1C" style={{ marginLeft: 'auto' }} />;
                                    }

                                    return (
                                        <View key={opt} style={[styles.optionRow, { backgroundColor: bgColor, borderColor }]}>
                                            <Text style={[styles.optionText, isThisCorrect && { color: '#046C4E', fontWeight: 'bold' }, isThisSelected && !isThisCorrect && { color: '#9B1C1C' }]}>
                                                {opt}
                                            </Text>
                                            {icon}
                                        </View>
                                    );
                                })}
                            </View>
                            {evaluation?.explanation && (
                                <View style={[styles.explanationBox, isCorrect ? styles.explanationBoxCorrect : styles.explanationBoxIncorrect]}>
                                    <Text style={[styles.explanationText, isCorrect ? styles.explanationTextCorrect : styles.explanationTextIncorrect]}>
                                        <Text style={{fontWeight: 'bold'}}>Explanation:</Text> {evaluation.explanation}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        );
    }

    // ── Interactive View ──────────────────────────────────────────
    const currentQ = questions[currentIndex];
    const selectedForCurrent = localAnswers[currentQ.question_id];
    const isLast = currentIndex === questions.length - 1;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quiz: {quizData.topic}</Text>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {questions.length}
                </Text>
            </View>

            <View style={styles.questionCard}>
                <Text style={styles.questionText}>{currentQ.question}</Text>
                
                <View style={styles.optionsList}>
                    {currentQ.options.map((opt) => {
                        const isSelected = selectedForCurrent === opt;
                        return (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                                onPress={() => handleSelectOption(currentQ.question_id, opt)}
                            >
                                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]} 
                    onPress={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>Previous</Text>
                </TouchableOpacity>

                {isLast ? (
                    <TouchableOpacity 
                        style={[styles.submitBtn, !selectedForCurrent && styles.submitBtnDisabled]} 
                        onPress={handleSubmit}
                        disabled={!selectedForCurrent}
                    >
                        <Text style={styles.submitBtnText}>Submit Quiz</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.navBtn, styles.nextBtn, !selectedForCurrent && styles.navBtnDisabled]} 
                        onPress={handleNext}
                        disabled={!selectedForCurrent}
                    >
                        <Text style={[styles.navBtnText, styles.nextBtnText, !selectedForCurrent && styles.navBtnTextDisabled]}>Next</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: Spacing.md,
        marginVertical: Spacing.xs,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: FontSize.base,
        fontWeight: 'bold',
        color: '#1E1B4B',
    },
    progressText: {
        fontSize: FontSize.sm,
        color: '#6B7280',
        fontWeight: '500',
    },
    questionCard: {
        marginBottom: Spacing.md,
    },
    questionText: {
        fontSize: FontSize.md,
        color: '#1E1B4B',
        fontWeight: '600',
        marginBottom: Spacing.md,
        lineHeight: 22,
    },
    optionsList: {
        gap: Spacing.sm,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    optionBtnSelected: {
        borderColor: '#3C2CDA',
        backgroundColor: '#F0EFFF',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#3C2CDA',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3C2CDA',
    },
    optionText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: '#4B5563',
    },
    optionTextSelected: {
        color: '#3C2CDA',
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
    },
    navBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: Radius.full,
        backgroundColor: '#F3F4F6',
    },
    navBtnDisabled: {
        opacity: 0.5,
    },
    nextBtn: {
        backgroundColor: '#E2E6F2',
    },
    navBtnText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: '#4B5563',
    },
    nextBtnText: {
        color: '#3C2CDA',
    },
    navBtnTextDisabled: {
        color: '#9CA3AF',
    },
    submitBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: Radius.full,
        backgroundColor: '#3C2CDA',
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnText: {
        fontSize: FontSize.sm,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    resultCard: {
        marginBottom: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: Radius.sm,
        borderWidth: 1,
        marginBottom: 8,
    },
    explanationBox: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    explanationBoxCorrect: {
        backgroundColor: '#DEF7EC',
        borderColor: '#31C48D',
    },
    explanationBoxIncorrect: {
        backgroundColor: '#FDE8E8',
        borderColor: '#F98080',
    },
    explanationText: {
        fontSize: FontSize.xs,
        lineHeight: 18,
    },
    explanationTextCorrect: {
        color: '#046C4E',
    },
    explanationTextIncorrect: {
        color: '#9B1C1C',
    },
});
