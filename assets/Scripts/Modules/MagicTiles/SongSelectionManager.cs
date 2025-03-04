using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages the song selection screen, song list display, filtering, and preview.
    /// </summary>
    public class SongSelectionManager : MonoBehaviour
    {
        [Header("Song List Display")]
        [SerializeField] private Transform songListContainer;
        [SerializeField] private GameObject songItemPrefab;
        [SerializeField] private int maxVisibleSongs = 8;
        [SerializeField] private float songItemHeight = 100f;
        
        [Header("Song Details")]
        [SerializeField] private Image songCoverImage;
        [SerializeField] private TMP_Text songTitleText;
        [SerializeField] private TMP_Text songArtistText;
        [SerializeField] private TMP_Text songDurationText;
        [SerializeField] private TMP_Text songBPMText;
        [SerializeField] private Slider songPreviewSlider;
        
        [Header("Difficulty Selection")]
        [SerializeField] private Transform difficultyButtonsContainer;
        [SerializeField] private GameObject difficultyButtonPrefab;
        [SerializeField] private Color easyColor = Color.green;
        [SerializeField] private Color mediumColor = Color.yellow;
        [SerializeField] private Color hardColor = new Color(1, 0.5f, 0);
        [SerializeField] private Color expertColor = Color.red;
        
        [Header("Sorting and Filtering")]
        [SerializeField] private TMP_Dropdown sortDropdown;
        [SerializeField] private TMP_InputField searchInput;
        [SerializeField] private Toggle unlockedOnlyToggle;
        
        [Header("Song Preview")]
        [SerializeField] private Button playPreviewButton;
        [SerializeField] private Button stopPreviewButton;
        [SerializeField] private float previewDuration = 30f;
        
        // References to other managers
        private BeatmapManager beatmapManager;
        private AudioManager audioManager;
        private GameplayManager gameplayManager;
        private UIManager uiManager;
        
        // Song list tracking
        private List<SongMetadata> allSongs = new List<SongMetadata>();
        private List<SongMetadata> filteredSongs = new List<SongMetadata>();
        private SongMetadata selectedSong;
        private DifficultyLevel selectedDifficulty = DifficultyLevel.Medium;
        private List<GameObject> songItems = new List<GameObject>();
        private List<GameObject> difficultyButtons = new List<GameObject>();
        private Coroutine previewCoroutine;
        private int listScrollOffset = 0;
        
        private void Start()
        {
            // Get references to managers
            beatmapManager = FindObjectOfType<BeatmapManager>();
            audioManager = FindObjectOfType<AudioManager>();
            gameplayManager = FindObjectOfType<GameplayManager>();
            uiManager = FindObjectOfType<UIManager>();
            
            // Set up UI event handlers
            if (sortDropdown != null)
            {
                sortDropdown.onValueChanged.AddListener(OnSortChanged);
            }
            
            if (searchInput != null)
            {
                searchInput.onValueChanged.AddListener(OnSearchChanged);
            }
            
            if (unlockedOnlyToggle != null)
            {
                unlockedOnlyToggle.onValueChanged.AddListener(OnUnlockedOnlyChanged);
            }
            
            if (playPreviewButton != null)
            {
                playPreviewButton.onClick.AddListener(OnPlayPreviewClicked);
            }
            
            if (stopPreviewButton != null)
            {
                stopPreviewButton.onClick.AddListener(OnStopPreviewClicked);
            }
            
            // Initialize song list
            LoadSongList();
        }
        
        private void OnEnable()
        {
            // Update the song list when the screen becomes active
            LoadSongList();
        }
        
        private void OnDisable()
        {
            // Stop preview when leaving the screen
            StopPreview();
        }
        
        /// <summary>
        /// Loads the song list from the beatmap manager
        /// </summary>
        private void LoadSongList()
        {
            if (beatmapManager == null)
                return;
                
            // Get all songs
            allSongs = beatmapManager.GetAllSongs();
            
            // Apply initial filtering and sorting
            ApplyFiltersAndSort();
            
            // Create song list UI
            RefreshSongList();
        }
        
        /// <summary>
        /// Applies filters and sorting to the song list
        /// </summary>
        private void ApplyFiltersAndSort()
        {
            // Clear filtered list
            filteredSongs.Clear();
            
            // Apply filters
            string searchTerm = searchInput != null ? searchInput.text.ToLower() : "";
            bool unlockedOnly = unlockedOnlyToggle != null ? unlockedOnlyToggle.isOn : false;
            
            foreach (SongMetadata song in allSongs)
            {
                bool matchesSearch = string.IsNullOrEmpty(searchTerm) || 
                                   song.SongName.ToLower().Contains(searchTerm) || 
                                   song.Artist.ToLower().Contains(searchTerm);
                                   
                bool passesUnlockedFilter = !unlockedOnly || !song.IsLocked;
                
                if (matchesSearch && passesUnlockedFilter)
                {
                    filteredSongs.Add(song);
                }
            }
            
            // Apply sorting
            int sortOption = sortDropdown != null ? sortDropdown.value : 0;
            
            switch (sortOption)
            {
                case 0: // Name (A-Z)
                    filteredSongs.Sort((a, b) => a.SongName.CompareTo(b.SongName));
                    break;
                case 1: // Name (Z-A)
                    filteredSongs.Sort((a, b) => b.SongName.CompareTo(a.SongName));
                    break;
                case 2: // Artist (A-Z)
                    filteredSongs.Sort((a, b) => a.Artist.CompareTo(b.Artist));
                    break;
                case 3: // Duration (Short to Long)
                    filteredSongs.Sort((a, b) => a.Duration.CompareTo(b.Duration));
                    break;
                case 4: // Duration (Long to Short)
                    filteredSongs.Sort((a, b) => b.Duration.CompareTo(a.Duration));
                    break;
                case 5: // BPM (Low to High)
                    filteredSongs.Sort((a, b) => a.BPM.CompareTo(b.BPM));
                    break;
                case 6: // BPM (High to Low)
                    filteredSongs.Sort((a, b) => b.BPM.CompareTo(a.BPM));
                    break;
            }
        }
        
        /// <summary>
        /// Refreshes the song list UI based on the filtered songs
        /// </summary>
        private void RefreshSongList()
        {
            // Clear existing song items
            foreach (GameObject item in songItems)
            {
                Destroy(item);
            }
            songItems.Clear();
            
            // Check if we have a container
            if (songListContainer == null || songItemPrefab == null)
                return;
                
            // Create song items for visible range
            int endIndex = Mathf.Min(listScrollOffset + maxVisibleSongs, filteredSongs.Count);
            
            for (int i = listScrollOffset; i < endIndex; i++)
            {
                CreateSongItem(filteredSongs[i], i);
            }
            
            // Select first song if none selected
            if (selectedSong == null && filteredSongs.Count > 0)
            {
                SelectSong(filteredSongs[0]);
            }
        }
        
        /// <summary>
        /// Creates a song item in the list
        /// </summary>
        /// <param name="song">Song metadata to display</param>
        /// <param name="index">Index in the filtered list</param>
        private void CreateSongItem(SongMetadata song, int index)
        {
            GameObject item = Instantiate(songItemPrefab, songListContainer);
            RectTransform rect = item.GetComponent<RectTransform>();
            
            if (rect != null)
            {
                // Position the item based on index
                rect.anchoredPosition = new Vector2(0, -songItemHeight * (index - listScrollOffset));
            }
            
            // Set song data in the item
            SongItemUI songItemUI = item.GetComponent<SongItemUI>();
            if (songItemUI != null)
            {
                songItemUI.SetSongData(song);
                
                // Add click handler
                Button button = item.GetComponent<Button>();
                if (button != null)
                {
                    button.onClick.AddListener(() => SelectSong(song));
                }
            }
            
            // Mark as selected if this is the selected song
            if (song == selectedSong)
            {
                MarkItemAsSelected(item);
            }
            
            songItems.Add(item);
        }
        
        /// <summary>
        /// Marks a song item as selected
        /// </summary>
        /// <param name="item">Item to mark as selected</param>
        private void MarkItemAsSelected(GameObject item)
        {
            foreach (GameObject songItem in songItems)
            {
                // Update visual state of all items
                SongItemUI songItemUI = songItem.GetComponent<SongItemUI>();
                if (songItemUI != null)
                {
                    songItemUI.SetSelected(songItem == item);
                }
            }
        }
        
        /// <summary>
        /// Selects a song and displays its details
        /// </summary>
        /// <param name="song">Song to select</param>
        private void SelectSong(SongMetadata song)
        {
            selectedSong = song;
            
            // Find and mark the item as selected
            foreach (GameObject item in songItems)
            {
                SongItemUI songItemUI = item.GetComponent<SongItemUI>();
                if (songItemUI != null && songItemUI.Song == song)
                {
                    MarkItemAsSelected(item);
                    break;
                }
            }
            
            // Update song details
            if (songTitleText != null)
            {
                songTitleText.text = song.SongName;
            }
            
            if (songArtistText != null)
            {
                songArtistText.text = song.Artist;
            }
            
            if (songDurationText != null)
            {
                int minutes = Mathf.FloorToInt(song.Duration / 60);
                int seconds = Mathf.FloorToInt(song.Duration % 60);
                songDurationText.text = $"{minutes}:{seconds:D2}";
            }
            
            if (songBPMText != null)
            {
                songBPMText.text = $"{song.BPM} BPM";
            }
            
            if (songCoverImage != null && song.CoverArt != null)
            {
                songCoverImage.sprite = song.CoverArt;
            }
            
            // Update difficulty buttons
            CreateDifficultyButtons(song);
            
            // Stop any playing preview
            StopPreview();
        }
        
        /// <summary>
        /// Creates difficulty buttons based on the selected song's available difficulties
        /// </summary>
        /// <param name="song">Song to create difficulty buttons for</param>
        private void CreateDifficultyButtons(SongMetadata song)
        {
            // Clear existing buttons
            foreach (GameObject button in difficultyButtons)
            {
                Destroy(button);
            }
            difficultyButtons.Clear();
            
            if (difficultyButtonsContainer == null || difficultyButtonPrefab == null)
                return;
                
            // Create buttons for each available difficulty
            if (song.AvailableDifficulties != null)
            {
                for (int i = 0; i < song.AvailableDifficulties.Length; i++)
                {
                    DifficultyLevel difficulty = song.AvailableDifficulties[i];
                    GameObject buttonObj = Instantiate(difficultyButtonPrefab, difficultyButtonsContainer);
                    
                    // Set button text and color
                    Button button = buttonObj.GetComponent<Button>();
                    TMP_Text buttonText = buttonObj.GetComponentInChildren<TMP_Text>();
                    
                    if (buttonText != null)
                    {
                        buttonText.text = difficulty.ToString();
                    }
                    
                    if (button != null)
                    {
                        // Set color based on difficulty
                        ColorBlock colors = button.colors;
                        colors.normalColor = GetDifficultyColor(difficulty);
                        button.colors = colors;
                        
                        // Add click handler
                        button.onClick.AddListener(() => SelectDifficulty(difficulty));
                        
                        // Mark as selected if this is the selected difficulty
                        if (difficulty == selectedDifficulty)
                        {
                            MarkDifficultyAsSelected(buttonObj);
                        }
                    }
                    
                    difficultyButtons.Add(buttonObj);
                }
            }
        }
        
        /// <summary>
        /// Gets a color for a difficulty level
        /// </summary>
        /// <param name="difficulty">Difficulty level</param>
        /// <returns>Color for the difficulty</returns>
        private Color GetDifficultyColor(DifficultyLevel difficulty)
        {
            switch (difficulty)
            {
                case DifficultyLevel.Easy:
                    return easyColor;
                case DifficultyLevel.Medium:
                    return mediumColor;
                case DifficultyLevel.Hard:
                    return hardColor;
                case DifficultyLevel.Expert:
                    return expertColor;
                default:
                    return Color.white;
            }
        }
        
        /// <summary>
        /// Marks a difficulty button as selected
        /// </summary>
        /// <param name="button">Button to mark as selected</param>
        private void MarkDifficultyAsSelected(GameObject button)
        {
            foreach (GameObject diffButton in difficultyButtons)
            {
                // Update visual state of all buttons
                Button btn = diffButton.GetComponent<Button>();
                if (btn != null)
                {
                    // Change the visual state to show selection
                    ColorBlock colors = btn.colors;
                    colors.colorMultiplier = (diffButton == button) ? 1.5f : 1f;
                    btn.colors = colors;
                }
            }
        }
        
        /// <summary>
        /// Selects a difficulty level
        /// </summary>
        /// <param name="difficulty">Difficulty to select</param>
        private void SelectDifficulty(DifficultyLevel difficulty)
        {
            selectedDifficulty = difficulty;
            
            // Find and mark the button as selected
            foreach (GameObject button in difficultyButtons)
            {
                TMP_Text buttonText = button.GetComponentInChildren<TMP_Text>();
                if (buttonText != null && buttonText.text == difficulty.ToString())
                {
                    MarkDifficultyAsSelected(button);
                    break;
                }
            }
        }
        
        /// <summary>
        /// Callback for sort dropdown change
        /// </summary>
        /// <param name="value">New sort value</param>
        private void OnSortChanged(int value)
        {
            ApplyFiltersAndSort();
            RefreshSongList();
        }
        
        /// <summary>
        /// Callback for search input change
        /// </summary>
        /// <param name="text">New search text</param>
        private void OnSearchChanged(string text)
        {
            listScrollOffset = 0; // Reset scroll when search changes
            ApplyFiltersAndSort();
            RefreshSongList();
        }
        
        /// <summary>
        /// Callback for unlocked only toggle change
        /// </summary>
        /// <param name="value">New toggle value</param>
        private void OnUnlockedOnlyChanged(bool value)
        {
            listScrollOffset = 0; // Reset scroll when filter changes
            ApplyFiltersAndSort();
            RefreshSongList();
        }
        
        /// <summary>
        /// Scrolls the song list up
        /// </summary>
        public void ScrollUp()
        {
            if (listScrollOffset > 0)
            {
                listScrollOffset--;
                RefreshSongList();
            }
        }
        
        /// <summary>
        /// Scrolls the song list down
        /// </summary>
        public void ScrollDown()
        {
            if (listScrollOffset + maxVisibleSongs < filteredSongs.Count)
            {
                listScrollOffset++;
                RefreshSongList();
            }
        }
        
        /// <summary>
        /// Plays a preview of the selected song
        /// </summary>
        private void OnPlayPreviewClicked()
        {
            if (selectedSong == null || audioManager == null)
                return;
                
            StopPreview(); // Stop any existing preview
            
            // Play the song
            audioManager.PlayMusic(selectedSong.SongId);
            
            // Start preview timer
            if (previewCoroutine != null)
            {
                StopCoroutine(previewCoroutine);
            }
            
            previewCoroutine = StartCoroutine(PreviewCoroutine());
            
            // Update button states
            if (playPreviewButton != null)
            {
                playPreviewButton.gameObject.SetActive(false);
            }
            
            if (stopPreviewButton != null)
            {
                stopPreviewButton.gameObject.SetActive(true);
            }
        }
        
        /// <summary>
        /// Stops the currently playing preview
        /// </summary>
        private void OnStopPreviewClicked()
        {
            StopPreview();
        }
        
        /// <summary>
        /// Stops the preview and resets UI
        /// </summary>
        private void StopPreview()
        {
            // Stop the song
            if (audioManager != null)
            {
                audioManager.StopMusic();
            }
            
            // Stop preview timer
            if (previewCoroutine != null)
            {
                StopCoroutine(previewCoroutine);
                previewCoroutine = null;
            }
            
            // Reset slider
            if (songPreviewSlider != null)
            {
                songPreviewSlider.value = 0f;
            }
            
            // Update button states
            if (playPreviewButton != null)
            {
                playPreviewButton.gameObject.SetActive(true);
            }
            
            if (stopPreviewButton != null)
            {
                stopPreviewButton.gameObject.SetActive(false);
            }
        }
        
        /// <summary>
        /// Coroutine to handle preview playback
        /// </summary>
        private IEnumerator PreviewCoroutine()
        {
            float startTime = Time.time;
            
            while (Time.time < startTime + previewDuration)
            {
                // Update slider
                if (songPreviewSlider != null)
                {
                    songPreviewSlider.value = (Time.time - startTime) / previewDuration;
                }
                
                yield return null;
            }
            
            // Preview finished, stop playback
            StopPreview();
        }
        
        /// <summary>
        /// Plays the selected song with the selected difficulty
        /// </summary>
        public void PlaySelectedSong()
        {
            if (selectedSong == null || gameplayManager == null)
                return;
                
            // Stop any preview
            StopPreview();
            
            // Load and play the selected song
            gameplayManager.LoadSong(selectedSong.SongId, selectedDifficulty);
        }
    }
    
    /// <summary>
    /// UI component for a song item in the list
    /// </summary>
    public class SongItemUI : MonoBehaviour
    {
        [SerializeField] private TMP_Text titleText;
        [SerializeField] private TMP_Text artistText;
        [SerializeField] private TMP_Text durationText;
        [SerializeField] private Image coverImage;
        [SerializeField] private Image backgroundImage;
        
        [SerializeField] private Color selectedColor = new Color(0.3f, 0.7f, 1f, 0.5f);
        [SerializeField] private Color normalColor = new Color(0.2f, 0.2f, 0.2f, 0.5f);
        
        public SongMetadata Song { get; private set; }
        
        /// <summary>
        /// Sets the song data for this item
        /// </summary>
        /// <param name="song">Song metadata</param>
        public void SetSongData(SongMetadata song)
        {
            Song = song;
            
            if (titleText != null)
            {
                titleText.text = song.SongName;
            }
            
            if (artistText != null)
            {
                artistText.text = song.Artist;
            }
            
            if (durationText != null)
            {
                int minutes = Mathf.FloorToInt(song.Duration / 60);
                int seconds = Mathf.FloorToInt(song.Duration % 60);
                durationText.text = $"{minutes}:{seconds:D2}";
            }
            
            if (coverImage != null && song.CoverArt != null)
            {
                coverImage.sprite = song.CoverArt;
            }
        }
        
        /// <summary>
        /// Sets the selected state of this item
        /// </summary>
        /// <param name="selected">Whether the item is selected</param>
        public void SetSelected(bool selected)
        {
            if (backgroundImage != null)
            {
                backgroundImage.color = selected ? selectedColor : normalColor;
            }
        }
    }
} 