# Magic Tiles 3 - Unity Editor Setup Tasks

This document outlines the Unity Editor tasks required to implement Magic Tiles 3 after all scripts have been created. These steps will transform the code into a fully functional game.

## Scene Setup

- [ ] Create a main menu scene
- [ ] Create a gameplay scene
- [ ] Create a song selection scene
- [ ] Create a results scene
- [ ] Create a settings scene
- [ ] Set up scene transitions in the build settings

## Prefab Creation

### Tile System
- [ ] Create a normal tile prefab with the following components:
  - [ ] Attach the `Tile.cs` script
  - [ ] Add a sprite renderer
  - [ ] Add a box collider for touch detection
  - [ ] Add an animator controller for tile animations
- [ ] Create a long press tile prefab (variation of normal tile)
- [ ] Create hit effect prefab
- [ ] Create miss effect prefab

### UI Elements
- [ ] Create score popup prefab
- [ ] Create combo text prefab
- [ ] Create song item prefab for song selection
- [ ] Create difficulty button prefab
- [ ] Create transition effects prefab

## Manager GameObjects

- [ ] Create an empty GameObject named "GameManagers" in each scene with the following children:
  - [ ] AudioManager (with `AudioManager.cs` attached)
  - [ ] BeatmapManager (with `BeatmapManager.cs` attached)
  - [ ] TileManager (with `TileManager.cs` attached)
  - [ ] InputManager (with `InputManager.cs` attached)
  - [ ] FeedbackManager (with `FeedbackManager.cs` attached)
  - [ ] GameplayManager (with `GameplayManager.cs` attached)
  - [ ] ScoreManager (with `ScoreManager.cs` attached)
  - [ ] UIManager (with `UIManager.cs` attached)
  - [ ] DataPersistenceManager (with `DataPersistenceManager.cs` attached)
- [ ] Configure "DontDestroyOnLoad" hierarchy for persistent managers
- [ ] Set up manager references in the Inspector
- [ ] Set up serialized fields for all managers

## UI Setup

### Main Menu
- [ ] Design main menu layout
- [ ] Create buttons for:
  - [ ] Play Game
  - [ ] Settings
  - [ ] Tutorial
  - [ ] Exit
- [ ] Add animation transitions

### Song Selection Screen
- [ ] Set up scrollable song list container
- [ ] Create song item template
- [ ] Set up difficulty selection buttons
- [ ] Create search/filter UI
- [ ] Set up song preview controls
- [ ] Link to `SongSelectionManager.cs`

### Gameplay UI
- [ ] Set up score text
- [ ] Set up combo text
- [ ] Set up progress bar
- [ ] Set up accuracy indicator
- [ ] Create pause button
- [ ] Create pause menu overlay
- [ ] Link all elements to `UIManager.cs`

### Results Screen
- [ ] Design results layout
- [ ] Set up score display
- [ ] Set up accuracy display
- [ ] Set up perfect/good/miss counts
- [ ] Set up star rating
- [ ] Set up "retry" and "back to menu" buttons

### Settings Screen
- [ ] Create sliders for:
  - [ ] Music volume
  - [ ] SFX volume
  - [ ] Scroll speed
- [ ] Create toggles for:
  - [ ] Haptic feedback
  - [ ] Visual effects quality
- [ ] Link to `DataPersistenceManager.cs`

## Audio Setup

- [ ] Create audio mixer
- [ ] Set up music and SFX audio sources
- [ ] Import sound effects:
  - [ ] Perfect tap sound
  - [ ] Good tap sound
  - [ ] Miss sound
  - [ ] Menu click sound
  - [ ] Game over sound
- [ ] Configure audio settings in `AudioManager.cs`

## Beatmap Setup

- [ ] Create Resources/Beatmaps directory
- [ ] Import sample beatmap files
- [ ] Create song metadata assets:
  - [ ] Song name
  - [ ] Artist
  - [ ] BPM
  - [ ] Duration
  - [ ] Difficulties
  - [ ] Cover art
- [ ] Test beatmap loading

## Gameplay Elements

- [ ] Set up camera
- [ ] Create lane markers
- [ ] Create hit line indicator
- [ ] Set up tile spawn positions
- [ ] Configure tile movement speed
- [ ] Test tile spawning and destruction

## Animations

- [ ] Create animation controllers for:
  - [ ] Tiles
  - [ ] Hit effects
  - [ ] Score popups
  - [ ] Combo text
  - [ ] UI transitions
- [ ] Set up animation triggers

## Testing

- [ ] Test main gameplay loop
- [ ] Test scoring system
- [ ] Test combo system
- [ ] Test difficulty levels
- [ ] Test UI navigation
- [ ] Test data persistence
- [ ] Test performance optimization

## Asset Integration

- [ ] Import tile graphics
- [ ] Import UI elements
- [ ] Import background images
- [ ] Import fonts
- [ ] Import music tracks
- [ ] Import sound effects

## Performance Optimization

- [ ] Set up object pooling for tiles
- [ ] Optimize UI rendering
- [ ] Profile and fix any performance bottlenecks
- [ ] Test on target platform(s)

## Build and Deployment

- [ ] Configure player settings
- [ ] Set up app icons
- [ ] Create splash screen
- [ ] Configure build settings
- [ ] Create test build
- [ ] Test on target platform(s)

## Documentation

- [ ] Document editor setup
- [ ] Document game controls
- [ ] Document beatmap format
- [ ] Create in-game tutorial

## Final Polishing

- [ ] Add visual polish
- [ ] Add sound polish
- [ ] Add haptic feedback
- [ ] Add screen transitions
- [ ] Add particle effects
- [ ] Balance difficulty levels
- [ ] Test overall game feel

---

### Implementation Notes

1. **Singleton References**: Most manager scripts use the Singleton pattern. Make sure each manager is properly instantiated and accessible.

2. **Event Subscriptions**: Scripts use event-based communication. Ensure proper event subscriptions in the Unity Editor.

3. **Object References**: Many scripts have serialized fields that need to be set in the Inspector. Check each script for [SerializeField] attributes.

4. **Component Dependencies**: Some components depend on others. Follow this initialization order:
   - DataPersistenceManager
   - AudioManager
   - BeatmapManager
   - TileManager
   - InputManager
   - FeedbackManager
   - ScoreManager
   - GameplayManager
   - UIManager
   - SongSelectionManager

5. **Testing Workflow**: Use the following testing sequence:
   - Test individual managers
   - Test manager interactions
   - Test complete gameplay loop
   - Test UI navigation
   - Test scene transitions
   - Test data persistence 