import { vec3, quat } from "/lib/gl-matrix-module.js";
import { AudioPlayer } from "./AudioPlayer.js";
import { Physics } from "./Physics.js";

// used only for detecting a players presence to open doors
const localInteractionAABB = {
    max: [1, 1.05, 2],
    min: [-1, -1.05, -2]
};

// used only for collision, and it changes from closed to open state
const localCollisionAABB = {
    max: [0.9, 1.05, 0.086603],
    min: [-0.9, -1.05, -0.086603]
};

export class Door {
    constructor(node) {
        this.node = node;
        this.opened = false;
        this.angle = 160;

        this.globalInteractionAABB = Physics.getTransformedAABB(this.node, localInteractionAABB);
        this.activeCollisionAABB = Physics.getTransformedAABB(this.node, localCollisionAABB);

        this.closeDoorSound = new AudioPlayer("/common/sounds/door_close.mp3");
        this.openDoorSound = new AudioPlayer("/common/sounds/door_open.mp3");
        this.closeDoorSound.volume(50);
        this.openDoorSound.volume(50);
    }

    changeDoorState() {
        // if opened close the door and play the closing sound
        if (this.opened) {
            this.node.rotation = quat.rotateY(quat.create(), this.node.rotation, -this.angle * (Math.PI / 180));
            this.node.translation = vec3.add(vec3.create(), this.node.translation, [-0.87, 0, -0.21]);
            this.openDoorSound.stop();
            this.closeDoorSound.play();
        }
        // else open the door and play the opening sound
        else {
            this.node.rotation = quat.rotateY(quat.create(), this.node.rotation, this.angle * (Math.PI / 180));
            this.node.translation = vec3.add(vec3.create(), this.node.translation, [0.87, 0, 0.21]);
            this.closeDoorSound.stop();
            this.openDoorSound.play();
        }

        this.opened = !this.opened;
        this.node.updateTransformationMatrix();
        this.activeCollisionAABB = Physics.getTransformedAABB(this.node, localCollisionAABB);   // change collision box
    }

    static createDoorsFromScene(scene) {    // simple list of Door objects, that have multiple AABB and current state
        let doors = [];
        for (const node of scene.nodes) {
            doors.push(new Door(node));
        }
        return doors;
    }
}
