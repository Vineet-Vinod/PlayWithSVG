require.config({
  paths: {
    vs: "https://unpkg.com/monaco-editor@latest/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  const editor = monaco.editor.create(document.getElementById("container"), {
    value: `<!--The svg viewbox is set as 0 0 720 720--> 

<style>
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

  const svg_container = document.getElementById("svg_content");
  const editor_container = document.getElementById("container");
  const resize = document.getElementById("resize");
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      console.log(editor.getValue());
      svg_container.innerHTML = editor.getValue();
    }
  });

  resize.addEventListener("mousedown", function (e) {
    e.preventDefault();
    let startX = e.clientX;
    let startWidth = parseInt(
      document.defaultView.getComputedStyle(svg_container).width,
      10
    );
    let startEditorWidth = parseInt(
      document.defaultView.getComputedStyle(editor_container).width,
      10
    );

    function doDrag(e) {
      let diffX = e.clientX - startX;
      const total_width = window.innerWidth;
      svg_container.style.width =
        Math.min(
          total_width * 0.9,
          Math.max(total_width * 0.1, startWidth + diffX)
        ) + "px";
      editor_container.style.width =
        Math.min(
          total_width * 0.9,
          Math.max(total_width * 0.1, startEditorWidth - diffX)
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
  let orig_width = 1;
  let orig_height = 1;
  let orig_x = 0;
  let orig_y = 0;

  svg_container.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance = getDistance(touch1, touch2);

      let { x, y, width, height } = svg_container.viewBox.baseVal;
      orig_x = x;
      orig_y = y;
      orig_width = width;
      orig_height = height;
      console.log(orig_height, orig_width, initialDistance);
    }
  });

  svg_container.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const newDistance = getDistance(touch1, touch2);
      
      const newScale = initialDistance > newDistance ? Math.min(10, initialDistance / newDistance) : Math.max(0.1, initialDistance / newDistance);
      console.log(orig_width * newScale, orig_height * newScale, initialDistance, newDistance);

      svg_container.setAttribute(
        "viewBox",
        `${orig_x} ${orig_y} ${orig_width * newScale} ${orig_height * newScale}`
      );
    }
  });

  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  svg_container.addEventListener("wheel", (e) => {
    e.preventDefault();

    let { x, y, width, height } = svg_container.viewBox.baseVal;

    let zoomFactor = 1.05;
    let newWidth = width;
    let newHeight = height;

    if (e.deltaY < 0) {
      newWidth = width / zoomFactor;
      newHeight = height / zoomFactor;
    } else {
      newWidth = width * zoomFactor;
      newHeight = height * zoomFactor;
    }

    svg_container.setAttribute("viewBox", `${x} ${y} ${newWidth} ${newHeight}`);
  });
});
