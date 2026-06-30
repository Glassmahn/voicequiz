'use client'

import { useEffect, useRef } from 'react'

export default function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return

    let visible = false
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    observer.observe(canvas)

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const vs = `
      attribute vec2 a;
      void main() { gl_Position = vec4(a, 0.0, 1.0); }
    `

    const fs = `
      precision highp float;
      uniform vec2 uR;
      uniform float uT;

      vec3 COL_PINK   = vec3(1.0, 0.176, 0.604);
      vec3 COL_VIOLET = vec3(0.482, 0.310, 1.0);
      vec3 COL_BLUE   = vec3(0.431, 0.776, 1.0);

      float sph(vec3 p, vec3 c, float r) { return length(p - c) - r; }

      float scene(vec3 p) {
        float t = uT * 0.35;
        float s1 = sph(p, vec3(sin(t) * 2.5, cos(t * 0.65) * 1.6, 4.5 + sin(t * 0.5) * 1.1), 1.05);
        float s2 = sph(p, vec3(cos(t * 0.75) * 2.8, sin(t * 1.05) * 2.0, 5.2 + cos(t * 0.55) * 1.3), 0.82);
        float s3 = sph(p, vec3(sin(t * 1.2 + 1.1) * 2.0, cos(t * 0.85 + 2.1) * 2.1, 4.8 + sin(t * 0.7) * 1.5), 0.7);
        return min(min(s1, s2), s3);
      }

      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.001, 0.0);
        return normalize(vec3(
          scene(p + e.xyy) - scene(p - e.xyy),
          scene(p + e.yxy) - scene(p - e.yxy),
          scene(p + e.yyx) - scene(p - e.yyx)
        ));
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uR) / min(uR.x, uR.y);
        vec3 ro = vec3(0.0, 0.0, -2.0);
        vec3 rd = normalize(vec3(uv, 1.0));

        float t = 0.0;
        for (int i = 0; i < 64; i++) {
          vec3 p = ro + rd * t;
          float d = scene(p);
          if (d < 0.001) break;
          t += d;
        }

        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        vec3 col = mix(COL_PINK, COL_VIOLET, n.y * 0.5 + 0.5);
        col = mix(col, COL_BLUE, n.x * 0.3 + 0.3);
        float fog = 1.0 - exp(-t * 0.15);
        col = mix(col, vec3(0.027, 0.027, 0.04), fog);
        gl_FragColor = vec4(col, 1.0);
      }
    `

    const vShader = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vShader, vs)
    gl.compileShader(vShader)

    const fShader = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fShader, fs)
    gl.compileShader(fShader)

    const prog = gl.createProgram()!
    gl.attachShader(prog, vShader)
    gl.attachShader(prog, fShader)
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const aLoc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(aLoc)
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0)

    const uRLoc = gl.getUniformLocation(prog, 'uR')
    const uTLoc = gl.getUniformLocation(prog, 'uT')

    let animId: number

    const draw = (time: number) => {
      if (!visible) { animId = requestAnimationFrame(draw); return }
      gl.uniform2f(uRLoc, canvas.width, canvas.height)
      gl.uniform1f(uTLoc, time / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
