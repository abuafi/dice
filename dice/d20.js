import { Die } from "./die.js";
import * as THREE from 'three';

function deg2rad (angle) {
    return angle * (Math.PI / 180);
}

const EQUILATERAL_HEIGHT = Math.tan(deg2rad(60))*0.5
export class D20 extends Die {

    setGeom() { 
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

        this.geom = new THREE.BufferGeometry()
        this.geom.setAttribute( 'position', new THREE.BufferAttribute( vbuff, 3 ) );
        this.geom.setIndex(ibuff)
        this.geom.computeVertexNormals()
        this.geom.scale(0.75, 0.75, 0.75)

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
        this.geom.setAttribute('uv', new THREE.BufferAttribute(uvbuf, 2))
    }

    setTexture() { 
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

        this.texture = new THREE.CanvasTexture(canvas);
    }
}