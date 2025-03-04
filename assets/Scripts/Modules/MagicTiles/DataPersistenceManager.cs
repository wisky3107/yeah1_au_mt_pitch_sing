using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Newtonsoft.Json;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages data persistence for the game, including player progress, settings, and stats.
    /// </summary>
    public class DataPersistenceManager : MonoBehaviour
    {
        #region Singleton
        public static DataPersistenceManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            InitializeDataManager();
        }
        #endregion

        [Header("File Settings")]
        [SerializeField] private string playerDataFileName = "player_data.json";
        [SerializeField] private string songProgressFileName = "song_progress.json";
        [SerializeField] private string settingsFileName = "settings.json";
        [SerializeField] private string statsFileName = "stats.json";
        
        // Data containers
        private PlayerData playerData;
        private SongProgressData songProgressData;
        private GameSettingsData settingsData;
        private PlayerStatsData statsData;
        
        // Events
        public event Action<PlayerData> OnPlayerDataChanged;
        public event Action<SongProgressData> OnSongProgressChanged;
        public event Action<GameSettingsData> OnSettingsChanged;
        public event Action<PlayerStatsData> OnStatsChanged;
        
        private string persistentDataPath;
        
        /// <summary>
        /// Initializes the data manager and loads all data
        /// </summary>
        private void InitializeDataManager()
        {
            // Set up data path
            persistentDataPath = Application.persistentDataPath;
            
            // Load all data
            LoadAllData();
            
            Debug.Log("Data Persistence Manager initialized");
        }
        
        /// <summary>
        /// Loads all data from disk
        /// </summary>
        public void LoadAllData()
        {
            playerData = LoadData<PlayerData>(playerDataFileName) ?? new PlayerData();
            songProgressData = LoadData<SongProgressData>(songProgressFileName) ?? new SongProgressData();
            settingsData = LoadData<GameSettingsData>(settingsFileName) ?? new GameSettingsData();
            statsData = LoadData<PlayerStatsData>(statsFileName) ?? new PlayerStatsData();
        }
        
        /// <summary>
        /// Saves all data to disk
        /// </summary>
        public void SaveAllData()
        {
            SaveData(playerDataFileName, playerData);
            SaveData(songProgressFileName, songProgressData);
            SaveData(settingsFileName, settingsData);
            SaveData(statsFileName, statsData);
        }
        
        /// <summary>
        /// Loads data from a file
        /// </summary>
        /// <typeparam name="T">Type of data to load</typeparam>
        /// <param name="fileName">File to load from</param>
        /// <returns>Loaded data or null if file doesn't exist</returns>
        private T LoadData<T>(string fileName) where T : class
        {
            string filePath = Path.Combine(persistentDataPath, fileName);
            
            if (!File.Exists(filePath))
            {
                Debug.Log($"File {fileName} not found, creating new data instance");
                return null;
            }
            
            try
            {
                string json = File.ReadAllText(filePath);
                return JsonConvert.DeserializeObject<T>(json);
            }
            catch (Exception e)
            {
                Debug.LogError($"Error loading data from {fileName}: {e.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Saves data to a file
        /// </summary>
        /// <typeparam name="T">Type of data to save</typeparam>
        /// <param name="fileName">File to save to</param>
        /// <param name="data">Data to save</param>
        private void SaveData<T>(string fileName, T data) where T : class
        {
            string filePath = Path.Combine(persistentDataPath, fileName);
            
            try
            {
                string json = JsonConvert.SerializeObject(data, Formatting.Indented);
                File.WriteAllText(filePath, json);
                Debug.Log($"Saved data to {fileName}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Error saving data to {fileName}: {e.Message}");
            }
        }
        
        #region Player Data Methods
        
        /// <summary>
        /// Gets the current player data
        /// </summary>
        /// <returns>Player data</returns>
        public PlayerData GetPlayerData()
        {
            return playerData;
        }
        
        /// <summary>
        /// Updates the player data and triggers the changed event
        /// </summary>
        /// <param name="newData">New player data</param>
        public void UpdatePlayerData(PlayerData newData)
        {
            playerData = newData;
            SaveData(playerDataFileName, playerData);
            OnPlayerDataChanged?.Invoke(playerData);
        }
        
        /// <summary>
        /// Updates a specific field in the player data
        /// </summary>
        /// <param name="updateAction">Action to update the player data</param>
        public void UpdatePlayerData(Action<PlayerData> updateAction)
        {
            updateAction(playerData);
            SaveData(playerDataFileName, playerData);
            OnPlayerDataChanged?.Invoke(playerData);
        }
        
        #endregion
        
        #region Song Progress Methods
        
        /// <summary>
        /// Gets the song progress data
        /// </summary>
        /// <returns>Song progress data</returns>
        public SongProgressData GetSongProgressData()
        {
            return songProgressData;
        }
        
        /// <summary>
        /// Gets progress for a specific song
        /// </summary>
        /// <param name="songId">Song ID</param>
        /// <returns>Song progress</returns>
        public SongProgress GetSongProgress(string songId)
        {
            if (songProgressData.SongProgresses.TryGetValue(songId, out SongProgress progress))
            {
                return progress;
            }
            
            return new SongProgress();
        }
        
        /// <summary>
        /// Updates progress for a specific song
        /// </summary>
        /// <param name="songId">Song ID</param>
        /// <param name="difficulty">Difficulty level</param>
        /// <param name="score">Score achieved</param>
        /// <param name="accuracy">Accuracy achieved</param>
        /// <param name="rating">Performance rating</param>
        public void UpdateSongProgress(string songId, DifficultyLevel difficulty, int score, float accuracy, PerformanceRating rating)
        {
            // Create new progress if it doesn't exist
            if (!songProgressData.SongProgresses.ContainsKey(songId))
            {
                songProgressData.SongProgresses[songId] = new SongProgress();
            }
            
            SongProgress progress = songProgressData.SongProgresses[songId];
            
            // Update high score if better
            DifficultyProgress diffProgress = progress.GetDifficultyProgress(difficulty);
            bool isNewHighScore = score > diffProgress.HighScore;
            
            if (isNewHighScore)
            {
                diffProgress.HighScore = score;
                diffProgress.BestAccuracy = accuracy;
                diffProgress.BestRating = rating;
                progress.SetDifficultyProgress(difficulty, diffProgress);
                
                // Mark song as completed
                if (!progress.CompletedDifficulties.Contains(difficulty))
                {
                    progress.CompletedDifficulties.Add(difficulty);
                }
                
                // Update total stars
                progress.UpdateStars();
                
                // Update song progress
                songProgressData.SongProgresses[songId] = progress;
                
                // Save and notify
                SaveData(songProgressFileName, songProgressData);
                OnSongProgressChanged?.Invoke(songProgressData);
            }
            
            // Update played count regardless of high score
            diffProgress.TimesPlayed++;
            progress.SetDifficultyProgress(difficulty, diffProgress);
            songProgressData.SongProgresses[songId] = progress;
            SaveData(songProgressFileName, songProgressData);
        }
        
        /// <summary>
        /// Unlocks a song
        /// </summary>
        /// <param name="songId">Song ID to unlock</param>
        public void UnlockSong(string songId)
        {
            // Create new progress if it doesn't exist
            if (!songProgressData.SongProgresses.ContainsKey(songId))
            {
                songProgressData.SongProgresses[songId] = new SongProgress();
            }
            
            SongProgress progress = songProgressData.SongProgresses[songId];
            progress.IsUnlocked = true;
            songProgressData.SongProgresses[songId] = progress;
            
            SaveData(songProgressFileName, songProgressData);
            OnSongProgressChanged?.Invoke(songProgressData);
        }
        
        #endregion
        
        #region Settings Methods
        
        /// <summary>
        /// Gets the current game settings
        /// </summary>
        /// <returns>Game settings</returns>
        public GameSettingsData GetSettings()
        {
            return settingsData;
        }
        
        /// <summary>
        /// Updates the music volume setting
        /// </summary>
        /// <param name="volume">New music volume (0-1)</param>
        public void UpdateMusicVolume(float volume)
        {
            settingsData.MusicVolume = Mathf.Clamp01(volume);
            SaveData(settingsFileName, settingsData);
            OnSettingsChanged?.Invoke(settingsData);
        }
        
        /// <summary>
        /// Updates the SFX volume setting
        /// </summary>
        /// <param name="volume">New SFX volume (0-1)</param>
        public void UpdateSFXVolume(float volume)
        {
            settingsData.SFXVolume = Mathf.Clamp01(volume);
            SaveData(settingsFileName, settingsData);
            OnSettingsChanged?.Invoke(settingsData);
        }
        
        /// <summary>
        /// Updates the scroll speed setting
        /// </summary>
        /// <param name="speed">New scroll speed</param>
        public void UpdateScrollSpeed(float speed)
        {
            settingsData.ScrollSpeed = Mathf.Clamp(speed, 0.5f, 3f);
            SaveData(settingsFileName, settingsData);
            OnSettingsChanged?.Invoke(settingsData);
        }
        
        /// <summary>
        /// Updates the haptic feedback setting
        /// </summary>
        /// <param name="enabled">Whether haptic feedback is enabled</param>
        public void UpdateHapticFeedback(bool enabled)
        {
            settingsData.HapticFeedbackEnabled = enabled;
            SaveData(settingsFileName, settingsData);
            OnSettingsChanged?.Invoke(settingsData);
        }
        
        /// <summary>
        /// Updates the visual effects quality setting
        /// </summary>
        /// <param name="quality">Visual effects quality (0-2)</param>
        public void UpdateVisualEffectsQuality(int quality)
        {
            settingsData.VisualEffectsQuality = Mathf.Clamp(quality, 0, 2);
            SaveData(settingsFileName, settingsData);
            OnSettingsChanged?.Invoke(settingsData);
        }
        
        #endregion
        
        #region Stats Methods
        
        /// <summary>
        /// Gets the player stats
        /// </summary>
        /// <returns>Player stats</returns>
        public PlayerStatsData GetStats()
        {
            return statsData;
        }
        
        /// <summary>
        /// Records a game session
        /// </summary>
        /// <param name="songId">Song ID</param>
        /// <param name="difficulty">Difficulty level</param>
        /// <param name="score">Score achieved</param>
        /// <param name="accuracy">Accuracy achieved</param>
        /// <param name="perfectCount">Count of perfect hits</param>
        /// <param name="goodCount">Count of good hits</param>
        /// <param name="missCount">Count of misses</param>
        /// <param name="maxCombo">Maximum combo</param>
        /// <param name="completed">Whether the song was completed</param>
        public void RecordGameSession(string songId, DifficultyLevel difficulty, int score, 
            float accuracy, int perfectCount, int goodCount, int missCount, int maxCombo, bool completed)
        {
            // Update general stats
            statsData.GamesPlayed++;
            if (completed) statsData.GamesCompleted++;
            
            // Update note stats
            statsData.TotalNotes += perfectCount + goodCount + missCount;
            statsData.PerfectHits += perfectCount;
            statsData.GoodHits += goodCount;
            statsData.Misses += missCount;
            
            // Update high scores
            if (score > statsData.HighestScore)
            {
                statsData.HighestScore = score;
                statsData.HighestScoreSongId = songId;
                statsData.HighestScoreDifficulty = difficulty;
            }
            
            if (maxCombo > statsData.HighestCombo)
            {
                statsData.HighestCombo = maxCombo;
            }
            
            if (accuracy > statsData.HighestAccuracy)
            {
                statsData.HighestAccuracy = accuracy;
            }
            
            // Save stats
            SaveData(statsFileName, statsData);
            OnStatsChanged?.Invoke(statsData);
        }
        
        /// <summary>
        /// Records time played
        /// </summary>
        /// <param name="seconds">Seconds played</param>
        public void RecordTimePlayed(float seconds)
        {
            statsData.TotalTimePlayed += seconds;
            SaveData(statsFileName, statsData);
        }
        
        #endregion
    }
    
    #region Data Classes
    
    [Serializable]
    public class PlayerData
    {
        public string PlayerName { get; set; } = "Player";
        public int TotalStars { get; set; } = 0;
        public int Coins { get; set; } = 0;
        public int Level { get; set; } = 1;
        public int Experience { get; set; } = 0;
        public int ExperienceToNextLevel { get; set; } = 100;
        public DateTime LastLoginDate { get; set; } = DateTime.Now;
        public List<string> Achievements { get; set; } = new List<string>();
        public Dictionary<string, bool> PurchasedItems { get; set; } = new Dictionary<string, bool>();
        
        public void AddCoins(int amount)
        {
            Coins += amount;
        }
        
        public bool TrySpendCoins(int amount)
        {
            if (Coins >= amount)
            {
                Coins -= amount;
                return true;
            }
            return false;
        }
        
        public void AddExperience(int exp)
        {
            Experience += exp;
            
            while (Experience >= ExperienceToNextLevel)
            {
                Experience -= ExperienceToNextLevel;
                Level++;
                ExperienceToNextLevel = (int)(ExperienceToNextLevel * 1.2f);
            }
        }
        
        public void AddAchievement(string achievementId)
        {
            if (!Achievements.Contains(achievementId))
            {
                Achievements.Add(achievementId);
            }
        }
        
        public void MarkItemAsPurchased(string itemId)
        {
            PurchasedItems[itemId] = true;
        }
        
        public bool HasPurchasedItem(string itemId)
        {
            return PurchasedItems.ContainsKey(itemId) && PurchasedItems[itemId];
        }
    }
    
    [Serializable]
    public class SongProgressData
    {
        public Dictionary<string, SongProgress> SongProgresses { get; set; } = new Dictionary<string, SongProgress>();
    }
    
    [Serializable]
    public class SongProgress
    {
        public bool IsUnlocked { get; set; } = false;
        public int Stars { get; set; } = 0;
        public List<DifficultyLevel> CompletedDifficulties { get; set; } = new List<DifficultyLevel>();
        public Dictionary<DifficultyLevel, DifficultyProgress> DifficultyProgresses { get; set; } = new Dictionary<DifficultyLevel, DifficultyProgress>();
        
        public DifficultyProgress GetDifficultyProgress(DifficultyLevel difficulty)
        {
            if (DifficultyProgresses.TryGetValue(difficulty, out DifficultyProgress progress))
            {
                return progress;
            }
            
            return new DifficultyProgress();
        }
        
        public void SetDifficultyProgress(DifficultyLevel difficulty, DifficultyProgress progress)
        {
            DifficultyProgresses[difficulty] = progress;
        }
        
        public void UpdateStars()
        {
            int totalStars = 0;
            
            foreach (var diffProgress in DifficultyProgresses.Values)
            {
                // Add stars based on performance rating (S = 3 stars, A = 2 stars, B = 1 star)
                switch (diffProgress.BestRating)
                {
                    case PerformanceRating.S:
                        totalStars += 3;
                        break;
                    case PerformanceRating.A:
                        totalStars += 2;
                        break;
                    case PerformanceRating.B:
                        totalStars += 1;
                        break;
                }
            }
            
            Stars = totalStars;
        }
    }
    
    [Serializable]
    public class DifficultyProgress
    {
        public int HighScore { get; set; } = 0;
        public float BestAccuracy { get; set; } = 0f;
        public PerformanceRating BestRating { get; set; } = PerformanceRating.None;
        public int TimesPlayed { get; set; } = 0;
    }
    
    [Serializable]
    public class GameSettingsData
    {
        public float MusicVolume { get; set; } = 0.8f;
        public float SFXVolume { get; set; } = 0.8f;
        public float ScrollSpeed { get; set; } = 1.0f;
        public bool HapticFeedbackEnabled { get; set; } = true;
        public int VisualEffectsQuality { get; set; } = 1; // 0 = Low, 1 = Medium, 2 = High
    }
    
    [Serializable]
    public class PlayerStatsData
    {
        public int GamesPlayed { get; set; } = 0;
        public int GamesCompleted { get; set; } = 0;
        public int TotalNotes { get; set; } = 0;
        public int PerfectHits { get; set; } = 0;
        public int GoodHits { get; set; } = 0;
        public int Misses { get; set; } = 0;
        public float TotalTimePlayed { get; set; } = 0f;
        public int HighestScore { get; set; } = 0;
        public string HighestScoreSongId { get; set; } = "";
        public DifficultyLevel HighestScoreDifficulty { get; set; } = DifficultyLevel.Medium;
        public int HighestCombo { get; set; } = 0;
        public float HighestAccuracy { get; set; } = 0f;
        
        // Calculated properties
        public float CompletionRate => GamesPlayed > 0 ? (float)GamesCompleted / GamesPlayed : 0f;
        public float OverallAccuracy => TotalNotes > 0 ? (float)(PerfectHits + GoodHits) / TotalNotes : 0f;
        public float PerfectHitRate => TotalNotes > 0 ? (float)PerfectHits / TotalNotes : 0f;
    }
    
    #endregion
} 