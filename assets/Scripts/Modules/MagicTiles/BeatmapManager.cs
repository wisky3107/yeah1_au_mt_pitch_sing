using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages the loading, parsing, and processing of beatmap data.
    /// Handles the song metadata and difficulty calculation.
    /// </summary>
    public class BeatmapManager : MonoBehaviour
    {
        #region Singleton
        public static BeatmapManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeBeatmapManager();
        }
        #endregion

        [Header("Beatmap Settings")]
        [SerializeField] private float scrollSpeed = 1.0f;
        [SerializeField] private float hitTolerance = 0.15f; // Time window in seconds to hit a note
        [SerializeField] private float perfectHitTolerance = 0.05f; // Time window for perfect hit
        
        private Dictionary<string, SongMetadata> songLibrary = new Dictionary<string, SongMetadata>();
        private SongMetadata currentSong;
        private List<BeatData> currentBeatmap = new List<BeatData>();
        private int nextBeatIndex = 0;
        
        // Events
        public event Action<BeatData> OnBeatSpawn;
        public event Action<DifficultyLevel> OnDifficultyChanged;

        private void InitializeBeatmapManager()
        {
            LoadSongLibrary();
        }

        /// <summary>
        /// Loads the song library from the Resources folder
        /// </summary>
        private void LoadSongLibrary()
        {
            SongMetadata[] songs = Resources.LoadAll<SongMetadata>("Songs");
            foreach (var song in songs)
            {
                if (!songLibrary.ContainsKey(song.SongId))
                {
                    songLibrary.Add(song.SongId, song);
                    Debug.Log($"Loaded song: {song.SongName} by {song.Artist}");
                }
            }
            
            Debug.Log($"Loaded {songLibrary.Count} songs into the library");
        }

        /// <summary>
        /// Loads a beatmap for a specific song and difficulty
        /// </summary>
        /// <param name="songId">The ID of the song</param>
        /// <param name="difficulty">The difficulty level to load</param>
        /// <returns>True if loaded successfully</returns>
        public bool LoadBeatmap(string songId, DifficultyLevel difficulty)
        {
            if (!songLibrary.TryGetValue(songId, out currentSong))
            {
                Debug.LogError($"Song not found in library: {songId}");
                return false;
            }

            // Reset beatmap data
            currentBeatmap.Clear();
            nextBeatIndex = 0;
            
            // Determine beatmap file path
            string difficultyStr = difficulty.ToString().ToLower();
            string beatmapPath = $"Songs/{songId}/beatmap_{difficultyStr}";
            
            TextAsset beatmapAsset = Resources.Load<TextAsset>(beatmapPath);
            if (beatmapAsset == null)
            {
                Debug.LogError($"Beatmap file not found: {beatmapPath}");
                return false;
            }
            
            try
            {
                ParseBeatmap(beatmapAsset.text);
                OnDifficultyChanged?.Invoke(difficulty);
                Debug.Log($"Loaded beatmap for '{currentSong.SongName}' with difficulty {difficulty}. Total beats: {currentBeatmap.Count}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Error parsing beatmap: {e.Message}");
                return false;
            }
        }

        /// <summary>
        /// Parses the beatmap data from text
        /// </summary>
        /// <param name="beatmapText">The text content of the beatmap file</param>
        private void ParseBeatmap(string beatmapText)
        {
            using (StringReader reader = new StringReader(beatmapText))
            {
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith("//"))
                        continue; // Skip empty lines and comments
                    
                    string[] parts = line.Split(',');
                    if (parts.Length < 3)
                        continue; // Skip invalid lines
                    
                    try
                    {
                        float time = float.Parse(parts[0]);
                        int lane = int.Parse(parts[1]);
                        BeatType type = (BeatType)int.Parse(parts[2]);
                        
                        // Optional duration for long press notes
                        float duration = 0f;
                        if (type == BeatType.LongPress && parts.Length > 3)
                        {
                            duration = float.Parse(parts[3]);
                        }
                        
                        BeatData beat = new BeatData(time, lane, type, duration);
                        currentBeatmap.Add(beat);
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"Error parsing beatmap line: {line}. Error: {e.Message}");
                    }
                }
            }
            
            // Sort beatmap by time
            currentBeatmap.Sort((a, b) => a.Time.CompareTo(b.Time));
        }

        /// <summary>
        /// Updates the beatmap based on current music position
        /// </summary>
        /// <param name="currentTime">Current music position in seconds</param>
        /// <param name="preloadTime">Time in seconds to preload beats</param>
        public void UpdateBeatmap(float currentTime, float preloadTime)
        {
            for (int i = nextBeatIndex; i < currentBeatmap.Count; i++)
            {
                if (currentBeatmap[i].Time <= currentTime + preloadTime)
                {
                    OnBeatSpawn?.Invoke(currentBeatmap[i]);
                    nextBeatIndex = i + 1;
                }
                else
                {
                    break;
                }
            }
        }

        /// <summary>
        /// Resets the beatmap to start from the beginning
        /// </summary>
        public void ResetBeatmap()
        {
            nextBeatIndex = 0;
        }

        /// <summary>
        /// Validates if a tap at a specific time and lane should register as a hit
        /// </summary>
        /// <param name="time">Current time in seconds</param>
        /// <param name="lane">Lane that was tapped</param>
        /// <returns>Hit result info</returns>
        public HitResult ValidateTap(float time, int lane)
        {
            // Check all beats that haven't been hit yet, starting from the closest to current time
            for (int i = 0; i < currentBeatmap.Count; i++)
            {
                BeatData beat = currentBeatmap[i];
                
                // Skip beats that have already been hit
                if (beat.IsHit)
                    continue;
                
                // Skip beats in different lanes
                if (beat.Lane != lane)
                    continue;
                
                // Calculate time difference
                float timeDiff = Math.Abs(time - beat.Time);
                
                // Check if the tap is within hit tolerance
                if (timeDiff <= hitTolerance)
                {
                    beat.IsHit = true;
                    
                    // Determine hit quality
                    HitQuality quality;
                    if (timeDiff <= perfectHitTolerance)
                    {
                        quality = HitQuality.Perfect;
                    }
                    else
                    {
                        quality = HitQuality.Good;
                    }
                    
                    return new HitResult(true, quality, timeDiff, beat);
                }
            }
            
            // No valid beat found for this tap
            return new HitResult(false, HitQuality.Miss, 0f, null);
        }

        /// <summary>
        /// Gets the current song metadata
        /// </summary>
        /// <returns>Current song metadata</returns>
        public SongMetadata GetCurrentSong()
        {
            return currentSong;
        }

        /// <summary>
        /// Gets the list of all available songs
        /// </summary>
        /// <returns>List of song metadata</returns>
        public List<SongMetadata> GetAllSongs()
        {
            List<SongMetadata> songs = new List<SongMetadata>();
            foreach (var song in songLibrary.Values)
            {
                songs.Add(song);
            }
            return songs;
        }

        /// <summary>
        /// Gets or sets the scroll speed for the beatmap
        /// </summary>
        public float ScrollSpeed
        {
            get { return scrollSpeed; }
            set { scrollSpeed = value; }
        }

        /// <summary>
        /// Calculates difficulty score for the current beatmap
        /// </summary>
        /// <returns>Difficulty score from 1-10</returns>
        public float CalculateDifficulty()
        {
            if (currentBeatmap.Count == 0)
                return 1f;
            
            // Simple difficulty calculation based on:
            // 1. Average notes per second
            // 2. Percentage of complex notes (long press)
            // 3. Pattern complexity (adjacent lanes)
            
            float songDuration = currentBeatmap[currentBeatmap.Count - 1].Time;
            float notesPerSecond = currentBeatmap.Count / songDuration;
            
            int complexNotes = 0;
            foreach (var beat in currentBeatmap)
            {
                if (beat.Type == BeatType.LongPress)
                    complexNotes++;
            }
            
            float complexRatio = (float)complexNotes / currentBeatmap.Count;
            
            // Pattern complexity - counting adjacent notes in different lanes
            int adjacentNotes = 0;
            for (int i = 1; i < currentBeatmap.Count; i++)
            {
                if (currentBeatmap[i].Time - currentBeatmap[i - 1].Time < 0.3f &&
                    currentBeatmap[i].Lane != currentBeatmap[i - 1].Lane)
                {
                    adjacentNotes++;
                }
            }
            
            float adjacentRatio = (float)adjacentNotes / currentBeatmap.Count;
            
            // Calculate final difficulty (1-10 scale)
            float difficultyScore = (notesPerSecond * 2f) + (complexRatio * 3f) + (adjacentRatio * 5f);
            
            // Clamp between 1 and 10
            return Mathf.Clamp(difficultyScore, 1f, 10f);
        }
    }

    /// <summary>
    /// Represents metadata for a song
    /// </summary>
    [Serializable]
    public class SongMetadata
    {
        [SerializeField] private string songId;
        [SerializeField] private string songName;
        [SerializeField] private string artist;
        [SerializeField] private float bpm;
        [SerializeField] private float duration;
        [SerializeField] private Sprite coverArt;
        [SerializeField] private bool isLocked;
        [SerializeField] private DifficultyLevel[] availableDifficulties;

        public string SongId => songId;
        public string SongName => songName;
        public string Artist => artist;
        public float BPM => bpm;
        public float Duration => duration;
        public Sprite CoverArt => coverArt;
        public bool IsLocked => isLocked;
        public DifficultyLevel[] AvailableDifficulties => availableDifficulties;
    }

    /// <summary>
    /// Represents a single beat/note in the beatmap
    /// </summary>
    [Serializable]
    public class BeatData
    {
        public float Time { get; private set; }
        public int Lane { get; private set; }
        public BeatType Type { get; private set; }
        public float Duration { get; private set; } // For long press notes
        public bool IsHit { get; set; }

        public BeatData(float time, int lane, BeatType type, float duration = 0f)
        {
            Time = time;
            Lane = lane;
            Type = type;
            Duration = duration;
            IsHit = false;
        }
    }

    /// <summary>
    /// Types of beats/notes in the beatmap
    /// </summary>
    public enum BeatType
    {
        Normal = 0,
        LongPress = 1
    }

    /// <summary>
    /// Difficulty levels for beatmaps
    /// </summary>
    public enum DifficultyLevel
    {
        Easy,
        Medium,
        Hard,
        Expert
    }

    /// <summary>
    /// Quality of a hit (miss, good, perfect)
    /// </summary>
    public enum HitQuality
    {
        Miss,
        Good,
        Perfect
    }

    /// <summary>
    /// Result of a hit validation
    /// </summary>
    public class HitResult
    {
        public bool IsHit { get; private set; }
        public HitQuality Quality { get; private set; }
        public float TimeDifference { get; private set; }
        public BeatData Beat { get; private set; }

        public HitResult(bool isHit, HitQuality quality, float timeDifference, BeatData beat)
        {
            IsHit = isHit;
            Quality = quality;
            TimeDifference = timeDifference;
            Beat = beat;
        }
    }
} 