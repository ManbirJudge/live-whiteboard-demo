import json
import random

import matplotlib.pyplot as plt
import numpy as np
from skimage.draw import line as draw_line
from skimage.transform import hough_line, hough_line_peaks

from Utils import Stroke, PYPLOT_CMAPS

# constructing test canvas
canvas = np.zeros((300, 400))

with open(f'strokes/line_1.json') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))

for i, point in enumerate(stroke.points):
    if i == len(stroke) - 1:
        continue

    next_point = stroke.points[i + 1]
    canvas[draw_line(point.y, point.x, next_point.y, next_point.x)] = 255

# classic straight-line hough transform
tested_angles = np.linspace(
    start=-np.pi / 2,
    stop=np.pi / 2,
    num=360,
    endpoint=False
)
accumulator, angles, distances = hough_line(canvas, theta=tested_angles)

print(accumulator.shape)

# figures
CMAP = 'RdYlBu_r'

plt.imshow(canvas, cmap=CMAP)
plt.title('Canvas')
plt.axis('off')

# angle_step = .5 * np.diff(angles).mean()
# d_step = .5 * np.diff(distances).mean()
# bounds = [
#     np.rad2deg(angles[0] - angle_step),
#     np.rad2deg(angles[-1] + angle_step),
#     distances[-1] + d_step, distances[0] - d_step
# ]
# print(angle_step)
# print(d_step)
# print(bounds)

plt.figure()
plt.imshow(
    # np.log(1 + accumulator),
    accumulator,
    cmap=CMAP,
    # extent=bounds,
    aspect=0.1
)
plt.title('Hough Transform')
plt.xlabel('Angles (degrees)')
plt.ylabel('Distance (pixels)')

plt.figure()
plt.imshow(canvas, cmap=CMAP)
plt.title('Detected Lines')
plt.axis('off')
plt.ylim((canvas.shape[0], 0))

for _, angle, dist in zip(*hough_line_peaks(accumulator, angles, distances)):
    (x0, y0) = dist * np.array([np.cos(angle), np.sin(angle)])
    plt.axline((x0, y0), slope=np.tan(angle + np.pi / 2))

plt.show()
