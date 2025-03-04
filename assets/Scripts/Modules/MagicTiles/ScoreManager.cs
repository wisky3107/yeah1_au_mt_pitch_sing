using System;
using UnityEngine;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages the player's score, combo, and performance statistics.
    /// Handles score calculation and high score tracking.
    /// </summary>
    public class ScoreManager : MonoBehaviour
    {
        #region Singleton
        public static ScoreManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }
        #endregion

        [Header("Score Settings")]
        [SerializeField] private int perfectHitScore = 100;
        [SerializeField] private int goodHitScore = 50;
        [SerializeField] private int missScore = 0;
        [SerializeField] private float comboMultiplierFactor = 0.1f; // How much each combo adds to multiplier

        [Header("Performance Rating")]
        [SerializeField] private float sRatingThreshold = 0.95f; // Percentage for S rank
        [SerializeField] private float aRatingThreshold = 0.85f; // Percentage for A rank
        [SerializeField] private float bRatingThreshold = 0.75f; // Percentage for B rank
        [SerializeField] private float cRatingThreshold = 0.60f; // Percentage for C rank

        // Score tracking
        private int currentScore;
        private int perfectHitCount;
        private int goodHitCount;
        private int missCount;
        private int totalNotes;
        private int maxCombo;
        private float accuracy;
        private PerformanceRating performanceRating;

        // Events
        public event Action<int> OnScoreChanged;
        public event Action<float> OnAccuracyChanged;
        public event Action<PerformanceRating> OnRatingChanged;

        // Reference to tap validator
        private TapValidator tapValidator;

        private void Start()
        {
            // Get reference to tap validator
            tapValidator = FindObjectOfType<TapValidator>();
            
            if (tapValidator != null)
            {
                tapValidator.OnHitResultDetermined += OnHitResult;
                tapValidator.OnMaxComboChanged += OnMaxComboChanged;
            }
            
            ResetScore();
        }

        /// <summary>
        /// Processes hit results from the tap validator
        /// </summary>
        /// <param name="result">Result of a hit attempt</param>
        private void OnHitResult(HitResult result)
        {
            totalNotes++;
            
            int scoreToAdd = 0;
            
            if (result.IsHit)
            {
                float comboMultiplier = 1.0f;
                if (tapValidator != null)
                {
                    // Get combo multiplier from tap validator
                    int currentCombo = tapValidator.GetCombo();
                    comboMultiplier = 1.0f + (currentCombo * comboMultiplierFactor);
                }
                
                // Calculate score based on hit quality
                if (result.Quality == HitQuality.Perfect)
                {
                    scoreToAdd = Mathf.RoundToInt(perfectHitScore * comboMultiplier);
                    perfectHitCount++;
                }
                else if (result.Quality == HitQuality.Good)
                {
                    scoreToAdd = Mathf.RoundToInt(goodHitScore * comboMultiplier);
                    goodHitCount++;
                }
            }
            else
            {
                // Miss
                scoreToAdd = missScore;
                missCount++;
            }
            
            // Add to current score
            currentScore += scoreToAdd;
            
            // Calculate accuracy
            float totalHits = perfectHitCount + (goodHitCount * 0.7f); // Good hits count as 70% of a perfect hit
            accuracy = totalNotes > 0 ? totalHits / totalNotes : 0f;
            
            // Determine performance rating
            UpdatePerformanceRating();
            
            // Notify listeners
            OnScoreChanged?.Invoke(currentScore);
            OnAccuracyChanged?.Invoke(accuracy);
        }

        /// <summary>
        /// Updates the max combo value
        /// </summary>
        /// <param name="combo">New max combo value</param>
        private void OnMaxComboChanged(int combo)
        {
            maxCombo = combo;
        }

        /// <summary>
        /// Updates the performance rating based on current accuracy
        /// </summary>
        private void UpdatePerformanceRating()
        {
            PerformanceRating newRating;
            
            if (accuracy >= sRatingThreshold)
            {
                newRating = PerformanceRating.S;
            }
            else if (accuracy >= aRatingThreshold)
            {
                newRating = PerformanceRating.A;
            }
            else if (accuracy >= bRatingThreshold)
            {
                newRating = PerformanceRating.B;
            }
            else if (accuracy >= cRatingThreshold)
            {
                newRating = PerformanceRating.C;
            }
            else
            {
                newRating = PerformanceRating.D;
            }
            
            if (newRating != performanceRating)
            {
                performanceRating = newRating;
                OnRatingChanged?.Invoke(performanceRating);
            }
        }

        /// <summary>
        /// Resets all score tracking values
        /// </summary>
        public void ResetScore()
        {
            currentScore = 0;
            perfectHitCount = 0;
            goodHitCount = 0;
            missCount = 0;
            totalNotes = 0;
            maxCombo = 0;
            accuracy = 0f;
            performanceRating = PerformanceRating.None;
            
            OnScoreChanged?.Invoke(currentScore);
            OnAccuracyChanged?.Invoke(accuracy);
            OnRatingChanged?.Invoke(performanceRating);
        }

        /// <summary>
        /// Gets current score value
        /// </summary>
        /// <returns>Current score</returns>
        public int GetScore()
        {
            return currentScore;
        }

        /// <summary>
        /// Gets current accuracy percentage
        /// </summary>
        /// <returns>Accuracy as a percentage (0-1)</returns>
        public float GetAccuracy()
        {
            return accuracy;
        }

        /// <summary>
        /// Gets current performance rating
        /// </summary>
        /// <returns>Performance rating enum</returns>
        public PerformanceRating GetRating()
        {
            return performanceRating;
        }

        /// <summary>
        /// Gets max combo achieved in the current game
        /// </summary>
        /// <returns>Max combo</returns>
        public int GetMaxCombo()
        {
            return maxCombo;
        }

        /// <summary>
        /// Gets the number of perfect hits
        /// </summary>
        /// <returns>Perfect hit count</returns>
        public int GetPerfectHitCount()
        {
            return perfectHitCount;
        }

        /// <summary>
        /// Gets the number of good hits
        /// </summary>
        /// <returns>Good hit count</returns>
        public int GetGoodHitCount()
        {
            return goodHitCount;
        }

        /// <summary>
        /// Gets the number of misses
        /// </summary>
        /// <returns>Miss count</returns>
        public int GetMissCount()
        {
            return missCount;
        }

        /// <summary>
        /// Gets the total number of notes played
        /// </summary>
        /// <returns>Total note count</returns>
        public int GetTotalNotes()
        {
            return totalNotes;
        }

        /// <summary>
        /// Saves the high score for a song
        /// </summary>
        /// <param name="songId">ID of the song</param>
        /// <param name="difficulty">Difficulty level</param>
        public void SaveHighScore(string songId, DifficultyLevel difficulty)
        {
            string key = $"HighScore_{songId}_{difficulty}";
            int highScore = PlayerPrefs.GetInt(key, 0);
            
            if (currentScore > highScore)
            {
                PlayerPrefs.SetInt(key, currentScore);
                PlayerPrefs.Save();
                
                // Also save best rating
                string ratingKey = $"BestRating_{songId}_{difficulty}";
                PlayerPrefs.SetInt(ratingKey, (int)performanceRating);
                
                // And best combo
                string comboKey = $"BestCombo_{songId}_{difficulty}";
                int bestCombo = PlayerPrefs.GetInt(comboKey, 0);
                if (maxCombo > bestCombo)
                {
                    PlayerPrefs.SetInt(comboKey, maxCombo);
                }
                
                PlayerPrefs.Save();
            }
        }

        /// <summary>
        /// Gets the high score for a song
        /// </summary>
        /// <param name="songId">ID of the song</param>
        /// <param name="difficulty">Difficulty level</param>
        /// <returns>High score value</returns>
        public int GetHighScore(string songId, DifficultyLevel difficulty)
        {
            string key = $"HighScore_{songId}_{difficulty}";
            return PlayerPrefs.GetInt(key, 0);
        }

        /// <summary>
        /// Gets the best performance rating for a song
        /// </summary>
        /// <param name="songId">ID of the song</param>
        /// <param name="difficulty">Difficulty level</param>
        /// <returns>Best performance rating</returns>
        public PerformanceRating GetBestRating(string songId, DifficultyLevel difficulty)
        {
            string key = $"BestRating_{songId}_{difficulty}";
            return (PerformanceRating)PlayerPrefs.GetInt(key, 0);
        }
    }

    /// <summary>
    /// Performance rating levels (S, A, B, C, D)
    /// </summary>
    public enum PerformanceRating
    {
        None = 0,
        D = 1,
        C = 2,
        B = 3,
        A = 4,
        S = 5
    }
} 