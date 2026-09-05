function grayscale(data) {
  const gray = new Float32Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return gray;
}

function sobel(gray, width, height) {
  const edges = new Float32Array(gray.length);
  let sum = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const gx =
        -gray[i - width - 1] + gray[i - width + 1] -
        2 * gray[i - 1] + 2 * gray[i + 1] -
        gray[i + width - 1] + gray[i + width + 1];
      const gy =
        -gray[i - width - 1] - 2 * gray[i - width] - gray[i - width + 1] +
        gray[i + width - 1] + 2 * gray[i + width] + gray[i + width + 1];
      const value = Math.min(255, Math.hypot(gx, gy));
      edges[i] = value;
      sum += value;
    }
  }
  const scale = sum ? edges.length / sum : 1;
  for (let i = 0; i < edges.length; i += 1) edges[i] = Math.min(1, edges[i] * scale);
  return edges;
}

function compareAtOffset(a, b, width, height, dx, dy) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  let samples = 0;
  for (let y = 8; y < height - 8; y += 2) {
    const by = y + dy;
    if (by < 0 || by >= height) continue;
    for (let x = 8; x < width - 8; x += 2) {
      const bx = x + dx;
      if (bx < 0 || bx >= width) continue;
      const av = a[y * width + x];
      const bv = b[by * width + bx];
      dot += av * bv;
      aa += av * av;
      bb += bv * bv;
      samples += 1;
    }
  }
  return samples && aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

function edgeCentroid(edges, width, height) {
  let total = 0;
  let xSum = 0;
  let ySum = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const value = edges[y * width + x];
      total += value;
      xSum += x * value;
      ySum += y * value;
    }
  }
  return total
    ? { x: xSum / total / width, y: ySum / total / height }
    : { x: 0.5, y: 0.5 };
}

self.onmessage = (event) => {
  const { reference, capture, width, height } = event.data;
  const refEdges = sobel(grayscale(reference), width, height);
  const captureEdges = sobel(grayscale(capture), width, height);
  let best = 0;
  for (let dy = -8; dy <= 8; dy += 4) {
    for (let dx = -8; dx <= 8; dx += 4) {
      best = Math.max(best, compareAtOffset(refEdges, captureEdges, width, height, dx, dy));
    }
  }
  const refCenter = edgeCentroid(refEdges, width, height);
  const captureCenter = edgeCentroid(captureEdges, width, height);
  const centerDistance = Math.hypot(
    refCenter.x - captureCenter.x,
    refCenter.y - captureCenter.y,
  );
  const subjectScore = Math.max(0, 1 - centerDistance * 2.6);
  self.postMessage({
    sceneScore: Math.round(Math.max(0, Math.min(1, best)) * 100),
    subjectScore: Math.round(subjectScore * 100),
  });
};
