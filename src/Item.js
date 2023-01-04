import { AudioPlayer } from "./AudioPlayer.js";
import { Physics } from "./Physics.js";

// used only for detecting if player is near the item
const localInteractionAABB = {
    max: [0.25, 24.67, 0.25],
    min: [-0.25, -0.33, 0.25]
};

export class Item {
    constructor(node) {
        this.node = node;
        this.pickedUp = false;

        this.globalInteractionAABB = Physics.getTransformedAABB(this.node, localInteractionAABB);
        this.pickupSound = new AudioPlayer("/common/sounds/pickup_note.mp3");
        this.pickupSound.volume(40);
    }

    pickup() {
        if (!this.pickedUp) {
            this.pickedUp = true;
            this.pickupSound.play();
        }
    }

    static createItemsFromScene(scene) {    // returns a simple list of Item objects
        let items = [];
        for (const node of scene.nodes) {
            items.push(new Item(node));
        }
        return items;
    }
}