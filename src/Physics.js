// import {vec3} from '../lib/gl-matrix-module.js';

export class Physics {

    constructor(scene, controller, aabbs) {
        this.scene = scene;
        this.controller = controller;
        this.aabbs = aabbs;
        this.radius = 0.3;
    }

    update() {
        if (this.controller.velocity !== undefined) {
            // check camera sphere against every other AABB
            for (const aabb of this.aabbs) {
                this.resolveCollision(this.controller.node, aabb)
            }
        }
    }

    intersectDistance(sphere, box) {
        // get the closest point (of the box) to sphere center by clamping
        const x = Math.max(box.min[0], Math.min(sphere[0], box.max[0]));
        const y = Math.max(box.min[1], Math.min(sphere[1], box.max[1]));
        const z = Math.max(box.min[2], Math.min(sphere[2], box.max[2]));

        // this is the same as isPointInsideSphere
        return Math.sqrt(
            (x - sphere[0]) * (x - sphere[0]) +
            (y - sphere[1]) * (y - sphere[1]) +
            (z - sphere[2]) * (z - sphere[2])
        );
    }

    resolveCollision(sphere, aabb) {
        const sphereCoords = sphere.translation;
        const distance = this.intersectDistance(sphereCoords, aabb);

        // if there is no collision (distance from the closest point is smaller than radius)
        if (distance > this.radius) {
            return;
        }

        // how much the sphere penetrates the AABB
        const penetrationDepth = this.radius - distance;

        // update translation vector by moving a tiny amount away from the collision box
        for (let i = 0; i < 3; i++) {
            if (sphereCoords[i] < aabb.min[i]) {
                sphereCoords[i] -= penetrationDepth;
            }
            else if (sphereCoords[i] > aabb.max[i]) {
                sphereCoords[i] += penetrationDepth;
            }
        }
        sphere.translation = sphereCoords;
    }
}
