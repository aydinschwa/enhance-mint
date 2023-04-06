#!/bin/bash

# Should take two arguments, image directory and output directory
IMAGES=$1
OUTPUT=$2

cd models/lama

export TORCH_HOME=$(pwd) 
export PYTHONPATH=$(pwd)
python3 predict.py model.path=$(pwd)/big-lama indir=$IMAGES outdir=$OUTPUT
