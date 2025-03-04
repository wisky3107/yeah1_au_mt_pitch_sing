using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages the creation, movement, and destruction of tiles.
    /// Implements object pooling for better performance.
    /// </summary>
    public class TileManager : MonoBehaviour
    {
        #region Singleton
        public static TileManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeTileManager();
        }
        #endregion

        [Header("Tile Settings")]
        [SerializeField] private GameObject normalTilePrefab;
        [SerializeField] private GameObject longPressTilePrefab;
        [SerializeField] private Transform[] lanePositions; // X positions for each lane
        [SerializeField] private float startY = 10f; // Starting Y position (off-screen)
        [SerializeField] private float hitY = 0f; // Y position where tiles should be hit
        [SerializeField] private float endY = -1f; // Y position where tiles are considered missed
        [SerializeField] private int poolSize = 50; // Size of object pool for each tile type

        [Header("Visual Settings")]
        [SerializeField] private Color normalTileColor = Color.white;
        [SerializeField] private Color longPressTileColor = Color.yellow;
        [SerializeField] private Color hitEffectColor = Color.green;
        [SerializeField] private Color missEffectColor = Color.red;

        // Object pools
        private Queue<Tile> normalTilePool = new Queue<Tile>();
        private Queue<Tile> longPressTilePool = new Queue<Tile>();

        // Active tiles
        private List<Tile> activeTiles = new List<Tile>();

        // Events
        public event Action<Tile> OnTileReachedEnd;
        public event Action<Tile> OnTileDestroyed;

        private void InitializeTileManager()
        {
            // Initialize object pools
            InitializeObjectPool();

            // Subscribe to beat events
            if (BeatmapManager.Instance != null)
            {
                BeatmapManager.Instance.OnBeatSpawn += SpawnTile;
            }
        }

        /// <summary>
        /// Initializes the object pools for the tiles
        /// </summary>
        private void InitializeObjectPool()
        {
            // Normal tiles pool
            for (int i = 0; i < poolSize; i++)
            {
                GameObject tileObj = Instantiate(normalTilePrefab, transform);
                Tile tile = tileObj.GetComponent<Tile>();
                if (tile != null)
                {
                    tile.gameObject.SetActive(false);
                    normalTilePool.Enqueue(tile);
                }
            }

            // Long press tiles pool
            for (int i = 0; i < poolSize; i++)
            {
                GameObject tileObj = Instantiate(longPressTilePrefab, transform);
                Tile tile = tileObj.GetComponent<Tile>();
                if (tile != null)
                {
                    tile.gameObject.SetActive(false);
                    longPressTilePool.Enqueue(tile);
                }
            }

            Debug.Log($"Initialized tile pools with {poolSize} tiles of each type");
        }

        /// <summary>
        /// Spawns a tile based on beat data
        /// </summary>
        /// <param name="beatData">Beat data to spawn tile from</param>
        public void SpawnTile(BeatData beatData)
        {
            // Get tile from pool based on type
            Tile tile = null;
            if (beatData.Type == BeatType.Normal)
            {
                if (normalTilePool.Count > 0)
                {
                    tile = normalTilePool.Dequeue();
                    tile.SetColor(normalTileColor);
                }
                else
                {
                    Debug.LogWarning("Normal tile pool depleted! Consider increasing pool size.");
                    GameObject tileObj = Instantiate(normalTilePrefab, transform);
                    tile = tileObj.GetComponent<Tile>();
                    tile.SetColor(normalTileColor);
                }
            }
            else if (beatData.Type == BeatType.LongPress)
            {
                if (longPressTilePool.Count > 0)
                {
                    tile = longPressTilePool.Dequeue();
                    tile.SetColor(longPressTileColor);
                }
                else
                {
                    Debug.LogWarning("Long press tile pool depleted! Consider increasing pool size.");
                    GameObject tileObj = Instantiate(longPressTilePrefab, transform);
                    tile = tileObj.GetComponent<Tile>();
                    tile.SetColor(longPressTileColor);
                }
            }

            if (tile != null)
            {
                // Set tile properties
                int laneIndex = beatData.Lane;
                if (laneIndex >= 0 && laneIndex < lanePositions.Length)
                {
                    Vector3 position = new Vector3(lanePositions[laneIndex].position.x, startY, 0);
                    tile.transform.position = position;
                    tile.gameObject.SetActive(true);
                    
                    // Set up the tile with its beat data
                    tile.Initialize(beatData, position, hitY, endY);
                    
                    // Add to active tiles list
                    activeTiles.Add(tile);
                }
                else
                {
                    Debug.LogError($"Invalid lane index: {laneIndex}. Max lanes: {lanePositions.Length}");
                    ReturnTileToPool(tile);
                }
            }
        }

        /// <summary>
        /// Updates all active tiles
        /// </summary>
        private void Update()
        {
            float scrollSpeed = BeatmapManager.Instance.ScrollSpeed;
            List<Tile> tilesToRemove = new List<Tile>();

            foreach (Tile tile in activeTiles)
            {
                if (tile.gameObject.activeSelf)
                {
                    tile.UpdateTile(Time.deltaTime, scrollSpeed);
                    
                    if (tile.HasReachedEnd())
                    {
                        OnTileReachedEnd?.Invoke(tile);
                        tilesToRemove.Add(tile);
                    }
                }
            }

            // Remove and return tiles to pool
            foreach (Tile tile in tilesToRemove)
            {
                ReturnTileToPool(tile);
            }
        }

        /// <summary>
        /// Returns a tile to its appropriate object pool
        /// </summary>
        /// <param name="tile">Tile to return to pool</param>
        public void ReturnTileToPool(Tile tile)
        {
            if (activeTiles.Contains(tile))
            {
                activeTiles.Remove(tile);
                OnTileDestroyed?.Invoke(tile);
                
                // Reset and disable the tile
                tile.Reset();
                tile.gameObject.SetActive(false);
                
                // Return to appropriate pool
                if (tile.GetBeatData().Type == BeatType.Normal)
                {
                    normalTilePool.Enqueue(tile);
                }
                else if (tile.GetBeatData().Type == BeatType.LongPress)
                {
                    longPressTilePool.Enqueue(tile);
                }
            }
        }

        /// <summary>
        /// Hit effect for successful tap
        /// </summary>
        /// <param name="tile">Tile that was hit</param>
        /// <param name="quality">Hit quality</param>
        public void PlayHitEffect(Tile tile, HitQuality quality)
        {
            // Visual feedback for hit
            tile.PlayHitEffect(quality == HitQuality.Perfect ? hitEffectColor : Color.yellow);
            
            // Return tile to pool
            ReturnTileToPool(tile);
        }

        /// <summary>
        /// Miss effect for when a tile is missed
        /// </summary>
        /// <param name="tile">Tile that was missed</param>
        public void PlayMissEffect(Tile tile)
        {
            // Visual feedback for miss
            tile.PlayMissEffect(missEffectColor);
            
            // Return tile to pool
            ReturnTileToPool(tile);
        }

        /// <summary>
        /// Gets a tile at a specific lane if it's at hit position
        /// </summary>
        /// <param name="lane">Lane to check</param>
        /// <returns>Tile at hit position or null</returns>
        public Tile GetTileAtHitPosition(int lane)
        {
            foreach (Tile tile in activeTiles)
            {
                if (tile.GetBeatData().Lane == lane && tile.IsAtHitPosition())
                {
                    return tile;
                }
            }
            return null;
        }

        /// <summary>
        /// Clears all active tiles from the screen
        /// </summary>
        public void ClearAllTiles()
        {
            foreach (Tile tile in new List<Tile>(activeTiles))
            {
                ReturnTileToPool(tile);
            }
            activeTiles.Clear();
        }

        /// <summary>
        /// Gets the hit line Y position
        /// </summary>
        /// <returns>Hit Y position</returns>
        public float GetHitLinePosition()
        {
            return hitY;
        }

        /// <summary>
        /// Sets the scroll speed for all tiles
        /// </summary>
        /// <param name="speed">New scroll speed</param>
        public void SetScrollSpeed(float speed)
        {
            BeatmapManager.Instance.ScrollSpeed = speed;
        }
        
        /// <summary>
        /// Gets the lane positions array
        /// </summary>
        /// <returns>Array of lane position transforms</returns>
        public Transform[] GetLanePositions()
        {
            return lanePositions;
        }
        
        /// <summary>
        /// Gets the X position of a specific lane
        /// </summary>
        /// <param name="lane">Lane index</param>
        /// <returns>X position of the lane</returns>
        public float GetLaneXPosition(int lane)
        {
            if (lane >= 0 && lane < lanePositions.Length)
            {
                return lanePositions[lane].position.x;
            }
            return 0f;
        }
    }
} 