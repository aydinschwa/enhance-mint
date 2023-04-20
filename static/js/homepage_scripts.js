function previewImage() {
    const photoInput = document.getElementById("photo");
    const imagePlaceholder = document.getElementById("image-placeholder");

    if (photoInput.files && photoInput.files[0]) {
        const fileReader = new FileReader();

        fileReader.onload = function (event) {
            imagePlaceholder.style.backgroundColor = 'transparent';
            imagePlaceholder.innerHTML = 
            `<img src="${event.target.result}" 
              style="max-width: 500px; max-height: 500px; 
              display: inline-block; vertical-align: middle;">`;
        };

        fileReader.readAsDataURL(photoInput.files[0]);
    }
}
