/**
 * Cocos Creator File Modifier Utility
 * This script demonstrates how AI can programmatically modify Cocos Creator files
 * without using the editor.
 */

const fs = require('fs');
const path = require('path');

/**
 * Class for modifying Cocos Creator scene files
 */
class CocosSceneModifier {
  /**
   * Constructor
   * @param {string} filePath - Path to the scene file
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
    this.load();
  }

  /**
   * Load the scene file
   */
  load() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      this.data = JSON.parse(content);
      console.log(`Successfully loaded scene: ${path.basename(this.filePath)}`);
    } catch (error) {
      console.error(`Error loading scene: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save the modified scene file
   * @param {string} outputPath - Optional path to save to (uses original path if not specified)
   */
  save(outputPath = null) {
    const savePath = outputPath || this.filePath;
    try {
      const content = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(savePath, content, 'utf8');
      console.log(`Successfully saved scene to: ${savePath}`);
      return true;
    } catch (error) {
      console.error(`Error saving scene: ${error.message}`);
      return false;
    }
  }

  /**
   * Find a node by name
   * @param {string} name - Name of the node to find
   * @param {Object} startNode - Node to start searching from (defaults to scene root)
   * @returns {Object|null} The found node or null
   */
  findNodeByName(name, startNode = null) {
    // If no start node is provided, use the scene root's children
    const searchNodes = startNode ? 
      (startNode._children || []) : 
      (this.data || []).filter(item => item.__type__ === "cc.Scene")[0]?._children || [];
    
    for (const node of searchNodes) {
      if (node._name === name) return node;
      
      // Search in children recursively
      if (node._children && node._children.length > 0) {
        const childResult = this.findNodeByName(name, node);
        if (childResult) return childResult;
      }
    }
    
    return null;
  }

  /**
   * Find a node by ID reference
   * @param {number} id - ID of the node to find
   * @returns {Object|null} The found node or null
   */
  findNodeById(id) {
    // Since Cocos Creator uses __id__ for referencing, we need to find the node with that ID
    return this.data.find(item => item.__id__ === id);
  }

  /**
   * Find a component on a node by type
   * @param {Object} node - The node to search on
   * @param {string} componentType - Type of component to find (e.g., "cc.Label")
   * @returns {Object|null} The found component or null
   */
  findComponentByType(node, componentType) {
    if (!node._components || !node._components.length) return null;
    
    for (const compRef of node._components) {
      const compId = compRef.__id__;
      const comp = this.findNodeById(compId);
      if (comp && comp.__type__ === componentType) {
        return comp;
      }
    }
    
    return null;
  }

  /**
   * Update text on a label node
   * @param {string} nodeName - Name of the node with the label
   * @param {string} newText - New text to set
   * @returns {boolean} Success status
   */
  updateLabelText(nodeName, newText) {
    const node = this.findNodeByName(nodeName);
    if (!node) {
      console.error(`Node "${nodeName}" not found.`);
      return false;
    }
    
    const labelComp = this.findComponentByType(node, "cc.Label");
    if (!labelComp) {
      console.error(`No Label component found on node "${nodeName}".`);
      return false;
    }
    
    labelComp._string = newText;
    console.log(`Updated text on "${nodeName}" to: "${newText}"`);
    return true;
  }

  /**
   * Update position of a node
   * @param {string} nodeName - Name of the node to update
   * @param {number} x - New X position
   * @param {number} y - New Y position
   * @param {number} z - New Z position
   * @returns {boolean} Success status
   */
  updateNodePosition(nodeName, x, y, z) {
    const node = this.findNodeByName(nodeName);
    if (!node) {
      console.error(`Node "${nodeName}" not found.`);
      return false;
    }
    
    node._lpos.x = x;
    node._lpos.y = y;
    node._lpos.z = z;
    
    console.log(`Updated position of "${nodeName}" to (${x}, ${y}, ${z})`);
    return true;
  }

  /**
   * Update size of a UI element
   * @param {string} nodeName - Name of the node to update
   * @param {number} width - New width
   * @param {number} height - New height
   * @returns {boolean} Success status
   */
  updateNodeSize(nodeName, width, height) {
    const node = this.findNodeByName(nodeName);
    if (!node) {
      console.error(`Node "${nodeName}" not found.`);
      return false;
    }
    
    const uiTransform = this.findComponentByType(node, "cc.UITransform");
    if (!uiTransform) {
      console.error(`No UITransform component found on node "${nodeName}".`);
      return false;
    }
    
    uiTransform._contentSize.width = width;
    uiTransform._contentSize.height = height;
    
    console.log(`Updated size of "${nodeName}" to ${width}x${height}`);
    return true;
  }

  /**
   * Update a button click handler
   * @param {string} nodeName - Name of the button node
   * @param {string} newHandler - New handler method name
   * @returns {boolean} Success status
   */
  updateButtonHandler(nodeName, newHandler) {
    const node = this.findNodeByName(nodeName);
    if (!node) {
      console.error(`Node "${nodeName}" not found.`);
      return false;
    }
    
    const buttonComp = this.findComponentByType(node, "cc.Button");
    if (!buttonComp) {
      console.error(`No Button component found on node "${nodeName}".`);
      return false;
    }
    
    if (!buttonComp.clickEvents || !buttonComp.clickEvents.length) {
      console.error(`No click events found on button "${nodeName}".`);
      return false;
    }
    
    for (let i = 0; i < buttonComp.clickEvents.length; i++) {
      const eventRef = buttonComp.clickEvents[i];
      const event = this.findNodeById(eventRef.__id__);
      if (event) {
        event.handler = newHandler;
      }
    }
    
    console.log(`Updated button handler on "${nodeName}" to "${newHandler}"`);
    return true;
  }
}

/**
 * Class for modifying Cocos Creator prefab files
 */
class CocosPrefabModifier {
  /**
   * Constructor
   * @param {string} filePath - Path to the prefab file
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
    this.load();
  }

  /**
   * Load the prefab file
   */
  load() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      this.data = JSON.parse(content);
      console.log(`Successfully loaded prefab: ${path.basename(this.filePath)}`);
    } catch (error) {
      console.error(`Error loading prefab: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save the modified prefab file
   * @param {string} outputPath - Optional path to save to (uses original path if not specified)
   */
  save(outputPath = null) {
    const savePath = outputPath || this.filePath;
    try {
      const content = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(savePath, content, 'utf8');
      console.log(`Successfully saved prefab to: ${savePath}`);
      return true;
    } catch (error) {
      console.error(`Error saving prefab: ${error.message}`);
      return false;
    }
  }

  /**
   * Find a node or component by ID
   * @param {number} id - ID of the item to find
   * @returns {Object|null} The found item or null
   */
  findById(id) {
    return this.data.find(item => item.__id__ === id);
  }

  /**
   * Update scale of the prefab's root node
   * @param {number} x - X scale
   * @param {number} y - Y scale
   * @param {number} z - Z scale
   * @returns {boolean} Success status
   */
  updateScale(x, y, z) {
    try {
      // Get the prefab object
      const prefab = this.data.find(item => item.__type__ === "cc.Prefab");
      if (!prefab) {
        console.error("Prefab root not found");
        return false;
      }
      
      // Find the root node from data reference
      const rootNodeId = prefab.data.__id__;
      const rootNode = this.findById(rootNodeId);
      
      if (!rootNode) {
        console.error("Root node not found");
        return false;
      }
      
      // Update scale
      rootNode._lscale.x = x;
      rootNode._lscale.y = y;
      rootNode._lscale.z = z;
      
      console.log(`Updated prefab scale to (${x}, ${y}, ${z})`);
      return true;
    } catch (error) {
      console.error(`Error updating prefab scale: ${error.message}`);
      return false;
    }
  }

  /**
   * Update material of a MeshRenderer component
   * @param {string} materialUuid - UUID of the new material
   * @returns {boolean} Success status
   */
  updateMaterial(materialUuid) {
    try {
      // Find the MeshRenderer component
      const meshRenderer = this.data.find(item => item.__type__ === "cc.MeshRenderer");
      
      if (!meshRenderer) {
        console.error("MeshRenderer component not found");
        return false;
      }
      
      // Update material UUID
      meshRenderer._materials[0].__uuid__ = materialUuid;
      
      console.log(`Updated material to UUID: ${materialUuid}`);
      return true;
    } catch (error) {
      console.error(`Error updating material: ${error.message}`);
      return false;
    }
  }
}

/**
 * Class for modifying Cocos Creator texture metadata files
 */
class CocosTextureMetaModifier {
  /**
   * Constructor
   * @param {string} filePath - Path to the texture meta file
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
    this.load();
  }

  /**
   * Load the texture meta file
   */
  load() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      this.data = JSON.parse(content);
      console.log(`Successfully loaded texture meta: ${path.basename(this.filePath)}`);
    } catch (error) {
      console.error(`Error loading texture meta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save the modified texture meta file
   * @param {string} outputPath - Optional path to save to (uses original path if not specified)
   */
  save(outputPath = null) {
    const savePath = outputPath || this.filePath;
    try {
      const content = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(savePath, content, 'utf8');
      console.log(`Successfully saved texture meta to: ${savePath}`);
      return true;
    } catch (error) {
      console.error(`Error saving texture meta: ${error.message}`);
      return false;
    }
  }

  /**
   * Update texture wrap mode
   * @param {string} wrapModeS - Horizontal wrap mode (e.g., "clamp-to-edge", "repeat")
   * @param {string} wrapModeT - Vertical wrap mode
   * @returns {boolean} Success status
   */
  updateWrapMode(wrapModeS, wrapModeT) {
    try {
      const texture = this.data.subMetas["6c48a"];
      
      if (!texture) {
        console.error("Texture data not found in meta file");
        return false;
      }
      
      texture.userData.wrapModeS = wrapModeS;
      texture.userData.wrapModeT = wrapModeT;
      
      console.log(`Updated texture wrap mode to S: ${wrapModeS}, T: ${wrapModeT}`);
      return true;
    } catch (error) {
      console.error(`Error updating wrap mode: ${error.message}`);
      return false;
    }
  }

  /**
   * Update sprite frame trim settings
   * @param {string} trimType - Trim type (e.g., "auto", "none")
   * @returns {boolean} Success status
   */
  updateTrimType(trimType) {
    try {
      const spriteFrame = this.data.subMetas["f9941"];
      
      if (!spriteFrame) {
        console.error("Sprite frame data not found in meta file");
        return false;
      }
      
      spriteFrame.userData.trimType = trimType;
      
      console.log(`Updated sprite frame trim type to: ${trimType}`);
      return true;
    } catch (error) {
      console.error(`Error updating trim type: ${error.message}`);
      return false;
    }
  }
}

/**
 * Example usage - demonstrates how to use the modifiers
 */
function exampleUsage() {
  try {
    // 1. Modify a scene
    console.log("\n--- MODIFYING SCENE ---");
    const sceneModifier = new CocosSceneModifier("assets/Scenes/Home.scene");
    
    // Update text
    sceneModifier.updateLabelText("Label-Test", "Welcome to My Game!");
    
    // Move button
    sceneModifier.updateNodePosition("Button - test", 0, -400, 0);
    
    // Resize sprite
    sceneModifier.updateNodeSize("Sprite-test", 250, 245);
    
    // Change button handler
    sceneModifier.updateButtonHandler("Button - test", "onButtonClicked");
    
    // Save changes
    sceneModifier.save("assets/Scenes/Home_modified.scene");
    
    // 2. Modify a prefab
    console.log("\n--- MODIFYING PREFAB ---");
    const prefabModifier = new CocosPrefabModifier("assets/Prefabs/Cube.prefab");
    
    // Change scale
    prefabModifier.updateScale(50, 50, 50);
    
    // Change material
    prefabModifier.updateMaterial("new-material-uuid-here");
    
    // Save changes
    prefabModifier.save("assets/Prefabs/Cube_modified.prefab");
    
    // 3. Modify a texture meta
    console.log("\n--- MODIFYING TEXTURE META ---");
    const textureModifier = new CocosTextureMetaModifier("assets/Arts/Textures/Commons/arrow-rotate-left_regular.png.meta");
    
    // Change wrap mode
    textureModifier.updateWrapMode("repeat", "repeat");
    
    // Change trim type
    textureModifier.updateTrimType("none");
    
    // Save changes
    textureModifier.save("assets/Arts/Textures/Commons/arrow-rotate-left_regular_modified.png.meta");
    
    console.log("\n--- ALL MODIFICATIONS COMPLETED ---");
  } catch (error) {
    console.error(`Example failed: ${error.message}`);
  }
}

/**
 * Execute requested modifications based on command-line arguments
 * This allows the script to be used both as a library and as a command-line tool
 * @param {Array} args - Command-line arguments
 */
function executeFromCommandLine(args) {
  // Basic command-line interface could be implemented here
  // For example: node cocos_creator_file_modifier.js --scene Home.scene --update-label "Label-Test" "New Text"
  console.log("Command-line usage not implemented in this example");
  console.log("Running example usage instead:");
  exampleUsage();
}

// If this script is run directly (not imported)
if (require.main === module) {
  executeFromCommandLine(process.argv.slice(2));
} else {
  // Export the classes for use as a library
  module.exports = {
    CocosSceneModifier,
    CocosPrefabModifier,
    CocosTextureMetaModifier
  };
} 