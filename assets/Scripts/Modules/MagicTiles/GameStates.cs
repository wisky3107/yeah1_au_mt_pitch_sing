namespace Game.MagicTiles
{
    /// <summary>
    /// Enumerates all possible game states for Magic Tiles 3
    /// </summary>
    public enum GameStates
    {
        /// <summary>
        /// Game is in the main menu
        /// </summary>
        MainMenu,
        
        /// <summary>
        /// Game is in the song selection screen
        /// </summary>
        SongSelection,
        
        /// <summary>
        /// Game is loading a level/song
        /// </summary>
        Loading,
        
        /// <summary>
        /// Game is in a countdown before starting play
        /// </summary>
        Countdown,
        
        /// <summary>
        /// Game is actively playing
        /// </summary>
        Playing,
        
        /// <summary>
        /// Game is paused
        /// </summary>
        Paused,
        
        /// <summary>
        /// Player has completed the level, showing results
        /// </summary>
        Completed,
        
        /// <summary>
        /// Player has failed the level
        /// </summary>
        Failed,
        
        /// <summary>
        /// Game is showing tutorial information
        /// </summary>
        Tutorial,
        
        /// <summary>
        /// Game is in settings menu
        /// </summary>
        Settings
    }
    
    /// <summary>
    /// Extension methods for GameStates
    /// </summary>
    public static class GameStatesExtensions
    {
        /// <summary>
        /// Checks if the current game state is a playable state
        /// </summary>
        /// <param name="state">Game state to check</param>
        /// <returns>True if the state is playable</returns>
        public static bool IsPlayable(this GameStates state)
        {
            return state == GameStates.Playing || state == GameStates.Countdown;
        }
        
        /// <summary>
        /// Checks if the current game state is an active state (not paused or in menus)
        /// </summary>
        /// <param name="state">Game state to check</param>
        /// <returns>True if the state is active</returns>
        public static bool IsActive(this GameStates state)
        {
            return state == GameStates.Playing || 
                   state == GameStates.Countdown || 
                   state == GameStates.Completed || 
                   state == GameStates.Failed;
        }
        
        /// <summary>
        /// Checks if the current game state is a menu state
        /// </summary>
        /// <param name="state">Game state to check</param>
        /// <returns>True if the state is a menu</returns>
        public static bool IsMenu(this GameStates state)
        {
            return state == GameStates.MainMenu || 
                   state == GameStates.SongSelection || 
                   state == GameStates.Settings || 
                   state == GameStates.Paused;
        }
        
        /// <summary>
        /// Checks if the current game state is a completed state (success or failure)
        /// </summary>
        /// <param name="state">Game state to check</param>
        /// <returns>True if the state is a completed state</returns>
        public static bool IsCompleted(this GameStates state)
        {
            return state == GameStates.Completed || state == GameStates.Failed;
        }
    }
} 