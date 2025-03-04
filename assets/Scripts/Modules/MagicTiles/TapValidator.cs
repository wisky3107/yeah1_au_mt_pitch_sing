using System;
using UnityEngine;

namespace Game.MagicTiles
{
    /// <summary>
    /// Validates tap accuracy based on timing and tile position.
    /// Determines if a tap is a hit or miss and calculates the quality of the hit.
    /// </summary>
    public class TapValidator : MonoBehaviour
    {
        [Header("Validation Settings")]
        [SerializeField] private float perfectHitWindow = 0.05f; // Time window for perfect hit in seconds
        [SerializeField] private float goodHitWindow = 0.15f; // Time window for good hit in seconds
        [SerializeField] private bool allowTapsWithoutTiles = false; // Whether to allow taps with no tiles
        
        [Header("Combo Settings")]
        [SerializeField] private int comboBreakOnMiss = true; // Whether missing breaks combo
        [SerializeField] private int minimumComboForMultiplier = 4; // Min combo before multiplier kicks in
        
        // References to other managers
        private TileManager tileManager;
        private AudioManager audioManager;
        private BeatmapManager beatmapManager;
        private GameplayManager gameplayManager;
        
        // Combo tracking
        private int currentCombo = 0;
        private int maxCombo = 0;
        
        // Events
        public event Action<HitResult> OnHitResultDetermined;
        public event Action<int> OnComboChanged;
        public event Action<int> OnMaxComboChanged;
        
        private void Awake()
        {
            // Get references to other managers
            tileManager = FindObjectOfType<TileManager>();
            audioManager = FindObjectOfType<AudioManager>();
            beatmapManager = FindObjectOfType<BeatmapManager>();
            gameplayManager = FindObjectOfType<GameplayManager>();
        }
        
        /// <summary>
        /// Validates a tap in a specific lane
        /// </summary>
        /// <param name="lane">Lane that was tapped</param>
        /// <param name="position">Position of the tap</param>
        public void ValidateTap(int lane, Vector2 position)
        {
            // Make sure the game is playing
            if (gameplayManager != null && gameplayManager.CurrentGameState != GameStates.Playing)
                return;
                
            // Get the current music position
            float currentTime = audioManager != null ? audioManager.GetMusicPosition() : Time.time;
            
            // Try to get a tile at hit position
            Tile tile = tileManager.GetTileAtHitPosition(lane);
            
            if (tile != null)
            {
                // Tile exists at hit position, validate against beatmap timing
                ValidateAgainstBeatmap(lane, currentTime, tile);
            }
            else if (allowTapsWithoutTiles)
            {
                // Allow for tapping without tiles (might be useful for tutorial or certain game modes)
                // But reset combo
                ResetCombo();
                
                // Trigger miss effect
                OnHitResultDetermined?.Invoke(new HitResult(false, HitQuality.Miss, 0f, null));
                
                // Play miss sound
                if (audioManager != null)
                {
                    audioManager.PlaySoundEffect(AudioManager.SoundEffectType.Miss);
                }
            }
        }
        
        /// <summary>
        /// Validates a tap against the beatmap data
        /// </summary>
        /// <param name="lane">Lane that was tapped</param>
        /// <param name="currentTime">Current time in the song</param>
        /// <param name="tile">Tile that was tapped</param>
        private void ValidateAgainstBeatmap(int lane, float currentTime, Tile tile)
        {
            // Get beat data from tile
            BeatData beatData = tile.GetBeatData();
            
            // Calculate timing difference
            float timeDifference = Mathf.Abs(currentTime - beatData.Time);
            
            // Determine hit quality
            HitQuality quality = HitQuality.Miss;
            bool isHit = false;
            
            if (timeDifference <= perfectHitWindow)
            {
                quality = HitQuality.Perfect;
                isHit = true;
            }
            else if (timeDifference <= goodHitWindow)
            {
                quality = HitQuality.Good;
                isHit = true;
            }
            
            // Create hit result
            HitResult result = new HitResult(isHit, quality, timeDifference, beatData);
            
            // Update combo
            if (isHit)
            {
                IncrementCombo();
                
                // Play hit effect on tile
                tileManager.PlayHitEffect(tile, quality);
                
                // Play sound effect
                if (audioManager != null)
                {
                    if (quality == HitQuality.Perfect)
                    {
                        audioManager.PlaySoundEffect(AudioManager.SoundEffectType.PerfectTap);
                    }
                    else
                    {
                        audioManager.PlaySoundEffect(AudioManager.SoundEffectType.Tap);
                    }
                }
            }
            else
            {
                // Miss
                if (comboBreakOnMiss)
                {
                    ResetCombo();
                }
                
                // Play miss effect on tile
                tileManager.PlayMissEffect(tile);
                
                // Play miss sound
                if (audioManager != null)
                {
                    audioManager.PlaySoundEffect(AudioManager.SoundEffectType.Miss);
                }
            }
            
            // Notify listeners of hit result
            OnHitResultDetermined?.Invoke(result);
        }
        
        /// <summary>
        /// Called when a tile reaches the end without being tapped
        /// </summary>
        /// <param name="tile">Tile that was missed</param>
        public void OnTileMissed(Tile tile)
        {
            // Reset combo on miss
            if (comboBreakOnMiss)
            {
                ResetCombo();
            }
            
            // Create miss result
            HitResult result = new HitResult(false, HitQuality.Miss, 0f, tile.GetBeatData());
            
            // Play miss effect
            tileManager.PlayMissEffect(tile);
            
            // Play miss sound
            if (audioManager != null)
            {
                audioManager.PlaySoundEffect(AudioManager.SoundEffectType.Miss);
            }
            
            // Notify listeners of miss
            OnHitResultDetermined?.Invoke(result);
        }
        
        /// <summary>
        /// Increments the current combo
        /// </summary>
        private void IncrementCombo()
        {
            currentCombo++;
            if (currentCombo > maxCombo)
            {
                maxCombo = currentCombo;
                OnMaxComboChanged?.Invoke(maxCombo);
            }
            
            OnComboChanged?.Invoke(currentCombo);
        }
        
        /// <summary>
        /// Resets the current combo to zero
        /// </summary>
        private void ResetCombo()
        {
            if (currentCombo > 0)
            {
                currentCombo = 0;
                OnComboChanged?.Invoke(currentCombo);
            }
        }
        
        /// <summary>
        /// Gets the current combo
        /// </summary>
        /// <returns>Current combo count</returns>
        public int GetCombo()
        {
            return currentCombo;
        }
        
        /// <summary>
        /// Gets the maximum combo achieved
        /// </summary>
        /// <returns>Maximum combo</returns>
        public int GetMaxCombo()
        {
            return maxCombo;
        }
        
        /// <summary>
        /// Calculates the score multiplier based on current combo
        /// </summary>
        /// <returns>Score multiplier (1.0 or higher)</returns>
        public float GetComboMultiplier()
        {
            if (currentCombo < minimumComboForMultiplier)
                return 1.0f;
                
            // Calculate multiplier, maxing out at 2x
            float multiplier = 1.0f + Mathf.Min(1.0f, (currentCombo - minimumComboForMultiplier) / 50.0f);
            return multiplier;
        }
        
        /// <summary>
        /// Resets the validator for a new game
        /// </summary>
        public void Reset()
        {
            currentCombo = 0;
            maxCombo = 0;
            OnComboChanged?.Invoke(currentCombo);
            OnMaxComboChanged?.Invoke(maxCombo);
        }
    }
} 