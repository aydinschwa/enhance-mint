#!/bin/bash

# Should take three arguments, image directory, output directory, and model type
IMAGE_PATH=$1
OUTPUT_PATH=$2
MODEL=$3

# clone NAFNet if it's not already in models
if [ ! -d "models/NAFNet" ]; then
    echo "Cloning NAFNet..."
    source venv/bin/activate
    cd models
    git clone https://github.com/megvii-research/NAFNet
    # change files of NAFNet so that it works on my machine
    cp ../model_setup/NAFNet/model.py NAFNet
    cp ../model_setup/NAFNet/setup.py NAFNet
    cp ../model_setup/NAFNet/base_model.py NAFNet/basicsr/models/base_model.py
    cd NAFNet
    python3 setup.py develop --no_cuda_ext

    # install gdown
    pip install -U --no-cache-dir gdown --pre
    # deblur model
    gdown 'https://drive.google.com/uc?id=14D4V4raNYIOhETfcuuLI3bGLB-OYIv6X' -O ./experiments/pretrained_models/

    # denoise model
    gdown 'https://drive.google.com/uc?id=14Fht1QQJ2gMlk4N1ERCRuElg8JfjrWWR' -O ./experiments/pretrained_models/

    # super resolution model
    gdown https://drive.google.com/uc?id=1TIdQhPtBrZb2wrBdAp9l8NHINLeExOwb -O ./experiments/pretrained_models/

else
    cd models/NAFNet
fi

# creates virtual environment if one doesn't already exist. I really need to use docker...
if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv'"
    python -m virtualenv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install torch
    pip install torchvision
else
    source venv/bin/activate
fi

python model.py $IMAGE_PATH $OUTPUT_PATH $MODEL
