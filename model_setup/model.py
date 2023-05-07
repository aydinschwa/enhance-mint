from basicsr.models import create_model
from basicsr.utils import img2tensor as _img2tensor, tensor2img, imwrite
from basicsr.utils.options import parse
import numpy as np
import cv2
import sys
import torch

sys.path.append("/models/NAFNet")


if len(sys.argv) > 1:
    in_dir = sys.argv[1]
    in_dir = "../../" + in_dir
    out_dir = sys.argv[2]
    out_dir = "../../" + out_dir
    model_name = sys.argv[3]


def imread(img_path):
  img = cv2.imread(img_path)
  img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
  return img
def img2tensor(img, bgr2rgb=False, float32=True):
    img = img.astype(np.float32) / 255.
    return _img2tensor(img, bgr2rgb=bgr2rgb, float32=float32)


def single_image_inference(model, img, save_path):
      model.feed_data(data={'lq': img.unsqueeze(dim=0)})

      if model.opt['val'].get('grids', False):
          model.grids()

      model.test()

      if model.opt['val'].get('grids', False):
          model.grids_inverse()

      visuals = model.get_current_visuals()
      sr_img = tensor2img([visuals['result']])
      imwrite(sr_img, save_path)


def stereo_image_inference(model, img_l, img_r, save_path):
      img = torch.cat([img_l, img_r], dim=0)
      model.feed_data(data={'lq': img.unsqueeze(dim=0)})

      if model.opt['val'].get('grids', False):
          model.grids()

      model.test()

      if model.opt['val'].get('grids', False):
          model.grids_inverse()

      visuals = model.get_current_visuals()
      img_L = visuals['result'][:,:3]
      img_R = visuals['result'][:,3:]
      img_L, img_R = tensor2img([img_L, img_R])
      
      imwrite(img_L, save_path.format('L'))
      imwrite(img_R, save_path.format('R'))


img_input = imread(in_dir)
inp = img2tensor(img_input)

# single image deblur
if model_name == "deblur":
    opt_path = 'options/test/REDS/NAFNet-width64.yml'
    opt = parse(opt_path, is_train=False)
    opt['dist'] = False
    model = create_model(opt)
    single_image_inference(model, inp, out_dir)

# single image denoise
elif model_name == "denoise":
    opt_path = 'options/test/SIDD/NAFNet-width64.yml'
    opt = parse(opt_path, is_train=False)
    opt['dist'] = False
    model = create_model(opt)
    single_image_inference(model, inp, out_dir)

# stereo super resolution
elif model_name == "upresolve":
    opt_path = 'options/test/NAFSSR/NAFSSR-L_4x.yml'
    opt = parse(opt_path, is_train=False)
    opt['dist'] = False
    model = create_model(opt)
    stereo_image_inference(model, inp, inp, out_dir)

else:
    raise Exception(f"missing model name: {model_name}")



