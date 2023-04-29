const maxImageWidth = window.appConfig.maxImageWidth;
const maxImageHeight = window.appConfig.maxImageHeight;
const amplifyEdgeButton = document.getElementById("amplify_edges");
const blurButton = document.getElementById("blur");
const smoothButton = document.getElementById("smooth");
const increaseColorButton = document.getElementById("increase_color");
const increaseContrastButton = document.getElementById("increase_contrast");
const sharpenButton = document.getElementById("sharpen");
const brightenButton = document.getElementById("brighten");
const darkenButton = document.getElementById("darken");
const autoEnhanceButton = document.getElementById("auto_enhance");
const enhanceButtons = document.querySelectorAll("button");
const saveImageButton = document.getElementById("saveImage");
const imgElement = document.querySelectorAll("img")[1];
const imageUrl = imgElement.getAttribute("src");

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

enhanceButtons.forEach((button) => {
    if (button.id !== "saveImage") {
    button.addEventListener("click", () => {
        const function_name = button.id;

        fetch(`/enhance/${function_name}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (!response.ok) {
                console.log(response)
                throw new Error("An error occurred");
            }
            return response.json();
        })
        .then(data => {
            imgElement.src = `data:image/png;base64,${data.imgData}`;
        })
        .catch(error => {
            console.error("Error:", error);
        });
    });
    }
});

saveImageButton.addEventListener('click', function() {
    const image = document.querySelector('img');
    saveImageButton.href = image.src;
    saveImageButton.download = 'photo_enhanced';
});
