using System.Collections;
using UnityEngine;

namespace Game.MagicTiles
{
    /// <summary>
    /// Represents a single tile object, handling its movement and destruction.
    /// </summary>
    public class Tile : MonoBehaviour
    {
        [Header("Tile Components")]
        [SerializeField] private SpriteRenderer tileRenderer;
        [SerializeField] private SpriteRenderer effectRenderer;
        [SerializeField] private Animator animator;
        
        [Header("Animation Parameters")]
        [SerializeField] private string hitAnimTrigger = "Hit";
        [SerializeField] private string missAnimTrigger = "Miss";
        
        // For long press tiles
        [SerializeField] private Transform tileSizeTransform; // Transform to scale for long press notes
        
        private BeatData beatData;
        private Vector3 startPosition;
        private float hitY;
        private float endY;
        private bool isHolding = false;
        private bool hasReachedEnd = false;
        
        // For animation
        private bool isAnimating = false;
        
        /// <summary>
        /// Initializes the tile with its data and positions
        /// </summary>
        /// <param name="data">Beat data for this tile</param>
        /// <param name="start">Start position</param>
        /// <param name="hitPos">Y position where the tile should be hit</param>
        /// <param name="endPos">Y position where the tile is considered missed</param>
        public void Initialize(BeatData data, Vector3 start, float hitPos, float endPos)
        {
            beatData = data;
            startPosition = start;
            hitY = hitPos;
            endY = endPos;
            hasReachedEnd = false;
            isHolding = false;
            isAnimating = false;
            
            // Set position
            transform.position = startPosition;
            
            // Set size for long press tiles
            if (beatData.Type == BeatType.LongPress && tileSizeTransform != null)
            {
                // Scale tile based on duration
                float height = Mathf.Max(0.5f, beatData.Duration * 5.0f); // Adjust scale factor as needed
                tileSizeTransform.localScale = new Vector3(1, height, 1);
            }
            
            // Reset effect renderer
            if (effectRenderer != null)
            {
                effectRenderer.enabled = false;
            }
            
            // Reset animation
            if (animator != null)
            {
                animator.ResetTrigger(hitAnimTrigger);
                animator.ResetTrigger(missAnimTrigger);
            }
        }
        
        /// <summary>
        /// Updates the tile position and checks if it reached the hit or end positions
        /// </summary>
        /// <param name="deltaTime">Time since last frame</param>
        /// <param name="scrollSpeed">Current scroll speed</param>
        public void UpdateTile(float deltaTime, float scrollSpeed)
        {
            if (isAnimating)
                return;
                
            // Move the tile down
            float movement = scrollSpeed * deltaTime;
            transform.Translate(0, -movement, 0);
            
            // Check if reached end
            if (transform.position.y <= endY && !hasReachedEnd)
            {
                hasReachedEnd = true;
            }
        }
        
        /// <summary>
        /// Checks if the tile has reached the end (miss) position
        /// </summary>
        /// <returns>True if tile has reached the end</returns>
        public bool HasReachedEnd()
        {
            return hasReachedEnd;
        }
        
        /// <summary>
        /// Checks if the tile is at the hit position
        /// </summary>
        /// <returns>True if the tile is at the hit position</returns>
        public bool IsAtHitPosition()
        {
            float tolerance = 0.2f; // Adjust as needed
            return Mathf.Abs(transform.position.y - hitY) <= tolerance;
        }
        
        /// <summary>
        /// Plays visual effect for a successful hit
        /// </summary>
        /// <param name="effectColor">Color of the hit effect</param>
        public void PlayHitEffect(Color effectColor)
        {
            if (effectRenderer != null)
            {
                effectRenderer.color = effectColor;
                effectRenderer.enabled = true;
            }
            
            if (animator != null)
            {
                animator.SetTrigger(hitAnimTrigger);
                StartCoroutine(AnimationRoutine());
            }
        }
        
        /// <summary>
        /// Plays visual effect for a missed tile
        /// </summary>
        /// <param name="effectColor">Color of the miss effect</param>
        public void PlayMissEffect(Color effectColor)
        {
            if (effectRenderer != null)
            {
                effectRenderer.color = effectColor;
                effectRenderer.enabled = true;
            }
            
            if (animator != null)
            {
                animator.SetTrigger(missAnimTrigger);
                StartCoroutine(AnimationRoutine());
            }
        }
        
        /// <summary>
        /// Coroutine to manage animation timing
        /// </summary>
        private IEnumerator AnimationRoutine()
        {
            isAnimating = true;
            
            // Wait for animation to finish
            yield return new WaitForSeconds(0.3f); // Adjust based on your animation length
            
            isAnimating = false;
            
            // If effect renderer is enabled, disable it
            if (effectRenderer != null)
            {
                effectRenderer.enabled = false;
            }
        }
        
        /// <summary>
        /// Sets the hold state for long press tiles
        /// </summary>
        /// <param name="holding">True if player is holding the tile</param>
        public void SetHoldState(bool holding)
        {
            if (beatData.Type == BeatType.LongPress)
            {
                isHolding = holding;
                
                // Visual feedback for holding
                if (tileRenderer != null)
                {
                    tileRenderer.color = holding ? Color.green : tileRenderer.color;
                }
            }
        }
        
        /// <summary>
        /// Gets the associated beat data
        /// </summary>
        /// <returns>Beat data for this tile</returns>
        public BeatData GetBeatData()
        {
            return beatData;
        }
        
        /// <summary>
        /// Sets the color of the tile
        /// </summary>
        /// <param name="color">New color</param>
        public void SetColor(Color color)
        {
            if (tileRenderer != null)
            {
                tileRenderer.color = color;
            }
        }
        
        /// <summary>
        /// Resets the tile to its default state
        /// </summary>
        public void Reset()
        {
            isHolding = false;
            hasReachedEnd = false;
            
            // Reset visuals
            if (effectRenderer != null)
            {
                effectRenderer.enabled = false;
            }
            
            // Reset size transform if it exists
            if (tileSizeTransform != null)
            {
                tileSizeTransform.localScale = new Vector3(1, 1, 1);
            }
            
            // Reset animation
            if (animator != null)
            {
                animator.ResetTrigger(hitAnimTrigger);
                animator.ResetTrigger(missAnimTrigger);
            }
            
            // Stop all coroutines
            StopAllCoroutines();
            isAnimating = false;
        }
    }
} 