# EnhanceMINT

EnhanceMINT is an AI-powered web application that aims to make high-quality photo enhancement features available to the general public. Currently the app allows users to erase unwanted objects or enhance the quality of their images.

## Features

- Upload an image and apply background erasing
- Enhance the image using different enhancement options
- Undo and reset transformations
- Save the processed image

## Installation

0. Ensure you have git-lfs enabled:

We intend to host the model in the cloud, but haven't implemented this yet. In the meantime, we're hosting the model using git Large File Storage. If you don't already have git-lfs, please follow the instructions set it up [here](https://git-lfs.com/).

1. Clone the repository:

```bash
git clone https://github.com/aydinschwa/enhance-mint
```

2. Change into the project directory:

```bash
cd EnhanceMINT
```

3. Install the required Python packages:

```bash
pip install -r requirements.txt
```

4. Run the application:

```bash
python app.py
```

The application will start running on `http://127.0.0.1:5000/` by default. Open the URL in your web browser to access the EnhanceMINT web application.

## Usage

1. Open the application in your web browser.
2. Click "Upload Image" and choose an image from your computer.
3. Select either the "Erase" or "Enhance" option to apply the desired transformation.
4. Interact with the image using the available controls, such as brush size, undo, and reset.
5. When you're satisfied with the result, click "Save Image" to download the processed image.
6. To process another image, click "Upload another image."

## File Structure

- `app.py`: The main Flask application script.
- `index.html`: The homepage HTML template.
- `eraser.html`: The eraser page HTML template.
- `static/`: Contains static files such as CSS and JavaScript files.
- `uploads/`: The directory where uploaded images are stored.
- `exported/`: The directory where processed images are stored.
- `output/`: The directory where intermediate output images are stored.
- `enhancer.py`: Contains the `Picture` class for image enhancement.
- `models/`: Contains the LAMA model for image processing.
- `scripts/`: Contains the shell script for running the model.
