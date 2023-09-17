import json
import time

import cv2
import numpy as np

from Utils import Stroke
from my_hough import hough_py, hough_np, hough_numba

CANVAS_WIDTH = 400
CANVAS_HEIGHT = 300

with open('strokes/square.json', 'r') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))
    points = stroke.to_py()

canvas = np.ones(shape=(CANVAS_HEIGHT, CANVAS_WIDTH, 3), dtype=np.uint8) * 255
stroke.draw_cv(canvas)

edges = cv2.bitwise_not(
    cv2.threshold(
        cv2.cvtColor(
            canvas,
            cv2.COLOR_BGR2GRAY
        ),
        10,
        255,
        type=cv2.THRESH_BINARY
    )[1]
) / 255

py_start = time.time_ns()
thetas, rhos, accumulator = hough_py(edges)
py_end = time.time_ns()

np_start = time.time_ns()
thetas, rhos, accumulator = hough_np(edges)
np_end = time.time_ns()

numba_start = time.time_ns()
thetas, rhos, accumulator = hough_numba(edges)
numba_end = time.time_ns()

py_duration = py_end - py_start
np_duration = np_end - np_start
numba_duration = numba_end - numba_start

print(f'Pure Python implementation took: {(py_duration / 1e+9):.2f} s')
print(f'NumPy implementation took: {(np_duration / 1e+9):.2f} s')
print(f'Numba implementation took: {(numba_duration / 1e+9):.2f} s')
