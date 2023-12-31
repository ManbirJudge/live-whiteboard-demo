import json
import random

import matplotlib.pyplot as plt
import numpy as np
from skimage.draw import line as draw_line
from skimage.transform import hough_line, hough_line_peaks

from Utils import Stroke, PYPLOT_CMAPS

# constructing test canvas
canvas = np.zeros((800, 1400))

with open(f'strokes/line_1.json') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))

for i, point in enumerate(stroke.points):
    if i == len(stroke) - 1:
        continue

    next_point = stroke.points[i + 1]
    canvas[draw_line(point.y, point.x, next_point.y, next_point.x)] = 255

# classic straight-line hough transform
thetas = np.linspace(
    start=-np.pi / 2,
    stop=np.pi / 2,
    num=360,
    endpoint=False
)

accumulator, _, rhos = hough_line(canvas, theta=thetas)


# figures
CMAP = random.choice(PYPLOT_CMAPS)
print(f'Colormap: {CMAP}')

plt.imshow(canvas, cmap=CMAP)
plt.title('Canvas')
plt.axis('off')

plt.figure()
plt.imshow(
    np.log(1 + accumulator),  # easier to see than just accumulator
    cmap=CMAP,
    aspect=0.2
)
plt.title('Hough Transform')
plt.xlabel('Angles (degrees)')
plt.ylabel('Distance (pixels)')
cbar = plt.colorbar(label='Votes')
cbar.ax.set_yticklabels([])

plt.figure()
plt.imshow(canvas, cmap=CMAP)
plt.title('Detected Lines')
plt.axis('off')
plt.ylim((canvas.shape[0], 0))

peaks = zip(*hough_line_peaks(accumulator, thetas, rhos))

for _, angle, distance in peaks:
    x, y = distance * np.array([np.cos(angle), np.sin(angle)])
    plt.axline((x, y), slope=np.tan(angle + np.pi / 2))

plt.show()
