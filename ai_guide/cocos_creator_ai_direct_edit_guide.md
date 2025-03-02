# Cocos Creator Direct File Editing Guide for AI

## 1. Introduction

This guide explains how AI can directly edit Cocos Creator project files without requiring the editor. It provides detailed information on file structures, relationships, and safe modification approaches.

## 2. File Relationship Analysis

### 2.1 Core File Relationships

In Cocos Creator projects, files are interconnected through UUIDs and references:

- **Scene Files (.scene)**: Define the scene hierarchy and component relationships
- **Meta Files (.meta)**: Contain UUIDs and import settings for each asset
- **Prefab Files (.prefab)**: Reusable object templates referenced in scenes
- **Texture Files**: Images used in UI elements with metadata defining their properties

### 2.2 Reference System

Cocos Creator uses several reference mechanisms:

1. **UUID References**: Assets reference each other via UUIDs stored in .meta files
   ```json
   "__uuid__": "889dfd56-760a-4734-8c05-af7429e3e88e@f9941"
   ```

2. **ID References**: Within a scene/prefab, elements reference each other via numeric IDs
   ```json
   "node": {"__id__": 15}
   ```

3. **Component References**: Components attached to nodes are linked via the "_components" array
   ```json
   "_components": [{"__id__": 16}, {"__id__": 17}]
   ```

## 3. Safely Modifying Files

### 3.1 Scene Files (.scene)

Scene files are JSON structures with node hierarchies and components. Safe modifications include:

#### Node Position, Rotation, Scale

```json
"_lpos": {
  "__type__": "cc.Vec3",
  "x": 0,
  "y": -572.809,
  "z": 0
}
```

To modify:
1. Locate the target node by name (`"_name": "Button - test"`)
2. Update the `_lpos`, `_lrot`, or `_lscale` properties
3. Update the `_euler` property if changing rotation

#### Component Properties

```json
"_string": "this is the test home"
```

To modify:
1. Identify the component type (e.g., `"__type__": "cc.Label"`)
2. Update specific properties like `_string`, `_fontSize`, etc.
3. Ensure type consistency (numbers for numeric values, strings for text)

#### Node Active State

```json
"_active": true
```

To modify:
1. Find the node by name
2. Toggle the `_active` value between `true` and `false`

### 3.2 Prefab Files (.prefab)

Prefab files follow a similar structure to scene files but represent standalone objects:

```json
{
  "__type__": "cc.Prefab",
  "_name": "Cube",
  "data": {"__id__": 1},
  // ...
}
```

Safe modifications include:
1. Component properties (e.g., materials, mesh references)
2. Transform properties (position, rotation, scale)
3. Visibility and active state

### 3.3 Texture Metadata (.png.meta)

Texture metadata defines how images are processed:

```json
"f9941": {
  "importer": "sprite-frame",
  "uuid": "889dfd56-760a-4734-8c05-af7429e3e88e@f9941",
  // ...
  "userData": {
    "trimType": "auto",
    "width": 185,
    "height": 181,
    // ...
  }
}
```

Safe modifications include:
1. Sprite frame properties (trim settings, borders)
2. Texture properties (wrap modes, filters)
3. Import settings (mip-mapping, compression)

## 4. Common Modification Patterns

### 4.1 UI Element Repositioning

To move a UI element:

```json
// Original position
"_lpos": {
  "__type__": "cc.Vec3",
  "x": 0,
  "y": -572.809,
  "z": 0
}

// Modified position
"_lpos": {
  "__type__": "cc.Vec3",
  "x": 0,
  "y": -600,
  "z": 0
}
```

### 4.2 Changing Text Content

To update text in a Label component:

```json
// Original
"_string": "this is the test home"

// Modified
"_string": "Welcome to the Home Screen"
```

### 4.3 Modifying Button Click Events

To add or change a button's click event:

```json
"clickEvents": [
  {
    "__type__": "cc.ClickEvent",
    "target": {"__id__": 29},
    "component": "",
    "_componentId": "7be4edEMP9G4o2PKnJZVUkm",
    "handler": "onTouch_Test",
    "customEventData": ""
  }
]
```

### 4.4 Changing Sprite Images

To change a sprite's image:

```json
"_spriteFrame": {
  "__uuid__": "889dfd56-760a-4734-8c05-af7429e3e88e@f9941",
  "__expectedType__": "cc.SpriteFrame"
}
```

Replace the UUID with the target sprite frame's UUID.

## 5. High-Risk Modifications

The following modifications carry higher risk and should be approached with caution:

1. **Adding new nodes**: Requires generating valid IDs and maintaining references
2. **Removing nodes**: May break references throughout the scene
3. **Changing UUIDs**: Will break asset references
4. **Modifying hierarchy**: Can affect layout and rendering order

## 6. Practical AI Modification Workflow

When modifying files as an AI:

1. **Analyze Request**: Understand what the user wants to change
2. **Locate Targets**: Find the relevant files and sections to modify
3. **Plan Changes**: Identify specific properties to update
4. **Apply Changes**: Make precise edits maintaining JSON structure
5. **Verify Integrity**: Ensure all references remain valid
6. **Document Changes**: Explain what was modified and how

## 7. Example: Updating a Home Scene

Let's say a user wants to:
- Change the label text
- Move the button up
- Make the sprite larger

### Step-by-Step Approach:

1. **Find the label node**: Look for `"_name": "Label-Test"`
2. **Update text**: Change the `"_string"` property in its Label component
3. **Find the button**: Look for `"_name": "Button - test"`
4. **Update position**: Modify its `"_lpos"` property
5. **Find the sprite**: Look for `"_name": "Sprite-test"`
6. **Update scale**: Modify its `"_lscale"` property or UITransform's `"_contentSize"`

## 8. Conclusion

Direct file editing is powerful but requires careful attention to file structure and references. By following this guide, AI can safely modify Cocos Creator projects without requiring the editor.

Remember to:
- Preserve UUID references
- Maintain ID integrity within scenes
- Ensure type consistency for all properties
- Document changes thoroughly for user reference 