import os
import subprocess
import base64
import io
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, send_file
from flask_uploads import UploadSet, configure_uploads, ALL
from werkzeug.utils import secure_filename
from shutil import copyfile

app = Flask(__name__)
app.config["UPLOADED_PHOTOS_DEST"] = "uploads/"
app.config["EXPORT_FOLDER"] = "exported/"
app.config["OUTPUT_FOLDER"] = "output/"

# Configure file uploads
photos = UploadSet("photos", ALL)
configure_uploads(app, photos)

# Clear output directory
files = os.listdir(app.config["OUTPUT_FOLDER"])
for file in files:
    if file != ".gitignore":
        file_path = os.path.join(app.config["OUTPUT_FOLDER"], file)
        os.unlink(file_path)

picture_instance = None
RUN_MODEL = True
# set model as global variable
if RUN_MODEL:
    from models.lama.lama import get_model_instance, make_prediction
    model, predict_config = get_model_instance()

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload():
    if "photo" not in request.files:
        return redirect(request.url)

    file = request.files["photo"]
    if file.filename == "":
        return redirect(request.url)

    if file and photos.file_allowed(file, file.filename):
        filename = photos.save(file)

        # Save the uploaded image as original_mask_0.png in the "output" directory
        original_mask_file = secure_filename("original_image_mask0.png")
        original_mask_path = os.path.join(app.config["OUTPUT_FOLDER"], original_mask_file)
        uploaded_image_path = os.path.join(app.config["UPLOADED_PHOTOS_DEST"], filename)
        copyfile(uploaded_image_path, original_mask_path)

        # Check the value of the "action" parameter
        action = request.form.get("action", "erase")
        if action == "enhance":
            return redirect(url_for("enhancer", filename=filename))

        elif action == "erase":
            # Redirect to the "uploaded_file" route for "erase" action
            return redirect(url_for("uploaded_file", filename=filename))

    return redirect(url_for("index"))

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return render_template("eraser.html", filename=filename)

@app.route("/image/<filename>")
def serve_image(filename):
    return send_from_directory(app.config["UPLOADED_PHOTOS_DEST"], filename)

@app.route("/output/<filename>")
def serve_output(filename):
    return send_from_directory("output", filename)

@app.route("/export", methods=["POST"])
def export():
    img_data = request.form["imgData"]
    img_type = request.form["imgType"]
    img_name = request.form["imgName"]

    # Decode and save the image
    img_data = img_data.split(",")[1]
    img_data = base64.b64decode(img_data)
    img_path = os.path.join(app.config["EXPORT_FOLDER"], secure_filename(img_name))

    with open(img_path, "wb") as f:
        f.write(img_data)

    return "Image saved", 200

@app.route("/process", methods=["POST"])
def process():
    input_image_dir = app.config["EXPORT_FOLDER"] 
    output_dir = app.config["OUTPUT_FOLDER"] 
    os.makedirs(output_dir, exist_ok=True)
    stack_position = request.form["stackPos"]

    script_path = os.path.join(os.getcwd(), "scripts/run_model.sh")

    if RUN_MODEL:
        make_prediction(model, predict_config, stack_position) 

    else:
        subprocess.run([script_path, input_image_dir, output_dir], check=True)

    output_image_name = f"original_image_mask{stack_position}.png" 
    output_image_path = os.path.join(output_dir, output_image_name)

    with open(output_image_path, "rb") as f:
        output_image_data = f.read()

    output_image_b64 = base64.b64encode(output_image_data).decode("utf-8")

    return {"outputImageB64": output_image_b64}


@app.route("/enhancer/<filename>")
def enhancer(filename):
    return render_template("enhancer.html", filename=filename)


if __name__ == "__main__":
    app.run(debug=True)
