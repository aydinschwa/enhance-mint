const imageCanvas = document.getElementById('imageCanvas');
const drawCanvas = document.getElementById('drawCanvas');
const imageCtx = imageCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');
const maxCanvasWidth = 800;
const maxCanvasHeight = 600;
const brushSizeInput = document.getElementById('brushSize');
const undoButton = document.getElementById('undo');
const r = 255;
const g = 102;
const b = 102; 
const brushColor = `rgb(${r}, ${g}, ${b})`;
console.log(brushColor);

const canvasContainer = document.getElementById('canvasContainer');
const imageUrl = canvasContainer.getAttribute('data-image-url');

const image = new Image();
image.src = imageUrl;
image.onload = function () {
  const imgRatio = image.width / image.height;
  let newWidth = image.width;
  let newHeight = image.height;
  const maxCanvasWidth = 600;
  const maxCanvasHeight = 600;

  if (image.width > maxCanvasWidth) {
    newWidth = maxCanvasWidth;
    newHeight = newWidth / imgRatio;
  }

  if (newHeight > maxCanvasHeight) {
    newHeight = maxCanvasHeight;
    newWidth = newHeight * imgRatio;
  }

  imageCanvas.width = newWidth;
  imageCanvas.height = newHeight;
  drawCanvas.width = newWidth;
  drawCanvas.height = newHeight;
  imageCtx.drawImage(image, 0, 0, newWidth, newHeight);
};

let drawing = false;
let paths = [];
let currentPath = [];

drawCanvas.addEventListener('mousedown', function (event) {
    drawing = true;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.lineWidth = brushSizeInput.value;
    drawCtx.strokeStyle = brushColor;
    drawCtx.globalCompositeOperation = 'source-over';
    drawCtx.beginPath();
    const xPos = event.clientX - drawCanvas.getBoundingClientRect().left;
    const yPos = event.clientY - drawCanvas.getBoundingClientRect().top;
    drawCtx.moveTo(xPos, yPos);
    currentPath.push({ x: xPos, y: yPos, size: drawCtx.lineWidth });
});

drawCanvas.addEventListener('mousemove', function (event) {
    if (!drawing) return;
    const xPos = event.clientX - drawCanvas.getBoundingClientRect().left;
    const yPos = event.clientY - drawCanvas.getBoundingClientRect().top;
    drawCtx.lineWidth = brushSizeInput.value;
    drawCtx.lineTo(xPos, yPos);
    drawCtx.stroke();
    currentPath.push({ x: xPos, y: yPos, size: drawCtx.lineWidth });
});

drawCanvas.addEventListener('mouseup', function () {
    if (drawing) {
        paths.push(currentPath);
        currentPath = [];
    }
    drawing = false;
});

drawCanvas.addEventListener('mouseout', function () {
    drawing = false;
});

undoButton.addEventListener('click', function () {
    paths.pop();
    redraw();
});

brushSizeInput.addEventListener('input', function () {
drawCtx.lineWidth = brushSizeInput.value;
});

function redraw() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    for (const path of paths) {
        drawCtx.beginPath();
        const startPoint = path[0];
        drawCtx.moveTo(startPoint.x, startPoint.y);
        drawCtx.lineWidth = startPoint.size;

        for (const point of path.slice(1)) {
            drawCtx.lineTo(point.x, point.y);
            drawCtx.lineWidth = point.size;
            drawCtx.stroke();
        }
    }
}

function saveImage(canvas, imgType, imgName) {
    const imageData = canvas.toDataURL(imgType);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/export', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send('imgData=' + encodeURIComponent(imageData) + '&imgType=' + encodeURIComponent(imgType) + '&imgName=' + encodeURIComponent(imgName));
}

function prepareCanvasForExport(canvas) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    // Draw the original canvas content onto the exportCanvas
    exportCtx.drawImage(canvas, 0, 0);

    // Create an ImageData object from the exportCanvas
    const imageData = exportCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
    const data = imageData.data;

    // Iterate through the pixel data and set the mask colors
    for (let i = 0; i < data.length; i += 4) {
        // If the pixel is black (brush color), set it to white
        if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
            data[i] = 255;     // Red channel
            data[i + 1] = 255; // Green channel
            data[i + 2] = 255; // Blue channel
        } else {
            // If the pixel is not black, set it to black
            data[i] = 0;       // Red channel
            data[i + 1] = 0;   // Green channel
            data[i + 2] = 0;   // Blue channel
        }
    }

    // Put the modified ImageData back onto the exportCanvas
    exportCtx.putImageData(imageData, 0, 0);

    return exportCanvas;
}

// Add a function to show/hide the spinner
function toggleSpinner(visible) {
  const spinner = document.getElementById("spinner");
  spinner.hidden = !visible;
}

const processImageButton = document.getElementById("processImage");

processImageButton.addEventListener("click", function () {
  toggleSpinner(true);
  saveImage(imageCanvas, 'image/png', 'original_image.png');
  const preparedCanvas = prepareCanvasForExport(drawCanvas);
  saveImage(preparedCanvas, 'image/png', 'original_image_mask.png');

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/process", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const outputImageB64 = response.outputImageB64;

      // Clear the draw canvas
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      paths = []; // Reset the stored paths

      // Update the image source with the new image
      image.src = "data:image/png;base64," + outputImageB64;

      toggleSpinner(false);
    }
  };
  xhr.send("inputImagePath=" + encodeURIComponent(imageUrl));
});

