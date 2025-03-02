# Cocos Creator AI Guide

## 1. Purpose of This Guide

This guide helps AI assistants understand Cocos Creator project structures and user requirements. It provides information on:
- How to interpret different file types in a Cocos Creator project
- How to make appropriate modifications to project files
- Best practices for AI when working with Cocos Creator projects

## 2. Cocos Creator Project Structure

### 2.1 Key File Types

#### Scene Files (.scene, .scene.meta)
- **Purpose:** Define the structure of a game scene, including hierarchy, components, and properties
- **Format:** JSON (.scene) and metadata JSON (.scene.meta)
- **Key Elements:**
  - **Nodes:** Hierarchical objects with transform properties (_lpos, _lrot, _lscale)
  - **Components:** Attached to nodes (cc.Camera, cc.UITransform, custom scripts)
  - **UUIDs:** Unique identifiers linking assets and components
  - **Metadata:** Version and importer details

#### Script Files (.ts, .ts.meta)
- **Purpose:** TypeScript code controlling node behaviors, attached as components
- **Format:** TypeScript (.ts) and metadata JSON (.meta)
- **Key Elements:**
  - **Script Class:** Typically extends cc.Component with lifecycle methods (onLoad, start)
  - **Event Handlers:** Custom methods like onTouch_Test
  - **Metadata:** Links the script to the project via UUID

#### Prefab Files (.prefab, .prefab.meta)
- **Purpose:** Defines reusable game objects
- **Format:** JSON (.prefab) and metadata JSON (.prefab.meta)
- **Key Elements:**
  - **Node Structure:** Standalone object definition with properties
  - **Components:** Specific to the prefab (e.g., cc.MeshRenderer)
  - **Metadata:** Includes sync data and UUID references

#### Texture Files (.png, .png.meta)
- **Purpose:** Provides images for sprites or UI elements
- **Format:** Image file (.png) and metadata JSON (.meta)
- **Key Elements:**
  - **Image:** The raw texture file
  - **Metadata:** Defines processing parameters (sprite frame settings, dimensions)

## 3. Understanding User Requirements

When a user requests modifications to a Cocos Creator project, AI should:

1. **Identify the target file type(s)** (scene, script, prefab, texture)
2. **Understand the modification scope:**
   - UI changes (positioning, scaling, visibility)
   - Logic modifications (script behavior, event handling)
   - Asset updates (textures, models, audio)
   - Component property adjustments
3. **Recognize technical constraints:**
   - UUID references must be maintained
   - Node hierarchies must remain valid
   - Type safety in scripts must be preserved

## 4. Modification Guidelines

### 4.1 Scene and Prefab Files (JSON)

- **Structure:** Arrays of objects with __type__ defining their class
- **Common Modifications:**
  - **Change Node Properties:**
    ```json
    // To move a node named "Canvas" to position (600, 1000, 0):
    "_lpos": {
      "__type__": "cc.Vec3",
      "x": 600,
      "y": 1000,
      "z": 0
    }
    ```
  - **Add a Component:**
    ```json
    // Adding a Sprite component:
    {
      "__type__": "cc.Sprite",
      "_name": "",
      "_objFlags": 0,
      "node": {"__id__": 15},
      "_enabled": true,
      "_spriteFrame": {"__uuid__": "some-uuid@f9941", "__expectedType__": "cc.SpriteFrame"},
      "_id": "new-unique-id"
    }
    ```
  - **Remove a Component:**
    - Remove component's __id__ from node's _components array
    - Delete the component object if no longer referenced
  - **Update Component Properties:**
    ```json
    // Change a Label component's text:
    "_string": "Hello World"
    ```

### 4.2 Script Files (TypeScript)

- **Structure:** TypeScript class typically extending cc.Component
- **Common Modifications:**
  - **Add a Method:**
    ```typescript
    resetGame() {
        console.log("Game reset");
    }
    ```
  - **Modify Logic:**
    ```typescript
    onTouch_Test() {
        console.log("Button clicked!");
    }
    ```
  - **Ensure component linking** between scripts and scene/prefab files

### 4.3 Texture Metadata Files (JSON)

- **Structure:** Metadata with subMetas defining texture and sprite frame settings
- **Common Modifications:**
  - **Update Sprite Frame Settings:**
    ```json
    // Resize a sprite frame:
    "width": 200,
    "height": 200
    ```
  - **Change Wrap Mode:**
    ```json
    "wrapModeS": "repeat",
    "wrapModeT": "repeat"
    ```

## 5. UUID Management

- **Purpose:** UUIDs link assets across files in the project
- **Guidelines:**
  - **Preserve existing UUIDs** unless replacing an asset
  - **Generate new UUIDs** for new assets using a UUID generator
  - **Update all references** to ensure they point to valid UUIDs

## 6. Practical Examples

### Example 1: Repositioning a UI Button
```json
// Target: Node with "_name": "Button - test"
// Change: Move to (0, -600, 0)
"_lpos": {
  "__type__": "cc.Vec3",
  "x": 0,
  "y": -600,
  "z": 0
}
```

### Example 2: Adding a Click Event
```json
// Target: cc.Button component
// Change: Add a new click event handler
"clickEvents": [
  {"__id__": 28},
  {
    "__type__": "cc.ClickEvent",
    "target": {"__id__": 29},
    "component": "",
    "_componentId": "7be4edEMP9G4o2PKnJZVUkm",
    "handler": "resetGame",
    "customEventData": ""
  }
]
```

### Example 3: Resizing a 3D Object
```json
// Target: Node with "_name": "Cube"
// Change: Scale to (50, 50, 50)
"_lscale": {
  "__type__": "cc.Vec3",
  "x": 50,
  "y": 50,
  "z": 50
}
```

## 7. Best Practices for AI

1. **Parse files correctly:**
   - Use JSON parsing for scene/prefab files
   - Use text parsing for scripts
   
2. **Validate changes:**
   - Ensure values are valid (e.g., numbers for positions)
   - Verify UUID references are maintained

3. **Approach complex changes systematically:**
   - Break down changes into manageable steps
   - Identify all affected files before modification

4. **Communicate clearly with users:**
   - Explain what modifications are being made
   - Highlight potential issues or conflicts
   - Provide options when multiple approaches exist

5. **Request specific information** when user requirements are ambiguous:
   - Exact node names to modify
   - Precise values for properties
   - Clarification on component types
   - Expected behavior details

By following this guide, AI can better understand Cocos Creator projects and accurately implement user-requested modifications. 