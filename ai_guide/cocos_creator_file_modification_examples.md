# Cocos Creator File Modification Examples

This document provides concrete examples of how AI can directly modify different types of Cocos Creator files without using the editor. These examples are based on analysis of real project files.

## 1. Scene File Modifications

Using the `Home.scene` file as reference:

### 1.1 Modifying UI Text

To change the text displayed in the "Label-Test" node:

```json
// Original
"_string": "this is the test home"

// Modified
"_string": "Welcome to My Game!"
```

**Implementation Approach:**
1. Parse the scene file as JSON
2. Find the Label component by traversing the JSON structure
   - Look for node with `"_name": "Label-Test"` 
   - Then find its Label component (`"__type__": "cc.Label"`)
3. Update the `_string` property
4. Serialize back to JSON with proper formatting

### 1.2 Repositioning UI Elements

To move the button to a different position:

```json
// Original
"_lpos": {
  "__type__": "cc.Vec3",
  "x": 0,
  "y": -572.809,
  "z": 0
}

// Modified
"_lpos": {
  "__type__": "cc.Vec3",
  "x": 0,
  "y": -400,
  "z": 0
}
```

**Implementation Approach:**
1. Find the node with `"_name": "Button - test"`
2. Update its `_lpos` property
3. Ensure the data types remain consistent (numbers, not strings)

### 1.3 Changing Image Size

To resize the "Sprite-test" node:

```json
// Original
"_contentSize": {
  "__type__": "cc.Size",
  "width": 185,
  "height": 181
}

// Modified
"_contentSize": {
  "__type__": "cc.Size",
  "width": 250,
  "height": 245
}
```

**Implementation Approach:**
1. Find the node with `"_name": "Sprite-test"`
2. Locate its UITransform component (`"__type__": "cc.UITransform"`)
3. Update the `_contentSize` property

### 1.4 Changing Button Labels

To update the button text:

```json
// Original
"_string": "button"

// Modified
"_string": "Click Me!"
```

**Implementation Approach:**
1. Find the node with `"_name": "Button - test"`
2. Find its child node with `"_name": "Label"`
3. Update the Label component's `_string` property

### 1.5 Modifying Button Click Events

To change the button's click handler:

```json
// Original
"handler": "onTouch_Test"

// Modified
"handler": "newButtonHandler"
```

**Implementation Approach:**
1. Find the Button component for the button node
2. Update the handler property in the clickEvents array

## 2. Prefab File Modifications

Using the `Cube.prefab` file as reference:

### 2.1 Changing Prefab Scale

To modify the scale of the Cube prefab:

```json
// Original
"_lscale": {
  "__type__": "cc.Vec3",
  "x": 100,
  "y": 100,
  "z": 100
}

// Modified
"_lscale": {
  "__type__": "cc.Vec3",
  "x": 50,
  "y": 50,
  "z": 50
}
```

**Implementation Approach:**
1. Find the root node in the prefab
2. Update its `_lscale` property

### 2.2 Changing Prefab Material

To change the material used by the Cube prefab:

```json
// Original
"_materials": [
  {
    "__uuid__": "620b6bf3-0369-4560-837f-2a2c00b73c26",
    "__expectedType__": "cc.Material"
  }
]

// Modified
"_materials": [
  {
    "__uuid__": "[NEW-MATERIAL-UUID]",
    "__expectedType__": "cc.Material"
  }
]
```

**Implementation Approach:**
1. Find the MeshRenderer component in the prefab
2. Update the UUID in the `_materials` array
3. The new UUID must reference an existing material in the project

## 3. Texture Metadata Modifications

Using the `arrow-rotate-left_regular.png.meta` file as reference:

### 3.1 Changing Texture Wrap Mode

To change how the texture wraps:

```json
// Original
"wrapModeS": "clamp-to-edge",
"wrapModeT": "clamp-to-edge"

// Modified
"wrapModeS": "repeat",
"wrapModeT": "repeat"
```

**Implementation Approach:**
1. Find the texture settings in the metadata file
2. Update the wrapMode properties

### 3.2 Adjusting Sprite Frame Trim

To change how the sprite is trimmed:

```json
// Original
"trimType": "auto"

// Modified
"trimType": "none"
```

**Implementation Approach:**
1. Find the sprite frame settings in the metadata file
2. Update the trimType property

## 4. Programmatic Approach for AI

When an AI needs to modify Cocos Creator files, it should follow these steps:

1. **Parse the file**:
   ```javascript
   const sceneData = JSON.parse(sceneFileContent);
   ```

2. **Find target nodes/components through traversal**:
   ```javascript
   function findNodeByName(nodes, name) {
     for (const node of nodes) {
       if (node._name === name) return node;
       if (node._children) {
         const found = findNodeByName(node._children, name);
         if (found) return found;
       }
     }
     return null;
   }
   
   const buttonNode = findNodeByName(sceneData._children, "Button - test");
   ```

3. **Modify the required properties**:
   ```javascript
   // Moving a button
   buttonNode._lpos.y = -400;
   
   // Changing text
   const labelComp = buttonNode._components.find(comp => comp.__type__ === "cc.Label");
   if (labelComp) labelComp._string = "New Text";
   ```

4. **Write back with proper formatting**:
   ```javascript
   const updatedContent = JSON.stringify(sceneData, null, 2);
   // Save updatedContent back to the file
   ```

## 5. Safe Modification Guidelines

To ensure modifications don't break the project:

1. **Never modify UUIDs** unless you're replacing them with valid, existing UUIDs
2. **Maintain ID references** within the scene to preserve relationships between nodes
3. **Preserve data types** (don't change a number to a string or vice versa)
4. **Keep required properties** (don't delete mandatory fields)
5. **Validate numeric values** are appropriate (e.g., rotation values within expected ranges)

## 6. Example AI Workflow for a User Request

When a user requests: "Make the button bigger and move it up"

```javascript
// Example pseudocode for AI implementation
function modifyHomeScene(sceneContent, modifications) {
  // Parse the scene file
  const scene = JSON.parse(sceneContent);
  
  // Find the button node
  const buttonNode = findNodeByPath(scene, ["Canvas", "Button - test"]);
  
  // Find the UITransform component
  const transform = buttonNode._components.find(c => c.__type__ === "cc.UITransform");
  
  // Modify position (move up)
  buttonNode._lpos.y += 100; // Move up by 100 units
  
  // Modify size (make bigger)
  transform._contentSize.width *= 1.5; // 50% wider
  transform._contentSize.height *= 1.5; // 50% taller
  
  // Return modified content
  return JSON.stringify(scene, null, 2);
}
```

By following these examples and approaches, AI can safely modify Cocos Creator files directly, without requiring the editor. 