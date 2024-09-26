import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


/* Ammo init */
var physicsUniverse = undefined;
function initPhysicsUniverse()
{
    var collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache    = new Ammo.btDbvtBroadphase();
    var solver                  = new Ammo.btSequentialImpulseConstraintSolver();
    physicsUniverse             = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsUniverse.setGravity(new Ammo.btVector3(0, -75, 0));
}


/* Three init */

var scene = undefined;
var camera = undefined;
var clock = undefined;
var renderer = undefined;
var renderCanvas = undefined;

var ctx2d = undefined;
var canvasTexture = undefined;

function initGraphicsUniverse()
{
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.y = 5;
    camera.rotation.x = -pi/2

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderCanvas = renderer.domElement
    document.body.appendChild( renderCanvas );

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-1, 0.9, 0.4);
    scene.add(directionalLight);
    
    /* Canvas Texture */
    ctx2d = document.createElement('canvas').getContext('2d');
    ctx2d.canvas.width = window.innerWidth;
    ctx2d.canvas.height = window.innerHeight;
    canvasTexture = new THREE.CanvasTexture(ctx2d.canvas);
}

/* Physic objects */
const pi = Math.PI
function deg2rad (angle) {
    return angle * (Math.PI / 180);
}

const bodies = new Array();
const dice = new Array();
const axes = {
    'x': new THREE.Vector3(1, 0, 0),
    'y': new THREE.Vector3(0, 1, 0),
    'z': new THREE.Vector3(0, 0, 1)
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


const EQUILATERAL_HEIGHT = Math.tan(deg2rad(60))*0.5
function icosahedron() {
        let phi = (1.0 + Math.sqrt(5.0)) * 0.5; // golden ratio
        let a = 1.0;
        let b = 1.0 / phi;
      
        let vertices = [
           [ 0,  b, -a],
           [ b,  a,  0],
           [-b,  a,  0],
           [ 0,  b,  a],
           [ 0, -b,  a],
           [-a,  0,  b],
           [ 0, -b, -a],
           [ a,  0, -b],
           [ a,  0,  b],
           [-a,  0, -b],
           [ b, -a,  0],
           [-b, -a,  0],
        ]
        let faces = [
            [3, 2, 1 ],
            [2, 3, 4 ],
            [6, 5, 4 ],
            [5, 9, 4 ],
            [8, 7, 1 ],
            [7, 10,1 ],
            [12,11,5 ],
            [11,12,7 ],
            [10,6, 3 ],
            [6, 10,12],
            [9, 8, 2 ],
            [8, 9, 11],
            [3, 6, 4 ],
            [9, 2, 4 ],
            [10,3, 1 ],
            [2, 8, 1 ],
            [12,10,7 ],
            [8, 11,7 ],
            [6, 12,5 ],
            [11,9, 5 ]
                    ]
        let vbuff = Array()
        let ibuff = Array()
        for (let face of faces) {
            for (let i of face) {
                ibuff.push(vbuff.length/3)
                vbuff.push(...vertices[i-1])
            }
        }
        vbuff = new Float32Array(vbuff)

        let geom = new THREE.BufferGeometry()
        geom.setAttribute( 'position', new THREE.BufferAttribute( vbuff, 3 ) );
        geom.setIndex(ibuff)
        geom.computeVertexNormals()
        geom.scale(0.75, 0.75, 0.75)

        // TODO reorder index buffer so that values appear on correct side

        let uvbuf = Array()
        for (let i = 0; i < 20; i++) {
            let xd = 1/20;
            let xa = i*xd;
            let xb = xa+xd;
            
            uvbuf.push(xa+(xd/2), 1)
            uvbuf.push(xa, 0)
            uvbuf.push(xb, 0)
        }
        uvbuf = new Float32Array(uvbuf);
        geom.setAttribute('uv', new THREE.BufferAttribute(uvbuf, 2))

        return geom;
}
function createD20(scale, position, mass, rotation = new THREE.Euler())
{
    DIE_COUNTS.d20 += 1;
    var id = 'd20_' + DIE_COUNTS.d20;
    let ctx = document.createElement('canvas').getContext('2d');
    let canvas = ctx.canvas
    let cW = 100;
    let cH = 100 * EQUILATERAL_HEIGHT;
    canvas.width = cW * 20;
    canvas.height = cH;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '50px bold sans-serif';
    ctx.fillStyle = 'blue';
    ctx.textAlign = "center"; // horizontal alignment
    ctx.textBaseline = "middle"; // vertical alignment

    for (let i = 0; i < 20; i++) {
        ctx.fillText(i+1, (cW*i)+(cW/2), (3*cH/4));
        if ([6,9].includes(i+1)) ctx.fillText('_', (cW*i)+(cW/2), (3*cH/4));
    }

    let tex = new THREE.CanvasTexture(canvas);
    DIE_CANVASES[id] = canvas

    let quaternion = new THREE.Quaternion()
    quaternion = quaternion.setFromEuler(rotation)
    // let [geometry, shape] = boxGeometryShape(scale, scale, scale)
    
    // ------ Graphics Universe - Three.JS ------
    let ico_geom = icosahedron()

    // var materials = Array()
    // let groups = Array()
    // for (let i = 0; i < 20; i++) {
    //     materials.push(new THREE.MeshPhongMaterial({color: Math.random() * 0xffffff}))
    //     groups.push({start:i*3, count:3, materialIndex:i})
    // }
    // ico_geom.groups=groups
    let material = new THREE.MeshPhongMaterial({ map: tex });

    let mesh = new THREE.Mesh(ico_geom, material)
    
    scene.add(mesh);

    var shape = new Ammo.btConvexHullShape()
    var vertices = ico_geom.attributes.position.array
    for (let i = 0; i < vertices.length; i+=3) {
        shape.addPoint(new Ammo.btVector3(vertices[i], vertices[i+1], vertices[i+2]))
    }

    // ------ Physics Universe - Ammo.js ------
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( position.x, position.y, position.z ) );
    transform.setRotation( new Ammo.btQuaternion( quaternion.x, quaternion.y, quaternion.z, quaternion.w ) );
    let defaultMotionState = new Ammo.btDefaultMotionState( transform );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    shape.calculateLocalInertia( mass, localInertia );

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo( mass, defaultMotionState, shape, localInertia );
    let RBody = new Ammo.btRigidBody( RBody_Info );

    physicsUniverse.addRigidBody( RBody );

    mesh.userData.physicsBody = RBody;
    mesh.userData.id = id;

    bodies.push(mesh);
    dice.push(mesh);
    return mesh
}

const DIE_CANVASES = {}
const DIE_COUNTS = {
    'd6':0,
    'd20':0
}

function createD6(scale, position, mass, rotation = new THREE.Euler())
{
    DIE_COUNTS.d6 += 1;
    var id = 'd6_' + DIE_COUNTS.d6;
    let ctx = document.createElement('canvas').getContext('2d');
    let canvas = ctx.canvas
    canvas.width = 100 * 6;
    canvas.height = 100;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '50px bold sans-serif';
    ctx.fillStyle = 'blue';
    ctx.textAlign = "center"; // horizontal alignment
    ctx.textBaseline = "middle"; // vertical alignment

    for (let i = 0; i < 6; i++) {
        ctx.fillText(i+1, 100*i+50, 50);
        if ([6,9].includes(i+1)) ctx.fillText('_', 100*i+50, 50);
    }

    let tex = new THREE.CanvasTexture(canvas);
    DIE_CANVASES[id] = canvas

    let quaternion = new THREE.Quaternion()
    quaternion = quaternion.setFromEuler(rotation)
    let [geometry, shape] = boxGeometryShape(scale, scale, scale)
    
    // ------ Graphics Universe - Three.JS ------
    // let materials = Array()
    // for (let i = 0; i < 6; i++) {
    //     materials.push(new THREE.MeshPhongMaterial({color: Math.random() * 0xffffff}))
    // }

    let material = new THREE.MeshPhongMaterial({ map: tex });

    let newcube = new THREE.Mesh(
        geometry, 
        material);
    newcube.position.set(position.x, position.y, position.z);
    scene.add(newcube);

    // ------ Physics Universe - Ammo.js ------
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( position.x, position.y, position.z ) );
    transform.setRotation( new Ammo.btQuaternion( quaternion.x, quaternion.y, quaternion.z, quaternion.w ) );
    let defaultMotionState = new Ammo.btDefaultMotionState( transform );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    shape.calculateLocalInertia( mass, localInertia );

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo( mass, defaultMotionState, shape, localInertia );
    let RBody = new Ammo.btRigidBody( RBody_Info );

    physicsUniverse.addRigidBody( RBody );
    newcube.userData.physicsBody = RBody;
    newcube.userData.id = id;
    bodies.push(newcube);
    dice.push(newcube);
    return newcube
}

var floor = undefined
function createFloor() {
    // ------ Physics Universe - Ammo.js ------
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3(0, -5, 0) );
    let defaultMotionState = new Ammo.btDefaultMotionState( transform );

    let structColShape = new Ammo.btBoxShape( new Ammo.btVector3( 20, 0.1, 20 ) );

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo(0, defaultMotionState, structColShape);
    let RBody = new Ammo.btRigidBody( RBody_Info );

    physicsUniverse.addRigidBody( RBody );
    floor = RBody
}

var drawer = undefined
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
    drawer = new THREE.Mesh(
        compoundGeometry,
        new THREE.MeshPhongMaterial({color: Math.random() * 0xffffff}));
    scene.add(drawer);

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

    physicsUniverse.addRigidBody( RBody );
    drawer.userData.physicsBody = RBody;
    bodies.push(drawer);

}

/* Physics update */

function updatePhysicsUniverse( deltaTime )
{
    var tmpTransformation = new Ammo.btTransform();;
    physicsUniverse.stepSimulation( deltaTime, 10 );
    for ( let i = 0; i < bodies.length; i++ ){
        let Graphics_Obj = bodies[ i ];
        let Physics_Obj = Graphics_Obj.userData.physicsBody;
        tmpTransformation = new Ammo.btTransform();
        let motionState = Physics_Obj.getMotionState();
        if (motionState)
        {
            motionState.getWorldTransform( tmpTransformation );
            let new_pos = tmpTransformation.getOrigin();
            let new_qua = tmpTransformation.getRotation();
            Graphics_Obj.position.set( new_pos.x(), new_pos.y(), new_pos.z() );
            Graphics_Obj.quaternion.set( new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w() );

            let vel = Physics_Obj.getLinearVelocity()
        }
    }
}

function render()
{
        let deltaTime = clock.getDelta();
        updatePhysicsUniverse( deltaTime );
                
        renderer.render( scene, camera );
        requestAnimationFrame( render );

        ctx2d.drawImage(renderCanvas, 0, 0)
        canvasTexture.needsUpdate = true;
}


/* Ammo start */
function AmmoStart()
{
    initPhysicsUniverse()
    initGraphicsUniverse()

    createFloor()
    createDrawer()
    
    createD6(1, new THREE.Vector3(0,0,0), 1, new THREE.Euler(0, 0, 0));
    createD6(1, new THREE.Vector3(-2,0,-1), 1, new THREE.Euler(0, 0, 0));
    createD20(1, new THREE.Vector3(2,0,1), 1, new THREE.Euler(0, 0, 0));
    createD20(1, new THREE.Vector3(2,0,-1), 1, new THREE.Euler(0, 0, 0));

    document.addEventListener('keydown', function(event) {
        if(event.key == ' ') {
            // drawer.userData.physicsBody.setSleepingThresholds(-1, -1)
            for (let die of dice) {
                let body = die.userData.physicsBody;
                let position = body.getWorldTransform().getOrigin()
                body.activate()
                let xCen = (Math.random() * 0.5) - 0.25 - position.x();
                let yCen = (Math.random() * 5  ) - 2.5  + 30;
                let zCen = (Math.random() * 0.5) - 0.25 - position.z();

                let xTor = (Math.random() * 10 ) - 5;
                let yTor = (Math.random() * 10 ) - 5;
                let zTor = (Math.random() * 10 ) - 5;
                body.applyCentralImpulse(new Ammo.btVector3(xCen, yCen, zCen));
                body.applyTorqueImpulse(new Ammo.btVector3(xTor, yTor, zTor));
            }
        }
    });

    render()
}
Ammo().then( AmmoStart );