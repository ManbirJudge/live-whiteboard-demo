# imports
import json
import random
from typing import Tuple, List

import cv2
import numpy as np
from matplotlib import pyplot as plt
from skimage.feature import peak_local_max

from Utils import Stroke, PYPLOT_CMAPS

# data
CANVAS_WIDTH = 400
CANVAS_HEIGHT = 300
with open('strokes/line_2.json', 'r') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))
    points = stroke.to_py()

canvas_img = np.ones(shape=(CANVAS_HEIGHT, CANVAS_WIDTH, 3), dtype=np.uint8) * 255
stroke.draw_cv(canvas_img)

# algorithm
edges = cv2.bitwise_not(
    cv2.threshold(
        cv2.cvtColor(
            canvas_img,
            cv2.COLOR_BGR2GRAY
        ),
        10.0,
        255,
        type=cv2.THRESH_BINARY
    )[1]
) / 255

rho_max = int(np.ceil(np.sqrt(CANVAS_HEIGHT ** 2 + CANVAS_WIDTH ** 2)))

thetas = np.radians((np.arange(-90, 90)))
rhos = np.arange(-rho_max, rho_max, 1)
accumulator = np.zeros(shape=(rho_max * 2, thetas.size), dtype=np.uint8)


for y, column in enumerate(edges):
    for x, row in enumerate(column):
        if row == 0:
            continue

        for k, theta in enumerate(thetas):
            rho = int(np.round(x * np.cos(theta) + y * np.sin(theta)))

            accumulator[rho + rho_max][k] += 1

peaks = peak_local_max(accumulator.flatten(), min_distance=500, threshold_rel=0.9, threshold_abs=1)
# peaks = [[accumulator.argmax()]]
peak_thetas: List[float] = []
peak_rhos: List[float] = []
lines_params: List[Tuple[float, float]] = []

print(f'Number of peaks: {len(peaks)}')

for peak_fi in peaks:
    peak_fi = peak_fi[0]

    rho_i, theta_i = np.unravel_index(peak_fi, accumulator.shape)

    theta = thetas[theta_i]
    rho = rhos[rho_i]

    # print(f'Peak: {peak_fi}')
    # print(f'Theta = {np.degrees(theta):.3f} degrees\nRho = {rho:.3f} pixels')

    m = (- np.cos(theta)) / np.sin(theta)
    c = (rho / np.sin(theta))

    peak_thetas.append(theta_i)
    peak_rhos.append(rho_i)

    lines_params.append((m, c))

# showing the result
CMAP = random.choice(PYPLOT_CMAPS)

print(f'Colormap: {CMAP}')

plt.imshow(canvas_img, cmap=CMAP)
for m, c in lines_params:
    plt.axline((0, c), slope=m, linestyle='-', color='red')
plt.title('Canvas (Image Space)')
plt.tick_params(top=True, labeltop=True, bottom=False, labelbottom=False)

param_space = accumulator.copy().transpose()
param_space = param_space / np.max(accumulator)

plt.figure()
plt.imshow(param_space, aspect=1, norm='linear', cmap=CMAP)
plt.scatter(peak_rhos, peak_thetas)
plt.xlabel('Angle (degrees)')
plt.ylabel('Distance (pixels)')
plt.title('Parameter Space')

plt.show()
