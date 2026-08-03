import { Container } from 'pixi.js-legacy';

const tempParent = new Container();

export function updateStandaloneTransform(root: Container): void {
  const cachedParent = root.parent;
  root.parent = tempParent;
  try {
    root.updateTransform();
  } finally {
    root.parent = cachedParent;
  }
}
