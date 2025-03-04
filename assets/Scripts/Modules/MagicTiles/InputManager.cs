using System;
using System.Collections.Generic;
using UnityEngine;

namespace Game.MagicTiles
{
    /// <summary>
    /// Handles player input and tap detection for the Magic Tiles game.
    /// Supports multi-touch and maps touches to game lanes.
    /// </summary>
    public class InputManager : MonoBehaviour
    {
        #region Singleton
        public static InputManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeInputManager();
        }
        #endregion

        [Header("Input Settings")]
        [SerializeField] private Camera gameCamera;
        [SerializeField] private LayerMask tileLayer;
        [SerializeField] private bool useMouseForTesting = true;
        [SerializeField] private int maxTouchInputs = 5;
        
        [Header("Lane Settings")]
        [SerializeField] private Transform[] lanePositions;
        [SerializeField] private float laneWidth = 1.0f;
        
        // Current touch states
        private Dictionary<int, TouchInfo> activeTouches = new Dictionary<int, TouchInfo>();
        
        // Events
        public event Action<int, Vector2> OnLaneTapped;
        public event Action<int, Vector2> OnLaneHeld;
        public event Action<int> OnLaneReleased;
        
        // References to other managers
        private TileManager tileManager;
        private TapValidator tapValidator;
        private GameplayManager gameplayManager;
        
        private bool isInputActive = true;
        
        /// <summary>
        /// Initializes input manager and gets references to other managers
        /// </summary>
        private void InitializeInputManager()
        {
            // Find the camera if not set
            if (gameCamera == null)
            {
                gameCamera = Camera.main;
            }
            
            // Get references to other managers
            tileManager = FindObjectOfType<TileManager>();
            tapValidator = FindObjectOfType<TapValidator>();
            gameplayManager = FindObjectOfType<GameplayManager>();
        }
        
        /// <summary>
        /// Process input events every frame
        /// </summary>
        private void Update()
        {
            if (!isInputActive)
                return;
                
            if (useMouseForTesting && Application.isEditor)
            {
                ProcessMouseInput();
            }
            else
            {
                ProcessTouchInput();
            }
        }
        
        /// <summary>
        /// Processes mouse input (for testing in editor)
        /// </summary>
        private void ProcessMouseInput()
        {
            // Mouse down - simulate touch start
            if (Input.GetMouseButtonDown(0))
            {
                Vector2 mousePosition = Input.mousePosition;
                Vector2 worldPosition = gameCamera.ScreenToWorldPoint(mousePosition);
                int lane = GetLaneFromPosition(worldPosition);
                
                if (lane >= 0)
                {
                    TouchInfo info = new TouchInfo
                    {
                        TouchId = 0, // Mouse is always touch ID 0
                        Lane = lane,
                        Position = worldPosition,
                        StartTime = Time.time,
                        IsHolding = true
                    };
                    
                    activeTouches[0] = info;
                    OnLaneTapped?.Invoke(lane, worldPosition);
                    
                    // Validate tap
                    if (tapValidator != null)
                    {
                        tapValidator.ValidateTap(lane, worldPosition);
                    }
                }
            }
            
            // Mouse held down - simulate holding
            else if (Input.GetMouseButton(0))
            {
                if (activeTouches.TryGetValue(0, out TouchInfo info) && info.IsHolding)
                {
                    Vector2 mousePosition = Input.mousePosition;
                    Vector2 worldPosition = gameCamera.ScreenToWorldPoint(mousePosition);
                    int lane = GetLaneFromPosition(worldPosition);
                    
                    // Update position
                    info.Position = worldPosition;
                    activeTouches[0] = info;
                    
                    // Check if lane changed
                    if (lane >= 0 && lane != info.Lane)
                    {
                        // End current lane hold
                        OnLaneReleased?.Invoke(info.Lane);
                        
                        // Start new lane hold
                        info.Lane = lane;
                        activeTouches[0] = info;
                        OnLaneTapped?.Invoke(lane, worldPosition);
                        
                        // Validate new tap
                        if (tapValidator != null)
                        {
                            tapValidator.ValidateTap(lane, worldPosition);
                        }
                    }
                    else if (lane >= 0)
                    {
                        OnLaneHeld?.Invoke(lane, worldPosition);
                    }
                }
            }
            
            // Mouse up - simulate touch end
            else if (Input.GetMouseButtonUp(0))
            {
                if (activeTouches.TryGetValue(0, out TouchInfo info))
                {
                    OnLaneReleased?.Invoke(info.Lane);
                    activeTouches.Remove(0);
                }
            }
        }
        
        /// <summary>
        /// Processes touch input (for mobile devices)
        /// </summary>
        private void ProcessTouchInput()
        {
            // Get all touches
            Touch[] touches = Input.touches;
            
            // Track which touch IDs are still active in this frame
            HashSet<int> currentTouchIds = new HashSet<int>();
            
            foreach (Touch touch in touches)
            {
                int touchId = touch.fingerId;
                Vector2 touchPosition = touch.position;
                Vector2 worldPosition = gameCamera.ScreenToWorldPoint(touchPosition);
                int lane = GetLaneFromPosition(worldPosition);
                
                // Add to current touches set
                currentTouchIds.Add(touchId);
                
                // Touch began
                if (touch.phase == TouchPhase.Began)
                {
                    if (lane >= 0)
                    {
                        TouchInfo info = new TouchInfo
                        {
                            TouchId = touchId,
                            Lane = lane,
                            Position = worldPosition,
                            StartTime = Time.time,
                            IsHolding = true
                        };
                        
                        activeTouches[touchId] = info;
                        OnLaneTapped?.Invoke(lane, worldPosition);
                        
                        // Validate tap
                        if (tapValidator != null)
                        {
                            tapValidator.ValidateTap(lane, worldPosition);
                        }
                    }
                }
                
                // Touch moved or stationary
                else if (touch.phase == TouchPhase.Moved || touch.phase == TouchPhase.Stationary)
                {
                    if (activeTouches.TryGetValue(touchId, out TouchInfo info) && info.IsHolding)
                    {
                        // Update position
                        info.Position = worldPosition;
                        activeTouches[touchId] = info;
                        
                        // Check if lane changed
                        if (lane >= 0 && lane != info.Lane)
                        {
                            // End current lane hold
                            OnLaneReleased?.Invoke(info.Lane);
                            
                            // Start new lane hold
                            info.Lane = lane;
                            activeTouches[touchId] = info;
                            OnLaneTapped?.Invoke(lane, worldPosition);
                            
                            // Validate new tap
                            if (tapValidator != null)
                            {
                                tapValidator.ValidateTap(lane, worldPosition);
                            }
                        }
                        else if (lane >= 0)
                        {
                            OnLaneHeld?.Invoke(lane, worldPosition);
                        }
                    }
                }
                
                // Touch ended or canceled
                else if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
                {
                    if (activeTouches.TryGetValue(touchId, out TouchInfo info))
                    {
                        OnLaneReleased?.Invoke(info.Lane);
                        activeTouches.Remove(touchId);
                    }
                }
            }
            
            // Find touches that were active but are no longer in the current frame
            List<int> touchesToRemove = new List<int>();
            foreach (var touchPair in activeTouches)
            {
                if (!currentTouchIds.Contains(touchPair.Key))
                {
                    touchesToRemove.Add(touchPair.Key);
                    OnLaneReleased?.Invoke(touchPair.Value.Lane);
                }
            }
            
            // Remove ended touches
            foreach (int touchId in touchesToRemove)
            {
                activeTouches.Remove(touchId);
            }
        }
        
        /// <summary>
        /// Determines which lane a position corresponds to
        /// </summary>
        /// <param name="worldPosition">Position in world space</param>
        /// <returns>Lane index or -1 if not in a lane</returns>
        private int GetLaneFromPosition(Vector2 worldPosition)
        {
            // If lane positions are defined, use them
            if (lanePositions != null && lanePositions.Length > 0)
            {
                for (int i = 0; i < lanePositions.Length; i++)
                {
                    float distance = Mathf.Abs(worldPosition.x - lanePositions[i].position.x);
                    if (distance <= laneWidth / 2)
                    {
                        return i;
                    }
                }
            }
            // Otherwise, divide screen width by number of lanes
            else
            {
                float screenWidth = Screen.width;
                int laneCount = 4; // Default to 4 lanes if no explicit positions
                
                int lane = Mathf.FloorToInt(worldPosition.x / (screenWidth / laneCount));
                if (lane >= 0 && lane < laneCount)
                {
                    return lane;
                }
            }
            
            return -1; // No lane found
        }
        
        /// <summary>
        /// Enables or disables input processing
        /// </summary>
        /// <param name="active">Whether input should be active</param>
        public void SetInputActive(bool active)
        {
            isInputActive = active;
            
            // If deactivating, clear all active touches
            if (!active)
            {
                foreach (var touchPair in activeTouches)
                {
                    OnLaneReleased?.Invoke(touchPair.Value.Lane);
                }
                activeTouches.Clear();
            }
        }
        
        /// <summary>
        /// Gets the number of active lanes being touched
        /// </summary>
        /// <returns>Number of active lanes</returns>
        public int GetActiveTouchCount()
        {
            return activeTouches.Count;
        }
        
        /// <summary>
        /// Checks if a specific lane is currently being touched
        /// </summary>
        /// <param name="lane">Lane to check</param>
        /// <returns>True if lane is being touched</returns>
        public bool IsLaneTouched(int lane)
        {
            foreach (var touchPair in activeTouches)
            {
                if (touchPair.Value.Lane == lane)
                {
                    return true;
                }
            }
            return false;
        }
    }
    
    /// <summary>
    /// Stores information about a touch/tap
    /// </summary>
    public class TouchInfo
    {
        public int TouchId { get; set; }
        public int Lane { get; set; }
        public Vector2 Position { get; set; }
        public float StartTime { get; set; }
        public bool IsHolding { get; set; }
    }
} 