using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Game.MagicTiles
{
    /// <summary>
    /// Manages audio playback, volume control, and synchronization with the game.
    /// Handles both music tracks and sound effects.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        #region Singleton
        public static AudioManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeAudio();
        }
        #endregion

        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;

        [Header("Sound Effects")]
        [SerializeField] private AudioClip tapSound;
        [SerializeField] private AudioClip perfectTapSound;
        [SerializeField] private AudioClip missSound;
        [SerializeField] private AudioClip menuClickSound;
        [SerializeField] private AudioClip gameOverSound;

        [Header("Volume Settings")]
        [Range(0f, 1f)]
        [SerializeField] private float musicVolume = 0.7f;
        [Range(0f, 1f)]
        [SerializeField] private float sfxVolume = 1f;

        private Dictionary<string, AudioClip> loadedMusicTracks = new Dictionary<string, AudioClip>();
        private float songStartTime;
        private float songPosition;
        private bool isPaused = false;
        
        // Event for beat synchronization
        public event Action<float> OnBeat;

        private void InitializeAudio()
        {
            // Create audio sources if not assigned in inspector
            if (musicSource == null)
            {
                GameObject musicObject = new GameObject("Music Source");
                musicObject.transform.SetParent(transform);
                musicSource = musicObject.AddComponent<AudioSource>();
                musicSource.loop = false;
                musicSource.playOnAwake = false;
            }

            if (sfxSource == null)
            {
                GameObject sfxObject = new GameObject("SFX Source");
                sfxObject.transform.SetParent(transform);
                sfxSource = sfxObject.AddComponent<AudioSource>();
                sfxSource.loop = false;
                sfxSource.playOnAwake = false;
            }

            // Apply initial volume settings
            UpdateMusicVolume(musicVolume);
            UpdateSFXVolume(sfxVolume);
        }

        /// <summary>
        /// Loads a music track from Resources folder for faster access during gameplay
        /// </summary>
        /// <param name="trackName">Name of the track in Resources folder</param>
        /// <returns>True if loaded successfully</returns>
        public bool PreloadMusicTrack(string trackName)
        {
            if (loadedMusicTracks.ContainsKey(trackName))
                return true;

            AudioClip track = Resources.Load<AudioClip>($"Music/{trackName}");
            if (track != null)
            {
                loadedMusicTracks.Add(trackName, track);
                return true;
            }
            
            Debug.LogWarning($"Failed to preload music track: {trackName}");
            return false;
        }

        /// <summary>
        /// Plays a music track with optional delay
        /// </summary>
        /// <param name="trackName">Name of the track to play</param>
        /// <param name="delay">Delay in seconds before starting the track</param>
        public void PlayMusic(string trackName, float delay = 0f)
        {
            AudioClip track;
            
            if (!loadedMusicTracks.TryGetValue(trackName, out track))
            {
                track = Resources.Load<AudioClip>($"Music/{trackName}");
                if (track == null)
                {
                    Debug.LogError($"Music track not found: {trackName}");
                    return;
                }
                loadedMusicTracks.Add(trackName, track);
            }

            musicSource.clip = track;
            if (delay > 0)
                musicSource.PlayDelayed(delay);
            else
                musicSource.Play();

            songStartTime = Time.time - delay;
            isPaused = false;
        }

        /// <summary>
        /// Plays a specific sound effect
        /// </summary>
        /// <param name="soundType">Type of sound effect to play</param>
        public void PlaySoundEffect(SoundEffectType soundType)
        {
            AudioClip clip = null;
            
            switch (soundType)
            {
                case SoundEffectType.Tap:
                    clip = tapSound;
                    break;
                case SoundEffectType.PerfectTap:
                    clip = perfectTapSound;
                    break;
                case SoundEffectType.Miss:
                    clip = missSound;
                    break;
                case SoundEffectType.MenuClick:
                    clip = menuClickSound;
                    break;
                case SoundEffectType.GameOver:
                    clip = gameOverSound;
                    break;
            }

            if (clip != null)
                sfxSource.PlayOneShot(clip);
        }

        /// <summary>
        /// Gets the current position in the playing music track
        /// </summary>
        /// <returns>Current position in seconds</returns>
        public float GetMusicPosition()
        {
            if (isPaused)
                return songPosition;
            
            return musicSource.time;
        }

        /// <summary>
        /// Pauses the currently playing music
        /// </summary>
        public void PauseMusic()
        {
            if (!isPaused && musicSource.isPlaying)
            {
                musicSource.Pause();
                songPosition = musicSource.time;
                isPaused = true;
            }
        }

        /// <summary>
        /// Resumes the paused music
        /// </summary>
        public void ResumeMusic()
        {
            if (isPaused)
            {
                musicSource.time = songPosition;
                musicSource.Play();
                isPaused = false;
            }
        }

        /// <summary>
        /// Stops the currently playing music
        /// </summary>
        public void StopMusic()
        {
            musicSource.Stop();
            isPaused = false;
        }

        /// <summary>
        /// Checks if the music is currently paused
        /// </summary>
        /// <returns>True if music is paused</returns>
        public bool IsPaused()
        {
            return isPaused;
        }

        /// <summary>
        /// Checks if music is currently playing
        /// </summary>
        /// <returns>True if music is playing and not paused</returns>
        public bool IsPlaying()
        {
            return musicSource.isPlaying && !isPaused;
        }

        /// <summary>
        /// Updates the music volume
        /// </summary>
        /// <param name="volume">Volume value between 0 and 1</param>
        public void UpdateMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            musicSource.volume = musicVolume;
            PlayerPrefs.SetFloat("MusicVolume", musicVolume);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Updates the sound effects volume
        /// </summary>
        /// <param name="volume">Volume value between 0 and 1</param>
        public void UpdateSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            sfxSource.volume = sfxVolume;
            PlayerPrefs.SetFloat("SFXVolume", sfxVolume);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Trigger beat event for synchronization
        /// </summary>
        /// <param name="beatTime">Time of the beat in seconds</param>
        public void TriggerBeat(float beatTime)
        {
            OnBeat?.Invoke(beatTime);
        }

        /// <summary>
        /// Sound effect types for the game
        /// </summary>
        public enum SoundEffectType
        {
            Tap,
            PerfectTap,
            Miss,
            MenuClick,
            GameOver
        }
    }
} 