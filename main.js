import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let modelReady = false;
let isWalking = false;
let targetPosition = null;
let object;
let explanationElement;

window.addEventListener('load', function () {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.add(new THREE.AxesHelper(5));

    const camera = new THREE.PerspectiveCamera(75, 4 / 3, 0.1, 10);
    camera.position.set(0, 0.5, 2);
    camera.rotation.set(-Math.PI / 8, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(800, 600);

    var container = document.getElementById('canvas');
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    var mixer;

    var loader = new FBXLoader();
    loader.load("Walking.fbx", function(modelObject) {
        object = modelObject;
        object.scale.set(0.005, 0.005, 0.005);
        object.position.set(0, 0, 0);

        mixer = new THREE.AnimationMixer(object);
        var action = mixer.clipAction(object.animations[0]);
        action.play();

        object.traverse(function(node) {
            if (node.isMesh) {
                node.material.transparent = true;
                node.material.opacity = 0.5;
            }
        });

        scene.add(object);

        modelReady = true;
    });

    explanationElement = document.getElementById('explanation');

    const buttonPositions = [
        new THREE.Vector3(0, 1.2, -1), // Button 1 (Left)
        new THREE.Vector3(0, -0.5, 1),  // Button 2 (Right),
        new THREE.Vector3(-1.5, 0, 0),// Button 3 (Down)
        new THREE.Vector3(1.5, 0, 0),   // Button 4 (Up)
    ];

    for (let i = 0; i < 4; i++) {
        document.getElementById(`button${i + 1}`).addEventListener('click', function () {
            if (modelReady && !isWalking) {
                if (targetPosition) {
                    mixer.uncacheAction(mixer.clipAction(object.animations[0]));
                }
                targetPosition = buttonPositions[i];
                isWalking = true;

                // Position the explanation element
                const modelHeadOffset = new THREE.Vector3(0, 1, 0);
                const modelHeadPosition = object.position.clone().add(modelHeadOffset);
                const screenPosition = modelHeadPosition.clone().project(camera);

                explanationElement.style.top = `${(screenPosition.y + 1) * window.innerHeight / 2}px`;
                explanationElement.style.left = `${(screenPosition.x + 1) * window.innerWidth / 2}px`;

                explanationElement.textContent = `Model is walking to Button ${i + 1}.`;
                explanationElement.style.display = 'block';
            }
        });
    }

    function animate() {
        requestAnimationFrame(animate);

        if (modelReady) {
            mixer.update(clock.getDelta());

            if (isWalking && targetPosition) {
                const step = 0.01;
                const currentPosition = object.position.clone();
                const direction = new THREE.Vector3();
                direction.subVectors(targetPosition, currentPosition).normalize().multiplyScalar(step);

                object.position.add(direction);

                const distance = currentPosition.distanceTo(targetPosition);
                if (distance < step) {
                    isWalking = false;
                    targetPosition = null;
                    explanationElement.style.display = 'none';
                }

                // Update explanation element position with the model's head
                const modelHeadOffset = new THREE.Vector3(0, 1, 0);
                const modelHeadPosition = object.position.clone().add(modelHeadOffset);
                const screenPosition = modelHeadPosition.clone().project(camera);

                explanationElement.style.top = `${(screenPosition.y + 1) * window.innerHeight / 2}px`;
                explanationElement.style.left = `${(screenPosition.x + 1) * window.innerWidth / 2}px`;
            }
        }

        renderer.render(scene, camera);
    }

    var clock = new THREE.Clock();
    animate();
});
