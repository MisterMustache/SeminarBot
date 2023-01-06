import { escapePressedOnceExport, inFocusExport } from "../../src/seminarbot.js";
import { addToInventory, removeNodeFromScene } from "../../src/main.js";
import { quat, vec3 } from '../../lib/gl-matrix-module.js';
import { AudioPlayer } from "../../src/AudioPlayer.js";
import { Physics } from "../../src/Physics.js";

export class FirstPersonController {

    constructor(node, domElement, doors, items) {
        // general
        this.node = node;
        this.domElement = domElement;
        this.doors = doors;
        this.items = items;

        // current state
        this.keys = {};
        this.time = 0;      // gets refreshed in every update call

        // looking around
        this.pitch = 0;
        this.yaw = 0;
        this.pointerSensitivity = 0.002;

        // interaction radius (how close you need to be, to register an interaction)
        this.distanceToDoorAABB = 1;
        this.distanceToItemAABB = 0.5;

        // movement speed
        this.velocity = [0, 0, 0];
        this.acceleration = 20;
        this.maxSpeed = 5;              // absolute max speed while sprinting
        this.sprintToWalkRatio = 0.6;
        this.allowedSpeed = this.maxSpeed * this.sprintToWalkRatio;  // relative speed (if walking or running)
        this.decay = 0.996;
        this.startedSprinting = false;
        this.sprintDurationMax = 5000;  // max sprint time in milliseconds, before needing to slow down
        this.sprintDuration = this.sprintDurationMax;  // actual sprint time in ms (can change based on 'tiredness')
        this.staminaRecoveryFactor = 0.15;  // how fast stamina is recovered (0.1 means 10x slower compared to losing it)
        this.actualRecoveryFactor = this.staminaRecoveryFactor;     // changes if user is standing still or walking
        this.sprintTimeout = 3000;      // time in ms that needs to pass in order to be able to run again (after depleting all stamina)
        this.sprintTimeoutAt = 0;       // stores time, when the timeout happened
        this.sprintTimeoutActive = false;

        // audio
        this.footstepWalkingSound = new AudioPlayer("/common/sounds/footstep2.mp3");
        this.footstepSprintingSound = new AudioPlayer("/common/sounds/footstep.mp3");
        this.footstepWalkingSound.volume(20);
        this.footstepSprintingSound.volume(30);

        this.initHandlers();
    }

    regainFocus() {
        inFocusExport.value = true;
        this.domElement.requestPointerLock();
    }

    removeFocus() {
        inFocusExport.value = false;
        document.exitPointerLock();
    }

    initHandlers() {
        const resumeButton = document.getElementById('resumeButton');

        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        // event for the escape key being pressed
        const escapeKeyEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: 'Escape'
        });

        doc.addEventListener('pointermove', this.pointermoveHandler);
        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        element.addEventListener('click', _ =>  {
            resumeButton.click();   // would be the same as clicking the resume button
        });

        doc.addEventListener('pointerlockchange', _ => {
            if (doc.pointerLockElement === element) {
                doc.addEventListener('pointermove', this.pointermoveHandler);
            } else {
                this.domElement.ownerDocument.removeEventListener('pointermove', this.pointermoveHandler);
                if (inFocusExport.value) {
                    document.dispatchEvent(escapeKeyEvent);     // simulate pressing escape key again to get pause menu
                    escapePressedOnceExport.value = true;       // correct this variable, if game was in focus
                }
            }
        });
    }

    update(dt) {
        const timeNow = performance.now();

        // Calculate forward and right vectors.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const forward = [-sin, 0, -cos];
        const right = [cos, 0, -sin];

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if (inFocusExport.value) {
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
        }

        // Update velocity based on acceleration.
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // If there is no user input on WASD, apply decay
        if (!inFocusExport.value || (!this.keys['KeyW'] && !this.keys['KeyS'] && !this.keys['KeyD'] && !this.keys['KeyA'])) {
            const decay = Math.exp(dt * Math.log(1 - this.decay));
            vec3.scale(this.velocity, this.velocity, decay);
            this.actualRecoveryFactor = this.staminaRecoveryFactor * 5;
        }
        else {
            this.actualRecoveryFactor = this.staminaRecoveryFactor;
            // sprinting functionality
            if (this.keys['ShiftLeft']) {
                if (!this.startedSprinting) {
                    this.allowedSpeed = this.maxSpeed;
                    this.startedSprinting = true;
                    this.time = timeNow;
                }
                else {
                    if (this.sprintDuration <= 0) {
                        this.allowedSpeed = this.maxSpeed * this.sprintToWalkRatio;
                        this.sprintDuration = 0;
                        this.sprintTimeoutAt = timeNow;
                        if (!this.sprintTimeoutActive) {
                            this.sprintTimeoutActive = true;
                        }
                    }
                    else {
                        this.sprintDuration -= (timeNow - this.time);
                    }
                }
                // sound based on sprintDuration (if stamina runs out, then it's normal footstep sound)
                if (this.sprintDuration > 0) {
                    this.footstepSprintingSound.play();
                }
                else {
                    this.footstepWalkingSound.play();
                }
            }
            else {
                this.footstepWalkingSound.play();
            }
        }

        // if stop sprinting
        if (!this.keys['ShiftLeft']) {
            // if stopped right after sprinting (only gets executed once)
            if (this.startedSprinting) {
                this.allowedSpeed = this.maxSpeed * this.sprintToWalkRatio;
                this.startedSprinting = false;
            }
            // if there is no timeout, then regenerate stamina, else wait "this.staminaTimeout" of ms
            if (!this.sprintTimeoutActive || timeNow - this.sprintTimeoutAt >= this.sprintTimeout) {
                this.sprintDuration += (timeNow - this.time) * this.actualRecoveryFactor;
                if (this.sprintDuration > this.sprintDurationMax) {
                    this.sprintDuration = this.sprintDurationMax;
                }
                this.sprintTimeoutActive = false;
            }
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

        this.time = timeNow;
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

        // door and item interaction
        if (this.keys['KeyE'] && inFocusExport.value) {
            for (const door of this.doors) {
                if (Physics.checkCollision(this.node, door.globalInteractionAABB, this.distanceToDoorAABB).collision) {
                    door.changeDoorState();
                }
            }
            for (const item of this.items) {
                if (!item.pickedUp && Physics.checkCollision(this.node, item.globalInteractionAABB, this.distanceToItemAABB).collision) {
                    removeNodeFromScene(item.node.name);    // it doesn't get rendered anymore (removed from main scene)
                    item.pickup();
                    addToInventory(item);
                    console.log("picked up " + item.node.name);
                }
            }
        }
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }
}
