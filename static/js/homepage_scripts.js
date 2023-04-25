function previewImage() {
    const photoInput = document.getElementById("photo");
    const imagePlaceholder = document.getElementById("image-placeholder");

    if (photoInput.files && photoInput.files[0]) {
        const fileReader = new FileReader();

        fileReader.onload = (event) => {
            imagePlaceholder.style.backgroundColor = 'transparent';
            imagePlaceholder.innerHTML = 
            `<img src="${event.target.result}" 
              style="max-width: 700px; max-height: 700px; 
              display: inline-block; vertical-align: middle;">`;
        };

        fileReader.readAsDataURL(photoInput.files[0]);
    }
}
