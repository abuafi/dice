import { Die, DieSide } from "./die.js";
import * as THREE from 'three';

function deg2rad (angle) {
    return angle * (Math.PI / 180);
}

const PENTAGON_WING_HEIGHT = Math.sin(deg2rad(108))
const PENTAGON_WING_SPAN = 1.618
const PENTAGON_HEIGHT = 1.539
const r = 0.8507
export class D12 extends Die {
    numSides() { return 12 }

    setGeom() { 
        this.geom = new THREE.DodecahedronGeometry(this.scale);
        let uvbuf = Array()
        let h = 1/12
        let sl = h/PENTAGON_WING_SPAN
        for (let i = 0; i < 12; i++) {
            let x0 = i*h;
            let x1 = x0+((h-sl)/2)
            let xN = x0+h;
            let x2 = xN-((h-sl)/2)
            let y1 = PENTAGON_WING_HEIGHT/PENTAGON_HEIGHT
            let xc = x0+(h/2)
            
            uvbuf.push(xc, 1)
            uvbuf.push(x0, y1)
            uvbuf.push(xN, y1)

            uvbuf.push(x0, y1)
            uvbuf.push(x1, 0)
            uvbuf.push(xN, y1)
            
            uvbuf.push(x1, 0)
            uvbuf.push(x2, 0)
            uvbuf.push(xN, y1)
        }
        uvbuf = new Float32Array(uvbuf);
        this.geom.setAttribute('uv', new THREE.BufferAttribute(uvbuf, 2))
    }

    setTexture() { 
        let ctx = document.createElement('canvas').getContext('2d');
        let canvas = ctx.canvas
        let cW = 100 * PENTAGON_WING_SPAN * .6;
        let cH = 100 * PENTAGON_HEIGHT * .6;
        canvas.width = cW * 12;
        canvas.height = cH;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        ctx.font = '50px bold sans-serif';
        ctx.fillStyle = 'blue';
        ctx.textAlign = "center"; // horizontal alignment
        ctx.textBaseline = "middle"; // vertical alignment
    
        for (let i = 0; i < 12; i++) {
            ctx.fillText(i+1, (cW*i)+(cW/2), (3*cH/5));
            if ([6,9].includes(i+1)) ctx.fillText('_', (cW*i)+(cW/2), (3*cH/5));
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
            
            let side = new DieSide(center, top, this)
            side.initTransform()
            side.value = i+1
            this.sides.push(side)
        }
    }
}