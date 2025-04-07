import { _decorator, Component, Node, SkeletalAnimation, MeshRenderer, Material, Color, Texture2D, UIMeshRenderer } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Character model class that holds references to all character parts and components
 */
@ccclass('CharacterModel')
export class CharacterModel extends Component {
    @property(SkeletalAnimation)
    public skeletalAnimation: SkeletalAnimation = null;

    // Top clothing mesh
    @property(MeshRenderer)
    public topClothMesh: MeshRenderer = null;

    // Bottom clothing mesh
    @property(MeshRenderer)
    public bottomClothMesh: MeshRenderer = null;

    // Bottom clothing mesh
    @property(MeshRenderer)
    public shoesMesh: MeshRenderer = null;

    // Eyes mesh
    @property(MeshRenderer)
    public eyesMesh: MeshRenderer = null;

    // Face mesh
    @property(MeshRenderer)
    public faceMesh: MeshRenderer = null;

    // Hair mesh
    @property(MeshRenderer)
    public hairMesh: MeshRenderer = null;

    // Hand mesh
    @property(MeshRenderer)
    public handMesh: MeshRenderer = null;

    // Leg mesh
    @property(MeshRenderer)
    public legMesh: MeshRenderer = null;

    /**
     * Initialize the character model
     */
    public init(): void {
        // Validate that all required components are present
        if (!this.skeletalAnimation) {
            console.error('SkeletalAnimation component is missing on CharacterModel');
        }
    }

    public getMaterialOfSkin(): Material[] {
        const materials: Material[] = [];

        const faceMaterial = this.faceMesh.material;
        if (!faceMaterial) {
            console.error('Material is missing on faceMesh');
        } else {
            materials.push(faceMaterial);
        }

        const handMaterial = this.handMesh.material;
        if (!handMaterial) {
            console.error('Material is missing on handMesh');
        } else {
            materials.push(handMaterial);
        }

        const legMaterial = this.legMesh.material;
        if (!legMaterial) {
            console.error('Material is missing on legMesh');
        } else {
            materials.push(legMaterial);
        }

        return materials;
    }

    public setSkinColor(color: Color): void {
        const materials = this.getMaterialOfSkin();
        materials.forEach(material => {
            material.setProperty('mainColor', color);
        });
    }

    public setEyeSprite(sprite: Texture2D): void {
        const eyeMaterial = this.eyesMesh.getMaterialInstance(0);
        eyeMaterial.setProperty('albedoMap', sprite);
    }

    public setUIMesh(layer: number){
        this.getAllMeshes().forEach(mesh => {
            mesh.node.addComponent(UIMeshRenderer);
            mesh.node.layer = layer;
        });
    }

    /**
     * Get all mesh renderers for the character
     * @returns Array of all mesh renderers
     */
    public getAllMeshes(): MeshRenderer[] {
        return [
            this.topClothMesh,
            this.bottomClothMesh,
            this.shoesMesh,
            this.eyesMesh,
            this.faceMesh,
            this.hairMesh,
            this.handMesh,
            this.legMesh
        ].filter(mesh => mesh !== null);
    }
}
