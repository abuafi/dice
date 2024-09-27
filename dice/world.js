import * as THREE from 'three';

export class World {
    physicsUniverse;
    camera;
    clock;
    renderer;
    scene;
    physicsMeshes = Array();
    dice = Array();

    rollTime

    constructor() {
        this.rollTime = Date.now()
        this.initGraphicsUniverse()
        this.initPhysicsUniverse()
    }

    register(die) {
        this.physicsUniverse.addRigidBody( die.body );

        die.mesh.userData.physicsBody = die.body
        this.physicsMeshes.push( die.mesh );

        this.dice.push( die );
        this.scene.add( die.mesh );
    }

    addPhysicsObject(body, mesh = undefined) {
        if (mesh) {
            mesh.userData.physicsBody = body
            this.scene.add( mesh );
            this.physicsMeshes.push( mesh );
        }
        this.physicsUniverse.addRigidBody( body );
    }

    rollDice() {
        this.rollTime = Date.now()
        for (let die of this.dice) {
            // let inertia = new Ammo.btVector3( 0, 0, 0 )
            // die.shape.calculateLocalInertia(die.mass, inertia)
            // die.body.setMassProps(die.mass, inertia)
            // die.body.updateInertiaTensor()

            let body = die.body;
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

    updatePhysicsUniverse( deltaTime )
    {   
        // if (Date.now() > this.rollTime + 1000) {
        //     let delta = Date.now() - this.rollTime
        //     for (let die of this.dice) {
        //         let yvel = die.body.getLinearVelocity().y()
        //         if (yvel > 1 | yvel < -1) {
        //             let mass = die.mass + delta/100
        //             let inertia = new Ammo.btVector3( 0, 0, 0 )
        //             die.shape.calculateLocalInertia(mass, inertia)
        //             die.body.setMassProps(mass, inertia)
        //             die.body.updateInertiaTensor()
        //         } 
        //     }
        // }
        this.physicsUniverse.stepSimulation( deltaTime, 10 );
        for ( let i = 0; i < this.physicsMeshes.length; i++ ){
            let Graphics_Obj = this.physicsMeshes[ i ];
            let Physics_Obj = Graphics_Obj.userData.physicsBody;
            let motionState = Physics_Obj.getMotionState();
            if (motionState)
            {
                let transform = new Ammo.btTransform();
                motionState.getWorldTransform( transform );
                let new_pos = transform.getOrigin();
                let new_qua = transform.getRotation();
                Graphics_Obj.position.set( new_pos.x(), new_pos.y(), new_pos.z() );
                Graphics_Obj.quaternion.set( new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w() );
            }
        }
    }

    render()
    {
        let deltaTime = this.clock.getDelta();
        this.updatePhysicsUniverse( deltaTime );
                
        this.renderer.render( this.scene, this.camera );
        requestAnimationFrame( () => this.render() );

        // this.ctx2d.drawImage(renderCanvas, 0, 0)
        // this.canvasTexture.needsUpdate = true;
    }

    initGraphicsUniverse()
    {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.y = 5;
        this.camera.rotation.x = -Math.PI/2

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );

        var ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
        this.scene.add(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(-1, 0.9, 0.4);
        this.scene.add(directionalLight);
        
        /* Canvas Texture */
        // this.ctx2d = document.createElement('canvas').getContext('2d');
        // this.ctx2d.canvas.width = window.innerWidth;
        // this.ctx2d.canvas.height = window.innerHeight;
        // this.canvasTexture = new THREE.CanvasTexture(ctx2d.canvas);
    }

    initPhysicsUniverse()
    {
        var collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration();
        var dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration);
        var overlappingPairCache    = new Ammo.btDbvtBroadphase();
        var solver                  = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsUniverse        = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this.physicsUniverse.setGravity(new Ammo.btVector3(0, -75, 0));
    }
}