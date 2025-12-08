import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { uiTiles } from '../utils/uiAssets';
import './BattleModal.css';

const BattleModal = ({ isOpen, onClose, onBattleEnd, monsterData }) => {
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute countdown
  const [playerHealth, setPlayerHealth] = useState(100);
  const [monsterHealth, setMonsterHealth] = useState(100);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [battleStartTime, setBattleStartTime] = useState(null);
  const [timeDeducted, setTimeDeducted] = useState(0);
  const [showFeedback, setShowFeedback] = useState(null); // 'correct', 'incorrect', or null
  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);

  // Fetch question from Supabase when modal opens
  useEffect(() => {
    if (isOpen && !question) {
      fetchQuestion();
      setBattleStartTime(Date.now());
      questionStartTimeRef.current = Date.now();
    }
    // Reset question when modal closes
    if (!isOpen) {
      setQuestion(null);
      setOptions([]);
    }
  }, [isOpen]);

  // Timer countdown effect
  useEffect(() => {
    if (isOpen && timeRemaining > 0 && !isAnswered) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isOpen, timeRemaining, isAnswered]);

  // Fetch a random question from Supabase
  const fetchQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .limit(100); // Fetch multiple to randomize

      if (error) {
        console.error('Error fetching question:', error);
        // Fallback question for testing
        const fallback = {
          id: 1,
          question: 'What is the correct way to declare a variable in JavaScript?',
          correct_answer: 'let x = 5;',
          wrong_answer_1: 'var x = 5',
          wrong_answer_2: 'x = 5',
          wrong_answer_3: 'const x = 5'
        };
        setQuestion(fallback);
        // set question start time for fallback
        questionStartTimeRef.current = Date.now();
        // Shuffle and set options for fallback as well
        setOptions(shuffleArray([
          fallback.correct_answer,
          fallback.wrong_answer_1,
          fallback.wrong_answer_2,
          fallback.wrong_answer_3
        ]));
      } else if (data && data.length > 0) {
        // Randomly select a question
        const randomQuestion = data[Math.floor(Math.random() * data.length)];
        setQuestion(randomQuestion);
        // set question start time right after question is set
        questionStartTimeRef.current = Date.now();
        // Shuffle options
        const shuffledOptions = shuffleArray([
          randomQuestion.correct_answer,
          randomQuestion.wrong_answer_1,
          randomQuestion.wrong_answer_2,
          randomQuestion.wrong_answer_3
        ]);
        setOptions(shuffledOptions);
      }
    } catch (err) {
      console.error('Error fetching question:', err);
    }
  };

  // Shuffle array function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    const answerTime = Date.now() - questionStartTimeRef.current;
    const answerTimeSeconds = Math.floor(answerTime / 1000);

    // Check if answer is correct
    const isCorrect = answer === question.correct_answer;

    if (isCorrect) {
      // Check for Critical Hit (answered within 10 seconds)
      const critical = answerTimeSeconds <= 10;
      setIsCriticalHit(critical);

      setShowFeedback('correct');
      setIsAnswered(true);

      // Calculate damage (Critical Hit does more damage)
      const damage = critical ? 50 : 30;
      setMonsterHealth((prev) => Math.max(0, prev - damage));

      // Wait a moment then close or proceed
      setTimeout(() => {
        handleBattleEnd(true);
      }, 2000);
    } else {
      // Wrong answer
      setShowFeedback('incorrect');
      
      // Deduct time (5 seconds per wrong answer)
      const timePenalty = 5;
      setTimeRemaining((prev) => Math.max(0, prev - timePenalty));
      setTimeDeducted((prev) => prev + timePenalty);

      // Player takes damage
      const playerDamage = 10;
      setPlayerHealth((prev) => Math.max(0, prev - playerDamage));

      // Increment incorrect attempts and check if max reached
      setIncorrectAttempts((prev) => {
        const newCount = prev + 1;
        // Check if max attempts reached (3 total)
        if (newCount >= 3) {
          setTimeout(() => {
            handleBattleEnd(false);
          }, 2000);
        } else {
          // Allow retry after showing feedback
          setTimeout(() => {
            setShowFeedback(null);
            setSelectedAnswer(null);
          }, 1500);
        }
        return newCount;
      });
    }
  };

  // Handle time running out
  const handleTimeOut = () => {
    if (isAnswered) return;

    setIsAnswered(true);
    setShowFeedback('timeout');
    
    // Player takes significant damage
    setPlayerHealth((prev) => Math.max(0, prev - 25));

    setTimeout(() => {
      handleBattleEnd(false);
    }, 2000);
  };

  // Handle battle end
  const handleBattleEnd = (victory) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const battleResult = {
      victory,
      isCriticalHit,
      incorrectAttempts,
      timeRemaining,
      playerHealth,
      monsterHealth
    };

    if (onBattleEnd) {
      onBattleEnd(battleResult);
    }

    // Reset state
    resetBattle();
  };

  // Reset battle state
  const resetBattle = () => {
    setQuestion(null);
    setOptions([]);
    setSelectedAnswer(null);
    setTimeRemaining(60);
    setPlayerHealth(100);
    setMonsterHealth(100);
    setIncorrectAttempts(0);
    setIsAnswered(false);
    setIsCriticalHit(false);
    setBattleStartTime(null);
    setTimeDeducted(0);
    setShowFeedback(null);
    questionStartTimeRef.current = null;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    resetBattle();
    if (onClose) {
      onClose();
    }
  };

  // Debug: Log when modal should render
  useEffect(() => {
    if (isOpen) {
      console.log('BattleModal isOpen:', isOpen);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTimerColor = () => {
    if (timeRemaining <= 10) return '#ff4444';
    if (timeRemaining <= 20) return '#ffaa00';
    return '#4caf50';
  };

  const getHealthBarColor = (health) => {
    if (health > 60) return '#4caf50';
    if (health > 30) return '#ffaa00';
    return '#ff4444';
  };

  return (
    <div className="battle-modal-overlay" onClick={handleClose}>
      <div 
        className="battle-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          '--ui-tile-bg': `url(${uiTiles.backgroundPattern2})`,
          '--ui-tile-header': `url(${uiTiles.panelDark})`,
          '--ui-tile-health': `url(${uiTiles.texture1})`,
          '--ui-tile-timer': `url(${uiTiles.highlight})`,
          '--ui-tile-question': `url(${uiTiles.panel})`,
          '--ui-tile-button': `url(${uiTiles.buttonAlt})`,
          '--ui-tile-feedback': `url(${uiTiles.accent})`,
        }}
      >
        {/* Modal Content Wrapper */}
        <div className="battle-modal-content">
          {/* Header */}
          <div className="battle-header">
          <div className="header-decoration-left"></div>
          <div className="header-content">
            <h2 className="battle-title">⚔️ BATTLE MODE ⚔️</h2>
            {monsterData && (
              <div className="monster-name">{monsterData.name || 'BUG MONSTER'}</div>
            )}
          </div>
          <div className="header-decoration-right"></div>
        </div>

        {/* Health Bars */}
        <div className="health-bars-container">
          <div className="health-bar-section">
            <div className="health-label">
              <span>Player</span>
              <span className="health-value">{playerHealth}%</span>
            </div>
            <div className="health-bar-wrapper">
              <div 
                className="health-bar player-health"
                style={{
                  width: `${playerHealth}%`,
                  backgroundColor: getHealthBarColor(playerHealth)
                }}
              />
            </div>
          </div>

          <div className="health-bar-section">
            <div className="health-label">
              <span>Monster</span>
              <span className="health-value">{monsterHealth}%</span>
            </div>
            <div className="health-bar-wrapper">
              <div 
                className="health-bar monster-health"
                style={{
                  width: `${monsterHealth}%`,
                  backgroundColor: getHealthBarColor(monsterHealth)
                }}
              />
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="timer-container">
          <div className="timer-label">Time Remaining</div>
          <div 
            className="timer-display"
            style={{ color: getTimerColor() }}
          >
            {timeRemaining}s
          </div>
          {timeDeducted > 0 && (
            <div className="time-penalty">-{timeDeducted}s penalty</div>
          )}
        </div>

        {/* Incorrect Attempts Counter */}
        <div className="attempts-counter">
          <span>Wrong Answers: </span>
          <span className={`attempts-value ${incorrectAttempts >= 3 ? 'max-attempts' : ''}`}>
            {incorrectAttempts}/3
          </span>
        </div>

        {/* Question Section */}
        <div className="question-section">
          {question ? (
            <>
              <div className="question-label">QUESTION:</div>
              <div className="question-text">{question.question}</div>
              
              <div className="options-container">
                {options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === question.correct_answer;
                  let optionClass = 'option-button';
                  
                  if (isAnswered && isSelected) {
                    optionClass += isCorrect ? ' correct' : ' incorrect';
                  } else if (isSelected && !isAnswered) {
                    optionClass += ' selected';
                  }

                  return (
                    <button
                      key={index}
                      className={optionClass}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={isAnswered}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Messages */}
              {showFeedback === 'correct' && (
                <div className="feedback-message correct-feedback">
                  {isCriticalHit ? (
                    <>
                      <span className="critical-hit">🎯 CRITICAL HIT!</span>
                      <span>You answered correctly within 10 seconds!</span>
                    </>
                  ) : (
                    <span>✓ Correct Answer!</span>
                  )}
                </div>
              )}

              {showFeedback === 'incorrect' && (
                <div className="feedback-message incorrect-feedback">
                  ✗ Wrong Answer! -5 seconds penalty
                </div>
              )}

              {showFeedback === 'timeout' && (
                <div className="feedback-message timeout-feedback">
                  ⏰ Time's Up! The monster attacks!
                </div>
              )}
            </>
          ) : (
            <div className="loading-question">Loading question...</div>
          )}
        </div>

        </div>
        
        {/* Close Button - Fixed at bottom */}
        <div className="close-button-wrapper">
          <button className="close-battle-button" onClick={handleClose}>
            Close Battle
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleModal;

