const maxImageWidth = window.myAppConfig.maxImageWidth;
const maxImageHeight = window.myAppConfig.maxImageHeight;
const imageCanvas = document.getElementById("imageCanvas");
const drawCanvas = document.getElementById("drawCanvas");
const imageCtx = imageCanvas.getContext("2d");
const drawCtx = drawCanvas.getContext("2d");
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const brushSizeInput = document.getElementById("brushSize");
const undoStrokeButton = document.getElementById("undoStroke");
const undoImageButton = document.getElementById("undoErase");
const processImageButton = document.getElementById("processImage");
const saveImageButton = document.getElementById("saveImage");
const resetImageButton = document.getElementById("resetImage");
const r = 255;
const g = 102;
const b = 102; 
const brushColor = `rgb(${r}, ${g}, ${b})`;

const canvasContainer = document.getElementById("canvasContainer");
const imageUrl = canvasContainer.getAttribute("data-image-url");
let photoIndex = 0;

const image = new Image();
image.src = imageUrl;
image.onload = () => {
  const imgRatio = image.width / image.height;
  let newWidth = image.width;
  let newHeight = image.height;
  
  if (image.width > maxImageWidth) {
    newWidth = maxImageWidth;
    newHeight = newWidth / imgRatio;
  }

  if (newHeight > maxImageHeight) {
    newHeight = maxImageHeight;
    newWidth = newHeight * imgRatio;
  }

  imageCanvas.width = newWidth;
  imageCanvas.height = newHeight;
  drawCanvas.width = newWidth;
  drawCanvas.height = newHeight;
  previewCanvas.width = newWidth;
  previewCanvas.height = newHeight;
  imageCtx.drawImage(image, 0, 0, newWidth, newHeight);
  
  canvasContainer.style.height = `${newHeight}px`
  canvasContainer.style.width = `${newWidth}px` 

};

let drawing = false;
let paths = [];
let currentPath = [];

drawCanvas.addEventListener("mousedown", (event) => {
    drawing = true;
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";
    drawCtx.lineWidth = brushSizeInput.value;
    drawCtx.strokeStyle = brushColor;
    drawCtx.globalCompositeOperation = "source-over";
    drawCtx.beginPath();
    const xPos = event.clientX - drawCanvas.getBoundingClientRect().left;
    const yPos = event.clientY - drawCanvas.getBoundingClientRect().top;
    drawCtx.moveTo(xPos, yPos);
    currentPath.push({ x: xPos, y: yPos, size: drawCtx.lineWidth });
});

drawCanvas.addEventListener("mousemove", (event) => {
    if (drawing) {
      const xPos = event.clientX - drawCanvas.getBoundingClientRect().left;
      const yPos = event.clientY - drawCanvas.getBoundingClientRect().top;
      drawCtx.lineWidth = brushSizeInput.value;
      drawCtx.lineTo(xPos, yPos);
      drawCtx.stroke();
      currentPath.push({ x: xPos, y: yPos, size: drawCtx.lineWidth });
    }
    const xPos = event.clientX - previewCanvas.getBoundingClientRect().left;
    const yPos = event.clientY - previewCanvas.getBoundingClientRect().top;
    const brushSize = brushSizeInput.value;
    drawBrushPreview(xPos, yPos, brushSize);
});

drawCanvas.addEventListener("mouseup", () => {
    if (drawing) {
        paths.push(currentPath);
        currentPath = [];
    }
    drawing = false;
});

drawCanvas.addEventListener("mouseout", () => {
    drawing = false;
    clearBrushPreview();
});

brushSizeInput.addEventListener("input", () => {
drawCtx.lineWidth = brushSizeInput.value;
});

undoStrokeButton.addEventListener("click", () => {
    paths.pop();
    redraw();
});

undoImageButton.addEventListener("click", () => {
  if (photoIndex > 0) {
      loadPreviousImage();
  }
})

resetImageButton.addEventListener("click", () => {
  photoIndex = 0;
  loadPreviousImage();
})

saveImageButton.addEventListener("click", () => {
  let dataURL = imageCanvas.toDataURL("image/png");
  saveImageButton.href = dataURL;
})

async function loadPreviousImage() {
  try {
    if (photoIndex !== 0) {photoIndex -= 1;}

    const response = await fetch(`/output/original_image_mask${photoIndex}.png`);

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    image.src = imageUrl;

    // Clear the draw canvas
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    paths = []; // Reset the stored paths
    
  } catch (error) {
    console.error(`Error loading previous image: ${error}`);
  }
}

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

async function saveImage(canvas, imgType, imgName) {
    const imageData = canvas.toDataURL(imgType);
    const data = new URLSearchParams();
    data.append("imgData", imageData);
    data.append("imgType", imgType);
    data.append("imgName", imgName);

    try {
    const response = await fetch("/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }
  catch (error) {
    console.error(`Error Saving Image: ${error}`)
  }
}

function prepareCanvasForExport(canvas) {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");

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

function toggleSpinner(visible) {
  const spinner = document.getElementById("spinner");
  spinner.hidden = !visible;
}

processImageButton.addEventListener("click", async () => {
  toggleSpinner(true);
  saveImage(imageCanvas, "image/png", "original_image.png");
  const preparedCanvas = prepareCanvasForExport(drawCanvas);
  saveImage(preparedCanvas, "image/png", "original_image_mask.png");

  try {
    photoIndex += 1;
    const posData = new URLSearchParams();
    posData.append("stackPos", photoIndex);
    const response = await fetch("/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: posData
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const outputImageB64 = data.outputImageB64;

    // Clear the draw canvas
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    paths = []; // Reset the stored paths

    // Update the image source with the new image
    image.src = "data:image/png;base64," + outputImageB64;

    toggleSpinner(false);

  } catch (error) {
    photoIndex -= 1;
    console.error("Error processing image:", error);
    toggleSpinner(false);
  }
});

function drawBrushPreview(x, y, size) {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.strokeStyle = brushColor;
  previewCtx.beginPath();
  previewCtx.arc(x, y, size / 2, 0, Math.PI * 2);
  previewCtx.stroke();
  previewCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`; 
  previewCtx.fill(); 
}

function clearBrushPreview() {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}
