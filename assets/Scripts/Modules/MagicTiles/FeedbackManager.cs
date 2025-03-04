using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

namespace Game.MagicTiles
{
    /// <summary>
    /// Provides visual and auditory feedback for correct and incorrect taps.
    /// Manages score popups, combo displays, and special effects.
    /// </summary>
    public class FeedbackManager : MonoBehaviour
    {
        #region Singleton
        public static FeedbackManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeFeedbackManager();
        }
        #endregion

        [Header("Score Popup Settings")]
        [SerializeField] private GameObject scorePopupPrefab;
        [SerializeField] private Transform scorePopupParent;
        [SerializeField] private float popupDuration = 1.0f;
        [SerializeField] private float popupMoveDistance = 1.0f;
        [SerializeField] private int popupPoolSize = 20;

        [Header("Combo Feedback")]
        [SerializeField] private TMP_Text comboText;
        [SerializeField] private Animator comboAnimator;
        [SerializeField] private string comboAnimTrigger = "Combo";
        [SerializeField] private int comboThreshold = 10; // When to start showing combo feedback

        [Header("Hit Colors")]
        [SerializeField] private Color perfectColor = new Color(0, 1, 0.5f, 1); // Teal
        [SerializeField] private Color goodColor = new Color(0, 0.8f, 0, 1); // Green
        [SerializeField] private Color missColor = new Color(1, 0, 0, 1); // Red

        [Header("Special Effects")]
        [SerializeField] private ParticleSystem hitParticles;
        [SerializeField] private ParticleSystem comboParticles;
        [SerializeField] private GameObject hitLineFlash;
        [SerializeField] private float flashDuration = 0.1f;
        [SerializeField] private Camera mainCamera;
        [SerializeField] private float cameraShakeAmount = 0.1f;
        [SerializeField] private float cameraShakeDuration = 0.1f;

        [Header("Haptic Feedback")]
        [SerializeField] private bool enableHaptics = true;
        [SerializeField] private float hapticIntensity = 0.5f;

        // Pool of score popup objects
        private Queue<GameObject> scorePopupPool = new Queue<GameObject>();
        private Dictionary<GameObject, Coroutine> activePopups = new Dictionary<GameObject, Coroutine>();

        // References to other managers
        private TapValidator tapValidator;
        private AudioManager audioManager;

        // Camera shake
        private Vector3 originalCameraPosition;
        private Coroutine cameraShakeCoroutine;

        private void InitializeFeedbackManager()
        {
            // Get references
            tapValidator = FindObjectOfType<TapValidator>();
            audioManager = FindObjectOfType<AudioManager>();
            
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
            }
            
            if (scorePopupParent == null)
            {
                scorePopupParent = transform;
            }
            
            // Initialize score popup pool
            InitializePopupPool();
            
            // Subscribe to tap validator events
            if (tapValidator != null)
            {
                tapValidator.OnHitResultDetermined += OnHitResult;
                tapValidator.OnComboChanged += OnComboChanged;
            }
            
            // Hide combo text initially
            if (comboText != null)
            {
                comboText.gameObject.SetActive(false);
            }
            
            // Store original camera position
            if (mainCamera != null)
            {
                originalCameraPosition = mainCamera.transform.localPosition;
            }
        }

        /// <summary>
        /// Initializes the pool of score popup objects
        /// </summary>
        private void InitializePopupPool()
        {
            if (scorePopupPrefab != null)
            {
                for (int i = 0; i < popupPoolSize; i++)
                {
                    GameObject popup = Instantiate(scorePopupPrefab, scorePopupParent);
                    popup.SetActive(false);
                    scorePopupPool.Enqueue(popup);
                }
                
                Debug.Log($"Initialized score popup pool with {popupPoolSize} popups");
            }
            else
            {
                Debug.LogWarning("Score popup prefab not assigned!");
            }
        }

        /// <summary>
        /// Callback for hit result events
        /// </summary>
        /// <param name="result">Hit result data</param>
        private void OnHitResult(HitResult result)
        {
            if (result.IsHit)
            {
                // Show score popup
                ShowScorePopup(result);
                
                // Play particles
                PlayHitParticles(result.Beat.Lane, result.Quality);
                
                // Flash hit line
                FlashHitLine(result.Quality);
                
                // Camera shake for perfect hits
                if (result.Quality == HitQuality.Perfect)
                {
                    ShakeCamera(cameraShakeAmount * 0.5f);
                }
                
                // Haptic feedback
                if (enableHaptics)
                {
                    PlayHapticFeedback(result.Quality);
                }
            }
            else
            {
                // Show miss feedback
                ShowMissPopup(result.Beat?.Lane ?? 0);
            }
        }

        /// <summary>
        /// Callback for combo changed events
        /// </summary>
        /// <param name="combo">Current combo</param>
        private void OnComboChanged(int combo)
        {
            if (combo >= comboThreshold)
            {
                // Show combo text
                if (comboText != null)
                {
                    comboText.gameObject.SetActive(true);
                    comboText.text = $"{combo}x";
                    
                    if (comboAnimator != null)
                    {
                        comboAnimator.SetTrigger(comboAnimTrigger);
                    }
                }
                
                // Play combo particles at certain thresholds
                if (combo >= 50 && combo % 10 == 0)
                {
                    PlayComboParticles();
                    
                    // Stronger camera shake for big combos
                    ShakeCamera(cameraShakeAmount);
                }
            }
            else
            {
                // Hide combo text when below threshold
                if (comboText != null)
                {
                    comboText.gameObject.SetActive(false);
                }
            }
        }

        /// <summary>
        /// Shows a score popup at the hit position
        /// </summary>
        /// <param name="result">Hit result data</param>
        private void ShowScorePopup(HitResult result)
        {
            if (scorePopupPool.Count == 0)
                return;
                
            // Get a popup from the pool
            GameObject popup = scorePopupPool.Dequeue();
            popup.SetActive(true);
            
            // Get the lane position
            float laneX = TileManager.Instance != null ? 
                TileManager.Instance.GetLaneXPosition(result.Beat.Lane) : result.Beat.Lane;
            float hitY = TileManager.Instance != null ? 
                TileManager.Instance.GetHitLinePosition() : 0f;
            
            // Position the popup
            popup.transform.position = new Vector3(laneX, hitY, 0);
            
            // Set text based on hit quality
            TMP_Text popupText = popup.GetComponentInChildren<TMP_Text>();
            if (popupText != null)
            {
                switch (result.Quality)
                {
                    case HitQuality.Perfect:
                        popupText.text = "PERFECT";
                        popupText.color = perfectColor;
                        break;
                    case HitQuality.Good:
                        popupText.text = "GOOD";
                        popupText.color = goodColor;
                        break;
                    default:
                        popupText.text = "MISS";
                        popupText.color = missColor;
                        break;
                }
            }
            
            // Start animation coroutine
            if (activePopups.ContainsKey(popup))
            {
                StopCoroutine(activePopups[popup]);
            }
            
            Coroutine animationCoroutine = StartCoroutine(AnimatePopup(popup));
            activePopups[popup] = animationCoroutine;
        }

        /// <summary>
        /// Shows a miss popup at the specified lane
        /// </summary>
        /// <param name="lane">Lane where the miss occurred</param>
        private void ShowMissPopup(int lane)
        {
            if (scorePopupPool.Count == 0)
                return;
                
            // Get a popup from the pool
            GameObject popup = scorePopupPool.Dequeue();
            popup.SetActive(true);
            
            // Get the lane position
            float laneX = TileManager.Instance != null ? 
                TileManager.Instance.GetLaneXPosition(lane) : lane;
            float hitY = TileManager.Instance != null ? 
                TileManager.Instance.GetHitLinePosition() : 0f;
            
            // Position the popup
            popup.transform.position = new Vector3(laneX, hitY, 0);
            
            // Set text
            TMP_Text popupText = popup.GetComponentInChildren<TMP_Text>();
            if (popupText != null)
            {
                popupText.text = "MISS";
                popupText.color = missColor;
            }
            
            // Start animation coroutine
            if (activePopups.ContainsKey(popup))
            {
                StopCoroutine(activePopups[popup]);
            }
            
            Coroutine animationCoroutine = StartCoroutine(AnimatePopup(popup));
            activePopups[popup] = animationCoroutine;
        }

        /// <summary>
        /// Animates a score popup (fade and move up)
        /// </summary>
        /// <param name="popup">Popup GameObject to animate</param>
        private IEnumerator AnimatePopup(GameObject popup)
        {
            float startTime = Time.time;
            Vector3 startPosition = popup.transform.position;
            Vector3 endPosition = startPosition + Vector3.up * popupMoveDistance;
            
            TMP_Text text = popup.GetComponentInChildren<TMP_Text>();
            Color startColor = text.color;
            Color endColor = new Color(startColor.r, startColor.g, startColor.b, 0);
            
            // Animation loop
            while (Time.time < startTime + popupDuration)
            {
                float t = (Time.time - startTime) / popupDuration;
                popup.transform.position = Vector3.Lerp(startPosition, endPosition, t);
                
                if (text != null)
                {
                    text.color = Color.Lerp(startColor, endColor, t);
                }
                
                yield return null;
            }
            
            // Return popup to pool
            popup.SetActive(false);
            scorePopupPool.Enqueue(popup);
            activePopups.Remove(popup);
        }

        /// <summary>
        /// Plays hit particles at the specified lane
        /// </summary>
        /// <param name="lane">Lane where the hit occurred</param>
        /// <param name="quality">Quality of the hit</param>
        private void PlayHitParticles(int lane, HitQuality quality)
        {
            if (hitParticles == null)
                return;
                
            // Position the particles at the hit lane
            float laneX = TileManager.Instance != null ? 
                TileManager.Instance.GetLaneXPosition(lane) : lane;
            float hitY = TileManager.Instance != null ? 
                TileManager.Instance.GetHitLinePosition() : 0f;
            
            hitParticles.transform.position = new Vector3(laneX, hitY, 0);
            
            // Set color based on hit quality
            ParticleSystem.MainModule main = hitParticles.main;
            if (quality == HitQuality.Perfect)
            {
                main.startColor = perfectColor;
            }
            else if (quality == HitQuality.Good)
            {
                main.startColor = goodColor;
            }
            
            // Play the particles
            hitParticles.Play();
        }

        /// <summary>
        /// Plays combo particles for big combos
        /// </summary>
        private void PlayComboParticles()
        {
            if (comboParticles == null)
                return;
            
            comboParticles.Play();
        }

        /// <summary>
        /// Flashes the hit line with the color based on hit quality
        /// </summary>
        /// <param name="quality">Quality of the hit</param>
        private void FlashHitLine(HitQuality quality)
        {
            if (hitLineFlash == null)
                return;
                
            // Get renderer
            SpriteRenderer renderer = hitLineFlash.GetComponent<SpriteRenderer>();
            if (renderer == null)
                return;
                
            // Set color based on hit quality
            Color flashColor;
            if (quality == HitQuality.Perfect)
            {
                flashColor = perfectColor;
            }
            else if (quality == HitQuality.Good)
            {
                flashColor = goodColor;
            }
            else
            {
                flashColor = missColor;
            }
            
            // Start flash coroutine
            StartCoroutine(FlashCoroutine(renderer, flashColor));
        }

        /// <summary>
        /// Coroutine to flash a sprite with a color
        /// </summary>
        /// <param name="renderer">Sprite renderer to flash</param>
        /// <param name="flashColor">Color to flash with</param>
        private IEnumerator FlashCoroutine(SpriteRenderer renderer, Color flashColor)
        {
            Color originalColor = renderer.color;
            renderer.color = flashColor;
            renderer.enabled = true;
            
            yield return new WaitForSeconds(flashDuration);
            
            renderer.color = originalColor;
            renderer.enabled = false;
        }

        /// <summary>
        /// Shakes the camera for impact
        /// </summary>
        /// <param name="intensity">Intensity of the shake</param>
        private void ShakeCamera(float intensity)
        {
            if (mainCamera == null)
                return;
                
            // If already shaking, stop the current shake
            if (cameraShakeCoroutine != null)
            {
                StopCoroutine(cameraShakeCoroutine);
            }
            
            // Start new shake
            cameraShakeCoroutine = StartCoroutine(CameraShakeCoroutine(intensity));
        }

        /// <summary>
        /// Coroutine to shake the camera
        /// </summary>
        /// <param name="intensity">Intensity of the shake</param>
        private IEnumerator CameraShakeCoroutine(float intensity)
        {
            float startTime = Time.time;
            
            while (Time.time < startTime + cameraShakeDuration)
            {
                float t = (Time.time - startTime) / cameraShakeDuration;
                float damping = 1 - t; // Dampen over time
                
                // Random shake position
                Vector3 shakePos = originalCameraPosition + Random.insideUnitSphere * intensity * damping;
                mainCamera.transform.localPosition = shakePos;
                
                yield return null;
            }
            
            // Reset camera position
            mainCamera.transform.localPosition = originalCameraPosition;
            cameraShakeCoroutine = null;
        }

        /// <summary>
        /// Plays haptic feedback based on hit quality
        /// </summary>
        /// <param name="quality">Quality of the hit</param>
        private void PlayHapticFeedback(HitQuality quality)
        {
            if (!enableHaptics)
                return;
                
            // Intensity based on hit quality
            float intensity = quality == HitQuality.Perfect ? hapticIntensity : hapticIntensity * 0.5f;
            
    #if UNITY_IOS || UNITY_ANDROID
            // Check if the device supports haptics
            if (SystemInfo.supportsVibration)
            {
    #if UNITY_ANDROID
                // Android vibration
                Handheld.Vibrate();
    #elif UNITY_IOS
                // iOS haptic feedback 
                // Note: For proper iOS haptics, you might need a plugin from the Asset Store
                Handheld.Vibrate();
    #endif
            }
    #endif
        }

        /// <summary>
        /// Gets the x position of a lane from the TileManager
        /// Extension method added to ease implementation
        /// </summary>
        /// <param name="tileManager">Tile manager instance</param>
        /// <param name="lane">Lane index</param>
        /// <returns>X position of the lane</returns>
        private float GetLaneXPosition(this TileManager tileManager, int lane)
        {
            // This should be implemented in TileManager, but we're adding this helper here
            if (tileManager == null)
                return lane; // Return lane index as a fallback
                
            // Get lane transform if available
            if (tileManager.GetLanePositions() != null && lane < tileManager.GetLanePositions().Length)
            {
                return tileManager.GetLanePositions()[lane].position.x;
            }
            
            return lane; // Fallback
        }
    }
} 