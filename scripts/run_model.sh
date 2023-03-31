#!/bin/bash

# Should take two arguments, image directory and output directory
IMAGES=$1
OUTPUT=$2

cd ~/Desktop/lama/
export TORCH_HOME=$(pwd) 
export PYTHONPATH=$(pwd)
source inpenv/bin/activate

python3 bin/predict.py model.path=$(pwd)/big-lama indir=$IMAGES outdir=$OUTPUT
