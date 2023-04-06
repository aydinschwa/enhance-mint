import os
import subprocess
import base64
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, send_file
from flask_uploads import UploadSet, configure_uploads, ALL
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["UPLOADED_PHOTOS_DEST"] = "uploads"
app.config["EXPORT_FOLDER"] = "/Users/Aydin/Desktop/lama_app/exported"
app.config["OUTPUT_FOLDER"] = "/Users/Aydin/Desktop/lama_app/output"

# Configure file uploads
photos = UploadSet("photos", ALL)
configure_uploads(app, photos)

RUN_MODEL=False
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
        return redirect(url_for("uploaded_file", filename=filename))

    return redirect(url_for("index"))

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return render_template("uploaded.html", filename=filename)

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
    output_image_name = "original_image_mask.png" 

    script_path = os.path.join(os.getcwd(), "scripts/run_model.sh")


    if RUN_MODEL:
        make_prediction(model, predict_config) 

    # Call the shell script with the input image directory and output directory
    #TODO: change name of image output to actually be output_image_name
    else:
        subprocess.run([script_path, input_image_dir, output_dir], check=True)

    output_image_path = os.path.join(output_dir, output_image_name)

    with open(output_image_path, "rb") as f:
        output_image_data = f.read()

    output_image_b64 = base64.b64encode(output_image_data).decode("utf-8")

    return {"outputImageB64": output_image_b64}


if __name__ == "__main__":
    app.run(debug=True)
