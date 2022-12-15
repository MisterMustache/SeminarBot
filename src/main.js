import { FirstPersonController } from "/common/engine/FirstPersonController.js";
import { Application } from '../common/engine/Application.js';
import { GUI } from "../lib/dat.gui.module.js";
import { GLTFLoader } from './GLTFLoader.js';
import { Renderer } from './Renderer.js';
import { Physics } from "./Physics.js";

class App extends Application {

    async start() {
        this.loader = new GLTFLoader();
        await this.loader.load('../common/models/basic-box/basic-box-v2.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera_Orientation');

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        // dt variables
        this.time = performance.now();
        this.startTime = this.time;

        this.controller = new FirstPersonController(this.camera, this.canvas);
        this.physics = new Physics(this.scene, this.controller);

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
    }


    update() {
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        // this.controller.update(dt);
        this.physics.update(dt);
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

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app.controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(app.controller, 'maxSpeed', 0, 10);
gui.add(app.controller, 'decay', 0, 1);
gui.add(app.controller, 'acceleration', 1, 100);
