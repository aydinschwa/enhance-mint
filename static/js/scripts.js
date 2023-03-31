const imageCanvas = document.getElementById('imageCanvas');
const drawCanvas = document.getElementById('drawCanvas');
const imageCtx = imageCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');
const maxCanvasWidth = 800;
const maxCanvasHeight = 600;
const brushSizeInput = document.getElementById('brushSize');
const undoButton = document.getElementById('undo');
const brushColor = "rgba(255, 102, 102, 0.5)";
const brushAlpha = 0.5;

const canvasContainer = document.getElementById('canvasContainer');
const imageUrl = canvasContainer.getAttribute('data-image-url');

const image = new Image();
image.src = imageUrl;
image.onload = function () {
    const imgRatio = image.width / image.height;
let newWidth = image.width;
let newHeight = image.height;

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
    drawCtx.lineWidth = brushSizeInput.value;
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
    drawCtx.lineCap = 'round';

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
        if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
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

const processImageButton = document.getElementById("processImage");

processImageButton.addEventListener("click", function () {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/process", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const outputImagePath = response.outputImagePath;
      image.src = outputImagePath;
      image.onload = function () {
        imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        imageCtx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);
      };
    }
  };
  xhr.send("inputImagePath=" + encodeURIComponent(imageUrl));
});

function updateImageWithProcessed(filename) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/processed_image/${filename}`);
    xhr.responseType = "blob";
  
    xhr.onload = function () {
      if (xhr.status === 200) {
        const imageBlob = xhr.response;
        const imageUrl = URL.createObjectURL(imageBlob);
        image.src = imageUrl;
      } else {
        console.error("Error fetching the processed image:", xhr.statusText);
      }
    };
  
    xhr.onerror = function () {
      console.error("Error fetching the processed image:", xhr.statusText);
    };
  
    xhr.send();
  }
