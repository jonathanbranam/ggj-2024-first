import { Scene  } from '@babylonjs/core/scene';
import { PhysicsViewer  } from '@babylonjs/core/Debug';

let physicsViewer;

export function debugPhysics(scene:Scene) {
  // Babylon.js/packages/dev/inspector/src/components/actionTabs/tabs/debugTabComponent.tsx#L44
  if (!physicsViewer) {
    physicsViewer = new PhysicsViewer();
  } else {
    physicsViewer.dispose();
    physicsViewer = null;
    return;
  }
  for (const meshA of scene.rootNodes) {
    const mesh  = meshA as unknown as any;
    if (mesh.physicsImpostor) {
      physicsViewer.showImpostor(mesh.physicsImpostor);
    }
    if (mesh.physicsBody) {
      physicsViewer.showBody(mesh.physicsBody);
    }
  }
}
