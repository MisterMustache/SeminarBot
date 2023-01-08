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
        await this.loader.load('/common/models/re_factory_2023-01-08_002/re_factory.gltf');
        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera');

        await this.loader.load('/common/models/item/seminar-bot-item.gltf');
        this.items = await this.loader.loadScene(this.loader.defaultScene);
        this.scene.combineScenes(this.items);
        this.items = Item.createItemsFromScene(this.items);

        this.doors = Door.getDoorsFromScene(this.scene);
        this.code = this.getEndCode();
        console.log("end code: " + this.code);

        // testing
        this.doors[0].forbid();
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

    async start() {
        await this.loadWorld();     // loads every gltf model

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        // self-explanatory, you win the game if you collide with it
        const winningGlobalMatrix = mat4.fromRotationTranslationScale(mat4.create(), quat.create(),[-3.55, 1.25, 4.5], [1, 1, 1]);
        this.winningAABB = { max: [0.25, 1.25, 0.25], min: [-0.25, -1.25, -0.25]};              // local
        this.winningAABB = Physics.getTransformedAABB(winningGlobalMatrix, this.winningAABB);   // global

        // list of every fixed AABB for collision (Axis-Aligned Bounding Box)
        this.fixedAABBs = [{ max: [-4, 2.5, 5.086603], min: [-4.086603, 0, -5.086603]},     // Left wall
                      { max: [4.086603, 2.5, 5.086603], min: [4, 0, -5.086603]},            // Right wall
                      { max: [-0.45, 2.5, -5], min: [-4, 0, -5.086603]},    // Front-Left wall
                      { max: [4, 2.5, -5], min: [0.45, 0, -5.086603]},      // Front-Right wall
                      { max: [-0.45, 2.5, 5.086603], min: [-4, 0, 5]},      // Back-Left wall
                      { max: [4, 2.5, 5.086603], min: [0.45, 0, 5]}];       // Back-Right wall

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

        console.log("Loaded nodes:")
        for(const node of this.scene.nodes) {
            console.log(node.name)
        }
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

export function removeNodeFromScene(node) {
    app.removeNodeFromScene(node);
}

export function addToInventory(item) {
    switch (item.node.name) {
        case "Item1":
            app.HUD.slot1Value(item.value); break;
        case "Item2":
            app.HUD.slot2Value(item.value); break;
        case "Item3":
            app.HUD.slot3Value(item.value); break;
        case "Item4":
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
