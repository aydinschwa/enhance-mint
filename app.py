import os
import base64
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, send_file, jsonify
from flask_uploads import UploadSet, configure_uploads, ALL
from werkzeug.utils import secure_filename
from shutil import copyfile, rmtree
import sys

app = Flask(__name__)
app.config["DATA_FOLDER"] = "user_data"
app.config["UPLOAD_FOLDER"] = "uploads" 
app.config["EXPORT_FOLDER"] = "exported"
app.config["OUTPUT_FOLDER"] = "output"
ALLOWED_EXTENSIONS = set(["png", "jpg", "jpeg"])


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

@app.route("/")
def index():
    return render_template("index.html")

def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/upload", methods=["POST"])
def upload():

    file = request.files["photo"]
    device_id = request.form.get("deviceId")

    # create output and upload directories if they don't already exist
    output_dir_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['OUTPUT_FOLDER']}"
    os.makedirs(output_dir_path, exist_ok=True)

    upload_dir_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['UPLOAD_FOLDER']}"
    os.makedirs(upload_dir_path, exist_ok=True)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        uploaded_file_path = os.path.join(upload_dir_path, filename)
        file.save(uploaded_file_path)

        # Save the uploaded image as original_mask_0.png in the "output" directory
        original_mask_file = "original_image_mask0.png"
        original_mask_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['OUTPUT_FOLDER']}/{original_mask_file}"
        copyfile(uploaded_file_path, original_mask_path)

        # Check the value of the "action" parameter
        action = request.form.get("action", "erase")
        
        if action == "enhance":
            return redirect(url_for("enhancer", filename=filename, device_id=device_id))

        elif action == "erase":
            # Redirect to the "eraser" route for "erase" action
            return redirect(url_for("eraser", filename=filename, device_id=device_id))

    return redirect(url_for("index"))

@app.route("/eraser/<filename>/<device_id>")
def eraser(filename, device_id):
    return render_template("eraser.html", filename=filename, device_id=device_id)

@app.route("/image/<filename>/<device_id>")
def serve_image(filename, device_id):
    upload_dir_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['UPLOAD_FOLDER']}"
    return send_from_directory(upload_dir_path, filename)

@app.route("/export", methods=["POST"])
def export():
    img_data = request.form["imgData"]
    img_name = request.form["imgName"]
    device_id = request.form["deviceId"]

    # Decode and save the image
    img_data = img_data.split(",")[1]
    img_data = base64.b64decode(img_data)
    img_dir = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['EXPORT_FOLDER']}"
    img_path = f"{img_dir}/{img_name}"

    os.makedirs(img_dir, exist_ok=True)

    with open(img_path, "wb") as f:
        f.write(img_data)

    return "Image saved", 200

@app.route("/process", methods=["POST"])
def process():
    photo_index = request.form["photoIndex"]
    device_id = request.form["deviceId"]
    enhancement_type = request.form["enhancementType"]
    
    if enhancement_type == "erase":
        image_name = f"original_image_mask{photo_index}.png"
        export_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['EXPORT_FOLDER']}"
        output_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['OUTPUT_FOLDER']}/{image_name}"
        os.system(f"scripts/run_lama.sh {export_path} {output_path}") 

        with open(output_path, "rb") as f:
            image_data = f.read()

    elif enhancement_type in ("deblur", "denoise", "upresolve"):
        image_name = f"original_image_mask{photo_index}.png"
        prev_image_name = f"original_image_mask{int(photo_index) - 1}.png"
        image_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['OUTPUT_FOLDER']}/{prev_image_name}"
        output_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['OUTPUT_FOLDER']}/{image_name}"
        os.system(f"scripts/run_nafnet.sh {image_path} {output_path} {enhancement_type}") 

        with open(output_path, "rb") as f:
            image_data = f.read()

    else:
        raise Exception(f"Invalid ML model name: f{enhancement_type}")

    image_b64 = base64.b64encode(image_data).decode("utf-8")

    return {"outputImageB64": image_b64}

@app.route("/enhancer/<filename>/<device_id>")
def enhancer(filename, device_id):
    return render_template("enhancer.html", filename=filename, device_id=device_id)

@app.route("/request_image", methods=["POST"])
def request_image():
    photo_index = request.form["photoIndex"]
    device_id = request.form["deviceId"]
    image_name = f"original_image_mask{photo_index}.png"
    image_path = f"{app.config['DATA_FOLDER']}/{device_id}/{app.config['OUTPUT_FOLDER']}/{image_name}"

    with open(image_path, "rb") as f:
        output_image_data = f.read()

    output_image_b64 = base64.b64encode(output_image_data).decode("utf-8")

    return {"outputImageB64": output_image_b64}


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=80)
