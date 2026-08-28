/**
 * WebGL Transition Engine for Atlas Memories
 * Based on webGLImageTransitions by akella/Codrops
 */
class WebGLTransition {
  constructor() {
    this.scene = new THREE.Scene();
    this.vertex = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    this.fragment = `
      uniform float time;
      uniform float progress;
      uniform float width;
      uniform float scaleX;
      uniform float scaleY;
      uniform float transition;
      uniform float radius;
      uniform float swipe;
      uniform sampler2D texture1;
      uniform sampler2D texture2;
      uniform sampler2D displacement;
      uniform vec4 resolution;
      varying vec2 vUv;
      varying vec4 vPosition;

      vec2 mirrored(vec2 v) {
        vec2 m = mod(v, 2.);
        return mix(m, 2.0 - m, step(1.0, m));
      }

      void main() {
        vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
        vec4 noise = texture2D(displacement, mirrored(newUV + time * 0.04));
        float prog = progress * 0.8 - 0.05 + noise.g * 0.06;
        float intpl = pow(abs(smoothstep(0., 1., (prog * 2. - vUv.x + 0.5))), 10.);
        vec4 t1 = texture2D(texture1, (newUV - 0.5) * (1.0 - intpl) + 0.5);
        vec4 t2 = texture2D(texture2, (newUV - 0.5) * intpl + 0.5);
        gl_FragColor = mix(t1, t2, intpl);
      }
    `;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 1000);
    this.camera.position.set(0, 0, 2);
    
    this.duration = 1.2;
    this.easing = 'easeOut';
    this.time = 0;
    this.isTransitioning = false;
    this.progress = { value: 0 };
    
    this.init();
  }

  init() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        progress: { type: "f", value: 0 },
        border: { type: "f", value: 0 },
        intensity: { type: "f", value: 0 },
        scaleX: { type: "f", value: 40 },
        scaleY: { type: "f", value: 40 },
        transition: { type: "f", value: 40 },
        swipe: { type: "f", value: 0 },
        width: { type: "f", value: 0 },
        radius: { type: "f", value: 0 },
        texture1: { type: "t", value: null },
        texture2: { type: "t", value: null },
        displacement: { type: "t", value: this.createNoiseTexture() },
        resolution: { type: "v4", value: new THREE.Vector4() }
      },
      vertexShader: this.vertex,
      fragmentShader: this.fragment
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 2, 2);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
    
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  createNoiseTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size * size; i++) {
      const value = Math.random() * 255;
      data[i * 4] = value;
      data[i * 4 + 1] = value;
      data[i * 4 + 2] = value;
      data[i * 4 + 3] = 255;
    }
    
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBA_FORMAT);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    
    return texture;
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    
    const imageAspect = 1;
    let a1, a2;
    
    if (this.height / this.width > imageAspect) {
      a1 = (this.width / this.height) * imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (this.height / this.width) / imageAspect;
    }
    
    this.material.uniforms.resolution.value.set(this.width, this.height, a1, a2);
    
    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));
    this.plane.scale.x = this.camera.aspect;
    this.plane.scale.y = 1;
    this.camera.updateProjectionMatrix();
  }

  getCanvas() {
    return this.renderer.domElement;
  }

  setTexture1(texture) {
    this.material.uniforms.texture1.value = texture;
  }

  setTexture2(texture) {
    this.material.uniforms.texture2.value = texture;
  }

  transition(onComplete) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    const startValue = 0;
    const endValue = 1;
    const startTime = performance.now();
    
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const duration = this.duration;
      
      if (elapsed < duration) {
        const t = easeOut(elapsed / duration);
        this.material.uniforms.progress.value = startValue + (endValue - startValue) * t;
        this.material.uniforms.time.value = this.time;
        this.time += 0.016;
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(animate);
      } else {
        this.material.uniforms.progress.value = 0;
        this.material.uniforms.texture1.value = this.material.uniforms.texture2.value;
        this.isTransitioning = false;
        if (onComplete) onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  }

  render() {
    this.material.uniforms.time.value = this.time;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebGLTransition;
}
