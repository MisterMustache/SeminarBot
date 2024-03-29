import { vec3, quat } from "/lib/gl-matrix-module.js";
import { AudioPlayer } from "./AudioPlayer.js";
import { codeInputPopup } from "./main.js";
import { Physics } from "./Physics.js";

export class Door {
    constructor(node) {
        this.node = node;
        this.unlocked = true;
        this.opened = false;
        this.right = true;          // if true it opens to the right, if not then left

        // all nodes are normalized, thus we don't have the rotation matrix, so we acknowledge rotation by name
        this.isRotated = !!this.node.name.includes("rotated");
        this.isBroken = !!this.node.name.includes("broken");

        this.forbidden = false;     // if true, then the door is stationary forever
        this.forbiddenPopup = document.getElementById("forbiddenPopup");

        this.localInteractionAABB = {
            max: [0.5, 1.05, 0.5],
            min: [-0.5, -1.05, -0.5]
        };
        this.localCollisionAABB = {
            max: [0.45, 2.1, 0.025],
            min: [-0.45, 0, -0.025]
        };

        // offsetting the door by half it's length and rotating if necessary (gltf got broken a bit)
        let offset = this.isBroken ? -0.45 : 0.45;
        if (this.isRotated) {
            this.node.rotation = quat.rotateY(quat.create(), this.node.rotation, 90 * (Math.PI / 180));
            this.node.translation = vec3.add(vec3.create(), this.node.translation, [0, 0, offset]);   // z-axis offset
        }
        else {
            this.node.translation = vec3.add(vec3.create(), this.node.translation, [-offset, 0, 0]);   // x-axis offset
        }
        this.node.updateTransformationMatrix();

        this.updateBehaviour();
        this.updateGlobalAABB();

        // audio
        this.closeDoorSound = new AudioPlayer("/common/sounds/door_close.mp3");
        this.openDoorSound = new AudioPlayer("/common/sounds/door_open.mp3");
        this.closeDoorSound.volume(50);
        this.openDoorSound.volume(50);
    }

    updateBehaviour() {
        // how the door moves (if door isn't rotated or is rotated by 90 degrees in the beginning)
        this.angle = 160;
        if (!this.isRotated) {     // door is not rotated
            this.movementVector = [0.9, 0, 0.21];
            if (!this.right) {
                this.movementVector[0] = -this.movementVector[0];
                this.angle = -this.angle;
            }
        }
        else {
            this.movementVector = [0.21, 0, -0.9];
            if (!this.right) {
                this.movementVector[2] = -this.movementVector[2];
                this.angle = -this.angle;
            }
        }
    }

    updateGlobalAABB() {
        this.globalInteractionAABB = Physics.getTransformedAABB(this.node.globalMatrix, this.localInteractionAABB);
        this.globalCollisionAABB = Physics.getTransformedAABB(this.node.globalMatrix, this.localCollisionAABB);
    }

    changeDoorState() {
        console.log(this.node.name)
        if (!this.forbidden) {
            if (this.unlocked) {
                // if opened close the door and play the closing sound
                if (this.opened) {
                    this.node.rotation = quat.rotateY(quat.create(), this.node.rotation, -this.angle * (Math.PI / 180));
                    this.node.translation = vec3.add(vec3.create(), this.node.translation, vec3.negate(vec3.create(), this.movementVector));
                    this.openDoorSound.stop();
                    this.closeDoorSound.play();
                }
                // else open the door and play the opening sound
                else {
                    this.node.rotation = quat.rotateY(quat.create(), this.node.rotation, this.angle * (Math.PI / 180));
                    this.node.translation = vec3.add(vec3.create(), this.node.translation, this.movementVector);
                    this.closeDoorSound.stop();
                    this.openDoorSound.play();
                }

                this.opened = !this.opened;
                this.node.updateTransformationMatrix();
                this.globalCollisionAABB = Physics.getTransformedAABB(this.node.globalMatrix, this.localCollisionAABB);   // change collision box
            } else {
                codeInputPopup();     // gets a popup
            }
        }
        else {
            // display popup that says "You are forbidden to enter" and disappears after a couple of seconds
            this.forbiddenPopup.style.display = "block";
            setTimeout(() => {
                this.forbiddenPopup.style.display = "none";
            }, 2000);
        }
    }

    unlock() {
        this.unlocked = true;
    }

    lock() {
        this.unlocked = false;
    }

    forbid() {
        this.forbidden = true;
    }

    volume(percent) {
        this.closeDoorSound.volume(percent);
        this.openDoorSound.volume(percent);
    }

    static getDoorsFromScene(scene) {    // simple list of Door objects, that have multiple AABB and current state
        let doors = [];
        for (const node of scene.nodes) {
            if (node.name.includes("Vrata")) {
                doors.push(new Door(node));
            }
        }
        return doors;
    }

    static makeDualDoor(leftDoor, rightDoor) {
        rightDoor.volume(0);        // we don't need 2 door sounds, one will suffice
        leftDoor.right = false;     // opens to the left now
        leftDoor.updateBehaviour();

        // update localInteractionAABB
        leftDoor.localInteractionAABB = {
            max: [1.4, 1.05, 0.5],
            min: [-0.5, -1.05, -0.5]
        }
        rightDoor.localInteractionAABB = {
            max: [0.5, 1.05, 0.5],
            min: [-1.4, -1.05, -0.5]
        }

        // update global AABB
        leftDoor.updateGlobalAABB();
        rightDoor.updateGlobalAABB();
    }
}
