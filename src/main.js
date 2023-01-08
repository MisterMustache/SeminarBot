import { FirstPersonController } from "/common/engine/FirstPersonController.js";
import { Application } from '../common/engine/Application.js';
import { mat4, quat } from "../lib/gl-matrix-module.js";
import { pauseExport } from "/src/seminarbot.js";
import { AudioPlayer } from "./AudioPlayer.js";
import { GLTFLoader } from './GLTFLoader.js';
import { GUI } from "/lib/dat.gui.module.js";
import { Renderer } from './Renderer.js';
import { Physics } from "./Physics.js";
import { Door } from "./Door.js";
import { Item } from "./Item.js";
import { HUD } from "./HUD.js";

export class App extends Application {

    getEndCode() {
        let code = "";
        for (const item of this.items) {
            code += item.value;
        }
        return code;
    }

    async loadWorld() {
        this.loader = new GLTFLoader();

        // main world scene and camera
        await this.loader.load('/common/models/re_factory_2023-01-08_004/re_factory.gltf');
        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera');

        // get doors and items from main scene
        this.doors = Door.getDoorsFromScene(this.scene);
        this.items = Item.getItemsFromScene(this.scene);
        this.code = this.getEndCode();

        // lock and forbid doors with keywords in their name (forbidden, locked)
        for (const door of this.doors) {
            if (door.node.name.includes("locked")) {
                door.lock();
            }
            else if (door.node.name.includes("forbidden")) {
                door.forbid();
            }
        }
    }

    removeNodeFromScene(nodeName) {
        // skip the given node by name
        let nodes = [];
        for (const sceneNode of this.scene.nodes) {
            if (nodeName !== sceneNode.name) {
                nodes.push(sceneNode);
            }
        }
        this.scene.nodes = nodes;
        this.physics.scene.nodes = nodes;    // correct the physics scene
    }

    getFixedAABBs() {
        this.fixedAABBs = [];
        for (const node of this.scene.nodes) {
            if (node.name ==="Soba1.001" || node.name ==="Soba1.002") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-4, 2.5, 5.25], min: [-4.25, 0, -5.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4, 2.5, 5.25], min: [4.25, 0, -5.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 2.5, -5], min: [-4, 0, -5.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4, 2.5, -5], min: [0.45, 0, -5.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 2.5, 5.25], min: [-4, 0, 5]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4, 2.5, 5.25], min: [0.45, 0, 5]}));
            }
            else if (node.name ==="Soba1.003" || node.name ==="Soba1.004" || node.name ==="Soba1.005") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [5.25, 2.5, -4], min: [-5.25, 0, -4.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [5.25, 2.5, 4.25], min: [-5.25, 0, 4]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-5, 2.5, -0.45], min: [-5.25, 0, -4]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-5, 2.5, 4], min: [-5.25, 0, 0.45]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [5.25, 2.5, -0.45], min: [5, 0, -4]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [5.25, 2.5, 4], min: [5, 0, 0.45]}));
            }
            else if (node.name === "Hala1.001") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [18.25, -4, -12], min: [-18.25, -7, -12.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [18.25, -4, 12.25], min: [-18.25, -7, 12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-18, -4, -6.45], min: [-18.25, -7, -12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-18, -4, 5.55], min: [-18.25, -7, -5.55]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-18, -4, 12], min: [-18.25, -7, 6.45]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [18.25, -4, -0.45], min: [18, -7, -12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [18.25, -4, 12], min: [18, -7, 0.45]}));
            }
            else if (node.name === "Hala1.002" || node.name === "Hala1.003") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-12, -4, 18.25], min: [-12.25, -7, -18.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12.25, -4, 18.25], min: [12, -7, -18.25]}));
                if (node.name === "Hala1.002") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, -4, 18.25], min: [-12, -7, 18]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, -4, 18.25], min: [0.45, -7, 18]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6.45, -4, -18], min: [-12, -7, -18.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [5.55, -4, -18], min: [-5.55, -7, -18.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, -4, -18], min: [6.45, -7, -18.25]}));
                }
                if (node.name === "Hala1.003") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, -4, -18], min: [-12, -7, -18.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, -4, -18], min: [0.45, -7, -18.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6.45, -4, 18.25], min: [-12, -7, 18]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [5.55, -4, 18.25], min: [-5.55, -7, 18]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, -4, 18.25], min: [6.45, -7, 18]}));
                }
            }
            else if (node.name.includes("Soba6")) {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6.25, 1.25, -6], min: [6.25, -1.25, -6.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6, 1.25,-6], min: [-6.25, -1.25, -6]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 6], min: [6, -1.25, -6]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, 6.25], min: [-6, -1.25, 6]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6, 1.25, 6.25], min: [0.45, -1.25, 6]}));
            }
            else if (node.name === "Hodnik2.001") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, -8], min: [-2.25, -1.25, -8.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 8.25], min: [-2.25, -1.25, 8]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, -6.45], min: [-2.25, -1.25, -8]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 8], min: [-2.25, -1.25, -5.55]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 5.55], min: [2, -1.25, -8]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 8], min: [2, -1.25, 6.45]}));
            }
            else if (node.name === "Hodnik1.001") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, -12], min: [-2.25, -1.25, -12.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, 12.25], min: [-2, -1.25, 12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [0.45, 1.25, 12.25], min: [2, -1.25, 12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, -9.45], min: [-2.25, -1.25, -12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, -0.9], min: [-2.25, -1.25, -8.55]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 7.55], min: [-2.25, -1.25, 0]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 12], min: [-2.25, -1.25, 8.45]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, -10.45], min: [2, -1.25, -12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 5.45], min: [2, -1.25, -9.55]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 12], min: [2, -1.25, 6.55]}));
            }
            else if (node.name === "Hodnik1.002") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [0.05, 1.25, -2], min: [-12.25, -1.25, -2.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, 1.25, -2], min: [0.95, -1.25, -2.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-10.45, 1.25, 2.25], min: [-12.25, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [5.55, 1.25, 2.25], min: [-9.55, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, 1.25, 2.25], min: [6.45, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-12, 1.25, 2], min: [-12.25, -1.25, -2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12.25, 1.25, -0.45], min: [12, -1.25, -2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12.25, 1.25, 2], min: [12, -1.25, 0.45]}));
            }
            else if (node.name === "Hodnik1.003") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6.45, 1.25, -2], min: [-12.25, -1.25, -2.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.05, 1.25, -2], min: [-5.55, -1.25, -2.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, 1.25, -2], min: [6.95, -1.25, -2.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-4.95, 1.25, 2.25], min: [-12.25, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [9.5, 1.25, 2.25], min: [-4.05, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12, 1.25, 2.25], min: [10.4, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-12, 1.25, -0.45], min: [-12.25, -1.25, -2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-12, 1.25, 2], min: [-12.25, -1.25, 0.45]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [12.25, 1.25, 2], min: [12, -1.25, -2]}));
            }
            else if (node.name === "Hodnik1.004") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 12.25], min: [-2.25, -1.25, -12.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 12.25], min: [2, -1.25, -12.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, -12], min: [-2, -1.25, -12.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2, 1.25, -12], min: [0.45, -1.25, -12.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, 12.25], min: [-2, -1.25, 12]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2, 1.25, 12.25], min: [0.45, -1.25, 12]}));
            }
            else if (node.name === "Soba4.001" || node.name === "Soba4.004" || node.name === "Soba4.005") {
                if (node.name === "Soba4.001" || node.name === "Soba4.004") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-4, 1.25, -0.45], min: [-4.25, -1.25, -2]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-4, 1.25, 2], min: [-4.25, -1.25, 0.45]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4.25, 1.25, 2], min: [4, -1.25, -2]}));
                    if (node.name === "Soba4.001") {
                        this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, -2], min: [-4.25, -1.25, -2.25]}));
                        this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4.25, 1.25, -2], min: [0.45, -1.25, -2.25]}));
                        this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, 2.25], min: [-4.25, -1.25, 2]}));
                        this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4.25, 1.25, 2.25], min: [0.45, -1.25, 2]}));
                    }
                }
                if (node.name === "Soba4.004" || node.name === "Soba4.005") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, 2.25], min: [-4.25, -1.25, 2]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4.25, 1.25, 2.25], min: [0.45, -1.25, 2]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4.25, 1.25, -2], min: [-4.25, -1.25, -2.25]}));
                    if (node.name === "Soba4.005") {
                        this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-4, 1.25, 2], min: [-4.25, -1.25, -2]}));
                        this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4.25, 1.25, -0.45], min: [4, -1.25, -2]}));
                        this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [4.25, 1.25, 2], min: [4, -1.25, 0.45]}));
                    }
                }
            }
            else if (node.name === "Soba4.002" || node.name === "Soba4.003") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 4], min: [-2.25, -1.25, -4]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, -0.45], min: [2, -1.25, -4]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 4], min: [2, -1.25, 0.45]}));
                if (node.name === "Soba4.002") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, -4], min: [-2.25, -1.25, -4.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, -4], min: [0.45, -1.25, -4.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 4.25], min: [-2.25, -1.25, 4]}));
                }
                if (node.name === "Soba4.003") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, -4], min: [-2.25, -1.25, -4.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, 4.25], min: [-2.25, -1.25, 4]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 4.25], min: [0.45, -1.25, 4]}));
                }
            }
            else if (node.name === "Soba3.001" || node.name === "Soba3.002") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6, 1.25, -0.45], min: [-6.25, -1.25, -6]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6, 1.25, 6], min: [-6.25, -1.25, 0.45]}));
                if (node.name === "Soba3.001") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, -6], min: [-6.25, -1.25, -6.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2, 1.25, 6.25], min: [-6.25, -1.25, 6]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [3.55, 1.25, -2], min: [1.75, -1.25, -2.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, -2], min: [4.45, -1.25, -2.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 6], min: [2, -1.25, -2.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, -2], min: [6, -1.25, -6]}));
                }
                if (node.name === "Soba3.002") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2, 1.25, -6], min: [-6.25, -1.25, -6.25]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 6.25], min: [-6.25, -1.25, 6]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [3.55, 1.25, 2.25], min: [1.75, -1.25, 2]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 2.25], min: [4.45, -1.25, 2]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 2], min: [2, -1.25, -6]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 6], min: [6, -1.25, 2.25]}));
                }
            }
            else if (node.name === "Soba3.003" || node.name === "Soba3.004") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-0.45, 1.25, -6], min: [-6.25, -1.25, -6.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, -6], min: [0.45, -1.25, -6.25]}));
                if (node.name === "Soba3.003") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 6.25], min: [-6.25, -1.25, 6]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 2], min: [-2.25, -1.25, 1.75]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6, 1.25, 6], min: [-6.25, -1.25, -6]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 3.55], min: [-2.25, -1.25, 1.75]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-2, 1.25, 6], min: [-2.25, -1.25, 4.45]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 1.75], min: [6, -1.25, -6]}));
                }
                if (node.name === "Soba3.004") {
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 6.25], min: [2, -1.25, 6]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 2], min: [-6.25, -1.25, 1.75]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6, 1.25, 1.75], min: [-6.25, -1.25, -6]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 3.55], min: [2, -1.25, 1.75]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [2.25, 1.25, 6], min: [2, -1.25, 4.45]}));
                    this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 6], min: [6, -1.25, -6]}));
                }
            }
            else if (node.name === "Soba3.005") {
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, -6], min: [-2, -1.25, -6.25]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-4.45, 1.25, 2.25], min: [-6.25, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-1.75, 1.25, 2.25], min: [-3.55, -1.25, 2]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 6.25], min: [-6.25, -1.25, 6]}));

                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-6, 1.25, 2.25], min: [-6.25, -1.25, 6]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [-1.75, 1.25, 2.25], min: [-2, -1.25, -6]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, -0.45], min: [6, -1.25, -6]}));
                this.fixedAABBs.push(Physics.getTransformedAABB(node.globalMatrix, { max: [6.25, 1.25, 6], min: [6, -1.25, 0.45]}));
            }
        }
    }

    async start() {
        await this.loadWorld();     // loads every gltf model

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        // self-explanatory, you win the game if you collide with it
        const winningGlobalMatrix = mat4.fromRotationTranslationScale(mat4.create(), quat.create(),[155.5, 0, 65], [1, 1, 1]);
        this.winningAABB = { max: [0.5, 2.5, 0.5], min: [-0.5, 0, -0.5]};                  // local
        this.winningAABB = Physics.getTransformedAABB(winningGlobalMatrix, this.winningAABB);   // global

        // stationary collision AABBs for every room (excluding items)
        this.getFixedAABBs();

        // dt variables
        this.time = performance.now();
        this.startTime = this.time;

        // movement and collision detection
        this.controller = new FirstPersonController(this.camera, this.canvas, this.doors, this.items);
        this.physics = new Physics(this.scene, this.controller, this.fixedAABBs, this.doors, this.items);
        this.HUD = new HUD();

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
    }

    validateCode() {
        if (this.code === this.HUD.inputCode.value) {
            // unlock all doors
            for (const door of this.doors) {
                door.unlock();
            }
            document.getElementById("closeCodePopup").click();  // close the popup
        }
        else {
            this.HUD.inputCode.classList.add("error");
        }
    }

    update() {
        // this cannot be in the if statement, because then the player would be teleported when resuming again (df is a much bigger num then)
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if (!pauseExport.value) {
            this.controller.update(dt);
            this.physics.update();
            this.HUD.staminaPercentage((this.controller.sprintDuration / this.controller.sprintDurationMax) * 100);
            if (Physics.checkCollision(this.controller.node, this.winningAABB, 0.25).collision) {
                // game won
                document.getElementById("endgameDiv").style.display = "block";
                new AudioPlayer("/common/sounds/win.mp3").play();
                console.log("YOU WON THE GAME");
                this.controller.removeFocus();
                this.finished = true;
            }
        }
        else {
            this.controller.time = performance.now();  // needs to be refreshed, so the stamina bar works properly (relies on time)
        }
    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateMatrix();
        }
    }
}

const canvas = document.getElementById('gameCanvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

/*
const gui = new GUI();
const general = gui.addFolder('General');
general.open();
general.add(app.controller, 'pointerSensitivity', 0.0001, 0.01);
general.add(app.physics, 'collisionRadius', 0, 4)
const interaction = gui.addFolder('Interaction');
interaction.open();
interaction.add(app.controller, 'distanceToDoorAABB', 0, 10);
interaction.add(app.controller, 'distanceToItemAABB', 0, 10);
const movement = gui.addFolder('Movement');
movement.open();
movement.add(app.controller, 'maxSpeed', 0, 100);
movement.add(app.controller, 'decay', 0, 1);
movement.add(app.controller, 'acceleration', 1, 100);
movement.add(app.controller, 'sprintDurationMax', 1000, 30000);
movement.add(app.controller, 'sprintToWalkRatio', 0.01, 10);
movement.add(app.controller, 'staminaRecoveryFactor', 0.01, 1);
movement.add(app.controller, 'sprintTimeout', 0, 10000)
gui.close();
*/

export function removeNodeFromScene(node) {
    app.removeNodeFromScene(node);
}

export function addToInventory(item) {
    switch (item.node.name) {
        case "Listic.001":
            app.HUD.slot1Value(item.value); break;
        case "Listic.002":
            app.HUD.slot2Value(item.value); break;
        case "Listic.003":
            app.HUD.slot3Value(item.value); break;
        case "Listic.004":
            app.HUD.slot4Value(item.value);
    }
}

export function codeInputPopup() {
    app.HUD.codeInputPopup();
    app.controller.removeFocus();
}

export function validateCode() {
    app.validateCode();
}

export function regainFocus() {
    this.controller.regainFocus();
}
