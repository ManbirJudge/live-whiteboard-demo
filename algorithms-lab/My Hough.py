# imports
import json
from typing import Tuple, List
import time

import cv2
import numpy as np
from matplotlib import pyplot as plt
from skimage.feature import peak_local_max

from Utils import Stroke

# data
start_time = time.time_ns()

CANVAS_WIDTH = 400
CANVAS_HEIGHT = 300

with open('strokes/line_1.json', 'r') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))
    points = stroke.to_py()

canvas = np.ones(shape=(CANVAS_HEIGHT, CANVAS_WIDTH, 3), dtype=np.uint8) * 255
stroke.draw_cv(canvas)

# hough transform
edges = cv2.bitwise_not(
    cv2.threshold(
        cv2.cvtColor(
            canvas,
            cv2.COLOR_BGR2GRAY
        ),
        10.0,
        255,
        type=cv2.THRESH_BINARY
    )[1]
) / 255

rho_max = int(np.ceil(np.sqrt(CANVAS_HEIGHT ** 2 + CANVAS_WIDTH ** 2)))

thetas = np.linspace(
    start=-np.pi / 2,
    stop=np.pi / 2,
    num=360,
    endpoint=False
)  # OR -> thetas = np.radians((np.arange(-90, 90, 0.5)))
rhos = np.arange(-rho_max, rho_max, 1)
accumulator = np.zeros(shape=(rho_max * 2, thetas.size), dtype=np.uint8)

for y, column in enumerate(edges):
    for x, row in enumerate(column):
        if row == 0:
            continue

        for i, theta in enumerate(thetas):
            rho = int(np.round(x * np.cos(theta) + y * np.sin(theta)))

            accumulator[rho + rho_max][i] += 1

# peak calculation
peaks = peak_local_max(
    accumulator.flatten(),
    min_distance=500,
    threshold_rel=0.9,
    threshold_abs=1
)

# performance
end_time = time.time_ns()
duration = end_time - start_time

print(f'Took {(duration/1e+6):.2f} ms in total.')

# showing the result
peak_thetas: List[float] = []
peak_rhos: List[float] = []
lines_args: List[Tuple[float, float]] = []

print(f'Number of peaks: {len(peaks)}')

for peak_fi in peaks:
    peak_fi = peak_fi[0]

    rho_i, theta_i = np.unravel_index(peak_fi, accumulator.shape)

    theta = thetas[theta_i]
    rho = rhos[rho_i]

    m = (- np.cos(theta)) / np.sin(theta)
    c = (rho / np.sin(theta))

    peak_thetas.append(theta_i)
    peak_rhos.append(rho_i)

    lines_args.append((m, c))

CMAP = 'gray'
print(f'Colormap: {CMAP}')

plt.imshow(canvas, cmap=CMAP)
for m, c in lines_args:
    plt.axline((0, c), slope=m, linestyle='-', color='blue')
plt.title('Canvas (Image Space)')
plt.tick_params(top=True, labeltop=True, bottom=False, labelbottom=False)

plt.figure()
plt.imshow(np.log(1 + accumulator),  cmap=CMAP, aspect=0.5)
plt.scatter(peak_thetas, peak_rhos)
plt.xlabel('Angle (degrees)')
plt.ylabel('Distance (pixels)')
plt.title('Accumulator (Parameter Space)')

plt.show()
