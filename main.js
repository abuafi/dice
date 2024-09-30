import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { D6 } from './dice/d6.js';
import { D20 } from './dice/d20.js';
import { World } from './dice/world.js';
import { D12 } from './dice/d12.js';
import { Item } from './dice/item.js'

/* Physics objects */
const pi = Math.PI
function deg2rad (angle) {
    return angle * (Math.PI / 180);
}

function boxGeometryShape(width, height, depth) {
    // ------ Graphics Universe - Three.JS ------
    let geometry = new THREE.BoxGeometry(width, height, depth);
    let uvbuf = Array()
    for (let i = 0; i < 6; i++) {
        let xa = i*(1/6);
        let xb = (i+1)*(1/6);
        uvbuf.push(xa, 1)
        uvbuf.push(xb, 1)
        uvbuf.push(xa, 0)
        uvbuf.push(xb, 0)
    }
    uvbuf = new Float32Array(uvbuf);
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvbuf, 2))

    // ------ Physics Universe - Ammo.js ------
    let shape = new Ammo.btBoxShape( new Ammo.btVector3(width*0.5, height*0.5, depth*0.5) );

    return [geometry, shape]
}

function createFloor() {
    // ------ Physics Universe - Ammo.js ------
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3(0, -5, 0) );
    let defaultMotionState = new Ammo.btDefaultMotionState( transform );

    let structColShape = new Ammo.btBoxShape( new Ammo.btVector3( 20, 0.1, 20 ) );

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo(0, defaultMotionState, structColShape);
    let RBody = new Ammo.btRigidBody( RBody_Info );

    return new Item(RBody)
}

function createDrawer() {
    let mass = 100

    let drawerComponents = [
        [...boxGeometryShape(10, 0.2, 10), new THREE.Vector3(0, 0, 0), new THREE.Euler(0, 0, 0)],
        [...boxGeometryShape(10.4, 1, 0.2), new THREE.Vector3(0, 0.7, 5), new THREE.Euler(pi/8, 0, 0)],
        [...boxGeometryShape(10.4, 1, 0.2), new THREE.Vector3(0, 0.7, -5), new THREE.Euler(-pi/8, 0, 0)],
        [...boxGeometryShape(0.2, 1, 10.4), new THREE.Vector3(5, 0.7, 0), new THREE.Euler(0, 0, -pi/8)],
        [...boxGeometryShape(0.2, 1, 10.4), new THREE.Vector3(-5, 0.7, 0), new THREE.Euler(0, 0, pi/8)]
    ]

    let compoundShape = new Ammo.btCompoundShape()
    
    let geometries = Array()
    for (let [geometry, shape, translate, euler] of drawerComponents) {
        let quaternion = new THREE.Quaternion()
        quaternion = quaternion.setFromEuler(euler)

        geometry.applyQuaternion(quaternion)
        geometry = geometry.translate(translate)
       
        geometries.push(geometry)

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3(translate.x, translate.y, translate.z) );
        transform.setRotation( new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w ) );

        compoundShape.addChildShape(transform, shape)
    }
    let compoundGeometry = BufferGeometryUtils.mergeGeometries(geometries)

    // ------ Graphics Universe - Three.JS ------
    let drawer = new THREE.Mesh(
        compoundGeometry,
        new THREE.MeshPhongMaterial({color: Math.random() * 0xffffff}));

    // ------ Physics Universe - Ammo.js ------
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3(0, -1, 0) );
    transform.setRotation( new Ammo.btQuaternion( 0, 0, 0, 1 ) );
    let defaultMotionState = new Ammo.btDefaultMotionState( transform );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    compoundShape.calculateLocalInertia( mass, localInertia );

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo(mass, defaultMotionState, compoundShape);
    let RBody = new Ammo.btRigidBody( RBody_Info );

    return new Item(RBody, drawer)
}

var world = undefined
function AmmoStart()
{
    world = new World()
    
    world.addItem(createFloor())
    world.addItem(createDrawer())
    
    world.addDie(new D6(1, 1, new THREE.Vector3(0, 0, 3)))
    world.addDie(new D20(1, 1, new THREE.Vector3(0, 0, 0)))
    world.addDie(new D12(0.6, 1, new THREE.Vector3(0, 0, -3)))

    document.addEventListener('keydown', event => {
        if(event.key == ' ') world.rollDice()
    });
    world.render()
    
}
Ammo().then( AmmoStart );