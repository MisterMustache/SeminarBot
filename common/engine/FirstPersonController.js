import { pause, escapePressedOnceExport } from "../../src/seminarbot.js";
import { quat, vec3 } from '../../lib/gl-matrix-module.js';
import { removeNodeFromScene } from "../../src/main.js";
import { Physics } from "../../src/Physics.js";

export class FirstPersonController {

    constructor(node, domElement, doors, items) {
        this.node = node;
        this.domElement = domElement;

        this.inFocus = false;
        this.keys = {};

        this.doors = doors;
        this.items = items;

        this.pitch = 0;
        this.yaw = 0;
        this.velocity = [0, 0, 0];
        this.acceleration = 20;
        this.maxSpeed = 5;                  // absolute max speed while sprinting
        this.allowedSpeed = this.maxSpeed * 0.7;  // relative speed (if walking or running)
        this.decay = 0.996;
        this.pointerSensitivity = 0.002;

        this.initHandlers();
    }

    initHandlers() {
        const resumeButton = document.getElementById('resumeButton');

        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        // event for the escape key being pressed
        const escapeKey = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: 'Escape'
        });

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        element.addEventListener('click', _ =>  {
            element.requestPointerLock();
            this.inFocus = true;
        });

        doc.addEventListener('pointerlockchange', _ => {
            if (doc.pointerLockElement === element) {
                doc.addEventListener('pointermove', this.pointermoveHandler);
                resumeButton.click();   // would be the same as clicking the resume button
                this.inFocus = false;
            } else {
                doc.removeEventListener('pointermove', this.pointermoveHandler);
                document.dispatchEvent(escapeKey);  // simulate pressing escape key again to get pause menu
                escapePressedOnceExport.value = true;           // correct this variable, if game was in focus
                this.inFocus = false;
            }
        });
    }

    update(dt) {
        // Calculate forward and right vectors.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const forward = [-sin, 0, -cos];
        const right = [cos, 0, -sin];

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
        }
        if (this.keys['ShiftLeft']) {
            this.allowedSpeed = this.maxSpeed;
        }
        else {
            this.allowedSpeed = this.maxSpeed * 0.6;
        }

        // Update velocity based on acceleration.
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // If there is no user input, apply decay.
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
        {
            const decay = Math.exp(dt * Math.log(1 - this.decay));
            vec3.scale(this.velocity, this.velocity, decay);
        }

        // Limit speed to prevent accelerating to infinity and beyond.
        const speed = vec3.length(this.velocity);
        if (speed > this.allowedSpeed) {
            vec3.scale(this.velocity, this.velocity, this.allowedSpeed / speed);
        }

        // Update translation based on velocity.
        this.node.translation = vec3.scaleAndAdd(vec3.create(),
            this.node.translation, this.velocity, dt);

        // Update rotation based on the Euler angles.
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;
    }

    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;
        this.pitch -= dy * this.pointerSensitivity;
        this.yaw   -= dx * this.pointerSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        // Limit pitch so that the camera does not invert on itself.
        if (this.pitch > halfpi) {
            this.pitch = halfpi;
        }
        if (this.pitch < -halfpi) {
            this.pitch = -halfpi;
        }

        // Constrain yaw to the range [0, pi * 2]
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    keydownHandler(e) {
        this.keys[e.code] = true;

        // only gets requested once after getting from paused state (either by clicking or pressing any button)
        if (!this.inFocus && !pause) {
            this.domElement.requestPointerLock();
            this.inFocus = true;
        }

        if (this.keys['KeyE']) {
            for (const door of this.doors) {
                if (Physics.checkCollision(this.node, door.globalInteractionAABB, 1).collision) {
                    console.log(door.node.name + " opened: " + door.opened)
                    door.changeDoorState();
                }
            }
            for (const item of this.items) {
                if (!item.pickedUp && Physics.checkCollision(this.node, item.globalInteractionAABB, 0.5).collision) {
                    console.log("picked up " + item.node.name);
                    removeNodeFromScene(item.node.name);
                    item.pickedUp = true;
                }
            }
        }
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }
}
