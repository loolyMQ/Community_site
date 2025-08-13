import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 1.;

    float waveFactor = uEnableWaves;

    vec3 transformed = position;

    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    float time = uTime;
    vec2 pos = vUv;
    
    float move = sin(time + mouse) * 0.005;
    float r = texture2D(uTexture, pos + cos(time * 1. - time + pos.x) * .005).r;
    float g = texture2D(uTexture, pos + tan(time * .25 + pos.x - time) * .005).g;
    float b = texture2D(uTexture, pos - cos(time * 1. + time + pos.y) * .005).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`;

// Extend Math with map function
declare global {
  interface Math {
    map(n: number, start: number, stop: number, start2: number, stop2: number): number;
  }
}

Math.map = function (n: number, start: number, stop: number, start2: number, stop2: number): number {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
};

const PX_RATIO = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

interface AsciiFilterOptions {
  fontSize?: number;
  fontFamily?: string;
  charset?: string;
  invert?: boolean;
}

class AsciiFilter {
  private renderer: THREE.WebGLRenderer;
  public domElement: HTMLDivElement;
  private pre: HTMLPreElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private deg: number = 0;
  private invert: boolean;
  private fontSize: number;
  private fontFamily: string;
  private charset: string;
  private width: number = 0;
  private height: number = 0;
  private cols: number = 0;
  private rows: number = 0;
  private center: { x: number; y: number } = { x: 0, y: 0 };
  private mouse: { x: number; y: number } = { x: 0, y: 0 };
  private onMouseMove: (e: MouseEvent) => void;

  constructor(renderer: THREE.WebGLRenderer, options: AsciiFilterOptions = {}) {
    this.renderer = renderer;
    this.domElement = document.createElement('div');
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';

    this.pre = document.createElement('pre');
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.domElement.appendChild(this.canvas);

    this.invert = options.invert ?? true;
    this.fontSize = options.fontSize ?? 12;
    this.fontFamily = options.fontFamily ?? "'Courier New', monospace";
    this.charset = options.charset ?? " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

    this.context.imageSmoothingEnabled = false;

    this.onMouseMove = (e: MouseEvent) => {
      this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO };
    };
    document.addEventListener('mousemove', this.onMouseMove);
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.reset();

    this.center = { x: width / 2, y: height / 2 };
    this.mouse = { x: this.center.x, y: this.center.y };
  }

  reset(): void {
    this.context.font = `${this.fontSize}px ${this.fontFamily}`;
    const charWidth = this.context.measureText('A').width;

    this.cols = Math.floor(
      this.width / (this.fontSize * (charWidth / this.fontSize))
    );
    this.rows = Math.floor(this.height / this.fontSize);

    this.canvas.width = this.cols;
    this.canvas.height = this.rows;
    this.pre.style.fontFamily = this.fontFamily;
    this.pre.style.fontSize = `${this.fontSize}px`;
    this.pre.style.margin = '0';
    this.pre.style.padding = '0';
    this.pre.style.lineHeight = '1em';
    this.pre.style.position = 'absolute';
    this.pre.style.left = '50%';
    this.pre.style.top = '50%';
    this.pre.style.transform = 'translate(-50%, -50%)';
    this.pre.style.zIndex = '9';
    this.pre.style.backgroundAttachment = 'fixed';
    this.pre.style.mixBlendMode = 'difference';
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.context.clearRect(0, 0, w, h);
    if (this.context && w && h) {
      this.context.drawImage(this.renderer.domElement, 0, 0, w, h);
    }

    this.asciify(this.context, w, h);
    this.hue();
  }

  get dx(): number {
    return this.mouse.x - this.center.x;
  }

  get dy(): number {
    return this.mouse.y - this.center.y;
  }

  hue(): void {
    const deg = (Math.atan2(this.dy, this.dx) * 180) / Math.PI;
    this.deg += (deg - this.deg) * 0.075;
    this.domElement.style.filter = `hue-rotate(${this.deg.toFixed(1)}deg)`;
  }

  asciify(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (w && h) {
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let str = '';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = x * 4 + y * 4 * w;
          const [r, g, b, a] = [
            imgData[i],
            imgData[i + 1],
            imgData[i + 2],
            imgData[i + 3],
          ];

          if (a === 0) {
            str += ' ';
            continue;
          }

          let gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255;
          let idx = Math.floor((1 - gray) * (this.charset.length - 1));
          if (this.invert) idx = this.charset.length - idx - 1;
          str += this.charset[idx];
        }
        str += '\n';
      }
      this.pre.innerHTML = str;
    }
  }

  // Публичный метод для изменения размера шрифта
  setFontSize(newFontSize: number): void {
    this.fontSize = newFontSize;
    this.reset();
  }

  dispose(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
  }
}

interface CanvasTxtOptions {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

class CanvasTxt {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private txt: string;
  private fontSize: number;
  private fontFamily: string;
  private color: string;
  private font: string;

  constructor(txt: string, options: CanvasTxtOptions = {}) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.txt = txt;
    this.fontSize = options.fontSize ?? 200;
    this.fontFamily = options.fontFamily ?? 'Arial';
    this.color = options.color ?? '#fdf9f3';

    this.font = `600 ${this.fontSize}px ${this.fontFamily}`;
  }

  // Публичный метод для изменения размера шрифта
  setFontSize(newFontSize: number): void {
    this.fontSize = newFontSize;
    this.font = `600 ${this.fontSize}px ${this.fontFamily}`;
  }

  resize(): void {
    this.context.font = this.font;
    const metrics = this.context.measureText(this.txt);

    const textWidth = Math.ceil(metrics.width) + 20;
    const textHeight =
      Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 20;

    this.canvas.width = textWidth;
    this.canvas.height = textHeight;
  }

  render(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.color;
    this.context.font = this.font;

    const metrics = this.context.measureText(this.txt);
    const yPos = 10 + metrics.actualBoundingBoxAscent;

    this.context.fillText(this.txt, 10, yPos);
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  get texture(): HTMLCanvasElement {
    return this.canvas;
  }
}

interface CanvAsciiOptions {
  text: string;
  asciiFontSize: number;
  textFontSize: number;
  textColor: string;
  planeBaseHeight: number;
  enableWaves: boolean;
}

class CanvAscii {
  private textString: string;
  private asciiFontSize: number;
  private textFontSize: number;
  private textColor: string;
  private planeBaseHeight: number;
  private container: HTMLElement;
  private width: number;
  private height: number;
  private enableWaves: boolean;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private mouse: { x: number; y: number } = { x: 0, y: 0 };
  private textCanvas!: CanvasTxt;
  private texture!: THREE.CanvasTexture;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.ShaderMaterial;
  private mesh!: THREE.Mesh;
  private renderer!: THREE.WebGLRenderer;
  private filter!: AsciiFilter;
  private animationFrameId: number = 0;
  private onMouseMove: (evt: MouseEvent | TouchEvent) => void;

  constructor(
    options: CanvAsciiOptions,
    containerElem: HTMLElement,
    width: number,
    height: number
  ) {
    this.textString = options.text;
    this.asciiFontSize = options.asciiFontSize;
    this.textFontSize = options.textFontSize;
    this.textColor = options.textColor;
    this.planeBaseHeight = options.planeBaseHeight;
    this.container = containerElem;
    this.width = width;
    this.height = height;
    this.enableWaves = options.enableWaves;

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.z = 30;

    this.scene = new THREE.Scene();

    this.onMouseMove = (evt: MouseEvent | TouchEvent) => {
      const e = 'touches' in evt ? evt.touches[0] : evt;
      const bounds = this.container.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      this.mouse = { x, y };
    };

    this.setMesh();
    this.setRenderer();
  }

  // Функция для динамического подбора fontSize
  calculateOptimalFontSize() {
    if (!this.textCanvas) return this.textFontSize;

    const padding = 0.9; // 90% от доступного пространства
    const maxWidth = this.width * padding;
    const maxHeight = this.height * padding;



    // Начинаем с исходного размера шрифта
    let fontSize = this.textFontSize;
    let textWidth, textHeight;
    let iterations = 0;

    // Уменьшаем fontSize до тех пор, пока текст помещается
    do {
      this.textCanvas.setFontSize(fontSize);
      this.textCanvas.resize();
      
      textWidth = this.textCanvas.width;
      textHeight = this.textCanvas.height;
      

      
      // Если текст всё ещё не помещается, уменьшаем fontSize
      if (textWidth > maxWidth || textHeight > maxHeight) {
        fontSize *= 0.9; // Уменьшаем на 10%
      }
      
      iterations++;
    } while ((textWidth > maxWidth || textHeight > maxHeight) && fontSize > 10 && iterations < 20);


    return fontSize;
  }

  // Функция для вычисления оптимального размера ASCII символов
  calculateOptimalAsciiFontSize() {
    const optimalTextFontSize = this.calculateOptimalFontSize();
    const ratio = optimalTextFontSize / this.textFontSize; // Коэффициент уменьшения
    
    // Вычисляем оптимальный размер ASCII символов
    // Чем меньше текст, тем меньше должны быть ASCII символы
    let optimalAsciiFontSize = this.asciiFontSize * ratio;
    
    // Ограничиваем минимальный и максимальный размер
    optimalAsciiFontSize = Math.max(4, Math.min(optimalAsciiFontSize, 15));
    
    console.log('🔤 Оптимальный asciiFontSize:', Math.round(optimalAsciiFontSize));
    return optimalAsciiFontSize;
  }

  // Функция для пересоздания текста с оптимальным размером
  recreateTextWithOptimalSize() {
    if (!this.textCanvas) return;
    
    console.log('🚀 recreateTextWithOptimalSize вызвана!');



    // Вычисляем оптимальный размер шрифта
    const optimalFontSize = this.calculateOptimalFontSize();
    
    // Вычисляем оптимальный размер ASCII символов
    const optimalAsciiFontSize = this.calculateOptimalAsciiFontSize();
    
    console.log('📝 Оптимальные размеры:', {
      textFontSize: Math.round(optimalFontSize),
      asciiFontSize: Math.round(optimalAsciiFontSize)
    });
    

    
    // Пересоздаем текстовый canvas с новым размером
    this.textCanvas.setFontSize(optimalFontSize);
    this.textCanvas.resize();
    this.textCanvas.render();



    // Обновляем текстуру
    this.texture.needsUpdate = true;

    // Обновляем ASCII фильтр с новым размером
    if (this.filter) {
      this.filter.setFontSize(optimalAsciiFontSize);
    }

    // Пересоздаем геометрию с новыми пропорциями
    const textAspect = this.textCanvas.width / this.textCanvas.height;
    const baseH = this.planeBaseHeight;
    const planeW = baseH * textAspect;
    const planeH = baseH;



    // Удаляем старую геометрию
    if (this.geometry) {
      this.geometry.dispose();
    }

    // Создаем новую геометрию
    this.geometry = new THREE.PlaneGeometry(planeW, planeH, 36, 36);
    this.mesh.geometry = this.geometry;

    // Применяем масштабирование
    this.autoFitText();
    

  }

  // Функция для автоматического масштабирования (упрощенная)
  autoFitText() {
    if (!this.textCanvas || !this.mesh) return;

    // Получаем размеры текста
    const textWidth = this.textCanvas.width;
    const textHeight = this.textCanvas.height;
    const textAspect = textWidth / textHeight;

    // Получаем размеры контейнера
    const containerAspect = this.width / this.height;

    // Добавляем отступы
    const padding = 0.9;

    let scaleX, scaleY, scaleZ;

    if (textAspect > containerAspect) {
      // Текст шире контейнера - масштабируем по ширине
      scaleX = padding;
      scaleY = (containerAspect / textAspect) * padding;
      scaleZ = 1.0;
    } else {
      // Текст выше контейнера - масштабируем по высоте
      scaleX = (textAspect / containerAspect) * padding;
      scaleY = padding;
      scaleZ = 1.0;
    }

    // Применяем масштаб к мешу
    this.mesh.scale.set(scaleX, scaleY, scaleZ);

    // Центрируем меш
    this.mesh.position.set(0, 0, 0);
  }

  setMesh(): void {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: 'IBM Plex Mono',
      color: this.textColor,
    });
    this.textCanvas.resize();
    this.textCanvas.render();

    this.texture = new THREE.CanvasTexture(this.textCanvas.texture);
    this.texture.minFilter = THREE.NearestFilter;

    // Создаем плоскость с соотношением сторон текста
    const textAspect = this.textCanvas.width / this.textCanvas.height;
    const baseH = this.planeBaseHeight;
    const planeW = baseH * textAspect;
    const planeH = baseH;

    this.geometry = new THREE.PlaneGeometry(planeW, planeH, 36, 36);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 1.0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 }
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // Применяем автоматическое масштабирование с оптимальным размером
    this.recreateTextWithOptimalSize();
  }

  setRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: 'IBM Plex Mono',
      fontSize: this.asciiFontSize,
      invert: true,
    });

    this.container.appendChild(this.filter.domElement);
    this.setSize(this.width, this.height);

    // Принудительно пересоздаем текст с оптимальным размером
    setTimeout(() => {
      this.recreateTextWithOptimalSize();
    }, 100);

    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('touchmove', this.onMouseMove);
  }

  setSize(w: number, h: number): void {
    this.width = w;
    this.height = h;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.filter.setSize(w, h);

    // Пересоздаем текст с оптимальным размером при изменении размера
    this.recreateTextWithOptimalSize();
  }

  load(): void {
    this.animate();
  }

  animate(): void {
    const animateFrame = () => {
      this.animationFrameId = requestAnimationFrame(animateFrame);
      this.render();
    };
    animateFrame();
  }

  render(): void {
    const time = new Date().getTime() * 0.001;

    this.textCanvas.render();
    this.texture.needsUpdate = true;

    (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = Math.sin(time);

    this.updateRotation();
    this.filter.render(this.scene, this.camera);
  }

  updateRotation(): void {
    const x = Math.map(this.mouse.y, 0, this.height, 0.5, -0.5);
    const y = Math.map(this.mouse.x, 0, this.width, -0.5, 0.5);

    this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.02;
    this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.02;
  }

  clear(): void {
    this.scene.traverse((obj) => {
      if (
        (obj as any).isMesh &&
        typeof (obj as any).material === 'object' &&
        (obj as any).material !== null
      ) {
        Object.keys((obj as any).material).forEach((key) => {
          const matProp = (obj as any).material[key];
          if (matProp !== null && typeof matProp === 'object' && typeof matProp.dispose === 'function') {
            matProp.dispose();
          }
        });
        (obj as any).material.dispose();
        (obj as any).geometry.dispose();
      }
    });
    this.scene.clear();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.filter.dispose();
    this.container.removeChild(this.filter.domElement);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('touchmove', this.onMouseMove);
    this.clear();
    this.renderer.dispose();
  }
}

interface ASCIITextProps {
  text?: string;
  asciiFontSize?: number;
  textFontSize?: number;
  textColor?: string;
  planeBaseHeight?: number;
  enableWaves?: boolean;
}

export default function ASCIIText({
  text = 'David!',
  asciiFontSize = 8,
  textFontSize = 200,
  textColor = '#fdf9f3',
  planeBaseHeight = 8,
  enableWaves = true
}: ASCIITextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<CanvAscii | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();

    if (width === 0 || height === 0) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.boundingClientRect.width > 0 && entry.boundingClientRect.height > 0) {
            const { width: w, height: h } = entry.boundingClientRect;

            asciiRef.current = new CanvAscii(
              { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
              containerRef.current!,
              w,
              h
            );
            asciiRef.current.load();

            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
        if (asciiRef.current) {
          asciiRef.current.dispose();
        }
      };
    }

    asciiRef.current = new CanvAscii(
      { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
      containerRef.current,
      width,
      height
    );
    asciiRef.current.load();

    const ro = new ResizeObserver((entries) => {
      if (!entries[0] || !asciiRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) {
        asciiRef.current.setSize(w, h);
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (asciiRef.current) {
        asciiRef.current.dispose();
      }
    };
  }, [text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves]);

  return (
    <div
      ref={containerRef}
      className="ascii-text-container"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap');

        .ascii-text-container canvas {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          image-rendering: optimizeSpeed;
          image-rendering: -moz-crisp-edges;
          image-rendering: -o-crisp-edges;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
          opacity: 0.5; /* Показываем оригинальный canvas с 50% прозрачностью */
          transform: translate(2px, 2px); /* Небольшое смещение */
          z-index: 10; /* Поверх ASCII символов */
        }

        .ascii-text-container pre {
          margin: 0;
          user-select: none;
          padding: 0;
          line-height: 1em;
          text-align: left;
          position: absolute;
          left: 0;
          top: 0;
          background-image: radial-gradient(circle, #ff6188 0%, #fc9867 50%, #ffd866 100%);
          background-attachment: fixed;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          z-index: 9;
          mix-blend-mode: difference;
          opacity: 1; /* Убеждаемся, что ASCII символы видны */
        }
      `}</style>
    </div>
  );
}
