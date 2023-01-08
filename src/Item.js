import { AudioPlayer } from "./AudioPlayer.js";
import { Physics } from "./Physics.js";

// used only for detecting if player is near the item
const localInteractionAABB = {
    max: [0.30, 10, 0.30],
    min: [-0.30, -5, -0.30]
};

export class Item {
    constructor(node) {
        this.node = node;
        this.pickedUp = false;
        this.value = Math.floor(Math.random() * 10);

        this.globalInteractionAABB = Physics.getTransformedAABB(this.node.globalMatrix, localInteractionAABB);
        this.pickupSound = new AudioPlayer("/common/sounds/pickup_note.mp3");
        this.pickupSound.volume(40);
    }

    pickup() {
        if (!this.pickedUp) {
            this.pickedUp = true;
            this.pickupSound.play();
        }
    }

    static getItemsFromScene(scene) {    // returns a simple list of Item objects
        let items = [];
        for (const node of scene.nodes) {
            if (node.name.includes("Listic")) {
                items.push(new Item(node));
            }
        }
        return items;
    }
}