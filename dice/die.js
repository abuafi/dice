import * as THREE from 'three';
import { Item } from './item.js';

const UP = new THREE.Vector3(0, 1, 0)
const XAXIS = new THREE.Vector3(1, 0, 0)
const ONES = new THREE.Vector3(1, 1, 1)

function fix(n) {
    n = n.toFixed(2)
    if (n == 0) return 0
    else return n
}
/**
 * @abstract
 */
export class Die extends Item {
    geom = new THREE.BufferGeometry();
    shape;
    scale;
    texture;
    mass;
    vertices = new Array();
    faces = new Array();
    sides = new Array();

    constructor(scale = 1, mass = 1, position = new THREE.Vector3(0, 0, 0)) {
        super()
        this.mass = mass
        this.scale = scale
        this.setGeom()
        this.setVertices()
        this.setFaces()
        this.setTexture()
        this.setMesh()
        this.setSides()

        this.setShape()
        this.setBody(position)
    }

    numSides() { throw new Error('Not implemented') }
    setGeom() { throw new Error('Not implemented') }
    setTexture() { throw new Error('Not implemented') }
    setSides() { throw new Error('Not implemented') }

    setVertices() {
        let vbuff = this.geom.attributes.position.array
        for (let i = 0; i < vbuff.length; i += 3)
            this.vertices.push([vbuff[i], vbuff[i+1], vbuff[i+2]])
    }

    setFaces() {
        let ibuff = this.geom.getIndex()
        if (!ibuff) {
            let indices = Array()
            for (let i = 0; i < this.vertices.length; i++) indices.push(i)
            this.geom.setIndex(new THREE.Uint16BufferAttribute(indices, 1))
            ibuff = this.geom.getIndex()
        } 
        ibuff = ibuff.array
        let trisPerFace = ibuff.length / this.numSides() / 3
        for (let i = 0; i < ibuff.length; i += trisPerFace * 3) {
            let face = new Set()
            for (let j = i; j < i+(trisPerFace * 3); j++) {
                face.add(ibuff[j])
            }
            this.faces.push(face)
        }
    }

    setMesh() {
        let material = new THREE.MeshPhongMaterial({ map: this.texture });
        this.mesh = new THREE.Mesh(this.geom, material)
    }

    setShape() {
        this.shape = new Ammo.btConvexHullShape()
        var vmap = {}
        for (let vertex of this.vertices) {
            if (!vmap[vertex]) {
                this.shape.addPoint(new Ammo.btVector3(...vertex))
                vmap[vertex] = true
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

    physicsUpdate() {
        super.physicsUpdate()
        // TODO
        for (let side of this.sides) {
            side.updateDebugAxes()
        }

        if (!this.body.isActive()) {
            return
        }

        let velAmmo = this.body.getLinearVelocity()
        let velArray = [velAmmo.x(), velAmmo.y(), velAmmo.z()]
        let velVect = new THREE.Vector3(...velArray)

        let upSide = this.checkUpSides()
        if (velVect.length() <= 0.01 && upSide) {
            console.log(upSide.value, this.numSides())
            this.body.forceActivationState(5)
        }
    }

    checkUpSides() {
        let _ = new THREE.Vector3()
        let up = new THREE.Vector3()
        for (let side of this.sides) {
            let isUp = side.isUp(_, up)
            if (isUp)
                return side
        }
        return undefined
    }

    drawDebugAxes() {
        for (let side of this.sides) {
            side.setDebugAxes(this.world)
        }
    }

    faceVertices(i) {
        let faceVertices = Array()
        let face = this.faces[i]
        for (let idx of face) {
            faceVertices.push(this.vertices[idx])
        }
        return faceVertices
    }
}

export class DieSide {
    center = new THREE.Vector3()
    top = new THREE.Vector3()
    value = 0
    axes = new THREE.AxesHelper()
    die = undefined

    transform = new THREE.Matrix4()

    constructor(center, top, die) {
        this.center = center
        this.top = top
        this.die = die
        this.axes.matrixAutoUpdate = false;
    }

    isUp(_, up) {
        let mesh = this.die.mesh
        let tempMatrix = new THREE.Matrix4().identity()

        tempMatrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(mesh.quaternion))
        tempMatrix.multiply(this.transform)

        tempMatrix.extractBasis(_, up, _)
        let upDist = up.sub(UP).length()
        if (upDist <= 0.05) 
            return true
        else return false
    }

    initTransform() {
        let yAxis = new THREE.Vector3().copy(this.center).normalize()
        let xAxis = new THREE.Vector3().subVectors(this.top, this.center).normalize()
        let zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize()

        this.center.multiplyScalar(1.1)
        this.transform.identity().makeBasis(xAxis, yAxis, zAxis)
    }

    updateDebugAxes() {
        let mesh = this.die.mesh
        this.axes.matrix.identity()

        // this.axes.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(mesh.quaternion))
        // this.axes.applyMatrix4(this.transform)
        this.axes.applyMatrix4(this.transform)
        this.axes.applyMatrix4(new THREE.Matrix4().makeTranslation(this.center))
        this.axes.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(mesh.quaternion))
        this.axes.applyMatrix4(new THREE.Matrix4().makeTranslation(mesh.position))
    }

    setDebugAxes(world) {
        world.scene.add( this.axes );
    }
}
