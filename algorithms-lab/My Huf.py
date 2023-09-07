# imports
import json
import random

import numpy as np
from matplotlib import pyplot as plt

from Utils import Stroke, PYPLOT_CMAPS

# data
CANVAS_WIDTH = 400
CANVAS_HEIGHT = 300
with open('strokes/line_2.json', 'r') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))
    points = stroke.to_py()

# algorithm
rho_max = int(np.ceil(np.sqrt(CANVAS_HEIGHT ** 2 + CANVAS_WIDTH ** 2)))

thetas = np.radians((np.arange(-90, 90)))
rhos = np.arange(-rho_max, rho_max, 1)
accumulator = np.zeros(shape=(rho_max * 2, thetas.size), dtype=np.uint8)

for x, y in points:
    for i, theta in enumerate(thetas):
        rho = int(np.round(x * np.cos(theta) + y * np.sin(theta)))

        accumulator[rho + rho_max][i] += 1

peak_fi = accumulator.argmax()  # TODO: find multiple peaks
rho_i, theta_i = np.unravel_index(peak_fi, accumulator.shape)

theta = thetas[theta_i]
rho = rhos[rho_i]

print(f'Peak: {peak_fi}')
print(f'Theta = {np.degrees(theta):.3f} degrees\nRho = {rho:.3f} pixels')

m = (- np.cos(theta)) / np.sin(theta)
c = (rho / np.sin(theta))

# showing the result
CMAP = random.choice(PYPLOT_CMAPS)

print(f'Colormap: {CMAP}')

canvas_img = np.ones(shape=(CANVAS_HEIGHT, CANVAS_WIDTH, 3), dtype=np.uint8) * 255
stroke.draw_cv(canvas_img)

plt.imshow(canvas_img, cmap=CMAP)
plt.axline((0, c), slope=m, linestyle='--', color='red')
plt.title('Canvas (Image Space)')
plt.tick_params(top=True, labeltop=True, bottom=False, labelbottom=False)

param_space = accumulator.copy().transpose()
param_space = param_space / peak_fi

plt.figure()
plt.imshow(param_space, aspect=1, cmap=CMAP, norm='linear')
plt.xlabel('Angle (degrees)')
plt.ylabel('Distance (pixels)')
plt.title('Parameter Space')

plt.show()
