using System;
using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages UI elements, screens, transitions, and user feedback.
    /// Controls menus, HUD, and dialog displays.
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        #region Singleton
        public static UIManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeUIManager();
        }
        #endregion

        [Header("Screen References")]
        [SerializeField] private GameObject mainMenuScreen;
        [SerializeField] private GameObject songSelectionScreen;
        [SerializeField] private GameObject gameplayScreen;
        [SerializeField] private GameObject pauseScreen;
        [SerializeField] private GameObject resultScreen;
        [SerializeField] private GameObject tutorialScreen;
        [SerializeField] private GameObject settingsScreen;
        [SerializeField] private GameObject loadingScreen;

        [Header("HUD Elements")]
        [SerializeField] private TMP_Text scoreText;
        [SerializeField] private TMP_Text comboText;
        [SerializeField] private TMP_Text accuracyText;
        [SerializeField] private Slider progressBar;
        [SerializeField] private TMP_Text songTitleText;
        [SerializeField] private TMP_Text difficultyText;
        [SerializeField] private TMP_Text countdownText;

        [Header("Result Screen Elements")]
        [SerializeField] private TMP_Text finalScoreText;
        [SerializeField] private TMP_Text maxComboText;
        [SerializeField] private TMP_Text finalAccuracyText;
        [SerializeField] private TMP_Text perfectHitsText;
        [SerializeField] private TMP_Text goodHitsText;
        [SerializeField] private TMP_Text missesText;
        [SerializeField] private TMP_Text ratingText;
        [SerializeField] private TMP_Text newHighScoreText;
        [SerializeField] private Image ratingImage;
        [SerializeField] private Sprite[] ratingSprites; // 0=None, 1=D, 2=C, 3=B, 4=A, 5=S

        [Header("Transition Effects")]
        [SerializeField] private Animator screenTransitionAnimator;
        [SerializeField] private float transitionDuration = 0.5f;
        [SerializeField] private string transitionInTrigger = "TransitionIn";
        [SerializeField] private string transitionOutTrigger = "TransitionOut";

        [Header("UI Feedback")]
        [SerializeField] private GameObject perfectText;
        [SerializeField] private GameObject goodText;
        [SerializeField] private GameObject missText;
        [SerializeField] private float feedbackDuration = 0.3f;

        // References to other managers
        private GameplayManager gameplayManager;
        private ScoreManager scoreManager;
        private AudioManager audioManager;
        private BeatmapManager beatmapManager;
        private TapValidator tapValidator;

        // Current screen tracking
        private GameObject currentScreen;

        private void InitializeUIManager()
        {
            // Get references to other managers
            gameplayManager = FindObjectOfType<GameplayManager>();
            scoreManager = FindObjectOfType<ScoreManager>();
            audioManager = FindObjectOfType<AudioManager>();
            beatmapManager = FindObjectOfType<BeatmapManager>();
            tapValidator = FindObjectOfType<TapValidator>();

            // Subscribe to events
            if (gameplayManager != null)
            {
                gameplayManager.OnGameStateChanged.AddListener(OnGameStateChanged);
                gameplayManager.OnGameStarted.AddListener(OnGameStarted);
                gameplayManager.OnGamePaused.AddListener(OnGamePaused);
                gameplayManager.OnGameResumed.AddListener(OnGameResumed);
                gameplayManager.OnGameCompleted.AddListener(OnGameCompleted);
                gameplayManager.OnGameFailed.AddListener(OnGameFailed);
            }

            if (scoreManager != null)
            {
                scoreManager.OnScoreChanged += OnScoreChanged;
                scoreManager.OnAccuracyChanged += OnAccuracyChanged;
                scoreManager.OnRatingChanged += OnRatingChanged;
            }

            if (tapValidator != null)
            {
                tapValidator.OnComboChanged += OnComboChanged;
                tapValidator.OnHitResultDetermined += OnHitResult;
            }

            // Hide all screens initially
            HideAllScreens();

            // Show main menu by default
            ShowScreen(mainMenuScreen);
        }

        private void OnDestroy()
        {
            // Unsubscribe from events
            if (gameplayManager != null)
            {
                gameplayManager.OnGameStateChanged.RemoveListener(OnGameStateChanged);
                gameplayManager.OnGameStarted.RemoveListener(OnGameStarted);
                gameplayManager.OnGamePaused.RemoveListener(OnGamePaused);
                gameplayManager.OnGameResumed.RemoveListener(OnGameResumed);
                gameplayManager.OnGameCompleted.RemoveListener(OnGameCompleted);
                gameplayManager.OnGameFailed.RemoveListener(OnGameFailed);
            }

            if (scoreManager != null)
            {
                scoreManager.OnScoreChanged -= OnScoreChanged;
                scoreManager.OnAccuracyChanged -= OnAccuracyChanged;
                scoreManager.OnRatingChanged -= OnRatingChanged;
            }

            if (tapValidator != null)
            {
                tapValidator.OnComboChanged -= OnComboChanged;
                tapValidator.OnHitResultDetermined -= OnHitResult;
            }
        }

        /// <summary>
        /// Callback for game state changes
        /// </summary>
        /// <param name="oldState">Previous game state</param>
        /// <param name="newState">New game state</param>
        private void OnGameStateChanged(GameStates oldState, GameStates newState)
        {
            // Show appropriate screen based on state
            switch (newState)
            {
                case GameStates.MainMenu:
                    TransitionToScreen(mainMenuScreen);
                    break;
                case GameStates.SongSelection:
                    TransitionToScreen(songSelectionScreen);
                    break;
                case GameStates.Loading:
                    TransitionToScreen(loadingScreen);
                    break;
                case GameStates.Countdown:
                    TransitionToScreen(gameplayScreen);
                    StartCoroutine(ShowCountdown());
                    break;
                case GameStates.Playing:
                    TransitionToScreen(gameplayScreen);
                    break;
                case GameStates.Paused:
                    ShowScreen(pauseScreen);
                    break;
                case GameStates.Completed:
                case GameStates.Failed:
                    PrepareResultScreen();
                    TransitionToScreen(resultScreen);
                    break;
                case GameStates.Tutorial:
                    TransitionToScreen(tutorialScreen);
                    break;
                case GameStates.Settings:
                    ShowScreen(settingsScreen);
                    break;
            }
        }

        /// <summary>
        /// Callback for game start event
        /// </summary>
        private void OnGameStarted()
        {
            // Update song info in HUD
            if (beatmapManager != null)
            {
                SongMetadata currentSong = beatmapManager.GetCurrentSong();
                if (currentSong != null && songTitleText != null)
                {
                    songTitleText.text = $"{currentSong.SongName} - {currentSong.Artist}";
                }
            }

            // Update difficulty text
            if (gameplayManager != null && difficultyText != null)
            {
                difficultyText.text = gameplayManager.GetCurrentDifficulty().ToString();
            }

            // Reset HUD elements
            if (scoreText != null)
            {
                scoreText.text = "0";
            }

            if (comboText != null)
            {
                comboText.text = "0";
                comboText.gameObject.SetActive(false);
            }

            if (accuracyText != null)
            {
                accuracyText.text = "100%";
            }

            if (progressBar != null)
            {
                progressBar.value = 0f;
            }
        }

        /// <summary>
        /// Callback for game pause event
        /// </summary>
        private void OnGamePaused()
        {
            ShowScreen(pauseScreen);
        }

        /// <summary>
        /// Callback for game resume event
        /// </summary>
        private void OnGameResumed()
        {
            HideScreen(pauseScreen);
        }

        /// <summary>
        /// Callback for game completion event
        /// </summary>
        private void OnGameCompleted()
        {
            PrepareResultScreen();
            TransitionToScreen(resultScreen);
        }

        /// <summary>
        /// Callback for game failure event
        /// </summary>
        private void OnGameFailed()
        {
            PrepareResultScreen();
            TransitionToScreen(resultScreen);
        }

        /// <summary>
        /// Callback for score change events
        /// </summary>
        /// <param name="newScore">New score value</param>
        private void OnScoreChanged(int newScore)
        {
            if (scoreText != null)
            {
                scoreText.text = newScore.ToString();
            }
        }

        /// <summary>
        /// Callback for accuracy change events
        /// </summary>
        /// <param name="newAccuracy">New accuracy value (0-1)</param>
        private void OnAccuracyChanged(float newAccuracy)
        {
            if (accuracyText != null)
            {
                accuracyText.text = $"{(newAccuracy * 100f).ToString("F1")}%";
            }
        }

        /// <summary>
        /// Callback for rating change events
        /// </summary>
        /// <param name="newRating">New performance rating</param>
        private void OnRatingChanged(PerformanceRating newRating)
        {
            // This could trigger visual feedback for rating changes during gameplay
        }

        /// <summary>
        /// Callback for combo change events
        /// </summary>
        /// <param name="newCombo">New combo value</param>
        private void OnComboChanged(int newCombo)
        {
            if (comboText != null)
            {
                if (newCombo > 0)
                {
                    comboText.text = $"{newCombo}x";
                    comboText.gameObject.SetActive(true);
                }
                else
                {
                    comboText.gameObject.SetActive(false);
                }
            }
        }

        /// <summary>
        /// Callback for hit result events
        /// </summary>
        /// <param name="result">Hit result</param>
        private void OnHitResult(HitResult result)
        {
            // Show hit feedback based on quality
            if (result.IsHit)
            {
                if (result.Quality == HitQuality.Perfect && perfectText != null)
                {
                    StartCoroutine(ShowFeedbackText(perfectText));
                }
                else if (result.Quality == HitQuality.Good && goodText != null)
                {
                    StartCoroutine(ShowFeedbackText(goodText));
                }
            }
            else if (missText != null)
            {
                StartCoroutine(ShowFeedbackText(missText));
            }

            // Update progress bar
            if (progressBar != null && audioManager != null && beatmapManager != null)
            {
                SongMetadata currentSong = beatmapManager.GetCurrentSong();
                if (currentSong != null)
                {
                    float songPosition = audioManager.GetMusicPosition();
                    float songDuration = currentSong.Duration;
                    
                    if (songDuration > 0)
                    {
                        progressBar.value = Mathf.Clamp01(songPosition / songDuration);
                    }
                }
            }
        }

        /// <summary>
        /// Prepares the result screen with final scores and ratings
        /// </summary>
        private void PrepareResultScreen()
        {
            if (scoreManager == null)
                return;

            // Set final score
            if (finalScoreText != null)
            {
                finalScoreText.text = scoreManager.GetScore().ToString();
            }

            // Set max combo
            if (maxComboText != null)
            {
                maxComboText.text = scoreManager.GetMaxCombo().ToString();
            }

            // Set accuracy
            if (finalAccuracyText != null)
            {
                finalAccuracyText.text = $"{(scoreManager.GetAccuracy() * 100f).ToString("F1")}%";
            }

            // Set hit counts
            if (perfectHitsText != null)
            {
                perfectHitsText.text = scoreManager.GetPerfectHitCount().ToString();
            }

            if (goodHitsText != null)
            {
                goodHitsText.text = scoreManager.GetGoodHitCount().ToString();
            }

            if (missesText != null)
            {
                missesText.text = scoreManager.GetMissCount().ToString();
            }

            // Set rating
            PerformanceRating rating = scoreManager.GetRating();
            if (ratingText != null)
            {
                ratingText.text = rating.ToString();
            }

            // Set rating image
            if (ratingImage != null && ratingSprites != null && ratingSprites.Length > (int)rating)
            {
                ratingImage.sprite = ratingSprites[(int)rating];
            }

            // Check if new high score
            if (newHighScoreText != null && gameplayManager != null)
            {
                string songId = gameplayManager.GetCurrentSongId();
                DifficultyLevel difficulty = gameplayManager.GetCurrentDifficulty();
                int highScore = scoreManager.GetHighScore(songId, difficulty);
                
                newHighScoreText.gameObject.SetActive(scoreManager.GetScore() > highScore);
            }
        }

        /// <summary>
        /// Hides all UI screens
        /// </summary>
        private void HideAllScreens()
        {
            if (mainMenuScreen != null)
                mainMenuScreen.SetActive(false);
                
            if (songSelectionScreen != null)
                songSelectionScreen.SetActive(false);
                
            if (gameplayScreen != null)
                gameplayScreen.SetActive(false);
                
            if (pauseScreen != null)
                pauseScreen.SetActive(false);
                
            if (resultScreen != null)
                resultScreen.SetActive(false);
                
            if (tutorialScreen != null)
                tutorialScreen.SetActive(false);
                
            if (settingsScreen != null)
                settingsScreen.SetActive(false);
                
            if (loadingScreen != null)
                loadingScreen.SetActive(false);
        }

        /// <summary>
        /// Shows a specific screen immediately
        /// </summary>
        /// <param name="screen">Screen to show</param>
        private void ShowScreen(GameObject screen)
        {
            if (screen != null)
            {
                currentScreen = screen;
                screen.SetActive(true);
            }
        }

        /// <summary>
        /// Hides a specific screen
        /// </summary>
        /// <param name="screen">Screen to hide</param>
        private void HideScreen(GameObject screen)
        {
            if (screen != null)
            {
                screen.SetActive(false);
            }
        }

        /// <summary>
        /// Transitions smoothly to a new screen
        /// </summary>
        /// <param name="newScreen">Screen to transition to</param>
        private void TransitionToScreen(GameObject newScreen)
        {
            StartCoroutine(TransitionCoroutine(newScreen));
        }

        /// <summary>
        /// Coroutine for screen transition animation
        /// </summary>
        /// <param name="newScreen">Target screen</param>
        private IEnumerator TransitionCoroutine(GameObject newScreen)
        {
            // Trigger transition animation
            if (screenTransitionAnimator != null)
            {
                screenTransitionAnimator.SetTrigger(transitionOutTrigger);
                yield return new WaitForSeconds(transitionDuration * 0.5f);
            }
            
            // Hide all screens
            HideAllScreens();
            
            // Show new screen
            ShowScreen(newScreen);
            
            // Trigger transition in animation
            if (screenTransitionAnimator != null)
            {
                screenTransitionAnimator.SetTrigger(transitionInTrigger);
                yield return new WaitForSeconds(transitionDuration * 0.5f);
            }
        }

        /// <summary>
        /// Shows the countdown before starting the game
        /// </summary>
        private IEnumerator ShowCountdown()
        {
            if (countdownText != null)
            {
                countdownText.gameObject.SetActive(true);
                
                // 3, 2, 1 countdown
                for (int i = 3; i > 0; i--)
                {
                    countdownText.text = i.ToString();
                    
                    // Play sound effect
                    if (audioManager != null)
                    {
                        audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
                    }
                    
                    yield return new WaitForSeconds(1f);
                }
                
                countdownText.text = "GO!";
                
                // Play sound effect
                if (audioManager != null)
                {
                    audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
                }
                
                yield return new WaitForSeconds(0.5f);
                
                countdownText.gameObject.SetActive(false);
            }
        }

        /// <summary>
        /// Shows feedback text briefly
        /// </summary>
        /// <param name="textObject">Text object to show</param>
        private IEnumerator ShowFeedbackText(GameObject textObject)
        {
            textObject.SetActive(true);
            yield return new WaitForSeconds(feedbackDuration);
            textObject.SetActive(false);
        }

        /// <summary>
        /// Updates song progress bar
        /// </summary>
        private void Update()
        {
            // Update progress bar during gameplay
            if (gameplayManager != null && 
                gameplayManager.CurrentGameState == GameStates.Playing && 
                progressBar != null && 
                audioManager != null && 
                beatmapManager != null)
            {
                SongMetadata currentSong = beatmapManager.GetCurrentSong();
                if (currentSong != null)
                {
                    float songPosition = audioManager.GetMusicPosition();
                    float songDuration = currentSong.Duration;
                    
                    if (songDuration > 0)
                    {
                        progressBar.value = Mathf.Clamp01(songPosition / songDuration);
                    }
                }
            }
        }

        #region Button Click Handlers
        
        /// <summary>
        /// Handles start button click
        /// </summary>
        public void OnStartButtonClicked()
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                gameplayManager.ChangeGameState(GameStates.SongSelection);
            }
        }
        
        /// <summary>
        /// Handles song selection button click
        /// </summary>
        /// <param name="songId">ID of the selected song</param>
        /// <param name="difficulty">Selected difficulty level</param>
        public void OnSongSelected(string songId, int difficulty)
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                DifficultyLevel diffLevel = (DifficultyLevel)difficulty;
                gameplayManager.LoadSong(songId, diffLevel);
            }
        }
        
        /// <summary>
        /// Handles pause button click
        /// </summary>
        public void OnPauseButtonClicked()
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                gameplayManager.PauseGame();
            }
        }
        
        /// <summary>
        /// Handles resume button click
        /// </summary>
        public void OnResumeButtonClicked()
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                gameplayManager.ResumeGame();
            }
        }
        
        /// <summary>
        /// Handles restart button click
        /// </summary>
        public void OnRestartButtonClicked()
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                gameplayManager.RestartGame();
            }
        }
        
        /// <summary>
        /// Handles back to menu button click
        /// </summary>
        public void OnBackToMenuButtonClicked()
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                gameplayManager.ReturnToSongSelection();
            }
        }
        
        /// <summary>
        /// Handles settings button click
        /// </summary>
        public void OnSettingsButtonClicked()
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                gameplayManager.ChangeGameState(GameStates.Settings);
            }
        }
        
        /// <summary>
        /// Handles tutorial button click
        /// </summary>
        public void OnTutorialButtonClicked()
        {
            // Play sound effect
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.MenuClick);
            }
            
            if (gameplayManager != null)
            {
                gameplayManager.ChangeGameState(GameStates.Tutorial);
            }
        }
        
        /// <summary>
        /// Handles music volume change
        /// </summary>
        /// <param name="volume">New volume level (0-1)</param>
        public void OnMusicVolumeChanged(float volume)
        {
            if (audioManager != null)
            {
                audioManager.UpdateMusicVolume(volume);
            }
        }
        
        /// <summary>
        /// Handles SFX volume change
        /// </summary>
        /// <param name="volume">New volume level (0-1)</param>
        public void OnSFXVolumeChanged(float volume)
        {
            if (audioManager != null)
            {
                audioManager.UpdateSFXVolume(volume);
            }
        }
        
        #endregion
    }
} 