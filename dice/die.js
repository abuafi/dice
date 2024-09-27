import * as THREE from 'three';

/**
 * @abstract
 */
export class Die {
    geom;
    mesh;
    shape;
    scale;
    texture;
    body;
    mass;

    constructor(world, scale = 1, mass = 1, position = new THREE.Vector3(0, 0, 0)) {
        this.mass = mass
        this.scale = scale
        this.setTexture()
        this.setGeom()
        this.setMesh()
        this.setShape()
        this.setBody(position)
        if (world !== undefined) {
            world.register(this)
        }
    }

    setGeom() { throw new Error('Not implemented') }
    setTexture() { throw new Error('Not implemented') }

    setMesh() {
        let material = new THREE.MeshPhongMaterial({ map: this.texture });
        this.mesh = new THREE.Mesh(this.geom, material)
    }

    setShape() {
        this.shape = new Ammo.btConvexHullShape()
        var vertices = this.geom.attributes.position.array
        var vmap = {}
        for (let i = 0; i < vertices.length; i+=3) {
            let xyz = [vertices[i], vertices[i+1], vertices[i+2]]
            if (!vmap[xyz]) {
                this.shape.addPoint(new Ammo.btVector3(...xyz))
                vmap[xyz] = true
            }
        }
    }

    setBody(position) {
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( position.x, position.y, position.z ) );
        let defaultMotionState = new Ammo.btDefaultMotionState( transform );

        let localInertia = new Ammo.btVector3( 0, 0, 0 );
        this.shape.calculateLocalInertia( this.mass, localInertia );

        let bodyInfo = new Ammo.btRigidBodyConstructionInfo( this.mass, defaultMotionState, this.shape, localInertia );
        this.body = new Ammo.btRigidBody( bodyInfo );
    }

}