const maxImageWidth = window.appConfig.maxImageWidth;
const maxImageHeight = window.appConfig.maxImageHeight;
const imgElement = document.querySelector("#image-container img");
const imageUrl = imgElement.getAttribute("src");
const saveImageButton = document.getElementById("saveImage");
const brightnessSlider = document.getElementById("brightness");
const saturationSlider = document.getElementById("saturation");
const exposureSlider = document.getElementById("exposure");
const sharpenSlider = document.getElementById("sharpen");
const vibranceSlider = document.getElementById("vibrance");
const noiseSlider = document.getElementById("noise");
const sepiaSlider = document.getElementById("sepia");
const resetButton = document.getElementById("resetFilters")

// resize image if it's larger than maxWidth, maxHeight 
const imgRatio = imgElement.width / imgElement.height;
let newWidth = imgElement.width;
let newHeight = imgElement.height;

if (imgElement.width > maxImageWidth) {
newWidth = maxImageWidth;
newHeight = newWidth / imgRatio;
}

if (newHeight > maxImageHeight) {
newHeight = maxImageHeight;
newWidth = newHeight * imgRatio;
}

imgElement.width = newWidth;
imgElement.height = newHeight;

saveImageButton.addEventListener('click', function() {
    saveImageButton.href = imgElement.src;
    saveImageButton.download = 'photo_enhanced';
});

function applyEffects() {

    const imgElement = document.querySelector("#image-container img") || document.querySelector("#image-container canvas");
    Caman(imgElement, function () {
      this.revert(false);
      this.brightness(brightnessSlider.value);
      this.vibrance(vibranceSlider.value);
      this.saturation(saturationSlider.value);
      this.exposure(exposureSlider.value);
      this.sharpen(sharpenSlider.value);
      this.noise(noiseSlider.value);
      this.sepia(sepia.value);
      this.render();
    });
  }
  
// Event listeners for sliders
brightnessSlider.addEventListener("change", applyEffects);
saturationSlider.addEventListener("change", applyEffects);
exposureSlider.addEventListener("change", applyEffects);
sharpenSlider.addEventListener("change", applyEffects);
vibranceSlider.addEventListener("change", applyEffects);
noiseSlider.addEventListener("change", applyEffects);
sepiaSlider.addEventListener("change", applyEffects);


resetButton.addEventListener("click", () => {
    brightnessSlider.value = 0;
    saturationSlider.value = 0;
    exposureSlider.value = 0;
    sharpenSlider.value = 0;
    vibranceSlider.value = 0;
    noiseSlider.value = 0;
    sepiaSlider.value = 0;
    const imgElement = document.querySelector("#image-container img") || document.querySelector("#image-container canvas");
    Caman(imgElement, function () {
      this.revert(false);
      this.brightness(brightnessSlider.value);
      this.vibrance(vibranceSlider.value);
      this.saturation(saturationSlider.value);
      this.exposure(exposureSlider.value);
      this.sharpen(sharpenSlider.value);
      this.noise(noiseSlider.value);
      this.sepia(sepia.value);
      this.render();
    });
})