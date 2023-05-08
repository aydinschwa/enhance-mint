#!/bin/bash

# Should take two arguments, image directory and output directory
IMAGES=$(pwd)/$1
OUTPUT=$(pwd)/$2

# clone LaMa if it's not already in models
if [ ! -d "models/lama" ]; then
    echo "Cloning LaMa..."
    source venv/bin/activate
    cd models
    git clone https://github.com/advimman/lama
    
    # change files of LaMa so that it works on my machine
    cp ../model_setup/LaMa/predict.py lama 
    cp ../model_setup/LaMa/requirements.txt lama 
    cd lama

    # download lama model
    pip3 install wldhx.yadisk-direct
    curl -L $(yadisk-direct https://disk.yandex.ru/d/ouP6l8VJ0HpMZg) -o big-lama.zip
    unzip big-lama.zip
    
else
    cd models/lama
fi

# creates virtual environment if one doesn't already exist. I really need to use docker...
if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv'"
    python -m virtualenv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install torch torchvision
else
    source venv/bin/activate
fi

export TORCH_HOME=$(pwd) 
export PYTHONPATH=$(pwd)
python3 predict.py model.path=$(pwd)/big-lama indir=$IMAGES outdir=$OUTPUT
