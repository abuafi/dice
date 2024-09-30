import * as THREE from 'three';

export class Item {
    body = undefined;
    mesh = undefined;
    world;
    
    constructor(body = undefined, mesh = undefined) {
        this.body = body
        this.mesh = mesh
    }

    register(world) {
        this.world = world

        world.items.push(this)
        if (this.body) {
            world.physicsUniverse.addRigidBody( this.body );
        }
        if (this.mesh) {
            world.scene.add( this.mesh );
        }
    }

    physicsUpdate() {
        if (!this.body || !this.mesh) return;
        let motionState = this.body.getMotionState();
        if (motionState)
        {
            let transform = new Ammo.btTransform();
            motionState.getWorldTransform( transform );
            let new_pos = transform.getOrigin();
            let new_qua = transform.getRotation();
            this.mesh.position.set( new_pos.x(), new_pos.y(), new_pos.z() );
            this.mesh.quaternion.set( new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w() );
        }
    }

    dispose() {
        this.disposeMesh()
        // TODO disposeBody
    }

    // Adapted from: https://stackoverflow.com/a/68004442
    disposeMesh() {
        let mesh = this.mesh
        if (!mesh || !(mesh instanceof THREE.Object3D)) return false;
    
        // for better memory management and performance
        if (mesh.geometry) mesh.geometry.dispose();
    
        if (mesh.material) {
            if (mesh.material instanceof Array) {
                // for better memory management and performance
                mesh.material.forEach(material => material.dispose());
            } else {
                // for better memory management and performance
                mesh.material.dispose();
            }
        }
        mesh.removeFromParent(); // the parent might be the scene or another Object3D, but it is sure to be removed this way
        return true;
    }
    


}