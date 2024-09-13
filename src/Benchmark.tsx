import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PerfCounter } from '@babylonjs/core/Misc/perfCounter';
import { Scene } from '@babylonjs/core/scene';
import { useEffect, useRef, useState } from 'react';
import '@babylonjs/core/Helpers/sceneHelpers';
import '@babylonjs/core/Loading/loadingScreen';
import groundTexture from './assets/backgroundGround.png';
import skyboxTexture from './assets/backgroundSkybox.dds';
import environmentTexture from './assets/environmentSpecular.env';
import { Button } from 'antd';
import { InfoCard } from './InfoCard';

const generateItems = (counter: PerfCounter | undefined) => {
  return [
    {
      label: 'Average',
      value: counter ? counter.average.toFixed(2) : '-',
    },
    {
      label: 'Max',
      value: counter ? counter.max.toFixed(2) : '-',
    },
    {
      label: 'Min',
      value: counter ? counter.min.toFixed(2) : '-',
    },
  ];
};

/**
 * Show frame time, render time and other metrics when rendering
 * a complex scene
 */
export const Benchmark = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stopBenchmarkFn, setStopBenchmarkFn] = useState<() => void>();

  const [metrics, setMetrics] =
    useState<
      Pick<
        SceneInstrumentation,
        | 'frameTimeCounter'
        | 'renderTimeCounter'
        | 'cameraRenderTimeCounter'
        | 'activeMeshesEvaluationTimeCounter'
        | 'renderTargetsRenderTimeCounter'
      >
    >();

  useEffect(() => {
    return () => stopBenchmarkFn?.();
  }, [stopBenchmarkFn]);

  const startBenchmark = () => {
    const canvas = canvasRef.current;
    if (stopBenchmarkFn || !canvas) {
      // do nothing
    } else {
      const engine = new Engine(canvas);

      const resize = () => {
        engine.resize();
      };

      window.addEventListener('resize', resize);

      const scene = createBenchmarkScene(engine, canvas);
      const instrumentation = createInstrumentation(scene);

      console.log('start benchmarking renedr loop');
      engine.runRenderLoop(() => {
        scene.render();
      });

      const timer = setInterval(() => {
        const {
          frameTimeCounter,
          cameraRenderTimeCounter,
          renderTimeCounter,
          activeMeshesEvaluationTimeCounter,
          renderTargetsRenderTimeCounter,
        } = instrumentation;

        setMetrics({
          renderTimeCounter,
          frameTimeCounter,
          cameraRenderTimeCounter,
          activeMeshesEvaluationTimeCounter,
          renderTargetsRenderTimeCounter,
        });
      }, 1000);

      const teardownFn = () => {
        console.log('tearing down benchmark setup');
        clearInterval(timer);

        engine.stopRenderLoop();
        scene.dispose();

        window.removeEventListener('resize', resize);

        engine.dispose();

        clearInterval(timer);
      };
      setStopBenchmarkFn(() => teardownFn);
    }
  };

  const stopBenchmark = () => {
    stopBenchmarkFn?.();
    setStopBenchmarkFn(undefined);
  };

  return (
    <div className="container">
      <div className="titleRow">
        <p>renderer</p>
        {stopBenchmarkFn ? (
          <Button onClick={stopBenchmark}>Stop</Button>
        ) : (
          <Button onClick={startBenchmark}>Start benchmark</Button>
        )}
      </div>

      <div className="instrumentation">
        <InfoCard
          title="Render time"
          items={generateItems(metrics?.renderTimeCounter)}
        />

        <InfoCard
          title="Frame time"
          items={generateItems(metrics?.frameTimeCounter)}
        />

        <InfoCard
          title="Camera render time"
          items={generateItems(metrics?.cameraRenderTimeCounter)}
        />

        <InfoCard
          title="Mesh evaluation time"
          items={generateItems(metrics?.activeMeshesEvaluationTimeCounter)}
        />

        <InfoCard
          title="Render target time"
          items={generateItems(metrics?.renderTargetsRenderTimeCounter)}
        />
      </div>

      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

const createInstrumentation = (scene: Scene) => {
  // Instrumentation
  const instrumentation = new SceneInstrumentation(scene);
  instrumentation.captureFrameTime = true;
  instrumentation.captureCameraRenderTime = true;
  instrumentation.captureRenderTime = true;
  instrumentation.captureActiveMeshesEvaluationTime = true;
  instrumentation.captureRenderTargetsRenderTime = true;
  return instrumentation;
};

/**
 * create a benchmark scene with 2500 spheres and individual material.
 * This is the exact scene used in Babylon.JS project for performance testing
 * @see {@link https://playground.babylonjs.com/#6HWS9M#60|Playground} and
 * {@link https://github.com/BabylonJS/Babylon.js/blob/c3a4d37f609746927461d18aee7dd17c2da16c4e/packages/tools/tests/test/performance/config.json#L14|Github}
 */
const createBenchmarkScene = (
  engine: Engine,
  canvas: HTMLCanvasElement,
): Scene => {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    'camera1',
    Math.PI / 2,
    Math.PI / 2,
    80,
    new Vector3(0, 0, 0),
    scene,
  );

  camera.attachControl(canvas, true);

  const sphereCount = 2500;
  const materialCount = 50;
  const materials = [];

  for (let index = 0; index < materialCount; index++) {
    const pbr = new PBRMaterial('mat ' + index, scene);
    pbr.emissiveColor = new Color3(Math.random(), Math.random(), Math.random());
    materials.push(pbr);
  }

  for (let index = 0; index < sphereCount; index++) {
    const sphere = MeshBuilder.CreateSphere(
      'sphere',
      { diameter: 2, segments: 32 },
      scene,
    );
    sphere.position = new Vector3(
      20 - Math.random() * 40,
      20 - Math.random() * 40,
      20 - Math.random() * 40,
    );
    sphere.material = materials[index % materialCount];
  }

  // Create some random hierarchy
  const levelMax = 5;
  let level = 0;
  for (let index = 0; index < sphereCount; index++) {
    if (level !== 0) {
      const sphere = scene.meshes[index];
      sphere.setParent(scene.meshes[index - 1]);
    }
    level++;

    if (level >= levelMax) {
      level = 0;
    }
  }

  scene.createDefaultEnvironment({
    skyboxTexture,
    groundTexture,
    environmentTexture,
  });

  scene.onBeforeRenderObservable.add(() => {
    for (let index = 0; index < scene.meshes.length; index++) {
      const sphere = scene.meshes[index];
      sphere.rotation.y += 0.01;
    }
  });

  return scene;
};
