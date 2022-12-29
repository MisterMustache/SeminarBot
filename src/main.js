import { FirstPersonController } from "/common/engine/FirstPersonController.js";
import { Application } from '../common/engine/Application.js';
import { GLTFLoader } from './GLTFLoader.js';
import { GUI } from "/lib/dat.gui.module.js";
import { Renderer } from './Renderer.js';
import { pause } from "/src/seminarbot.js";
import { Physics } from "./Physics.js";

export class App extends Application {

    async start() {
        this.loader = new GLTFLoader();
        await this.loader.load('../common/models/svet/seminar-bot-svet.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera_Orientation');

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        // only left wall for now
        this.aabbs = [{
            max: [-4, 2.5, 5],
            min: [-4.086603, 0, -5],
        }];

        // dt variables
        this.time = performance.now();
        this.startTime = this.time;

        this.controller = new FirstPersonController(this.camera, this.canvas);
        this.physics = new Physics(this.scene, this.controller, this.aabbs);

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
    }

    update() {
        // this cannot be in the if statement, because then the player would be teleported when resuming again (df is a much bigger num then)
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if (!pause) {
            this.controller.update(dt);
            this.physics.update(dt);
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
gui.add(app.controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(app.controller, 'maxSpeed', 0, 10);
gui.add(app.controller, 'decay', 0, 1);
gui.add(app.controller, 'acceleration', 1, 100);
