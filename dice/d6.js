import { Die, DieSide } from "./die.js";
import * as THREE from 'three';

export class D6 extends Die {
    numSides() { return 6 }

    setShape() {
        this.shape = new Ammo.btBoxShape( new Ammo.btVector3(this.scale*0.5, this.scale*0.5, this.scale*0.5) );
    }

    setGeom() { 
        this.geom = new THREE.BoxGeometry(this.scale, this.scale, this.scale);
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
        this.geom.setAttribute('uv', new THREE.BufferAttribute(uvbuf, 2))
    }

    setTexture() { 
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
    
        this.texture = new THREE.CanvasTexture(canvas);
    }

    setSides() {
        let numSides = this.numSides()
        for (let i = 0; i < numSides; i++) {
            let vertices = this.faceVertices(i)
            let center = new THREE.Vector3()
            let temp = new THREE.Vector3()
            for (let vertex of vertices) center.add(temp.set(...vertex))
            center.divideScalar(vertices.length)

            let top = new THREE.Vector3(...vertices[0])
            top.sub(temp.set(...vertices[2]))
            top.divideScalar(2)
            top.add(temp.set(...vertices[2]))
            
            let side = new DieSide(center, top, this)
            side.initTransform()
            side.value = i+1
            this.sides.push(side)
        }
    }
}