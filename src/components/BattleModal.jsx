import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { uiTiles } from '../utils/uiAssets';
import './BattleModal.css';

const BattleModal = ({ isOpen, onClose, onBattleEnd, monsterData, difficulty }) => {
  if (!isOpen) return null;

  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute countdown
  const [playerHealth, setPlayerHealth] = useState(100);
  const [monsterHealth, setMonsterHealth] = useState(100);
  // incorrectAttempts removed per updated rules
  const [isAnswered, setIsAnswered] = useState(false);
  const [waitingNext, setWaitingNext] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [battleStartTime, setBattleStartTime] = useState(null);
  const [timeDeducted, setTimeDeducted] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showFeedback, setShowFeedback] = useState(null); // 'correct', 'incorrect', or null
  const [roundResult, setRoundResult] = useState(null);
  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  const questionTimeoutRef = useRef(null);
  const playerHealthRef = useRef(100);
  const monsterHealthRef = useRef(100);

  // keep refs in sync with state so handlers can read latest values synchronously
  useEffect(() => {
    playerHealthRef.current = playerHealth;
    monsterHealthRef.current = monsterHealth;
  }, [playerHealth, monsterHealth]);

  // Fetch question from Supabase when modal opens
  useEffect(() => {
    if (isOpen && !question) {
      // New battle opened: initialize HP and fetch first question
      setPlayerHealth(100);
      setMonsterHealth(100);
      setPointsEarned(0);
      fetchQuestion();
      setBattleStartTime(Date.now());
      questionStartTimeRef.current = Date.now();
    }
    // Reset question and health when modal closes
    if (!isOpen) {
      setQuestion(null);
      setOptions([]);
      setPlayerHealth(100);
      setMonsterHealth(100);
      setPointsEarned(0);
      setTimeRemaining(60);
      setShowFeedback(null);
      setSelectedAnswer(null);
    }
  }, [isOpen]);

  // Timer countdown effect - start once when modal opens and run continuously
  useEffect(() => {
    if (!isOpen) return;
    if (timerRef.current) {
      // already running
      return;
    }
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
        timerRef.current = null;
      }
    };
  }, [isOpen]);

  // Watch overall timer for the "15 seconds left" per-question timeout
  useEffect(() => {
    if (!isOpen) return;
    // When overall timer reaches 15s and a question is active and not answered,
    // apply the per-question timeout penalty (user requested: timeout when 15s left)
    if (timeRemaining === 15 && question && !showFeedback && !waitingNext) {
      handleQuestionTimeout();
    }
  }, [timeRemaining, isOpen, question, showFeedback, waitingNext]);

  // Fetch a random question from Supabase
  const fetchQuestion = async () => {
    try {
      let query = supabase.from('questions').select('*').limit(100)

      // If your DB stores difficulty as: easy/medium/hard
      if (difficulty) {
        query = query.eq('difficulty', String(difficulty).toUpperCase())
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        if (error) console.error('Error fetching question:', error)
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
        // ensure overall timer remains 60s
        setTimeRemaining(60);
        // Shuffle and set options for fallback as well
        setOptions(shuffleArray([
          fallback.correct_answer,
          fallback.wrong_answer_1,
          fallback.wrong_answer_2,
          fallback.wrong_answer_3
        ]));
      } else if (data && data.length > 0) {
        // Randomly select a question
        const raw = data[Math.floor(Math.random() * data.length)];

        // Normalize row into expected question shape used by this component
        const mapped = {
          id: raw.id || raw.question_id || null,
          // support multiple possible column names
          question: raw.question || raw.question_text || raw.prompt || raw.q || '',
          correct_answer: raw.correct_answer || raw.correct_answers || raw.answer || raw.correct || null,
          // keep raw attached for advanced usages
          __raw: raw
        };

        // Build visible choices: if DB provides explicit choice fields (choice_a..d or choice_1..4) use those ONLY
        let choices = [];
        if (raw.choice_a || raw.choice_b || raw.choice_c || raw.choice_d) {
          choices = [raw.choice_a, raw.choice_b, raw.choice_c, raw.choice_d].filter(Boolean);
        } else if (raw.choice_1 || raw.choice_2 || raw.choice_3 || raw.choice_4) {
          choices = [raw.choice_1, raw.choice_2, raw.choice_3, raw.choice_4].filter(Boolean);
        } else if (raw.choices && Array.isArray(raw.choices) && raw.choices.length >= 1) {
          choices = raw.choices.slice(0,4).filter(Boolean);
        } else {
          // fallback to previous schema: correct + wrong answers
          const wrong1 = raw.wrong_answer_1 || raw.choice_a || raw.choice_1 || null;
          const wrong2 = raw.wrong_answer_2 || raw.choice_b || raw.choice_2 || null;
          const wrong3 = raw.wrong_answer_3 || raw.choice_c || raw.choice_3 || null;
          choices = [mapped.correct_answer, wrong1, wrong2, wrong3].filter(Boolean);
        }

        setQuestion(mapped);
        // set question start time right after question is set
        questionStartTimeRef.current = Date.now();
        // Shuffle visible options
        const shuffledOptions = shuffleArray(choices);
        setOptions(shuffledOptions);
      }
    } catch (err) {
      console.error('Error fetching question:', err);
    }
  };

  // Record round result to Supabase (best-effort)
  const recordRoundToSupabase = async (battleResult) => {
    try {
      // Build a generic payload; tables/columns may vary so we try a common shape
      const payload = {
        question_id: question && (question.id || (question.__raw && question.__raw.id)) || null,
        result: battleResult.victory ? 'win' : 'loss',
        points: battleResult.pointsEarned || 0,
        is_critical: !!battleResult.isCriticalHit,
        player_health: battleResult.playerHealth || null,
        monster_health: battleResult.monsterHealth || null,
        created_at: new Date().toISOString()
      };

      // Try to insert into a `round_results` table (if it exists)
      const { data: insertData, error: insertError } = await supabase
        .from('round_results')
        .insert([payload]);

      if (insertError) {
        // Not fatal — many projects won't have this table. Log for debugging.
        console.debug('Could not record round to Supabase (round_results):', insertError.message || insertError);
      } else {
        console.debug('Round recorded to Supabase:', insertData);
      }
    } catch (e) {
      console.debug('Supabase record failed:', e.message || e);
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

  // Persist points to localStorage and leaderboard
  const persistPointsAndLeaderboard = (points) => {
    try {
      const key = 'syntax-slayer-points';
      const prev = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      localStorage.setItem(key, String(prev + points));

      // push leaderboard entry
      const lbKey = 'syntax-slayer-leaderboard';
      const raw = localStorage.getItem(lbKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        date: new Date().toISOString(),
        points,
        total: prev + points,
        question: question ? question.question : null
      });
      // keep only last 50 entries
      localStorage.setItem(lbKey, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.warn('Could not access localStorage to save points/leaderboard', e);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    // prevent selecting while feedback shown or waiting for next
    if (showFeedback || waitingNext) return;

    setSelectedAnswer(answer);
    const answerTime = Date.now() - (questionStartTimeRef.current || Date.now());
    const answerTimeSeconds = Math.floor(answerTime / 1000);

    // Check if answer is correct
    const isCorrect = question && answer === question.correct_answer;


    if (isCorrect) {
      // Check for Critical Hit (answered within 15 seconds)
      const critical = answerTimeSeconds <= 15;
      setIsCriticalHit(critical);

      setShowFeedback('correct');

      // Calculate damage (Critical Hit does 50% damage)
      const damage = critical ? 50 : 30;
      const newMonsterHealth = Math.max(0, monsterHealthRef.current - damage);
      // apply immediately and update ref so other handlers read latest value
      monsterHealthRef.current = newMonsterHealth;
      setMonsterHealth(newMonsterHealth);

      // Award points and persist to leaderboard
      const points = critical ? 200 : 100;
      setPointsEarned(points);
      persistPointsAndLeaderboard(points);

      // Wait a moment then proceed to round completion handling
      setTimeout(() => {
        onRoundComplete({ monsterHealth: newMonsterHealth, pointsEarned: points, isCriticalHit: critical });
      }, 1200);
    } else {
      // Wrong answer: apply -25% HP to player
      setShowFeedback('incorrect');
      const playerDamage = 25; // percent
      const newPlayerHealth = Math.max(0, playerHealthRef.current - playerDamage);
      // update ref first so synchronous handlers see the latest value
      playerHealthRef.current = newPlayerHealth;
      setPlayerHealth(newPlayerHealth);

      // No attempts tracking: show feedback then proceed to round completion
      setTimeout(() => {
        setShowFeedback(null);
        setSelectedAnswer(null);
        onRoundComplete({ playerHealth: newPlayerHealth });
      }, 1500);
    }
  };

  // Handle time running out (overall timer reaches 0)
  const handleTimeOut = () => {
    if (showFeedback || waitingNext) return;

    setShowFeedback('timeout');

    // Overall timeout penalty: deduct 25% from player health
    const newPlayerHealth = Math.max(0, playerHealthRef.current - 25);
    playerHealthRef.current = newPlayerHealth;
    setPlayerHealth(newPlayerHealth);

    // clear per-question timeout if any
    if (questionTimeoutRef.current) {
      clearTimeout(questionTimeoutRef.current);
      questionTimeoutRef.current = null;
    }

    setPointsEarned(0);

    setTimeout(() => {
      onRoundComplete({ playerHealth: newPlayerHealth, pointsEarned: 0 });
    }, 1500);
  };

  // Handle per-question 15s timeout
  const handleQuestionTimeout = () => {
    if (showFeedback || waitingNext) return;
    setShowFeedback('timeout');
    // Timeout penalty: deduct 25% from player health
    const newPlayerHealth = Math.max(0, playerHealthRef.current - 25);
    playerHealthRef.current = newPlayerHealth;
    setPlayerHealth(newPlayerHealth);
    setPointsEarned(0);
    // ensure overall timer continues but end this battle round
    setTimeout(() => {
      onRoundComplete({ playerHealth: newPlayerHealth, pointsEarned: 0 });
    }, 1200);
  };

  // Handle battle end
  const handleBattleEnd = (victory, overrides = {}) => {
    // Do not stop the overall timer here; keep the battle session running so
    // the modal can show the updated HP and immediately load the next question.

    const battleResult = {
      victory,
      // prefer an explicit override for critical hit (avoid async state timing issues)
      isCriticalHit: typeof overrides.isCriticalHit === 'boolean' ? overrides.isCriticalHit : isCriticalHit,
      timeRemaining,
      playerHealth: typeof overrides.playerHealth === 'number' ? overrides.playerHealth : playerHealth,
      monsterHealth: typeof overrides.monsterHealth === 'number' ? overrides.monsterHealth : monsterHealth,
      pointsEarned: typeof overrides.pointsEarned === 'number' ? overrides.pointsEarned : pointsEarned
    };

    if (onBattleEnd) {
      onBattleEnd(battleResult);
    }

    // Stop timers and present result overlay so user sees victory/defeat
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (questionTimeoutRef.current) {
      clearTimeout(questionTimeoutRef.current);
      questionTimeoutRef.current = null;
    }

    // mark answered so UI disables further choices
    setIsAnswered(true);
    setRoundResult(battleResult);

    // Fire-and-forget: try to record round to Supabase
    recordRoundToSupabase(battleResult);
  };

  // Called when a round completes (answer/timeout). Decides whether this ends the battle or allows next question.
  const onRoundComplete = (overrides = {}) => {
    const currentPlayerHealth = typeof overrides.playerHealth === 'number' ? overrides.playerHealth : playerHealthRef.current;
    const currentMonsterHealth = typeof overrides.monsterHealth === 'number' ? overrides.monsterHealth : monsterHealthRef.current;

    // If either side reached 0, finalize battle
    if (currentPlayerHealth <= 0 || currentMonsterHealth <= 0) {
      const victory = currentMonsterHealth <= 0 && currentPlayerHealth > 0;
      handleBattleEnd(victory, overrides);
      return;
    }

    // Not a terminal round: allow player to proceed to next question
    setWaitingNext(true);
    setIsAnswered(false);

    // IMPORTANT: do NOT call onBattleEnd here anymore
  };

  const resetBattle = () => {
    setQuestion(null);
    setOptions([]);
    setSelectedAnswer(null);
    setTimeRemaining(60);
    // Do NOT reset player/monster HP here so damage persists across rounds
    setIsAnswered(false);
    setIsCriticalHit(false);
    setBattleStartTime(null);
    setTimeDeducted(0);
    setPointsEarned(0);
    setShowFeedback(null);
    questionStartTimeRef.current = null;
    if (questionTimeoutRef.current) {
      clearTimeout(questionTimeoutRef.current);
      questionTimeoutRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle modal close (removed Close button in UI — keep for parent cleanup)
  const handleClose = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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

  // NEW: auto-hide feedback overlay after a short duration
  useEffect(() => {
    if (!showFeedback) return;
    const t = setTimeout(() => setShowFeedback(null), 1400);
    return () => clearTimeout(t);
  }, [showFeedback]);

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
        {/* Decorative tiled art layers from UI pack */}
        <div
          className="modal-bg-art"
          style={{ backgroundImage: `url(${uiTiles.bgVariant2})` }}
        />
        <div
          className="modal-bg-decor"
          style={{ backgroundImage: `url(${uiTiles.ornament1})` }}
        />

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

            {/* NEW: right side = timer + right decoration */}
            <div className="battle-header-right">
              <div className="battle-header-timer" aria-label="Time Remaining">
                <div className="battle-header-timer-label">TIME</div>
                <div
                  className="battle-header-timer-value"
                  style={{ color: getTimerColor() }}
                >
                  {timeRemaining}s
                </div>
              </div>

              <div className="header-decoration-right"></div>
            </div>
          </div>

          {/* NEW: Two-column layout */}
          <div className="battle-layout">
            {/* Left column: health */}
            <aside className="battle-sidebar">
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
                        backgroundColor: getHealthBarColor(playerHealth),
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
                        backgroundColor: getHealthBarColor(monsterHealth),
                      }}
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Right column: question + options + feedback */}
            <section className="battle-question-pane">
              {/* Question Section */}
              <div className="question-section">
                {question ? (
                  <>
                    <div className="question-label">QUESTION:</div>
                    <div className="question-text">{question.question}</div>

                    <div className="options-container">
                      {(() => {
                        const displayedOptions =
                          options && options.length > 0
                            ? options
                            : question
                              ? [
                                  question.correct_answer,
                                  question.wrong_answer_1,
                                  question.wrong_answer_2,
                                  question.wrong_answer_3,
                                ].filter(Boolean)
                              : [];

                        return displayedOptions.map((option, index) => {
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
                              disabled={!!showFeedback || waitingNext}
                            >
                              {option}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    
                    {/* Next Question control for non-terminal rounds */}
                    {waitingNext && (
                      <div style={{ marginTop: 12 }}>
                        <button
                          className="btn"
                          onClick={() => {
                            setWaitingNext(false);
                            setSelectedAnswer(null);
                            setShowFeedback(null);
                            questionStartTimeRef.current = Date.now();
                            fetchQuestion();
                          }}
                        >
                          Next Question
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="loading-question">Loading question...</div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* NEW: Center-screen feedback overlay */}
        {showFeedback && !roundResult && (
          <div className="battle-feedback-overlay" aria-live="polite" aria-atomic="true">
            <div className={`battle-feedback-pop ${showFeedback}`}>
              {showFeedback === 'correct' && (
                isCriticalHit ? (
                  <>
                    <span className="critical-hit">🎯 CRITICAL HIT!</span>
                    <div className="battle-feedback-sub">You answered correctly within 15 seconds!</div>
                  </>
                ) : (
                  <div className="battle-feedback-title">✓ Correct!</div>
                )
              )}

              {showFeedback === 'incorrect' && (
                <>
                  <div className="battle-feedback-title">✗ Wrong Answer!</div>
                  <div className="battle-feedback-sub">-25% HP penalty</div>
                </>
              )}

              {showFeedback === 'timeout' && (
                <>
                  <div className="battle-feedback-title">⏰ Time&apos;s Up!</div>
                  <div className="battle-feedback-sub">The monster attacks!</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Victory/Defeat Overlay: appears when a side reaches 0% */}
        {roundResult && (
          <div
            className="battle-result-overlay"
            style={{
              padding: '1.5rem',
              background: 'rgba(0,0,0,0.85)',
              borderTop: '3px solid rgba(255,255,255,0.04)',
            }}
          >
            <h3 style={{ margin: 0, color: roundResult.victory ? '#7fff8f' : '#ff8b8b' }}>{roundResult.victory ? '🎉 Victory!' : '💀 Defeat!'}</h3>
            <div style={{ marginTop: 8, color: '#cfeffb' }}>Critical Hit: <strong>{roundResult.isCriticalHit ? 'Yes' : 'No'}</strong></div>
            <div style={{ marginTop: 6 }}>Points Earned: <strong>{roundResult.pointsEarned || 0}</strong></div>
            <div style={{ marginTop: 6 }}>Player Health: <strong>{roundResult.playerHealth}%</strong></div>
            <div style={{ marginTop: 6 }}>Monster Health: <strong>{roundResult.monsterHealth}%</strong></div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  // Start next battle: reset HP and clear roundResult
                  setPlayerHealth(100);
                  setMonsterHealth(100);
                  playerHealthRef.current = 100;
                  monsterHealthRef.current = 100;
                  setPointsEarned(0);
                  setIsCriticalHit(false);
                  setRoundResult(null);
                  setIsAnswered(false);
                  setTimeRemaining(60);
                  // start next question
                  fetchQuestion();
                }}
              >
                Next Battle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleModal;

