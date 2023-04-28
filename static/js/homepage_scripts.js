const maxImageWidth = window.appConfig.maxImageWidth;
const maxImageHeight = window.appConfig.maxImageHeight;

function previewImage() {
    const photoInput = document.getElementById("photo");
    const imagePlaceholder = document.getElementById("image-placeholder");
    const buttons = document.querySelectorAll('button.hide');
    var label = document.querySelector('label[for="photo"]');

    if (photoInput.files && photoInput.files[0]) {
        const fileReader = new FileReader();

        fileReader.onload = (event) => {
            imagePlaceholder.style.backgroundColor = 'transparent';
            imagePlaceholder.innerHTML =
            `<img src="${event.target.result}"
              style="max-width: ${maxImageWidth}px; max-height: ${maxImageHeight}px;
              display: inline-block; vertical-align: middle;">`;
            buttons.forEach(button => button.classList.remove('hide'));
            label.textContent = 'Upload Different Image';
        };

        fileReader.readAsDataURL(photoInput.files[0]);
    }
}
