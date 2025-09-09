require.config({
  paths: {
    vs: "https://unpkg.com/monaco-editor@latest/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  const editor = monaco.editor.create(document.getElementById("container"), {
    value: `<style>
@keyframes casinoLights {
    to {
    stroke-dashoffset: -26;
    }
}

rect {
    stroke-dasharray: 13 13;
    animation: casinoLights 400ms linear infinite;
}
</style>

<rect
    x="200"
    y="200"
    width="300"
    height="200"
    rx="10"
    fill="none"
    stroke="oklch(0.9 0.25 164)"
    stroke-width="5"
/>`,
    language: "html",
    theme: "vs-dark",
    automaticLayout: true,
  });

  const svgContainer = document.getElementById("svgContent");
  const editorContainer = document.getElementById("container");
  const resize = document.getElementById("resize");
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      svgContainer.innerHTML = editor.getValue();
    }
  });

  resize.addEventListener("mousedown", function (e) {
    e.preventDefault();
    let startX = e.clientX;
    let startWidth = parseInt(
      document.defaultView.getComputedStyle(svgContainer).width,
      10
    );
    let startEditorWidth = parseInt(
      document.defaultView.getComputedStyle(editorContainer).width,
      10
    );

    function doDrag(e) {
      let diffX = e.clientX - startX;
      const totalWidth = window.innerWidth;
      svgContainer.style.width =
        Math.min(
          totalWidth * 0.9,
          Math.max(totalWidth * 0.1, startWidth + diffX)
        ) + "px";
      editorContainer.style.width =
        Math.min(
          totalWidth * 0.9,
          Math.max(totalWidth * 0.1, startEditorWidth - diffX)
        ) + "px";
    }

    function stopDrag() {
      document.removeEventListener("mousemove", doDrag, false);
      document.removeEventListener("mouseup", stopDrag, false);
    }

    document.addEventListener("mousemove", doDrag, false);
    document.addEventListener("mouseup", stopDrag, false);
  });

  let initialDistance = 0;
  let origWidth = 1;
  let origHeight = 1;
  let origX = 0;
  let origY = 0;

  svgContainer.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance = getDistance(touch1, touch2);

      let { x, y, width, height } = svgContainer.viewBox.baseVal;
      origX = x;
      origY = y;
      origWidth = width;
      origHeight = height;
    }
  });

  svgContainer.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const newDistance = getDistance(touch1, touch2);

      const zoomFactor =
        initialDistance > newDistance
          ? Math.min(10, initialDistance / newDistance)
          : Math.max(0.1, initialDistance / newDistance);

      const svgPoint = getSVGPoint(getMidpoint(touch1, touch2));
      const newX = svgPoint.x - (svgPoint.x - origX) * zoomFactor;
      const newY = svgPoint.y - (svgPoint.y - origY) * zoomFactor;
      svgContainer.setAttribute(
        "viewBox",
        `${newX} ${newY} ${origWidth * zoomFactor} ${origHeight * zoomFactor}`
      );
    }
  });

  svgContainer.addEventListener("wheel", (e) => {
    e.preventDefault();
    let { x, y, width, height } = svgContainer.viewBox.baseVal;
    const svgPoint = getSVGPoint([e.clientX, e.clientY]);
    let zoomFactor = 0.95;
    let newWidth = width;
    let newHeight = height;

    if (e.deltaY < 0) {
      zoomFactor = 1 / zoomFactor;
    }
    newWidth = width * zoomFactor;
    newHeight = height * zoomFactor;

    const newX = svgPoint.x - (svgPoint.x - x) * zoomFactor;
    const newY = svgPoint.y - (svgPoint.y - y) * zoomFactor;
    svgContainer.setAttribute(
      "viewBox",
      `${newX} ${newY} ${newWidth} ${newHeight}`
    );
  });

  svgContainer.addEventListener("mousedown", function (e) {
    e.preventDefault();
    const startSvgPoint = getSVGPoint([e.clientX, e.clientY]);
    let { x, y, width, height } = svgContainer.viewBox.baseVal;
    origX = x;
    origY = y;
    origWidth = width;
    origHeight = height;

    function translate(e) {
      const currSvgPoint = getSVGPoint([e.clientX, e.clientY]);
      const diffX = currSvgPoint.x - startSvgPoint.x;
      const diffY = currSvgPoint.y - startSvgPoint.y;

      svgContainer.setAttribute(
        "viewBox",
        `${origX - diffX} ${origY - diffY} ${origWidth} ${origHeight}`
      );
    }

    function stoptranslate() {
      document.removeEventListener("mousemove", translate, false);
      document.removeEventListener("mouseup", stoptranslate, false);
    }

    document.addEventListener("mousemove", translate, false);
    document.addEventListener("mouseup", stoptranslate, false);
  });

  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getMidpoint(touch1, touch2) {
    const midx = (touch1.clientX + touch2.clientX) / 2;
    const midy = (touch1.clientY + touch2.clientY) / 2;
    return [midx, midy];
  }

  function getSVGPoint([clientX, clientY]) {
    const svgPoint = svgContainer.createSVGPoint();
    svgPoint.x = clientX;
    svgPoint.y = clientY;

    // Get the transformation matrix from the SVG
    // CTM is the matrix transform applied to convert SVG
    // coordinates to screen coordinates
    // .inverse() inverts the matrix for the reverse transform
    const CTM = svgContainer.getScreenCTM().inverse();
    return svgPoint.matrixTransform(CTM);
  }
});
