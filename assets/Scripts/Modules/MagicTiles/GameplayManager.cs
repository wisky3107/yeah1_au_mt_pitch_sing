using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Events;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages the overall game flow, state transitions, and coordinates between other managers.
    /// Central hub for gameplay logic.
    /// </summary>
    public class GameplayManager : MonoBehaviour
    {
        #region Singleton
        public static GameplayManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            
            InitializeGameManager();
        }
        #endregion

        [Header("Game Settings")]
        [SerializeField] private float preloadTime = 3.0f; // Time to preload beatmap before notes appear
        [SerializeField] private float countdownDuration = 3.0f; // Duration of the countdown before starting
        [SerializeField] private int minNotesToPass = 10; // Minimum notes to allow game completion
        [SerializeField] private float failThreshold = 0.3f; // Accuracy threshold for failing
        [SerializeField] private float startingScrollSpeed = 1.0f; // Initial scroll speed
        [SerializeField] private bool autoFail = true; // Auto-fail if too many misses

        [Header("Game State")]
        [SerializeField] private GameStates currentGameState = GameStates.MainMenu;
        public GameStates CurrentGameState => currentGameState;
        private string currentSongId;
        private DifficultyLevel currentDifficulty;
        private bool isGameEnding = false;
        
        [Header("Events")]
        public UnityEvent OnGameStarted;
        public UnityEvent OnGamePaused;
        public UnityEvent OnGameResumed;
        public UnityEvent OnGameCompleted;
        public UnityEvent OnGameFailed;
        public UnityEvent<GameStates, GameStates> OnGameStateChanged;

        // References to other managers
        private AudioManager audioManager;
        private BeatmapManager beatmapManager;
        private TileManager tileManager;
        private InputManager inputManager;
        private TapValidator tapValidator;
        private ScoreManager scoreManager;

        // Game flow tracking
        private float gameStartTime;
        private float pauseStartTime;
        private float totalPausedTime;
        private Coroutine updateBeatmapCoroutine;
        private Coroutine countdownCoroutine;

        private void InitializeGameManager()
        {
            // Get references to other managers
            audioManager = FindObjectOfType<AudioManager>();
            beatmapManager = FindObjectOfType<BeatmapManager>();
            tileManager = FindObjectOfType<TileManager>();
            inputManager = FindObjectOfType<InputManager>();
            tapValidator = FindObjectOfType<TapValidator>();
            scoreManager = FindObjectOfType<ScoreManager>();

            // Subscribe to events
            if (tapValidator != null)
            {
                tapValidator.OnHitResultDetermined += OnHitResult;
            }

            if (tileManager != null)
            {
                tileManager.OnTileReachedEnd += OnTileReachedEnd;
            }
        }

        private void OnDestroy()
        {
            // Unsubscribe from events
            if (tapValidator != null)
            {
                tapValidator.OnHitResultDetermined -= OnHitResult;
            }

            if (tileManager != null)
            {
                tileManager.OnTileReachedEnd -= OnTileReachedEnd;
            }
        }

        /// <summary>
        /// Loads a song and prepares it for gameplay
        /// </summary>
        /// <param name="songId">ID of the song to load</param>
        /// <param name="difficulty">Difficulty level to play</param>
        public void LoadSong(string songId, DifficultyLevel difficulty)
        {
            // Store current song/difficulty
            currentSongId = songId;
            currentDifficulty = difficulty;
            
            // Change state to loading
            ChangeGameState(GameStates.Loading);
            
            // Reset game tracking variables
            gameStartTime = 0;
            totalPausedTime = 0;
            isGameEnding = false;
            
            // Load beatmap
            if (beatmapManager != null)
            {
                if (beatmapManager.LoadBeatmap(songId, difficulty))
                {
                    // Set initial scroll speed
                    beatmapManager.ScrollSpeed = startingScrollSpeed;
                    
                    // Preload song in audio manager
                    if (audioManager != null)
                    {
                        audioManager.PreloadMusicTrack(songId);
                    }
                    
                    // Reset score and combo tracking
                    if (scoreManager != null)
                    {
                        scoreManager.ResetScore();
                    }
                    
                    if (tapValidator != null)
                    {
                        tapValidator.Reset();
                    }
                    
                    // Clear any existing tiles
                    if (tileManager != null)
                    {
                        tileManager.ClearAllTiles();
                    }
                    
                    // Start countdown
                    StartCountdown();
                }
                else
                {
                    Debug.LogError($"Failed to load beatmap for song {songId} with difficulty {difficulty}");
                    ChangeGameState(GameStates.MainMenu);
                }
            }
        }

        /// <summary>
        /// Starts a countdown before beginning the game
        /// </summary>
        private void StartCountdown()
        {
            ChangeGameState(GameStates.Countdown);
            
            if (countdownCoroutine != null)
            {
                StopCoroutine(countdownCoroutine);
            }
            
            countdownCoroutine = StartCoroutine(CountdownCoroutine());
        }

        /// <summary>
        /// Countdown coroutine to delay the start of the game
        /// </summary>
        private IEnumerator CountdownCoroutine()
        {
            // Countdown time
            float countdownTime = countdownDuration;
            
            while (countdownTime > 0)
            {
                // Update countdown UI here
                
                yield return null;
                countdownTime -= Time.deltaTime;
            }
            
            // Start the game
            StartGame();
        }

        /// <summary>
        /// Starts the actual gameplay
        /// </summary>
        private void StartGame()
        {
            // Start game
            ChangeGameState(GameStates.Playing);
            
            // Reset beatmap
            if (beatmapManager != null)
            {
                beatmapManager.ResetBeatmap();
            }
            
            // Play music
            if (audioManager != null)
            {
                audioManager.PlayMusic(currentSongId);
            }
            
            // Enable input
            if (inputManager != null)
            {
                inputManager.SetInputActive(true);
            }
            
            // Store game start time
            gameStartTime = Time.time;
            
            // Start beatmap update coroutine
            if (updateBeatmapCoroutine != null)
            {
                StopCoroutine(updateBeatmapCoroutine);
            }
            
            updateBeatmapCoroutine = StartCoroutine(UpdateBeatmapCoroutine());
            
            // Trigger event
            OnGameStarted?.Invoke();
        }

        /// <summary>
        /// Updates the beatmap based on music position
        /// </summary>
        private IEnumerator UpdateBeatmapCoroutine()
        {
            while (currentGameState == GameStates.Playing)
            {
                if (audioManager != null && beatmapManager != null)
                {
                    // Get current music position
                    float currentTime = audioManager.GetMusicPosition();
                    
                    // Update beatmap with current position and preload time
                    beatmapManager.UpdateBeatmap(currentTime, preloadTime);
                    
                    // Check if song is finished
                    if (!audioManager.IsPlaying() && !isGameEnding && currentTime > 0)
                    {
                        CompleteGame();
                    }
                }
                
                yield return null;
            }
        }

        /// <summary>
        /// Pauses the game
        /// </summary>
        public void PauseGame()
        {
            if (currentGameState == GameStates.Playing)
            {
                ChangeGameState(GameStates.Paused);
                
                // Pause music
                if (audioManager != null)
                {
                    audioManager.PauseMusic();
                }
                
                // Disable input
                if (inputManager != null)
                {
                    inputManager.SetInputActive(false);
                }
                
                // Store pause time
                pauseStartTime = Time.time;
                
                // Trigger event
                OnGamePaused?.Invoke();
            }
        }

        /// <summary>
        /// Resumes the game from pause
        /// </summary>
        public void ResumeGame()
        {
            if (currentGameState == GameStates.Paused)
            {
                ChangeGameState(GameStates.Playing);
                
                // Resume music
                if (audioManager != null)
                {
                    audioManager.ResumeMusic();
                }
                
                // Enable input
                if (inputManager != null)
                {
                    inputManager.SetInputActive(true);
                }
                
                // Add to total paused time
                totalPausedTime += Time.time - pauseStartTime;
                
                // Restart beatmap update coroutine
                if (updateBeatmapCoroutine != null)
                {
                    StopCoroutine(updateBeatmapCoroutine);
                }
                
                updateBeatmapCoroutine = StartCoroutine(UpdateBeatmapCoroutine());
                
                // Trigger event
                OnGameResumed?.Invoke();
            }
        }

        /// <summary>
        /// Completes the game successfully
        /// </summary>
        public void CompleteGame()
        {
            if (currentGameState == GameStates.Playing && !isGameEnding)
            {
                isGameEnding = true;
                ChangeGameState(GameStates.Completed);
                
                // Stop music if still playing
                if (audioManager != null && audioManager.IsPlaying())
                {
                    audioManager.StopMusic();
                }
                
                // Disable input
                if (inputManager != null)
                {
                    inputManager.SetInputActive(false);
                }
                
                // Clear tiles
                if (tileManager != null)
                {
                    tileManager.ClearAllTiles();
                }
                
                // Save high score
                if (scoreManager != null)
                {
                    scoreManager.SaveHighScore(currentSongId, currentDifficulty);
                }
                
                // Trigger event
                OnGameCompleted?.Invoke();
            }
        }

        /// <summary>
        /// Fails the game
        /// </summary>
        public void FailGame()
        {
            if (currentGameState == GameStates.Playing && !isGameEnding)
            {
                isGameEnding = true;
                ChangeGameState(GameStates.Failed);
                
                // Stop music
                if (audioManager != null)
                {
                    audioManager.StopMusic();
                }
                
                // Disable input
                if (inputManager != null)
                {
                    inputManager.SetInputActive(false);
                }
                
                // Clear tiles
                if (tileManager != null)
                {
                    tileManager.ClearAllTiles();
                }
                
                // Trigger event
                OnGameFailed?.Invoke();
            }
        }

        /// <summary>
        /// Restarts the current song
        /// </summary>
        public void RestartGame()
        {
            LoadSong(currentSongId, currentDifficulty);
        }

        /// <summary>
        /// Returns to the song selection screen
        /// </summary>
        public void ReturnToSongSelection()
        {
            // Stop any ongoing gameplay
            if (currentGameState.IsPlayable() || currentGameState == GameStates.Paused)
            {
                // Stop music
                if (audioManager != null)
                {
                    audioManager.StopMusic();
                }
                
                // Disable input
                if (inputManager != null)
                {
                    inputManager.SetInputActive(false);
                }
                
                // Clear tiles
                if (tileManager != null)
                {
                    tileManager.ClearAllTiles();
                }
            }
            
            ChangeGameState(GameStates.SongSelection);
        }

        /// <summary>
        /// Changes the game state and triggers appropriate events
        /// </summary>
        /// <param name="newState">New game state to change to</param>
        private void ChangeGameState(GameStates newState)
        {
            GameStates oldState = currentGameState;
            currentGameState = newState;
            
            // Trigger state change event
            OnGameStateChanged?.Invoke(oldState, newState);
            
            Debug.Log($"Game state changed from {oldState} to {newState}");
        }

        /// <summary>
        /// Called when a hit result is determined
        /// </summary>
        /// <param name="result">Hit result</param>
        private void OnHitResult(HitResult result)
        {
            // Check if we should fail the game
            if (autoFail && currentGameState == GameStates.Playing)
            {
                // Get accuracy from score manager
                if (scoreManager != null)
                {
                    float accuracy = scoreManager.GetAccuracy();
                    int totalNotes = scoreManager.GetTotalNotes();
                    
                    // Only check failure after minimum notes are played
                    if (totalNotes >= minNotesToPass && accuracy < failThreshold)
                    {
                        FailGame();
                    }
                }
            }
        }

        /// <summary>
        /// Called when a tile reaches the end of the screen without being tapped
        /// </summary>
        /// <param name="tile">Tile that reached the end</param>
        private void OnTileReachedEnd(Tile tile)
        {
            // Notify tap validator of the miss
            if (tapValidator != null && currentGameState == GameStates.Playing)
            {
                tapValidator.OnTileMissed(tile);
            }
        }

        /// <summary>
        /// Gets the elapsed game time (excluding pauses)
        /// </summary>
        /// <returns>Elapsed game time in seconds</returns>
        public float GetElapsedGameTime()
        {
            if (gameStartTime == 0)
                return 0;
                
            float currentTime;
            if (currentGameState == GameStates.Paused)
            {
                currentTime = pauseStartTime;
            }
            else
            {
                currentTime = Time.time;
            }
            
            return currentTime - gameStartTime - totalPausedTime;
        }

        /// <summary>
        /// Gets the current song ID
        /// </summary>
        /// <returns>Current song ID</returns>
        public string GetCurrentSongId()
        {
            return currentSongId;
        }

        /// <summary>
        /// Gets the current difficulty level
        /// </summary>
        /// <returns>Current difficulty</returns>
        public DifficultyLevel GetCurrentDifficulty()
        {
            return currentDifficulty;
        }

        /// <summary>
        /// Sets the scroll speed
        /// </summary>
        /// <param name="speed">New scroll speed</param>
        public void SetScrollSpeed(float speed)
        {
            if (beatmapManager != null)
            {
                beatmapManager.ScrollSpeed = speed;
            }
        }
    }

    /// <summary>
    /// Extension method to check if audio is playing
    /// </summary>
    public static class AudioManagerExtensions
    {
        /// <summary>
        /// Checks if the audio manager is currently playing music
        /// </summary>
        /// <param name="audioManager">Audio manager instance</param>
        /// <returns>True if music is playing</returns>
        public static bool IsPlaying(this AudioManager audioManager)
        {
            // This would typically be a method in AudioManager, but we're adding this extension method
            // as a helper for the GameplayManager
            return audioManager != null && 
                   audioManager.GetMusicPosition() > 0 && 
                   !audioManager.IsPaused();
        }
        
        /// <summary>
        /// Checks if the audio manager is currently paused
        /// </summary>
        /// <param name="audioManager">Audio manager instance</param>
        /// <returns>True if music is paused</returns>
        public static bool IsPaused(this AudioManager audioManager)
        {
            // This would typically be a method in AudioManager, but we're adding this extension method
            // as a helper for the GameplayManager
            return false; // This should be implemented in AudioManager
        }
    }
} 