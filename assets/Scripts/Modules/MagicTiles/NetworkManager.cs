using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages network connections, leaderboards, and user profile synchronization.
    /// </summary>
    public class NetworkManager : MonoBehaviour
    {
        #region Singleton
        public static NetworkManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            InitializeNetworkManager();
        }
        #endregion

        [Header("Server Settings")]
        [SerializeField] private string apiBaseUrl = "https://magictiles3api.example.com";
        [SerializeField] private float connectionTimeout = 10f;
        [SerializeField] private int maxRetryAttempts = 3;
        [SerializeField] private float retryDelay = 2f;
        
        [Header("Debug Settings")]
        [SerializeField] private bool useOfflineMode = false;
        [SerializeField] private bool verboseLogging = false;
        
        // Events
        public event Action<bool> OnConnectionStatusChanged;
        public event Action<LeaderboardEntry[]> OnLeaderboardUpdated;
        public event Action<UserProfile> OnUserProfileUpdated;
        public event Action<NetworkError> OnNetworkError;
        
        // State tracking
        private bool isConnected = false;
        private string userAuthToken = string.Empty;
        private UserProfile currentUserProfile;
        private Dictionary<string, LeaderboardEntry[]> cachedLeaderboards = new Dictionary<string, LeaderboardEntry[]>();
        private Coroutine connectCoroutine;
        private Coroutine syncCoroutine;
        
        // Local dependencies
        private DataPersistenceManager dataPersistenceManager;
        
        /// <summary>
        /// Initializes the network manager and attempts to connect if not in offline mode
        /// </summary>
        private void InitializeNetworkManager()
        {
            // Get reference to data persistence manager
            dataPersistenceManager = FindObjectOfType<DataPersistenceManager>();
            
            if (dataPersistenceManager == null)
            {
                Debug.LogError("NetworkManager requires DataPersistenceManager to function properly");
            }
            
            // Load saved auth token if any
            LoadAuthToken();
            
            // Connect to server if not in offline mode
            if (!useOfflineMode)
            {
                ConnectToServer();
            }
            else
            {
                Debug.Log("Network Manager initialized in offline mode");
            }
        }
        
        /// <summary>
        /// Loads the saved authentication token if available
        /// </summary>
        private void LoadAuthToken()
        {
            userAuthToken = PlayerPrefs.GetString("user_auth_token", string.Empty);
            isConnected = !string.IsNullOrEmpty(userAuthToken);
            
            if (verboseLogging)
            {
                Debug.Log($"Loaded auth token. Connected: {isConnected}");
            }
        }
        
        /// <summary>
        /// Saves the current authentication token
        /// </summary>
        private void SaveAuthToken()
        {
            PlayerPrefs.SetString("user_auth_token", userAuthToken);
            PlayerPrefs.Save();
            
            if (verboseLogging)
            {
                Debug.Log("Saved auth token");
            }
        }
        
        /// <summary>
        /// Attempts to connect to the server
        /// </summary>
        public void ConnectToServer()
        {
            if (useOfflineMode)
            {
                Debug.Log("Cannot connect while in offline mode");
                return;
            }
            
            if (connectCoroutine != null)
            {
                StopCoroutine(connectCoroutine);
            }
            
            connectCoroutine = StartCoroutine(ConnectToServerCoroutine());
        }
        
        /// <summary>
        /// Coroutine to handle server connection
        /// </summary>
        /// <returns>IEnumerator for coroutine</returns>
        private IEnumerator ConnectToServerCoroutine()
        {
            Debug.Log("Connecting to server...");
            
            // If we have a token, validate it
            if (!string.IsNullOrEmpty(userAuthToken))
            {
                yield return ValidateAuthToken();
            }
            
            // If still not connected, we need to create a guest account
            if (!isConnected)
            {
                yield return CreateGuestAccount();
            }
            
            // If connected, sync data
            if (isConnected)
            {
                yield return SyncUserData();
            }
            
            connectCoroutine = null;
        }
        
        /// <summary>
        /// Validates the current auth token
        /// </summary>
        /// <returns>IEnumerator for coroutine</returns>
        private IEnumerator ValidateAuthToken()
        {
            string url = $"{apiBaseUrl}/auth/validate";
            
            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                request.SetRequestHeader("Authorization", $"Bearer {userAuthToken}");
                request.timeout = (int)connectionTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    isConnected = true;
                    OnConnectionStatusChanged?.Invoke(true);
                    Debug.Log("Auth token validated successfully");
                }
                else
                {
                    isConnected = false;
                    userAuthToken = string.Empty;
                    SaveAuthToken();
                    OnConnectionStatusChanged?.Invoke(false);
                    Debug.LogWarning($"Auth token validation failed: {request.error}");
                    
                    // Report network error
                    OnNetworkError?.Invoke(new NetworkError 
                    { 
                        ErrorCode = (int)request.responseCode,
                        ErrorMessage = request.error,
                        EndpointUrl = url
                    });
                }
            }
        }
        
        /// <summary>
        /// Creates a guest account
        /// </summary>
        /// <returns>IEnumerator for coroutine</returns>
        private IEnumerator CreateGuestAccount()
        {
            string url = $"{apiBaseUrl}/auth/guest";
            string deviceId = SystemInfo.deviceUniqueIdentifier;
            string playerName = "Guest_" + UnityEngine.Random.Range(1000, 9999);
            
            if (dataPersistenceManager != null)
            {
                playerName = dataPersistenceManager.GetPlayerData().PlayerName;
            }
            
            Dictionary<string, string> formData = new Dictionary<string, string>
            {
                { "deviceId", deviceId },
                { "playerName", playerName }
            };
            
            using (UnityWebRequest request = UnityWebRequest.Post(url, formData))
            {
                request.timeout = (int)connectionTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    // Parse response
                    AuthResponse response = JsonUtility.FromJson<AuthResponse>(request.downloadHandler.text);
                    
                    // Save token
                    userAuthToken = response.token;
                    SaveAuthToken();
                    
                    isConnected = true;
                    OnConnectionStatusChanged?.Invoke(true);
                    Debug.Log("Guest account created successfully");
                }
                else
                {
                    isConnected = false;
                    OnConnectionStatusChanged?.Invoke(false);
                    Debug.LogWarning($"Guest account creation failed: {request.error}");
                    
                    // Report network error
                    OnNetworkError?.Invoke(new NetworkError 
                    { 
                        ErrorCode = (int)request.responseCode,
                        ErrorMessage = request.error,
                        EndpointUrl = url
                    });
                }
            }
        }
        
        /// <summary>
        /// Syncs user data between local and server
        /// </summary>
        /// <returns>IEnumerator for coroutine</returns>
        private IEnumerator SyncUserData()
        {
            if (!isConnected || useOfflineMode)
            {
                yield break;
            }
            
            Debug.Log("Syncing user data...");
            
            // First, get user profile
            yield return GetUserProfile();
            
            // Then sync high scores
            yield return SyncHighScores();
        }
        
        /// <summary>
        /// Gets the user profile from the server
        /// </summary>
        /// <returns>IEnumerator for coroutine</returns>
        private IEnumerator GetUserProfile()
        {
            string url = $"{apiBaseUrl}/user/profile";
            
            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                request.SetRequestHeader("Authorization", $"Bearer {userAuthToken}");
                request.timeout = (int)connectionTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    // Parse response
                    currentUserProfile = JsonUtility.FromJson<UserProfile>(request.downloadHandler.text);
                    
                    OnUserProfileUpdated?.Invoke(currentUserProfile);
                    Debug.Log("User profile retrieved successfully");
                    
                    // Update local player data if needed
                    if (dataPersistenceManager != null)
                    {
                        dataPersistenceManager.UpdatePlayerData(playerData =>
                        {
                            playerData.PlayerName = currentUserProfile.displayName;
                            
                            // Add any remote achievements not in local data
                            foreach (string achievement in currentUserProfile.achievements)
                            {
                                if (!playerData.Achievements.Contains(achievement))
                                {
                                    playerData.Achievements.Add(achievement);
                                }
                            }
                        });
                    }
                }
                else
                {
                    Debug.LogWarning($"Get user profile failed: {request.error}");
                    
                    // Report network error
                    OnNetworkError?.Invoke(new NetworkError 
                    { 
                        ErrorCode = (int)request.responseCode,
                        ErrorMessage = request.error,
                        EndpointUrl = url
                    });
                }
            }
        }
        
        /// <summary>
        /// Syncs high scores between local and server
        /// </summary>
        /// <returns>IEnumerator for coroutine</returns>
        private IEnumerator SyncHighScores()
        {
            if (dataPersistenceManager == null)
            {
                yield break;
            }
            
            string url = $"{apiBaseUrl}/scores/sync";
            
            // Build a list of high scores from local data
            SongProgressData songData = dataPersistenceManager.GetSongProgressData();
            List<ScoreSubmission> localScores = new List<ScoreSubmission>();
            
            foreach (var songEntry in songData.SongProgresses)
            {
                string songId = songEntry.Key;
                SongProgress progress = songEntry.Value;
                
                foreach (var difficultyEntry in progress.DifficultyProgresses)
                {
                    DifficultyLevel difficulty = difficultyEntry.Key;
                    DifficultyProgress diffProgress = difficultyEntry.Value;
                    
                    // Only sync scores that are non-zero
                    if (diffProgress.HighScore > 0)
                    {
                        ScoreSubmission score = new ScoreSubmission
                        {
                            songId = songId,
                            difficulty = (int)difficulty,
                            score = diffProgress.HighScore,
                            accuracy = diffProgress.BestAccuracy,
                            rating = (int)diffProgress.BestRating
                        };
                        
                        localScores.Add(score);
                    }
                }
            }
            
            // Create the submission object
            ScoreSync scoreSync = new ScoreSync
            {
                scores = localScores.ToArray()
            };
            
            string jsonData = JsonUtility.ToJson(scoreSync);
            
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                request.SetRequestHeader("Authorization", $"Bearer {userAuthToken}");
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = (int)connectionTimeout;
                
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    // Parse response for any returned scores from server
                    ScoreSync response = JsonUtility.FromJson<ScoreSync>(request.downloadHandler.text);
                    
                    Debug.Log($"Synced {localScores.Count} scores, received {response.scores.Length} scores from server");
                    
                    // Update local scores if server has higher scores
                    foreach (ScoreSubmission serverScore in response.scores)
                    {
                        DifficultyLevel difficulty = (DifficultyLevel)serverScore.difficulty;
                        
                        // Get local score
                        SongProgress progress = dataPersistenceManager.GetSongProgress(serverScore.songId);
                        DifficultyProgress localProgress = progress.GetDifficultyProgress(difficulty);
                        
                        // Update local score if server score is higher
                        if (serverScore.score > localProgress.HighScore)
                        {
                            dataPersistenceManager.UpdateSongProgress(
                                serverScore.songId, 
                                difficulty, 
                                serverScore.score, 
                                serverScore.accuracy, 
                                (PerformanceRating)serverScore.rating
                            );
                        }
                    }
                }
                else
                {
                    Debug.LogWarning($"Score sync failed: {request.error}");
                    
                    // Report network error
                    OnNetworkError?.Invoke(new NetworkError 
                    { 
                        ErrorCode = (int)request.responseCode,
                        ErrorMessage = request.error,
                        EndpointUrl = url
                    });
                }
            }
        }
        
        /// <summary>
        /// Updates the user profile on the server
        /// </summary>
        /// <param name="displayName">New display name</param>
        /// <returns>IEnumerator for coroutine</returns>
        public IEnumerator UpdateUserProfile(string displayName)
        {
            if (!isConnected || useOfflineMode)
            {
                yield break;
            }
            
            string url = $"{apiBaseUrl}/user/profile";
            
            Dictionary<string, string> formData = new Dictionary<string, string>
            {
                { "displayName", displayName }
            };
            
            using (UnityWebRequest request = UnityWebRequest.Post(url, formData))
            {
                request.SetRequestHeader("Authorization", $"Bearer {userAuthToken}");
                request.timeout = (int)connectionTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    // Parse response
                    currentUserProfile = JsonUtility.FromJson<UserProfile>(request.downloadHandler.text);
                    
                    OnUserProfileUpdated?.Invoke(currentUserProfile);
                    Debug.Log("User profile updated successfully");
                    
                    // Update local player data
                    if (dataPersistenceManager != null)
                    {
                        dataPersistenceManager.UpdatePlayerData(playerData =>
                        {
                            playerData.PlayerName = displayName;
                        });
                    }
                }
                else
                {
                    Debug.LogWarning($"Update user profile failed: {request.error}");
                    
                    // Report network error
                    OnNetworkError?.Invoke(new NetworkError 
                    { 
                        ErrorCode = (int)request.responseCode,
                        ErrorMessage = request.error,
                        EndpointUrl = url
                    });
                }
            }
        }
        
        /// <summary>
        /// Gets the leaderboard for a specific song and difficulty
        /// </summary>
        /// <param name="songId">Song ID</param>
        /// <param name="difficulty">Difficulty level</param>
        /// <returns>IEnumerator for coroutine</returns>
        public IEnumerator GetLeaderboard(string songId, DifficultyLevel difficulty)
        {
            if (!isConnected || useOfflineMode)
            {
                // Return cached data if available
                string cacheKey = $"{songId}_{(int)difficulty}";
                if (cachedLeaderboards.ContainsKey(cacheKey))
                {
                    OnLeaderboardUpdated?.Invoke(cachedLeaderboards[cacheKey]);
                }
                
                yield break;
            }
            
            string url = $"{apiBaseUrl}/leaderboard/{songId}/{(int)difficulty}";
            
            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                request.SetRequestHeader("Authorization", $"Bearer {userAuthToken}");
                request.timeout = (int)connectionTimeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    // Parse response
                    LeaderboardResponse response = JsonUtility.FromJson<LeaderboardResponse>(request.downloadHandler.text);
                    
                    // Cache the leaderboard
                    string cacheKey = $"{songId}_{(int)difficulty}";
                    cachedLeaderboards[cacheKey] = response.entries;
                    
                    OnLeaderboardUpdated?.Invoke(response.entries);
                    Debug.Log($"Retrieved leaderboard with {response.entries.Length} entries");
                }
                else
                {
                    Debug.LogWarning($"Get leaderboard failed: {request.error}");
                    
                    // Report network error
                    OnNetworkError?.Invoke(new NetworkError 
                    { 
                        ErrorCode = (int)request.responseCode,
                        ErrorMessage = request.error,
                        EndpointUrl = url
                    });
                    
                    // Return cached data if available
                    string cacheKey = $"{songId}_{(int)difficulty}";
                    if (cachedLeaderboards.ContainsKey(cacheKey))
                    {
                        OnLeaderboardUpdated?.Invoke(cachedLeaderboards[cacheKey]);
                    }
                }
            }
        }
        
        /// <summary>
        /// Submits a score to the leaderboard
        /// </summary>
        /// <param name="songId">Song ID</param>
        /// <param name="difficulty">Difficulty level</param>
        /// <param name="score">Score value</param>
        /// <param name="accuracy">Accuracy (0-1)</param>
        /// <param name="rating">Performance rating</param>
        /// <returns>IEnumerator for coroutine</returns>
        public IEnumerator SubmitScore(string songId, DifficultyLevel difficulty, int score, float accuracy, PerformanceRating rating)
        {
            if (!isConnected || useOfflineMode)
            {
                yield break;
            }
            
            string url = $"{apiBaseUrl}/scores/submit";
            
            ScoreSubmission submission = new ScoreSubmission
            {
                songId = songId,
                difficulty = (int)difficulty,
                score = score,
                accuracy = accuracy,
                rating = (int)rating
            };
            
            string jsonData = JsonUtility.ToJson(submission);
            
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                request.SetRequestHeader("Authorization", $"Bearer {userAuthToken}");
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = (int)connectionTimeout;
                
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityWebRequest.Result.Success)
                {
                    Debug.Log("Score submitted successfully");
                    
                    // Refresh the leaderboard
                    yield return GetLeaderboard(songId, difficulty);
                }
                else
                {
                    Debug.LogWarning($"Score submission failed: {request.error}");
                    
                    // Report network error
                    OnNetworkError?.Invoke(new NetworkError 
                    { 
                        ErrorCode = (int)request.responseCode,
                        ErrorMessage = request.error,
                        EndpointUrl = url
                    });
                }
            }
        }
        
        /// <summary>
        /// Sets the offline mode
        /// </summary>
        /// <param name="offline">Whether to use offline mode</param>
        public void SetOfflineMode(bool offline)
        {
            useOfflineMode = offline;
            
            if (!offline && !isConnected)
            {
                ConnectToServer();
            }
            
            Debug.Log($"Offline mode set to {offline}");
        }
        
        /// <summary>
        /// Gets whether the user is currently connected
        /// </summary>
        /// <returns>Whether the user is connected</returns>
        public bool IsConnected()
        {
            return isConnected && !useOfflineMode;
        }
        
        /// <summary>
        /// Gets the current user profile
        /// </summary>
        /// <returns>User profile</returns>
        public UserProfile GetCurrentUserProfile()
        {
            return currentUserProfile;
        }
        
        private void OnApplicationQuit()
        {
            // Perform final sync when quitting
            if (isConnected && !useOfflineMode)
            {
                StartCoroutine(SyncUserData());
            }
        }
    }
    
    #region Data Models
    
    [Serializable]
    public class AuthResponse
    {
        public string token;
        public string userId;
        public string message;
    }
    
    [Serializable]
    public class UserProfile
    {
        public string userId;
        public string displayName;
        public int level;
        public int totalStars;
        public int totalSongs;
        public string[] achievements;
        public bool isPremium;
    }
    
    [Serializable]
    public class LeaderboardEntry
    {
        public string userId;
        public string displayName;
        public int rank;
        public int score;
        public float accuracy;
        public int rating;
        public bool isCurrentUser;
    }
    
    [Serializable]
    public class LeaderboardResponse
    {
        public LeaderboardEntry[] entries;
        public int totalPlayers;
        public int currentUserRank;
    }
    
    [Serializable]
    public class ScoreSubmission
    {
        public string songId;
        public int difficulty;
        public int score;
        public float accuracy;
        public int rating;
    }
    
    [Serializable]
    public class ScoreSync
    {
        public ScoreSubmission[] scores;
    }
    
    [Serializable]
    public class NetworkError
    {
        public int ErrorCode;
        public string ErrorMessage;
        public string EndpointUrl;
    }
    
    #endregion
} 