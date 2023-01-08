import { vec3 } from "../lib/gl-matrix-module.js";

export class Physics {

    constructor(scene, controller, fixedAABBs, doors) {
        this.scene = scene;
        this.controller = controller;
        this.fixedAABBs = fixedAABBs;   // every AABB that is static and used for actual collision
        this.doors = doors;
        this.collisionRadius = 0.3;
    }

    static intersectDistance(sphere, box) {
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

    static checkCollision(sphere, aabb, radius) {
        // returns boolean and the distance
        const sphereCoords = sphere.translation;
        const distance = Physics.intersectDistance(sphereCoords, aabb);
        return { collision: distance <= radius, distance: distance };
    }

    static resolveCollision(sphere, aabb, radius) {
        const { collision, distance } = Physics.checkCollision(sphere, aabb, radius)

        // if there is no collision (distance from the closest point is smaller than radius)
        if (!collision) {
            return;
        }

        // how much the sphere penetrates the AABB
        let sphereCoords = sphere.translation;
        const penetrationDepth = radius - distance;

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

    update() {
        // check camera sphere against every other AABB
        for (const aabb of this.fixedAABBs) {
            Physics.resolveCollision(this.controller.node, aabb, this.collisionRadius)
        }
        for (const door of this.doors) {
            Physics.resolveCollision(this.controller.node, door.globalCollisionAABB, this.collisionRadius)
        }
    }

    static getTransformedAABB(transform, aabb) {
        // Transform all vertices of the AABB from local to global space.
        const { min, max } = aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, transform));

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newMin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newMax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newMin, max: newMax };
    };
}
